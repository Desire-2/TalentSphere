"""Persistent, versioned career memory derived from the user's profile.

Why this exists
---------------
Generation used to re-scan ten profile tables and rewrite the evidence mirror
on every run (``CareerProfileService.candidate_profile(refresh=True)``). That
work is deterministic, so it is done once, stored in ``career_memories``, and
re-read from there. The stored memory is only rebuilt when it is *stale*:

* ``profile_version`` is the authoritative counter. Every profile write calls
  :func:`notify_profile_changed`, which bumps it.
* ``source_fingerprint`` is a second, passive signal: the evidence sync writes
  the fingerprint of the current profile rows, so an edit no hook observed is
  still detected the next time the evidence mirror is refreshed.

The rebuild is a full deterministic rebuild (spec §7): a partial update would
be faster but could leave a deleted job title or a removed skill behind, and
correctness beats a few milliseconds here.
"""

from __future__ import annotations

from datetime import datetime
import json
import logging
from typing import Any, Dict, Optional, Tuple

from src.models.career_agent import CareerMemory, CareerProfile
from src.models.user import User, db

from .profile_intelligence import CareerProfileService

logger = logging.getLogger(__name__)

# Bump when the stored shape changes in a way old rows cannot satisfy.
MEMORY_SCHEMA_VERSION = 1


class MemorySyncError(RuntimeError):
    """The rebuilt memory could not be persisted.

    Carries the candidate that was successfully built so a caller can still
    finish its work with fresh facts instead of failing the whole request.
    """

    def __init__(self, message: str, *, candidate: Optional[Dict[str, Any]] = None, profile_version: Optional[int] = None):
        super().__init__(message)
        self.candidate = candidate
        self.profile_version = profile_version


def _iso(value) -> Optional[str]:
    if not value:
        return None
    return value.isoformat() if hasattr(value, "isoformat") else str(value)


class CareerMemoryService:
    """Reads, versions, and rebuilds the persisted career memory."""

    def __init__(self, profile_service: CareerProfileService | None = None):
        self.profile_service = profile_service or CareerProfileService()

    # ------------------------------------------------------------------
    # Rows and version counters
    # ------------------------------------------------------------------
    @staticmethod
    def get_row(user_id: int) -> Optional[CareerMemory]:
        return CareerMemory.query.filter_by(user_id=user_id).first()

    @staticmethod
    def _source_fingerprint(user_id: int) -> Optional[str]:
        row = CareerProfile.query.filter_by(user_id=user_id).first()
        return row.last_source_fingerprint if row else None

    def mark_profile_changed(self, user_id: int) -> int:
        """Bump the authoritative version counter. Cheap, no rebuild, no commit.

        The caller is responsible for committing: inside a route this runs
        before the route's own ``db.session.commit()``; the after-request hooks
        commit explicitly. No flush happens here, so the bump joins the caller's
        existing transaction and can never half-commit on its own.
        """
        if not user_id:
            return 0
        row = self.get_row(user_id)
        if row is None:
            row = CareerMemory(
                user_id=user_id,
                profile_version=1,
                synced_version=-1,
                sync_error="Profile changed before the first memory sync.",
            )
            db.session.add(row)
        else:
            row.profile_version = (row.profile_version or 0) + 1
            row.updated_at = datetime.utcnow()
        return row.profile_version

    def _ensure_row(self, user_id: int) -> CareerMemory:
        row = self.get_row(user_id)
        if row is None:
            row = CareerMemory(user_id=user_id, profile_version=0, synced_version=-1)
            db.session.add(row)
        return row

    def is_stale(self, user_id: int) -> bool:
        row = self.get_row(user_id)
        if row is None:
            return True
        return row.is_stale(self._source_fingerprint(user_id))

    # ------------------------------------------------------------------
    # Building
    # ------------------------------------------------------------------
    def build_memory(self, user: User, *, candidate: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Pure builder: profile rows + evidence in, one memory document out.

        ``candidate`` may be supplied by a caller that already paid for a
        ``readiness`` scan so the profile tables are not read twice.
        """
        if candidate is None:
            candidate = self.profile_service.candidate_profile(user)
        fingerprint = self._source_fingerprint(user.id)
        categories: Dict[str, int] = {}
        verified = 0
        for record in candidate.get("evidence_sources") or []:
            category = record.get("category") or "other"
            categories[category] = categories.get(category, 0) + 1
            provenance = record.get("provenance") or {}
            if provenance.get("verified"):
                verified += 1
        return {
            "schema_version": MEMORY_SCHEMA_VERSION,
            "built_at": datetime.utcnow().isoformat(),
            "candidate": candidate,
            # Reserved for AI-derived career insights. Nothing writes here yet,
            # so every fact served to a model is profile- or import-derived.
            "generated_insights": [],
            "provenance": {
                "source": "career_memory",
                "derived_from": "profile",
                "verified": True,
            },
            "summary": {
                "evidence_count": len(candidate.get("evidence_sources") or []),
                "verified_evidence_count": verified,
                "categories": categories,
                "missing_information": candidate.get("missing_information", []),
            },
            "source_fingerprint": fingerprint,
        }

    # ------------------------------------------------------------------
    # Sync
    # ------------------------------------------------------------------
    def sync(self, user: User, *, candidate: Optional[Dict[str, Any]] = None, force: bool = False) -> Dict[str, Any]:
        """Rebuild and persist the memory when it is stale. Never commits."""
        row = self._ensure_row(user.id)
        current_fingerprint = self._source_fingerprint(user.id)
        already_built = isinstance(row.get_memory().get("candidate"), dict)
        if not force and candidate is None and already_built and not row.is_stale(current_fingerprint):
            return self._meta(row, rebuilt=False)

        # Capture the version *before* reading the profile: an edit that lands
        # mid-build must leave the row stale so the next read rebuilds.
        version_at_start = row.profile_version or 0
        memory = self.build_memory(user, candidate=candidate)
        try:
            row.memory_json = json.dumps(memory, ensure_ascii=False, default=str)
            row.source_fingerprint = memory.get("source_fingerprint")
            row.synced_version = version_at_start
            row.last_synced_at = datetime.utcnow()
            row.sync_error = None
            row.updated_at = datetime.utcnow()
            db.session.flush()
        except Exception as exc:  # noqa: BLE001 - any failure must degrade, not 500
            db.session.rollback()
            self._record_sync_error(user_id=user.id, message=str(exc), profile_version=version_at_start)
            raise MemorySyncError(
                f"Career memory could not be saved: {exc}",
                candidate=memory.get("candidate"),
                profile_version=version_at_start,
            ) from exc
        return self._meta(row, rebuilt=True)

    def _record_sync_error(self, *, user_id: int, message: str, profile_version: Optional[int]) -> None:
        """Persist why a sync failed without letting it break the caller."""
        try:
            row = self.get_row(user_id)
            if row is None:
                row = CareerMemory(user_id=user_id, profile_version=profile_version or 0, synced_version=-1)
                db.session.add(row)
            row.sync_error = message[:500]
            row.updated_at = datetime.utcnow()
            db.session.flush()
        except Exception:  # noqa: BLE001
            logger.exception("Could not record career memory sync failure for user %s", user_id)
            db.session.rollback()

    # ------------------------------------------------------------------
    # Reading
    # ------------------------------------------------------------------
    def get_candidate(self, user_id: int, *, allow_sync: bool = True) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """Return ``(candidate, memory_meta)``.

        A fresh memory is served with two indexed queries and no profile scan.
        A stale one is rebuilt when ``allow_sync`` is true; otherwise the last
        stored candidate is served as-is so a read-only path never mutates the
        database.
        """
        row = self.get_row(user_id)
        current_fingerprint = self._source_fingerprint(user_id)
        if row is not None and not row.is_stale(current_fingerprint):
            candidate = (row.get_memory() or {}).get("candidate")
            if isinstance(candidate, dict):
                return candidate, self._meta(row, rebuilt=False)

        if not allow_sync:
            if row is not None:
                candidate = (row.get_memory() or {}).get("candidate")
                if isinstance(candidate, dict):
                    return candidate, self._meta(row, rebuilt=False, stale=True)
            raise ValueError("Career memory has not been built for this account yet.")

        user = User.query.get(user_id)
        if not user:
            raise ValueError("Account not found.")

        try:
            self.sync(user)
        except MemorySyncError as exc:
            candidate = exc.candidate
            if not isinstance(candidate, dict):
                # The rebuild itself failed; one more direct profile build so
                # the caller still receives real facts.
                candidate = self.profile_service.candidate_profile(user)
            meta = {
                "profile_version": exc.profile_version or 0,
                "synced_version": None,
                "stale": True,
                "rebuilt": False,
                "persisted": False,
                "last_synced_at": None,
                "source_fingerprint": None,
                "sync_error": str(exc)[:500],
            }
            return candidate, meta

        row = self.get_row(user_id)
        if row is None:  # pragma: no cover - sync always creates the row
            raise ValueError("Career memory could not be created.")
        candidate = (row.get_memory() or {}).get("candidate")
        if not isinstance(candidate, dict):  # pragma: no cover - defensive
            raise ValueError("Career memory is empty for this account.")
        return candidate, self._meta(row, rebuilt=True)

    def _meta(self, row: CareerMemory, *, rebuilt: bool, stale: bool | None = None) -> Dict[str, Any]:
        return {
            "profile_version": row.profile_version or 0,
            "synced_version": row.synced_version,
            "stale": row.version_stale if stale is None else stale,
            "rebuilt": rebuilt,
            "persisted": True,
            "last_synced_at": _iso(row.last_synced_at),
            "source_fingerprint": row.source_fingerprint,
            "sync_error": row.sync_error,
        }


class CareerContextService:
    """The single entry point every generation path uses to read career memory.

    Carries the task name so a reviewer can see which agent consumed the
    context, and so the memory provenance travels with the candidate instead
    of being re-derived by each prompt.
    """

    def __init__(self, memory_service: CareerMemoryService | None = None):
        self.memory_service = memory_service or CareerMemoryService()

    def get_career_context(
        self,
        user_id: int,
        *,
        task: str = "generation",
        allow_sync: bool = True,
    ) -> Dict[str, Any]:
        candidate, memory_meta = self.memory_service.get_candidate(user_id, allow_sync=allow_sync)
        return {
            "task": task,
            "candidate": candidate,
            "memory": memory_meta,
            "provenance": {
                "source": "career_memory",
                "verified": bool(memory_meta.get("persisted", False)),
                "memory_stale": bool(memory_meta.get("stale", True)),
                "last_synced_at": memory_meta.get("last_synced_at"),
            },
        }


def build_job_focus(candidate: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Narrow memory slice handed to job analysis: role and seniority only.

    Deliberately excludes skills, employers, and history so a model cannot
    leak candidate facts into the job's own requirements or ATS terms.
    """
    if not isinstance(candidate, dict):
        return {}
    professional = candidate.get("professional_identity") or {}
    if not isinstance(professional, dict):
        return {}
    wanted = ("professional_title", "desired_position", "years_of_experience")
    return {
        key: professional[key]
        for key in wanted
        if professional.get(key) not in (None, "", [], {})
    }


def notify_profile_changed(user_id: Optional[int]) -> None:
    """Profile-write hook: bump the memory version without touching memory_json.

    Never raises: a memory bookkeeping failure must not roll back the profile
    the user just saved. The caller commits (routes) or the hook wrapper does
    (after-request hooks). Deliberately no ``rollback()`` here — rolling back
    inside a route would discard the profile changes it is about to commit.
    """
    if not user_id:
        return
    try:
        CareerMemoryService().mark_profile_changed(user_id)
    except Exception:  # noqa: BLE001
        logger.exception("Could not mark career memory stale for user %s", user_id)


def mark_profile_changed_and_commit(user_id: Optional[int]) -> None:
    """Variant for after-request hooks, where the route already committed."""
    if not user_id:
        return
    notify_profile_changed(user_id)
    try:
        db.session.commit()
    except Exception:  # noqa: BLE001
        logger.exception("Could not persist career memory version for user %s", user_id)
        try:
            db.session.rollback()
        except Exception:  # noqa: BLE001
            pass
