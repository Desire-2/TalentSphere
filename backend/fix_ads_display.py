#!/usr/bin/env python3
"""
Fix ads display by activating campaigns and linking to placements
Run this after DB is already initialized
"""

import os
import sys
from datetime import datetime, timedelta
from decimal import Decimal

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

# Use app context to avoid multiple model materializations
if __name__ == '__main__':
    from main import app, AdCampaign, AdCreative, AdPlacement, AdCampaignPlacement, db
    import json
        
    with app.app_context():
        
        print("\n" + "="*60)
        print("FIX ADS DISPLAY SYSTEM")
        print("="*60)
        
        # Step 1: Ensure all placements exist
        print("\n📝 Ensuring all ad placements exist...")
        placements_config = [
            {
                'name': 'Home Page Top Banner',
                'placement_key': 'home_page_banner',
                'page_context': 'HOMEPAGE',
                'allowed_formats': ['BANNER_HORIZONTAL', 'BANNER_VERTICAL'],
                'max_ads_per_load': 1,
                'is_active': True
            },
            {
                'name': 'Home Page Mid Section',
                'placement_key': 'home_page_mid',
                'page_context': 'HOMEPAGE',
                'allowed_formats': ['CARD', 'INLINE_FEED', 'SPONSORED_JOB'],
                'max_ads_per_load': 2,
                'is_active': True
            },
            {
                'name': 'Job Feed Top Banner',
                'placement_key': 'job_feed_top',
                'page_context': 'JOB_LISTING',
                'allowed_formats': ['BANNER_HORIZONTAL', 'BANNER_VERTICAL'],
                'max_ads_per_load': 1,
                'is_active': True
            },
            {
                'name': 'Job Feed Middle',
                'placement_key': 'job_feed_mid',
                'page_context': 'JOB_LISTING',
                'allowed_formats': ['CARD', 'INLINE_FEED', 'SPONSORED_JOB'],
                'max_ads_per_load': 2,
                'is_active': True
            },
            {
                'name': 'Job Detail Sidebar',
                'placement_key': 'job_detail_sidebar',
                'page_context': 'JOB_DETAIL',
                'allowed_formats': ['CARD', 'BANNER_VERTICAL'],
                'max_ads_per_load': 1,
                'is_active': True
            },
            {
                'name': 'Scholarship Feed',
                'placement_key': 'scholarship_feed_mid',
                'page_context': 'SCHOLARSHIP_LISTING',
                'allowed_formats': ['CARD', 'INLINE_FEED'],
                'max_ads_per_load': 1,
                'is_active': True
            },
            {
                'name': 'Companies Feed',
                'placement_key': 'companies_feed',
                'page_context': 'COMPANIES_LISTING',
                'allowed_formats': ['CARD', 'INLINE_FEED', 'BANNER_HORIZONTAL'],
                'max_ads_per_load': 1,
                'is_active': True
            },
            {
                'name': 'Dashboard Spotlight',
                'placement_key': 'dashboard_spotlight',
                'page_context': 'DASHBOARD',
                'allowed_formats': ['SPOTLIGHT'],
                'max_ads_per_load': 1,
                'is_active': True
            }
        ]
        
        placement_map = {}
        for config in placements_config:
            existing = AdPlacement.query.filter_by(placement_key=config['placement_key']).first()
            if existing:
                placement_map[config['placement_key']] = existing.id
                print(f"  ✓ {config['placement_key']} already exists")
            else:
                placement = AdPlacement(
                    name=config['name'],
                    display_name=config['name'],  # Required by database schema
                    placement_key=config['placement_key'],
                    page_context=config['page_context'],
                    allowed_formats=json.dumps(config['allowed_formats']),
                    max_ads_per_load=config['max_ads_per_load'],
                    is_active=config['is_active']
                )
                db.session.add(placement)
                db.session.flush()
                placement_map[config['placement_key']] = placement.id
                print(f"  ✓ Created {config['placement_key']}")
        
        db.session.commit()
        
        # Step 2: Set existing campaigns to ACTIVE status
        print("\n⚡ Activating existing ad campaigns...")
        campaigns = AdCampaign.query.all()
        for campaign in campaigns:
            if campaign.status != 'ACTIVE':
                campaign.status = 'ACTIVE'
                # Ensure dates are set properly
                if not campaign.start_date:
                    campaign.start_date = datetime.utcnow()
                if not campaign.end_date:
                    campaign.end_date = datetime.utcnow() + timedelta(days=90)
                print(f"  ✓ Activated campaign: {campaign.name}")
            else:
                print(f"  ✓ Campaign already active: {campaign.name}")
        
        db.session.commit()
        
        # Step 3: Link campaigns to placements
        print("\n🔗 Linking campaigns to placements...")
        campaigns = AdCampaign.query.all()
        for campaign in campaigns:
            # Check if already linked
            existing_links = AdCampaignPlacement.query.filter_by(campaign_id=campaign.id).count()
            
            if existing_links == 0:
                # Link to default job feed placements
                default_placements = ['job_feed_top', 'job_feed_mid']
                for placement_key in default_placements:
                    if placement_key in placement_map:
                        link = AdCampaignPlacement(
                            campaign_id=campaign.id,
                            placement_id=placement_map[placement_key]
                        )
                        db.session.add(link)
                        print(f"  ✓ Linked '{campaign.name}' → '{placement_key}'")
                db.session.commit()
            else:
                print(f"  ✓ Campaign already linked: {campaign.name}")
        
        # Step 4: Verify setup
        print("\n✅ VERIFICATION")
        print("-" * 60)
        
        active_campaigns = AdCampaign.query.filter_by(status='ACTIVE').count()
        print(f"Active campaigns: {active_campaigns}")
        
        placements = AdPlacement.query.count()
        print(f"Total placements: {placements}")
        
        links = AdCampaignPlacement.query.count()
        print(f"Campaign-to-placement links: {links}")
        
        # Test each placement
        print("\n🔍 Testing ad serving for placements:")
        test_placements = ['job_feed_top', 'job_feed_mid', 'home_page_mid']
        for placement_key in test_placements:
            placement = AdPlacement.query.filter_by(placement_key=placement_key).first()
            if placement:
                links = AdCampaignPlacement.query.filter_by(placement_id=placement.id).count()
                print(f"  {placement_key}: {links} campaign(s) linked")
        
        print("\n" + "="*60)
        print("✓ Ad system fix complete!")
        print("="*60)
