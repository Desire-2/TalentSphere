# PHASE 2: Backend Routes - Implementation Complete ✅

## Overview
PHASE 2 of the Custom Advertising System has been fully implemented with 30+ Flask routes providing complete campaign management, ad serving, and admin moderation capabilities.

## File Location
- **Routes File**: `/backend/src/routes/ads.py` (1,220 lines)
- **Blueprint Registration**: `/backend/src/main.py` (line 177)
- **URL Prefix**: `/api/ads`

## Implemented Endpoints

### EMPLOYER ROUTES (Campaign Management)

#### Campaign CRUD Operations
```
POST   /api/ads/campaigns
GET    /api/ads/campaigns
GET    /api/ads/campaigns/<campaign_id>
PUT    /api/ads/campaigns/<campaign_id>
```

#### Campaign Lifecycle
```
POST   /api/ads/campaigns/<campaign_id>/submit    # DRAFT → PENDING_REVIEW
POST   /api/ads/campaigns/<campaign_id>/pause     # ACTIVE → PAUSED
POST   /api/ads/campaigns/<campaign_id>/resume    # PAUSED → ACTIVE
```

#### Creative Management
```
POST   /api/ads/campaigns/<campaign_id>/creatives
PUT    /api/ads/campaigns/<campaign_id>/creatives/<creative_id>
DELETE /api/ads/campaigns/<campaign_id>/creatives/<creative_id>
```

#### Campaign Configuration
```
POST   /api/ads/campaigns/<campaign_id>/targeting  # Set audience targeting
GET    /api/ads/analytics/<campaign_id>             # Analytics with date range
```

#### Credit Management
```
GET    /api/ads/credits                   # Balance + transaction history
POST   /api/ads/credits/purchase          # Purchase credits (Stripe stub)
```

### PUBLIC AD SERVING ROUTES (Core Ad Engine)

#### Ad Delivery
```
GET    /api/ads/serve              # Main ad serving endpoint
  Query params:
  - placement (required): Placement key (e.g., "JOB_FEED_TOP")
  - context: Page context (optional)
  - limit: Max ads to return (default: 2, max: 10)
```

#### Event Tracking
```
POST   /api/ads/impression         # Record impression, update spend (CPM)
POST   /api/ads/click              # Record click, redirect to CTA URL (CPC)
```

### ADMIN ROUTES (Moderation & Analytics)

#### Campaign Review Queue
```
GET    /api/ads/admin/review-queue                          # Pending campaigns
POST   /api/ads/admin/campaigns/<campaign_id>/approve       # Approve
POST   /api/ads/admin/campaigns/<campaign_id>/reject        # Reject
GET    /api/ads/admin/campaigns                             # All campaigns + filters
```

#### Placement Management
```
GET    /api/ads/admin/placements           # List all placements
POST   /api/ads/admin/placements           # Create new placement
PUT    /api/ads/admin/placements/<id>      # Update placement
```

#### Platform Analytics
```
GET    /api/ads/admin/analytics/overview   # Today's metrics + active campaigns
POST   /api/ads/admin/run-aggregation      # Nightly aggregation job
```

## Core Features Implemented

### 1. IP-Based Frequency Capping
```python
def get_ip_hash(request):
    """SHA256 hash of client IP (privacy-preserving)"""
    # Prevents abuse: max 5 ads per IP per 24 hours
```
- Hashes IP address for privacy
- Prevents showing more than 5 ads to same user per 24h
- Blocks ad serving when frequency cap exceeded

### 2. Ad Serving Algorithm (`/api/ads/serve`)
- Queries active campaigns with remaining budget
- Filters by placement assignment
- Sorts by bid amount (highest first)
- Validates ad format compatibility with placement
- Returns tracking URLs for impression/click

### 3. Billing Integration
**CPM (Cost Per Mille)**: Charges per 1,000 impressions
- Triggered on POST `/api/ads/impression`
- Formula: `spend = (bid_amount / 1000) * impression_count`

**CPC (Cost Per Click)**: Charges per click
- Triggered on POST `/api/ads/click`
- Formula: `spend = bid_amount * click_count`

**Budget Management**:
- Campaign stops serving once `budget_spent >= budget_total`
- Real-time budget checks before serving ads

### 4. Campaign Workflow
```
DRAFT (created)
  ↓ validate & submit
PENDING_REVIEW (awaiting admin)
  ↓ approve
ACTIVE (serving ads)
  ↓ pause
PAUSED (not serving)
  ↓ resume
ACTIVE (serving again)

Alternatively:
PENDING_REVIEW → REJECTED (admin rejects)
```

### 5. Creative Management
- Multiple creatives per campaign
- Support for formats: BANNER_HORIZONTAL, BANNER_VERTICAL, CARD, INLINE_FEED, SPONSORED_JOB, SPOTLIGHT
- Image upload: jpg/png/webp, max 2MB
- Images stored in `/static/ad_creatives/`
- Text validation: title (80 chars), body (200 chars), CTA (30 chars)

### 6. Analytics & Reporting
**Real-time Metrics**:
- Impressions, clicks, CTR (Click-Through Rate)
- Budget spent vs. remaining
- Cost per impression, reach

**Pre-aggregated Analytics**:
- Daily aggregation from impressions/clicks
- Performance by creative, placement, date
- Nightly rebuild with `/api/ads/admin/run-aggregation`

### 7. Access Control
- Employer routes: Employer role required + ownership verification
- Admin routes: Admin role required
- Public routes: No authentication (IP-tracked frequency capping)
- All routes return 404 if resource doesn't belong to requester

## Data Flow Examples

### Example 1: Create & Submit Campaign
```
1. POST /api/ads/campaigns
   → Create campaign in DRAFT status

2. POST /api/ads/campaigns/<id>/creatives
   → Upload ad creative (image + text)

3. POST /api/ads/campaigns/<id>/targeting
   → Set audience (location, job category, etc.)

4. POST /api/ads/campaigns/<id>/submit
   → Move to PENDING_REVIEW

5. Admin: POST /api/ads/admin/campaigns/<id>/approve
   → Campaign becomes ACTIVE, starts serving
```

### Example 2: Serve Ads on Page Load (Frontend)
```javascript
// On job listing page load
fetch('/api/ads/serve?placement=JOB_FEED_TOP&limit=2')
.then(r => r.json())
.then(ads => {
  ads.ads.forEach(ad => {
    // Render ad to user
    // Track impression
    fetch('/api/ads/impression', {
      method: 'POST',
      body: JSON.stringify({
        campaign_id: ad.campaign_id,
        creative_id: ad.creative_id,
        placement_id: ad.placement_id
      })
    })
  })
})

// When user clicks ad
// POSt /api/ads/click with campaign_id, creative_id, placement_id
// Redirect to advertiser's CTA URL
```

### Example 3: Admin Analytics
```
GET /api/ads/admin/analytics/overview
→ {
    today: {
      impressions: 15420,
      clicks: 287,
      spend: 45.67,
      active_campaigns: 23
    }
  }
```

## Authentication & Authorization

### Token Requirements
Routes marked `@token_required` need JWT bearer token:
```
Authorization: Bearer <jwt_token>
```

### Role-Based Access
Routes marked `@role_required('employer')` check user role from JWT

### Employer Ownership Verification
```python
# All employer routes verify campaign belongs to current user
campaign = check_campaign_ownership(current_user.id, campaign_id)
if not campaign:
    return {'error': 'Campaign not found'}, 404
```

## Error Handling

All routes include comprehensive error handling:
- **400**: Invalid/missing required fields
- **403**: Insufficient permissions (wrong status for action)
- **404**: Resource not found (campaign, creative, placement)
- **500**: Server error (database issues, etc.)

Example responses:
```json
{"error": "campaign must have at least 1 active creative"}
{"error": "Only DRAFT or PAUSED campaigns can be edited"}
{"error": "Insufficient credits for campaign budget"}
```

## Performance Considerations

### Database Indexes
All models have strategic indexes on:
- Campaign status, dates, employer_id (filtering)
- Impression/Click ip_hash, viewed_at/clicked_at (frequency capping)
- Analytics campaign_id, date (reporting)

### Frequency Capping Query
```python
# Fast query: 1 index lookup on ip_hash + time range
AdImpression.query.filter(
    AdImpression.ip_hash == ip_hash,
    AdImpression.viewed_at >= datetime.utcnow() - timedelta(hours=24)
).count()
```

### Ad Serving Performance
- Assumes placements are pre-configured by admin
- Single query per placement + filtering in Python
- Suitable for <100 active campaigns

## Next Steps (PHASE 3+)

- [ ] **Frontend UI**: React components for campaign dashboard
- [ ] **Stripe Integration**: Real credit purchases (not stub)
- [ ] **Email Notifications**: Campaign status change emails
- [ ] **Advanced Targeting**: Location, job category, experience matching
- [ ] **Nightly Job**: Automated aggregation scheduler (APScheduler)
- [ ] **Performance**: Caching layer (Redis) for `/serve` endpoint
- [ ] **Testing**: Unit tests for billing logic, ad serving algorithm
- [ ] **Analytics Export**: CSV download for campaign data
- [ ] **A/B Testing**: Support for campaign variants
- [ ] **Fraud Detection**: Click fraud prevention

## Testing Checklist

Before deployment:
- [ ] Test campaign creation (all fields required)
- [ ] Test campaign submission (validates dates, creatives)
- [ ] Test creative upload (image validation, size limits)
- [ ] Test ad serving (frequency capping, bid ranking)
- [ ] Test CPM billing (spend calculation)
- [ ] Test CPC billing (click tracking)
- [ ] Test admin approval workflow
- [ ] Test employer can't access other employer's campaigns
- [ ] Test JWT token validation on protected routes

## Deployment Notes

1. **Image Storage**: Currently saves to `backend/static/ad_creatives/`
   - In production, use S3 or similar object storage

2. **Credits**: Currently has stub for purchase endpoint
   - Integrate with Stripe for real payments

3. **Aggregation Job**: Currently manual trigger via admin endpoint
   - In production, use APScheduler for nightly runs

4. **Database**: All models use SQLAlchemy with Flask-SQLAlchemy
   - Ensure Alembic migrations exist for production schema

---

**Status**: ✅ PHASE 2 Complete - Ready for PHASE 3 (Frontend UI)
