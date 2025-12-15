# Job Auto-Deletion System

## Overview

TalentSphere now includes an automated job expiration and cleanup system that manages the lifecycle of job postings. The system automatically marks expired jobs, notifies employers, and optionally removes old expired jobs from the database.

## Features

### 1. Automatic Expiration Marking
- Jobs that pass their `expires_at` date are automatically marked as `expired`
- Job status changes from `published` to `expired`
- `is_active` flag is set to `false`
- Jobs become invisible to job seekers

### 2. Expiration Notifications
- **Early Warning**: Employers receive notifications 3 days (configurable) before job expiration
- **Expiration Notice**: Employers are notified when their job posting expires
- Notifications include action links to renew or extend the posting

### 3. Automated Cleanup
- Old expired jobs are automatically deleted after a grace period (default: 7 days)
- Jobs with applications are **preserved** (not auto-deleted)
- Only jobs with no applications are eligible for auto-deletion
- Configurable deletion behavior

## Configuration

Configure the job scheduler in your `.env` file:

```bash
# Job Scheduler Configuration
JOB_CLEANUP_INTERVAL_HOURS=6          # How often to run cleanup (default: 6 hours)
JOB_AUTO_DELETE_ENABLED=true          # Enable/disable auto-deletion (default: true)
JOB_GRACE_PERIOD_DAYS=7               # Days to wait before deleting expired jobs (default: 7)
JOB_NOTIFY_BEFORE_EXPIRY_DAYS=3       # Notify employers N days before expiry (default: 3)
```

### Configuration Options

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `JOB_CLEANUP_INTERVAL_HOURS` | Integer | 6 | How often the scheduler checks for expired jobs (in hours) |
| `JOB_AUTO_DELETE_ENABLED` | Boolean | true | Enable/disable automatic deletion of old expired jobs |
| `JOB_GRACE_PERIOD_DAYS` | Integer | 7 | Days to wait after expiration before deleting jobs without applications |
| `JOB_NOTIFY_BEFORE_EXPIRY_DAYS` | Integer | 3 | Days before expiration to send warning notification to employers |

## How It Works

### Scheduler Lifecycle

1. **Startup**: Scheduler starts automatically when the Flask application starts
2. **Periodic Checks**: Runs every `JOB_CLEANUP_INTERVAL_HOURS` hours
3. **Processing Cycle**:
   - Mark expired jobs
   - Notify about expiring jobs
   - Delete old expired jobs (if enabled)

### Job States

```
┌─────────┐    Publish    ┌───────────┐    Expires    ┌─────────┐    Grace Period    ┌─────────┐
│  Draft  │──────────────>│ Published │──────────────>│ Expired │───────────────────>│ Deleted │
└─────────┘                └───────────┘                └─────────┘    (if no apps)    └─────────┘
                                 │                            │
                                 │ Extend/Renew               │ Has Applications
                                 │                            │
                                 └────────────────────────────┘──────────────> Preserved
```

### Deletion Logic

A job is eligible for auto-deletion when:
- ✅ Status is `expired`
- ✅ Expiry date is more than `JOB_GRACE_PERIOD_DAYS` ago
- ✅ Job has **zero** applications
- ✅ `JOB_AUTO_DELETE_ENABLED` is `true`

Jobs are **preserved** when:
- ❌ Job has one or more applications
- ❌ Job is not expired
- ❌ Still within grace period
- ❌ Auto-deletion is disabled

## Admin API Endpoints

### 1. Get Expiration Statistics

```http
GET /api/admin/jobs/expiration-stats
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "expired_jobs": 15,
  "expiring_soon": 8,
  "expiring_this_week": 5,
  "expiring_this_month": 23,
  "needs_expiry_update": 2,
  "old_expired_jobs": 10,
  "old_expired_deletable": 6,
  "scheduler_config": {
    "auto_delete_enabled": true,
    "check_interval_hours": 6,
    "grace_period_days": 7,
    "notify_before_expiry_days": 3,
    "is_running": true
  },
  "expiring_jobs_details": [
    {
      "id": 123,
      "title": "Senior Developer",
      "company": "TechCorp",
      "expires_at": "2025-12-20T00:00:00Z",
      "days_left": 5,
      "application_count": 12
    }
  ]
}
```

### 2. Manual Cleanup Trigger

```http
POST /api/admin/jobs/cleanup
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "message": "Job cleanup completed successfully",
  "timestamp": "2025-12-15T10:30:00Z"
}
```

### 3. Get/Update Scheduler Configuration

**Get Configuration:**
```http
GET /api/admin/jobs/scheduler/config
Authorization: Bearer <admin_token>
```

**Update Configuration:**
```http
PUT /api/admin/jobs/scheduler/config
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "check_interval_hours": 12,
  "auto_delete_enabled": false,
  "grace_period_days": 14,
  "notify_before_expiry_days": 5
}
```

**Response:**
```json
{
  "message": "Scheduler configuration updated",
  "config": {
    "auto_delete_enabled": false,
    "check_interval_hours": 12,
    "grace_period_days": 14,
    "notify_before_expiry_days": 5,
    "is_running": true
  }
}
```

### 4. Extend Job Expiry

```http
POST /api/admin/jobs/<job_id>/extend-expiry
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "days": 30
}
```

**Response:**
```json
{
  "message": "Job expiry extended by 30 days",
  "job_id": 123,
  "new_expiry": "2026-01-15T00:00:00Z",
  "status": "published"
}
```

## Notifications

### Expiring Soon Notification
- **Trigger**: 3 days (configurable) before expiration
- **Priority**: High
- **Email**: Yes
- **Action**: Link to edit job posting
- **Frequency**: Once per job

### Expired Notification
- **Trigger**: When job expires
- **Priority**: Normal
- **Email**: Yes
- **Action**: Link to job dashboard
- **Message**: Job is no longer visible to applicants

## Job Model Fields

The Job model includes these expiration-related fields:

```python
class Job(db.Model):
    expires_at = db.Column(db.DateTime)          # Expiration timestamp
    status = db.Column(db.String(50))            # 'draft', 'published', 'expired', etc.
    is_active = db.Column(db.Boolean)            # Active flag
    
    def is_expired(self):
        """Check if job has expired"""
        if self.expires_at:
            return datetime.utcnow() > self.expires_at
        return False
    
    def days_until_expiry(self):
        """Get days until expiration"""
        if self.expires_at:
            delta = self.expires_at - datetime.utcnow()
            return max(0, delta.days)
        return None
```

## Logging

The scheduler logs all actions:

```
INFO: Job scheduler started
INFO: Marking 3 jobs as expired
INFO: Job #123 'Senior Developer' marked as expired (expired on: 2025-12-10T00:00:00)
INFO: Created expiring-soon notification for job #456 (3 days left)
INFO: Deleted 2 old expired jobs, skipped 5 jobs with applications
```

## Best Practices

### For Admins

1. **Monitor Statistics**: Regularly check `/admin/jobs/expiration-stats` to monitor job lifecycle
2. **Review Logs**: Check server logs for scheduler activity
3. **Grace Period**: Set appropriate grace period (7-14 days recommended)
4. **Manual Cleanup**: Use manual cleanup for immediate processing if needed
5. **Disable Auto-Delete**: Consider disabling auto-deletion during testing or maintenance

### For Employers

1. **Set Expiry Dates**: Always set realistic expiry dates when creating jobs
2. **Monitor Notifications**: Watch for expiring-soon notifications
3. **Extend Before Expiry**: Extend job postings before they expire
4. **Review Analytics**: Check job performance before expiration

## Troubleshooting

### Scheduler Not Starting

```python
# Check logs for:
⚠️  Job scheduler failed to start: <error message>

# Verify:
1. Database connection is working
2. Job model is properly imported
3. No conflicting threads
```

### Jobs Not Being Deleted

**Possible Reasons:**
1. `JOB_AUTO_DELETE_ENABLED=false` in environment
2. Jobs have applications (preserved by design)
3. Still within grace period
4. Scheduler not running

**Check:**
```bash
# View scheduler status
curl -H "Authorization: Bearer <token>" \
  http://localhost:5001/api/admin/jobs/scheduler/config
```

### Manual Intervention

If automatic cleanup fails, trigger manual cleanup:

```bash
curl -X POST \
  -H "Authorization: Bearer <admin_token>" \
  http://localhost:5001/api/admin/jobs/cleanup
```

## Database Impact

### Performance
- Scheduler uses indexed queries on `expires_at`, `status`, and `is_active`
- Batch processing with configurable intervals
- Minimal database load (runs every 6 hours by default)

### Storage
- Auto-deletion helps maintain database size
- Jobs with applications are preserved for historical data
- Consider archiving very old jobs instead of deletion

## Security

- Only admins can access scheduler management endpoints
- Configuration changes require admin token
- Job deletion is logged with full audit trail
- Grace period prevents accidental data loss

## Migration

If upgrading from a system without auto-deletion:

1. **Review Existing Expired Jobs**:
   ```sql
   SELECT COUNT(*) FROM jobs 
   WHERE expires_at < NOW() AND status = 'published';
   ```

2. **Update Environment Variables**:
   - Add new configuration to `.env`
   - Consider starting with `JOB_AUTO_DELETE_ENABLED=false`

3. **Initial Cleanup**:
   - Use manual cleanup endpoint to process backlog
   - Review results before enabling auto-deletion

4. **Enable Auto-Deletion**:
   - Set `JOB_AUTO_DELETE_ENABLED=true`
   - Monitor logs for first few cycles

## Future Enhancements

Potential improvements:
- Archive expired jobs instead of deletion
- Configurable retention policies per company
- Bulk expiry extension for multiple jobs
- Analytics on job expiration patterns
- Automatic renewal for premium employers

## Support

For issues or questions:
1. Check server logs: `tail -f /tmp/backend.log`
2. Review scheduler statistics via API
3. Use manual cleanup for testing
4. Contact system administrator

---

**Last Updated**: December 15, 2025
**Version**: 1.0
**Status**: Production Ready
