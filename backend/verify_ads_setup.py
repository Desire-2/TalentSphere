#!/usr/bin/env python3
"""
Verify ad setup and diagnose display issues
"""

import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from main import app
from models.ads import AdCampaign, AdCreative, AdPlacement, AdCampaignPlacement

def verify_ads():
    """Verify ad configuration"""
    with app.app_context():
        print("\n" + "="*60)
        print("AD SYSTEM VERIFICATION")
        print("="*60)
        
        # Check placements
        placements = AdPlacement.query.all()
        print(f"\n✓ Ad Placements Found: {len(placements)}")
        for p in placements:
            print(f"  - {p.placement_key}: {p.name} (Active: {p.is_active})")
        
        # Check campaigns
        print(f"\n✓ Ad Campaigns Found: {AdCampaign.query.count()}")
        campaigns = AdCampaign.query.all()
        for c in campaigns:
            print(f"\n  Campaign: {c.name}")
            print(f"    Status: {c.status}")
            print(f"    Start: {c.start_date}")
            print(f"    End: {c.end_date}")
            print(f"    Budget: ${c.budget_total} (Spent: ${c.budget_spent})")
            print(f"    Is Active: {c.is_active()}")
            
            # Check creatives
            creatives = c.creatives.all()
            print(f"    Creatives: {len(creatives)}")
            for cr in creatives:
                print(f"      - {cr.title} ({cr.ad_format}, Active: {cr.is_active})")
        
        # Check campaign placements
        placements_used = AdCampaignPlacement.query.all()
        print(f"\n✓ Campaign-Placement Links: {len(placements_used)}")
        for cp in placements_used:
            campaign = AdCampaign.query.get(cp.campaign_id)
            placement = AdPlacement.query.get(cp.placement_id)
            if campaign and placement:
                print(f"  - Campaign '{campaign.name}' → Placement '{placement.placement_key}'")
        
        # Test serve_ads logic
        print("\n" + "="*60)
        print("TESTING AD SERVING LOGIC")
        print("="*60)
        
        now = datetime.utcnow()
        test_placements = ['job_feed_top', 'job_feed_mid', 'home_page_mid']
        
        for placement_key in test_placements:
            print(f"\n🔍 Testing placement: {placement_key}")
            
            placement = AdPlacement.query.filter_by(placement_key=placement_key).first()
            if not placement:
                print(f"  ✗ Placement not found in database")
                continue
            
            if not placement.is_active:
                print(f"  ✗ Placement is inactive")
                continue
            
            print(f"  ✓ Placement found and active")
            
            # Get campaigns for this placement
            campaign_placements = AdCampaignPlacement.query.filter_by(
                placement_id=placement.id
            ).all()
            campaign_ids = [cp.campaign_id for cp in campaign_placements]
            
            if not campaign_ids:
                print(f"  ⚠ No campaigns linked to this placement")
                continue
            
            print(f"  ✓ {len(campaign_ids)} campaign(s) linked")
            
            # Check if campaigns are active and within date range
            active_campaigns = AdCampaign.query.filter(
                AdCampaign.id.in_(campaign_ids),
                AdCampaign.status == 'ACTIVE',
                AdCampaign.start_date <= now,
                AdCampaign.budget_spent < AdCampaign.budget_total
            ).all()
            
            print(f"  ✓ {len(active_campaigns)} ACTIVE campaign(s) ready to serve")
            
            for campaign in active_campaigns:
                creatives = campaign.creatives.filter_by(is_active=True).all()
                print(f"    - {campaign.name}: {len(creatives)} active creative(s)")
                
                # Check format compatibility
                allowed_formats = placement.get_allowed_formats()
                for creative in creatives:
                    if creative.ad_format in allowed_formats:
                        print(f"      ✓ {creative.title} ({creative.ad_format}) - Compatible")
                    else:
                        print(f"      ✗ {creative.title} ({creative.ad_format}) - Format not allowed for this placement")

if __name__ == '__main__':
    verify_ads()
