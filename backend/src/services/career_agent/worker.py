"""Durable, database-backed Career Agent generation recovery worker.

The HTTP request only creates a package. A short-lived worker thread starts
the work immediately, while this worker scans the database so a deployment or
Gunicorn worker restart does not strand PENDING packages forever.
"""

from __future__ import annotations

import logging
import os
import threading
from datetime import datetime, timedelta

from sqlalchemy.exc import OperationalError

from src.models.career_agent import CareerDocumentPackage
from src.models.user import db
from .orchestrator import CareerDocumentOrchestrator


logger = logging.getLogger(__name__)


class CareerAgentWorker:
    def __init__(self, app, *, poll_seconds: float | None = None):
        self.app = app
        # Request-launched work starts immediately. This loop is recovery
        # insurance, so an idle worker should not compete with status polling
        # for a database connection every few seconds.
        self.poll_seconds = poll_seconds or float(os.getenv("CAREER_AGENT_WORKER_POLL_SECONDS", "15"))
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None

    def start(self) -> bool:
        if self._thread and self._thread.is_alive():
            return False
        self._stop.clear()
        self._thread = threading.Thread(
            target=self._run,
            daemon=True,
            name="career-agent-recovery-worker",
        )
        self._thread.start()
        logger.info("Career Agent background worker started")
        return True

    def stop(self) -> None:
        self._stop.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=5)
        self._thread = None

    def _next_package_id(self) -> int | None:
        stale_before = datetime.utcnow() - timedelta(
            seconds=int(os.getenv("CAREER_AGENT_STALE_AFTER_SECONDS", "900"))
        )
        # Keep the hot path as two simple indexed lookups. The former OR
        # predicate made PostgreSQL scan/sort the queue even when a pending
        # package was available immediately.
        package_query = CareerDocumentPackage.query.with_entities(CareerDocumentPackage.id)
        package = (
            package_query
            .filter(CareerDocumentPackage.status == "PENDING")
            .order_by(CareerDocumentPackage.requested_at.asc(), CareerDocumentPackage.id.asc())
            .first()
        )
        if not package:
            package = (
                package_query
                .filter(
                    CareerDocumentPackage.status == "PROCESSING",
                    CareerDocumentPackage.processing_started_at.isnot(None),
                    CareerDocumentPackage.processing_started_at < stale_before,
                )
                .order_by(CareerDocumentPackage.processing_started_at.asc(), CareerDocumentPackage.id.asc())
                .first()
            )
        return package[0] if package else None

    def _run(self) -> None:
        # A fresh orchestrator gives this worker its own provider client and
        # avoids sharing request-scoped SQLAlchemy state across threads.
        orchestrator = CareerDocumentOrchestrator()
        while not self._stop.is_set():
            package_id = None
            try:
                with self.app.app_context():
                    try:
                        package_id = self._next_package_id()
                        if package_id is not None:
                            orchestrator.execute_package(package_id)
                    except OperationalError:
                        db.session.rollback()
                        logger.warning(
                            "Career Agent recovery check deferred because the database "
                            "is unavailable; retrying on the next poll"
                        )
                    except Exception:
                        # Roll back before removing the scoped session. Both
                        # operations must happen while the Flask application
                        # context is active; doing this in the outer except
                        # causes the recovery thread itself to crash.
                        db.session.rollback()
                        logger.exception("Career Agent background worker iteration failed")
                    finally:
                        db.session.remove()
            except Exception:
                # Context creation/teardown failures must not attempt to use
                # Flask-SQLAlchemy outside an application context.
                logger.exception("Career Agent background worker context failed")
            self._stop.wait(self.poll_seconds if package_id is None else 0.1)


def start_career_agent_worker(app) -> CareerAgentWorker:
    """Start one recovery worker in the current Gunicorn/Flask process."""
    worker = CareerAgentWorker(app)
    worker.start()
    return worker
