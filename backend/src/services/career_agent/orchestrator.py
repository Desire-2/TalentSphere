"""CareerDocumentOrchestrator: the real generation pipeline.

Every stage the client displays is persisted before and after the actual work
it describes. Entitlement is reserved transactionally before processing and is
consumed only when the package reaches COMPLETED; failures release it.
"""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
import json
import logging
import os
import time
import uuid
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import and_, or_
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm.attributes import set_committed_value

from src.models.career_agent import (
    CareerAIUsageLog,
    CareerDocument,
    CareerDocumentPackage,
    CareerDocumentVersion,
    CareerExportRecord,
    CareerGenerationStage,
    CareerMatchAnalysis,
    CareerQualityReport,
    CareerTargetJob,
)
from src.models.user import User, db

from .candidate_matching import CandidateJobMatchingAgent, CandidateJobMatcher
from .document_generation import (
    CVContentAgent,
    CVStrategyAgent,
    CoverLetterGenerationService,
    FactualConsistencyService,
    HumanizationAgent,
    InlineWritingAssistant,
)
from .entitlements import CareerEntitlementService, GenerationEntitlementError
from .export import CareerDocumentRenderer, CareerDocumentRenderError
from .job_analysis import CareerTargetJobService, JobAnalysisAgent
from .memory import CareerContextService, CareerMemoryService, build_job_focus
from .nvidia_client import (
    AIProviderError,
    AIProviderNotConfigured,
    AIProviderUnavailable,
    AIRateLimited,
    NvidiaClient,
    NvidiaResult,
)
from .profile_intelligence import CareerProfileService
from .quality import ATSQualityService, FinalQAAgent
from .schemas import SchemaValidationError

STAGE_SEQUENCE = [
    ("profile_intelligence", "Reading your profile"),
    ("job_analysis", "Analyzing the job"),
    ("candidate_matching", "Selecting relevant experience"),
    ("cv_strategy", "Planning your CV"),
    ("cv_content", "Writing your CV"),
    ("cover_letter", "Creating cover letter"),
    ("humanization", "Refining the writing"),
    ("ats_validation", "Checking ATS compatibility"),
    ("final_qa", "Final quality review"),
    ("document_rendering", "Preparing document"),
]

TERMINAL_STATUSES = {"COMPLETED", "FAILED", "CANCELLED"}

# Transient provider failures are retried automatically at the package level so
# a short NVIDIA rate-limit window no longer turns into a user-facing failure.
# The retry resumes the pipeline from the first stage that did not finish (see
# _resume_states), so the wait only has to cover the stage that actually failed.
AUTO_RETRY_LIMIT = int(os.getenv("CAREER_AGENT_AUTO_RETRY_LIMIT", "2"))
AUTO_RETRY_BASE_DELAY = float(os.getenv("CAREER_AGENT_AUTO_RETRY_BASE_SECONDS", "15"))
AUTO_RETRY_MAX_DELAY = float(os.getenv("CAREER_AGENT_AUTO_RETRY_MAX_SECONDS", "90"))

logger = logging.getLogger(__name__)


class GenerationPipelineError(RuntimeError):
    """Raised for pipeline failures that should release the reservation."""

    def __init__(self, message: str, *, code: str = "GENERATION_FAILED"):
        super().__init__(message)
        self.code = code


class CareerDocumentOrchestrator:
    """Owns the package lifecycle from request to editable documents."""

    def __init__(self, client: NvidiaClient | None = None):
        self.client = client or NvidiaClient()
        self.profile_service = CareerProfileService()
        # The memory service deliberately holds the *same* profile service
        # instance so a rebuild reads the profile through this orchestrator.
        self.memory = CareerMemoryService(profile_service=self.profile_service)
        self.context = CareerContextService(self.memory)
        self.entitlements = CareerEntitlementService(self.profile_service)
        self.target_jobs = CareerTargetJobService(JobAnalysisAgent(self.client))
        self.matcher = CandidateJobMatcher(CandidateJobMatchingAgent(self.client))
        self.cv_strategy = CVStrategyAgent(self.client)
        self.cv_content = CVContentAgent(self.client)
        self.cover_letters = CoverLetterGenerationService(self.client)
        self.humanizer = HumanizationAgent(self.client)
        self.ats = ATSQualityService(self.client)
        self.final_qa = FinalQAAgent(self.client)
        self.renderer = CareerDocumentRenderer()
        self.assistant = InlineWritingAssistant(self.client)
        # Per-package artefacts produced by the current run. A transient retry
        # re-enters _run_stages from the top, and these entries let every stage
        # that already finished serve its result instead of calling (and
        # billing) the model again. Keyed by (package, lock token) because one
        # orchestrator instance serves concurrent generations and a stale
        # takeover must never inherit another worker's half-finished run.
        self._resume_states: Dict[Tuple[int, str], Dict[str, Any]] = {}

    # ------------------------------------------------------------------
    # Package creation and entitlement
    # ------------------------------------------------------------------
    def create_package(
        self,
        *,
        user: User,
        target_data: Dict[str, Any],
        idempotency_key: str,
        template_key: str | None = None,
        document_mode: str | None = None,
    ) -> Tuple[CareerDocumentPackage, Dict[str, Any]]:
        """Create or return an idempotent package with a reserved entitlement."""
        existing = CareerDocumentPackage.query.filter_by(idempotency_key=idempotency_key).first()
        if existing:
            if existing.user_id != user.id:
                raise PermissionError("This generation key belongs to another account.")
            return existing, self.entitlements.usage_summary(user.id)

        target = self.target_jobs.build_target(user, target_data)
        # Read the profile with the row lock once here: the reservation below
        # needs that lock, and taking it now saves a second lookup per request.
        career_profile = self.profile_service.get_or_create(user.id, lock=True)
        preferences = career_profile.get_document_preferences()
        package = CareerDocumentPackage(
            user_id=user.id,
            target_job_id=target.id,
            idempotency_key=idempotency_key,
            status="PENDING",
            requested_template_key=template_key or preferences.get("preferred_template_key") or career_profile.preferred_template_key or "modern_professional",
            requested_document_mode=document_mode or preferences.get("preferred_document_mode") or career_profile.preferred_document_mode or "ats_safe",
            language=career_profile.preferred_language or "en",
        )
        # Assigning the relationship keeps the target in memory for the
        # response instead of re-reading it by id one request later.
        package.target_job = target
        db.session.add(package)
        db.session.flush()

        # Fails inside the caller's transaction when not entitled; the per-user
        # row lock makes concurrent tabs/calls serialize instead of double-spend.
        self.entitlements.reserve(user=user, package=package, profile=career_profile)

        # Bulk-insert the stage rows: ten individual INSERTs would cost ten
        # round trips before generation has even started. The rows are handed
        # back to the package relationship so serializing the response does
        # not have to load them again.
        stage_rows = [
            CareerGenerationStage(
                package_id=package.id,
                stage_key=stage_key,
                display_name=display_name,
                status="QUEUED",
            )
            for stage_key, display_name in STAGE_SEQUENCE
        ]
        db.session.bulk_save_objects(stage_rows)
        set_committed_value(package, "stages", stage_rows)
        return package, self.entitlements.usage_summary(user.id)

    def execute_package(self, package_id: int) -> None:
        """Claim and run a package without blocking the HTTP request.

        Claiming is an atomic database update. This matters because a request
        thread, the recovery worker, and a second Gunicorn worker can all see
        the same PENDING package at nearly the same time.
        """
        app = self._app()
        with app.app_context():
            package, lock_token = self._claim_package(package_id)
            if not package:
                return

            try:
                self._run_with_transient_retry(package_id, lock_token)
            except (AIProviderError, AIProviderUnavailable, SchemaValidationError, GenerationPipelineError, SQLAlchemyError) as exc:
                db.session.rollback()
                package = CareerDocumentPackage.query.get(package_id)
                self._fail(package, exc, lock_token=lock_token)
            except Exception as exc:  # unexpected; still must not consume entitlement
                db.session.rollback()
                package = CareerDocumentPackage.query.get(package_id)
                self._fail(package, exc, lock_token=lock_token)

    def _claim_package(self, package_id: int):
        """Atomically claim PENDING or abandoned PROCESSING work."""
        now = datetime.utcnow()
        stale_before = now - timedelta(seconds=int(os.getenv("CAREER_AGENT_STALE_AFTER_SECONDS", "900")))
        lock_token = uuid.uuid4().hex
        updated = CareerDocumentPackage.query.filter(
            CareerDocumentPackage.id == package_id,
            or_(
                CareerDocumentPackage.status == "PENDING",
                and_(
                    CareerDocumentPackage.status == "PROCESSING",
                    CareerDocumentPackage.processing_started_at.isnot(None),
                    CareerDocumentPackage.processing_started_at < stale_before,
                ),
            ),
        ).update(
            {
                CareerDocumentPackage.status: "PROCESSING",
                CareerDocumentPackage.processing_lock_token: lock_token,
                CareerDocumentPackage.processing_started_at: now,
                CareerDocumentPackage.error_code: None,
                CareerDocumentPackage.error_message: None,
                CareerDocumentPackage.updated_at: now,
            },
            synchronize_session=False,
        )
        db.session.commit()
        if not updated:
            return None, None
        return CareerDocumentPackage.query.get(package_id), lock_token

    def _run_with_transient_retry(self, package_id: int, lock_token: str) -> None:
        """Run the pipeline, waiting out short AI-provider outages/rate limits.

        While waiting, the package stays PROCESSING with a visible progress
        note — the client's polling keeps rendering a live pipeline instead of
        a premature failure. The next attempt resumes from the first stage that
        did not finish, so only the failed stage is repeated. Only after the
        retry budget is exhausted does the error escalate to _fail (which
        releases the entitlement reservation).
        """
        app = self._app()
        attempts = 0
        # Stage artefacts from this attempt survive a transient failure so the
        # retry resumes from the stage that failed instead of re-running the
        # pipeline (and re-billing every earlier AI call) from stage one.
        self._resume_states.setdefault((package_id, lock_token), {})
        try:
            while True:
                with app.app_context():
                    package = CareerDocumentPackage.query.get(package_id)
                    if not package or package.status in TERMINAL_STATUSES:
                        return
                    if package.processing_lock_token != lock_token:
                        return  # lock was taken over by another worker
                    try:
                        self._run_stages(package, lock_token)
                        return
                    except (AIRateLimited, AIProviderUnavailable) as exc:
                        db.session.rollback()
                        if not getattr(exc, "retryable", True):
                            raise
                        attempts += 1
                        if attempts > AUTO_RETRY_LIMIT:
                            raise
                        is_rate_limit = isinstance(exc, AIRateLimited)
                        package.error_code = "AI_RATE_LIMITED" if is_rate_limit else "AI_PROVIDER_UNAVAILABLE"
                        package.error_message = (
                            f"The AI provider is temporarily {'rate limited' if is_rate_limit else 'unavailable'}; "
                            f"retrying automatically (attempt {attempts + 1} of {AUTO_RETRY_LIMIT + 1})."
                        )
                        db.session.commit()
                        delay = min(AUTO_RETRY_BASE_DELAY * (2 ** (attempts - 1)), AUTO_RETRY_MAX_DELAY)
                # Sleep WITHOUT holding a database connection from the pool.
                time.sleep(delay)
                with app.app_context():
                    package = CareerDocumentPackage.query.get(package_id)
                    if not package or package.status != "PROCESSING" or package.processing_lock_token != lock_token:
                        return  # superseded by a manual retry or lock takeover while waiting
        finally:
            self._resume_states.pop((package_id, lock_token), None)

    def retry_package(self, *, user: User, package_id: int) -> CareerDocumentPackage:
        package = self._owned_package(user, package_id)
        if package.status in {"FAILED", "PENDING", "CANCELLED"}:
            pass
        elif package.status in {"COMPLETED", "PROCESSING"}:
            raise ValueError("Only a failed or pending generation can be retried.")
        usage = package.usage
        if usage and usage.status == "CONSUMED":
            raise ValueError("This package already completed successfully.")
        package.status = "PENDING"
        package.error_code = None
        package.error_message = None
        package.retry_count = (package.retry_count or 0) + 1
        if usage and usage.status == "RELEASED":
            usage.status = "RESERVED"
            usage.released_at = None
            usage.release_reason = None
        db.session.commit()
        # The route starts the durable background worker after this method
        # returns. Never run the AI pipeline on the request thread.
        return package

    # ------------------------------------------------------------------
    # Pipeline stages
    # ------------------------------------------------------------------
    def _run_stages(self, package: CareerDocumentPackage, lock_token: str) -> None:
        user = User.query.get(package.user_id)
        if not user:
            raise GenerationPipelineError("The account no longer exists.", code="USER_MISSING")
        career_profile = self.profile_service.get_or_create(user.id)
        # Artefacts produced by this run. A transient retry re-enters here from
        # the top, and every stage that already succeeded serves its result from
        # this state instead of calling (and billing) the model a second time.
        state = self._resume_states.setdefault((package.id, lock_token), {})

        def check_lock():
            current = CareerDocumentPackage.query.get(package.id)
            if not current or current.processing_lock_token != lock_token:
                raise GenerationPipelineError("Generation lock lost.", code="LOCK_LOST")
            # Heartbeat at every stage boundary so a long but healthy provider
            # run is not mistaken for a crashed worker by the recovery loop.
            current.processing_started_at = datetime.utcnow()
            current.updated_at = datetime.utcnow()
            db.session.commit()

        # Stage: profile intelligence (reads the persisted career memory and
        # rebuilds it only when a profile change made it stale)
        with self._stage(package, "profile_intelligence", check_lock) as stage:
            if "candidate" not in state or "context" not in state:
                context = self.context.get_career_context(user.id, task="generation")
                state["candidate"] = context["candidate"]
                state["context"] = context
            candidate = state["candidate"]
            memory_meta = state["context"]["memory"]
            stage.metadata_json = json.dumps({
                "evidence_count": len(candidate["evidence_sources"]),
                "missing_information": candidate["missing_information"],
                "memory_profile_version": memory_meta["profile_version"],
                "memory_last_synced_at": memory_meta["last_synced_at"],
                "memory_stale": memory_meta["stale"],
                "memory_rebuilt": memory_meta["rebuilt"],
            })

        # Stage: job analysis (reads the memory's role/seniority slice so the
        # listing is interpreted in the candidate's context)
        with self._stage(package, "job_analysis", check_lock) as stage:
            if "job_analysis" not in state:
                focus = build_job_focus((state.get("context") or {}).get("candidate"))
                job_analysis, result = self.target_jobs.analyze_target(package.target_job, focus=focus or None)
                self._log_ai(package, user.id, "job_analysis", result)
                state["job_analysis"] = job_analysis
            job_analysis = state["job_analysis"]
            stage.metadata_json = json.dumps({"requirements": len(job_analysis["requirements"])})

        # Stage: candidate-job matching
        with self._stage(package, "candidate_matching", check_lock) as stage:
            if "match" not in state:
                match, match_result = self.matcher.analyze(candidate, job_analysis)
                self._log_ai(package, user.id, "candidate_matching", match_result)
                state["match"] = match
            match = state["match"]
            # Upsert: a transient-retry re-run of this stage must not create a
            # second row (package.match_analysis is a uselist=False relationship).
            match_row = CareerMatchAnalysis.query.filter_by(package_id=package.id).first()
            if not match_row:
                match_row = CareerMatchAnalysis(package_id=package.id)
                db.session.add(match_row)
            match_row.overall_score = match["scores"]["overall"]
            match_row.skills_score = match["scores"]["skills"]
            match_row.experience_score = match["scores"]["experience"]
            match_row.education_score = match["scores"]["education"]
            match_row.keyword_score = match["scores"]["keyword_coverage"]
            match_row.evidence_score = match["scores"]["evidence_strength"]
            match_row.analysis_json = json.dumps(match, ensure_ascii=False, default=str)
            stage.metadata_json = json.dumps({"overall_match": match["scores"]["overall"]})

        # Stage: CV strategy
        with self._stage(package, "cv_strategy", check_lock) as stage:
            if "strategy" not in state:
                strategy, strategy_result = self.cv_strategy.plan(
                    candidate, job_analysis, match,
                    {**career_profile.get_career_preferences(), **career_profile.get_document_preferences()},
                )
                self._log_ai(package, user.id, "cv_strategy", strategy_result)
                state["strategy"] = strategy
            strategy = state["strategy"]
            stage.metadata_json = json.dumps({"template": strategy["template_key"], "structure": strategy["structure"]})

        # Stage: CV content
        # These two provider calls are independent after strategy is ready.
        # Run them together so a slow cover letter does not serialize the CV.
        with self._stage(package, "cv_content", check_lock) as cv_stage, self._stage(package, "cover_letter", check_lock) as letter_stage:
            with ThreadPoolExecutor(max_workers=2, thread_name_prefix="career-agent-content") as pool:
                self._resolve_all(
                    [
                        (None if "cv_document" in state else pool.submit(self.cv_content.generate, candidate, job_analysis, strategy),
                         "cv_document", "cv_content"),
                        (None if "letter" in state else pool.submit(self.cover_letters.generate, candidate, job_analysis, strategy),
                         "letter", "cover_letter"),
                    ],
                    state=state, package=package, user_id=user.id,
                )
            cv_document = state["cv_document"][0]
            letter = state["letter"][0]
            cv_stage.metadata_json = json.dumps({"sections": len(cv_document["sections"])})

        # Stage: humanization (CV and letter in one provider pass each, bounded)
        with self._stage(package, "humanization", check_lock) as stage:
            def publish_progress():
                # Mid-stage heartbeat: the package keeps its lock alive and the
                # client sees the finished half instead of one 5 -> 100 jump
                # after both documents come back.
                stage.progress_percent = 60 if ("humanize_cv" in state and "humanize_letter" in state) else 30
                stage.metadata_json = json.dumps({
                    "cv_changes": len(state["humanize_cv"][1]) if "humanize_cv" in state else 0,
                    "letter_changes": len(state["humanize_letter"][1]) if "humanize_letter" in state else 0,
                })
                check_lock()

            with ThreadPoolExecutor(max_workers=2, thread_name_prefix="career-agent-humanize") as pool:
                self._resolve_all(
                    [
                        (None if "humanize_cv" in state else pool.submit(
                            self.humanizer.humanize,
                            cv_document,
                            document_type="CV",
                            candidate=candidate,
                            job_analysis=job_analysis,
                        ), "humanize_cv", "humanization_cv"),
                        (None if "humanize_letter" in state else pool.submit(
                            self.humanizer.humanize,
                            letter,
                            document_type="COVER_LETTER",
                            candidate=candidate,
                            job_analysis=job_analysis,
                        ), "humanize_letter", "humanization_cover_letter"),
                    ],
                    state=state, package=package, user_id=user.id,
                    on_settled=publish_progress,
                )
            cv_document, cv_changes, _ = state["humanize_cv"]
            letter, letter_changes, _ = state["humanize_letter"]
            stage.metadata_json = json.dumps({"cv_changes": len(cv_changes), "letter_changes": len(letter_changes)})

        # Stage: ATS validation
        # ATS review and final QA only read the generated documents, so they
        # can also run concurrently while preserving their separate records.
        with self._stage(package, "ats_validation", check_lock) as ats_stage, self._stage(package, "final_qa", check_lock) as qa_stage:
            with ThreadPoolExecutor(max_workers=2, thread_name_prefix="career-agent-review") as pool:
                self._resolve_all(
                    [
                        (None if "ats_review" in state else pool.submit(self.ats.review, cv_document, job_analysis, candidate),
                         "ats_review", "ats_validation"),
                        (None if "final_qa_review" in state else pool.submit(self.final_qa.review, cv_document, letter, job_analysis, candidate),
                         "final_qa_review", "final_qa"),
                    ],
                    state=state, package=package, user_id=user.id,
                )
            quality, _ats_result = state["ats_review"]
            final_report, _qa_result = state["final_qa_review"]
            # Upsert for the same transient-retry safety as the match analysis.
            report_row = CareerQualityReport.query.filter_by(package_id=package.id).first()
            if not report_row:
                report_row = CareerQualityReport(package_id=package.id)
                db.session.add(report_row)
            report_row.ats_score = quality["ats_readiness"]
            report_row.factual_status = final_report["factual_status"]
            report_row.human_writing_status = final_report["human_writing_status"]
            combined_report = {**quality, **final_report, "final_quality": final_report}
            report_row.report_json = json.dumps(combined_report, ensure_ascii=False, default=str)
            ats_stage.metadata_json = json.dumps({"ats_readiness": quality["ats_readiness"]})
            qa_stage.metadata_json = json.dumps({"checks": len(final_report.get("checks", [])) if isinstance(final_report, dict) else 0})

        # Stage: document rendering (persist editable documents + version 1)
        with self._stage(package, "document_rendering", check_lock) as stage:
            self._persist_documents(package, user, cv_document, letter, strategy)
            stage.metadata_json = json.dumps({"documents": ["CV", "COVER_LETTER"]})

        check_lock()
        package.status = "COMPLETED"
        package.completed_at = datetime.utcnow()
        # A transient-retry wait may have left a progress note behind.
        package.error_code = None
        package.error_message = None
        self.entitlements.consume(package.id)
        db.session.commit()
        self._notify_generation_result(package)

    def _persist_documents(self, package, user, cv_document, letter, strategy) -> None:
        existing_docs = {doc.document_type: doc for doc in package.documents.all()}
        title = f"{cv_document['header'].get('name') or user.get_full_name()} — {package.target_job.title}"
        for document_type, content in (("CV", cv_document), ("COVER_LETTER", letter)):
            document = existing_docs.get(document_type)
            if document and document.user_id != user.id:
                raise GenerationPipelineError("Document ownership mismatch.", code="OWNERSHIP_MISMATCH")
            settings = {
                "template_key": strategy.get("template_key") or package.requested_template_key,
                "document_mode": package.requested_document_mode,
                "accent_color": "#0F766E",
            }
            if not document:
                document = CareerDocument(
                    package_id=package.id,
                    user_id=user.id,
                    document_type=document_type,
                    title=title if document_type == "CV" else f"Cover Letter — {package.target_job.title}",
                )
                db.session.add(document)
                db.session.flush()
            document.working_content_json = json.dumps(content, ensure_ascii=False)
            document.working_settings_json = json.dumps(settings, ensure_ascii=False)
            document.template_key = settings["template_key"]
            document.document_mode = settings["document_mode"]
            document.status = "READY"
            document.current_version_number = (document.current_version_number or 0) + 1
            db.session.add(CareerDocumentVersion(
                document_id=document.id,
                version_number=document.current_version_number,
                content_json=json.dumps(content, ensure_ascii=False),
                settings_json=json.dumps(settings, ensure_ascii=False),
                change_source="GENERATION",
                change_note=f"Initial AI generation for target: {package.target_job.title}",
                created_by_user_id=user.id,
            ))

    def _fail(self, package: CareerDocumentPackage | None, exc: Exception, *, lock_token: str | None = None) -> None:
        if not package:
            return
        current = CareerDocumentPackage.query.get(package.id)
        if not current or (lock_token and current.processing_lock_token != lock_token):
            # A stale worker must never mark a newer worker's run as failed.
            return
        package = current
        package.status = "FAILED"
        package.failed_at = datetime.utcnow()
        package.error_code = getattr(exc, "code", "GENERATION_FAILED") or "GENERATION_FAILED"
        package.error_message = str(exc)[:500]
        stage_rows = CareerGenerationStage.query.filter_by(package_id=package.id).all()
        for row in stage_rows:
            if row.status in {"QUEUED", "PROCESSING"}:
                row.status = "FAILED"
        try:
            self.entitlements.release(package.id, f"Generation failed: {package.error_code}")
        except Exception:
            pass
        db.session.commit()
        self._notify_generation_result(current)

    def _notify_generation_result(self, package: CareerDocumentPackage) -> None:
        """Send the in-app + email completion/attention notification.

        Runs after the package transaction is committed so a notification
        failure can never roll the generation back. The email send happens on
        the background worker thread, not the user's HTTP request.
        """
        try:
            from src.services.email_service import (
                EmailPriority,
                NotificationType,
                email_service,
            )

            target_title = package.target_job.title if package.target_job else "your application package"
            completed = package.status == "COMPLETED"
            action_url = f"{email_service.frontend_url}/jobseeker/career-agent?package_id={package.id}"
            if completed:
                title = "Your CV and cover letter are ready"
                message = f"Your Career Agent package for {target_title} is ready to review and edit."
                action_text = "Review documents"
            else:
                title = "Your Career Agent documents need attention"
                message = f"Preparing your package for {target_title} didn't finish. You can retry from the Career Agent page."
                action_text = "View package"

            email_service.create_and_send_notification(
                user_id=package.user_id,
                notification_type=NotificationType.CAREER_AGENT,
                title=title,
                message=message,
                variables={
                    "notification_title": title,
                    "message": message,
                    "icon": "📄",
                    "notification_type": "Career Agent",
                    "action_url": action_url,
                    "action_text": action_text,
                    "package_id": package.id,
                    "status": package.status,
                },
                send_email=True,
                priority=EmailPriority.HIGH if not completed else EmailPriority.NORMAL,
            )
        except Exception:
            logger.exception("Failed to send Career Agent generation notification")

    # ------------------------------------------------------------------
    # Inline AI assistance on existing documents (never consumes entitlement)
    # ------------------------------------------------------------------
    def assist_document(
        self,
        *,
        user: User,
        document: CareerDocument,
        action: str,
        selected_text: str,
    ) -> Dict[str, Any]:
        package = document.package
        context = self.context.get_career_context(user.id, task="ai_assist")
        candidate = context["candidate"]
        job_analysis = package.target_job.get_analysis()
        allowed_citations = self._allowed_citations(document)
        suggestions, result = self.assistant.suggest(
            action=action,
            selected_text=selected_text,
            document=document.get_content(),
            candidate=candidate,
            job_analysis=job_analysis,
            allowed_citations=allowed_citations,
        )
        self._log_ai(package, user.id, f"assist_{document.document_type.lower()}", result)
        db.session.commit()
        return suggestions

    def _allowed_citations(self, document: CareerDocument) -> List[str]:
        """Citations must already exist in the document so edits stay source-backed."""
        citations = set()

        def walk(value):
            if isinstance(value, dict):
                ids = value.get("evidence_ids")
                if isinstance(ids, list):
                    citations.update(str(item) for item in ids)
                for child in value.values():
                    walk(child)
            elif isinstance(value, list):
                for child in value:
                    walk(child)

        walk(document.get_content())
        return sorted(citations)

    # ------------------------------------------------------------------
    # Exports (ownership verified by the route; never consumes entitlement)
    # ------------------------------------------------------------------
    def export_document(self, *, user: User, document: CareerDocument, format: str) -> Tuple[Any, CareerExportRecord]:
        content = document.get_content()
        settings = document.get_settings()
        rendered = self.renderer.render(
            document_type=document.document_type,
            content=content,
            settings=settings,
            title=document.title,
            format=format,
        )
        record = CareerExportRecord(
            document_id=document.id,
            user_id=user.id,
            format=format,
            version_number=document.current_version_number or 0,
            page_count=rendered.page_count,
            file_size=len(rendered.payload),
        )
        db.session.add(record)
        db.session.commit()
        return rendered, record

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------
    @staticmethod
    def _app():
        from flask import current_app
        return current_app._get_current_object()

    class _Stage:
        def __init__(self, orchestrator, package, stage_key, check_lock=None):
            self.orchestrator = orchestrator
            self.package = package
            self.stage_key = stage_key
            self.check_lock = check_lock
            self.row: Optional[CareerGenerationStage] = None

        def __enter__(self):
            self.row = CareerGenerationStage.query.filter_by(
                package_id=self.package.id, stage_key=self.stage_key,
            ).first()
            if not self.row:
                self.row = CareerGenerationStage(package_id=self.package.id, stage_key=self.stage_key, display_name=self.stage_key)
                db.session.add(self.row)
            self.row.status = "PROCESSING"
            self.row.started_at = datetime.utcnow()
            self.row.progress_percent = 5
            # One commit per stage boundary: the heartbeat update and the
            # PROCESSING row are persisted together, halving the number of
            # round trips on a remote database.
            if self.check_lock:
                self.check_lock()
            else:
                db.session.commit()
            return self.row

        def __exit__(self, exc_type, exc, tb):
            if self.row:
                if exc_type is None:
                    self.row.status = "SUCCESS"
                    self.row.progress_percent = 100
                else:
                    self.row.status = "FAILED"
                    self.row.error_code = getattr(exc, "code", "STAGE_FAILED") if exc else "STAGE_FAILED"
                self.row.completed_at = datetime.utcnow()
                self.row.latency_ms = int((self.row.completed_at - self.row.started_at).total_seconds() * 1000) if self.row.started_at else None
                db.session.add(self.row)
            if exc_type is None and self.check_lock:
                # Persist SUCCESS together with the post-stage heartbeat so a
                # recovery worker never mistakes this run for a stall.
                self.check_lock()
            elif exc_type is None:
                db.session.commit()
            return False

    def _stage(self, package, stage_key, check_lock=None):
        return self._Stage(self, package, stage_key, check_lock)

    def _resolve_all(
        self,
        jobs: List[Tuple[Any, str, Optional[str]]],
        *,
        state: Dict[str, Any],
        package: CareerDocumentPackage,
        user_id: int,
        on_settled=None,
    ) -> None:
        """Resolve every submitted job, then re-raise the first failure.

        Each finished job is stored (and its usage logged) before its sibling is
        awaited, so a failure on the cover letter never throws away the CV that
        already completed: the automatic retry resumes with only the missing
        half instead of re-running — and re-billing — the whole stage.
        ``on_settled`` runs after each success, which is how the long humanization
        stage publishes progress while its second document is still in flight.
        """
        failure: Optional[Exception] = None
        for future, state_key, usage_key in jobs:
            if future is None:
                continue
            try:
                outcome = future.result()
            except Exception as exc:  # re-raised once every job has settled
                if failure is None:
                    failure = exc
                continue
            state[state_key] = outcome
            if usage_key:
                self._log_ai(package, user_id, usage_key, outcome[-1])
            if on_settled:
                on_settled()
        if failure is not None:
            raise failure

    def _log_ai(self, package, user_id, stage_key, result: NvidiaResult) -> None:
        db.session.add(CareerAIUsageLog(
            package_id=package.id,
            user_id=user_id,
            stage_key=stage_key[:60],
            provider="nvidia",
            model=result.model,
            prompt_tokens=result.prompt_tokens,
            completion_tokens=result.completion_tokens,
            total_tokens=result.total_tokens,
            latency_ms=result.latency_ms,
            status="SUCCESS",
            retry_count=result.retry_count,
        ))

    def _owned_package(self, user: User, package_id: int) -> CareerDocumentPackage:
        package = CareerDocumentPackage.query.filter_by(id=package_id, user_id=user.id).first()
        if not package:
            raise PermissionError("Generation package not found for this account.")
        return package
