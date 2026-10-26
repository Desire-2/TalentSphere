# TalentSphere Audit and Fix Report

Date: 2026-10-08

## Executive Summary

The CV Builder/Career Agent project was audited for broken integrations,
fabricated data, dead controls, inconsistent AI providers, authentication and
delivery gaps, and misleading UI behavior. The identified functional issues
were corrected without committing or creating branches.

## High-Priority Fixes

### AI provider

- All text generation now uses `nvidia/nemotron-3.5-lightning-30b-a3b`.
- The NVIDIA endpoint is fixed to `https://integrate.api.nvidia.com/v1/chat/completions`.
- `NVIDIA_API_KEY` remains server-side only.
- Text requests keep the requested provider profile (streaming against the
  NVIDIA chat-completions endpoint, `top_p=0.95`) but now default to bounded,
  env-driven generation settings (`NVIDIA_MAX_TOKENS=8192`,
  `NVIDIA_TEMPERATURE=0.2`, `NVIDIA_REASONING_BUDGET=2048`,
  `NVIDIA_ENABLE_THINKING=false`). Operators can restore the original
  maximum-throughput profile (16k budget, thinking enabled) per environment.
- The complete document-generation pipeline (profile, job analysis, matching,
  strategy, CV content, cover letter, humanization, ATS review, final QA, and
  the inline writing assistant) now routes through the same streaming text
  provider path instead of the older non-streaming JSON call. The non-streaming
  transport remains only for image-only document extraction.
- A literal `$NVIDIA_API_KEY` placeholder is rejected as
  `AI_PROVIDER_NOT_CONFIGURED` instead of being sent to NVIDIA as a key, and
  package-level auto-retry now applies only to transient provider outages/rate
  limits rather than configuration errors.
- Structured output supports reasoning, tool calls, usage accounting, bounded
  retries, and safe provider error handling.
- Structured responses now accept JSON emitted in either `content` or
  `reasoning_content` (and cleanly ignore duplicate reasoning fallbacks), so
  Role match, Documents, and Final review stages no longer fail when the model
  puts the answer in its reasoning stream.
- Job and scholarship parsing plus job-summary generation now call backend AI
  endpoints instead of exposing provider keys in the browser.
- Gemini, OpenRouter, Google Generative AI, and the obsolete root CV API client
  were removed.
- Image-only extraction retains a separate multimodal model; it is not used for
  text generation.

### Data authenticity

- Removed fabricated scholarship listings, categories, share analytics, and
  user-verification percentages.
- Employer dashboard statistics, application digests, moderation history, and
  export pagination now use real backend data.
- Notification preferences are persisted and honored by email delivery.
- Share, upload, and verification flows use real backend storage/services.

### Authentication and email

- Email verification uses signed 24-hour tokens and real delivery.
- Added backend verification redirect and frontend verification page.
- Password reset delivery status is reported from the backend without leaking
  account existence.

### Payments and admin controls

- Removed fake Stripe/payment-method claims and free-credit purchase behavior.
- Credit purchase now returns `501` until a real provider is configured.
- Company export paginates through the backend.
- Company/job moderation actions persist logs and avoid printing PII.
- Fake admin controls were removed or connected to real routes: company job
  filtering, job details navigation, profile/settings documentation, and
  cache warming.

### Dead or misleading functionality

- Removed unused TinyMCE demo component, dependency, and styles.
- Removed dead external-admin API/account methods that only threw errors.
- Removed simulated autosave, fabricated company website suggestions, and
  duplicate job creation during draft/final submission.
- Replaced fake API fallbacks for interviews, skill gaps, and career insights
  with real endpoint calls or visible errors.

### Document-generation performance

- Existing databases now receive the composite stage/queue indexes
  (`ix_career_stage_package_status`, `ix_career_ai_log_package_created`,
  `ix_career_package_recovery_queue`, `ix_career_package_user_requested`) on
  every startup/initialization path. This removes queue scans behind the slow
  `CareerDocumentPackage`/`CareerGenerationStage` polling queries shown in
  production logs. `db.create_all()` alone does not add indexes to already
  created tables.

### Generation progress and retry

- The Career Agent progress panel no longer stops polling after a phase
  (Role match, Documents, Final review) reports a failure. It keeps checking
  with backoff, so “Try again” actually resumes the visible phase pipeline
  instead of leaving the UI frozen on the failed state.

### Live progress preview and completion notifications

- Each stage row now persists its result metadata (evidence count, extracted
  requirements, match score, template, CV/letter sections, ATS readiness, QA
  checks, rendered documents), and the progress panel renders a live
  per-stage preview while the agent works.
- The page explains that the job continues in the background and the user is
  free to use TalentSphere; notification links open the exact generation via
  `?package_id=<id>`.
- On completion (or failure), the orchestrator sends an in-app notification
  and an email through the existing notification/email pipeline. Failures use
  high priority; notification failures never roll back the package because
  they run after the transaction is committed.
- `NotificationProvider` is auth-aware and mounted globally: it polls only for
  authenticated sessions, stops on logout, and toast actions mark
  notifications read and navigate to their `action_url`.

### NVIDIA latency (measured live against the configured API key)

- A realistic job-analysis call using the previous profile (thinking enabled,
  `reasoning_budget=16384`, `max_tokens=16384`) took **122.9 s** for the same
  structured JSON that the bounded profile returns in **10–16 s**; a trivial
  call was 6.3–13.2 s with thinking on versus ~2–6.5 s with it off.
- Thinking output is the dominant cost: the reasoning pass runs before the
  model emits the JSON answer, and the pipeline runs up to six serial provider
  calls, so a 16k thinking budget made a full generation take many minutes.
- Fixes: `NvidiaClient` now reads bounded env defaults (`NVIDIA_MAX_TOKENS`,
  `NVIDIA_TEMPERATURE`, `NVIDIA_REASONING_BUDGET`, `NVIDIA_ENABLE_THINKING`)
  for every text stage, every caller can still override per call, reasoning is
  capped at half the answer budget, and `complete_structured()`/`complete_text()`
  accept `None` to mean “use the fast env default” instead of hard-coding 16k.
- The JSON-pipeline output is unchanged and still parsed from `content` or
  `reasoning_content` when a reasoning stream is enabled via the environment.
- Re-run calls skip already-persisted analyses (`CareerTargetJob.analysis_json`
  and owned-source reuse), so retries do not re-bill the same stage.

### Database and page-load latency

- The generation worker committed twice per stage boundary. Stage enter now
  persists the heartbeat and PROCESSING row in one commit, and stage exit
  persists SUCCESS together with the post-stage heartbeat, cutting remote
  PostgreSQL round trips by roughly one third.
- The Career Agent workspace previously re-fetched profile, usage, and
  generation lists on every visit and then issued up to two more detail
  requests before painting. The page now renders instantly from a short-lived
  session cache (90 s) and refreshes those values silently in the background,
  so returning visits do not wait on the database at all.
- The progress poll moved from a fixed 5 s cadence to an 8 s base with jitter
  (24 s hidden), reducing DB churn on the remote database while staying
  responsive.
- The loading screen now shows a branded spinner instead of only the skeleton
  shimmer, and the app’s session check (`AuthInitializer`) shows a creative
  animated orbit/badge spinner with bounce dots while `initialize()` runs.

## Validation

- Backend: `63 passed` (two new provider tests cover env overrides and bounded
  reasoning).
- Backend compilation: successful for AI, admin, auth, scholarship,
  notification, payment, email, and provider modules.
- Frontend ESLint on the changed Career Agent/AuthInitializer files: `0 errors`.
- Frontend production build: successful.
- Lockfile check: successful with `pnpm install --lockfile-only --offline`.
- `git diff --check`: passed.
- Provider scan: no remaining Gemini/OpenRouter/Google AI/TinyMCE text stack.
- Live NVIDIA calls were executed against the configured `NVIDIA_API_KEY`
  (bounded profile: 10–16 s realistic stage calls with correct JSON; thinking
  profile: 122.9 s for the same stage) before and after the change. Brevo
  email delivery was not executed because `BREVO_API_KEY` is not configured;
  email notifications are still persisted as in-app notifications.

## Remaining Non-Blocking Debt

- Frontend ESLint still reports 74 existing warnings, mainly React hook
  dependency and Fast Refresh warnings. These were not blindly rewritten
  because adding unstable dependencies can create request loops.
- Backend tests emit 136 SQLAlchemy `LegacyAPIWarning` messages from legacy
  `Query.get()` calls. They do not fail tests and should be migrated
  deliberately to `db.session.get()` in a separate cleanup pass.
- Vite reports large bundle chunks and one dynamic/static `auth.js` import
  warning. This is a performance concern, not a build failure.
- Some legacy console logging remains. Error/warning logging is retained;
  broad log removal should be handled with an observability policy rather
  than deleting diagnostics indiscriminately.
- Frontend build still reports the existing large-chunk warnings (`vendor`
  chunk > 500 kB) and ESLint emits the pre-existing React hook/Fast Refresh
  warnings outside the files changed here. These are performance/refactor
  concerns, not failures.
