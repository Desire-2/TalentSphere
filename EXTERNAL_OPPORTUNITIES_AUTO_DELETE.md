# External Opportunities Auto-Delete System

## Overview

Automated cleanup service that removes expired external jobs and scholarships from the database to maintain data hygiene. External opportunities (sourced from external job boards, scholarship databases, etc.) are automatically deleted **1 day after their application deadline** has passed.

## Key Features

- ✅ **Automatic Cleanup**: Runs every 12 hours automatically when the application starts
- ✅ **Grace Period**: 1-day buffer after deadline before deletion
- ✅ **Cascade Deletion**: Automatically removes related records (applications, bookmarks, etc.)
- ✅ **Admin Control**: Manual cleanup triggers via API endpoints
- ✅ **CLI Tool**: Standalone script for manual execution
- ✅ **Statistics**: View cleanup stats and eligible items before deletion
- ✅ **Health Monitoring**: Service status and health check endpoints

## Architecture

### Components

```
backend/
├── src/
│   ├── services/
│   │   └── cleanup_service.py          # Core cleanup logic
│   ├── routes/
│   │   └── cleanup_routes.py           # Admin API endpoints
│   └── main.py                         # Service initialization
└── cleanup_expired.py                  # CLI tool for manual cleanup
```

### Service Flow

```
Application Startup
    ↓
Initialize CleanupService
    ↓
Start Background Thread (runs every 12 hours)
    ↓
Calculate Cutoff Date (now - grace_period)
    ↓
Query Eligible Items
    ↓
Delete External Jobs & Scholarships
    ↓
Cascade Delete Related Records
    ↓
Log Results
    ↓
Wait 12 hours → Repeat
```

## Technical Details

### Deletion Criteria

#### External Jobs
Deleted when ALL of the following are true:
- `job_source = 'external'`
- Either:
  - `application_deadline <= cutoff_date` (1 day ago), OR
  - `expires_at <= cutoff_date` (1 day ago)

#### External Scholarships
Deleted when ALL of the following are true:
- `scholarship_source = 'external'`
- `application_deadline <= cutoff_date` (1 day ago)

### Grace Period

**Default**: 1 day after deadline

```python
cutoff_date = datetime.utcnow() - timedelta(days=grace_period_days)
```

This means an opportunity with a deadline of **Jan 15, 2025** will be deleted:
- On **Jan 17, 2025** (or later, depending on when the cleanup runs)

### Automatic Cleanup Schedule

**Interval**: Every 12 hours
**Thread Type**: Background daemon thread
**Startup**: Automatic when Flask app starts

```python
# In main.py
if __name__ == '__main__':
    # ... other initializations
    start_cleanup_service()  # Starts automatically
```

## Admin API Endpoints

All endpoints require admin authentication (`@token_required` + `@role_required('admin')`).

### 1. Get Cleanup Statistics

```http
GET /api/cleanup/stats
Authorization: Bearer <admin_token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "jobs": {
      "total_external": 245,
      "eligible_for_deletion": 12,
      "active": 233
    },
    "scholarships": {
      "total_external": 89,
      "eligible_for_deletion": 5,
      "active": 84
    },
    "cutoff_date": "2025-01-16T10:30:00",
    "grace_period_days": 1,
    "total_eligible_for_deletion": 17
  }
}
```

### 2. Run Full Cleanup

```http
POST /api/cleanup/run
Authorization: Bearer <admin_token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "jobs_deleted": 12,
    "scholarships_deleted": 5,
    "total_deleted": 17,
    "cutoff_date": "2025-01-16T10:30:00"
  },
  "message": "Cleanup completed successfully"
}
```

### 3. Cleanup Jobs Only

```http
POST /api/cleanup/jobs
Authorization: Bearer <admin_token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "deleted_count": 12,
    "cutoff_date": "2025-01-16T10:30:00"
  },
  "message": "Jobs cleanup completed successfully"
}
```

### 4. Cleanup Scholarships Only

```http
POST /api/cleanup/scholarships
Authorization: Bearer <admin_token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "deleted_count": 5,
    "cutoff_date": "2025-01-16T10:30:00"
  },
  "message": "Scholarships cleanup completed successfully"
}
```

### 5. Service Status

```http
GET /api/cleanup/service/status
Authorization: Bearer <admin_token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "is_running": true,
    "check_interval_hours": 12,
    "grace_period_days": 1,
    "last_cleanup": "2025-01-17T02:30:00"
  }
}
```

### 6. Health Check (Public)

```http
GET /api/cleanup/health
```

**Response**:
```json
{
  "status": "healthy",
  "service": "cleanup",
  "timestamp": "2025-01-17T10:30:00"
}
```

## CLI Tool Usage

### Make Executable (First Time)

```bash
cd backend
chmod +x cleanup_expired.py
```

### Run Full Cleanup

```bash
# From backend directory
python cleanup_expired.py

# Or directly
./cleanup_expired.py
```

**Output**:
```
================================================================================
AFRITECH OPPORTUNITIES - CLEANUP SERVICE
================================================================================
Started at: 2025-01-17T10:30:00
Cleanup type: all
--------------------------------------------------------------------------------

📊 PRE-CLEANUP STATISTICS:
  External Jobs:
    - Total: 245
    - Eligible for deletion: 12
  External Scholarships:
    - Total: 89
    - Eligible for deletion: 5
  Cutoff Date: 2025-01-16T10:30:00
  Grace Period: 1 days

🧹 RUNNING CLEANUP...
--------------------------------------------------------------------------------

🗑️  Cleaning up external jobs...
   ✅ Deleted 12 external jobs

🗑️  Cleaning up external scholarships...
   ✅ Deleted 5 external scholarships

================================================================================
CLEANUP SUMMARY
================================================================================
Jobs deleted: 12
Scholarships deleted: 5
Total deleted: 17
Completed at: 2025-01-17T10:30:15
================================================================================
```

### Cleanup Jobs Only

```bash
python cleanup_expired.py --type jobs
```

### Cleanup Scholarships Only

```bash
python cleanup_expired.py --type scholarships
```

### View Statistics Only (No Deletion)

```bash
python cleanup_expired.py --stats-only
```

**Output**:
```
================================================================================
CLEANUP STATISTICS
================================================================================
External Jobs:
  Total: 245
  Eligible for deletion: 12
  Active: 233

External Scholarships:
  Total: 89
  Eligible for deletion: 5
  Active: 84

Cutoff Date: 2025-01-16T10:30:00
Grace Period: 1 days
Total Eligible for Deletion: 17
================================================================================
```

### CLI Options

```bash
python cleanup_expired.py --help
```

```
usage: cleanup_expired.py [-h] [--type {all,jobs,scholarships}] [--stats-only]

Cleanup expired external opportunities

optional arguments:
  -h, --help            show this help message and exit
  --type {all,jobs,scholarships}
                        Type of cleanup to perform (default: all)
  --stats-only          Only show statistics without deleting
```

## Configuration

### Change Grace Period

Edit `backend/src/services/cleanup_service.py`:

```python
class CleanupService:
    def __init__(self, grace_period_days=1):  # Change default here
        self.grace_period_days = grace_period_days
```

### Change Cleanup Interval

Edit `backend/src/services/cleanup_service.py`:

```python
class CleanupService:
    def __init__(self, grace_period_days=1, check_interval_hours=12):  # Change here
        self.check_interval_hours = check_interval_hours
```

## Database Impact

### Cascade Deletions

When an external job or scholarship is deleted, the following related records are **automatically deleted** via SQLAlchemy cascade rules:

**For Jobs**:
- Job applications
- Job bookmarks/saved jobs
- Notification preferences for that job

**For Scholarships**:
- Scholarship applications
- Scholarship bookmarks/saved scholarships
- Notification preferences for that scholarship

### Example SQL

```sql
-- Jobs deletion query
DELETE FROM jobs 
WHERE job_source = 'external' 
  AND (application_deadline <= '2025-01-16 10:30:00' 
       OR expires_at <= '2025-01-16 10:30:00');

-- Scholarships deletion query
DELETE FROM scholarships 
WHERE scholarship_source = 'external' 
  AND application_deadline <= '2025-01-16 10:30:00';
```

## Monitoring & Logging

### Application Logs

```bash
# Service startup
✅ Cleanup service started successfully

# Scheduled cleanup execution
🧹 Running scheduled cleanup...
🗑️  Deleted 12 external jobs
🗑️  Deleted 5 external scholarships
✅ Cleanup completed: 17 items deleted

# No items to delete
ℹ️  No external jobs to clean up
ℹ️  No external scholarships to clean up
```

### Service Status Check

```python
from src.services.cleanup_service import get_cleanup_service

service = get_cleanup_service()
print(f"Service running: {service.is_running}")
print(f"Check interval: {service.check_interval_hours} hours")
print(f"Grace period: {service.grace_period_days} days")
```

## Testing

### 1. Test Service Startup

```bash
cd backend
python src/main.py
```

**Expected in logs**:
```
✅ Job digest scheduler started
✅ Cleanup service started successfully
 * Running on http://0.0.0.0:5001
```

### 2. Test Statistics Endpoint

```bash
# Get admin token first
TOKEN="<your_admin_token>"

# Get stats
curl -X GET http://localhost:5001/api/cleanup/stats \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Test Manual Cleanup

```bash
# Via API
curl -X POST http://localhost:5001/api/cleanup/run \
  -H "Authorization: Bearer $TOKEN"

# Via CLI
python cleanup_expired.py --stats-only
python cleanup_expired.py --type all
```

### 4. Test Automatic Cleanup

```python
# Create test external job with old deadline
from datetime import datetime, timedelta
from src.models.job import Job
from src.models.user import db

old_deadline = datetime.utcnow() - timedelta(days=2)
test_job = Job(
    title="Test Expired Job",
    job_source="external",
    application_deadline=old_deadline,
    # ... other fields
)
db.session.add(test_job)
db.session.commit()

# Wait for cleanup or trigger manually
# Verify job is deleted
```

## Troubleshooting

### Service Not Starting

**Check logs**:
```bash
grep "Cleanup service" backend/logs/app.log
```

**Verify initialization**:
```python
# In main.py
from src.services.cleanup_service import start_cleanup_service
start_cleanup_service()  # Should be called
```

### Items Not Being Deleted

**Check cutoff date**:
```python
from datetime import datetime, timedelta
grace_period = 1
cutoff = datetime.utcnow() - timedelta(days=grace_period)
print(f"Cutoff: {cutoff}")
# Items must have deadline BEFORE this date
```

**Verify source field**:
```sql
-- Check job_source values
SELECT DISTINCT job_source FROM jobs;

-- Check scholarship_source values
SELECT DISTINCT scholarship_source FROM scholarships;
```

### Manual Cleanup Fails

**Check database connection**:
```bash
# Verify DATABASE_URL in .env
cat .env | grep DATABASE_URL

# Test connection
python -c "from backend.src.models.user import db; db.create_all()"
```

### Too Many Items Deleted

**Adjust grace period**:
```python
# Increase grace period to 3 days
service = CleanupService(grace_period_days=3)
```

## Security Considerations

1. **Admin-Only Access**: All cleanup endpoints require admin authentication
2. **No Public Deletion**: Users cannot trigger cleanup
3. **Audit Trail**: All deletions are logged with timestamps
4. **Cascade Safety**: Database foreign key constraints prevent orphaned records
5. **Health Check Public**: Read-only health endpoint is public for monitoring

## Performance Impact

### Database Load

- **Queries**: 2 DELETE queries every 12 hours (jobs + scholarships)
- **Indexes**: Uses existing indexes on `job_source`, `scholarship_source`, `application_deadline`, `expires_at`
- **Locks**: Row-level locks during deletion (PostgreSQL) or table locks (SQLite)

### Optimization Tips

1. **Off-Peak Scheduling**: Run cleanup during low-traffic hours
2. **Batch Size**: Large deletions (>1000 items) may need batching
3. **Indexes**: Ensure proper indexes exist:

```sql
CREATE INDEX idx_jobs_cleanup ON jobs(job_source, application_deadline, expires_at);
CREATE INDEX idx_scholarships_cleanup ON scholarships(scholarship_source, application_deadline);
```

## Future Enhancements

- [ ] Configurable grace period per source
- [ ] Email notifications to admins after cleanup
- [ ] Soft delete with archive table
- [ ] Cleanup history/audit log
- [ ] Configurable cleanup schedule (cron-like)
- [ ] Whitelist specific external sources from auto-deletion
- [ ] Analytics on deleted items (avg age, source distribution)

## Related Documentation

- [Job Scheduler Documentation](JOB_AUTO_DELETION_SYSTEM.md)
- [Admin Scholarship Management](SCHOLARSHIP_LIST_IMPROVEMENTS.md)
- [Notification System](JOB_NOTIFICATION_SYSTEM_COMPLETE.md)

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintainer**: AfriTech Opportunities Team
