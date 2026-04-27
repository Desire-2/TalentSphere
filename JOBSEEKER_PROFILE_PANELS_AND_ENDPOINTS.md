# Jobseeker Profile Panels, Sections, and Endpoints

## Route and Page
- Frontend route: [talentsphere-frontend/src/App.jsx](talentsphere-frontend/src/App.jsx#L209), [talentsphere-frontend/src/App.jsx](talentsphere-frontend/src/App.jsx#L215)
- Page component: [talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx](talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx)

## API Base Path
- Frontend API base defaults to `/api`: [talentsphere-frontend/src/config/environment.js](talentsphere-frontend/src/config/environment.js#L8)
- Effective endpoint format: `/api` + frontend endpoint path (for example, `/profile/work-experience` becomes `/api/profile/work-experience`)

## Panel and Section Inventory

### 1. Overview Panel
- Personal Information
- Professional Summary
- Job Preferences

References:
- [talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx](talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx#L616)
- [talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx](talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx#L618)
- [talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx](talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx#L622)
- [talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx](talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx#L627)

Endpoints used:
- `GET /api/profile/complete-profile` (initial full load)
- `GET /api/auth/profile` (refresh personal/professional)
- `PUT /api/auth/profile` (save personal information)
- `PUT /api/profile/complete-profile` (save professional summary and preferences)

Frontend call references:
- [talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx](talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx#L93)
- [talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx](talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx#L130)
- [talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx](talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx#L141)
- [talentsphere-frontend/src/pages/jobseeker/sections/PersonalInfoSection.jsx](talentsphere-frontend/src/pages/jobseeker/sections/PersonalInfoSection.jsx#L24)
- [talentsphere-frontend/src/pages/jobseeker/sections/ProfessionalSummarySection.jsx](talentsphere-frontend/src/pages/jobseeker/sections/ProfessionalSummarySection.jsx#L22)
- [talentsphere-frontend/src/pages/jobseeker/sections/PreferencesSection.jsx](talentsphere-frontend/src/pages/jobseeker/sections/PreferencesSection.jsx#L53)

### 2. Experience Panel
- Work Experience

Reference:
- [talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx](talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx#L636)

Endpoints used:
- `GET /api/profile/work-experience`
- `POST /api/profile/work-experience`
- `PUT /api/profile/work-experience/{experience_id}`
- `DELETE /api/profile/work-experience/{experience_id}`

Frontend call references:
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L927)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L931)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L935)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L939)

### 3. Education Panel
- Education
- Certifications

Reference:
- [talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx](talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx#L655)

Endpoints used:
- Education:
- `GET /api/profile/education`
- `POST /api/profile/education`
- `PUT /api/profile/education/{education_id}`
- `DELETE /api/profile/education/{education_id}`
- Certifications:
- `GET /api/profile/certifications`
- `POST /api/profile/certifications`
- `PUT /api/profile/certifications/{cert_id}`
- `DELETE /api/profile/certifications/{cert_id}`

Frontend call references:
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L944)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L948)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L952)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L956)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L961)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L965)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L969)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L973)

### 4. Skills Panel
- Skills & Expertise

Reference:
- [talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx](talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx#L690)

Endpoints used:
- `PUT /api/profile/complete-profile` (skills updates)

Frontend call reference:
- [talentsphere-frontend/src/pages/jobseeker/sections/SkillsSection.jsx](talentsphere-frontend/src/pages/jobseeker/sections/SkillsSection.jsx#L35)

### 5. Projects Panel
- Projects & Portfolio

Reference:
- [talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx](talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx#L709)

Endpoints used:
- `GET /api/profile/projects`
- `POST /api/profile/projects`
- `PUT /api/profile/projects/{project_id}`
- `DELETE /api/profile/projects/{project_id}`

Frontend call references:
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L978)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L982)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L986)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L990)

### 6. Credentials Panel
- Awards & Recognition
- Languages
- Volunteer Experience
- Professional Memberships
- References

Reference:
- [talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx](talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx#L728)

Endpoints used:
- Awards:
- `GET /api/profile/awards`
- `POST /api/profile/awards`
- `PUT /api/profile/awards/{award_id}`
- `DELETE /api/profile/awards/{award_id}`
- Languages:
- `GET /api/profile/languages`
- `POST /api/profile/languages`
- `PUT /api/profile/languages/{language_id}`
- `DELETE /api/profile/languages/{language_id}`
- Volunteer:
- `GET /api/profile/volunteer-experience`
- `POST /api/profile/volunteer-experience`
- `PUT /api/profile/volunteer-experience/{experience_id}`
- `DELETE /api/profile/volunteer-experience/{experience_id}`
- Memberships:
- `GET /api/profile/professional-memberships`
- `POST /api/profile/professional-memberships`
- `PUT /api/profile/professional-memberships/{membership_id}`
- `DELETE /api/profile/professional-memberships/{membership_id}`
- References:
- `GET /api/profile/references`
- `POST /api/profile/references`
- `PUT /api/profile/references/{ref_id}`
- `DELETE /api/profile/references/{ref_id}`

Frontend call references:
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L995)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L999)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L1003)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L1007)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L1012)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L1016)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L1020)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L1024)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L1029)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L1033)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L1037)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L1041)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L1046)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L1050)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L1054)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L1058)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L1093)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L1097)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L1101)
- [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js#L1105)

### 7. Optimize Panel
- Profile Optimization

Reference:
- [talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx](talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx#L786)

Endpoints used:
- `GET /api/profile/completeness-analysis`
- `GET /api/profile/keywords-analysis`

Frontend call references:
- [talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx](talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx#L243)
- [talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx](talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx#L244)

## Header Export Actions on Profile Page
- `GET /api/profile/export-text`
- `GET /api/profile/export-json`

Frontend call references:
- [talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx](talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx#L266)
- [talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx](talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx#L285)

## Backend Route Definitions
- Profile extensions CRUD and complete profile: [backend/src/routes/profile_extensions.py](backend/src/routes/profile_extensions.py)
- Profile analysis/export routes: [backend/src/routes/profile_export.py](backend/src/routes/profile_export.py)
- Auth profile routes: [backend/src/routes/auth.py](backend/src/routes/auth.py#L863)
- Blueprint registration:
- [backend/src/main.py](backend/src/main.py#L186)
- [backend/src/main.py](backend/src/main.py#L190)

## Notes
- `PrivacySection` is imported but not rendered on the enhanced jobseeker profile page: [talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx](talentsphere-frontend/src/pages/jobseeker/EnhancedProfile.jsx#L42)
