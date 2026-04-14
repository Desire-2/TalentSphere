#!/usr/bin/env python3
"""
Fix campaign end dates so ads display
"""

import os, sys
from datetime import datetime, timedelta
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from main import app, AdCampaign, db

with app.app_context():
    campaigns = AdCampaign.query.all()
    
    print("\n" + "="*60)
    print("FIXING CAMPAIGN END DATES")
    print("="*60 + "\n")
    
    now = datetime.utcnow()
    
    for campaign in campaigns:
        old_end = campaign.end_date
        
        # Set end date to 90 days from now if it's in the past or None
        if not campaign.end_date or campaign.end_date < now:
            campaign.end_date = now + timedelta(days=90)
            
            print(f"✅ Updated: {campaign.name}")
            print(f"   Old end: {old_end}")
            print(f"   New end: {campaign.end_date}")
            print()
    
    db.session.commit()
    print("="*60)
    print("✓ All campaigns ended dates fixed!")
    print("="*60)
