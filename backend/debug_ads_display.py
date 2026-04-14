#!/usr/bin/env python3
"""
Debug ad display issues - check why ads aren't serving
"""

import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

if __name__ == '__main__':
    from main import app, AdCampaign, AdCreative, AdPlacement, AdCampaignPlacement, db
    
    with app.app_context():
        print("\n" + "="*70)
        print("AD DISPLAY DEBUGGING")
        print("="*70)
        
        now = datetime.utcnow()
        print(f"\n📅 Current Time: {now}")
        
        # 1. Check campaigns in database
        print("\n" + "-"*70)
        print("1️⃣  CHECKING AD CAMPAIGNS")
        print("-"*70)
        
        all_campaigns = AdCampaign.query.all()
        print(f"Total campaigns in DB: {len(all_campaigns)}")
        
        for campaign in all_campaigns:
            print(f"\n  Campaign: {campaign.name}")
            print(f"    ID: {campaign.id}")
            print(f"    Status: {campaign.status}")
            print(f"    Budget: ${campaign.budget_spent} / ${campaign.budget_total}")
            print(f"    Start Date: {campaign.start_date}")
            print(f"    End Date: {campaign.end_date}")
            print(f"    Budget OK: {campaign.budget_spent < campaign.budget_total}")
            
            # Check if active
            is_active = (
                campaign.status == 'ACTIVE' and
                (not campaign.start_date or campaign.start_date <= now) and
                (not campaign.end_date or campaign.end_date >= now) and
                campaign.budget_spent < campaign.budget_total
            )
            print(f"    Is Active (serving criteria): {is_active}")
        
        # 2. Check active campaigns (ACTIVE status only)
        print("\n" + "-"*70)
        print("2️⃣  FILTERING ACTIVE CAMPAIGNS")
        print("-"*70)
        
        active_status = AdCampaign.query.filter_by(status='ACTIVE').all()
        print(f"Campaigns with ACTIVE status: {len(active_status)}")
        for c in active_status:
            print(f"  - {c.name} (Budget: ${c.budget_spent}/{c.budget_total})")
        
        # 3. Check creatives
        print("\n" + "-"*70)
        print("3️⃣  CHECKING CREATIVES")
        print("-"*70)
        
        all_creatives = AdCreative.query.all()
        print(f"Total creatives in DB: {len(all_creatives)}")
        
        for creative in all_creatives:
            campaign = AdCampaign.query.get(creative.campaign_id)
            print(f"\n  Creative: {creative.title}")
            print(f"    ID: {creative.id}")
            print(f"    Campaign: {campaign.name if campaign else 'MISSING'}")
            print(f"    Active: {creative.is_active}")
            print(f"    Format: {creative.ad_format}")
            print(f"    Image: {creative.image_url}")
            print(f"    CTA URL: {creative.cta_url}")
        
        # 4. Check placements
        print("\n" + "-"*70)
        print("4️⃣  CHECKING AD PLACEMENTS")
        print("-"*70)
        
        placements = AdPlacement.query.all()
        print(f"Total placements in DB: {len(placements)}")
        
        for placement in placements:
            print(f"\n  Placement: {placement.placement_key}")
            print(f"    ID: {placement.id}")
            print(f"    Name: {placement.name}")
            print(f"    Active: {placement.is_active}")
            print(f"    Allowed Formats: {placement.get_allowed_formats()}")
        
        # 5. Check campaign-placement links
        print("\n" + "-"*70)
        print("5️⃣  CHECKING CAMPAIGN-PLACEMENT LINKS")
        print("-"*70)
        
        links = AdCampaignPlacement.query.all()
        print(f"Total campaign-placement links: {len(links)}")
        
        for link in links:
            campaign = AdCampaign.query.get(link.campaign_id)
            placement = AdPlacement.query.get(link.placement_id)
            print(f"\n  Link: {campaign.name if campaign else 'MISSING'} → {placement.placement_key if placement else 'MISSING'}")
            print(f"    Campaign ID: {link.campaign_id}")
            print(f"    Placement ID: {link.placement_id}")
        
        # 6. Test query for job_feed_mid placement
        print("\n" + "-"*70)
        print("6️⃣  TESTING SERVE_ADS QUERY FOR 'job_feed_mid'")
        print("-"*70)
        
        placement_key = 'job_feed_mid'
        placement = AdPlacement.query.filter_by(placement_key=placement_key).first()
        
        if placement:
            print(f"✓ Placement found: {placement.name} (ID: {placement.id})")
            print(f"  Is active: {placement.is_active}")
            print(f"  Allowed formats: {placement.get_allowed_formats()}")
            
            # Get campaign placements
            campaign_placements = AdCampaignPlacement.query.filter_by(
                placement_id=placement.id
            ).all()
            
            print(f"\n  Campaign-placement links: {len(campaign_placements)}")
            campaign_ids = [cp.campaign_id for cp in campaign_placements]
            print(f"  Campaign IDs: {campaign_ids}")
            
            if campaign_ids:
                # Query active campaigns
                from sqlalchemy import or_
                
                active_campaigns = AdCampaign.query.filter(
                    AdCampaign.id.in_(campaign_ids),
                    AdCampaign.status == 'ACTIVE',
                    AdCampaign.start_date <= now,
                    or_(
                        AdCampaign.end_date >= now,
                        AdCampaign.end_date.is_(None)
                    ),
                    AdCampaign.budget_spent < AdCampaign.budget_total
                ).all()
                
                print(f"\n  ✓ Active campaigns for this placement: {len(active_campaigns)}")
                
                for campaign in active_campaigns:
                    creatives = campaign.creatives.filter_by(is_active=True).all()
                    print(f"\n    Campaign: {campaign.name}")
                    print(f"    Creatives: {len(creatives)}")
                    
                    for creative in creatives:
                        print(f"      - {creative.title} ({creative.ad_format})")
            else:
                print(f"\n  ✗ No campaigns linked to this placement!")
        else:
            print(f"✗ Placement '{placement_key}' NOT FOUND")
        
        # 7. Summary and recommendations
        print("\n" + "="*70)
        print("📋 SUMMARY & DIAGNOSTICS")
        print("="*70)
        
        if len(all_campaigns) == 0:
            print("\n❌ ISSUE: No ad campaigns in database")
            print("   FIX: Run fix_ads_display.py to create sample campaigns")
        elif len(active_status) == 0:
            print("\n❌ ISSUE: No campaigns with ACTIVE status")
            print("   FIX: Update campaign status to ACTIVE")
        elif len(placements) == 0:
            print("\n❌ ISSUE: No ad placements in database")
            print("   FIX: Run fix_ads_display.py to create placements")
        elif len(links) == 0:
            print("\n❌ ISSUE: No campaign-placement links")
            print("   FIX: Run fix_ads_display.py to link campaigns to placements")
        else:
            print("\n✅ All components present!")
            print("   Check if:")
            print("   1. Frontend calling correct endpoint: /api/ads/public/featured-ads")
            print("   2. Browser console for errors")
            print("   3. Network tab for API responses")
            print("   4. Check browser cache and clear if needed")
