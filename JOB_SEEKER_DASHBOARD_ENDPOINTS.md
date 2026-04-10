# TalentSphere Job Seeker Dashboard API Endpoints

## Overview
Complete reference of all backend API endpoints available for job seeker dashboard functionality, including authentication, applications, jobs, notifications, and profile data.

**API Base URL**: `/api`
**Authentication**: Bearer Token (JWT) required for protected endpoints
**Port**: 5001 (Development), Production via Render

---

## Table of Contents
1. [Authentication Endpoints](#authentication-endpoints)
2. [Job Seeker Profile Endpoints](#job-seeker-profile-endpoints)
3. [Job Management Endpoints](#job-management-endpoints)
4. [Application Management Endpoints](#application-management-endpoints)
5. [Notification Endpoints](#notification-endpoints)
6. [Job Bookmarks & Alerts](#job-bookmarks--alerts)
7. [Recommendations Endpoints](#recommendations-endpoints)
8. [Profile Extensions Endpoints](#profile-extensions-endpoints)
9. [CV Builder Endpoints](#cv-builder-endpoints)
10. [Analytics & Export Endpoints](#analytics--export-endpoints)

---

## Authentication Endpoints

### Login
- **Route**: `POST /api/auth/login`
- **Parameters**:
  - `email` (string, required): User email
  - `password` (string, required): User password
- **Response**: 
  ```json
  {
    "token": "jwt_token",
    "user": { user object }
  }
  ```

### Register
- **Route**: `POST /api/auth/register`
- **Parameters**:
  - `email` (string, required): User email
  - `password` (string, required): Password
  - `first_name` (string, required): First name
  - `last_name` (string, required): Last name
  - `role` (string, required): "job_seeker", "employer", "admin"
- **Response**: User object with token

### Refresh Token
- **Route**: `POST /api/auth/refresh`
- **Authentication**: Required (Bearer Token)
- **Parameters**: None
- **Response**: New token

### Logout
- **Route**: `POST /api/auth/logout`
- **Authentication**: Required
- **Response**: Success message

---

## Job Seeker Profile Endpoints

### Get User Profile
- **Route**: `GET /api/users/<user_id>`
- **Authentication**: Required
- **Parameters**: 
  - `user_id` (path parameter, integer): User ID
- **Response**: Complete user profile with job_seeker_profile data
- **Includes**:
  - `name`, `email`, `phone`, `location`
  - `job_seeker_profile`: Professional title, summary, desired position
  - `skills`, `experience_level`, `availability`

### Get My Profile (Current User)
- **Route**: `GET /api/profile`
- **Authentication**: Required
- **Parameters**: None
- **Response**: Current user's complete profile

### Update User Profile
- **Route**: `PUT /api/users/<user_id>`
- **Authentication**: Required
- **Parameters**:
  - `first_name` (string): First name
  - `last_name` (string): Last name
  - `phone` (string): Phone number
  - `bio` (text): User bio
  - `location` (string): Location
  - `profile_picture` (string): Profile image URL
- **Response**: Updated user object

### Update Job Seeker Profile
- **Route**: `PUT /api/profile`
- **Authentication**: Required
- **Role**: job_seeker
- **Parameters**:
  - `professional_title` (string): e.g., "Senior Software Engineer"
  - `professional_summary` (text): Professional summary
  - `desired_position` (string): Target position
  - `preferred_location` (string): Preferred work location
  - `open_to_opportunities` (boolean): Open for opportunities
  - `years_experience` (integer): Years of experience
  - `skills` (string/array): JSON array or comma-separated skills
  - `availability` (string): When available for jobs
  - `employment_preferences` (string): Full-time, part-time, contract
  - `notice_period` (string): Notice period required
- **Response**: Updated job_seeker_profile object

---

## Job Management Endpoints

### Get All Jobs (Public)
- **Route**: `GET /api/jobs`
- **Authentication**: Optional
- **Parameters**:
  - `page` (integer, default: 1): Page number
  - `per_page` (integer, default: 20, max: 100): Results per page
  - `search` (string): Search term (title, description, skills)
  - `category_id` (integer): Filter by category
  - `company_id` (integer): Filter by company
  - `location` (string): Location filter
  - `employment_type` (string): full-time, part-time, contract, internship, freelance
  - `experience_level` (string): entry, mid, senior, executive
  - `salary_min` (integer): Minimum salary filter
  - `salary_max` (integer): Maximum salary filter
  - `is_remote` (boolean): Remote jobs only
  - `featured` (boolean): Featured jobs only
  - `posted_within` (integer): Posted within X days
  - `sort_by` (string): created_at, salary_max, relevant (default: created_at)
  - `sort_order` (string): asc, desc (default: desc)
- **Response**: 
  ```json
  {
    "jobs": [job objects],
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

### Get Featured Jobs (Public)
- **Route**: `GET /api/public/featured-jobs`
- **Authentication**: Optional
- **Parameters**:
  - `limit` (integer, default: 10, max: 50): Number of featured jobs
- **Response**: Featured jobs list with pagination
- **Note**: Response is cached for performance

### Get Job Categories
- **Route**: `GET /api/job-categories`
- **Authentication**: Optional
- **Parameters**:
  - `include_children` (boolean): Include subcategories
  - `parent_only` (boolean): Parent categories only
- **Response**: List of job categories with hierarchical structure

### Get Single Job Details
- **Route**: `GET /api/jobs/<job_id>`
- **Authentication**: Optional
- **Parameters**:
  - `job_id` (path parameter, integer): Job ID
- **Response**: Complete job details including:
  - Job description, requirements, skills
  - Salary information
  - Company details
  - Application settings
  - Custom questions (if applicable)

### Create Job (Employer Only)
- **Route**: `POST /api/jobs`
- **Authentication**: Required
- **Role**: employer, admin
- **Parameters**:
  - `title` (string, required): Job title
  - `description` (text, required): Job description
  - `category_id` (integer, required): Category ID
  - `employment_type` (string, required): Employment type
  - `experience_level` (string): Entry, mid, senior, executive
  - `city` (string): City
  - `state` (string): State
  - `country` (string): Country
  - `is_remote` (boolean, default: false): Remote position
  - `salary_min` (integer): Minimum salary
  - `salary_max` (integer): Maximum salary
  - `salary_currency` (string, default: USD): Currency
  - `required_skills` (array/string): Required skills
  - `preferred_skills` (array/string): Preferred skills
  - `application_deadline` (datetime): Application deadline
  - `requires_resume` (boolean): Resume required
  - `requires_cover_letter` (boolean): Cover letter required
  - `requires_portfolio` (boolean): Portfolio required
  - `custom_questions` (array): Custom application questions
- **Response**: Created job object

### Update Job (Employer Only)
- **Route**: `PUT /api/jobs/<job_id>`
- **Authentication**: Required
- **Role**: employer, admin
- **Parameters**: Same as POST, all optional for updates
- **Response**: Updated job object

### Delete Job (Employer Only)
- **Route**: `DELETE /api/jobs/<job_id>`
- **Authentication**: Required
- **Role**: employer, admin
- **Response**: Success message

### Optimized Job Search (V2)
- **Route**: `GET /api/v2/jobs/search`
- **Authentication**: Optional
- **Parameters**: Same as `/jobs` endpoint
- **Features**:
  - Full-text search optimization
  - Query caching
  - Minimal response option
  - PostgreSQL and SQLite support
- **Response**: Same as regular jobs endpoint with additional performance metrics

---

## Application Management Endpoints

### Apply for Job
- **Route**: `POST /api/jobs/<job_id>/apply`
- **Authentication**: Required
- **Role**: job_seeker
- **Parameters**:
  - `cover_letter` (text): Cover letter text
  - `resume_url` (string): Resume URL/path
  - `portfolio_url` (string): Portfolio URL
  - `additional_documents` (array): Additional document URLs
  - `custom_responses` (object): Answers to custom questions
  - `source` (string): Application source (direct, referral, etc.)
- **Response**: 
  ```json
  {
    "message": "Application submitted successfully",
    "application": { application object }
  }
  ```

### Get My Applications
- **Route**: `GET /api/my-applications`
- **Authentication**: Required
- **Role**: job_seeker
- **Parameters**:
  - `page` (integer, default: 1): Page number
  - `per_page` (integer, default: 20): Results per page
  - `status` (string): Filter by status (submitted, under_review, shortlisted, interviewed, rejected, hired, withdrawn)
  - `sort_by` (string): Sort field (created_at, status, etc.)
- **Response**: List of user's applications with pagination

### Get Application Details
- **Route**: `GET /api/applications/<application_id>`
- **Authentication**: Required
- **Parameters**:
  - `application_id` (path parameter, integer): Application ID
- **Response**: Complete application details including:
  - Applicant info
  - Job details
  - Application content (resume, cover letter)
  - Status and history
  - Employer feedback (if available)
  - Interview information (if scheduled)

### Update Application Status (Employer Only)
- **Route**: `PUT /api/applications/<application_id>/status`
- **Authentication**: Required
- **Role**: employer, admin
- **Parameters**:
  - `status` (string, required): New status
  - `notes` (text): Employer notes
  - `rating` (integer): Rating (1-5)
  - `feedback` (text): Feedback for applicant
- **Response**: Updated application object

### Schedule Interview
- **Route**: `POST /api/applications/<application_id>/interview`
- **Authentication**: Required
- **Role**: employer, admin
- **Parameters**:
  - `interview_date` (date, required): Interview date (YYYY-MM-DD)
  - `interview_time` (time, required): Interview time (HH:MM)
  - `interview_type` (string, required): phone, video, in-person
  - `interview_location` (string): Location or meeting link
  - `duration` (string): Interview duration
  - `notes` (text): Interview notes
- **Response**: Interview scheduling confirmation

### Withdraw Application
- **Route**: `POST /api/applications/<application_id>/withdraw`
- **Authentication**: Required
- **Parameters**:
  - `reason` (text): Reason for withdrawal
- **Response**: Confirmation message

### Get Job Applications (Employer)
- **Route**: `GET /api/jobs/<job_id>/applications`
- **Authentication**: Required
- **Role**: employer, admin
- **Parameters**:
  - `status` (string): Filter by status
  - `page` (integer, default: 1): Page number
  - `per_page` (integer, default: 20): Results per page
  - `sort_by` (string): Sort field
- **Response**: List of applications for specific job

### Get Application Statistics
- **Route**: `GET /api/application-stats`
- **Authentication**: Required
- **Role**: job_seeker
- **Response**: 
  ```json
  {
    "total_applications": 15,
    "pending_applications": 3,
    "interviews_scheduled": 2,
    "offers_received": 1,
    "rejection_rate": 0.15,
    "by_status": {
      "submitted": 5,
      "under_review": 3,
      "shortlisted": 2,
      ...
    }
  }
  ```

---

## Notification Endpoints

### Get Notifications
- **Route**: `GET /api/notifications`
- **Authentication**: Required
- **Parameters**:
  - `page` (integer, default: 1): Page number
  - `per_page` (integer, default: 20, max: 100): Results per page
  - `unread_only` (boolean): Unread notifications only
  - `type` (string): Filter by notification type
- **Response**: List of notifications with pagination

### Mark Notification as Read
- **Route**: `POST /api/notifications/<notification_id>/read`
- **Authentication**: Required
- **Response**: Updated notification object

### Mark All Notifications as Read
- **Route**: `POST /api/notifications/mark-all-read`
- **Authentication**: Required
- **Response**: Count of marked notifications

### Mark Notification as Unread
- **Route**: `POST /api/notifications/<notification_id>/unread`
- **Authentication**: Required
- **Response**: Updated notification object

### Delete Notification
- **Route**: `DELETE /api/notifications/<notification_id>`
- **Authentication**: Required
- **Response**: Success message

### Bulk Mark as Read
- **Route**: `POST /api/notifications/bulk-read`
- **Authentication**: Required
- **Parameters**:
  - `notification_ids` (array): Array of notification IDs
- **Response**: Count of updated notifications

### Bulk Mark as Unread
- **Route**: `POST /api/notifications/bulk-unread`
- **Authentication**: Required
- **Parameters**:
  - `notification_ids` (array): Array of notification IDs
- **Response**: Count of updated notifications

### Bulk Delete Notifications
- **Route**: `POST /api/notifications/bulk-delete`
- **Authentication**: Required
- **Parameters**:
  - `notification_ids` (array): Array of notification IDs
- **Response**: Count of deleted notifications

### Get Unread Count
- **Route**: `GET /api/notifications/unread-count`
- **Authentication**: Required
- **Response**: 
  ```json
  {
    "unread_count": 5,
    "total_count": 45
  }
  ```

### Get Messages
- **Route**: `GET /api/messages`
- **Authentication**: Required
- **Parameters**:
  - `page` (integer, default: 1): Page number
  - `per_page` (integer, default: 20): Results per page
  - `unread_only` (boolean): Unread messages only
- **Response**: List of messages with pagination

### Send Message
- **Route**: `POST /api/messages`
- **Authentication**: Required
- **Parameters**:
  - `recipient_id` (integer, required): Recipient user ID
  - `subject` (string): Message subject
  - `content` (text, required): Message content
- **Response**: Created message object

### Mark Message as Read
- **Route**: `POST /api/messages/<message_id>/read`
- **Authentication**: Required
- **Response**: Updated message object

### Get Conversations
- **Route**: `GET /api/conversations`
- **Authentication**: Required
- **Parameters**:
  - `page` (integer, default: 1): Page number
  - `per_page` (integer, default: 20): Results per page
- **Response**: List of conversations (unique message threads)

### Get Notification Preferences
- **Route**: `GET /api/notification-preferences`
- **Authentication**: Required
- **Response**: User's notification delivery preferences
- **Includes**:
  - Email notifications (enabled/disabled by type)
  - SMS notifications (enabled/disabled by type)
  - Push notifications (enabled/disabled by type)
  - Digest frequency (daily, weekly, none)

### Update Notification Preferences
- **Route**: `PUT /api/notification-preferences`
- **Authentication**: Required
- **Parameters**:
  - `email_notifications` (object): Email preferences by type
  - `sms_notifications` (object): SMS preferences by type
  - `push_notifications` (object): Push preferences by type
  - `digest_frequency` (string): daily, weekly, none
  - `quiet_hours_start` (time): Start of quiet hours
  - `quiet_hours_end` (time): End of quiet hours
- **Response**: Updated preferences object

### Get Notification Statistics
- **Route**: `GET /api/notifications/stats`
- **Authentication**: Required
- **Response**: 
  ```json
  {
    "total_notifications": 100,
    "unread": 5,
    "by_type": {
      "application_status": 30,
      "job_alert": 45,
      "system": 20,
      "promotion": 5
    },
    "by_priority": {
      "low": 10,
      "normal": 70,
      "high": 15,
      "urgent": 5
    }
  }
  ```

### Enhanced Notifications
- **Route**: `GET /api/enhanced-notifications/notifications`
- **Authentication**: Required
- **Features**: Database storage, rich templates, delivery tracking

---

## Job Bookmarks & Alerts

### Bookmark Job
- **Route**: `POST /api/jobs/<job_id>/bookmark`
- **Authentication**: Required
- **Role**: job_seeker
- **Response**: Bookmark confirmation

### Remove Bookmark
- **Route**: `DELETE /api/jobs/<job_id>/bookmark`
- **Authentication**: Required
- **Role**: job_seeker
- **Response**: Success message

### Get My Bookmarks
- **Route**: `GET /api/my-bookmarks`
- **Authentication**: Required
- **Role**: job_seeker
- **Parameters**:
  - `page` (integer, default: 1): Page number
  - `per_page` (integer, default: 20): Results per page
- **Response**: List of bookmarked jobs

### Create Job Alert
- **Route**: `POST /api/job-alerts`
- **Authentication**: Required
- **Role**: job_seeker
- **Parameters**:
  - `name` (string, required): Alert name
  - `keywords` (string): Search keywords
  - `location` (string): Location filter
  - `employment_type` (string): Employment type filter
  - `category_id` (integer): Category filter
  - `experience_level` (string): Experience level filter
  - `salary_min` (integer): Minimum salary
  - `is_remote` (boolean): Remote jobs only
  - `frequency` (string): daily, weekly, immediately
- **Response**: Created job alert object

### Get My Job Alerts
- **Route**: `GET /api/job-alerts`
- **Authentication**: Required
- **Role**: job_seeker
- **Response**: List of user's job alerts

### Update Job Alert
- **Route**: `PUT /api/job-alerts/<alert_id>`
- **Authentication**: Required
- **Parameters**: Same as POST
- **Response**: Updated alert object

### Delete Job Alert
- **Route**: `DELETE /api/job-alerts/<alert_id>`
- **Authentication**: Required
- **Response**: Success message

---

## Recommendations Endpoints

### Get Job Recommendations
- **Route**: `GET /api/recommendations/jobs`
- **Authentication**: Required
- **Role**: job_seeker
- **Parameters**:
  - `limit` (integer, default: 10): Number of recommendations
  - `include_reasoning` (boolean): Include match reasoning
- **Response**: 
  ```json
  {
    "recommendations": [
      {
        "job": { job object },
        "match_score": 85,
        "match_reason": "Matches your skills and experience",
        "matching_points": ["Python", "5+ years experience", "Remote"]
      }
    ]
  }
  ```

### Get Candidate Recommendations (Employer)
- **Route**: `GET /api/recommendations/candidates`
- **Authentication**: Required
- **Role**: employer, admin
- **Parameters**:
  - `limit` (integer, default: 10): Number of recommendations
  - `job_id` (integer): Specific job ID for recommendations
- **Response**: List of candidate recommendations with match scores

### Get Similar Jobs
- **Route**: `GET /api/recommendations/similar-jobs`
- **Authentication**: Optional
- **Parameters**:
  - `job_id` (integer, required): Reference job ID
  - `limit` (integer, default: 5): Number of similar jobs
- **Response**: List of similar jobs with similarity scores

---

## Profile Extensions Endpoints

### Work Experience Management

#### Get Work Experiences
- **Route**: `GET /api/profile/work-experience`
- **Authentication**: Required
- **Response**: List of work experiences, ordered by most recent

#### Add Work Experience
- **Route**: `POST /api/profile/work-experience`
- **Authentication**: Required
- **Role**: job_seeker
- **Parameters**:
  - `job_title` (string, required): Job title
  - `company_name` (string, required): Company name
  - `company_location` (string): Company location
  - `employment_type` (string): Employment type
  - `start_date` (date, required): Start date (YYYY-MM-DD)
  - `end_date` (date): End date (YYYY-MM-DD)
  - `is_current` (boolean): Currently working there
  - `description` (text): Job description
  - `key_responsibilities` (array): Key responsibilities
  - `achievements` (array): Achievements
  - `technologies_used` (array): Technologies used
  - `display_order` (integer): Order for display
- **Response**: Created work experience object

#### Update Work Experience
- **Route**: `PUT /api/profile/work-experience/<experience_id>`
- **Authentication**: Required
- **Parameters**: Same as POST, all optional
- **Response**: Updated work experience object

#### Delete Work Experience
- **Route**: `DELETE /api/profile/work-experience/<experience_id>`
- **Authentication**: Required
- **Response**: Success message

### Education Management

#### Get Education Records
- **Route**: `GET /api/profile/education`
- **Authentication**: Required
- **Response**: List of education records

#### Add Education
- **Route**: `POST /api/profile/education`
- **Authentication**: Required
- **Role**: job_seeker
- **Parameters**:
  - `school_name` (string, required): School/University name
  - `degree` (string, required): Degree (Bachelor's, Master's, PhD, etc.)
  - `field_of_study` (string, required): Field of study
  - `start_date` (date, required): Start date
  - `graduation_date` (date): Graduation date
  - `gpa` (float): GPA
  - `description` (text): Additional details
  - `grade` (string): Grade/Honors
  - `activities` (array): Activities and societies
  - `display_order` (integer): Order for display
- **Response**: Created education object

#### Update Education
- **Route**: `PUT /api/profile/education/<education_id>`
- **Authentication**: Required
- **Parameters**: Same as POST, all optional
- **Response**: Updated education object

#### Delete Education
- **Route**: `DELETE /api/profile/education/<education_id>`
- **Authentication**: Required
- **Response**: Success message

### Certifications Management

#### Get Certifications
- **Route**: `GET /api/profile/certifications`
- **Authentication**: Required
- **Response**: List of certifications

#### Add Certification
- **Route**: `POST /api/profile/certifications`
- **Authentication**: Required
- **Parameters**:
  - `name` (string, required): Certification name
  - `issuing_organization` (string, required): Issuing organization
  - `issue_date` (date): Issue date
  - `expiration_date` (date): Expiration date
  - `credential_id` (string): Credential ID
  - `credential_url` (string): Credential URL
  - `description` (text): Description
- **Response**: Created certification object

#### Update Certification
- **Route**: `PUT /api/profile/certifications/<cert_id>`
- **Authentication**: Required
- **Parameters**: Same as POST, all optional
- **Response**: Updated certification object

#### Delete Certification
- **Route**: `DELETE /api/profile/certifications/<cert_id>`
- **Authentication**: Required
- **Response**: Success message

### Projects Management

#### Get Projects
- **Route**: `GET /api/profile/projects`
- **Authentication**: Required
- **Response**: List of projects

#### Add Project
- **Route**: `POST /api/profile/projects`
- **Authentication**: Required
- **Parameters**:
  - `title` (string, required): Project title
  - `description` (text): Project description
  - `start_date` (date): Start date
  - `end_date` (date): End date
  - `skills_used` (array): Skills used
  - `project_url` (string): Project URL
  - `github_url` (string): GitHub repository URL
  - `media_urls` (array): Media (images, videos)
- **Response**: Created project object

#### Update Project
- **Route**: `PUT /api/profile/projects/<project_id>`
- **Authentication**: Required
- **Parameters**: Same as POST, all optional
- **Response**: Updated project object

#### Delete Project
- **Route**: `DELETE /api/profile/projects/<project_id>`
- **Authentication**: Required
- **Response**: Success message

### Awards & Honors

#### Get Awards
- **Route**: `GET /api/profile/awards`
- **Authentication**: Required
- **Response**: List of awards

#### Add Award
- **Route**: `POST /api/profile/awards`
- **Authentication**: Required
- **Parameters**:
  - `title` (string, required): Award title
  - `awarding_organization` (string): Organization
  - `award_date` (date): Award date
  - `description` (text): Description
- **Response**: Created award object

#### Update Award
- **Route**: `PUT /api/profile/awards/<award_id>`
- **Authentication**: Required
- **Parameters**: Same as POST, all optional
- **Response**: Updated award object

#### Delete Award
- **Route**: `DELETE /api/profile/awards/<award_id>`
- **Authentication**: Required
- **Response**: Success message

### Languages

#### Get Languages
- **Route**: `GET /api/profile/languages`
- **Authentication**: Required
- **Response**: List of languages

#### Add Language
- **Route**: `POST /api/profile/languages`
- **Authentication**: Required
- **Parameters**:
  - `name` (string, required): Language name
  - `proficiency` (string, required): Proficiency level (native, fluent, intermediate, basic)
- **Response**: Created language object

#### Update Language
- **Route**: `PUT /api/profile/languages/<language_id>`
- **Authentication**: Required
- **Parameters**: Same as POST, all optional
- **Response**: Updated language object

#### Delete Language
- **Route**: `DELETE /api/profile/languages/<language_id>`
- **Authentication**: Required
- **Response**: Success message

### Volunteer Experience

#### Get Volunteer Experience
- **Route**: `GET /api/profile/volunteer-experience`
- **Authentication**: Required
- **Response**: List of volunteer positions

#### Add Volunteer Experience
- **Route**: `POST /api/profile/volunteer-experience`
- **Authentication**: Required
- **Parameters**:
  - `organization_name` (string, required): Organization name
  - `role` (string, required): Volunteer role
  - `start_date` (date, required): Start date
  - `end_date` (date): End date
  - `description` (text): Description of work
  - `location` (string): Location
- **Response**: Created volunteer experience object

### Professional Memberships

#### Get Memberships
- **Route**: `GET /api/profile/memberships`
- **Authentication**: Required
- **Response**: List of memberships

#### Add Membership
- **Route**: `POST /api/profile/memberships`
- **Authentication**: Required
- **Parameters**:
  - `organization_name` (string, required): Organization name
  - `membership_level` (string): Membership level
  - `start_date` (date): Start date
  - `end_date` (date): End date
  - `member_id` (string): Member ID
- **Response**: Created membership object

---

## CV Builder Endpoints

### Generate CV (Full)
- **Route**: `POST /api/cv-builder/generate`
- **Authentication**: Required
- **Role**: job_seeker
- **Parameters**:
  - `template` (string): CV template name
  - `style` (string): CV style preference
  - `sections` (array): Sections to include
  - `format` (string): pdf, html, docx
- **Response**: Generated CV content or download link

### Get User Data for CV
- **Route**: `GET /api/cv-builder/user-data`
- **Authentication**: Required
- **Response**: Complete user profile data formatted for CV generation

### Get CV Styles
- **Route**: `GET /api/cv-builder/styles`
- **Authentication**: Optional
- **Response**: Available CV styles and templates

### Health Check
- **Route**: `GET /api/cv-builder/health`
- **Authentication**: Optional
- **Response**: Service health status

### Generate CV Incrementally
- **Route**: `POST /api/cv-builder/generate-incremental`
- **Authentication**: Required
- **Parameters**: Same as full generate
- **Response**: CV sections incrementally

### Quick Generate CV
- **Route**: `POST /api/cv-builder/quick-generate`
- **Authentication**: Required
- **Parameters**: Minimal parameters for quick generation
- **Response**: Quick CV generation result

### Generate Targeted CV
- **Route**: `POST /api/cv-builder/generate-targeted`
- **Authentication**: Required
- **Parameters**:
  - `job_id` (integer): Target job ID
  - Additional CV generation parameters
- **Response**: CV tailored to specific job

### Parse Job Posting
- **Route**: `POST /api/cv-builder/parse-job-posting`
- **Authentication**: Optional
- **Parameters**:
  - `job_posting_text` (string): Job posting content
  - `job_posting_url` (string): Job posting URL
- **Response**: Parsed job requirements and skills

---

## Analytics & Export Endpoints

### Get Keywords Analysis
- **Route**: `GET /api/profile/keywords-analysis`
- **Authentication**: Required
- **Response**: 
  ```json
  {
    "profile_keywords": ["Python", "AWS", "Docker"],
    "keyword_frequency": {
      "Python": 15,
      "AWS": 8,
      "Docker": 6
    },
    "missing_keywords": ["Kubernetes", "GraphQL"],
    "industry_keywords": ["Agile", "DevOps"]
  }
  ```

### Get Profile Completeness Analysis
- **Route**: `GET /api/profile/completeness-analysis`
- **Authentication**: Required
- **Response**: 
  ```json
  {
    "overall_completion_percentage": 75,
    "sections": {
      "personal_info": {
        "percentage": 100,
        "status": "complete",
        "missing_fields": []
      },
      "work_experience": {
        "percentage": 80,
        "status": "partial",
        "missing_fields": ["achievements"]
      }
    },
    "completion_suggestions": []
  }
  ```

### Export Profile as Text
- **Route**: `GET /api/profile/export-text`
- **Authentication**: Required
- **Response**: Profile data as formatted text

### Export Profile as JSON
- **Route**: `GET /api/profile/export-json`
- **Authentication**: Required
- **Response**: Complete profile data as JSON

### Get Profile Tips
- **Route**: `GET /api/profile/tips`
- **Authentication**: Required
- **Response**: Personalized profile improvement tips based on completeness and content

---

## Database Models Supporting Dashboard

### User Model
```
- id (integer, primary key)
- email (string, unique)
- password_hash (string)
- role (enum: job_seeker, employer, admin, external_admin)
- first_name, last_name
- phone, bio, location
- profile_picture
- is_active, is_verified
- created_at, updated_at
- Relationships: applications, notifications, etc.
```

### JobSeekerProfile Model
```
- id (integer, primary key)
- user_id (foreign key to User)
- professional_title
- professional_summary
- desired_position
- preferred_location
- years_experience
- availability
- employment_preferences
- notice_period
- skills (JSON)
- open_to_opportunities (boolean)
```

### Application Model
```
- id (integer, primary key)
- job_id, applicant_id (foreign keys)
- cover_letter, resume_url, portfolio_url
- custom_responses (JSON)
- status (submitted, under_review, shortlisted, interviewed, rejected, hired, withdrawn)
- stage, employer_notes, feedback, rating
- interview_scheduled, interview_datetime, interview_type
- offered_salary, offer_details, offer_expiry
- communication_count, last_communication
- source (direct, referral, job_board, social_media)
- created_at, updated_at, reviewed_at
```

### Job Model
```
- id (integer, primary key)
- company_id, category_id, posted_by (foreign keys)
- title, slug, description, summary
- employment_type, experience_level, education_requirement
- location_type, city, state, country, is_remote
- salary_min, salary_max, salary_currency, salary_period
- required_skills, preferred_skills
- years_experience_min/max
- application_deadline, application_type
- is_featured, is_active, status
- created_at, updated_at, expires_at
```

### Notification Model
```
- id (integer, primary key)
- user_id (foreign key)
- title, message, notification_type
- data (JSON)
- related_job_id, related_application_id, related_company_id
- is_read, is_sent
- send_email, send_sms, send_push
- priority (low, normal, high, urgent)
- scheduled_for
- action_url, action_text
- created_at, read_at, sent_at
```

### JobBookmark Model
```
- id (integer, primary key)
- user_id, job_id (foreign keys)
- created_at
```

### JobAlert Model
```
- id (integer, primary key)
- user_id (foreign key)
- name
- keywords, location, employment_type, category_id
- experience_level, salary_min
- is_remote
- is_active
- frequency (daily, weekly, immediately)
- created_at, updated_at
```

---

## Authentication Flow

1. **Register/Login**: POST to `/api/auth/login` or `/api/auth/register`
2. **Receive Token**: Store JWT token from response
3. **Set Header**: Add `Authorization: Bearer {token}` to all protected requests
4. **Token Expiration**: Use `/api/auth/refresh` to get new token if expired
5. **Logout**: POST to `/api/auth/logout`

---

## Error Responses

### Standard Error Format
```json
{
  "error": "Error message",
  "details": "Additional error details (if applicable)",
  "timestamp": "2024-01-15T10:30:00Z",
  "status_code": 400
}
```

### Common Error Codes
- **400**: Bad Request - Invalid parameters
- **401**: Unauthorized - Missing or invalid token
- **403**: Forbidden - Access denied (insufficient permissions)
- **404**: Not Found - Resource doesn't exist
- **409**: Conflict - Duplicate entry (e.g., already applied)
- **500**: Internal Server Error - Server error

---

## Rate Limiting

- **Default Rate Limit**: 100 requests per minute per user
- **CV Builder Rate Limit**: 10 requests per minute (stricter due to resource)
- **Headers Returned**:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## Pagination

Most list endpoints support pagination with:
- `page` (default: 1, required)
- `per_page` (default: 20, max: 100)

Response includes:
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

---

## Performance Optimization

### Caching
- **Featured Jobs**: Cached for 1 hour
- **Job Categories**: Cached for 24 hours
- **User Profile**: Cached per user with invalidation on update

### Database Optimization
- **Indexes**: 38+ strategic indexes on frequently queried columns
- **Query Optimization**: Efficient joins and selective loading
- **Connection Pooling**: Database connection pool for high concurrency

### Response Optimization
- **Minimal Response Option**: Use `minimal=true` for lighter responses
- **Selective Field Loading**: Request only needed fields when possible
- **Response Compression**: Gzip compression enabled

---

## Common Use Cases

### Dashboard Initialization
1. `GET /api/users/{user_id}` - Get profile
2. `GET /api/my-applications` - Get applications
3. `GET /api/application-stats` - Get stats
4. `GET /api/recommendations/jobs` - Get job recommendations
5. `GET /api/my-bookmarks` - Get bookmarked jobs
6. `GET /api/notifications?unread_only=true` - Get unread notifications

### Job Search & Application
1. `GET /api/jobs?search=keyword&location=city` - Search jobs
2. `POST /api/jobs/{job_id}/application` - Apply
3. `GET /api/my-applications` - View application status
4. `POST /api/jobs/{job_id}/bookmark` - Bookmark job

### Profile Management
1. `PUT /api/users/{user_id}` - Update basic profile
2. `POST /api/profile/work-experience` - Add experience
3. `GET /api/profile/completeness-analysis` - Check completeness
4. `POST /api/cv-builder/generate` - Generate CV

---

## Frontend Service Methods

The frontend uses `apiService` to call these endpoints:

```javascript
// Applications
apiService.applyForJob(jobId, applicationData)
apiService.getMyApplications({ per_page: 10 })
apiService.getApplicationStats()

// Jobs
apiService.getJobs({ search, category, location })
apiService.getPublicFeaturedAds(limit)
apiService.getJobRecommendations({ limit: 6 })

// Profile
apiService.getProfile()
apiService.getMyBookmarks()

// Notifications
apiService.getNotifications()
```

---

**Last Updated**: April 2026
**Version**: 2.0 (Optimized)
**Status**: Production-Ready
