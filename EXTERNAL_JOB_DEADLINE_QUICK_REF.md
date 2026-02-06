# External Job/Scholarship Deadline Integration - Quick Reference

## Summary
✅ **COMPLETE** - External job creation form now includes deadline fields that integrate with auto-cleanup system.

## What Changed

### External Jobs (CreateExternalJob.jsx)
**Added 2 new fields:**
- `application_deadline` - **REQUIRED** - Last date to apply (auto-deleted 1 day after)
- `expires_at` - **OPTIONAL** - Job expiration date (fallback if no deadline)

### External Scholarships (CreateScholarship.jsx)
**Already has deadline field:**
- `application_deadline` - **REQUIRED** - Already configured and working

## How Auto-Cleanup Works

### Jobs
```
External Job Created
    ↓
application_deadline set (required)
    ↓
Cleanup runs every 12 hours
    ↓
Checks: application_deadline OR expires_at <= (now - 1 day)
    ↓
DELETES if criteria met
```

### Scholarships
```
External Scholarship Created
    ↓
application_deadline set (required)
    ↓
Cleanup runs every 12 hours
    ↓
Checks: application_deadline <= (now - 1 day)
    ↓
DELETES if criteria met
```

## Grace Period
- **1 DAY** after deadline before deletion
- Example: Deadline = Jan 15, 2025 → Deleted on Jan 16, 2025

## Form UI Features

### Jobs Form
```jsx
// Location: Application Process section

┌─────────────────────────────────────────────────┐
│ Application Deadline *                          │
│ ┌────────────────┐                             │
│ │ 📅 2025-01-15  │  (date picker)               │
│ └────────────────┘                             │
│ ℹ️ External jobs auto-deleted 1 day after      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Job Expiration Date (Optional)                  │
│ ┌────────────────┐                             │
│ │ 📅 2025-02-01  │  (date picker)               │
│ └────────────────┘                             │
│ ℹ️ Fallback expiration if no deadline          │
└─────────────────────────────────────────────────┘
```

### Scholarships Form
```jsx
// Location: Application Information section

┌─────────────────────────────────────────────────┐
│ Application Deadline *                          │
│ ┌──────────────────────────┐                   │
│ │ 2025-01-15T23:59         │ (datetime picker) │
│ └──────────────────────────┘                   │
│ Last date and time to submit applications      │
└─────────────────────────────────────────────────┘
```

## Validation Rules

### Jobs
| Field | Required | Validation |
|-------|----------|------------|
| `application_deadline` | ✅ Yes | Must be future date |
| `expires_at` | ❌ No | Must be future date if provided |

### Scholarships
| Field | Required | Validation |
|-------|----------|------------|
| `application_deadline` | ✅ Yes | Must be future datetime |

## Backend Integration

### Job Model
```python
class Job(db.Model):
    application_deadline = db.Column(db.DateTime)  # ✅ Exists
    expires_at = db.Column(db.DateTime)           # ✅ Exists
    job_source = db.Column(db.String(50), default='internal')  # ✅ Exists
```

### Scholarship Model
```python
class Scholarship(db.Model):
    application_deadline = db.Column(db.DateTime, nullable=False)  # ✅ Exists
    scholarship_source = db.Column(db.String(50), default='internal')  # ✅ Exists
```

### Cleanup Service
```python
# Jobs: Checks BOTH fields
Job.job_source == 'external' AND (
    application_deadline <= cutoff_date OR 
    expires_at <= cutoff_date
)

# Scholarships: Checks ONE field
Scholarship.scholarship_source == 'external' AND 
    application_deadline <= cutoff_date
```

## Testing Guide

### Quick Test: External Job
```bash
1. Navigate to: /external-admin/create-job
2. Fill required fields:
   - Title: "Test Job"
   - Company: "Test Corp"
   - Description: "Test description"
3. Scroll to "Application Process"
4. Set "Application Deadline": Tomorrow's date
5. (Optional) Set "Job Expiration Date": Next week
6. Submit form
7. Check cleanup stats: /api/cleanup/stats
8. Verify job appears in pending cleanup count
```

### Quick Test: External Scholarship
```bash
1. Navigate to: /external-admin/create-scholarship
2. Fill required fields:
   - Title: "Test Scholarship"
   - Organization: "Test Org"
   - Description: "Test description"
3. Set "Application Deadline": Tomorrow's datetime
4. Submit form
5. Check cleanup stats: /api/cleanup/stats
6. Verify scholarship appears in pending cleanup count
```

### Manual Cleanup Test
```bash
1. Login as admin
2. Navigate to: /admin/cleanup
3. View cleanup stats dashboard
4. Click "Clean Up Jobs" or "Clean Up Scholarships"
5. Confirm deletion in modal
6. Verify updated stats
```

## API Endpoints

### Cleanup Stats
```http
GET /api/cleanup/stats
Authorization: Bearer <admin_token>

Response:
{
  "jobs": {
    "total_external": 45,
    "pending_cleanup": 3,
    "next_cleanup_eligible": "2025-01-16T00:00:00"
  },
  "scholarships": {
    "total_external": 23,
    "pending_cleanup": 1,
    "next_cleanup_eligible": "2025-01-17T00:00:00"
  }
}
```

### Manual Cleanup
```http
POST /api/cleanup/jobs
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "deleted_count": 3,
  "message": "Successfully deleted 3 external jobs"
}
```

## File Changes Summary

### Modified Files
- ✅ `talentsphere-frontend/src/pages/external-admin/CreateExternalJob.jsx`
  - Added `application_deadline` and `expires_at` to formData
  - Added fields to formSections
  - Added UI date inputs with validation
  - Updated handleSubmit to include fields
  - Updated JSON import mapping

### Unchanged Files (Already Configured)
- ✅ `talentsphere-frontend/src/pages/external-admin/CreateScholarship.jsx`
- ✅ `backend/src/models/job.py`
- ✅ `backend/src/models/scholarship.py`
- ✅ `backend/src/routes/job.py`
- ✅ `backend/src/routes/scholarship.py`
- ✅ `backend/src/services/cleanup_service.py`

## Common Issues & Solutions

### Issue: "Application deadline is required" error
**Solution:** Field is now mandatory - set a future date

### Issue: "Deadline must be in the future" error
**Solution:** Cannot set past dates - choose tomorrow or later

### Issue: Jobs not being auto-deleted
**Solution:** Check:
1. `job_source` is 'external'
2. `application_deadline` is past + 1 day
3. Cleanup service is running (check `/api/cleanup/health`)

### Issue: Manual cleanup shows 0 deleted
**Solution:** Jobs may not meet criteria yet (deadline + 1 day grace period)

## Quick Commands

### Start Frontend Dev Server
```bash
cd talentsphere-frontend
npm run dev
```

### Check Cleanup Service Status
```bash
curl http://localhost:5001/api/cleanup/health \
  -H "Authorization: Bearer <admin_token>"
```

### View Cleanup Logs
```bash
cd backend
tail -f logs/cleanup_service.log
```

### Force Manual Cleanup
```bash
# Jobs
curl -X POST http://localhost:5001/api/cleanup/jobs \
  -H "Authorization: Bearer <admin_token>"

# Scholarships
curl -X POST http://localhost:5001/api/cleanup/scholarships \
  -H "Authorization: Bearer <admin_token>"
```

## Next Steps
1. ✅ Test external job creation with deadline
2. ✅ Verify form validation works
3. ✅ Check cleanup stats after creation
4. ✅ Test manual cleanup from admin UI
5. ✅ Monitor cleanup service logs

## Documentation References
- Full Implementation: [EXTERNAL_JOB_DEADLINE_IMPLEMENTATION.md](EXTERNAL_JOB_DEADLINE_IMPLEMENTATION.md)
- Cleanup System: [JOB_AUTO_DELETION_SYSTEM.md](JOB_AUTO_DELETION_SYSTEM.md)
- Admin UI: [ADMIN_CLEANUP_MANAGEMENT.md](ADMIN_CLEANUP_MANAGEMENT.md)
