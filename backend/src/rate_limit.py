"""Dedicated rate limiter for authentication endpoints.

Separate Limiter instance so login/register/forgot-password limits can be
tuned via env (RATE_LIMIT_PER_MINUTE / RATE_LIMIT_PER_HOUR) without touching
the global or career-agent limiters. Uses the same storage fallback as the
career-agent limiter: Redis when reachable, memory otherwise.
"""

from __future__ import annotations

import os

from flask import jsonify, request
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address


def _limiter_storage_uri() -> str:
    """Prefer Redis when genuinely reachable; otherwise degrade to memory."""
    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        return "memory://"
    try:
        import redis as _redis

        client = _redis.from_url(redis_url, socket_timeout=1, socket_connect_timeout=1)
        client.ping()
        return redis_url
    except Exception:
        return "memory://"


def _auth_rate_limit_key() -> str:
    """Key auth limits per client address.

    Login attempts are keyed on the submitted email when available so one
    hostile client cannot lock every account behind a shared NAT address.
    """
    if request.path.endswith("/login") or request.path.endswith("/register"):
        payload = request.get_json(silent=True) or {}
        identifier = (payload.get("email") or "").strip().lower()
        if identifier:
            return f"auth_email_{identifier}"
    return get_remote_address()


def _on_breach(request_limit):  # noqa: ARG001 - flask-limiter callback signature
    """Return a JSON 429 body when any auth limit trips."""
    response = jsonify({
        "error": "Too many requests. Please try again later.",
        "code": "RATE_LIMIT_EXCEEDED",
    })
    response.status_code = 429
    return response


auth_limiter = Limiter(
    key_func=_auth_rate_limit_key,
    default_limits=[],
    storage_uri=_limiter_storage_uri(),
    on_breach=_on_breach,
    headers_enabled=True,
)


def auth_limits() -> str:
    """Combined per-minute and per-hour windows, evaluated per request so
    env changes apply without a code change. flask-limiter's LimitGroup
    parses ';' separated limit strings via limits.parse_many."""
    per_minute = os.getenv("RATE_LIMIT_PER_MINUTE", "10").strip() or "10"
    per_hour = os.getenv("RATE_LIMIT_PER_HOUR", "50").strip() or "50"
    return f"{per_minute} per minute;{per_hour} per hour"
