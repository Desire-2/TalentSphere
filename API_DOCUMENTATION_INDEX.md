# TalentSphere Job Seeker Dashboard - API Documentation Index

## 📚 Documentation Overview

This index summarizes all available endpoints and documentation for building the TalentSphere job seeker dashboard. Three comprehensive guides have been created:

### 📖 Documentation Files

1. **JOB_SEEKER_DASHBOARD_ENDPOINTS.md** (Main Reference)
   - Complete endpoint reference with all parameters
   - Database models and relationships
   - Authentication flow
   - Error handling
   - Common use cases

2. **QUICK_API_REFERENCE.md** (Quick Lookup)
   - Tabular endpoint summary by category
   - Common query parameters
   - HTTP status codes
   - Frontend service usage examples

3. **DASHBOARD_API_USAGE_GUIDE.md** (Implementation Guide)
   - API call sequences for common workflows
   - Data flow diagrams
   - Response examples
   - Error handling examples
   - Performance optimization strategies

---

## 🎯 Quick Navigation

### By Feature Area

#### Authentication & User Management
- **Login/Register**: `POST /api/auth/login`, `POST /api/auth/register`
- **Profile Management**: `GET/PUT /api/users/<id>`, `GET/PUT /api/profile`
- **Logout**: `POST /api/auth/logout`
- **Token Refresh**: `POST /api/auth/refresh`
- **→ See**: [Authentication Endpoints](JOB_SEEKER_DASHBOARD_ENDPOINTS.md#authentication-endpoints)

#### Job Search & Discovery
- **Get Jobs**: `GET /api/jobs` (with filters, search, pagination)
- **Job Details**: `GET /api/jobs/<job_id>`
- **Featured Jobs**: `GET /api/public/featured-jobs`
- **Job Categories**: `GET /api/job-categories`
- **Optimized Search**: `GET /api/v2/jobs/search`
- **→ See**: [Job Management](JOB_SEEKER_DASHBOARD_ENDPOINTS.md#job-management-endpoints)

#### Job Applications
- **Apply for Job**: `POST /api/jobs/<job_id>/apply`
- **View Applications**: `GET /api/my-applications`
- **Application Details**: `GET /api/applications/<app_id>`
- **Withdraw**: `POST /api/applications/<app_id>/withdraw`
- **Stats**: `GET /api/application-stats`
- **→ See**: [Application Management](JOB_SEEKER_DASHBOARD_ENDPOINTS.md#application-management-endpoints)

#### Job Bookmarks & Alerts
- **Bookmark**: `POST /api/jobs/<job_id>/bookmark`
- **My Bookmarks**: `GET /api/my-bookmarks`
- **Job Alerts**: `GET/POST/DELETE /api/job-alerts`
- **→ See**: [Job Bookmarks & Alerts](JOB_SEEKER_DASHBOARD_ENDPOINTS.md#job-bookmarks--alerts)

#### Notifications & Messaging
- **Get Notifications**: `GET /api/notifications`
- **Mark as Read**: `POST /api/notifications/<id>/read`
- **Get Messages**: `GET /api/messages`
- **Send Message**: `POST /api/messages`
- **Preferences**: `GET/PUT /api/notification-preferences`
- **Enhanced Notifications**: `/api/enhanced-notifications/*`
- **→ See**: [Notification Endpoints](JOB_SEEKER_DASHBOARD_ENDPOINTS.md#notification-endpoints)

#### Profile & Experience Management
- **Work Experience**: `/api/profile/work-experience` (GET/POST/PUT/DELETE)
- **Education**: `/api/profile/education` (GET/POST/PUT/DELETE)
- **Certifications**: `/api/profile/certifications` (GET/POST/PUT/DELETE)
- **Projects**: `/api/profile/projects` (GET/POST/PUT/DELETE)
- **Skills, Languages, Awards**: `/api/profile/*` (similar CRUD)
- **→ See**: [Profile Extensions](JOB_SEEKER_DASHBOARD_ENDPOINTS.md#profile-extensions-endpoints)

#### CV Builder
- **Generate CV**: `POST /api/cv-builder/generate`
- **User Data**: `GET /api/cv-builder/user-data`
- **CV Styles**: `GET /api/cv-builder/styles`
- **Targeted CV**: `POST /api/cv-builder/generate-targeted`
- **Parse Job**: `POST /api/cv-builder/parse-job-posting`
- **Quick Generate**: `POST /api/cv-builder/quick-generate`
- **→ See**: [CV Builder Endpoints](JOB_SEEKER_DASHBOARD_ENDPOINTS.md#cv-builder-endpoints)

#### Analytics & Insights
- **Keywords Analysis**: `GET /api/profile/keywords-analysis`
- **Profile Completeness**: `GET /api/profile/completeness-analysis`
- **Profile Tips**: `GET /api/profile/tips`
- **Export Profile**: `GET /api/profile/export-text`, `GET /api/profile/export-json`
- **→ See**: [Analytics & Export](JOB_SEEKER_DASHBOARD_ENDPOINTS.md#analytics--export-endpoints)

#### AI-Powered Features
- **Job Recommendations**: `GET /api/recommendations/jobs`
- **Similar Jobs**: `GET /api/recommendations/similar-jobs`
- **Candidate Recommendations** (Employer): `GET /api/recommendations/candidates`
- **→ See**: [Recommendations](JOB_SEEKER_DASHBOARD_ENDPOINTS.md#recommendations-endpoints)

---

## 📊 Statistics & Coverage

### Total Endpoints Documented
- **Authentication**: 4 endpoints
- **User & Profile**: 2 base endpoints + job_seeker_profile specific
- **Jobs**: 14+ endpoints (CRUD, search, featured, filters)
- **Applications**: 8+ endpoints (apply, track, withdraw, stats)
- **Notifications**: 16+ endpoints (get, manage, preferences, messages)
- **Profile Extensions**: 30+ endpoints (work, education, certs, projects, etc.)
- **CV Builder**: 9 endpoints (generate, parse, styles)
- **Analytics**: 5+ endpoints (completeness, keywords, tips, export)
- **Recommendations**: 3+ endpoints (jobs, candidates, similar)
- **Job Alerts**: 8+ endpoints (create, send, schedule interviews)
- **Bookmarks**: 3 endpoints
- **Companies & Featured Ads**: 10+ endpoints
- **Scholarships & Sharing**: 8+ endpoints
- **Admin**: Multiple administrative endpoints

**Total: 130+ API endpoints** available for dashboard functionality

### Supported Features
✅ User authentication with JWT  
✅ Job search with advanced filtering  
✅ Application tracking  
✅ Job bookmarks  
✅ Job alerts  
✅ Comprehensive profile management  
✅ Work experience, education, certifications  
✅ Projects, awards, languages, volunteer work  
✅ Professional memberships and references  
✅ Real-time notifications  
✅ Messaging system  
✅ AI-powered job recommendations  
✅ CV/resume generation  
✅ Profile analytics and insights  
✅ Interview scheduling  
✅ Application statistics  
✅ Pagination and filtering  
✅ Caching and optimization  

---

## 🔑 Key Backend Services

### Route Files (API Endpoints)
```
backend/src/routes/
├── auth.py                    # Authentication (login, register, refresh)
├── user.py                    # User profiles (CRUD)
├── job.py                     # Job management (search, create, update)
├── application.py             # Application management (apply, track)
├── notification.py            # Notification system
├── enhanced_notification.py   # Enhanced notifications with templates
├── job_alerts.py              # Job alerts and interview scheduling
├── profile_extensions.py      # Extended profile fields (exp, edu, certs)
├── cv_builder.py              # CV generation and parsing
├── recommendations.py         # AI recommendations
├── profile_export.py          # Profile analytics and export
├── company.py                 # Company management
├── featured_ad.py             # Featured job ads
├── admin.py                   # Admin functions
└── [8 more specialized routes]
```

### Service Files (Business Logic)
```
backend/src/services/
├── notification_templates.py  # Email/notification templates
├── email_service.py           # Email sending (Yahoo SMTP)
├── job_notification_service.py # Job alert notifications
├── job_scheduler.py           # Job processing scheduler
├── notification_scheduler.py   # Notification scheduler
├── job_digest_scheduler.py    # Digest job scheduler
├── cv_builder_service.py      # CV generation logic
├── cv_builder_enhancements.py # Enhanced CV features
└── cleanup_service.py         # Data cleanup
```

### Model Files (Database)
```
backend/src/models/
├── user.py                    # User and JobSeekerProfile
├── job.py                     # Job and JobCategory
├── application.py             # Application and ApplicationActivity
├── notification.py            # Notification, Message, Review
├── profile_extensions.py       # WorkExperience, Education, Certification, etc.
├── featured_ad.py             # FeaturedAd, Payment
├── scholarship.py             # Scholarship management
├── notification_preferences.py # User notification settings
└── company.py                 # Company information
```

---

## 🔄 Common Dashboard Workflows

### 1. Dashboard Load Sequence
```
→ GET /api/users/{user_id}              (Profile)
→ GET /api/my-applications              (Recent apps)
→ GET /api/application-stats            (Stats)
→ GET /api/recommendations/jobs         (Recommendations)
→ GET /api/my-bookmarks                 (Bookmarks)
→ GET /api/notifications                (Notifications)
→ GET /api/public/featured-ads          (Ads)
```
**See**: [Dashboard Initialization Sequence](DASHBOARD_API_USAGE_GUIDE.md)

### 2. Apply for Job
```
→ POST /api/jobs/{job_id}/apply         (Submit app)
→ GET /api/my-applications              (Refresh list)
→ Notifications sent to employer & applicant
```
**See**: [Apply for a Job Workflow](DASHBOARD_API_USAGE_GUIDE.md)

### 3. Improve Profile
```
→ GET /api/profile/completeness-analysis (Analysis)
→ POST /api/profile/work-experience      (Add data)
→ GET /api/profile/keywords-analysis     (Keywords)
→ GET /api/profile/tips                  (Tips)
```
**See**: [Profile Improvement Workflow](DASHBOARD_API_USAGE_GUIDE.md)

### 4. Generate Tailored Resume
```
→ POST /api/cv-builder/parse-job-posting (Parse job)
→ POST /api/cv-builder/generate-targeted (Generate for job)
→ Download or email resume
```
**See**: [Job-Specific CV Generation](DASHBOARD_API_USAGE_GUIDE.md)

### 5. Manage Notifications
```
→ GET /api/notifications                (Get all)
→ POST /api/notifications/{id}/read     (Mark read)
→ PUT /api/notification-preferences     (Configure)
→ POST /api/notifications/mark-all-read (Bulk read)
```

---

## 🛠️ Implementation Examples

### Frontend Usage (React)

```javascript
import apiService from '../services/api';

// Dashboard initialization
const loadDashboard = async () => {
    const [profile, apps, stats, recommendations] = 
        await Promise.allSettled([
            apiService.getProfile(),
            apiService.getMyApplications({ per_page: 10 }),
            apiService.getApplicationStats(),
            apiService.getJobRecommendations({ limit: 6 })
        ]);
};

// Apply for job
const applyForJob = async (jobId, formData) => {
    const response = await apiService.applyForJob(jobId, {
        cover_letter: formData.coverLetter,
        resume_url: formData.resumeUrl,
        portfolio_url: formData.portfolioUrl,
        custom_responses: formData.customAnswers
    });
    return response;
};

// Search jobs
const searchJobs = async (query, filters) => {
    const response = await apiService.getJobs({
        search: query,
        location: filters.location,
        category_id: filters.category,
        salary_min: filters.salaryMin,
        salary_max: filters.salaryMax
    });
    return response;
};
```

### Pagination Example

```javascript
// Get applications with pagination
const getAsyncApplications = async (page = 1, perPage = 10) => {
    const response = await apiService.get(
        `/my-applications?page=${page}&per_page=${perPage}`
    );
    
    return {
        items: response.data.applications,
        pagination: response.data.pagination,
        hasMore: response.data.pagination.has_next
    };
};

// Load more on scroll
const handleScroll = async () => {
    if (atBottomOfList && pagination.has_next) {
        const nextPage = await getApplications(page + 1);
        setApplications([...applications, ...nextPage.items]);
    }
};
```

---

## 📈 Performance Considerations

### Caching Strategy
- **Featured Jobs**: 1 hour cache
- **Job Categories**: 24 hour cache
- **User Profile**: Per-user cache with update invalidation
- **Recommendations**: Session cache (can be stale for 5 min)

### Query Optimization
- **38+ Strategic Database Indexes**
- **Eager Loading**: Uses `joinedload` and `selectinload` for efficiency
- **Batch Operations**: Bulk update and delete for performance
- **Connection Pooling**: 15 default pool size, 25 max overflow

### Response Optimization
- **Pagination**: 20 per page default (max 100)
- **Minimal Mode**: `?minimal=true` for lighter responses
- **Compression**: Gzip enabled for responses
- **Rate Limiting**: 100 req/min standard, 10 req/min for CV builder

---

## 🔐 Authentication & Authorization

### Role Hierarchy
- **Public**: No authentication needed
- **job_seeker**: Can apply, view own profile, bookmarks
- **employer**: Can post jobs, view applications for own jobs
- **admin**: Full access to all resources
- **external_admin**: Manage scholarships

### Protected Endpoints
- Profile endpoints: Required (own profile or admin)
- Application endpoints: Required (applicant or job poster)
- Notification endpoints: Required (own user)
- Job posting: employer/admin only
- Admin endpoints: admin only

### Token Management
```javascript
// Set token on login
localStorage.setItem('token', response.token);

// Include in headers
Authorization: Bearer {token}

// Refresh on expiration
POST /api/auth/refresh

// Clear on logout
localStorage.removeItem('token');
```

---

## 🐛 Error Handling

### Common Errors

| Scenario | Code | Response |
|----------|------|----------|
| Already applied for job | 409 | `"You have already applied for this job"` |
| Application deadline passed | 400 | `"Application deadline has passed"` |
| Token expired | 401 | `"Token expired - Please login again"` |
| Insufficient permissions | 403 | `"Access denied"` |
| Job not found | 404 | `"Job not found"` |
| Invalid parameters | 400 | `"Invalid parameters"` |

### Error Response Format
```json
{
  "error": "Error message",
  "details": "Additional details",
  "status_code": 400
}
```

---

## 📱 Frontend Components Using These Endpoints

**See**: `talentsphere-frontend/src/pages/JobSeekerDashboard.jsx`

Main dashboard calls:
- `apiService.getProfile()`
- `apiService.getMyApplications({ per_page: 10 })`
- `apiService.getMyBookmarks()`
- `apiService.getJobRecommendations({ limit: 6 })`
- `apiService.getApplicationStats()`
- `apiService.getPublicFeaturedAds(3)`

---

## 🚀 Getting Started with Dashboard Development

### 1. Setup & Authentication
- User logs in → `POST /api/auth/login`
- Token stored in localStorage
- Token included in all requests

### 2. Load Dashboard Data
- Make parallel API calls (see Dashboard Initialization)
- Handle loading/error states
- Display data in dashboard widgets

### 3. Implement Core Features
- Job search with filters
- Apply for jobs
- View applications and track status
- Bookmark jobs and create alerts
- Manage profile extensions
- View notifications

### 4. Add Advanced Features
- Generate targeted resumes
- Get job recommendations
- Profile completeness analysis
- Schedule interviews (employer receives)
- Bulk operations on notifications

### 5. Optimization
- Implement pagination
- Use caching where appropriate
- Monitor request performance
- Handle error states gracefully

---

## 📝 Development Patterns

### Profile Extensions Pattern
```python
# All profile extensions follow same pattern:
GET /api/profile/{resource}             # Get list
POST /api/profile/{resource}            # Create
PUT /api/profile/{resource}/<id>        # Update
DELETE /api/profile/{resource}/<id>     # Delete

# Examples:
GET /api/profile/work-experience
POST /api/profile/education
PUT /api/profile/certifications/<id>
DELETE /api/profile/projects/<id>
```

### CRUD Pattern
```python
# Standard CRUD endpoints:
GET /api/{resource}                     # List (paginated)
GET /api/{resource}/<id>                # Get one
POST /api/{resource}                    # Create
PUT /api/{resource}/<id>                # Update
DELETE /api/{resource}/<id>             # Delete

# Applied to:
- Jobs
- Companies
- Applications
- Job Templates
- And more...
```

---

## 🔗 Related Resources

- **Project Setup**: See `.github/copilot-instructions.md`
- **Backend README**: `backend/README.md`
- **Frontend README**: `talentsphere-frontend/README.md`
- **Deployment Guide**: `deploy-production.sh`, `verify_deployment.sh`
- **Performance Dashboard**: `backend/monitor_performance.py`

---

## 📞 Quick Troubleshooting

### "No Authentication Token Found"
→ Ensure token is stored and retrieved from localStorage  
→ Check `api.js` token handling

### "CORS Error"
→ Verify backend CORS configuration in `main.py`  
→ Check `CORS_ORIGINS` environment variable

### "404 on API Endpoint"
→ Verify endpoint path matches frontend service call  
→ Check if blueprint is registered in `main.py`  
→ Ensure correct HTTP method (GET, POST, PUT, DELETE)

### "401 Token Expired"
→ Implement token refresh: `POST /api/auth/refresh`  
→ Or redirect to login

### "Slow Application Load"
→ Use pagination: `per_page=10` instead of `per_page=100`  
→ Use `minimal=true` for lighter responses  
→ Check API logs for slow queries

---

## 📊 Summary Statistics

**Endpoints**: 130+  
**Models**: 10+  
**Services**: 8+  
**Routes**: 25+  
**Database Tables**: 15+  
**Authentication Methods**: JWT (Bearer Token)  
**Supported Roles**: 4 (job_seeker, employer, admin, external_admin)  
**Response Formats**: JSON  
**Pagination**: Yes (configurable 1-100 per page)  
**Caching**: Yes (featured jobs, categories, profiles)  
**Rate Limiting**: Yes (100 req/min standard)  
**Search**: Full-text search (PostgreSQL) + LIKE fallback (SQLite)  
**Sorting**: Multiple fields supported  
**Filtering**: 15+ filter types  

---

**Documentation Created**: April 2026  
**API Version**: 2.0 (Optimized)  
**Status**: Production-Ready  
**Coverage**: 100% of job seeker dashboard endpoints  

---

## 📌 How to Use This Documentation

1. **Quick Lookup**: Use `QUICK_API_REFERENCE.md` for endpoint tables
2. **Detailed Info**: Use `JOB_SEEKER_DASHBOARD_ENDPOINTS.md` for full reference
3. **Implementation**: Use `DASHBOARD_API_USAGE_GUIDE.md` for workflows and examples
4. **This File**: Overview and navigation guide

**Navigation**:
- Looking for specific endpoint? → Check QUICK_API_REFERENCE.md
- Need full details? → Check JOB_SEEKER_DASHBOARD_ENDPOINTS.md
- Building a feature? → Check DASHBOARD_API_USAGE_GUIDE.md
- Want overview? → You're reading it!
