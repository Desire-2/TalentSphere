# External Auto-Delete System - Quick Reference

## ⚡ Quick Start

### Start the Service (Automatic)
```bash
cd backend
python src/main.py
# ✅ Cleanup service starts automatically
```

### Manual Cleanup (CLI)
```bash
cd backend

# View stats only
python cleanup_expired.py --stats-only

# Run full cleanup
python cleanup_expired.py

# Cleanup jobs only
python cleanup_expired.py --type jobs

# Cleanup scholarships only
python cleanup_expired.py --type scholarships
```

### Admin API Endpoints

#### Get Statistics
```http
GET /api/cleanup/stats
Authorization: Bearer <admin_token>
```

#### Run Cleanup Manually
```http
POST /api/cleanup/run
Authorization: Bearer <admin_token>
```

#### Service Status
```http
GET /api/cleanup/service/status
Authorization: Bearer <admin_token>
```

## 📋 How It Works

### Deletion Rules

**External Jobs** (deleted when):
- `job_source = 'external'`
- `application_deadline <= (now - 1 day)` OR `expires_at <= (now - 1 day)`

**External Scholarships** (deleted when):
- `scholarship_source = 'external'`
- `application_deadline <= (now - 1 day)`

### Schedule
- **Runs**: Every 12 hours automatically
- **Grace Period**: 1 day after deadline
- **Startup**: Automatic when Flask app starts

## 🗂️ Files Created/Modified

### New Files
- `backend/src/services/cleanup_service.py` - Core cleanup logic
- `backend/src/routes/cleanup_routes.py` - Admin API endpoints
- `backend/cleanup_expired.py` - CLI tool for manual cleanup

### Modified Files
- `backend/src/main.py` - Service initialization and startup

## 🔧 Configuration

### Change Grace Period
Edit `backend/src/services/cleanup_service.py`:
```python
class CleanupService:
    def __init__(self, grace_period_days=2):  # Change this
```

### Change Cleanup Interval
```python
class CleanupService:
    def __init__(self, grace_period_days=1, check_interval_hours=6):  # Change this
```

## 📊 Example Output

### CLI Stats
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

### API Response
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

## ✅ Testing Checklist

- [ ] Start backend: `python src/main.py`
- [ ] Check logs for: `✅ Cleanup service started successfully`
- [ ] Test stats: `python cleanup_expired.py --stats-only`
- [ ] Test manual cleanup: `python cleanup_expired.py`
- [ ] Test API: `GET /api/cleanup/stats` (with admin token)
- [ ] Verify automatic cleanup runs (check logs after 12 hours)

## 🛡️ Security

- ✅ All API endpoints require admin authentication
- ✅ CLI tool requires backend database access
- ✅ Cascade deletions prevent orphaned records
- ✅ All deletions logged with timestamps

## 📝 Related Features

1. **Scholarship Sorting** - Sort by last updated (default DESC)
2. **Admin Scholarship Management** - Full CRUD interface at `/admin/scholarships`
3. **Cleanup Service** - Automated data hygiene for external sources

---

**Full Documentation**: See `EXTERNAL_OPPORTUNITIES_AUTO_DELETE.md`
