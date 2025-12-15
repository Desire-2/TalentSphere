# Job Auto-Deletion - Quick Reference

## Quick Start

### 1. Configuration (in `.env`)
```bash
JOB_CLEANUP_INTERVAL_HOURS=6          # Check every 6 hours
JOB_AUTO_DELETE_ENABLED=true          # Enable auto-deletion
JOB_GRACE_PERIOD_DAYS=7               # Delete after 7 days
JOB_NOTIFY_BEFORE_EXPIRY_DAYS=3       # Notify 3 days before expiry
```

### 2. Start the System
The scheduler starts automatically with the backend:
```bash
cd backend
python src/main.py
```

Look for: `✅ Job scheduler started`

## What It Does

### Automatic Actions
1. **Every 6 hours** (configurable):
   - Marks expired jobs as `expired`
   - Notifies employers 3 days before expiry
   - Notifies employers when job expires
   - Deletes old expired jobs (no applications only)

2. **Job Lifecycle**:
   ```
   Published → Expiring Soon → Expired → Deleted (after grace period, if no apps)
      ↓             ↓              ↓
   Notification  Notification  Preserved (if has applications)
   ```

## Admin API Endpoints

### View Statistics
```bash
GET /api/admin/jobs/expiration-stats
Authorization: Bearer <admin_token>
```

### Manual Cleanup
```bash
POST /api/admin/jobs/cleanup
Authorization: Bearer <admin_token>
```

### Get/Update Config
```bash
# Get
GET /api/admin/jobs/scheduler/config

# Update
PUT /api/admin/jobs/scheduler/config
{
  "check_interval_hours": 12,
  "auto_delete_enabled": false,
  "grace_period_days": 14
}
```

### Extend Job Expiry
```bash
POST /api/admin/jobs/{job_id}/extend-expiry
{
  "days": 30
}
```

## Testing

### Run Test Suite
```bash
python test_job_scheduler.py
```

### Create Test Jobs
```bash
python test_job_scheduler.py --create-test-jobs
```

## Key Features

### ✅ Jobs Are Deleted When:
- Status is `expired`
- Past grace period (7 days)
- Has **zero** applications
- Auto-delete is enabled

### ❌ Jobs Are Preserved When:
- Has one or more applications
- Not expired yet
- Within grace period
- Auto-delete is disabled

## Notifications

### Expiring Soon (3 days before)
- Priority: High
- Email: Yes
- Action: Edit job posting

### Job Expired
- Priority: Normal
- Email: Yes
- Action: View job dashboard

## Safety Features

1. **Grace Period**: 7-day buffer before deletion
2. **Application Protection**: Never deletes jobs with applications
3. **Manual Override**: Admin can disable auto-deletion
4. **Logging**: All actions are logged
5. **Reversible**: Expired jobs can be reactivated

## Common Tasks

### Disable Auto-Deletion
```bash
# In .env
JOB_AUTO_DELETE_ENABLED=false
```

### Change Check Frequency
```bash
# In .env
JOB_CLEANUP_INTERVAL_HOURS=12  # Check every 12 hours
```

### Immediate Cleanup
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  http://localhost:5001/api/admin/jobs/cleanup
```

### View Scheduler Status
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:5001/api/admin/jobs/scheduler/config
```

## Monitoring

### Check Logs
```bash
# Backend logs show scheduler activity
tail -f /tmp/backend.log | grep "Job scheduler"
```

### Expected Log Output
```
INFO: Job scheduler started
INFO: Marking 3 jobs as expired
INFO: Job #123 'Senior Developer' marked as expired
INFO: Created expiring-soon notification for job #456
INFO: Deleted 2 old expired jobs, skipped 5 jobs with applications
```

## Troubleshooting

### Scheduler Not Running
Check: `⚠️  Job scheduler failed to start` in logs
- Verify database connection
- Check environment variables
- Restart backend server

### Jobs Not Being Deleted
Check:
1. Is `JOB_AUTO_DELETE_ENABLED=true`?
2. Are jobs past grace period?
3. Do jobs have applications?
4. Is scheduler running?

### Force Cleanup
Use manual cleanup endpoint to trigger immediate processing

## Production Checklist

- [ ] Set `JOB_AUTO_DELETE_ENABLED=true`
- [ ] Configure appropriate `JOB_GRACE_PERIOD_DAYS`
- [ ] Set `JOB_CLEANUP_INTERVAL_HOURS` (6-12 recommended)
- [ ] Test with `test_job_scheduler.py`
- [ ] Monitor logs after deployment
- [ ] Verify notifications are working
- [ ] Set up admin alerts for scheduler failures

## Environment Variables

| Variable | Default | Production Recommendation |
|----------|---------|---------------------------|
| `JOB_CLEANUP_INTERVAL_HOURS` | 6 | 6-12 |
| `JOB_AUTO_DELETE_ENABLED` | true | true |
| `JOB_GRACE_PERIOD_DAYS` | 7 | 7-14 |
| `JOB_NOTIFY_BEFORE_EXPIRY_DAYS` | 3 | 3-7 |

## Files Created/Modified

### New Files
- `backend/src/services/job_scheduler.py` - Scheduler service
- `test_job_scheduler.py` - Test suite
- `JOB_AUTO_DELETION_SYSTEM.md` - Full documentation
- `JOB_AUTO_DELETION_QUICK_REF.md` - This file

### Modified Files
- `backend/src/main.py` - Added scheduler initialization
- `backend/src/routes/admin.py` - Added management endpoints
- `backend/.env` - Added configuration variables

---

**Quick Help**: Run `python test_job_scheduler.py` to verify everything works!
