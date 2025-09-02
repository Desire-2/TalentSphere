# External Admin System - TalentSphere

## Overview

The External Admin System allows designated admin users to post jobs from external sources without creating company profiles. This feature is perfect for:

- Job aggregation from multiple sources
- Partner company job postings
- External recruitment campaigns
- Job board integration
- Scraped job listings

## Key Features

### 1. External Admin Role
- New user role: `external_admin`
- Can post jobs without company association
- Manages external job listings
- Limited to their own job postings

### 2. External Jobs
- Jobs with `job_source = 'external'`
- No company profile required
- External company information stored directly in job record
- Supports external application methods

### 3. Enhanced Job Model
- **New fields added:**
  - `external_company_name`: Company name for external jobs
  - `external_company_website`: External company website
  - `external_company_logo`: External company logo URL
  - `job_source`: 'internal' or 'external'
  - `source_url`: Original job posting URL
  - `company_id`: Made nullable for external jobs

## Database Schema Changes

### Users Table
- Added `external_admin` to role enum
- External admins have same privileges as regular admins for job management

### Jobs Table
```sql
-- New columns added
external_company_name VARCHAR(200)     -- Company name for external jobs
external_company_website VARCHAR(255)  -- External company website
external_company_logo VARCHAR(255)     -- External company logo URL
job_source VARCHAR(50) DEFAULT 'internal' -- 'internal' or 'external'
source_url VARCHAR(500)                -- Original job posting URL

-- Modified columns
company_id INTEGER NULL               -- Now nullable for external jobs
```

## API Endpoints

### External Admin Job Management

#### Create External Job
```http
POST /api/jobs
Authorization: Bearer <external_admin_token>
Content-Type: application/json

{
  "title": "Software Engineer",
  "description": "Job description...",
  "external_company_name": "TechCorp",
  "external_company_website": "https://techcorp.com",
  "external_company_logo": "https://techcorp.com/logo.png",
  "source_url": "https://techcorp.com/jobs/engineer",
  "employment_type": "full-time",
  "experience_level": "mid",
  "category_id": 1,
  "location_type": "remote",
  "application_type": "external",
  "application_url": "https://techcorp.com/apply/123"
}
```

#### Get External Jobs
```http
GET /api/external-jobs?page=1&per_page=20&status=published
Authorization: Bearer <external_admin_token>
```

#### Bulk Import External Jobs
```http
POST /api/external-jobs/bulk-import
Authorization: Bearer <external_admin_token>
Content-Type: application/json

{
  "jobs": [
    {
      "title": "Job 1",
      "description": "Description 1",
      "external_company_name": "Company 1",
      "category_id": 1,
      "employment_type": "full-time"
    },
    // ... more jobs
  ]
}
```

### Regular Job Endpoints (Updated)
- All existing job endpoints now support external admin role
- Jobs can be filtered by `job_source` parameter
- External jobs display external company information

## Permission Model

### External Admin Permissions
- ✅ Create external jobs (without company profile)
- ✅ Update their own external jobs
- ✅ Delete their own external jobs
- ✅ View applications for their jobs
- ✅ Bulk import external jobs
- ❌ Modify other users' jobs
- ❌ Access regular admin functions
- ❌ Manage companies or users

### Regular Admin Permissions
- ✅ All external admin permissions
- ✅ Manage all jobs (internal and external)
- ✅ Full system administration
- ✅ User and company management

## Setup Instructions

### 1. Run Database Migration
```bash
cd /home/desire/My_Project/TalentSphere/backend
python migrate_external_admin.py
```

### 2. Create External Admin User
```bash
python create_external_admin.py
```

### 3. Create Sample External Jobs (Optional)
```bash
python create_sample_external_jobs.py
```

### 4. List External Admins/Jobs
```bash
python create_external_admin.py list
python create_sample_external_jobs.py list
```

## Usage Examples

### 1. Job Aggregation Service
External admin can scrape jobs from various job boards and post them as external jobs:

```python
# Example: Scraping and posting external jobs
external_jobs = scrape_jobs_from_board("https://jobboard.com")
for job in external_jobs:
    create_external_job({
        "title": job.title,
        "description": job.description,
        "external_company_name": job.company,
        "source_url": job.original_url,
        "application_url": job.apply_url
    })
```

### 2. Partner Company Integration
Partner companies can provide job feeds that external admins post:

```python
# Example: Partner job feed integration
partner_jobs = fetch_partner_jobs("partner_api_key")
bulk_import_external_jobs(partner_jobs)
```

### 3. Manual External Job Posting
External admins can manually post jobs from companies that don't have TalentSphere profiles:

```python
# Example: Manual external job creation
create_external_job({
    "title": "Senior Developer",
    "external_company_name": "Startup Inc",
    "external_company_website": "https://startup.com",
    "description": "Exciting opportunity...",
    "application_email": "jobs@startup.com"
})
```

## Frontend Integration

### Job Display
External jobs are displayed alongside internal jobs with special indicators:
- External company name shown instead of company profile link
- "External Job" badge or indicator
- External company website link (if provided)
- Application redirects to external URL or email

### Admin Dashboard
External admins get a specialized dashboard with:
- External job management interface
- Bulk import functionality
- External job statistics
- Application tracking for external jobs

## Data Flow

```
1. External Admin logs in
2. Creates/imports external jobs
3. Jobs stored with job_source='external'
4. External company info stored in job record
5. Jobs displayed in public listings
6. Applications handled via external methods
7. External admin tracks applications
```

## Security Considerations

1. **Permission Isolation**: External admins can only manage their own jobs
2. **Data Validation**: All external job data is validated before storage
3. **URL Sanitization**: External URLs are validated and sanitized
4. **Rate Limiting**: Bulk import operations have rate limiting
5. **Audit Logging**: All external admin actions are logged

## Monitoring and Analytics

### Metrics Tracked
- Number of external jobs posted
- External job application rates
- Top external companies
- External vs internal job performance
- External admin activity

### Reports Available
- External job performance report
- External company analytics
- Application source analysis
- External admin productivity report

## Troubleshooting

### Common Issues

1. **Database Migration Fails**
   - Check SQLite compatibility
   - Ensure proper permissions
   - Backup database before migration

2. **External Admin Can't Post Jobs**
   - Verify role assignment
   - Check token permissions
   - Validate required fields

3. **External Jobs Not Displaying**
   - Check job status (should be 'published')
   - Verify is_active = true
   - Check expiry dates

### Debug Commands

```bash
# Check external admin users
python create_external_admin.py list

# List external jobs
python create_sample_external_jobs.py list

# Verify database schema
python -c "from src.main import create_app; from src.models.user import db; app = create_app(); app.app_context().push(); print(db.engine.table_names())"
```

## Future Enhancements

1. **Job Source Management**: Track and manage different job sources
2. **Auto-sync**: Automatic synchronization with external job feeds
3. **Duplicate Detection**: Identify and handle duplicate jobs
4. **Advanced Filtering**: Filter jobs by source, external company, etc.
5. **Bulk Operations**: More bulk management operations
6. **Integration APIs**: REST APIs for external systems integration

## Support

For questions or issues with the External Admin System:

1. Check the troubleshooting section above
2. Review the API documentation
3. Check system logs for error details
4. Verify database schema and permissions

## Version History

- **v1.0.0**: Initial implementation
  - External admin role
  - External job posting
  - Basic external job management
  - Database schema updates
  - Sample data creation scripts
