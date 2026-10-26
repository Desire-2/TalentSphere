"""AfriTech AI Career Agent API.

All endpoints are authenticated and ownership-checked. Generation entitlement
is enforced server-side; editing and exporting never consume a generation.
"""

from __future__ import annotations

import io
import json
import os
import threading

from flask import Blueprint, current_app, jsonify, request, send_file
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import contains_eager, joinedload, selectinload
from werkzeug.exceptions import HTTPException

from src.models.career_agent import (
    CareerAIUsageLog,
    CareerApplicationDocument,
    CareerEvidence,
    CareerDocument,
    CareerDocumentPackage,
    CareerDocumentVersion,
    CareerExportRecord,
    CareerGenerationStage,
    CareerGenerationUsage,
    CareerPaymentTransaction,
    CareerTargetJob,
    ImportedCareerDocument,
)
from src.models.user import User, db
from src.routes.auth import role_required, token_required
from src.services.career_agent.document_extraction import (
    CareerDocumentExtractionError,
    CareerExtractionService,
    PrivateCareerFileStore,
    UnsupportedCareerDocument,
    find_profile_conflicts,
)
from src.services.career_agent.entitlements import (
    CareerPlanService,
    GenerationEntitlementError,
)
from src.services.career_agent.export import CareerDocumentRenderError
from src.services.career_agent.job_analysis import CareerTargetJobService, JobAnalysisAgent
from src.services.career_agent.memory import CareerMemoryService, notify_profile_changed
from src.services.career_agent.orchestrator import CareerDocumentOrchestrator
from src.services.career_agent.payments import CareerPaymentError, CareerPaymentService
from src.services.career_agent.profile_intelligence import CareerProfileService
from src.services.career_agent.nvidia_client import AIProviderError, AIProviderUnavailable, AIRateLimited
from src.services.career_agent.schemas import SchemaValidationError, clean_list, clean_text, json_object

career_agent_bp = Blueprint("career_agent", __name__, url_prefix="/api/career-agent")

# ── Per-user rate limiter ──────────────────────────────────────────────────────
# AI-costing and document endpoints are limited per account, not per IP, so a
# shared office address cannot lock everyone out. Redis storage is used when
# available; otherwise the limiter degrades to in-process memory.
def _career_rate_limit_key():
    """Use the authenticated user id when present; fall back to remote address."""
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    if token:
        try:
            import jwt as pyjwt

            secret = current_app.config["SECRET_KEY"]
            payload = pyjwt.decode(token, secret, algorithms=["HS256"])
            user_id = payload.get("user_id")
            if user_id:
                return f"career_user_{user_id}"
        except Exception:
            pass
    return get_remote_address()


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


limiter = Limiter(
    key_func=_career_rate_limit_key,
    default_limits=[],
    storage_uri=_limiter_storage_uri(),
)


@career_agent_bp.errorhandler(429)
def _career_rate_limit_handler(error):
    retry_after = getattr(error, "retry_after", None)
    return jsonify({
        "error": "Too many Career Agent requests. Please wait before retrying.",
        "code": "RATE_LIMITED",
        "retry_after_seconds": int(retry_after) if retry_after else 60,
    }), 429


@career_agent_bp.errorhandler(SQLAlchemyError)
def _career_database_error(error):
    """Keep transient database failures actionable and JSON-shaped for the SPA."""
    db.session.rollback()
    current_app.logger.exception("Career Agent database request failed", exc_info=error)
    return _error("Career Agent is temporarily unavailable. Please try again.", 503, "DATABASE_UNAVAILABLE")


@career_agent_bp.errorhandler(Exception)
def _career_unhandled_error(error):
    """Prevent HTML Flask 500 pages from breaking the Career Agent client."""
    if isinstance(error, HTTPException):
        return error
    db.session.rollback()
    current_app.logger.exception("Unhandled Career Agent request failure", exc_info=error)
    return _error("The Career Agent could not complete that request. Please try again.", 500, "CAREER_AGENT_ERROR")


# Cost-tiered limits: generation is the expensive multi-agent pipeline;
# analysis and assists are single provider calls; imports/exports are local.
GENERATE_LIMITS = "5 per hour; 20 per day"
ANALYZE_LIMITS = "20 per hour; 60 per day"
ASSIST_LIMITS = "30 per hour; 120 per day"
IMPORT_LIMITS = "10 per hour; 40 per day"
EXPORT_LIMITS = "30 per hour; 120 per day"

extraction_service = CareerExtractionService()
file_store = PrivateCareerFileStore()
profile_service = CareerProfileService()
memory_service = CareerMemoryService(profile_service=profile_service)
orchestrator = CareerDocumentOrchestrator()
payment_service = CareerPaymentService()
target_job_service = CareerTargetJobService()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _body() -> dict:
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def _error(message: str, status: int, code: str | None = None, **extra):
    payload = {"error": message}
    if code:
        payload["code"] = code
    payload.update(extra)
    return jsonify(payload), status


def _owned_document(user: User, document_id: int) -> CareerDocument | None:
    return CareerDocument.query.filter_by(id=document_id, user_id=user.id).first()


def _owned_package(user: User, package_id: int) -> CareerDocumentPackage | None:
    return CareerDocumentPackage.query.filter_by(id=package_id, user_id=user.id).first()


def _start_generation_thread(package_id: int) -> None:
    app = current_app._get_current_object()

    def runner():
        try:
            with app.app_context():
                orchestrator.execute_package(package_id)
        finally:
            # Request-launched generation runs in a separate thread. Release
            # its scoped SQLAlchemy session before the app context is removed.
            with app.app_context():
                db.session.remove()

    threading.Thread(target=runner, daemon=True, name=f"career-agent-package-{package_id}").start()


# ---------------------------------------------------------------------------
# Profile intelligence
# ---------------------------------------------------------------------------
@career_agent_bp.route("/profile", methods=["GET"])
@token_required
@role_required("job_seeker", "admin")
def get_career_profile(current_user):
    try:
        readiness = profile_service.readiness(current_user)
        # Readiness synchronizes the user's current profile into the Career
        # Agent evidence tables, so this GET intentionally commits that sync.
        # The freshly scanned candidate is handed straight to the memory
        # builder so the profile tables are not read a second time.
        try:
            readiness["memory"] = memory_service.sync(current_user, candidate=readiness["candidate"])
        except Exception as sync_exc:  # memory must never break the readiness view
            db.session.rollback()
            current_app.logger.warning("Career memory sync failed: %s", sync_exc)
            readiness["memory"] = {
                "profile_version": None,
                "synced_version": None,
                "stale": True,
                "rebuilt": False,
                "persisted": False,
                "last_synced_at": None,
                "sync_error": str(sync_exc)[:500],
            }
        db.session.commit()
        return jsonify(readiness), 200
    except SQLAlchemyError:
        db.session.rollback()
        current_app.logger.exception("Failed to load Career Agent profile from the database")
        return _error("Career profile is temporarily unavailable. Please try again.", 503, "DATABASE_UNAVAILABLE")
    except Exception as exc:
        db.session.rollback()
        current_app.logger.exception("Failed to load Career Agent profile")
        return _error("Failed to load your career profile. Please try again.", 500, "CAREER_PROFILE_ERROR")


@career_agent_bp.route("/profile/preferences", methods=["PUT"])
@token_required
@role_required("job_seeker", "admin")
def update_career_preferences(current_user):
    try:
        profile = profile_service.update_preferences(current_user, _body())
        notify_profile_changed(current_user.id)
        db.session.commit()
        return jsonify(profile.to_dict()), 200
    except SQLAlchemyError:
        db.session.rollback()
        current_app.logger.exception("Failed to save Career Agent preferences to the database")
        return _error("Career preferences are temporarily unavailable. Please try again.", 503, "DATABASE_UNAVAILABLE")
    except Exception as exc:
        db.session.rollback()
        current_app.logger.exception("Failed to save Career Agent preferences")
        return _error("Failed to save your career preferences. Please try again.", 500, "CAREER_PREFERENCES_ERROR")

@career_agent_bp.route("/evidence/<evidence_id>", methods=["DELETE"])
@token_required
@role_required("job_seeker", "admin")
def delete_career_evidence(current_user, evidence_id: str):
    try:
        numeric_id = int(evidence_id.removeprefix("ev_")) if evidence_id.startswith("ev_") else int(evidence_id)
    except ValueError:
        return _error("Evidence ID must be numeric.", 400)
    evidence = CareerEvidence.query.filter_by(
        id=numeric_id,
        user_id=current_user.id,
        source_type="user_confirmation",
        is_current=True,
    ).first()
    if not evidence:
        return _error("Imported evidence not found.", 404)
    evidence.is_current = False
    evidence.is_verified = False
    notify_profile_changed(current_user.id)
    db.session.commit()
    return jsonify({"deleted": True, "evidence_id": f"ev_{evidence.id}"}), 200


# ---------------------------------------------------------------------------
# Document import (local extraction; NVIDIA only for weak image OCR)
# ---------------------------------------------------------------------------
@career_agent_bp.route("/documents/import", methods=["POST"])
@limiter.limit(IMPORT_LIMITS)
@token_required
@role_required("job_seeker", "admin")
def import_career_document(current_user):
    uploaded = request.files.get("file")
    if not uploaded:
        return _error("Attach a document file to import.", 400, "FILE_REQUIRED")
    allow_ai_images = str(request.form.get("allow_image_analysis", "true")).lower() != "false"
    payload = uploaded.read()
    try:
        result = extraction_service.extract_upload(
            filename=uploaded.filename or "document",
            payload=payload,
            claimed_mime=uploaded.mimetype,
            allow_image_analysis=allow_ai_images,
        )
    except UnsupportedCareerDocument as exc:
        return _error(str(exc), 400, "UNSUPPORTED_DOCUMENT")
    except CareerDocumentExtractionError as exc:
        return _error(str(exc), 422, "EXTRACTION_FAILED")
    except AIRateLimited:
        return _error("The document analysis provider is rate limited. Please retry in a few minutes.", 429, "AI_RATE_LIMITED")
    except (AIProviderError, AIProviderUnavailable):
        return _error("The document could not be analyzed right now. Please retry.", 503, "AI_UNAVAILABLE")

    storage_key = f"discarded:{current_user.id}:{result.content_hash}"
    imported = ImportedCareerDocument(
        user_id=current_user.id,
        filename=result.filename,
        content_type=result.content_type,
        file_size=len(result.raw_bytes),
        content_hash=result.content_hash,
        private_storage_key=storage_key,
        extraction_status="COMPLETED",
        extraction_method=result.method,
        extracted_text=result.extracted_text,
        extracted_data_json=json.dumps(result.extracted_data, ensure_ascii=False),
    )
    db.session.add(imported)
    db.session.flush()

    if result.image_analysis_result is not None:
        ai_result = result.image_analysis_result
        db.session.add(CareerAIUsageLog(
            package_id=None,
            user_id=current_user.id,
            stage_key="image_analysis",
            provider="nvidia",
            model=ai_result.model,
            prompt_tokens=ai_result.prompt_tokens,
            completion_tokens=ai_result.completion_tokens,
            total_tokens=ai_result.total_tokens,
            latency_ms=ai_result.latency_ms,
            status="SUCCESS",
            retry_count=ai_result.retry_count,
        ))

    candidate = profile_service.candidate_profile(current_user, refresh=False)
    conflicts = find_profile_conflicts(result.extracted_data, candidate)
    imported.conflicts_json = json.dumps(conflicts, ensure_ascii=False)
    db.session.commit()
    return jsonify(imported.to_dict(include_text=False)), 201


@career_agent_bp.route("/documents/imports", methods=["GET"])
@token_required
@role_required("job_seeker", "admin")
def list_imported_documents(current_user):
    rows = ImportedCareerDocument.query.filter_by(
        user_id=current_user.id, deleted_at=None,
    ).order_by(ImportedCareerDocument.created_at.desc()).limit(50).all()
    return jsonify([row.to_dict() for row in rows]), 200


@career_agent_bp.route("/documents/imports/<int:import_id>", methods=["GET"])
@token_required
@role_required("job_seeker", "admin")
def get_imported_document(current_user, import_id: int):
    row = ImportedCareerDocument.query.filter_by(id=import_id, user_id=current_user.id, deleted_at=None).first()
    if not row:
        return _error("Imported document not found.", 404)
    return jsonify(row.to_dict(include_text=True)), 200


@career_agent_bp.route("/documents/imports/<int:import_id>/confirm", methods=["POST"])
@token_required
@role_required("job_seeker", "admin")
def confirm_imported_document(current_user, import_id: int):
    row = ImportedCareerDocument.query.filter_by(id=import_id, user_id=current_user.id, deleted_at=None).first()
    if not row:
        return _error("Imported document not found.", 404)
    selected = _body().get("categories")
    if selected is not None and not isinstance(selected, list):
        return _error("categories must be a list of section names.", 400)
    created = profile_service.confirm_import(current_user, row, selected)
    notify_profile_changed(current_user.id)
    db.session.commit()
    return jsonify({"confirmed": True, "evidence_created": created}), 200


@career_agent_bp.route("/documents/imports/<int:import_id>", methods=["DELETE"])
@token_required
@role_required("job_seeker", "admin")
def delete_imported_document(current_user, import_id: int):
    row = ImportedCareerDocument.query.filter_by(id=import_id, user_id=current_user.id, deleted_at=None).first()
    if not row:
        return _error("Imported document not found.", 404)
    file_store.delete(row.private_storage_key)
    row.deleted_at = db.func.now()
    row.extraction_status = "DELETED"
    row.extracted_text = None
    row.extracted_data_json = "{}"
    db.session.commit()
    return jsonify({"deleted": True}), 200


# ---------------------------------------------------------------------------
# Job analysis (no generation, no entitlement)
# ---------------------------------------------------------------------------
@career_agent_bp.route("/analyze-job", methods=["POST"])
@limiter.limit(ANALYZE_LIMITS)
@token_required
@role_required("job_seeker", "admin")
def analyze_job(current_user):
    data = _body()
    # Guard the provider budget: an effectively empty target has nothing to
    # analyze, and sending it to the AI provider wastes tokens and latency.
    raw_target = data.get("target_job") if isinstance(data.get("target_job"), dict) else data
    description = clean_text(raw_target.get("description"), maximum=24000)
    has_skills = bool(clean_list(raw_target.get("required_skills") or raw_target.get("requiredSkills"), maximum_items=50))
    platform_ref = data.get("platform_job_id") or data.get("job_id")
    if not platform_ref and not description and not has_skills:
        return _error(
            "Provide the job description (or at least a title with required skills) to analyze.",
            400,
            "JOB_PAYLOAD_EMPTY",
        )
    try:
        if data.get("platform_job_id") or data.get("job_id"):
            from src.models.job import Job

            job = Job.query.filter_by(id=int(data.get("platform_job_id") or data.get("job_id")), is_active=True).first()
            if not job:
                return _error("The selected AfriTech opportunity is not available.", 404)
            snapshot = target_job_service.platform_snapshot(job)
        else:
            snapshot = target_job_service.custom_snapshot(data.get("target_job") if isinstance(data.get("target_job"), dict) else data)
        analysis, usage = JobAnalysisAgent().analyze(snapshot, focus=_job_focus(current_user.id))
        db.session.add(_ai_log(current_user.id, "analyze_job", usage))
        db.session.commit()
        return jsonify({"snapshot_title": snapshot["title"], "analysis": analysis}), 200
    except AIRateLimited:
        db.session.rollback()
        return _error("The job analysis provider is rate limited. Please retry in a few minutes.", 429, "AI_RATE_LIMITED")
    except (AIProviderError, AIProviderUnavailable):
        db.session.rollback()
        return _error("The job could not be analyzed right now. Please retry.", 503, "AI_UNAVAILABLE")
    except (TypeError, ValueError) as exc:
        db.session.rollback()
        return _error(f"Invalid job payload: {exc}", 400)


def _job_focus(user_id: int):
    """Role/seniority slice from career memory; never blocks a job analysis."""
    from src.services.career_agent.memory import build_job_focus

    try:
        candidate, _meta = memory_service.get_candidate(user_id)
        return build_job_focus(candidate) or None
    except Exception as exc:  # noqa: BLE001
        db.session.rollback()
        current_app.logger.warning("Career memory unavailable for job analysis: %s", exc)
        return None


def _ai_log(user_id: int, stage_key: str, usage):
    from src.models.career_agent import CareerAIUsageLog as Log
    return Log(
        package_id=None,
        user_id=user_id,
        stage_key=stage_key[:60],
        provider="nvidia",
        model=usage.model,
        prompt_tokens=usage.prompt_tokens,
        completion_tokens=usage.completion_tokens,
        total_tokens=usage.total_tokens,
        latency_ms=usage.latency_ms,
        status="SUCCESS",
        retry_count=usage.retry_count,
    )


# ---------------------------------------------------------------------------
# Generation lifecycle
# ---------------------------------------------------------------------------
@career_agent_bp.route("/generate", methods=["POST"])
@limiter.limit(GENERATE_LIMITS)
@token_required
@role_required("job_seeker", "admin")
def generate_package(current_user):
    data = _body()
    idempotency_key = clean_text(data.get("idempotency_key"), maximum=128)
    if not idempotency_key:
        return _error("An idempotency key is required for generation requests.", 400, "IDEMPOTENCY_KEY_REQUIRED")
    allowed, usage = orchestrator.entitlements.can_generate_document_package(current_user.id)
    if not allowed:
        return _error(
            usage.get("reason") or "A paid Career Agent plan is required.",
            402,
            "GENERATION_ENTITLEMENT_REQUIRED",
            usage=usage,
        )
    if not orchestrator.client.configured:
        return _error(
            "The AI document generation provider is not configured. Please contact support.",
            503,
            "AI_PROVIDER_NOT_CONFIGURED",
        )
    try:
        package, usage = orchestrator.create_package(
            user=current_user,
            target_data=data,
            idempotency_key=idempotency_key,
            template_key=clean_text(data.get("template_key"), maximum=80) or None,
            document_mode=clean_text(data.get("document_mode"), maximum=30) or None,
        )
        # Render before committing. Committing expires the package, its target
        # job and its stages, and re-reading them for this one response would
        # cost three more round trips on a remote database.
        payload = package.to_dict(include_stages=True)
        package_id = package.id
        db.session.commit()
    except GenerationEntitlementError as exc:
        db.session.rollback()
        return _error(str(exc), 402, exc.code, usage=exc.usage)
    except ValueError as exc:
        db.session.rollback()
        return _error(str(exc), 400, "TARGET_JOB_INVALID")
    except PermissionError as exc:
        db.session.rollback()
        return _error(str(exc), 403)
    except IntegrityError:
        # Two tabs can still race before the frontend disables its button.
        # The unique idempotency key is the final source of truth.
        db.session.rollback()
        package = CareerDocumentPackage.query.filter_by(idempotency_key=idempotency_key).first()
        if not package or package.user_id != current_user.id:
            return _error("This generation request could not be safely deduplicated. Please try again.", 409, "GENERATION_CONFLICT")
        usage = orchestrator.entitlements.usage_summary(current_user.id)
        payload = package.to_dict(include_stages=True)
        package_id = package.id
    _start_generation_thread(package_id)
    return jsonify({"package": payload, "usage": usage}), 202


@career_agent_bp.route("/generations", methods=["GET"])
@token_required
@role_required("job_seeker", "admin")
def list_generations(current_user):
    rows = (
        CareerDocumentPackage.query
        .options(
            joinedload(CareerDocumentPackage.target_job),
            # Keep the package query one row per package. A collection join
            # combined with LIMIT can produce a large joined result and is
            # fragile on older PostgreSQL/SQLAlchemy deployments.
            selectinload(CareerDocumentPackage.stages),
        )
        .filter_by(user_id=current_user.id)
        .order_by(
            CareerDocumentPackage.requested_at.desc(),
        )
        .limit(50)
        .all()
    )
    # Do not send CV/letter bodies on the workspace bootstrap request, but do
    # include the small persisted stage summaries. This lets the UI render
    # accurate progress even when the follow-up detail request is transiently
    # unavailable (for example while the database is recovering connections).
    return jsonify([
        row.to_dict(include_documents=False, include_stages=True)
        for row in rows
    ]), 200


@career_agent_bp.route("/generations/<int:package_id>", methods=["GET"])
@token_required
@role_required("job_seeker", "admin")
def get_generation(current_user, package_id: int):
    # One statement for the package and its stage rows instead of two round
    # trips: this endpoint is polled while the pipeline runs, so every extra
    # query is another trip to the database. The filter pins a single package
    # and a package owns at most one row per pipeline stage, so the join stays
    # bounded (no LIMIT, which is what used to multiply collection rows). The
    # explicit stage ordering preserves the pipeline order the separate
    # selectinload used to provide. The large target-job description/snapshot
    # is still only loaded once, when the package completes.
    rows = (
        db.session.query(CareerDocumentPackage)
        .join(CareerDocumentPackage.stages, isouter=True)
        .options(contains_eager(CareerDocumentPackage.stages))
        .filter(
            CareerDocumentPackage.id == package_id,
            CareerDocumentPackage.user_id == current_user.id,
        )
        .order_by(CareerDocumentPackage.id, CareerGenerationStage.id)
        .all()
    )
    package = rows[0] if rows else None
    if not package:
        return _error("Generation package not found.", 404)
    # While the pipeline runs, polling only needs status + stages. Documents and
    # the match/quality reports are large Text columns; load them on completion.
    completed = package.status == "COMPLETED"
    payload = package.to_dict(
        include_documents=completed,
        include_stages=True,
        # Target-job descriptions and snapshots are not needed on a polling
        # response. They are loaded only when the package is complete.
        include_target_job=completed,
    )
    if completed:
        payload["match_analysis"] = package.match_analysis.to_dict() if package.match_analysis else None
        payload["quality_report"] = package.quality_report.to_dict() if package.quality_report else None
    else:
        payload["match_analysis"] = None
        payload["quality_report"] = None
    return jsonify(payload), 200


@career_agent_bp.route("/generations/<int:package_id>/retry", methods=["POST"])
@limiter.limit(GENERATE_LIMITS)
@token_required
@role_required("job_seeker", "admin")
def retry_generation(current_user, package_id: int):
    package = _owned_package(current_user, package_id)
    if not package:
        return _error("Generation package not found.", 404)
    try:
        package = orchestrator.retry_package(user=current_user, package_id=package_id)
    except ValueError as exc:
        db.session.rollback()
        return _error(str(exc), 409)
    db.session.commit()
    _start_generation_thread(package.id)
    return jsonify(package.to_dict(include_stages=True)), 202


# ---------------------------------------------------------------------------
# Apply-flow integration: attach a generated package to a job application
# ---------------------------------------------------------------------------
def _best_package_for_job(user_id: int, platform_job_id: int):
    """Most recent completed package whose target is exactly this platform job."""
    return (
        CareerDocumentPackage.query
        .join(CareerTargetJob, CareerDocumentPackage.target_job_id == CareerTargetJob.id)
        .filter(
            CareerDocumentPackage.user_id == user_id,
            CareerDocumentPackage.status == "COMPLETED",
            CareerTargetJob.platform_job_id == platform_job_id,
        )
        .order_by(CareerDocumentPackage.completed_at.desc(), CareerDocumentPackage.id.desc())
        .first()
    )



def _package_document(package, document_type: str):
    if not package:
        return None
    return CareerDocument.query.filter_by(
        package_id=package.id, user_id=package.user_id, document_type=document_type,
    ).first()


def _document_package_summary(document: CareerDocument | None):
    if not document:
        return None
    package = document.package
    return {
        "document_id": document.id,
        "package_id": package.id if package else None,
        "title": document.title,
        "document_type": document.document_type,
        "template_key": document.template_key,
        "document_mode": document.document_mode,
        "current_version_number": document.current_version_number,
        "target_job": {
            "id": package.target_job.id,
            "platform_job_id": package.target_job.platform_job_id,
            "title": package.target_job.title,
            "employer": package.target_job.employer_name,
        } if package and package.target_job else None,
    }


@career_agent_bp.route("documents/for-job/<int:job_id>", methods=["GET"])
@token_required
@role_required("job_seeker", "admin")
def documents_for_job(current_user, job_id: int):
    """Return only the package prepared for this exact platform job."""
    package = _best_package_for_job(current_user.id, job_id)
    if not package:
        return jsonify({
            "package_id": None,
            "package": None,
            "documents": [],
            "matched_job": False,
            "target_job": None,
            "cv_document_id": None,
            "cover_letter_document_id": None,
        }), 200
    matched = True
    cv = _package_document(package, "CV")
    letter = _package_document(package, "COVER_LETTER")
    return jsonify({
        "package_id": package.id,
        "matched_job": matched,
        "target_job": {"title": package.target_job.title, "employer": package.target_job.employer_name} if package.target_job else None,
        "documents": [d for d in (_document_package_summary(cv), _document_package_summary(letter)) if d],
        "cv_document_id": cv.id if cv else None,
        "cover_letter_document_id": letter.id if letter else None,
    }), 200


@career_agent_bp.route("documents/<int:document_id>/download", methods=["GET"])
@token_required
def download_document(current_user, document_id: int):
    """Owner download for the apply flow (PDF); accepts format query param."""
    document = _owned_document(current_user, document_id)
    if not document:
        return _error("Document not found.", 404)
    export_format = clean_text(request.args.get("format") or "pdf", maximum=10).lower()
    if export_format not in {"pdf", "docx", "txt"}:
        return _error("Supported formats are pdf, docx, and txt.", 400)
    try:
        rendered, _record = orchestrator.export_document(user=current_user, document=document, format=export_format)
    except CareerDocumentRenderError as exc:
        db.session.rollback()
        return _error(str(exc), 503, "EXPORT_UNAVAILABLE")
    response = send_file(
        io.BytesIO(rendered.payload), mimetype=rendered.content_type,
        as_attachment=True, download_name=rendered.filename,
    )
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


@career_agent_bp.route("applications/<int:application_id>/documents/<int:document_id>/download", methods=["GET"])
@token_required
def download_application_document(current_user, application_id: int, document_id: int):
    """Employer (or owning candidate) download of a document attached to an application."""
    from src.models.application import Application
    from src.services.career_agent.export import CareerDocumentRenderer

    link = CareerApplicationDocument.query.filter_by(
        application_id=application_id, cv_document_id=document_id,
    ).first()
    if not link and document_id:
        link = CareerApplicationDocument.query.filter_by(
            application_id=application_id, cover_letter_document_id=document_id,
        ).first()
    if not link:
        return _error("Document is not attached to this application.", 404)

    document = CareerDocument.query.get(document_id)
    if not document:
        return _error("Document not found.", 404)

    application = Application.query.get(application_id)
    if not application:
        return _error("Application not found.", 404)
    is_owner = document.user_id == current_user.id
    is_employer = (
        current_user.role in {"employer", "admin"}
        and application.job is not None
        and application.job.posted_by == current_user.id
    )
    if not (is_owner or is_employer):
        return _error("You do not have access to this document.", 403)

    export_format = clean_text(request.args.get("format") or "pdf", maximum=10).lower()
    if export_format not in {"pdf", "docx", "txt"}:
        return _error("Supported formats are pdf, docx, and txt.", 400)
    try:
        rendered = CareerDocumentRenderer().render(
            document_type=document.document_type,
            content=document.get_content(),
            settings=document.get_settings(),
            title=document.title,
            format=export_format,
        )
    except CareerDocumentRenderError as exc:
        return _error(str(exc), 503, "EXPORT_UNAVAILABLE")
    response = send_file(
        io.BytesIO(rendered.payload), mimetype=rendered.content_type,
        as_attachment=True, download_name=rendered.filename,
    )
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


# ---------------------------------------------------------------------------
# Document editing (never consumes entitlement)
# ---------------------------------------------------------------------------
def _document_payload(document: CareerDocument, include_content: bool = True) -> dict:
    data = document.to_dict(include_content=include_content)
    data["versions"] = [version.to_dict() for version in document.versions.limit(30).all()]
    return data


def _save_working_content(document: CareerDocument, data: dict) -> None:
    if "content" in data:
        content = json_object(data.get("content"), name="document content")
        serialized_content = json.dumps(content, ensure_ascii=False)
        if len(serialized_content.encode("utf-8")) > 400_000:
            raise SchemaValidationError("Document content exceeds the 400 KB editing limit.")
        document.working_content_json = serialized_content
    if "settings" in data:
        settings = json_object(data.get("settings"), name="document settings")
        serialized_settings = json.dumps(settings, ensure_ascii=False)
        if len(serialized_settings.encode("utf-8")) > 20_000:
            raise SchemaValidationError("Document settings exceed the 20 KB limit.")
        document.working_settings_json = serialized_settings
        template = clean_text(settings.get("template_key"), maximum=80)
        if template:
            document.template_key = template
        mode = clean_text(settings.get("document_mode"), maximum=30)
        if mode in {"ats_safe", "visual_professional"}:
            document.document_mode = mode
        accent = clean_text(settings.get("accent_color"), maximum=20)
        if accent.startswith("#"):
            document.accent_color = accent


def _register_document_routes():
    def protected(view):
        return token_required(role_required("job_seeker", "admin")(view))

    def get_document(current_user, document_id: int):
        document = _owned_document(current_user, document_id)
        if not document:
            return _error("Document not found.", 404)
        return jsonify(_document_payload(document)), 200

    def autosave_document(current_user, document_id: int):
        document = _owned_document(current_user, document_id)
        if not document:
            return _error("Document not found.", 404)
        try:
            _save_working_content(document, _body())
        except SchemaValidationError as exc:
            db.session.rollback()
            return _error(str(exc), 400)
        document.last_autosaved_at = db.func.now()
        db.session.commit()
        return jsonify({"saved": True, "document": document.to_dict(include_content=False)}), 200

    def save_version(current_user, document_id: int):
        document = _owned_document(current_user, document_id)
        if not document:
            return _error("Document not found.", 404)
        note = clean_text(_body().get("change_note"), maximum=500) or "Manual save"
        document.current_version_number = (document.current_version_number or 0) + 1
        db.session.add(CareerDocumentVersion(
            document_id=document.id,
            version_number=document.current_version_number,
            content_json=document.working_content_json,
            settings_json=document.working_settings_json,
            change_source="USER_SAVE",
            change_note=note,
            created_by_user_id=current_user.id,
        ))
        db.session.commit()
        return jsonify({"version": document.current_version_number}), 201

    def list_versions(current_user, document_id: int):
        document = _owned_document(current_user, document_id)
        if not document:
            return _error("Document not found.", 404)
        versions = document.versions.order_by(CareerDocumentVersion.version_number.desc()).limit(50).all()
        return jsonify([version.to_dict() for version in versions]), 200

    def restore_version(current_user, document_id: int, version_number: int):
        document = _owned_document(current_user, document_id)
        if not document:
            return _error("Document not found.", 404)
        version = CareerDocumentVersion.query.filter_by(
            document_id=document.id, version_number=version_number,
        ).first()
        if not version:
            return _error("Version not found.", 404)
        document.working_content_json = version.content_json
        document.working_settings_json = version.settings_json
        document.current_version_number = (document.current_version_number or 0) + 1
        db.session.add(CareerDocumentVersion(
            document_id=document.id,
            version_number=document.current_version_number,
            content_json=version.content_json,
            settings_json=version.settings_json,
            change_source="RESTORE",
            change_note=f"Restored from version {version_number}",
            created_by_user_id=current_user.id,
        ))
        db.session.commit()
        return jsonify(_document_payload(document)), 200

    @limiter.limit(ASSIST_LIMITS)
    def ai_assist(current_user, document_id: int):
        document = _owned_document(current_user, document_id)
        if not document:
            return _error("Document not found.", 404)
        data = _body()
        action = clean_text(data.get("action"), maximum=30)
        selected_text = clean_text(data.get("selected_text"), maximum=1600)
        if not action or not selected_text:
            return _error("Select text and choose an assistant action.", 400)
        try:
            suggestions = orchestrator.assist_document(
                user=current_user, document=document, action=action, selected_text=selected_text,
            )
        except ValueError as exc:
            db.session.rollback()
            return _error(str(exc), 400)
        except AIRateLimited:
            db.session.rollback()
            return _error("The writing assistant is rate limited. Please retry in a few minutes.", 429, "AI_RATE_LIMITED")
        except (AIProviderError, AIProviderUnavailable):
            db.session.rollback()
            return _error("The writing assistant is unavailable right now. Please retry.", 503, "AI_UNAVAILABLE")
        return jsonify(suggestions), 200

    @limiter.limit(EXPORT_LIMITS)
    def export_document(current_user, document_id: int):
        document = _owned_document(current_user, document_id)
        if not document:
            return _error("Document not found.", 404)
        export_format = clean_text(request.args.get("format") or _body().get("format"), maximum=10).lower()
        if export_format not in {"pdf", "docx", "txt"}:
            return _error("Supported export formats are pdf, docx, and txt.", 400)
        try:
            rendered, _record = orchestrator.export_document(user=current_user, document=document, format=export_format)
        except CareerDocumentRenderError as exc:
            db.session.rollback()
            return _error(str(exc), 503, "EXPORT_UNAVAILABLE")
        response = send_file(
            io.BytesIO(rendered.payload),
            mimetype=rendered.content_type,
            as_attachment=True,
            download_name=rendered.filename,
        )
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response

    for prefix in ("cv", "cover-letter", "documents"):
        view_name = f"{prefix}_document"
        career_agent_bp.add_url_rule(
            f"/{prefix}/<int:document_id>", view_name, protected(get_document), methods=["GET"],
        )
        career_agent_bp.add_url_rule(
            f"/{prefix}/<int:document_id>", f"{view_name}_autosave", protected(autosave_document), methods=["PUT"],
        )
        career_agent_bp.add_url_rule(
            f"/{prefix}/<int:document_id>/version", f"{view_name}_version", protected(save_version), methods=["POST"],
        )
        career_agent_bp.add_url_rule(
            f"/{prefix}/<int:document_id>/versions", f"{view_name}_versions", protected(list_versions), methods=["GET"],
        )
        career_agent_bp.add_url_rule(
            f"/{prefix}/<int:document_id>/versions/<int:version_number>/restore",
            f"{view_name}_restore", protected(restore_version), methods=["POST"],
        )
        career_agent_bp.add_url_rule(
            f"/{prefix}/<int:document_id>/ai-assist", f"{view_name}_assist", protected(ai_assist), methods=["POST"],
        )
        career_agent_bp.add_url_rule(
            f"/{prefix}/<int:document_id>/export", f"{view_name}_export", protected(export_document), methods=["POST", "GET"],
        )


_register_document_routes()


# ---------------------------------------------------------------------------
# Usage, subscription, payments
# ---------------------------------------------------------------------------
@career_agent_bp.route("/usage", methods=["GET"])
@token_required
@role_required("job_seeker", "admin")
def get_usage(current_user):
    try:
        allowed, usage = orchestrator.entitlements.can_generate_document_package(current_user.id)
        db.session.commit()
        return jsonify({"can_generate_new_package": allowed, **usage}), 200
    except SQLAlchemyError:
        db.session.rollback()
        current_app.logger.exception("Failed to load Career Agent usage from the database")
        return _error("Career Agent usage is temporarily unavailable. Please try again.", 503, "DATABASE_UNAVAILABLE")


@career_agent_bp.route("/subscription", methods=["GET"])
@token_required
@role_required("job_seeker", "admin")
def get_subscription(current_user):
    try:
        plans = [plan.to_dict() for plan in CareerPlanService.plans() if plan.is_active]
        allowed, usage = orchestrator.entitlements.can_generate_document_package(current_user.id)
        db.session.commit()
        return jsonify({"plans": plans, **usage, "can_generate_new_package": allowed}), 200
    except SQLAlchemyError:
        db.session.rollback()
        current_app.logger.exception("Failed to load Career Agent subscription plans from the database")
        return _error("Career Agent plans are temporarily unavailable. Please try again.", 503, "DATABASE_UNAVAILABLE")


@career_agent_bp.route("/subscription/checkout", methods=["POST"])
@token_required
@role_required("job_seeker", "admin")
def start_checkout(current_user):
    data = _body()
    plan_code = clean_text(data.get("plan_code"), maximum=60)
    idempotency_key = clean_text(data.get("idempotency_key"), maximum=128)
    if not plan_code or not idempotency_key:
        return _error("plan_code and idempotency_key are required.", 400)
    try:
        result = payment_service.start_checkout(user=current_user, plan_code=plan_code, idempotency_key=idempotency_key)
        db.session.commit()
    except ValueError as exc:
        db.session.rollback()
        return _error(str(exc), 400)
    except CareerPaymentError as exc:
        db.session.rollback()
        return _error(str(exc), 503, "PAYMENT_PROVIDER_UNAVAILABLE")
    return jsonify({
        "transaction": result["transaction"].to_dict(),
        "checkout_url": result["checkout_url"],
        "provider_reference": result["transaction"].provider_reference,
        "reused": result["reused"],
    }), 201


@career_agent_bp.route("/subscription/verify", methods=["POST"])
@token_required
@role_required("job_seeker", "admin")
def verify_payment(current_user):
    reference = clean_text(_body().get("provider_reference"), maximum=160)
    if not reference:
        return _error("provider_reference is required.", 400)
    transaction = CareerPaymentTransaction.query.filter(
        or_(
            CareerPaymentTransaction.provider_reference == reference,
            CareerPaymentTransaction.idempotency_key == reference,
        )
    ).with_for_update().first()
    if not transaction or transaction.user_id != current_user.id:
        return _error("Payment not found for this account.", 404)
    if transaction.status == "COMPLETED":
        db.session.rollback()
    elif not transaction.provider_reference:
        db.session.rollback()
        return _error("This checkout does not have a provider reference yet.", 409, "CHECKOUT_INCOMPLETE")
    try:
        if transaction.status != "COMPLETED":
            transaction = payment_service.verify_and_activate(provider_reference=transaction.provider_reference)
        db.session.commit()
    except CareerPaymentError as exc:
        db.session.rollback()
        return _error(str(exc), 402, "PAYMENT_NOT_VERIFIED")
    allowed, usage = orchestrator.entitlements.can_generate_document_package(current_user.id)
    return jsonify({"verified": True, "transaction": transaction.to_dict(), **usage}), 200


@career_agent_bp.route("/subscription/webhook", methods=["POST"])
def payment_webhook():
    raw_body = request.get_data(cache=False)
    signature = request.headers.get("X-Webhook-Signature", "")
    if not payment_service.provider.verify_webhook_signature(raw_body, signature):
        return _error("Invalid webhook signature.", 400)
    try:
        data = json.loads(raw_body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return _error("Payment webhook body must be valid JSON.", 400)
    if not isinstance(data, dict):
        return _error("Payment webhook body must be a JSON object.", 400)
    provider_reference = clean_text(data.get("reference") or data.get("provider_reference"), maximum=160)
    if not provider_reference:
        return _error("Payment reference missing from webhook.", 400)
    try:
        payment_service.verify_and_activate(provider_reference=provider_reference)
        db.session.commit()
    except CareerPaymentError as exc:
        db.session.rollback()
        # Return a retryable failure so a temporary provider error is not
        # mistaken for a successful payment activation.
        return _error(str(exc), 402, "PAYMENT_NOT_VERIFIED")
    return jsonify({"received": True, "verified": True}), 200


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------
@career_agent_bp.route("/admin/generations", methods=["GET"])
@token_required
@role_required("admin")
def admin_generations(current_user):
    status = clean_text(request.args.get("status"), maximum=30)
    query = CareerDocumentPackage.query
    if status:
        query = query.filter_by(status=status.upper())
    rows = query.order_by(CareerDocumentPackage.requested_at.desc()).limit(100).all()
    return jsonify([{
        "id": row.id,
        "user_id": row.user_id,
        "status": row.status,
        "entitlement_source": row.entitlement_source,
        "target_job": row.target_job.title if row.target_job else None,
        "requested_at": row.requested_at.isoformat(),
        "completed_at": row.completed_at.isoformat() if row.completed_at else None,
        "error_code": row.error_code,
        "documents": [doc.to_dict(include_content=False) for doc in row.documents.all()],
        "ai_usage": [log.to_dict() for log in row.ai_usage_logs.limit(20).all()],
    } for row in rows]), 200


@career_agent_bp.route("/admin/plans/<plan_code>", methods=["PUT"])
@token_required
@role_required("admin")
def admin_update_plan(current_user, plan_code: str):
    try:
        plan = CareerPlanService.update_plan(plan_code, _body())
        db.session.commit()
    except ValueError as exc:
        db.session.rollback()
        return _error(str(exc), 400)
    return jsonify(plan.to_dict()), 200


@career_agent_bp.route("/admin/subscriptions/<int:subscription_id>/suspend", methods=["POST"])
@token_required
@role_required("admin")
def admin_suspend_subscription(current_user, subscription_id: int):
    try:
        subscription = CareerPaymentService.suspend_subscription(subscription_id, clean_text(_body().get("reason"), maximum=500))
        db.session.commit()
    except ValueError as exc:
        db.session.rollback()
        return _error(str(exc), 404)
    return jsonify(subscription.to_dict()), 200
