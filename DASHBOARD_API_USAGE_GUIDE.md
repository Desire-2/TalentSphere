# TalentSphere Dashboard API Usage Guide

## Dashboard Data Flow Architecture

### Dashboard Initialization Sequence

When a job seeker loads their dashboard, this sequence of API calls occurs:

```
Dashboard Page Load
    ↓
    ├─→ Verify Authentication (localStorage token)
    │   └─→ If expired: Redirect to /login
    │
    ├─→ PARALLEL API CALLS:
    │   ├─→ GET /api/users/{user_id} 
    │   │   └─→ Populate: User profile, name, title, skills
    │   │
    │   ├─→ GET /api/my-applications?per_page=10
    │   │   └─→ Populate: Recent applications list (submitted/under_review)
    │   │
    │   ├─→ GET /api/my-bookmarks
    │   │   └─→ Populate: Bookmarked jobs (to apply later)
    │   │
    │   ├─→ GET /api/application-stats
    │   │   └─→ Populate: Dashboard statistics cards
    │   │       - Total applications
    │   │       - Pending applications
    │   │       - Interviews scheduled
    │   │       - Offers received
    │   │
    │   ├─→ GET /api/recommendations/jobs?limit=6
    │   │   └─→ Populate: Job recommendations based on profile
    │   │
    │   ├─→ GET /api/notifications?page=1&per_page=5
    │   │   └─→ Populate: Recent notifications
    │   │
    │   └─→ GET /api/public/featured-ads?limit=3
    │       └─→ Populate: Featured job ads/promotions
    │
    └─→ Render Dashboard with Data
        ├─→ Profile Card (bio, title, location)
        ├─→ Statistics Cards (applications, interviews, offers)
        ├─→ Recent Applications List
        ├─→ Job Recommendations
        ├─→ Bookmarked Jobs
        ├─→ Interview Schedule
        ├─→ Notifications
        └─→ Featured Ads
```

---

## Common Dashboard Workflows

### 1. Apply for a Job

```
User clicks "Apply" on job listing
    ↓
Display Application Modal with form fields:
    - Resume (can use existing from profile)
    - Cover Letter
    - Custom Answers (if job requires them)
    ↓
POST /api/jobs/{job_id}/apply
    {
        "cover_letter": "...",
        "resume_url": "s3://...",
        "portfolio_url": "...",
        "custom_responses": {...}
    }
    ↓
Response ✓
    ├─→ Application ID created
    ├─→ Notification sent to job poster
    ├─→ Confirmation notification to applicant
    └─→ Application added to "My Applications"
    ↓
GET /api/my-applications  (refresh list)
    ↓
Display confirmation: "Application submitted successfully"
```

### 2. Interview Scheduling (Email from Employer)

```
Employer receives application
    ↓
Employer views application
    GET /api/applications/{app_id}
    ↓
Employer clicks "Schedule Interview"
    ↓
POST /api/job-alerts/interview/schedule
    {
        "application_id": 123,
        "interview_date": "2024-04-15",
        "interview_time": "14:00",
        "interview_type": "video",
        "meeting_link": "https://zoom.us/...",
        "location": "Online"
    }
    ↓
Response ✓
    ├─→ Creates interview record
    ├─→ Sends email notification to job seeker
    └─→ Updates application status
    ↓
Job Seeker's Dashboard Updates
    ├─→ /api/notifications (shows interview scheduled)
    ├─→ /api/my-applications (app shows "interviewed" status)
    └─→ Interview appears in "Interview Schedule" widget
```

### 3. Bookmark & Create Job Alert

```
User on Jobs Search page
    ↓
User finds interesting job
    ├─→ POST /api/jobs/{job_id}/bookmark
    │   └─→ Job added to bookmarks
    │
    └─→ GET /api/my-bookmarks (refresh count)
    
Later, on Dashboard notifications:
    ├─→ Create Alert for similar jobs
    │   POST /api/job-alerts
    │   {
    │       "name": "Python Developer - NYC",
    │       "keywords": "Python,Django",
    │       "location": "New York",
    │       "salary_min": 100000,
    │       "is_remote": false,
    │       "frequency": "daily"
    │   }
    │
    └─→ GET /api/job-alerts (shows all alerts)
        └─→ Display in sidebar: "Job Alerts"
```

### 4. Profile Improvement Workflow

```
User opens Profile Completeness section
    ↓
GET /api/profile/completeness-analysis
    ↓
Response shows:
    - Overall completeness: 65%
    - Missing fields by section:
        - Work Experience: 80% complete
        - Education: 100% complete
        - Skills: 50% complete (needs improvement)
        - Certifications: 0% complete
    ↓
User clicks "Add Skills"
    ↓
POST /api/profile/work-experience
    {
        "job_title": "Senior Developer",
        "company_name": "Tech Corp",
        "start_date": "2022-01-15",
        "end_date": null,
        "is_current": true,
        "key_responsibilities": ["Led team", "Architected system"],
        "achievements": ["Reduced latency by 40%"],
        "technologies_used": ["Python", "Django", "PostgreSQL"]
    }
    ↓
Response ✓
    ├─→ Cache invalidated
    └─→ GET /api/profile/completeness-analysis (recalculate)
    
Later:
    ├─→ GET /api/profile/keywords-analysis
    │   └─→ Shows profile keywords vs. market demand
    │
    └─→ GET /api/profile/tips
        └─→ "Add 3 more certifications to match key job requirements"
```

### 5. Generate Personalized CV

```
User navigates to CV Builder
    ↓
GET /api/cv-builder/user-data
    ↓
Display form to select:
    - CV Template
    - Style preference
    - Sections to include
    - Format (PDF, HTML, DOCX)
    ↓
User clicks "Generate CV"
    ↓
POST /api/cv-builder/generate
    {
        "template": "modern",
        "style": "professional",
        "sections": ["experience", "education", "skills", "projects"],
        "format": "pdf"
    }
    ↓
Response ✓
    └─→ Download CV or email it
```

### 6. Job-Specific CV Generation

```
User reviewing job details
    ↓
User clicks "Generate Targeted Resume"
    ↓
First: POST /api/cv-builder/parse-job-posting
    {
        "job_posting_url": "https://jobs.com/123"
    }
    ↓
Response shows parsed job requirements:
    - Key skills: ["Python", "AWS", "Docker"]
    - Experience level: 5+ years
    - Industries: Tech, Finance
    ↓
POST /api/cv-builder/generate-targeted
    {
        "job_id": 456,
        "template": "modern",
        "format": "pdf"
    }
    ↓
Response ✓
    └─→ CV customized for job
        - Skills reordered by relevance
        - Experience tailored to job requirements
        - Achievements highlighted that match job posting
```

### 7. Notification Management

```
User checks dashboard notifications
    ↓
GET /api/notifications?page=1&per_page=20
    ↓
Display notifications with types:
    - "New application accepted" → Application Status
    - "Interview scheduled" → Interview Reminder
    - "You viewed a job" → Job Alert (system info)
    ↓
User clicks notification
    ├─→ Notification status updated
    │   POST /api/notifications/{notif_id}/read
    │   └─→ Removes "New" badge
    │
    └─→ Redirected to related item:
        - "application_status" → /applications/{app_id}
        - "interview_reminder" → /my-applications (filter interviews)
        - "job_alert" → /jobs/{job_id}
    
User bulk operations:
    ├─→ POST /api/notifications/mark-all-read
    ├─→ POST /api/notifications/bulk-delete
    │   {"notification_ids": [1, 2, 3, 4, 5]}
    └─→ PUT /api/notification-preferences
        {
            "email_notifications": {
                "job_alert": true,
                "application_status": false
            },
            "digest_frequency": "weekly"
        }
```

---

## Data Models & Relationships

### Job Seeker Dashboard Data Structure

```
User
├── JobSeekerProfile
│   ├── Professional Title
│   ├── Summary
│   ├── Desired Position
│   ├── Skills (JSON array)
│   ├── Years of Experience
│   └── Preferred Locations
│
├── WorkExperiences (1-to-Many)
│   ├── Job Title
│   ├── Company
│   ├── Dates
│   ├── Responsibilities
│   └── Achievements
│
├── Educations (1-to-Many)
│   ├── School Name
│   ├── Degree
│   ├── Field of Study
│   └── Graduation Date
│
├── Certifications (1-to-Many)
│   ├── Name
│   ├── Organization
│   └── Expiry Date
│
├── Projects (1-to-Many)
│   ├── Title
│   ├── Description
│   ├── Tech Stack
│   └── URLs
│
├── Applications (1-to-Many)
│   ├── Job (reference)
│   ├── Status (submitted, under_review, interviews, etc.)
│   ├── Cover Letter
│   ├── Resume
│   └── Interview Details
│
├── JobBookmarks (1-to-Many)
│   └── Job (reference)
│
├── JobAlerts (1-to-Many)
│   ├── Keywords
│   ├── Filters (location, salary, etc.)
│   └── Frequency
│
├── Notifications (1-to-Many)
│   ├── Title
│   ├── Message
│   ├── Type
│   └── Related Job/Application
│
└── NotificationPreferences
    ├── Email settings by type
    ├── SMS/Push settings
    └── Digest frequency
```

---

## Response Data Examples

### GET /api/my-applications Response

```json
{
  "applications": [
    {
      "id": 123,
      "job_id": 456,
      "applicant_id": 789,
      "job": {
        "id": 456,
        "title": "Senior Python Developer",
        "company": {
          "id": 10,
          "name": "TechCorp",
          "logo_url": "https://..."
        },
        "location": "San Francisco, CA",
        "salary_min": 120000,
        "salary_max": 180000
      },
      "status": "under_review",
      "status_display": "Under Review",
      "status_color": "yellow",
      "created_at": "2024-03-10T14:30:00Z",
      "updated_at": "2024-03-12T09:00:00Z",
      "days_since_application": 2,
      "interview_scheduled": false,
      "last_communication": "2024-03-11T10:00:00Z",
      "communication_count": 1
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 10,
    "total": 24,
    "pages": 3,
    "has_next": true,
    "has_prev": false
  }
}
```

### GET /api/application-stats Response

```json
{
  "total_applications": 24,
  "pending_applications": 5,
  "interviews_scheduled": 3,
  "offers_received": 2,
  "rejection_rate": 0.21,
  "by_status": {
    "submitted": 8,
    "under_review": 5,
    "shortlisted": 4,
    "interviewed": 3,
    "rejected": 3,
    "hired": 1,
    "withdrawn": 0
  },
  "recent_activity": {
    "last_application": "2024-03-10T14:30:00Z",
    "last_interview": "2024-03-08T10:00:00Z",
    "last_offer": "2024-02-28T16:00:00Z"
  }
}
```

### GET /api/recommendations/jobs Response

```json
{
  "recommendations": [
    {
      "job": {
        "id": 500,
        "title": "Full Stack Developer",
        "company": {
          "name": "StartupXYZ",
          "logo_url": "https://..."
        },
        "location": "Remote",
        "employment_type": "full-time",
        "salary_min": 100000,
        "salary_max": 140000,
        "required_skills": ["Python", "React", "Docker"],
        "created_at": "2024-03-13T00:00:00Z"
      },
      "match_score": 87,
      "match_reason": "Matches your Python and Docker experience, and you prefer remote roles",
      "matching_points": [
        "Python - 5 years experience",
        "Remote position - matches your preference",
        "Salary range $100-140k - matches your expectation"
      ],
      "skill_gaps": [
        "React (desired, not required)"
      ]
    }
  ]
}
```

### GET /api/profile/completeness-analysis Response

```json
{
  "overall_completion_percentage": 68,
  "sections": {
    "personal_info": {
      "percentage": 100,
      "status": "complete",
      "missing_fields": [],
      "fields": {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "location": "San Francisco, CA"
      }
    },
    "professional_profile": {
      "percentage": 70,
      "status": "partial",
      "missing_fields": ["professional_summary"],
      "fields": {
        "professional_title": "Senior Software Engineer",
        "desired_position": "Tech Lead"
      }
    },
    "work_experience": {
      "percentage": 80,
      "status": "partial",
      "missing_fields": ["current_role_achievements"],
      "count": 3
    },
    "education": {
      "percentage": 100,
      "status": "complete",
      "count": 2
    },
    "skills": {
      "percentage": 60,
      "status": "partial",
      "missing_fields": [],
      "count": 8
    },
    "certifications": {
      "percentage": 0,
      "status": "empty",
      "missing_fields": ["any_certifications"]
    },
    "projects": {
      "percentage": 50,
      "status": "partial",
      "missing_fields": [],
      "count": 1
    }
  },
  "completion_suggestions": [
    "Add a professional summary (200-300 characters) to stand out",
    "Add 2-3 more certifications relevant to your field",
    "Expand your current role achievements",
    "Add 2 more notable projects"
  ],
  "impact": {
    "profile_strength": "Strong - 68% is above average",
    "application_impact": "More profile completeness leads to 40% higher response rates",
    "recommendation": "Focus on adding 3-5 more certifications to reach 85%"
  }
}
```

---

## Error Handling Examples

### Job Already Applied

```
POST /api/jobs/456/apply
↓
Response 409 Conflict
{
  "error": "You have already applied for this job",
  "details": "Application ID: 789 submitted on 2024-03-10"
}
```

### Application Deadline Passed

```
POST /api/jobs/456/apply
↓
Response 400 Bad Request
{
  "error": "Application deadline has passed",
  "details": "Deadline was 2024-03-15T23:59:59Z"
}
```

### Insufficient Permissions

```
PUT /api/applications/123/status
(as job_seeker who didn't post the job)
↓
Response 403 Forbidden
{
  "error": "You can only manage applications for your own jobs",
  "details": "This job was posted by a different employer"
}
```

### Authentication Failed

```
GET /api/my-applications
(with expired token)
↓
Response 401 Unauthorized
{
  "error": "Token expired",
  "details": "Please login again"
}
↓
Frontend Action:
    - Clear localStorage
    - Emit 'session-expired' event
    - Redirect to /login?returnTo=/dashboard
```

---

## Performance Optimization Strategies

### 1. Request Batching
```javascript
// Instead of 6 sequential requests:
const profile = await apiService.getProfile();
const apps = await apiService.getMyApplications();
const stats = await apiService.getApplicationStats();

// Use Promise.allSettled for parallel requests:
const [profile, apps, stats] = await Promise.allSettled([
    apiService.getProfile(),
    apiService.getMyApplications(),
    apiService.getApplicationStats()
]);
```

### 2. Pagination
```javascript
// Load only what's needed:
apiService.getMyApplications({ page: 1, per_page: 10 })
// Only load more on scroll
```

### 3. Caching
```javascript
// Featured jobs are cached for 1 hour
GET /api/public/featured-jobs
    ↓
Response includes: "cached": true

// Job categories cached for 24 hours
GET /api/job-categories
```

### 4. Minimal Response Mode
```javascript
// Request only needed fields
GET /api/v2/jobs/search?minimal=true
    ↓
Response: Lighter payload with essential fields only
```

---

## Dashboard State Management

### Local State
```javascript
const [dashboardData, setDashboardData] = useState({
    profile: {},           // User profile + job seeker profile
    stats: {},            // Application statistics
    applications: [],     // Recent applications list
    bookmarkJobs: [],     // Bookmarked jobs
    notifications: [],    // Recent notifications
    recommendations: [],  // Job recommendations
    careerInsights: {}    // Market data, salary trends
});
```

### Refresh Triggers
```javascript
// Refresh on:
- Route change to dashboard
- New application submitted
- Application status updated (notification received)
- Profile updated
- Job bookmarked/removed
- Notification marked as read

// Automatic refresh:
- Every 5 minutes (optional)
- On window focus (when user returns to tab)
```

---

## Related Documentation

- **API Documentation**: `JOB_SEEKER_DASHBOARD_ENDPOINTS.md`
- **Quick Reference**: `QUICK_API_REFERENCE.md`
- **Backend Setup**: `backend/README.md`
- **Frontend Setup**: `talentsphere-frontend/README.md`
- **Architecture**: `.github/copilot-instructions.md`

---

**Last Updated**: April 2026
**API Version**: 2.0 (Optimized)
**Status**: Production-Ready
