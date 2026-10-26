-- AfriTech AI Career Agent: additive schema (Phase 6 delivery).
-- The application normally creates tables via db.create_all(); this script is
-- the equivalent additive migration for managed PostgreSQL environments.
-- It creates only new tables and never alters or drops profile data.

CREATE TABLE IF NOT EXISTS career_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
    preferred_professional_title VARCHAR(180),
    preferred_language VARCHAR(20) DEFAULT 'en',
    preferred_template_key VARCHAR(80) DEFAULT 'modern_professional',
    preferred_document_mode VARCHAR(30) DEFAULT 'ats_safe',
    career_preferences_json TEXT DEFAULT '{}',
    writing_preferences_json TEXT DEFAULT '{}',
    document_preferences_json TEXT DEFAULT '{}',
    last_source_fingerprint VARCHAR(128),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_career_profiles_user_id ON career_profiles (user_id);
CREATE INDEX IF NOT EXISTS ix_career_profiles_last_source_fingerprint ON career_profiles (last_source_fingerprint);

CREATE TABLE IF NOT EXISTS career_evidence (
    id SERIAL PRIMARY KEY,
    career_profile_id INTEGER NOT NULL REFERENCES career_profiles(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    category VARCHAR(50) NOT NULL,
    source_type VARCHAR(40) NOT NULL,
    source_reference VARCHAR(160) NOT NULL,
    source_label VARCHAR(255),
    payload_json TEXT NOT NULL,
    content_fingerprint VARCHAR(128) NOT NULL,
    confidence FLOAT DEFAULT 1.0 NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    is_current BOOLEAN DEFAULT TRUE NOT NULL,
    verified_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_career_evidence_source UNIQUE (user_id, source_reference, content_fingerprint)
);
CREATE INDEX IF NOT EXISTS ix_career_evidence_career_profile_id ON career_evidence (career_profile_id);
CREATE INDEX IF NOT EXISTS ix_career_evidence_user_id ON career_evidence (user_id);
CREATE INDEX IF NOT EXISTS ix_career_evidence_category ON career_evidence (category);
CREATE INDEX IF NOT EXISTS ix_career_evidence_content_fingerprint ON career_evidence (content_fingerprint);
CREATE INDEX IF NOT EXISTS ix_career_evidence_is_verified ON career_evidence (is_verified);
CREATE INDEX IF NOT EXISTS ix_career_evidence_is_current ON career_evidence (is_current);
CREATE INDEX IF NOT EXISTS ix_career_evidence_profile_current_verified
  ON career_evidence (career_profile_id, is_current, is_verified, category, id);
CREATE INDEX IF NOT EXISTS ix_career_evidence_profile_source_current
  ON career_evidence (career_profile_id, source_type, is_current);

CREATE TABLE IF NOT EXISTS career_imported_documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(120) NOT NULL,
    file_size INTEGER NOT NULL,
    content_hash VARCHAR(128) NOT NULL,
    private_storage_key VARCHAR(500) NOT NULL UNIQUE,
    extraction_status VARCHAR(40) DEFAULT 'PENDING' NOT NULL,
    extraction_method VARCHAR(80),
    extracted_text TEXT,
    extracted_data_json TEXT DEFAULT '{}',
    conflicts_json TEXT DEFAULT '[]',
    review_status VARCHAR(40) DEFAULT 'PENDING_REVIEW' NOT NULL,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_career_imported_documents_user_id ON career_imported_documents (user_id);
CREATE INDEX IF NOT EXISTS ix_career_imported_documents_content_hash ON career_imported_documents (content_hash);
CREATE INDEX IF NOT EXISTS ix_career_imported_documents_extraction_status ON career_imported_documents (extraction_status);
CREATE INDEX IF NOT EXISTS ix_career_imported_documents_review_status ON career_imported_documents (review_status);

CREATE TABLE IF NOT EXISTS career_target_jobs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    platform_job_id INTEGER REFERENCES jobs(id),
    source_type VARCHAR(30) NOT NULL,
    title VARCHAR(500) NOT NULL,
    employer_name VARCHAR(300),
    location VARCHAR(255),
    description TEXT,
    requirements TEXT,
    source_snapshot_json TEXT DEFAULT '{}' NOT NULL,
    analysis_json TEXT DEFAULT '{}' NOT NULL,
    source_hash VARCHAR(128) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_career_target_jobs_user_id ON career_target_jobs (user_id);
CREATE INDEX IF NOT EXISTS ix_career_target_jobs_platform_job_id ON career_target_jobs (platform_job_id);
CREATE INDEX IF NOT EXISTS ix_career_target_jobs_source_hash ON career_target_jobs (source_hash);

CREATE TABLE IF NOT EXISTS career_document_packages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    target_job_id INTEGER NOT NULL REFERENCES career_target_jobs(id),
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    status VARCHAR(30) DEFAULT 'PENDING' NOT NULL,
    entitlement_source VARCHAR(40),
    requested_template_key VARCHAR(80) DEFAULT 'modern_professional',
    requested_document_mode VARCHAR(30) DEFAULT 'ats_safe',
    language VARCHAR(20) DEFAULT 'en',
    error_code VARCHAR(80),
    error_message VARCHAR(500),
    retry_count INTEGER DEFAULT 0 NOT NULL,
    processing_lock_token VARCHAR(128),
    requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
    processing_started_at TIMESTAMP,
    completed_at TIMESTAMP,
    failed_at TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_career_document_packages_user_id ON career_document_packages (user_id);
CREATE INDEX IF NOT EXISTS ix_career_document_packages_target_job_id ON career_document_packages (target_job_id);
CREATE INDEX IF NOT EXISTS ix_career_document_packages_status ON career_document_packages (status);

CREATE TABLE IF NOT EXISTS career_documents (
    id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL REFERENCES career_document_packages(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    document_type VARCHAR(30) NOT NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(30) DEFAULT 'READY' NOT NULL,
    template_key VARCHAR(80) DEFAULT 'modern_professional',
    document_mode VARCHAR(30) DEFAULT 'ats_safe',
    accent_color VARCHAR(20) DEFAULT '#0F766E',
    working_content_json TEXT NOT NULL DEFAULT '{}',
    working_settings_json TEXT NOT NULL DEFAULT '{}',
    current_version_number INTEGER DEFAULT 0 NOT NULL,
    last_autosaved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_career_package_document_type UNIQUE (package_id, document_type)
);
CREATE INDEX IF NOT EXISTS ix_career_documents_package_id ON career_documents (package_id);
CREATE INDEX IF NOT EXISTS ix_career_documents_user_id ON career_documents (user_id);
CREATE INDEX IF NOT EXISTS ix_career_documents_document_type ON career_documents (document_type);

CREATE TABLE IF NOT EXISTS career_document_versions (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES career_documents(id),
    version_number INTEGER NOT NULL,
    content_json TEXT NOT NULL,
    settings_json TEXT DEFAULT '{}' NOT NULL,
    change_source VARCHAR(40) NOT NULL,
    change_note VARCHAR(500),
    created_by_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_career_document_version UNIQUE (document_id, version_number)
);
CREATE INDEX IF NOT EXISTS ix_career_document_versions_document_id ON career_document_versions (document_id);

CREATE TABLE IF NOT EXISTS career_generation_stages (
    id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL REFERENCES career_document_packages(id),
    stage_key VARCHAR(60) NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    status VARCHAR(30) DEFAULT 'QUEUED' NOT NULL,
    progress_percent INTEGER DEFAULT 0 NOT NULL,
    latency_ms INTEGER,
    error_code VARCHAR(80),
    metadata_json TEXT DEFAULT '{}',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_career_package_stage UNIQUE (package_id, stage_key)
);
CREATE INDEX IF NOT EXISTS ix_career_generation_stages_package_id ON career_generation_stages (package_id);

CREATE TABLE IF NOT EXISTS career_subscription_plans (
    code VARCHAR(60) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    price_rwf INTEGER NOT NULL,
    duration_days INTEGER,
    generation_package_limit INTEGER,
    is_free BOOLEAN DEFAULT FALSE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS career_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    plan_code VARCHAR(60) NOT NULL REFERENCES career_subscription_plans(code),
    status VARCHAR(30) DEFAULT 'PENDING' NOT NULL,
    starts_at TIMESTAMP,
    ends_at TIMESTAMP,
    external_customer_reference VARCHAR(160),
    external_subscription_reference VARCHAR(160) UNIQUE,
    cancellation_reason VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_career_subscriptions_user_id ON career_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS ix_career_subscriptions_plan_code ON career_subscriptions (plan_code);
CREATE INDEX IF NOT EXISTS ix_career_subscriptions_status ON career_subscriptions (status);

CREATE TABLE IF NOT EXISTS career_payment_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    subscription_id INTEGER NOT NULL REFERENCES career_subscriptions(id),
    plan_code VARCHAR(60) NOT NULL,
    amount_rwf INTEGER NOT NULL,
    currency VARCHAR(10) DEFAULT 'RWF' NOT NULL,
    provider VARCHAR(80) NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING' NOT NULL,
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    provider_reference VARCHAR(160) UNIQUE,
    provider_payload_json TEXT DEFAULT '{}',
    verified_at TIMESTAMP,
    failure_reason VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_career_payment_transactions_user_id ON career_payment_transactions (user_id);
CREATE INDEX IF NOT EXISTS ix_career_payment_transactions_subscription_id ON career_payment_transactions (subscription_id);
CREATE INDEX IF NOT EXISTS ix_career_payment_transactions_status ON career_payment_transactions (status);

CREATE TABLE IF NOT EXISTS career_generation_usages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    package_id INTEGER NOT NULL UNIQUE REFERENCES career_document_packages(id),
    subscription_id INTEGER REFERENCES career_subscriptions(id),
    entitlement_source VARCHAR(40) NOT NULL,
    status VARCHAR(30) DEFAULT 'RESERVED' NOT NULL,
    reserved_at TIMESTAMP NOT NULL DEFAULT NOW(),
    consumed_at TIMESTAMP,
    released_at TIMESTAMP,
    release_reason VARCHAR(500)
);
CREATE INDEX IF NOT EXISTS ix_career_generation_usages_user_id ON career_generation_usages (user_id);
CREATE INDEX IF NOT EXISTS ix_career_generation_usages_package_id ON career_generation_usages (package_id);
CREATE INDEX IF NOT EXISTS ix_career_generation_usages_subscription_id ON career_generation_usages (subscription_id);
CREATE INDEX IF NOT EXISTS ix_career_generation_usages_status ON career_generation_usages (status);

CREATE TABLE IF NOT EXISTS career_match_analyses (
    id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL UNIQUE REFERENCES career_document_packages(id),
    overall_score FLOAT NOT NULL,
    skills_score FLOAT NOT NULL,
    experience_score FLOAT NOT NULL,
    education_score FLOAT NOT NULL,
    keyword_score FLOAT NOT NULL,
    evidence_score FLOAT NOT NULL,
    analysis_json TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_career_match_analyses_package_id ON career_match_analyses (package_id);

CREATE TABLE IF NOT EXISTS career_quality_reports (
    id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL UNIQUE REFERENCES career_document_packages(id),
    ats_score FLOAT NOT NULL,
    factual_status VARCHAR(40) NOT NULL,
    human_writing_status VARCHAR(40) NOT NULL,
    report_json TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_career_quality_reports_package_id ON career_quality_reports (package_id);

CREATE TABLE IF NOT EXISTS career_ai_usage_logs (
    id SERIAL PRIMARY KEY,
    package_id INTEGER REFERENCES career_document_packages(id),
    user_id INTEGER REFERENCES users(id),
    stage_key VARCHAR(60) NOT NULL,
    provider VARCHAR(80) NOT NULL,
    model VARCHAR(160) NOT NULL,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    latency_ms INTEGER,
    status VARCHAR(30) NOT NULL,
    error_code VARCHAR(80),
    retry_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_career_ai_usage_logs_package_id ON career_ai_usage_logs (package_id);
CREATE INDEX IF NOT EXISTS ix_career_ai_usage_logs_user_id ON career_ai_usage_logs (user_id);
CREATE INDEX IF NOT EXISTS ix_career_ai_usage_logs_stage_key ON career_ai_usage_logs (stage_key);

CREATE TABLE IF NOT EXISTS career_export_records (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES career_documents(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    format VARCHAR(10) NOT NULL,
    version_number INTEGER NOT NULL,
    page_count INTEGER,
    file_size INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_career_export_records_document_id ON career_export_records (document_id);
CREATE INDEX IF NOT EXISTS ix_career_export_records_user_id ON career_export_records (user_id);

CREATE TABLE IF NOT EXISTS career_application_documents (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL UNIQUE REFERENCES applications(id),
    package_id INTEGER NOT NULL REFERENCES career_document_packages(id),
    cv_document_id INTEGER NOT NULL REFERENCES career_documents(id),
    cover_letter_document_id INTEGER REFERENCES career_documents(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_career_application_documents_application_id ON career_application_documents (application_id);
CREATE INDEX IF NOT EXISTS ix_career_application_documents_package_id ON career_application_documents (package_id);

-- Performance: polling the generation endpoint filters stages and AI logs by
-- package + recency. (2026-09)
CREATE INDEX IF NOT EXISTS ix_career_stage_package_status
  ON career_generation_stages (package_id, status);
CREATE INDEX IF NOT EXISTS ix_career_ai_log_package_created
  ON career_ai_usage_logs (package_id, created_at);
CREATE INDEX IF NOT EXISTS ix_career_package_recovery_queue
  ON career_document_packages (status, processing_started_at, requested_at, id);
CREATE INDEX IF NOT EXISTS ix_career_package_user_requested
  ON career_document_packages (user_id, requested_at, id);

-- Career memory: derived, versioned context consumed by every generation path.
-- profile_version is bumped by profile writes; synced_version is the version
-- memory_json was actually built from, so the row is stale when they differ.
CREATE TABLE IF NOT EXISTS career_memories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
    profile_version INTEGER NOT NULL DEFAULT 0,
    synced_version INTEGER NOT NULL DEFAULT -1,
    memory_json TEXT NOT NULL DEFAULT '{}',
    source_fingerprint VARCHAR(128),
    sync_error VARCHAR(500),
    last_synced_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_career_memories_user_id ON career_memories (user_id);
