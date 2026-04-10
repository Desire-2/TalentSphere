# TalentSphere Job Seeker API - Quick Reference Guide

## Endpoint Summary by Category

### 🔐 Authentication (Auth Routes)
| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|----------------|
| `/api/auth/login` | POST | User login | No |
| `/api/auth/register` | POST | User registration | No |
| `/api/auth/refresh` | POST | Refresh JWT token | Yes |
| `/api/auth/logout` | POST | User logout | Yes |

---

### 👤 User Profile (User Routes)
| Endpoint | Method | Purpose | Auth Required | Role |
|----------|--------|---------|----------------|------|
| `/api/users` | GET | Get all users (paginated) | Yes | admin |
| `/api/users/<user_id>` | GET | Get user profile | Yes | - |
| `/api/users/<user_id>` | PUT | Update user profile | Yes | - |
| `/api/users/<user_id>` | DELETE | Delete user account | Yes | admin |
| `/api/profile` | GET | Get current user profile | Yes | - |
| `/api/profile` | PUT | Update job seeker profile | Yes | job_seeker |

---

### 💼 Jobs (Job Routes)
| Endpoint | Method | Purpose | Auth Required | Role |
|----------|--------|---------|----------------|------|
| `/api/jobs` | GET | List all jobs (filtered/paginated) | No | - |
| `/api/jobs/<job_id>` | GET | Get job details | No | - |
| `/api/jobs` | POST | Create job | Yes | employer, admin |
| `/api/jobs/<job_id>` | PUT | Update job | Yes | employer, admin |
| `/api/jobs/<job_id>` | DELETE | Delete job | Yes | employer, admin |
| `/api/public/featured-jobs` | GET | Get featured jobs | No | - |
| `/api/job-categories` | GET | Get job categories | No | - |
| `/api/v2/jobs/search` | GET | Optimized job search | No | - |
| `/api/my-jobs` | GET | Get employer's jobs | Yes | employer |
| `/api/jobs/bulk-action` | POST | Bulk job actions | Yes | employer, admin |
| `/api/jobs/<job_id>/duplicate` | POST | Duplicate job posting | Yes | employer, admin |

---

### 📋 Applications (Application Routes)
| Endpoint | Method | Purpose | Auth Required | Role |
|----------|--------|---------|----------------|------|
| `/api/jobs/<job_id>/apply` | POST | Apply for job | Yes | job_seeker |
| `/api/applications/<app_id>` | GET | Get application details | Yes | - |
| `/api/applications/<app_id>/status` | PUT | Update application status | Yes | employer, admin |
| `/api/applications/<app_id>/withdraw` | POST | Withdraw application | Yes | job_seeker |
| `/api/applications/<app_id>/interview` | POST | Schedule interview | Yes | employer, admin |
| `/api/my-applications` | GET | Get user's applications | Yes | job_seeker |
| `/api/jobs/<job_id>/applications` | GET | Get job applications | Yes | employer, admin |
| `/api/employer/applications` | GET | Get all applicant messages | Yes | employer |
| `/api/application-stats` | GET | Get application statistics | Yes | job_seeker |

---

### 🔔 Notifications (Notification Routes)
| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|----------------|
| `/api/notifications` | GET | Get notifications | Yes |
| `/api/notifications/<notif_id>/read` | POST | Mark as read | Yes |
| `/api/notifications/mark-all-read` | POST | Mark all as read | Yes |
| `/api/notifications/<notif_id>/unread` | POST | Mark as unread | Yes |
| `/api/notifications/<notif_id>` | DELETE | Delete notification | Yes |
| `/api/notifications/bulk-read` | POST | Bulk mark as read | Yes |
| `/api/notifications/bulk-unread` | POST | Bulk mark as unread | Yes |
| `/api/notifications/bulk-delete` | POST | Bulk delete | Yes |
| `/api/notifications/unread-count` | GET | Get unread count | Yes |
| `/api/notifications/stats` | GET | Get notification stats | Yes |
| `/api/messages` | GET | Get messages | Yes |
| `/api/messages` | POST | Send message | Yes |
| `/api/messages/<msg_id>/read` | POST | Mark message as read | Yes |
| `/api/conversations` | GET | Get conversations | Yes |
| `/api/notification-preferences` | GET | Get preferences | Yes |
| `/api/notification-preferences` | PUT | Update preferences | Yes |

---

### 🔔 Enhanced Notifications (Enhanced Notification Routes)
| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|----------------|
| `/api/enhanced-notifications/notifications` | GET | Get enhanced notifications | Yes |
| `/api/enhanced-notifications/notifications` | POST | Create notification | Yes |
| `/api/enhanced-notifications/notifications/<id>/read` | POST | Mark as read | Yes |
| `/api/enhanced-notifications/notifications/<id>` | DELETE | Delete notification | Yes |
| `/api/enhanced-notifications/notifications/mark-all-read` | POST | Mark all read | Yes |
| `/api/enhanced-notifications/notifications/bulk-delete` | POST | Bulk delete | Yes |
| `/api/enhanced-notifications/notification-preferences` | GET | Get preferences | Yes |
| `/api/enhanced-notifications/notification-preferences` | PUT | Update preferences | Yes |
| `/api/enhanced-notifications/notifications/stats` | GET | Get stats | Yes |
| `/api/enhanced-notifications/notifications/test` | POST | Send test notification | Yes |
| `/api/enhanced-notifications/notifications/digest/weekly` | POST | Send weekly digest | Yes |
| `/api/enhanced-notifications/notifications/delivery-logs/<id>` | GET | Get delivery logs | Yes |

---

### 🔔 Job Alerts & Interview Scheduling (Job Alerts Routes)
| Endpoint | Method | Purpose | Auth Required | Role |
|----------|--------|---------|----------------|------|
| `/api/job-alerts` | GET | Get job alerts | Yes | job_seeker |
| `/api/job-alerts` | POST | Create job alert | Yes | job_seeker |
| `/api/job-alerts` | DELETE | Delete job alert | Yes | job_seeker |
| `/api/job-alerts/send` | POST | Send job alert | Yes | admin, employer |
| `/api/job-alerts/interview/schedule` | POST | Schedule interview | Yes | employer, admin |
| `/api/job-alerts/messages/send` | POST | Send message (notification) | Yes | - |
| `/api/job-alerts/welcome/send` | POST | Send welcome email | Yes | admin |
| `/api/job-alerts/system/send` | POST | Send system notification | Yes | admin |

---

### 🎯 Recommendations (Recommendations Routes)
| Endpoint | Method | Purpose | Auth Required | Role |
|----------|--------|---------|----------------|------|
| `/api/recommendations/jobs` | GET | Get job recommendations | Yes | job_seeker |
| `/api/recommendations/candidates` | GET | Get candidate recommendations | Yes | employer, admin |
| `/api/recommendations/similar-jobs` | GET | Get similar jobs | No | - |
| `/api/api-docs` | GET | Get API documentation | No | - |

---

### 📚 Profile Extensions - Work Experience (Profile Routes)
| Endpoint | Method | Purpose | Auth Required | Role |
|----------|--------|---------|----------------|------|
| `/api/profile/work-experience` | GET | Get work experiences | Yes | - |
| `/api/profile/work-experience` | POST | Add experience | Yes | job_seeker |
| `/api/profile/work-experience/<exp_id>` | PUT | Update experience | Yes | job_seeker |
| `/api/profile/work-experience/<exp_id>` | DELETE | Delete experience | Yes | job_seeker |

---

### 📚 Profile Extensions - Education (Profile Routes)
| Endpoint | Method | Purpose | Auth Required | Role |
|----------|--------|---------|----------------|------|
| `/api/profile/education` | GET | Get education records | Yes | - |
| `/api/profile/education` | POST | Add education | Yes | job_seeker |
| `/api/profile/education/<edu_id>` | PUT | Update education | Yes | job_seeker |
| `/api/profile/education/<edu_id>` | DELETE | Delete education | Yes | job_seeker |

---

### 📚 Profile Extensions - Other (Profile Routes)
| Endpoint | Method | Purpose | Auth Required | Role |
|----------|--------|---------|----------------|------|
| `/api/profile/certifications` | GET/POST/PUT/DELETE | Manage certifications | Yes | job_seeker |
| `/api/profile/projects` | GET/POST/PUT/DELETE | Manage projects | Yes | job_seeker |
| `/api/profile/awards` | GET/POST/PUT/DELETE | Manage awards | Yes | job_seeker |
| `/api/profile/languages` | GET/POST/PUT/DELETE | Manage languages | Yes | job_seeker |
| `/api/profile/volunteer-experience` | GET/POST/PUT/DELETE | Manage volunteer work | Yes | job_seeker |
| `/api/profile/memberships` | GET/POST/PUT/DELETE | Manage memberships | Yes | job_seeker |

---

### 📄 CV Builder (CV Builder Routes)
| Endpoint | Method | Purpose | Auth Required | Role |
|----------|--------|---------|----------------|------|
| `/api/cv-builder/generate` | POST | Generate complete CV | Yes | job_seeker |
| `/api/cv-builder/user-data` | GET | Get user data for CV | Yes | job_seeker |
| `/api/cv-builder/styles` | GET | Get available CV styles | No | - |
| `/api/cv-builder/health` | GET | Health check | No | - |
| `/api/cv-builder/generate-incremental` | POST | Generate CV incrementally | Yes | job_seeker |
| `/api/cv-builder/quick-generate` | POST | Quick CV generation | Yes | job_seeker |
| `/api/cv-builder/generate-targeted` | POST | Generate targeted CV | Yes | job_seeker |
| `/api/cv-builder/generate-stream` | GET | Stream CV generation | Yes | job_seeker |
| `/api/cv-builder/parse-job-posting` | POST | Parse job posting | No | - |

---

### 📊 Analytics & Profile Export (Profile Export Routes)
| Endpoint | Method | Purpose | Auth Required | Role |
|----------|--------|---------|----------------|------|
| `/api/profile/keywords-analysis` | GET | Analyze profile keywords | Yes | job_seeker |
| `/api/profile/completeness-analysis` | GET | Profile completeness score | Yes | job_seeker |
| `/api/profile/export-text` | GET | Export profile as text | Yes | job_seeker |
| `/api/profile/export-json` | GET | Export profile as JSON | Yes | job_seeker |
| `/api/profile/tips` | GET | Get profile improvement tips | Yes | job_seeker |

---

### 📍 Bookmarks (Job Routes)
| Endpoint | Method | Purpose | Auth Required | Role |
|----------|--------|---------|----------------|------|
| `/api/jobs/<job_id>/bookmark` | POST | Bookmark a job | Yes | job_seeker |
| `/api/jobs/<job_id>/bookmark` | DELETE | Remove bookmark | Yes | job_seeker |
| `/api/my-bookmarks` | GET | Get bookmarked jobs | Yes | job_seeker |

---

### 🏢 Company (Company Routes)
| Endpoint | Method | Purpose | Auth Required | Role |
|----------|--------|---------|----------------|------|
| `/api/companies` | GET | Get all companies | No | - |
| `/api/companies/<company_id>` | GET | Get company details | No | - |
| `/api/companies` | POST | Create company | Yes | employer, admin |
| `/api/companies/<company_id>` | PUT | Update company | Yes | employer, admin |
| `/api/companies/<company_id>` | DELETE | Delete company | Yes | admin |

---

### ⭐ Featured Ads (Featured Ad Routes)
| Endpoint | Method | Purpose | Auth Required | Role |
|----------|--------|---------|----------------|------|
| `/api/featured-ads` | GET | Get featured ads | No | - |
| `/api/featured-ads/<ad_id>` | GET | Get ad details | No | - |
| `/api/featured-ads` | POST | Create featured ad | Yes | employer |
| `/api/featured-ads/<ad_id>` | PUT | Update featured ad | Yes | employer |
| `/api/featured-ads/<ad_id>` | DELETE | Delete featured ad | Yes | employer |
| `/api/featured-ads/stats` | GET | Get ad statistics | Yes | employer, admin |

---

### 🎓 Scholarships (Scholarship Routes)
| Endpoint | Method | Purpose | Auth Required | Role |
|----------|--------|---------|----------------|------|
| `/api/scholarships` | GET | List scholarships | No | - |
| `/api/scholarships/<id>` | GET | Get scholarship details | No | - |
| `/api/scholarships` | POST | Create scholarship | Yes | external_admin |
| `/api/scholarships/<id>` | PUT | Update scholarship | Yes | external_admin |
| `/api/scholarships/<id>` | DELETE | Delete scholarship | Yes | external_admin |

---

### 🔄 Sharing (Share Routes)
| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|----------------|
| `/api/jobs/<job_id>/share` | POST | Share job | Yes |
| `/api/jobs/<job_id>/shares` | GET | Get job shares | No |
| `/api/scholarships/<id>/share` | POST | Share scholarship | Yes |
| `/api/scholarships/<id>/shares` | GET | Get scholarship shares | No |

---

### ⚙️ Admin (Admin Routes)
| Endpoint | Method | Purpose | Auth Required | Role |
|----------|--------|---------|----------------|------|
| Various admin endpoints | - | Dashboard, users, jobs, applications | Yes | admin |

---

## Common Query Parameters

### Pagination
```
page=1                          # Page number (1-indexed)
per_page=20                     # Items per page (max 100)
```

### Search & Filter
```
search=keyword                  # Search term
category_id=5                   # Filter by category
location=New York              # Location filter
employment_type=full-time      # Employment type
is_remote=true                 # Remote jobs only
featured=true                  # Featured only
salary_min=50000              # Minimum salary
salary_max=100000             # Maximum salary
experience_level=senior        # Experience level
sort_by=created_at            # Sort field
sort_order=desc               # asc or desc
```

### Notification Filters
```
unread_only=true              # Unread notifications only
type=job_alert                # Notification type
```

## Common Request Headers

```
Authorization: Bearer {token}              # JWT token
Content-Type: application/json             # JSON data
X-Requested-With: XMLHttpRequest          # AJAX indicator
```

## Common Response Fields

### Pagination Response
```json
{
  "items": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "pages": 8,
    "has_next": true,
    "has_prev": false
  }
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Additional details",
  "status_code": 400
}
```

## Authentication Token Flow

1. **Login/Register** → Get JWT token
2. **Store Token** → Save in localStorage
3. **Include Token** → Add to `Authorization` header
4. **Token Expiration** → Refresh or redirect to login
5. **Logout** → Clear token from storage

## Rate Limits

- **Standard Endpoints**: 100 req/min per user
- **CV Builder**: 10 req/min (resource-intensive)
- **Public Endpoints**: No limit

## Content Types

- **Input**: `application/json`
- **Output**: `application/json` or `application/pdf` (for CV exports)

## Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Success |
| 201 | Created - New resource created |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate entry |
| 500 | Internal Server Error |

## Frontend API Service Usage

```javascript
import apiService from '../services/api';

// Authentication
apiService.login(email, password);
apiService.register(userData);
apiService.logout();

// Profile
apiService.getProfile();
apiService.updateProfile(profileData);

// Jobs
apiService.getJobs(params);
apiService.getJob(jobId);
apiService.searchJobs(query);
apiService.getJobRecommendations();

// Applications
apiService.applyForJob(jobId, applicationData);
apiService.getMyApplications();
apiService.getApplication(appId);
apiService.withdrawApplication(appId);

// Bookmarks
apiService.bookmarkJob(jobId);
apiService.removeBookmark(jobId);
apiService.getMyBookmarks();

// Notifications
apiService.getNotifications();
apiService.markNotificationRead(notifId);
apiService.getUnreadCount();

// Profile Extensions
apiService.addWorkExperience(data);
apiService.addEducation(data);
apiService.addCertification(data);

// CV Builder
apiService.generateCV(data);
apiService.getCVStyles();

// Analytics
apiService.getApplicationStats();
apiService.getProfileCompletenessAnalysis();
```

---

**Quick Navigation**:
- [Full Documentation](./JOB_SEEKER_DASHBOARD_ENDPOINTS.md)
- Working in TalentSphere? Check [Copilot Instructions](./.github/copilot-instructions.md)
- Backend? Check `backend/README.md`
- Frontend? Check `talentsphere-frontend/README.md`
