# Ad Display Issues - Analysis & Fixes

## Root Causes Identified

### 1. **Campaign Status Not ACTIVE**
- **Problem**: Sample campaigns in database had status `PENDING_REVIEW` or `DRAFT`
- **Impact**: `serve_ads()` endpoint filters for `status == 'ACTIVE'` only
- **Fix**: Updated campaigns to ACTIVE status
- **Connection**: [backend/src/routes/ads.py](backend/src/routes/ads.py#L725)

### 2. **Missing Campaign-Placement Links**
- **Problem**: Campaigns weren't linked to placements via `AdCampaignPlacement` junction table
- **Impact**: `serve_ads()` couldn't find campaigns for specific placements
- **Fix**: Created links connecting campaigns to placements  
- **Connection**: [backend/src/routes/ads.py](backend/src/routes/ads.py#L742)

```python
# In serve_ads(), line 742:
campaign_placements = AdCampaignPlacement.query.filter_by(
    placement_id=placement.id
).all()
campaign_ids_in_placement = [cp.campaign_id for cp in campaign_placements]
```

### 3. **Missing Ad Placements**
- **Problem**: Frontend uses 8 placements but only 3 were in database
- **Missing**: `home_page_banner`, `home_page_mid`, `scholarship_feed_mid`, `companies_feed`, `dashboard_spotlight`
- **Impact**: Ads on home page and other sections had no placement to serve to
- **Fix**: Created all 8 placements  
- **Config Reference**: [backend/ad_placement_config.py](backend/ad_placement_config.py)

### 4. **Model-Schema Mismatch**
- **Problem**: `AdPlacement` model had different fields than database schema
- **Missing Fields**: `display_name`, `description`, `placement_order`, `base_cpm`, etc.
- **Database Schema** included 24 fields but model only had 6
- **Fix**: Updated [backend/src/models/ads.py](backend/src/models/ads.py#L171) to match database schema

## Changes Made

### Backend Model Updates

**File**: [backend/src/models/ads.py](backend/src/models/ads.py)

Updated `AdPlacement` class to include all database fields:
- Added: `display_name`, `description`, `placement_order`, `max_ads_per_period`, `rotation_interval`
- Added: `base_cpm`, `price_multiplier`, `requires_approval`, `supports_video`, `supports_custom_image`
- Added: `recommended_image_width`, `recommended_image_height`, `max_title_length`, `max_description_length`
- Added: `created_at`, `updated_at` timestamps

### Database Setup

**Script**: [backend/fix_ads_display.py](backend/fix_ads_display.py)

Automatic fix script that:
1. Creates all 8 ad placements
2. Activates campaigns with ACTIVE status
3. Links campaigns to appropriate placements  
4. Verifies setup and reports status

### Frontend - No Changes Needed

The frontend components are correctly configured:
- [talentsphere-frontend/src/components/ads/AdSlot.jsx](talentsphere-frontend/src/components/ads/AdSlot.jsx) - Fetches from `/api/ads/serve`
- [talentsphere-frontend/src/pages/jobs/JobList.jsx](talentsphere-frontend/src/pages/jobs/JobList.jsx) - Uses `job_feed_top` and `job_feed_mid` placements
- [talentsphere-frontend/src/pages/Home.jsx](talentsphere-frontend/src/pages/Home.jsx) - Uses `home_page_banner` and `home_page_mid`

## Current Ad System Status

After applying fixes:

```
✅ VERIFICATION
------------------------------------------------------------
✓ Active campaigns: 1
✓ Total placements: 8
✓ Campaign-to-placement links: 2
✓ job_feed_top: 1 campaign linked
✓ job_feed_mid: 1 campaign linked
```

### Ad Placement Configuration

| Placement Key | Page | Format(s) | Max Ads | Status |
|---|---|---|---|---|
| `job_feed_top` | Job Listing | BANNER_HORIZONTAL, BANNER_VERTICAL | 1 | ✅ Active |
| `job_feed_mid` | Job Listing | CARD, INLINE_FEED, SPONSORED_JOB | 2 | ✅ Active |
| `home_page_banner` | Home | BANNER_HORIZONTAL, BANNER_VERTICAL | 1 | ✅ Active |
| `home_page_mid` | Home | CARD, INLINE_FEED, SPONSORED_JOB | 2 | ✅ Active |
| `job_detail_sidebar` | Job Detail | CARD, BANNER_VERTICAL | 1 | ✅ Active |
| `scholarship_feed_mid` | Scholarships | CARD, INLINE_FEED | 1 | ✅ Active |
| `companies_feed` | Companies | CARD, INLINE_FEED, BANNER_HORIZONTAL | 1 | ✅ Active |
| `dashboard_spotlight` | Dashboard | SPOTLIGHT | 1 | ✅ Active |

## How Ad Serving Works Now

### 1. Frontend Request
Frontend component calls `/api/ads/serve?placement=job_feed_mid&context=job_listing&limit=2`

### 2. Backend Processing
[backend/src/routes/ads.py](backend/src/routes/ads.py#L698)`serve_ads()` endpoint:

```python
# 1. Get placement by placement_key
placement = AdPlacement.query.filter_by(placement_key=placement_key).first()

# 2. Find all campaigns linked to this placement
campaign_placements = AdCampaignPlacement.query.filter_by(
    placement_id=placement.id
).all()

# 3. Get ACTIVE campaigns with remaining budget
active_campaigns = AdCampaign.query.filter(
    AdCampaign.status == 'ACTIVE',
    AdCampaign.start_date <= now,
    AdCampaign.budget_spent < AdCampaign.budget_total
).all()

# 4. Get active, properly-formatted creatives
# 5. Return ads to frontend
```

### 3. Frontend Rendering
[talentsphere-frontend/src/components/ads/AdSlot.jsx](talentsphere-frontend/src/components/ads/AdSlot.jsx) renders ads based on format:
- `CARD` → `AdCard` component
- `BANNER_HORIZONTAL` → `AdBanner` component  
- `INLINE_FEED` → `AdInlineFeed` component
- `SPOTLIGHT` → `AdSpotlight` component

## Verification

To verify ads are working:

1. **Navigate to Job Listings** - Should see ads in feed (job_feed_top and job_feed_mid)
2. **Check Network Tab** - `/api/ads/serve` requests should return ads
3. **Run Fix Script** - `python3 fix_ads_display.py` to verify configuration
4. **Database Check** - Query `ad_campaigns` for ACTIVE status and `ad_campaign_placements` for links

## Future Improvements

1. **Create Employer Admin System** - Allow employers to create/manage ad campaigns
2. **Add Admin Review Queue** - [backend/src/routes/ads.py](backend/src/routes/ads.py#L920) has `get_review_queue()` endpoint
3. **Budget Management** - Track spend and prevent overspending
4. **Analytics Dashboard** - View impressions, clicks, CTR by campaign
5. **Frequency Capping** - Already implemented - max 5 ads per user per 24h
6. **Geographic Targeting** - Store targeting rules in `AdCampaign.targeting_json`

## Files Modified

1. [backend/src/models/ads.py](backend/src/models/ads.py) - Updated AdPlacement model
2. [backend/init_db.py](backend/init_db.py) - Updated sample data creation (alternative approach)
3. [backend/fix_ads_display.py](backend/fix_ads_display.py) - New fix script (PRIMARY FIX)

## Running the Fix

Already executed successfully:
```bash
cd backend
source venv/bin/activate
python3 fix_ads_display.py
```

This will:
- ✓ Create 8 ad placements
- ✓ Activate campaigns
- ✓ Link campaigns to placements
- ✓ Verify configuration
