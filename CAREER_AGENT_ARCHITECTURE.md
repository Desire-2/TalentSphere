# AfriTech AI Career Agent — Architecture and Replacement Plan

## Phase 1: current-platform map

### Existing CV implementation to replace

- `talentsphere-frontend/src/pages/jobseeker/CVBuilder.jsx` is the legacy CV
  workspace, exposed at `/jobseeker/cv-builder`.
- `talentsphere-frontend/src/components/cv/` contains three browser-rendered
  templates, a print-window PDF exporter, progress UI, and session-storage
  version history.
- `talentsphere-frontend/src/services/cvBuilderService.js` calls
  `/api/cv-builder/*`; two advertised export endpoints do not exist.
- `backend/src/routes/cv_builder.py` exposes several overlapping synchronous
  generation endpoints. It has no document persistence, package concept,
  cover-letter support, entitlement enforcement, or export authorization.
- `backend/src/services/cv/` used a legacy external-model fallback client and a
  single CV prompt flow. It was replaced rather than extended.
- `backend/src/routes/cv_upload.py` extracts PDF/image text locally, but then
  sent raw extracted text to an external model and could add imported data
  directly to a profile. It did not offer conflict review or a durable import
  record.

The legacy `/api/cv-builder/*`, `/api/profile/cv-*`, old CV components,
`cvBuilderService`, and session-storage versioning will be removed from the
active application. The former browser print path is not a document export
service and will not be retained.

### Reusable platform infrastructure

- Authentication and role authorization: `backend/src/routes/auth.py`.
- Candidate data: `User`, `JobSeekerProfile`, and the normalized profile
  extension tables for experience, education, projects, certifications,
  awards, languages, volunteering, memberships, and references.
- Job data: `Job` and company relationships in `backend/src/models/job.py`.
- Notifications and email: `Notification` plus the notification/email
  services.
- File handling: Vercel Blob helpers exist, but they deliberately write public
  URLs, so they must not be used for private career documents.
- Application service: `backend/src/routes/application.py` is implemented but
  currently not registered in `main.py`; it will be enabled and linked to
  generated document packages.

### Payment finding

There is no active applicant subscription/payment architecture to reuse.
`AdCredit` and `/api/ads/credits/purchase` are employer-only and explicitly a
stub; accepting its result as payment would violate server-verification rules.
The Career Agent therefore has its own domain records and a payment-provider
adapter. It creates a server-side checkout intent only when a configured
provider is available, and unlocks access only after a signed, server-verified
callback. It never trusts frontend success state.

### Migration safety

The repository currently uses `db.create_all()` and has no Alembic history.
The feature uses new tables rather than altering profile or application
columns. This keeps deployment additive and preserves all existing profile
data. A new SQL migration records the additive schema for managed databases.

## Phase 2: target architecture

### Domain model

`CareerProfile` is a normalized intelligence/memory layer over existing
profile tables. It stores only candidate preferences and confirmed career
memory; it does not duplicate or replace the source profile.

`CareerEvidence` records normalized, traceable facts from profile data and
user-confirmed imports. `ImportedCareerDocument` records private uploads,
local extraction, review state, and conflict data.

`CareerTargetJob` holds either an AfriTech job snapshot, an explicitly pasted
job, or a general-CV target. `CareerDocumentPackage` binds one target to its
CV and cover letter. `CareerDocument` has a working document and
`CareerDocumentVersion` has durable snapshots.

`CareerGenerationUsage` is a reservation/consumption ledger. A package first
reserves entitlement in one transaction, consumes it only on successful
completion, and releases it on failure. The user-specific career-profile row
is locked during reservation so concurrent browser tabs cannot consume the
same free package.

`CareerSubscriptionPlan`, `CareerSubscription`, and
`CareerPaymentTransaction` support plans. Seed defaults are centralized in
`career_agent_products.py`: 1,000 RWF/month, 5,000 RWF/6 months, and 8,000
RWF/year. The active paid plan permits new packages for its active period;
the limit is centrally configurable rather than duplicated in frontend code.

`CareerGenerationStage`, `CareerMatchAnalysis`, `CareerQualityReport`,
`CareerAIUsageLog`, and `CareerExportRecord` provide observable progress,
transparent scores, auditability, and export history. `CareerApplicationDocument`
links generated documents to an existing application without changing its
legacy table.

`CareerMemory` is a derived, versioned cache of the candidate context. Profile
writes bump `profile_version`; a row is stale until `synced_version` catches up
(or the profile fingerprint written by the evidence sync changes). Reading a
fresh memory costs two indexed queries instead of re-scanning the profile
tables, and the rebuild is a full deterministic rebuild so a deleted job title
cannot survive as a stale fact. `CareerContextService` is the single entry
point generation and AI assist read it through.

### Generation lifecycle

```
request + idempotency key
        |
transactional entitlement reservation
        |
PENDING -> PROCESSING -> COMPLETED
        |                   |
    release reservation   consume reservation
        |
      FAILED / CANCELLED
```

The background runner persists a real stage before and after each actual
operation. The client polls the generation record; no UI phase is fabricated.
Failed work is retryable using the same package and released reservation.

### AI and factuality architecture

All NVIDIA calls go through one `NvidiaClient` configured solely from server
environment variables. Specialized services use centralized prompt modules:
profile intelligence, job analysis, candidate matching, CV strategy, CV
content, cover letter, humanization, ATS review, and final QA.

AI output is JSON-normalized and schema-validated before downstream use. Each
document entry cites one or more evidence IDs. Factuality validation rejects
unknown evidence IDs, unsupported numeric claims, and uncited generated
content before a final document is saved.

Ordinary file text extraction remains local: PDF, DOCX, TXT/Markdown, RTF,
ODT, and supported image OCR. NVIDIA image reasoning is used only for image
documents where local OCR is insufficient; raw PDF/DOCX/TXT/RTF/ODT content is
not sent to NVIDIA merely to extract text.

### Document and export architecture

The browser edits structured documents through authenticated autosave. Formal
versions are made on manual save, major AI changes, restore, and export.
Server-side renderers create selectable-text A4 PDF, valid editable DOCX, and
TXT responses. No career document is stored in the public Vercel Blob path;
exports require authenticated ownership (or authorized application-employer
access) on every request.

### UI flow

`/jobseeker/career-agent` is an account-native career workspace. It supports
job selection, readiness, transparent match analysis, actual generation
progress, CV/cover-letter editing, version history, exports, and an informed
subscription paywall. Job detail CTAs route to this workspace with the
AfriTech job ID, and completed package CTAs route into the existing
application flow with the selected package attached.

## Delivery status (current phase complete)

Phases 1–6 and the frontend workspace are implemented and verified:

- Orchestrator (`backend/src/services/career_agent/orchestrator.py`): idempotent
  package creation, transactional reservation with per-user row locking, real
  persisted stages, failure release + retry, inline AI assist, server exports.
- API (`backend/src/routes/career_agent.py`): 24 authenticated routes under
  `/api/career-agent/*` covering profile intelligence, local-first import with
  conflict review, job analysis, generation lifecycle with polling, document
  editing/versioning/AI-assist, exports, server-verified subscription payments,
  and admin management. Registered in `main.py` alongside the now-enabled
  application blueprint.
- Schema (`backend/migrations/career_agent_tables.sql`): additive PostgreSQL
  migration matching the SQLAlchemy models.
- Legacy CV builder fully removed: `routes/cv_builder.py`, `routes/cv_upload.py`,
  `services/cv/*`, `services/cv_builder_enhancements.py`, and the frontend
  builder page, components, service, storage util, and upload modal. No
  references remain.
- Frontend: `careerAgentService.js` and the `/jobseeker/career-agent` workspace
  (target selection, readiness, real stage progress, editor with autosave,
  versions, AI assistant, live A4 preview, exports, import review, paywall).
  Job detail CTAs and navigation point to the new workspace.
- Tests: `backend/tests/` — 81 passing, covering free-package entitlement and
  restriction, subscription unlock/expiry, edit/export without consuming
  generations, ownership enforcement, document attachment/download flows,
  upload validation, extraction, renderer formats, AI schema contracts,
  prompt-injection isolation, locking/retry behavior, payment
  configuration, and career-memory build/version/rebuild/fallback/ownership.

Remaining next phases: UI acceptance flows A–G in a running environment and
payment-provider credentials deployment.
