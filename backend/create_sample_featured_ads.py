#!/usr/bin/env python3
"""
Create sample featured ads data for testing
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.main import app
from src.models.user import db
from src.models.featured_ad import FeaturedAd, FeaturedAdPackage, Payment
from src.models.job import Job
from src.models.company import Company
from datetime import datetime, timedelta
from decimal import Decimal

def create_sample_data():
    with app.app_context():
        print("Creating sample featured ads data...")
        
        # Create a featured ad package first
        package = FeaturedAdPackage(
            name="Premium Featured",
            description="Premium visibility for your job posts",
            duration_days=30,
            priority_level=1,
            includes_homepage=True,
            includes_category_top=True,
            includes_search_boost=True,
            price=Decimal('99.99'),
            currency='USD',
            is_active=True,
            is_popular=True
        )
        db.session.add(package)
        db.session.flush()
        
        # Get some featured jobs
        featured_jobs = Job.query.filter_by(is_featured=True, status='published').all()
        
        if not featured_jobs:
            print("No featured jobs found. Please create some featured jobs first.")
            return
        
        # Create payment records and featured ads for each job
        for i, job in enumerate(featured_jobs[:3]):  # Limit to 3 for demo
            # Create a payment record
            payment = Payment(
                user_id=job.posted_by,
                company_id=job.company_id,
                payment_id=f"PAY_DEMO_{i+1}_{datetime.utcnow().strftime('%Y%m%d')}",
                amount=package.price,
                currency='USD',
                status='completed',
                payment_method='demo_data',
                gateway='demo',
                gateway_transaction_id=f"TXN_DEMO_{i+1}",
                purpose='featured_ad',
                description=f'Featured ad for: {job.title}',
                billing_name='Demo User',
                billing_email='demo@example.com',
                paid_at=datetime.utcnow()
            )
            db.session.add(payment)
            db.session.flush()
            
            # Create featured ad
            start_date = datetime.utcnow() - timedelta(days=i)  # Stagger start dates
            featured_ad = FeaturedAd(
                company_id=job.company_id,
                job_id=job.id,
                package_id=package.id,
                payment_id=payment.id,
                campaign_name=f"Featured Campaign - {job.title}",
                start_date=start_date,
                end_date=start_date + timedelta(days=package.duration_days),
                status='active',
                impressions=1000 + (i * 500),  # Mock some analytics
                clicks=50 + (i * 25),
                applications_generated=5 + (i * 3),
                custom_title=f"{job.title} - Join {job.company.name}!",
                custom_description=f"Exciting opportunity to work on cutting-edge projects at {job.company.name}. " + 
                                 f"We're looking for talented individuals to join our growing team.",
                custom_image_url='/api/placeholder/800/400'
            )
            db.session.add(featured_ad)
            print(f"Created featured ad for: {job.title}")
        
        db.session.commit()
        print("Sample featured ads data created successfully!")
        
        # Verify creation
        ads = FeaturedAd.query.all()
        print(f"Total featured ads in database: {len(ads)}")
        for ad in ads:
            print(f"  - {ad.custom_title} ({ad.status})")

if __name__ == '__main__':
    create_sample_data()
