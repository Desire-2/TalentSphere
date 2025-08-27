#!/usr/bin/env python3
"""
Database initialization script for TalentSphere Job Portal
Creates all database tables and optionally seeds with sample data
"""

import os
import sys
from datetime import datetime, timedelta
from decimal import Decimal
import json

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from main import app
from models.user import db, User, JobSeekerProfile, EmployerProfile
from models.company import Company, CompanyBenefit, CompanyTeamMember
from models.job import Job, JobCategory, JobBookmark, JobAlert
from models.application import Application, ApplicationActivity, ApplicationQuestion, ApplicationTemplate
from models.featured_ad import FeaturedAd, FeaturedAdPackage, Payment, Subscription
from models.notification import Notification, NotificationTemplate, Review, ReviewVote, Message

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
        
        # Create featured ad packages
        packages_data = [
            {
                'name': 'Basic Promotion',
                'description': 'Basic job promotion for 7 days',
                'duration_days': 7,
                'priority_level': 1,
                'price': Decimal('29.99'),
                'includes_homepage': False,
                'includes_category_top': True,
                'includes_search_boost': True
            },
            {
                'name': 'Premium Promotion',
                'description': 'Premium job promotion for 14 days',
                'duration_days': 14,
                'priority_level': 2,
                'price': Decimal('59.99'),
                'includes_homepage': True,
                'includes_category_top': True,
                'includes_search_boost': True,
                'includes_social_media': True,
                'is_popular': True
            },
            {
                'name': 'Enterprise Promotion',
                'description': 'Enterprise job promotion for 30 days',
                'duration_days': 30,
                'priority_level': 3,
                'price': Decimal('99.99'),
                'includes_homepage': True,
                'includes_category_top': True,
                'includes_search_boost': True,
                'includes_social_media': True,
                'includes_newsletter': True
            }
        ]
        
        for pkg_data in packages_data:
            if not FeaturedAdPackage.query.filter_by(name=pkg_data['name']).first():
                package = FeaturedAdPackage(**pkg_data)
                db.session.add(package)
        
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

