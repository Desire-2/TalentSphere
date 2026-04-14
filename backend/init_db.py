#!/usr/bin/env python3
"""
Database initialization script for TalentSphere Job Portal
Creates all database tables and optionally seeds with sample data
"""

import os
import sys
from datetime import datetime, timedelta
from decimal import Decimal
from decimal import Decimal
import json

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from main import app
from models.user import db, User, JobSeekerProfile, EmployerProfile
from models.company import Company, CompanyBenefit, CompanyTeamMember
from models.job import Job, JobCategory, JobBookmark, JobAlert
from models.application import Application, ApplicationActivity, ApplicationQuestion, ApplicationTemplate
from models.notification import Notification, NotificationTemplate, Review, ReviewVote, Message
from models.ads import (
    AdCampaign, AdCreative, AdPlacement, AdCampaignPlacement,
    AdImpression, AdClick, AdAnalyticsDaily, AdCredit, AdReview
)

def create_tables():
    """Create all database tables"""
    print("Creating database tables...")
    with app.app_context():
        # Drop all tables first to avoid conflicts
        db.drop_all()
        # Create all tables
        db.create_all()
    print("✓ Database tables created successfully")

def seed_sample_data():
    """Seed database with sample data"""
    print("Seeding sample data...")
    
    with app.app_context():
        # Create job categories
        categories = [
            {'name': 'Software Development', 'description': 'Programming and software engineering roles'},
            {'name': 'Data Science', 'description': 'Data analysis, machine learning, and AI roles'},
            {'name': 'Design', 'description': 'UI/UX, graphic design, and creative roles'},
            {'name': 'Marketing', 'description': 'Digital marketing, content, and growth roles'},
            {'name': 'Sales', 'description': 'Sales, business development, and account management'},
            {'name': 'Product Management', 'description': 'Product strategy and management roles'},
            {'name': 'Operations', 'description': 'Operations, logistics, and process management'},
            {'name': 'Finance', 'description': 'Finance, accounting, and investment roles'},
            {'name': 'Human Resources', 'description': 'HR, recruiting, and people operations'},
            {'name': 'Customer Support', 'description': 'Customer service and support roles'}
        ]
        
        for cat_data in categories:
            if not JobCategory.query.filter_by(name=cat_data['name']).first():
                category = JobCategory(**cat_data)
                db.session.add(category)
        
        # Create admin user
        admin_email = 'admin@talentsphere.com'
        if not User.query.filter_by(email=admin_email).first():
            admin = User(
                email=admin_email,
                first_name='Admin',
                last_name='User',
                role='admin',
                is_verified=True,
                is_active=True
            )
            admin.set_password('admin123')
            db.session.add(admin)
        
        # Create sample companies
        companies_data = [
            {
                'name': 'TechCorp Solutions',
                'description': 'Leading technology solutions provider',
                'industry': 'Technology',
                'company_size': '201-500',
                'website': 'https://techcorp.com',
                'location': 'San Francisco, CA',
                'is_verified': True,
                'is_featured': True
            },
            {
                'name': 'DataFlow Analytics',
                'description': 'Data science and analytics company',
                'industry': 'Data & Analytics',
                'company_size': '51-200',
                'website': 'https://dataflow.com',
                'location': 'New York, NY',
                'is_verified': True
            },
            {
                'name': 'Creative Studios Inc',
                'description': 'Digital design and creative agency',
                'industry': 'Design & Creative',
                'company_size': '11-50',
                'website': 'https://creativestudios.com',
                'location': 'Los Angeles, CA',
                'is_verified': True
            }
        ]
        
        for comp_data in companies_data:
            if not Company.query.filter_by(name=comp_data['name']).first():
                company = Company(**comp_data)
                db.session.add(company)
        
        db.session.commit()
        
        # Create sample employer users
        employers_data = [
            {
                'email': 'hr@techcorp.com',
                'first_name': 'Sarah',
                'last_name': 'Johnson',
                'company_name': 'TechCorp Solutions'
            },
            {
                'email': 'recruiter@dataflow.com',
                'first_name': 'Mike',
                'last_name': 'Chen',
                'company_name': 'DataFlow Analytics'
            }
        ]
        
        for emp_data in employers_data:
            if not User.query.filter_by(email=emp_data['email']).first():
                employer = User(
                    email=emp_data['email'],
                    first_name=emp_data['first_name'],
                    last_name=emp_data['last_name'],
                    role='employer',
                    is_verified=True,
                    is_active=True
                )
                employer.set_password('password123')
                db.session.add(employer)
                db.session.flush()
                
                # Create employer profile
                company = Company.query.filter_by(name=emp_data['company_name']).first()
                if company:
                    profile = EmployerProfile(
                        user_id=employer.id,
                        company_id=company.id,
                        position='HR Manager',
                        department='Human Resources'
                    )
                    db.session.add(profile)
        
        # Create sample job seeker users
        job_seekers_data = [
            {
                'email': 'john.doe@email.com',
                'first_name': 'John',
                'last_name': 'Doe',
                'skills': ['Python', 'JavaScript', 'React', 'Node.js'],
                'experience': 3,
                'position': 'Full Stack Developer'
            },
            {
                'email': 'jane.smith@email.com',
                'first_name': 'Jane',
                'last_name': 'Smith',
                'skills': ['Data Science', 'Python', 'Machine Learning', 'SQL'],
                'experience': 5,
                'position': 'Data Scientist'
            }
        ]
        
        for js_data in job_seekers_data:
            if not User.query.filter_by(email=js_data['email']).first():
                job_seeker = User(
                    email=js_data['email'],
                    first_name=js_data['first_name'],
                    last_name=js_data['last_name'],
                    role='job_seeker',
                    is_verified=True,
                    is_active=True
                )
                job_seeker.set_password('password123')
                db.session.add(job_seeker)
                db.session.flush()
                
                # Create job seeker profile
                profile = JobSeekerProfile(
                    user_id=job_seeker.id,
                    desired_position=js_data['position'],
                    skills=json.dumps(js_data['skills']),
                    years_of_experience=js_data['experience'],
                    education_level='Bachelor\'s Degree',
                    preferred_location='Remote',
                    job_type_preference='Full-time',
                    open_to_opportunities=True
                )
                db.session.add(profile)
        
        db.session.commit()
        
        # Create sample jobs
        software_category = JobCategory.query.filter_by(name='Software Development').first()
        data_category = JobCategory.query.filter_by(name='Data Science').first()
        techcorp = Company.query.filter_by(name='TechCorp Solutions').first()
        dataflow = Company.query.filter_by(name='DataFlow Analytics').first()
        employer1 = User.query.filter_by(email='hr@techcorp.com').first()
        employer2 = User.query.filter_by(email='recruiter@dataflow.com').first()
        
        jobs_data = [
            {
                'title': 'Senior Full Stack Developer',
                'description': 'We are looking for an experienced Full Stack Developer to join our team...',
                'company_id': techcorp.id if techcorp else None,
                'category_id': software_category.id if software_category else None,
                'posted_by': employer1.id if employer1 else None,
                'employment_type': 'Full-time',
                'experience_level': 'Senior',
                'city': 'San Francisco',
                'state': 'CA',
                'country': 'USA',
                'is_remote': True,
                'salary_min': 120000,
                'salary_max': 180000,
                'required_skills': json.dumps(['Python', 'JavaScript', 'React', 'Node.js', 'PostgreSQL']),
                'years_experience_min': 5,
                'status': 'published',
                'published_at': datetime.utcnow()
            },
            {
                'title': 'Data Scientist - Machine Learning',
                'description': 'Join our data science team to build cutting-edge ML models...',
                'company_id': dataflow.id if dataflow else None,
                'category_id': data_category.id if data_category else None,
                'posted_by': employer2.id if employer2 else None,
                'employment_type': 'Full-time',
                'experience_level': 'Mid-level',
                'city': 'New York',
                'state': 'NY',
                'country': 'USA',
                'is_remote': False,
                'salary_min': 100000,
                'salary_max': 150000,
                'required_skills': json.dumps(['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Statistics']),
                'years_experience_min': 3,
                'status': 'published',
                'published_at': datetime.utcnow()
            }
        ]
        
        for job_data in jobs_data:
            if not Job.query.filter_by(title=job_data['title']).first():
                job = Job(**job_data)
                db.session.add(job)
        
        # Create all Ad Placements from configuration
        placements_data = [
            {
                'name': 'Home Page Top Banner',
                'placement_key': 'home_page_banner',
                'page_context': 'HOMEPAGE',
                'allowed_formats': json.dumps(['BANNER_HORIZONTAL', 'BANNER_VERTICAL']),
                'max_ads_per_load': 1,
                'is_active': True
            },
            {
                'name': 'Home Page Mid Section',
                'placement_key': 'home_page_mid',
                'page_context': 'HOMEPAGE',
                'allowed_formats': json.dumps(['CARD', 'INLINE_FEED', 'SPONSORED_JOB']),
                'max_ads_per_load': 2,
                'is_active': True
            },
            {
                'name': 'Job Feed Top Banner',
                'placement_key': 'job_feed_top',
                'page_context': 'JOB_LISTING',
                'allowed_formats': json.dumps(['BANNER_HORIZONTAL', 'BANNER_VERTICAL']),
                'max_ads_per_load': 1,
                'is_active': True
            },
            {
                'name': 'Job Feed Middle',
                'placement_key': 'job_feed_mid',
                'page_context': 'JOB_LISTING',
                'allowed_formats': json.dumps(['CARD', 'INLINE_FEED', 'SPONSORED_JOB']),
                'max_ads_per_load': 2,
                'is_active': True
            },
            {
                'name': 'Job Detail Sidebar',
                'placement_key': 'job_detail_sidebar',
                'page_context': 'JOB_DETAIL',
                'allowed_formats': json.dumps(['CARD', 'BANNER_VERTICAL']),
                'max_ads_per_load': 1,
                'is_active': True
            },
            {
                'name': 'Scholarship Feed',
                'placement_key': 'scholarship_feed_mid',
                'page_context': 'SCHOLARSHIP_LISTING',
                'allowed_formats': json.dumps(['CARD', 'INLINE_FEED']),
                'max_ads_per_load': 1,
                'is_active': True
            },
            {
                'name': 'Companies Feed',
                'placement_key': 'companies_feed',
                'page_context': 'COMPANIES_LISTING',
                'allowed_formats': json.dumps(['CARD', 'INLINE_FEED', 'BANNER_HORIZONTAL']),
                'max_ads_per_load': 1,
                'is_active': True
            },
            {
                'name': 'Dashboard Spotlight',
                'placement_key': 'dashboard_spotlight',
                'page_context': 'DASHBOARD',
                'allowed_formats': json.dumps(['SPOTLIGHT']),
                'max_ads_per_load': 1,
                'is_active': True
            }
        ]
        
        placement_dict = {}
        for placement_data in placements_data:
            if not AdPlacement.query.filter_by(placement_key=placement_data['placement_key']).first():
                placement = AdPlacement(**placement_data)
                db.session.add(placement)
                db.session.flush()
                placement_dict[placement_data['placement_key']] = placement.id
            else:
                existing = AdPlacement.query.filter_by(placement_key=placement_data['placement_key']).first()
                placement_dict[placement_data['placement_key']] = existing.id
        
        db.session.commit()
        
        # Create sample ad campaigns set to ACTIVE status so they display
        employer1 = User.query.filter_by(email='hr@techcorp.com').first()
        employer2 = User.query.filter_by(email='recruiter@dataflow.com').first()
        
        campaigns_data = [
            {
                'employer': employer1,
                'name': 'Senior Developer Positions - Q1 2024',
                'description': 'We are hiring experienced developers for our growing team',
                'objective': 'TRAFFIC',
                'billing_type': 'CPC',
                'budget_total': 2500,
                'bid_amount': Decimal('0.50'),
                'placements': ['job_feed_top', 'job_feed_mid'],
                'format': 'CARD'
            },
            {
                'employer': employer2,
                'name': 'Data Science Opportunities',
                'description': 'Join our data science team and work on cutting-edge ML projects',
                'objective': 'LEADS',
                'billing_type': 'CPM',
                'budget_total': 1500,
                'bid_amount': Decimal('5.00'),
                'placements': ['job_feed_mid', 'home_page_mid'],
                'format': 'INLINE_FEED'
            }
        ]
        
        for campaign_data in campaigns_data:
            if not AdCampaign.query.filter_by(name=campaign_data['name']).first():
                start_date = datetime.utcnow()
                end_date = start_date + timedelta(days=90)
                
                campaign = AdCampaign(
                    employer_id=campaign_data['employer'].id if campaign_data['employer'] else None,
                    name=campaign_data['name'],
                    objective=campaign_data['objective'],
                    billing_type=campaign_data['billing_type'],
                    budget_total=campaign_data['budget_total'],
                    budget_spent=0,
                    bid_amount=campaign_data['bid_amount'],
                    start_date=start_date,
                    end_date=end_date,
                    status='ACTIVE',  # ✅ ACTIVE status so ads will display
                    created_at=datetime.utcnow()
                )
                db.session.add(campaign)
                db.session.flush()
                
                # Create a creative for the campaign
                creative = AdCreative(
                    campaign_id=campaign.id,
                    title=campaign_data['name'],
                    body_text=campaign_data['description'],
                    cta_text='View Positions',
                    cta_url='https://talentsphere.com/careers',
                    ad_format=campaign_data['format'],  # Use specified format
                    image_url='https://via.placeholder.com/600x400?text=Career+Opportunity',
                    is_active=True,
                    created_at=datetime.utcnow()
                )
                db.session.add(creative)
                db.session.flush()
                
                # ✅ Link campaign to its placements via AdCampaignPlacement
                for placement_key in campaign_data['placements']:
                    if placement_key in placement_dict:
                        campaign_placement = AdCampaignPlacement(
                            campaign_id=campaign.id,
                            placement_id=placement_dict[placement_key]
                        )
                        db.session.add(campaign_placement)
        
        db.session.commit()
        
    print("✓ Sample data seeded successfully")

def main():
    """Main function"""
    print("TalentSphere Database Initialization")
    print("=" * 40)
    
    # Create tables
    create_tables()
    
    # Ask if user wants to seed sample data
    seed_data = input("\nDo you want to seed sample data? (y/n): ").lower().strip()
    if seed_data in ['y', 'yes']:
        seed_sample_data()
    
    print("\n✓ Database initialization completed successfully!")
    print("\nSample login credentials:")
    print("Admin: admin@talentsphere.com / admin123")
    print("Employer: hr@techcorp.com / password123")
    print("Job Seeker: john.doe@email.com / password123")

if __name__ == '__main__':
    main()

