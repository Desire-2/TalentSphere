# TalentSphere Ads System - Comprehensive Analysis

**Analysis Date:** April 14, 2026  
**Codebase:** Full-stack Job & Scholarship Portal with Custom Ad Network

---

## Executive Summary

The TalentSphere ads system is a **production-grade custom advertising network** built from scratch (not third-party). It features:
- **Campaign-based ad management** with employer self-service
- **Multiple billing models** (CPM, CPC, FLAT_RATE)
- **Admin moderation & review workflows**
- **Real-time ad serving with placement targeting**
- **Comprehensive analytics and tracking**
- **Two parallel systems**: Custom ad campaigns + Featured job ads (partial/legacy)

**Current Status:** Core custom ad system is **fully implemented and working**. Featured ads system is **partially implemented/legacy**.

---

## 1. CURRENT FEATURES (What Works)

### Fully Implemented ✅

#### Custom Advertising Campaign System
- **Campaign Creation & Management** - Employers create ad campaigns with:
  - Budget allocation (total + spend tracking)
  - Billing models: CPM, CPC, or FLAT_RATE
  - Date scheduling (start/end dates)
  - Status workflow: DRAFT → PENDING_REVIEW → ACTIVE/REJECTED
  - Targeting configuration (locations, categories, keywords)

- **Creative Management** - Multiple ad creatives per campaign:
  - Multiple formats: BANNER_HORIZONTAL, BANNER_VERTICAL, CARD, INLINE_FEED, SPONSORED_JOB, SPOTLIGHT
  - Image uploads (2MB max)
  - Title (80 chars), body (200 chars), CTA text/URL
  - Individual active/inactive toggle

- **Ad Serving** - Core serving engine:
  - Dynamic placement selection based on page context
  - Budget constraint validation
  - Frequency capping (max 5 ads per IP per 24h)
  - Bid-based prioritization (higher bids get priority)
  - Format matching against placement constraints

- **Tracking System** - High-volume impression/click tracking:
  - Impression recording (async-friendly with sendBeacon)
  - Click recording with redirect capability
  - Session-based tracking (no raw IP storage, hashed IP only)
  - Budget spend calculation per impression/click

- **Analytics & Reporting** - Comprehensive metrics:
  - Daily aggregated analytics (nightly job)
  - Per-campaign, per-creative, per-placement breakdowns
  - CTR calculation
  - Spend tracking per billing model
  - Reach (unique viewers) calculation
  - 30-day rolling window views

- **Admin Moderation** - Review workflow:
  - Review queue with filtering (PENDING, APPROVED, REJECTED)
  - Approve/Reject campaign buttons
  - Rejection notes logging
  - Review history tracking

- **Billing & Credits** - Credit management:
  - Credit balance tracking
  - Transaction history (PURCHASE, SPEND, REFUND, BONUS)
  - Credit purchase endpoint (stub for Stripe)
  - CPM/CPC charge calculation

- **Placement Management** - Configurable ad slots:
  - Create/update/list placements
  - Per-placement format restrictions
  - Max ads per load configuration
  - Activation/deactivation

#### Frontend Display Components
- **AdSlot** - Main rendering component:
  - Fetches ads from `/ads/serve` endpoint
  - Format-based rendering (CARD, BANNER_HORIZONTAL, etc.)
  - Automatic ad loading on page load
  - Tracks impressions on render

- **Multiple Ad Formats**:
  - AdCard - Standard feed card format
  - AdBanner - Full-width banner
  - AdInlineFeed - Job-card styled format
  - AdSpotlight - Hero/spotlight format
  - GoogleAds - Google AdSense integration

- **Featured Ads Carousel** - Carousel display:
  - Auto-rotating featured ads
  - Manual navigation (prev/next)
  - Play/pause controls
  - Analytics display (impressions, clicks, CTR)

#### Tracking & Analytics Frontend
- **adTracking.js** - Comprehensive tracking utilities:
  - Ad impression tracking (sendBeacon implementation)
  - Click tracking with URL generation
  - Session ID management
  - Google Ads (gtag) integration for conversion tracking
  - Job/scholarship application conversions
  - User registration conversion tracking

### Partially Implemented / Legacy ⚠️

#### Featured Job Ads System
- **Endpoint exists**: `GET /api/ads/public/featured-ads` [backend/src/routes/ads.py:1820]
- **Frontend integration**: `FeaturedAdsCarousel` component loads featured ads
- **Status**: Models and full CRUD endpoints NOT implemented
- **Issue**: Referenced in documentation but models not found in codebase
- **References in code**:
  - `frontend/src/services/api.js` has: `getFeaturedAdPackages()`, `getMyFeaturedAds()`, etc.
  - Backend comments reference FeaturedAd model (commented out imports)
  ```python
  #from src.models.featured_ad import FeaturedAd, FeaturedAdPackage, Payment, Subscription
  ```

---

## 2. AD FLOW: Creation to Display

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAMPAIGN CREATION FLOW                        │
└─────────────────────────────────────────────────────────────────┘

1. EMPLOYER CREATES CAMPAIGN
   └─ POST /api/ads/campaigns
      ├─ Name, objective, budget, billing_type, bid_amount
      ├─ Targeting parameters (locations, categories, keywords)
      └─ Status: DRAFT

2. EMPLOYER ADDS CREATIVES (multiple)
   └─ POST /api/ads/campaigns/{id}/creatives
      ├─ Title, body_text, cta_text, cta_url
      ├─ Image upload (optional, max 2MB)
      ├─ Ad format selection
      └─ is_active flag

3. EMPLOYER CONFIGURES TARGETING
   └─ POST /api/ads/campaigns/{id}/targeting
      ├─ Locations, job categories, keywords
      ├─ User type filtering
      └─ Experience level requirements

4. EMPLOYER SUBMITS FOR REVIEW
   └─ POST /api/ads/campaigns/{id}/submit
      ├─ Validation: Must have ≥1 active creative
      ├─ Validation: Must have start_date < end_date
      ├─ Status: DRAFT → PENDING_REVIEW
      └─ Creates AdReview record (decision: PENDING)

5. ADMIN REVIEWS CAMPAIGN
   ├─ GET /api/ads/admin/review-queue (fetch all pending)
   ├─ Review includes: campaign details, creatives, employer info
   └─ Actions available:
       ├─ POST /api/ads/admin/campaigns/{id}/approve
       │  └─ Status: PENDING_REVIEW → ACTIVE, sets start_date to now
       │
       └─ POST /api/ads/admin/campaigns/{id}/reject
          ├─ Takes rejection notes
          └─ Status: PENDING_REVIEW → REJECTED

6. APPROVED CAMPAIGN ACTIVATES
   └─ Status: ACTIVE
      ├─ Creatives marked as active
      ├─ Now eligible for ad serving
      └─ Start/end dates determine serving window

┌─────────────────────────────────────────────────────────────────┐
│                      AD SERVING FLOW                             │
└─────────────────────────────────────────────────────────────────┘

1. PAGE LOAD (Frontend)
   └─ Component <AdSlot> mounted
      ├─ placement_key: 'job_feed_mid' (page location)
      ├─ context: 'job_listing' (page type)
      └─ limit: 2 (ads to fetch)

2. AD SERVING REQUEST (Frontend → Backend)
   └─ GET /api/ads/serve?placement=job_feed_mid&context=job_listing&limit=2

3. AD SELECTION LOGIC (Backend)
   └─ [backend/src/routes/ads.py:serve_ads(), Line ~1765]
      ├─ Step 1: Find placement by placement_key
      │  └─ If not active, return empty
      │
      ├─ Step 2: Query ACTIVE campaigns
      │  └─ Filters:
      │     ├─ status == 'ACTIVE'
      │     ├─ start_date <= now
      │     ├─ end_date >= now (or null)
      │     └─ budget_spent < budget_total
      │
      ├─ Step 3: Frequency capping
      │  └─ client_ip_hash check:
      │     ├─ Count impressions in last 24h
      │     └─ If >= 5, return empty (don't show more)
      │
      ├─ Step 4: Filter by placement
      │  └─ Only show ads that use this placement
      │     └─ Check AdCampaignPlacement junction table
      │
      ├─ Step 5: Filter by format
      │  └─ Only creatives with formats matching placement.allowed_formats
      │
      ├─ Step 6: Sort by bid_amount (highest first)
      │  └─ Higher CPM/CPC bids get priority
      │
      └─ Step 7: Limit to N ads (default 2, max 10)

4. AD RESPONSE (Backend → Frontend)
   └─ JSON array of ads:
      ```json
      {
        "ads": [
          {
            "id": "1_2",
            "campaign_id": 1,
            "creative_id": 2,
            "title": "...",
            "body_text": "...",
            "cta_text": "...",
            "cta_url": "...",
            "image_url": "...",
            "ad_format": "CARD",
            "placement_id": 5,
            "tracking": {
              "impression_url": "/ads/impression?c=1&cr=2&p=5",
              "click_url": "/ads/click?c=1&cr=2&p=5"
            }
          }
        ]
      }
      ```

5. FRONTEND RENDERING (React)
   └─ [talentsphere-frontend/src/components/ads/AdSlot.jsx]
      ├─ Map ads array to components
      ├─ Call trackAdImpression() for each ad rendered
      │  └─ POST /api/ads/impression (async, sendBeacon)
      │
      └─ Render appropriate component based on ad_format:
         ├─ BANNER_HORIZONTAL → <AdBanner>
         ├─ CARD → <AdCard>
         ├─ INLINE_FEED → <AdInlineFeed>
         └─ SPOTLIGHT → <AdSpotlight>

6. USER CLICKS AD
   └─ Click handler in component
      ├─ Generate tracking URL: getAdClickTrackingUrl()
      └─ Navigate to: /api/ads/click?c=1&cr=2&p=5&cta_url=https://...

7. BACKEND RECORDS CLICK & REDIRECTS
   └─ POST /api/ads/click
      ├─ Create AdClick record
      ├─ Update campaign.budget_spent (if CPC billing)
      └─ Return: { "redirect_url": "https://..." }

8. IMPRESSION TRACKING (Async)
   └─ POST /api/ads/impression (sent via sendBeacon or fetch)
      ├─ Data: { campaign_id, creative_id, placement_id, session_id }
      ├─ Create AdImpression record
      ├─ Update campaign.budget_spent (if CPM billing)
      └─ Return: 204 No Content

9. NIGHTLY ANALYTICS AGGREGATION
   └─ POST /api/ads/admin/run-aggregation (manual trigger, scheduled)
      ├─ Group impressions by (campaign, creative, placement, date)
      ├─ Count clicks for same groups
      ├─ Calculate CTR, reach, spend
      ├─ Upsert into AdAnalyticsDaily table
      └─ Enables dashboard reporting
```

---

## 3. ALL COMPONENTS INVOLVED

### Backend Components

#### Database Models [backend/src/models/ads.py]

1. **AdCampaign** [L15-119]
   - PK: id (Integer)
   - FK: employer_id → User.id
   - Fields: name, objective, status, budget_total, budget_spent, billing_type, bid_amount, start_date, end_date
   - Targeting: stored as JSON (locations, keywords, job_categories, etc.)
   - Relationships: creatives, placements, impressions, clicks, analytics_daily, reviews
   - Indexes: (employer_id, status), (status, start_date, end_date)

2. **AdCreative** [L120-170]
   - PK: id (Integer)
   - FK: campaign_id → AdCampaign.id
   - Fields: title, body_text, cta_text, cta_url, image_url, ad_format, is_active
   - Formats: BANNER_HORIZONTAL, BANNER_VERTICAL, CARD, INLINE_FEED, SPONSORED_JOB, SPOTLIGHT
   - Relationships: impressions, clicks, analytics_daily
   - Index: created_at

3. **AdPlacement** [L171-246]
   - PK: id (Integer)
   - Fields: name, display_name, description, placement_key (unique), page_context
   - Config: max_ads_per_load, rotation_interval
   - Pricing: base_cpm, price_multiplier
   - Features: is_active, requires_approval, supports_video, supports_custom_image
   - Dimensions: recommended_image_width/height, max_title/description_length
   - Validation: allowed_formats (stored as JSON)
   - Index: placement_key (unique), is_active

4. **AdCampaignPlacement** [L247-267]
   - Junction table (many-to-many)
   - FK: campaign_id, placement_id
   - Unique constraint: (campaign_id, placement_id)

5. **AdImpression** [L268-301] 
   - High-volume write-optimized table
   - PK: id (Integer)
   - FK: campaign_id, creative_id, placement_id, viewer_user_id (nullable)
   - Fields: ip_hash (no raw IP), session_id, viewed_at (timestamp)
   - Indexes: (campaign_id, viewed_at), (placement_id, viewed_at), (creative_id, viewed_at)
   - Relationships: viewer (User), placement

6. **AdClick** [L302-339]
   - Similar structure to AdImpression
   - FK: campaign_id, creative_id, placement_id, clicker_user_id (nullable)
   - Fields: ip_hash, session_id, clicked_at
   - Indexes: (campaign_id, clicked_at), (placement_id, clicked_at), (creative_id, clicked_at)

7. **AdAnalyticsDaily** [L340-399]
   - Pre-aggregated daily analytics
   - PK: id (Integer)
   - FK: campaign_id, creative_id, placement_id
   - Fields: date (Date), impressions, clicks, ctr, spend, reach
   - Indexes: (campaign_id, date), (creative_id, date), (placement_id, date)
   - Unique constraint: (campaign_id, creative_id, placement_id, date)

8. **AdCredit** [L400-445]
   - Billing credits for employers
   - PK: id (Integer)
   - FK: employer_id → User.id
   - Fields: amount, transaction_type (PURCHASE, SPEND, REFUND, BONUS), reference_id, note
   - Index: (employer_id, created_at)

9. **AdReview** [L446-471]
   - Campaign moderation records
   - PK: id (Integer)
   - FK: campaign_id (unique), reviewer_id (nullable)
   - Fields: decision (APPROVED, REJECTED, NEEDS_CHANGES, None), notes, reviewed_at

#### Backend Routes [backend/src/routes/ads.py]

**Employer Routes (Campaign Management)**
- `POST /ads/campaigns` - Create campaign [L58-135]
- `GET /ads/campaigns` - List employer's campaigns [L138-178]
- `GET /ads/campaigns/{id}` - Get campaign detail [L181-216]
- `PUT /ads/campaigns/{id}` - Update campaign (DRAFT/PAUSED only) [L219-270]
- `POST /ads/campaigns/{id}/submit` - Submit for review [L273-325]
- `POST /ads/campaigns/{id}/pause` - Pause ACTIVE campaign [L328-347]
- `POST /ads/campaigns/{id}/resume` - Resume PAUSED campaign [L350-369]
- `POST /ads/campaigns/{id}/creatives` - Create creative [L372-443]
- `PUT /ads/campaigns/{id}/creatives/{creative_id}` - Update creative [L446-477]
- `DELETE /ads/campaigns/{id}/creatives/{creative_id}` - Delete creative [L480-501]
- `POST /ads/campaigns/{id}/targeting` - Set targeting [L504-529]
- `GET /ads/analytics/{id}` - Get campaign analytics [L532-591]
- `GET /ads/credits` - Get credit balance & history [L594-612]
- `POST /ads/credits/purchase` - Purchase credits [L615-645]

**Admin Routes (Moderation & Monitoring)**
- `GET /ads/admin/review-queue` - View all campaigns for review [L1190-1333]
- `POST /ads/admin/campaigns/{id}/approve` - Approve campaign [L1336-1368]
- `POST /ads/admin/campaigns/{id}/reject` - Reject campaign [L1371-1403]
- `POST /ads/admin/campaigns/{id}/reset-review` - Reset review status [L1406-1431]
- `GET /ads/admin/campaigns` - List all campaigns (admin) [L1434-1466]
- `GET /ads/admin/placements` - List placements [L1469-1479]
- `POST /ads/admin/placements` - Create placement [L1482-1509]
- `PUT /ads/admin/placements/{id}` - Update placement [L1512-1540]
- `GET /ads/admin/analytics/overview` - Platform analytics [L1543-1571]
- `POST /ads/admin/run-aggregation` - Aggregate daily analytics [L1574-1654]
- `GET /ads/admin/overview` - Admin dashboard overview [L1657-1797]

**Public Routes (Ad Serving & Tracking)**
- `GET /ads/serve` - Fetch ads for page [L1648-1828]
- `POST /ads/impression` - Record impression [L1831-1869]
- `POST /ads/click` - Record click & redirect [L1872-1921]
- `GET /ads/public/featured-ads` - Featured ads endpoint [L1820-1850]

#### Analytics Service [backend/src/services/ad_analytics.py]

- `aggregate_ad_analytics(date)` - Nightly aggregation job
  - Groups impressions/clicks by (campaign, creative, placement, date)
  - Calculates CTR, spend, reach
  - Upserts into AdAnalyticsDaily

### Frontend Components

#### Ad Display Components [talentsphere-frontend/src/components/ads/]

1. **AdSlot.jsx** [Main rendering engine]
   - Fetches ads from `/api/ads/serve`
   - Takes props: placement, context, limit, format, style, className
   - Maps ads to appropriate component based on format
   - Calls `trackAdImpression()` for each rendered ad
   - Handles loading state

2. **AdCard.jsx** [Standard card format]
   - Default feed card appearance
   - Title, body, image, CTA button
   - Tracks impressions on mount
   - Generates click-tracking URL

3. **AdBanner.jsx** [Horizontal banner]
   - Full-width banner format
   - Image on left/top, content on right/bottom
   - Responsive layout

4. **AdInlineFeed.jsx** [Job-card styled]
   - Mimics job card styling
   - "Sponsored" badge
   - Matches feed consistency

5. **AdSpotlight.jsx** [Hero/spotlight format]
   - Large hero image
   - Overlay content
   - Featured/premium appearance

6. **AdComponents.jsx** [Pre-configured components]
   - Exports: BannerAd, SquareAd, ResponsiveAd, MobileBannerAd, LargeRectangleAd, LeaderboardAd, SkyscraperAd, InArticleAd
   - Thin wrappers around GoogleAds component
   - Pre-configured ad slots

7. **GoogleAds.jsx** [Google AdSense integration]
   - Loads Google AdSense script
   - Renders `<ins>` element with adsense attributes
   - Development mode with placeholder

#### Tracking Utilities [talentsphere-frontend/src/utils/adTracking.js]

- `trackAdImpression(campaignId, creativeId, placementKey)` - Send impression
  - Uses sendBeacon (non-blocking) or fetch
  - Includes session_id

- `getAdClickTrackingUrl(campaignId, creativeId, placementKey, ctaUrl)` - Generate click URL
  - Encodes tracking params as query string
  - Returns tracking URL

- `initializeAdTracking()` - Initialize session
  - Creates session ID, stores in sessionStorage

- `initGoogleAds()` - Initialize Google Ads pixel
  - Loads gtag script

- `trackConversion(conversionLabel, value, currency)` - Track conversions
  - Push to dataLayer for gtag

- Job application conversion tracking
- Scholarship application conversion tracking
- User registration conversion tracking

#### Services [talentsphere-frontend/src/services/]

1. **adManager.js** [API client for ad management]
   - Campaign CRUD: createCampaign, listCampaigns, getCampaign, updateCampaign
   - Campaign lifecycle: submitCampaign, pauseCampaign, resumeCampaign
   - Creatives: createCreative, updateCreative, deleteCreative
   - Targeting: setTargeting
   - Analytics: getAnalytics, getCampaignPerformance
   - Credits: getCredits, purchaseCredits
   - Admin: approveCampaign, rejectCampaign

2. **api.js** [Main API service with ad endpoints]
   - Featured ad endpoints (partial):
     - getFeaturedAdPackages()
     - createFeaturedAd(adData)
     - getMyFeaturedAds(params)
     - getFeaturedAdAnalytics(id)
     - getPublicFeaturedAds(limit)

#### Pages/UIs [talentsphere-frontend/src/pages/]

1. **CompanyAdvertising.jsx** [Employer ad dashboard]
   - View: Overview, Active ads, Analytics, Create new ads
   - Features: Browse/pause/resume ads, view metrics
   - Status: Uses mock data (ready for API integration)
   - [Line 35-1150]

2. **AdsDashboard.jsx** [Employer campaign dashboard]
   - Lists all campaigns with filters (ACTIVE, PAUSED, DRAFT, REJECTED)
   - Summary metrics: Active campaigns, impressions, clicks, CTR
   - Campaign actions: Details, pause, delete
   - Uses `adManagerService` API client

3. **AdminAdsManagement.jsx** [Admin moderation dashboard]
   - Tabs: Overview, Review Queue, Campaigns, Placements
   - Review queue: Pending campaigns with approve/reject actions
   - Campaign list: Filter by status, search
   - Platform analytics: Impressions, clicks, spend trends
   - Placement management

#### Other Components

- **FeaturedAdsCarousel.jsx** [Featured ads carousel display]
  - Auto-rotating carousel with manual controls
  - Displays featured ads from `/api/public/featured-ads`
  - Shows stats: impressions, clicks, CTR
  - Play/pause auto-rotation

---

## 4. INTEGRATION POINTS (Frontend ↔ Backend)

### Request/Response Flow

```
PAGES
├─ CompanyAdvertising.jsx
│  └─ adManagerService.listCampaigns() → GET /api/ads/campaigns
│  └─ adManagerService.getAnalytics() → GET /api/ads/analytics/{id}
│
├─ AdminAdsManagement.jsx
│  ├─ apiService.get('/ads/admin/overview') → GET /api/ads/admin/overview
│  ├─ apiService.get('/ads/admin/review-queue') → GET /api/ads/admin/review-queue
│  ├─ apiService.post('/ads/admin/campaigns/{id}/approve') → POST /ads/admin/campaigns/{id}/approve
│  └─ apiService.post('/ads/admin/campaigns/{id}/reject') → POST /ads/admin/campaigns/{id}/reject
│
└─ Multiple pages use <AdSlot>
   └─ AdSlot.jsx
      ├─ fetch(`/api/ads/serve?placement=...`) → GET /api/ads/serve
      ├─ trackAdImpression() → POST /api/ads/impression
      └─ getAdClickTrackingUrl() → Returns /api/ads/click URL

COMPONENTS
├─ FeaturedAdsCarousel.jsx
│  └─ apiService.getPublicFeaturedAds(10) → GET /api/public/featured-ads
│
└─ Ad format components (AdCard, AdBanner, etc.)
   ├─ trackAdImpression() → POST /api/ads/impression
   └─ Click link → GET /api/ads/click
```

### Authentication/Authorization

- **Token Required**: All employer & admin routes use `@token_required` decorator
- **Role Based**:
  - `@role_required('employer')` - Campaign creation/management
  - `@role_required('admin')` - Moderation, platform analytics
  - `@role_required('job_seeker')` - View ads (implicit, no decorator)

### Data Serialization

**Python Model → JSON**: Via `.to_dict()` methods
```python
campaign.to_dict() → {
  'id': 1,
  'name': 'Q2 Hiring Campaign',
  'objective': 'LEADS',
  'status': 'ACTIVE',
  'budget_total': float(1000.00),
  'budget_spent': float(250.00),
  'budget_remaining': 750.00,
  'is_active': True,
  'targeting': {...}
}
```

**Database Decimal → Float**: Automatic in jsonify()

---

## 5. DATA TRANSFORMATION BETWEEN SYSTEMS

### Campaign Creation Flow Data

```python
# FRONTEND SENDS
POST /api/ads/campaigns
{
  "name": "Q2 Tech Hiring",
  "objective": "LEADS",
  "budget_total": 5000,
  "billing_type": "CPM",
  "bid_amount": 2.50,
  "start_date": "2026-05-01T00:00:00Z",
  "end_date": "2026-06-30T23:59:59Z",
  "targeting": {
    "locations": ["USA", "Canada"],
    "job_categories": ["software-development", "data-science"],
    "user_type": "all",
    "keywords": ["python", "react"]
  }
}

# BACKEND PROCESSING
→ Parse ISO dates to datetime objects
→ Convert budget_total to Decimal
→ Store targeting as JSON string (via campaign.set_targeting())
→ Create AdCampaign record with status='DRAFT'
→ Create AdReview record with decision=None

# BACKEND RETURNS
{
  "message": "Campaign created successfully",
  "campaign": {
    "id": 42,
    "name": "Q2 Tech Hiring",
    "objective": "LEADS",
    "status": "DRAFT",
    "budget_total": 5000.0,
    "budget_spent": 0.0,
    "budget_remaining": 5000.0,
    "billing_type": "CPM",
    "bid_amount": 2.5,
    "is_active": False,
    "targeting": {
      "locations": ["USA", "Canada"],
      "job_categories": ["software-development", "data-science"],
      "user_type": "all",
      "keywords": ["python", "react"]
    },
    "start_date": "2026-05-01T00:00:00",
    "end_date": "2026-06-30T23:59:59",
    "created_at": "2026-04-14T12:30:45",
    "updated_at": "2026-04-14T12:30:45"
  }
}
```

### Ad Serving Response

```python
# FRONTEND REQUESTS
GET /api/ads/serve?placement=job_feed_mid&context=job_listing&limit=2

# BACKEND PROCESSING
→ Find 'job_feed_mid' placement
→ Query active campaigns (status='ACTIVE', dates valid, budget_spent < budget_total)
→ Filter by (campaign_id in AdCampaignPlacement where placement_id=5)
→ Apply frequency cap (IP hash, 5 ads/24h)
→ Get active creatives for each campaign
→ Filter by allowed_formats
→ Sort by bid_amount (highest first)
→ Build response with tracking URLs

# BACKEND RETURNS
{
  "ads": [
    {
      "id": "42_1",
      "campaign_id": 42,
      "creative_id": 1,
      "title": "Join Our Team",
      "body_text": "We're hiring engineers",
      "cta_text": "View Jobs",
      "cta_url": "https://company.com/careers",
      "image_url": "/static/ad_creatives/creative_42_1.jpg",
      "ad_format": "CARD",
      "placement_id": 5,
      "tracking": {
        "impression_url": "/ads/impression?c=42&cr=1&p=5",
        "click_url": "/ads/click?c=42&cr=1&p=5&cta_url=https://company.com/careers"
      }
    }
  ]
}

# FRONTEND PROCESSING
→ Map to <AdCard> component
→ Call trackAdImpression(42, 1, 'job_feed_mid')
→ Render HTML with click link to tracking URL
```

### Analytics Aggregation

```python
# NIGHTLY JOB: POST /api/ads/admin/run-aggregation

# Step 1: Query raw impressions
SELECT campaign_id, creative_id, placement_id, COUNT(*), COUNT(DISTINCT viewer_user_id)
FROM ad_impressions
WHERE viewed_at BETWEEN yesterday_00:00 AND yesterday_23:59
GROUP BY campaign_id, creative_id, placement_id

# Step 2: For each group, query clicks
SELECT COUNT(*)
FROM ad_clicks
WHERE campaign_id=X AND creative_id=Y AND placement_id=Z
AND clicked_at BETWEEN yesterday_00:00 AND yesterday_23:59

# Step 3: Calculate metrics
impressions = 1250
clicks = 48
reach = 1100 (unique viewers)
ctr = (48 / 1250) * 100 = 3.84%

spend = 0
IF campaign.billing_type == 'CPM':
  spend = (campaign.bid_amount / 1000) * impressions  # $2.50 / 1000 * 1250 = $3.125
ELSE IF campaign.billing_type == 'CPC':
  spend = campaign.bid_amount * clicks  # $0.50 * 48 = $24

# Step 4: Upsert to analytics
INSERT OR UPDATE ad_analytics_daily
SET impressions=1250, clicks=48, ctr=3.84, spend=3.125, reach=1100
WHERE campaign_id=42 AND creative_id=1 AND placement_id=5 AND date='2026-04-13'
```

---

## 6. TODOs & Commented Code

### In Backend Code

[backend/src/routes/ads.py:1510]
```python
# TODO: Check employer has sufficient credits
# For now, assume sufficient
```

[backend/src/main.py:20]
```python
#from src.models.featured_ad import FeaturedAd, FeaturedAdPackage, Payment, Subscription
```

[backend/src/routes/admin.py:11]
```python
#from src.models.featured_ad import FeaturedAd, Payment
```

[backend/src/routes/admin.py:53, 60, 125, 130]
```python
# Revenue statistics (Payment model not available, setting to 0)
# recent_payments = []  # Payment model not available
# 'pending_payments': 0  # Payment model not available
# 'payments': []  # Payment model not available
```

### In Frontend Code

[talentsphere-frontend/src/pages/CompanyAdvertising.jsx:~line 150-170]
```javascript
// Mock data - replace with actual API calls
setAdvertisingData({
  stats: {
    activeAds: 5,
    totalImpressions: 45670,
    totalClicks: 2341,
    // ... etc
  }
});
```

---

## 7. MISSING OR INCOMPLETE FEATURES

### Incomplete ⚠️

1. **Featured Ads System**
   - ❌ Models not implemented (FeaturedAd, FeaturedAdPackage, Payment, Subscription)
   - ⚠️ Endpoint exists but returns empty or partial data
   - ❌ Full CRUD endpoints missing
   - ✅ Frontend component exists (FeaturedAdsCarousel) but integration incomplete

2. **Payment Gateway Integration**
   - ⚠️ `POST /api/ads/credits/purchase` is stub only
   - ❌ No Stripe/Razorpay/Paystack integration
   - ❌ No payment validation
   - ☑️ Credit balance tracking works, but no way to purchase

3. **Credit Validation Before Campaign Submission**
   - ❌ No check if employer has sufficient credits
   - ❌ No automatic credit deduction on campaign approval

4. **Targeting Effectiveness**
   - ❌ Targeting stored but not used in ad serving logic
   - ℹ️ All active campaigns eligible regardless of targeting

5. **Real-time Budget Enforcement**
   - ⚠️ Budget spent calculated but not strictly enforced per request
   - ✅ Checks if budget_spent < budget_total, but no per-request budget protection

6. **Company Advertising Page**
   - ⚠️ Uses mock data, not connected to backend
   - Ready for API integration

### Not Implemented ❌

1. **Advanced Targeting Query Logic**
   - Platform supports storing targeting but not enforcing it
   - No user-targeting algorithm

2. **A/A Testing Framework**
   - No built-in testing infrastructure

3. **Campaign Scheduling with Dayparting**
   - Only date-based, not time-of-day scheduling

4. **Ad Delivery Pacing**
   - Budget is tracked but not paced throughout day

5. **Bulk Operations**
   - No bulk campaign creation/update endpoints

6. **Campaign Cloning**
   - No "duplicate campaign" feature

7. **Negative Keywords/Exclusions**
   - No blacklist functionality

8. **Cost-Per-Action (CPA) Billing**
   - Only CPM, CPC, FLAT_RATE implemented

9. **Real-time Bidding (RTB)**
   - Ad serving fixed per campaign, no dynamic bidding

---

## 8. POTENTIAL BOTTLENECKS & ISSUES

### Performance

1. **AdImpression Table Growth**
   - ⚠️ CRITICAL: AdImpression table will have millions of rows
   - One impression per view across all users
   - Solution: Implement partitioning by date, archive old data
   - ✅ Has indexes: (campaign_id, viewed_at), (placement_id, viewed_at), (creative_id, viewed_at)
   - Still: No retention policy or archival strategy

2. **Nightly Analytics Aggregation**
   - ⚠️ If millions of impressions, query could be slow
   - `GROUP BY campaign_id, creative_id, placement_id` across full table
   - Consider: Parallel processing, materialized views, or incremental aggregation

3. **Admin Review Queue Load**
   - ⚠️ `GET /ads/admin/review-queue` loads ALL campaigns into memory
   - No pagination
   - No database-side filtering before Python processing
   - At 100K+ campaigns, this becomes problematic

4. **Ad Serving Query Complexity**
   - ✅ Reasonable query structure
   - ⚠️ But: Frequency capping query runs per request (24h window)
   - Solution: Cache frequency cap results or use Redis

### Data Integrity

1. **Race Condition: Budget Spend Updates**
   - ⚠️ Impression/click handlers both update `campaign.budget_spent`
   - With high concurrency, could lose updates
   - Solution: Use atomic operations or database locks

2. **Orphaned Records**
   - ❌ AdImpression/AdClick records without valid campaign (if campaign deleted)
   - Has cascade relationships but could still occur with concurrent deletes

3. **Currency Precision**
   - ✅ Uses Decimal type for amounts (good practice)
   - ⚠️ But: Conversions to float in JSON could lose precision

### Security

1. **IP Hashing**
   - ✅ Good: No raw IPs stored
   - ⚠️ But: SHA256 is deterministic, could be reverse-engineered
   - Consider: Salted hash or one-way hash

2. **Campaign Ownership Verification**
   - ✅ `check_campaign_ownership(employer_id, campaign_id)` implemented
   - Prevents campaign manipulation by other employers

3. **Admin Moderation Bypass**
   - ⚠️ No super-admin role to override moderation
   - Consider: Admin approval override mechanism

### Billing & Fraud

1. **No Spend Limits Per Day/Hour**
   - ⚠️ Campaign could spend entire budget in first hour
   - Consider: Pacing algorithm or daily spend caps

2. **No Click Fraud Detection**
   - ❌ No algorithm to detect multiple clicks from same IP/user
   - High-volume click farms could drain budget

3. **CPM vs CPC Billing Issue**
   - ⚠️ Both CPM and CPC deduct from budget_spent
   - If campaign uses CPM but many clicks occur, spend tracking is per-impression, not per-click
   - This is correct for CPM (charges per impression) but could be confusing

---

## 9. SUMMARY TABLE: Files & Line Numbers

| Category | File | Lines | Purpose |
|----------|------|-------|---------|
| **Models** | [backend/src/models/ads.py](backend/src/models/ads.py) | 1-475 | Database models (9 models) |
| **Routes** | [backend/src/routes/ads.py](backend/src/routes/ads.py) | 1-2150+ | 50+ API endpoints |
| **Analytics** | [backend/src/services/ad_analytics.py](backend/src/services/ad_analytics.py) | 1-150+ | Nightly aggregation job |
| **Tracking** | [talentsphere-frontend/src/utils/adTracking.js](talentsphere-frontend/src/utils/adTracking.js) | 1-250+ | Impression/click tracking |
| **Ad Slot Render** | [talentsphere-frontend/src/components/ads/AdSlot.jsx](talentsphere-frontend/src/components/ads/AdSlot.jsx) | 1-115 | Main rendering component |
| **Ad Manager Service** | [talentsphere-frontend/src/services/adManager.js](talentsphere-frontend/src/services/adManager.js) | 1-300+ | API client for campaigns |
| **Employer UI** | [talentsphere-frontend/src/pages/CompanyAdvertising.jsx](talentsphere-frontend/src/pages/CompanyAdvertising.jsx) | 1-1150 | Employer dashboard (mock data) |
| **Admin UI** | [talentsphere-frontend/src/pages/admin/AdminAdsManagement.jsx](talentsphere-frontend/src/pages/admin/AdminAdsManagement.jsx) | 1-500+ | Admin moderation dashboard |
| **Carousel** | [talentsphere-frontend/src/components/FeaturedAdsCarousel.jsx](talentsphere-frontend/src/components/FeaturedAdsCarousel.jsx) | 1-300+ | Featured ads carousel |
| **Format Components** | [talentsphere-frontend/src/components/ads/*.jsx](talentsphere-frontend/src/components/ads/) | - | AdCard, AdBanner, AdInlineFeed, AdSpotlight, GoogleAds |
| **API Client** | [talentsphere-frontend/src/services/api.js](talentsphere-frontend/src/services/api.js) | 415-445 | Featured ad endpoints (partial) |

---

## 10. RECOMMENDED NEXT STEPS

### Immediate Fixes
1. ✅ Implement credit validation before campaign submission ([backend/src/routes/ads.py:1510])
2. ✅ Connect CompanyAdvertising.jsx to real API endpoints (replace mock data)
3. ✅ Add pagination to admin review queue
4. ✅ Implement Stripe integration for credits/payment

### Performance Improvements
1. 📊 Add Redis caching for frequency cap (24h window)
2. 📊 Implement database partitioning for AdImpression table
3. 📊 Create archival strategy for old analytics data
4. 📊 Parallel process nightly analytics aggregation

### Missing Features
1. 🔨 Complete Featured Ads system (models + endpoints)
2. 🔨 Implement targeting enforcement in ad serving logic
3. 🔨 Add click fraud detection algorithm
4. 🔨 Implement daily spend pacing

### Testing
1. ✅ Load test ad serving endpoint (simulate 1M+ impressions/day)
2. ✅ Test concurrent budget spend updates
3. ✅ Test admin moderation workflow
4. ✅ Test analytics aggregation accuracy

---

## Appendix: Key Configuration Values

**Ad Formats** (valid values for ad_format field):
- BANNER_HORIZONTAL
- BANNER_VERTICAL
- CARD
- INLINE_FEED
- SPONSORED_JOB
- SPOTLIGHT

**Campaign Statuses**:
- DRAFT
- PENDING_REVIEW
- ACTIVE
- PAUSED
- COMPLETED
- REJECTED

**Billing Types**:
- CPM (Cost Per Mille/1000 impressions)
- CPC (Cost Per Click)
- FLAT_RATE (Fixed daily/weekly rate)

**Review Decisions**:
- PENDING
- APPROVED
- REJECTED
- NEEDS_CHANGES
- None (not yet reviewed)

**Frequency Cap**: Max 5 ads per IP per 24 hours

**Ad Limit Per Page**: Max 10 ads per `/serve` request (typically 2)

**Image Constraints**:
- Max file size: 2MB
- Allowed formats: jpg, jpeg, png, webp
- Field lengths: title 80 chars, body 200 chars, cta_text 30 chars

---

**End of Analysis**
