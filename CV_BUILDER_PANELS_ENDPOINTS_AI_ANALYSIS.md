# CV Builder Analysis

Date: 2026-04-27

## Scope
This document summarizes:
- CV Builder panels and section controls in the frontend
- All CV template sections rendered per template
- Backend CV Builder endpoints and auth/limits
- How the ARIA AI flow works end-to-end
- Related CV upload/parse/autofill endpoints

---

## 1. CV Builder Panels and Controls

Main page component:
- `talentsphere-frontend/src/pages/jobseeker/CVBuilder.jsx`

### Left Sidebar Panels

1. **Target Job**
- Supports modes: `none` (General), `selected` (Browse), `custom`
- In custom mode, supports AI parsing from pasted posting (`full_posting`) and manual editing
- Main custom fields:
  - `title`, `company`, `description`, `requirements`, `required_skills`
- Advanced fields:
  - `preferred_skills`, `experience_level`, `employment_type`, `location`, `education_requirement`

2. **Template**
- Template IDs available to users:
  - `professional`
  - `creative`
  - `modern`

3. **Sections**
- Section IDs sent to backend:
  - `summary`
  - `work`
  - `education`
  - `skills`
  - `projects`
  - `certifications`
  - `awards`
  - `references`
- Required (fixed) sections:
  - `summary`, `work`, `education`, `skills`
- Optional sections:
  - `projects`, `certifications`, `awards`, `references`

### Right-Side Panels

1. **Generation Progress Panel**
- Shows phase progression while generating

2. **CV Preview Panel**
- Renders generated CV with selected template

3. **Job Match Analysis Panel**
- Shows relevance %, matched skills, and skill gaps

4. **How ARIA Built Your CV Panel**
- Expandable AI reasoning panel with tabs:
  - `strategy`
  - `analysis`
  - `decisions`

5. **Version History Modal**
- Restore previously generated versions

6. **ATS Score Breakdown Modal**
- Shows ATS total score, category scores, and improvement recommendations

---

## 2. CV Template Sections (Rendered Output)

Template source:
- `talentsphere-frontend/src/components/cv/CVTemplates.jsx`

### Professional Template
- Professional Summary
- Core Competencies
- Professional Experience
- Education
- Technical Skills
- Certifications & Licences
- Notable Projects
- Awards & Recognition
- References

### Creative Template
- About Me (summary equivalent)
- Superpowers (core competencies equivalent)
- Experience
- Education
- Skills
- Certifications
- Awards
- Projects
- References

### Modern Template
- Summary block
- Core Competencies
- Professional Experience
- Education
- Technical Skills
- Certifications
- Projects
- Awards & Recognition
- References

---

## 3. Backend CV Builder Endpoints

Blueprint base path:
- `backend/src/routes/cv_builder.py`
- Blueprint prefix: `/api/cv-builder`
- Registered in app: `backend/src/main.py`

### Implemented Endpoints

1. `POST /api/cv-builder/generate`
- Auth: required (`token_required`)
- Roles: `job_seeker`, `admin`
- Rate limit: `10 per hour; 50 per day`

2. `GET /api/cv-builder/user-data`
- Auth: required
- Roles: `job_seeker`, `admin`

3. `GET /api/cv-builder/styles`
- Public endpoint

4. `GET /api/cv-builder/health`
- Public endpoint

5. `POST /api/cv-builder/generate-incremental`
- Auth: required
- Roles: `job_seeker`, `admin`

6. `POST /api/cv-builder/quick-generate`
- Auth: required
- Roles: `job_seeker`, `admin`
- Rate limit: `10 per hour; 50 per day`

7. `POST /api/cv-builder/generate-targeted`
- Auth: required
- Roles: `job_seeker`, `admin`

8. `GET /api/cv-builder/generate-stream`
- Auth: required via special SSE token path (`_sse_token_required`)
- Roles: `job_seeker`, `admin`
- Uses query token because browser EventSource cannot set Authorization headers

9. `POST /api/cv-builder/parse-job-posting`
- Auth: required
- Roles: `job_seeker`, `admin`
- Parses raw job text to structured job fields

---

## 4. Frontend API Call Behavior

Frontend API client:
- `talentsphere-frontend/src/services/cvBuilderService.js`

### Actual Runtime Generation Path

1. Try SSE first (`/generate-stream`)
- Uses `EventSource`
- Sends token via query param
- Emits phase updates to UI

2. Fallback to POST (`/quick-generate`)
- Triggered when SSE unsupported or fails
- Uses retry with exponential backoff for retryable failures

3. Ancillary calls used by CVBuilder page
- `GET /user-data`
- `GET /styles`
- `POST /parse-job-posting`

### Notable Legacy Client Methods (Not Backed by Current Routes)
- `download-pdf` call exists in client service
- `preview-html` call exists in client service
- Matching backend endpoints are not present in `cv_builder.py`
- PDF export is currently handled client-side by `CVRenderer` print/export flow

---

## 5. How ARIA AI Works (End-to-End)

Main orchestrator:
- `backend/src/services/cv/cv_builder_service.py`

Prompt strategy builder:
- `backend/src/services/cv/prompt_builder.py`

### Execution Flow

1. **Frontend submits request**
- Includes selected sections, style, and optional job target (`job_id` or `custom_job`)

2. **Backend gathers user profile data**
- `_get_user_profile_data` loads:
  - base user fields
  - `job_seeker_profile`
  - `work_experiences`, `educations`, `certifications`, `projects`, `awards`, `references`
- Redis cache is used with profile cache key and TTL

3. **Job context construction**
- If job selected: `_build_comprehensive_job_data(job)`
- If custom job: `_normalize_custom_job_data(raw)` with skill extraction and inferred metadata
- Optional parser endpoint can pre-structure pasted job posting text

4. **Job matching + tailoring analysis**
- `job_matcher.analyze_match(user_data, job_data)`
- Produces relevance, matching skills, gaps, strategy

5. **Prompt construction with ARIA instructions**
- Full prompt defines an agentic workflow and strict JSON output
- Prompt includes explicit phases:
  - Phase 1: Analyze candidate
  - Phase 2: Decode job posting
  - Phase 3: Strategize narrative
  - Phase 4: Generate CV
  - Phase 5: Self-evaluate ATS rubric

6. **Model call + parsing**
- API client call with retry/fallback logic (`make_request_with_retry`)
- Parse and normalize returned JSON CV structure
- References are injected from profile data to avoid model corruption

7. **Post-processing**
- Validate sections and fill missing sections where possible
- Compute ATS score and optimization tips
- Add metadata and job-match analysis to response

8. **Frontend presentation**
- Displays generated CV via selected template
- Displays job match analysis
- Displays ARIA reasoning (`agent_reasoning`) and quality metadata

---

## 6. Streaming (SSE) Phase Events

`GET /api/cv-builder/generate-stream` emits:
- `analyzing`
- `decoding_job`
- `strategizing`
- `generating`
- `evaluating`
- `complete` (contains cv data and metadata)
- `error` (on exception)

---

## 7. Related CV Upload / Parse / Autofill Endpoints

Registered under:
- `/api/profile` via `cv_upload_bp` in `backend/src/main.py`

Routes in `backend/src/routes/cv_upload.py`:
1. `POST /api/profile/cv-extract`
- Extract raw text from uploaded CV

2. `POST /api/profile/cv-parse`
- Parse CV text with Gemini into structured profile JSON

3. `POST /api/profile/cv-autofill`
- Apply parsed data into profile extension models additively

These are separate from `/api/cv-builder/*`, but complement CV Builder by improving profile completeness before generation.

---

## 8. Key Observations

1. CV Builder uses robust dual-transport generation:
- Primary: SSE streaming
- Fallback: POST with retry/backoff

2. UI and template section systems are aligned around the same core data model:
- summary/work/education/skills/projects/certifications/awards/references

3. Reasoning transparency is implemented:
- `agent_reasoning` is surfaced in UI tabs for strategy, analysis, and decisions

4. Potential cleanup candidate:
- Remove or deprecate `download-pdf` and `preview-html` frontend methods if those backend routes are intentionally retired.

---

## Source Files Reviewed
- `talentsphere-frontend/src/pages/jobseeker/CVBuilder.jsx`
- `talentsphere-frontend/src/components/cv/CVTemplates.jsx`
- `talentsphere-frontend/src/components/cv/CVRenderer.jsx`
- `talentsphere-frontend/src/services/cvBuilderService.js`
- `backend/src/routes/cv_builder.py`
- `backend/src/routes/cv_upload.py`
- `backend/src/services/cv/cv_builder_service.py`
- `backend/src/services/cv/prompt_builder.py`
- `backend/src/main.py`
