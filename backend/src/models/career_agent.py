"""Persistent domain models for AfriTech AI Career Agent.

The models are deliberately additive: candidate facts continue to live in the
existing profile tables, while this module stores normalized evidence,
document packages, preferences, entitlement state, and audit records.
"""

from datetime import datetime
import json

from src.models.user import db


def _json_loads(value, default):
    if value in (None, ""):
        return default
    if isinstance(value, (dict, list)):
        return value
    try:
        return json.loads(value)
    except (TypeError, ValueError):
        return default


def _json_object(value):
    """Return a JSON object for fields whose API contract is object-shaped."""
    parsed = _json_loads(value, {})
    return parsed if isinstance(parsed, dict) else {}


def _iso(value):
    if not value:
        return None
    return value.isoformat() if hasattr(value, "isoformat") else str(value)


class CareerProfile(db.Model):
    """Application-level, user-controlled career memory and preferences."""

    __tablename__ = "career_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True, index=True)
    preferred_professional_title = db.Column(db.String(180))
    preferred_language = db.Column(db.String(20), default="en")
    preferred_template_key = db.Column(db.String(80), default="modern_professional")
    preferred_document_mode = db.Column(db.String(30), default="ats_safe")
    career_preferences_json = db.Column(db.Text, default="{}")
    writing_preferences_json = db.Column(db.Text, default="{}")
    document_preferences_json = db.Column(db.Text, default="{}")
    last_source_fingerprint = db.Column(db.String(128), index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = db.relationship("User", backref=db.backref("career_agent_profile", uselist=False, cascade="all, delete-orphan"))
    evidence = db.relationship("CareerEvidence", backref="career_profile", lazy="dynamic", cascade="all, delete-orphan")

    def get_career_preferences(self):
        return _json_loads(self.career_preferences_json, {})

    def get_writing_preferences(self):
        return _json_loads(self.writing_preferences_json, {})

    def get_document_preferences(self):
        return _json_loads(self.document_preferences_json, {})

    def set_preferences(self, *, career=None, writing=None, document=None):
        if career is not None:
            self.career_preferences_json = json.dumps(career)
        if writing is not None:
            self.writing_preferences_json = json.dumps(writing)
        if document is not None:
            self.document_preferences_json = json.dumps(document)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "preferred_professional_title": self.preferred_professional_title,
            "preferred_language": self.preferred_language,
            "preferred_template_key": self.preferred_template_key,
            "preferred_document_mode": self.preferred_document_mode,
            "career_preferences": self.get_career_preferences(),
            "writing_preferences": self.get_writing_preferences(),
            "document_preferences": self.get_document_preferences(),
            "updated_at": _iso(self.updated_at),
        }


class CareerEvidence(db.Model):
    """A traceable candidate fact used by matching and document generation."""

    __tablename__ = "career_evidence"

    id = db.Column(db.Integer, primary_key=True)
    career_profile_id = db.Column(db.Integer, db.ForeignKey("career_profiles.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    category = db.Column(db.String(50), nullable=False, index=True)
    source_type = db.Column(db.String(40), nullable=False)  # profile, import, user_confirmation
    source_reference = db.Column(db.String(160), nullable=False)
    source_label = db.Column(db.String(255))
    payload_json = db.Column(db.Text, nullable=False)
    content_fingerprint = db.Column(db.String(128), nullable=False, index=True)
    confidence = db.Column(db.Float, default=1.0, nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False, index=True)
    is_current = db.Column(db.Boolean, default=True, nullable=False, index=True)
    verified_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        db.UniqueConstraint("user_id", "source_reference", "content_fingerprint", name="uq_career_evidence_source"),
        # Profile readiness and generation only use current, verified evidence.
        # Keep the filter and category/id ordering in one index so the query
        # does not scan a user's historical evidence rows.
        db.Index(
            "ix_career_evidence_profile_current_verified",
            "career_profile_id", "is_current", "is_verified", "category", "id",
        ),
        db.Index(
            "ix_career_evidence_profile_source_current",
            "career_profile_id", "source_type", "is_current",
        ),
    )

    def get_payload(self):
        return _json_loads(self.payload_json, {})

    def to_dict(self):
        return {
            "id": self.id,
            "category": self.category,
            "source_type": self.source_type,
            "source_reference": self.source_reference,
            "source_label": self.source_label,
            "payload": self.get_payload(),
            "confidence": self.confidence,
            "is_verified": self.is_verified,
            "is_current": self.is_current,
            "verified_at": _iso(self.verified_at),
        }


class CareerMemory(db.Model):
    """Persisted, versioned career memory derived from the user's profile.

    ``profile_version`` is the authoritative counter: every profile write bumps
    it through ``CareerMemoryService.mark_profile_changed``. ``synced_version``
    records the version that ``memory_json`` was actually built from, so a
    memory row is stale exactly when the two differ. ``source_fingerprint``
    additionally catches profile edits that no hook observed (for example a
    direct database change) because it is compared against the fingerprint
    written by the evidence sync.
    """

    __tablename__ = "career_memories"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True, index=True)
    profile_version = db.Column(db.Integer, nullable=False, default=0)
    # -1 means "never synced"; any profile_version is >= 0, so a fresh row is
    # always considered stale and rebuilds on first read.
    synced_version = db.Column(db.Integer, nullable=False, default=-1)
    memory_json = db.Column(db.Text, nullable=False, default="{}")
    source_fingerprint = db.Column(db.String(128))
    sync_error = db.Column(db.String(500))
    last_synced_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = db.relationship("User", backref=db.backref("career_memory", uselist=False, cascade="all, delete-orphan"))

    def get_memory(self):
        parsed = _json_loads(self.memory_json, {})
        return parsed if isinstance(parsed, dict) else {}

    @property
    def version_stale(self) -> bool:
        synced = self.synced_version if self.synced_version is not None else -1
        current = self.profile_version if self.profile_version is not None else 0
        return synced < current

    def is_stale(self, source_fingerprint: str | None = None) -> bool:
        if self.version_stale:
            return True
        if source_fingerprint is None:
            return False
        # An unsynced evidence row has no fingerprint yet; the version counter
        # is the only signal available, and it already matched above.
        if source_fingerprint and self.source_fingerprint != source_fingerprint:
            return True
        return False

    def to_dict(self, include_memory: bool = False):
        data = {
            "profile_version": self.profile_version,
            "synced_version": self.synced_version,
            "stale": self.version_stale,
            "last_synced_at": _iso(self.last_synced_at),
            "source_fingerprint": self.source_fingerprint,
            "sync_error": self.sync_error,
        }
        if include_memory:
            data["memory"] = self.get_memory()
        return data


class ImportedCareerDocument(db.Model):
    """Private source document and locally extracted, reviewable career data."""

    __tablename__ = "career_imported_documents"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    filename = db.Column(db.String(255), nullable=False)
    content_type = db.Column(db.String(120), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    content_hash = db.Column(db.String(128), nullable=False, index=True)
    private_storage_key = db.Column(db.String(500), nullable=False, unique=True)
    extraction_status = db.Column(db.String(40), default="PENDING", nullable=False, index=True)
    extraction_method = db.Column(db.String(80))
    extracted_text = db.Column(db.Text)
    extracted_data_json = db.Column(db.Text, default="{}")
    conflicts_json = db.Column(db.Text, default="[]")
    review_status = db.Column(db.String(40), default="PENDING_REVIEW", nullable=False, index=True)
    deleted_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = db.relationship("User", backref=db.backref("career_imported_documents", lazy="dynamic", cascade="all, delete-orphan"))

    def get_extracted_data(self):
        return _json_loads(self.extracted_data_json, {})

    def get_conflicts(self):
        return _json_loads(self.conflicts_json, [])

    def to_dict(self, include_text=False):
        data = {
            "id": self.id,
            "filename": self.filename,
            "content_type": self.content_type,
            "file_size": self.file_size,
            "extraction_status": self.extraction_status,
            "extraction_method": self.extraction_method,
            "extracted_data": self.get_extracted_data(),
            "conflicts": self.get_conflicts(),
            "review_status": self.review_status,
            "created_at": _iso(self.created_at),
        }
        if include_text:
            data["extracted_text"] = self.extracted_text or ""
        return data


class CareerTargetJob(db.Model):
    """An immutable source snapshot and derived job analysis for a package."""

    __tablename__ = "career_target_jobs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    platform_job_id = db.Column(db.Integer, db.ForeignKey("jobs.id"), nullable=True, index=True)
    source_type = db.Column(db.String(30), nullable=False)  # platform, pasted, general
    title = db.Column(db.String(500), nullable=False)
    employer_name = db.Column(db.String(300))
    location = db.Column(db.String(255))
    description = db.Column(db.Text)
    requirements = db.Column(db.Text)
    source_snapshot_json = db.Column(db.Text, default="{}", nullable=False)
    analysis_json = db.Column(db.Text, default="{}", nullable=False)
    source_hash = db.Column(db.String(128), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = db.relationship("User", backref=db.backref("career_target_jobs", lazy="dynamic"))
    platform_job = db.relationship("Job", backref=db.backref("career_target_snapshots", lazy="dynamic"))

    def get_snapshot(self):
        return _json_loads(self.source_snapshot_json, {})

    def get_analysis(self):
        return _json_loads(self.analysis_json, {})

    def to_dict(self):
        return {
            "id": self.id,
            "platform_job_id": self.platform_job_id,
            "source_type": self.source_type,
            "title": self.title,
            "employer_name": self.employer_name,
            "location": self.location,
            "description": self.description,
            "requirements": self.requirements,
            "snapshot": self.get_snapshot(),
            "analysis": self.get_analysis(),
            "created_at": _iso(self.created_at),
        }


class CareerDocumentPackage(db.Model):
    """One CV + matching cover-letter generation for exactly one target."""

    __tablename__ = "career_document_packages"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    target_job_id = db.Column(db.Integer, db.ForeignKey("career_target_jobs.id"), nullable=False, index=True)
    idempotency_key = db.Column(db.String(128), nullable=False, unique=True)
    status = db.Column(db.String(30), default="PENDING", nullable=False, index=True)
    entitlement_source = db.Column(db.String(40))  # FREE, SUBSCRIPTION
    requested_template_key = db.Column(db.String(80), default="modern_professional")
    requested_document_mode = db.Column(db.String(30), default="ats_safe")
    language = db.Column(db.String(20), default="en")
    error_code = db.Column(db.String(80))
    error_message = db.Column(db.String(500))
    retry_count = db.Column(db.Integer, default=0, nullable=False)
    processing_lock_token = db.Column(db.String(128))
    requested_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    processing_started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    failed_at = db.Column(db.DateTime)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        # The recovery worker claims the oldest pending/stale package, while
        # the workspace lists a user's newest packages. Keep both paths
        # indexed instead of repeatedly scanning the whole package table.
        db.Index(
            "ix_career_package_recovery_queue",
            "status", "processing_started_at", "requested_at", "id",
        ),
        db.Index(
            "ix_career_package_user_requested",
            "user_id", "requested_at", "id",
        ),
    )

    user = db.relationship("User", backref=db.backref("career_document_packages", lazy="dynamic"))
    target_job = db.relationship("CareerTargetJob", backref=db.backref("document_packages", lazy="dynamic"))
    documents = db.relationship("CareerDocument", backref="package", lazy="dynamic", cascade="all, delete-orphan")
    stages = db.relationship(
        "CareerGenerationStage",
        backref="package",
        lazy="select",
        order_by="CareerGenerationStage.id",
        cascade="all, delete-orphan",
    )

    def to_dict(self, include_documents=False, include_stages=False, include_target_job=True):
        data = {
            "id": self.id,
            "target_job_id": self.target_job_id,
            "status": self.status,
            "entitlement_source": self.entitlement_source,
            "template_key": self.requested_template_key,
            "document_mode": self.requested_document_mode,
            "language": self.language,
            "error_code": self.error_code,
            "error_message": self.error_message,
            "retry_count": self.retry_count,
            "requested_at": _iso(self.requested_at),
            "processing_started_at": _iso(self.processing_started_at),
            "completed_at": _iso(self.completed_at),
        }
        if include_target_job:
            data["target_job"] = self.target_job.to_dict() if self.target_job else None
        if include_documents:
            data["documents"] = [doc.to_dict() for doc in self.documents.order_by(CareerDocument.document_type).all()]
        if include_stages:
            data["stages"] = [stage.to_dict() for stage in self.stages]
        return data


class CareerDocument(db.Model):
    """The current working copy of a CV or cover letter."""

    __tablename__ = "career_documents"

    id = db.Column(db.Integer, primary_key=True)
    package_id = db.Column(db.Integer, db.ForeignKey("career_document_packages.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    document_type = db.Column(db.String(30), nullable=False, index=True)  # CV, COVER_LETTER
    title = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(30), default="READY", nullable=False)
    template_key = db.Column(db.String(80), default="modern_professional")
    document_mode = db.Column(db.String(30), default="ats_safe")
    accent_color = db.Column(db.String(20), default="#0F766E")
    working_content_json = db.Column(db.Text, nullable=False, default="{}")
    working_settings_json = db.Column(db.Text, nullable=False, default="{}")
    current_version_number = db.Column(db.Integer, default=0, nullable=False)
    last_autosaved_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = db.relationship("User", backref=db.backref("career_documents", lazy="dynamic"))
    versions = db.relationship(
        "CareerDocumentVersion",
        backref="document",
        lazy="dynamic",
        cascade="all, delete-orphan",
        order_by="CareerDocumentVersion.version_number.desc()",
    )

    __table_args__ = (
        db.UniqueConstraint("package_id", "document_type", name="uq_career_package_document_type"),
    )

    def get_content(self):
        return _json_loads(self.working_content_json, {})

    def get_settings(self):
        return _json_loads(self.working_settings_json, {})

    def to_dict(self, include_content=True):
        data = {
            "id": self.id,
            "package_id": self.package_id,
            "document_type": self.document_type,
            "title": self.title,
            "status": self.status,
            "template_key": self.template_key,
            "document_mode": self.document_mode,
            "accent_color": self.accent_color,
            "current_version_number": self.current_version_number,
            "last_autosaved_at": _iso(self.last_autosaved_at),
            "updated_at": _iso(self.updated_at),
        }
        if include_content:
            data["content"] = self.get_content()
            data["settings"] = self.get_settings()
        return data


class CareerDocumentVersion(db.Model):
    """Immutable user-visible document snapshot."""

    __tablename__ = "career_document_versions"

    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey("career_documents.id"), nullable=False, index=True)
    version_number = db.Column(db.Integer, nullable=False)
    content_json = db.Column(db.Text, nullable=False)
    settings_json = db.Column(db.Text, nullable=False, default="{}")
    change_source = db.Column(db.String(40), nullable=False)  # GENERATION, USER_SAVE, AI_EDIT, RESTORE, EXPORT
    change_note = db.Column(db.String(500))
    created_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    created_by = db.relationship("User", foreign_keys=[created_by_user_id])

    __table_args__ = (
        db.UniqueConstraint("document_id", "version_number", name="uq_career_document_version"),
    )

    def to_dict(self, include_content=False):
        data = {
            "id": self.id,
            "document_id": self.document_id,
            "version_number": self.version_number,
            "change_source": self.change_source,
            "change_note": self.change_note,
            "created_at": _iso(self.created_at),
        }
        if include_content:
            data["content"] = _json_loads(self.content_json, {})
            data["settings"] = _json_loads(self.settings_json, {})
        return data


class CareerGenerationStage(db.Model):
    """Actual persisted processing stage for a package."""

    __tablename__ = "career_generation_stages"

    id = db.Column(db.Integer, primary_key=True)
    package_id = db.Column(db.Integer, db.ForeignKey("career_document_packages.id"), nullable=False, index=True)
    stage_key = db.Column(db.String(60), nullable=False)
    display_name = db.Column(db.String(120), nullable=False)
    status = db.Column(db.String(30), default="QUEUED", nullable=False)
    progress_percent = db.Column(db.Integer, default=0, nullable=False)
    latency_ms = db.Column(db.Integer)
    error_code = db.Column(db.String(80))
    metadata_json = db.Column(db.Text, default="{}")
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        db.UniqueConstraint("package_id", "stage_key", name="uq_career_package_stage"),
        # The polling endpoint loads every package's stages on each status check.
        db.Index("ix_career_stage_package_status", "package_id", "status"),
    )

    def to_dict(self):
        return {
            "stage_key": self.stage_key,
            "display_name": self.display_name,
            "status": self.status,
            "progress_percent": self.progress_percent,
            "latency_ms": self.latency_ms,
            "error_code": self.error_code,
            "metadata": _json_loads(self.metadata_json, {}),
            "started_at": _iso(self.started_at),
            "completed_at": _iso(self.completed_at),
        }


class CareerSubscriptionPlan(db.Model):
    """Admin-manageable database representation of centrally seeded products."""

    __tablename__ = "career_subscription_plans"

    code = db.Column(db.String(60), primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    price_rwf = db.Column(db.Integer, nullable=False)
    duration_days = db.Column(db.Integer)
    generation_package_limit = db.Column(db.Integer)
    is_free = db.Column(db.Boolean, default=False, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "code": self.code,
            "name": self.name,
            "description": self.description,
            "price_rwf": self.price_rwf,
            "currency": "RWF",
            "duration_days": self.duration_days,
            "generation_package_limit": self.generation_package_limit,
            "is_free": self.is_free,
            "is_active": self.is_active,
        }


class CareerSubscription(db.Model):
    """A user subscription whose validity is always checked server-side."""

    __tablename__ = "career_subscriptions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    plan_code = db.Column(db.String(60), db.ForeignKey("career_subscription_plans.code"), nullable=False, index=True)
    status = db.Column(db.String(30), default="PENDING", nullable=False, index=True)
    starts_at = db.Column(db.DateTime)
    ends_at = db.Column(db.DateTime)
    external_customer_reference = db.Column(db.String(160))
    external_subscription_reference = db.Column(db.String(160), unique=True)
    cancellation_reason = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = db.relationship("User", backref=db.backref("career_subscriptions", lazy="dynamic"))
    plan = db.relationship("CareerSubscriptionPlan")

    def is_active_now(self, now=None):
        now = now or datetime.utcnow()
        return self.status == "ACTIVE" and self.starts_at and self.starts_at <= now and self.ends_at and self.ends_at > now

    def to_dict(self):
        return {
            "id": self.id,
            "plan_code": self.plan_code,
            "status": self.status,
            "starts_at": _iso(self.starts_at),
            "ends_at": _iso(self.ends_at),
            "is_active": self.is_active_now(),
            "plan": self.plan.to_dict() if self.plan else None,
        }


class CareerPaymentTransaction(db.Model):
    """Provider-neutral payment audit record; provider payloads are redacted."""

    __tablename__ = "career_payment_transactions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    subscription_id = db.Column(db.Integer, db.ForeignKey("career_subscriptions.id"), nullable=False, index=True)
    plan_code = db.Column(db.String(60), nullable=False)
    amount_rwf = db.Column(db.Integer, nullable=False)
    currency = db.Column(db.String(10), default="RWF", nullable=False)
    provider = db.Column(db.String(80), nullable=False)
    status = db.Column(db.String(30), default="PENDING", nullable=False, index=True)
    idempotency_key = db.Column(db.String(128), nullable=False, unique=True)
    provider_reference = db.Column(db.String(160), unique=True)
    provider_payload_json = db.Column(db.Text, default="{}")
    verified_at = db.Column(db.DateTime)
    failure_reason = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = db.relationship("User", backref=db.backref("career_payment_transactions", lazy="dynamic"))
    subscription = db.relationship("CareerSubscription", backref=db.backref("payment_transactions", lazy="dynamic"))

    def to_dict(self):
        return {
            "id": self.id,
            "subscription_id": self.subscription_id,
            "plan_code": self.plan_code,
            "amount_rwf": self.amount_rwf,
            "currency": self.currency,
            "provider": self.provider,
            "status": self.status,
            "provider_reference": self.provider_reference,
            "verified_at": _iso(self.verified_at),
            "created_at": _iso(self.created_at),
        }


class CareerGenerationUsage(db.Model):
    """Reservation ledger preventing quota bypasses and concurrent overuse."""

    __tablename__ = "career_generation_usages"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    package_id = db.Column(db.Integer, db.ForeignKey("career_document_packages.id"), nullable=False, unique=True, index=True)
    subscription_id = db.Column(db.Integer, db.ForeignKey("career_subscriptions.id"), nullable=True, index=True)
    entitlement_source = db.Column(db.String(40), nullable=False)  # FREE, SUBSCRIPTION
    status = db.Column(db.String(30), default="RESERVED", nullable=False, index=True)
    reserved_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    consumed_at = db.Column(db.DateTime)
    released_at = db.Column(db.DateTime)
    release_reason = db.Column(db.String(500))

    user = db.relationship("User", backref=db.backref("career_generation_usages", lazy="dynamic"))
    package = db.relationship("CareerDocumentPackage", backref=db.backref("usage", uselist=False, cascade="all, delete-orphan"))
    subscription = db.relationship("CareerSubscription")

    def to_dict(self):
        return {
            "id": self.id,
            "package_id": self.package_id,
            "subscription_id": self.subscription_id,
            "entitlement_source": self.entitlement_source,
            "status": self.status,
            "reserved_at": _iso(self.reserved_at),
            "consumed_at": _iso(self.consumed_at),
            "released_at": _iso(self.released_at),
        }


class CareerMatchAnalysis(db.Model):
    """Transparent, persisted hybrid candidate-job match calculations."""

    __tablename__ = "career_match_analyses"

    id = db.Column(db.Integer, primary_key=True)
    package_id = db.Column(db.Integer, db.ForeignKey("career_document_packages.id"), nullable=False, unique=True, index=True)
    overall_score = db.Column(db.Float, nullable=False)
    skills_score = db.Column(db.Float, nullable=False)
    experience_score = db.Column(db.Float, nullable=False)
    education_score = db.Column(db.Float, nullable=False)
    keyword_score = db.Column(db.Float, nullable=False)
    evidence_score = db.Column(db.Float, nullable=False)
    analysis_json = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    package = db.relationship("CareerDocumentPackage", backref=db.backref("match_analysis", uselist=False, cascade="all, delete-orphan"))

    def to_dict(self):
        data = _json_object(self.analysis_json)
        data.setdefault("scores", {
            "overall": round(self.overall_score, 1),
            "skills": round(self.skills_score, 1),
            "experience": round(self.experience_score, 1),
            "education": round(self.education_score, 1),
            "keyword_coverage": round(self.keyword_score, 1),
            "evidence_strength": round(self.evidence_score, 1),
        })
        return data


class CareerQualityReport(db.Model):
    """Final non-scientific but explainable document quality review."""

    __tablename__ = "career_quality_reports"

    id = db.Column(db.Integer, primary_key=True)
    package_id = db.Column(db.Integer, db.ForeignKey("career_document_packages.id"), nullable=False, unique=True, index=True)
    ats_score = db.Column(db.Float, nullable=False)
    factual_status = db.Column(db.String(40), nullable=False)
    human_writing_status = db.Column(db.String(40), nullable=False)
    report_json = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    package = db.relationship("CareerDocumentPackage", backref=db.backref("quality_report", uselist=False, cascade="all, delete-orphan"))

    def to_dict(self):
        return _json_object(self.report_json)


class CareerAIUsageLog(db.Model):
    """Redacted usage/latency audit for AI calls."""

    __tablename__ = "career_ai_usage_logs"

    id = db.Column(db.Integer, primary_key=True)
    package_id = db.Column(db.Integer, db.ForeignKey("career_document_packages.id"), nullable=True, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    stage_key = db.Column(db.String(60), nullable=False, index=True)
    provider = db.Column(db.String(80), nullable=False)
    model = db.Column(db.String(160), nullable=False)
    prompt_tokens = db.Column(db.Integer)
    completion_tokens = db.Column(db.Integer)
    total_tokens = db.Column(db.Integer)
    latency_ms = db.Column(db.Integer)
    status = db.Column(db.String(30), nullable=False)
    error_code = db.Column(db.String(80))
    retry_count = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        # Admin usage reporting and polling diagnostics filter by recency.
        db.Index("ix_career_ai_log_package_created", "package_id", "created_at"),
    )

    package = db.relationship("CareerDocumentPackage", backref=db.backref("ai_usage_logs", lazy="dynamic"))
    user = db.relationship("User", backref=db.backref("career_ai_usage_logs", lazy="dynamic"))

    def to_dict(self):
        return {
            "stage_key": self.stage_key,
            "provider": self.provider,
            "model": self.model,
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "total_tokens": self.total_tokens,
            "latency_ms": self.latency_ms,
            "status": self.status,
            "error_code": self.error_code,
            "created_at": _iso(self.created_at),
        }


class CareerExportRecord(db.Model):
    """Audit record for every authenticated document export."""

    __tablename__ = "career_export_records"

    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey("career_documents.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    format = db.Column(db.String(10), nullable=False)
    version_number = db.Column(db.Integer, nullable=False)
    page_count = db.Column(db.Integer)
    file_size = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    document = db.relationship("CareerDocument", backref=db.backref("exports", lazy="dynamic"))
    user = db.relationship("User", backref=db.backref("career_exports", lazy="dynamic"))

    def to_dict(self):
        return {
            "id": self.id,
            "document_id": self.document_id,
            "format": self.format,
            "version_number": self.version_number,
            "page_count": self.page_count,
            "file_size": self.file_size,
            "created_at": _iso(self.created_at),
        }


class CareerApplicationDocument(db.Model):
    """Associates a submitted application with private generated documents."""

    __tablename__ = "career_application_documents"

    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey("applications.id"), nullable=False, unique=True, index=True)
    package_id = db.Column(db.Integer, db.ForeignKey("career_document_packages.id"), nullable=False, index=True)
    cv_document_id = db.Column(db.Integer, db.ForeignKey("career_documents.id"), nullable=False)
    cover_letter_document_id = db.Column(db.Integer, db.ForeignKey("career_documents.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    application = db.relationship("Application", backref=db.backref("career_document_link", uselist=False, cascade="all, delete-orphan"))
    package = db.relationship("CareerDocumentPackage")
    cv_document = db.relationship("CareerDocument", foreign_keys=[cv_document_id])
    cover_letter_document = db.relationship("CareerDocument", foreign_keys=[cover_letter_document_id])


CAREER_AGENT_INDEX_SQL = (
    "CREATE INDEX IF NOT EXISTS ix_career_stage_package_status "
    "ON career_generation_stages (package_id, status)",
    "CREATE INDEX IF NOT EXISTS ix_career_ai_log_package_created "
    "ON career_ai_usage_logs (package_id, created_at)",
    "CREATE INDEX IF NOT EXISTS ix_career_package_recovery_queue "
    "ON career_document_packages (status, processing_started_at, requested_at, id)",
    "CREATE INDEX IF NOT EXISTS ix_career_package_user_requested "
    "ON career_document_packages (user_id, requested_at, id)",
)


def ensure_career_agent_indexes() -> None:
    """Add the queue/polling indexes to an existing database.

    ``db.create_all()`` only creates indexes when a table is first created, so
    databases that were migrated before the composite indexes existed keep
    scanning the recovery queue and stage tables. This small additive step runs
    on the same initialization paths and is a no-op once the indexes exist.
    """
    for statement in CAREER_AGENT_INDEX_SQL:
        db.session.execute(db.text(statement))
    db.session.commit()
