"""Small process-local TTL cache for hot read endpoints.

Redis is optional: when ``REDIS_URL`` is unset or unreachable the shared
``CacheManager`` disables itself, so endpoints that are polled every few
seconds fall straight through to the database. On a remote database each of
those round trips costs hundreds of milliseconds, which is what turns a
notification poll into a multi-second request.

This cache is deliberately tiny, bounded and thread-safe. Every write path
that mutates the underlying rows is expected to invalidate the affected keys,
and the TTL bounds staleness for writes that happen in another process.
"""

from __future__ import annotations

import threading
import time
from collections import OrderedDict
from typing import Any, Optional


class TTLCache:
    """A bounded, LRU-evicting cache whose entries expire after ``default_ttl``."""

    def __init__(self, *, name: str, max_entries: int = 512, default_ttl: float = 20.0):
        self.name = name
        self.max_entries = max(1, int(max_entries))
        self.default_ttl = float(default_ttl)
        self._lock = threading.Lock()
        self._data: "OrderedDict[str, tuple[float, Any]]" = OrderedDict()
        self.hits = 0
        self.misses = 0

    @staticmethod
    def _now() -> float:
        return time.monotonic()

    def get(self, key: str) -> Optional[Any]:
        """Return the cached value, or ``None`` when missing/expired."""
        now = self._now()
        with self._lock:
            entry = self._data.get(key)
            if entry is None:
                self.misses += 1
                return None
            expires_at, value = entry
            if expires_at <= now:
                self._data.pop(key, None)
                self.misses += 1
                return None
            self._data.move_to_end(key)
            self.hits += 1
            return value

    def set(self, key: str, value: Any, ttl: Optional[float] = None) -> None:
        expires_at = self._now() + (self.default_ttl if ttl is None else float(ttl))
        with self._lock:
            self._data.pop(key, None)
            self._data[key] = (expires_at, value)
            self._data.move_to_end(key)
            while len(self._data) > self.max_entries:
                self._data.popitem(last=False)

    def invalidate(self, prefix: str = "") -> int:
        """Drop every key that starts with ``prefix`` (empty prefix drops all)."""
        with self._lock:
            if not prefix:
                removed = len(self._data)
                self._data.clear()
                return removed
            stale = [key for key in self._data if key.startswith(prefix)]
            for key in stale:
                self._data.pop(key, None)
            return len(stale)

    def stats(self) -> dict:
        with self._lock:
            total = self.hits + self.misses
            return {
                'name': self.name,
                'entries': len(self._data),
                'hits': self.hits,
                'misses': self.misses,
                'hit_rate_percent': round(self.hits * 100 / total, 1) if total else 0.0,
            }
