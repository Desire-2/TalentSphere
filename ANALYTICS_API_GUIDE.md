# Analytics API Testing Guide

Quick reference for testing the new analytics and admin endpoints.

## Base URL
```
http://localhost:5001/api
```

## Admin Endpoints

### 1. Get Platform Analytics Overview
```bash
# GET /admin/overview
curl -X GET "http://localhost:5001/api/ads/admin/overview" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response (200 OK)
{
  "total_impressions": 15420,
  "total_clicks": 487,
  "platform_ctr": 3.16,
  "total_spend": 2459.50,
  "active_campaigns": 12,
  "daily_breakdown": [
    {
      "date": "2025-04-01",
      "impressions": 512,
      "clicks": 18
    }
  ],
  "top_campaigns": [
    {
      "id": 1,
      "name": "Summer Sale 2025",
      "employer_name": "Tech Corp",
      "impressions": 5420,
      "clicks": 245,
      "ctr": 4.52,
      "spend": 543.50
    }
  ],
  "total_purchased": 5000.00,
  "total_spent": 2459.50,
  "platform_revenue": 491.90
}
```

### 2. Get Pending Campaign Review Queue
```bash
# GET /admin/review-queue
curl -X GET "http://localhost:5001/api/ads/admin/review-queue" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response (200 OK)
{
  "pending_reviews": [
    {
      "campaign": {
        "id": 5,
        "name": "Tech Internship Drive",
        "objective": "APPLICATIONS",
        "budget_total": 1000,
        "billing_type": "CPC",
        "created_at": "2025-04-10T14:32:00"
      },
      "employer": {
        "id": 12,
        "name": "John Doe",
        "email": "john@techcorp.com",
        "company_name": "Tech Corp"
      },
      "creatives": [
        {
          "id": 1,
          "title": "Join Our Team",
          "body_text": "We're hiring talented developers",
          "cta_text": "Apply Now",
          "image_url": "https://...",
          "ad_format": "CARD"
        }
      ]
    }
  ]
}
```

### 3. List All Campaigns (with filters)
```bash
# GET /admin/campaigns?status=ACTIVE
curl -X GET "http://localhost:5001/api/ads/admin/campaigns?status=ACTIVE" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response (200 OK)
{
  "campaigns": [
    {
      "id": 1,
      "name": "Summer Sale 2025",
      "employer_name": "Tech Corp",
      "status": "ACTIVE",
      "budget_total": 2000,
      "budget_spent": 543.50,
      "impressions": 5420,
      "clicks": 245,
      "created_at": "2025-04-01T10:00:00"
    }
  ]
}
```

### 4. List All Ad Placements
```bash
# GET /admin/placements
curl -X GET "http://localhost:5001/api/ads/admin/placements" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response (200 OK)
{
  "placements": [
    {
      "id": 1,
      "name": "Job Feed Top Banner",
      "placement_key": "job_feed_top",
      "page_context": "jobs_list",
      "max_ads_per_load": 1,
      "is_active": true,
      "allowed_formats": ["BANNER_HORIZONTAL"]
    }
  ]
}
```

### 5. Update Placement Status
```bash
# PUT /admin/placements/1
curl -X PUT "http://localhost:5001/api/ads/admin/placements/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "is_active": false
  }'

# Response (200 OK)
{
  "message": "Placement updated",
  "placement": {
    "id": 1,
    "name": "Job Feed Top Banner",
    "is_active": false
  }
}
```

### 6. Approve Campaign
```bash
# POST /admin/campaigns/5/approve
curl -X POST "http://localhost:5001/api/ads/admin/campaigns/5/approve" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Response (200 OK)
{
  "message": "Campaign approved successfully",
  "campaign_id": 5,
  "status": "ACTIVE"
}
```

### 7. Reject Campaign
```bash
# POST /admin/campaigns/5/reject
curl -X POST "http://localhost:5001/api/ads/admin/campaigns/5/reject" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Inappropriate content in creative"
  }'

# Response (200 OK)
{
  "message": "Campaign rejected successfully",
  "campaign_id": 5,
  "status": "REJECTED"
}
```

---

## Employer Analytics Endpoints

### 8. Get Campaign Analytics (for employers)
```bash
# GET /campaigns/1/analytics?days=30
curl -X GET "http://localhost:5001/api/ads/campaigns/1/analytics?days=30" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response (200 OK)
{
  "campaign_id": 1,
  "campaign_name": "Summer Sale 2025",
  "totals": {
    "impressions": 5420,
    "clicks": 245,
    "ctr": 4.52,
    "spend": 543.50,
    "reach": 4200
  },
  "creatives_breakdown": [
    {
      "id": 1,
      "title": "Summer Offer Banner",
      "impressions": 3200,
      "clicks": 180,
      "ctr": 5.62,
      "spend": 320.00
    }
  ],
  "placements_breakdown": [
    {
      "name": "Job Feed Top Banner",
      "placement_key": "job_feed_top",
      "impressions": 2500,
      "clicks": 120
    }
  ],
  "daily_breakdown": [
    {
      "date": "2025-04-01",
      "impressions": 180,
      "clicks": 12
    }
  ]
}
```

### Query Parameters for Campaign Analytics
- **days**: 7, 14, 30, or 90 (default: 30)

### Responses by Date Range
```bash
# Last 7 days
?days=7

# Last 14 days
?days=14

# Last 90 days
?days=90
```

---

## Manual Testing Steps

### In Admin Dashboard (/admin/ads)

1. **Test Overview Tab**
   ```
   ✓ Page loads and shows KPI cards
   ✓ Chart displays daily trend
   ✓ Top campaigns table populated
   ✓ Revenue summary shows correct calculations
   ```

2. **Test Review Queue Tab**
   ```
   ✓ Pending campaigns listed
   ✓ Click "Preview Creatives" → modal shows all ads
   ✓ Click "Approve" → campaign status changes to ACTIVE
   ✓ Click "Reject" → opens modal for notes
   ✓ Submit rejection → email sent to employer
   ✓ Review Queue clears after approval/rejection
   ```

3. **Test Campaigns Tab**
   ```
   ✓ All campaigns displayed
   ✓ Filter by status works (dropdown changes)
   ✓ Search by name works
   ✓ Status badges color-coded correctly
   ```

4. **Test Placements Tab**
   ```
   ✓ All placements listed
   ✓ Click toggle button → status changes
   ✓ Active/Inactive button updates
   ```

### In Employer Dashboard (/employer/ads)

1. **Test Campaign Analytics**
   ```
   ✓ Click campaign → opens CampaignDetail
   ✓ Click "Overview" tab → loads CampaignAnalyticsPanel
   ✓ KPI cards show correct metrics
   ✓ Chart displays impressions vs clicks trend
   ✓ Date range selector works (7/14/30/90 days)
   ✓ Creative performance table displays breakdown
   ✓ Placement performance chart shows data
   ✓ Insights section displays summary
   ```

---

## Error Responses

### 403 Forbidden (Non-admin trying admin endpoint)
```json
{
  "error": "Access denied"
}
```

### 404 Not Found (Campaign not found)
```json
{
  "error": "Campaign not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Database connection failed"
}
```

---

## Authentication

All endpoints require:
```bash
Authorization: Bearer <JWT_TOKEN>
```

Get a token:
```bash
curl -X POST "http://localhost:5001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@afritech.com",
    "password": "password"
  }'
```

---

## Performance Notes

- Admin overview queries optimized for 10,000+ campaigns
- Campaign analytics computed from daily aggregates (fast)
- Date range filtering efficient with indexed columns
- Consider caching overview endpoint (updates hourly)

---

## Data Validation

**Valid Status Filters:**
```
DRAFT, PENDING_REVIEW, ACTIVE, PAUSED, REJECTED, COMPLETED
```

**Valid Date Ranges:**
```
days=7, days=14, days=30, days=90
```

**Valid Billing Types (for calculations):**
```
CPM (Cost Per Mille)
CPC (Cost Per Click)
FLAT_RATE (Daily budget)
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Token expired? Re-login |
| 403 Forbidden | Not an admin? Check user role |
| Empty data | No campaigns/impressions yet? Create sample data |
| Chart not loading | Check browser console for errors |
| Email not sent | NotificationService configured? Check logs |

---

## Next Steps

1. **Setup Nightly Aggregation** (optional but recommended)
   - Add APScheduler task in `backend/src/main.py`
   - Schedule `aggregate_ad_analytics()` daily at 00:30 UTC

2. **CSV Export Endpoint** (future feature)
   - Add `GET /admin/campaigns/export`
   - Return CSV format with campaign data

3. **Advanced Reporting** (future phase)
   - Cohort analysis
   - A/B testing comparison
   - Predictive performance modeling
