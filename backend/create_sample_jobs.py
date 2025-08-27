#!/usr/bin/env python3
"""
Create sample jobs for TalentSphere
"""

import os
import sys
from datetime import datetime
import json
import re

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from main import app
from src.models.user import db, User
from src.models.company import Company
from src.models.job import Job, JobCategory

def slugify(text):
    """Convert text to URL-friendly slug"""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'\s+', '-', text)
    return text.strip('-')

def create_sample_jobs():
    """Create sample job postings"""
    with app.app_context():
        print("Creating sample jobs...")
        
        # Get categories and companies
        software_category = JobCategory.query.filter_by(name='Software Development').first()
        marketing_category = JobCategory.query.filter_by(name='Marketing').first()
        
        # Get companies
        companies = Company.query.all()
        if not companies:
            print("No companies found! Creating sample companies first...")
            # Create a sample company
            sample_company = Company(
                name='TechCorp Solutions',
                description='Leading technology solutions provider',
                email='contact@techcorp.com',
                phone='+1-555-0123',
                website='https://techcorp.com',
                city='San Francisco',
                state='CA',
                country='USA',
                is_verified=True,
                is_active=True
            )
            db.session.add(sample_company)
            db.session.commit()
            companies = [sample_company]
        
        # Get an admin or employer user to be the poster
        admin_user = User.query.filter_by(role='admin').first()
        if not admin_user:
            print("No admin user found! Please create an admin user first.")
            return
        
        # Create job categories if they don't exist
        if not software_category:
            software_category = JobCategory(
                name='Software Development',
                slug='software-development',
                description='Software development and engineering roles'
            )
            db.session.add(software_category)
            
        if not marketing_category:
            marketing_category = JobCategory(
                name='Marketing',
                slug='marketing',
                description='Marketing and advertising roles'
            )
            db.session.add(marketing_category)
            
        db.session.commit()
        
        # Sample jobs data
        jobs_data = [
            {
                'title': 'Senior Full Stack Developer',
                'slug': slugify('Senior Full Stack Developer'),
                'description': '''We are looking for an experienced Full Stack Developer to join our dynamic team. 

Key Responsibilities:
- Develop and maintain web applications using modern technologies
- Collaborate with cross-functional teams to define and implement new features
- Optimize applications for maximum speed and scalability
- Write clean, maintainable, and well-documented code

Requirements:
- 5+ years of experience in full-stack development
- Proficiency in Python, JavaScript, React, and Node.js
- Experience with databases (PostgreSQL, MongoDB)
- Strong problem-solving skills and attention to detail''',
                'company_id': companies[0].id,
                'category_id': software_category.id,
                'posted_by': admin_user.id,
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
                'is_active': True,
                'is_featured': True,
                'published_at': datetime.utcnow(),
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            },
            {
                'title': 'Data Scientist - Machine Learning',
                'slug': slugify('Data Scientist - Machine Learning'),
                'description': '''Join our data science team to build cutting-edge ML models and drive data-driven decisions.

Key Responsibilities:
- Design and implement machine learning algorithms
- Analyze large datasets to extract meaningful insights
- Build predictive models and recommendation systems
- Collaborate with engineering teams to deploy models in production

Requirements:
- 3+ years of experience in data science or machine learning
- Strong programming skills in Python and R
- Experience with ML frameworks (TensorFlow, PyTorch, Scikit-learn)
- Knowledge of statistics and data analysis techniques''',
                'company_id': companies[0].id,
                'category_id': software_category.id,
                'posted_by': admin_user.id,
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
                'is_active': True,
                'is_featured': False,
                'published_at': datetime.utcnow(),
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            },
            {
                'title': 'Frontend Developer - React',
                'slug': slugify('Frontend Developer - React'),
                'description': '''We're seeking a talented Frontend Developer to create amazing user experiences.

Key Responsibilities:
- Build responsive and interactive user interfaces
- Implement designs with pixel-perfect accuracy
- Optimize applications for performance and usability
- Write clean, reusable, and testable code

Requirements:
- 2+ years of experience in frontend development
- Expertise in React, HTML5, CSS3, and JavaScript
- Experience with state management (Redux, Context API)
- Understanding of responsive design principles''',
                'company_id': companies[0].id,
                'category_id': software_category.id,
                'posted_by': admin_user.id,
                'employment_type': 'Full-time',
                'experience_level': 'Mid-level',
                'city': 'Austin',
                'state': 'TX',
                'country': 'USA',
                'is_remote': True,
                'salary_min': 80000,
                'salary_max': 120000,
                'required_skills': json.dumps(['React', 'JavaScript', 'HTML5', 'CSS3', 'Redux']),
                'years_experience_min': 2,
                'status': 'published',
                'is_active': True,
                'is_featured': False,
                'published_at': datetime.utcnow(),
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            },
            {
                'title': 'Digital Marketing Manager',
                'slug': slugify('Digital Marketing Manager'),
                'description': '''Lead our digital marketing efforts and drive growth through innovative campaigns.

Key Responsibilities:
- Develop and execute digital marketing strategies
- Manage social media accounts and content creation
- Analyze campaign performance and optimize for ROI
- Collaborate with sales and product teams

Requirements:
- 4+ years of experience in digital marketing
- Proficiency in Google Analytics, AdWords, and social media platforms
- Strong analytical and communication skills
- Experience with email marketing and content management systems''',
                'company_id': companies[0].id,
                'category_id': marketing_category.id,
                'posted_by': admin_user.id,
                'employment_type': 'Full-time',
                'experience_level': 'Senior',
                'city': 'Los Angeles',
                'state': 'CA',
                'country': 'USA',
                'is_remote': False,
                'salary_min': 70000,
                'salary_max': 95000,
                'required_skills': json.dumps(['Digital Marketing', 'Google Analytics', 'SEO', 'Social Media', 'Content Marketing']),
                'years_experience_min': 4,
                'status': 'published',
                'is_active': True,
                'is_featured': False,
                'published_at': datetime.utcnow(),
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            },
            {
                'title': 'Backend Developer - Python',
                'slug': slugify('Backend Developer - Python'),
                'description': '''Join our backend team to build scalable and robust server-side applications.

Key Responsibilities:
- Design and develop RESTful APIs
- Implement database schemas and optimize queries
- Ensure application security and performance
- Write comprehensive tests and documentation

Requirements:
- 3+ years of experience in backend development
- Strong knowledge of Python and web frameworks (Flask, Django)
- Experience with databases (PostgreSQL, Redis)
- Understanding of microservices architecture''',
                'company_id': companies[0].id,
                'category_id': software_category.id,
                'posted_by': admin_user.id,
                'employment_type': 'Full-time',
                'experience_level': 'Mid-level',
                'city': 'Seattle',
                'state': 'WA',
                'country': 'USA',
                'is_remote': True,
                'salary_min': 90000,
                'salary_max': 130000,
                'required_skills': json.dumps(['Python', 'Flask', 'PostgreSQL', 'REST APIs', 'Docker']),
                'years_experience_min': 3,
                'status': 'pending',
                'is_active': True,
                'is_featured': False,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
        ]
        
        # Create jobs
        created_jobs = []
        for job_data in jobs_data:
            # Check if job already exists
            existing_job = Job.query.filter_by(title=job_data['title']).first()
            if not existing_job:
                job = Job(**job_data)
                db.session.add(job)
                created_jobs.append(job_data['title'])
        
        db.session.commit()
        
        print(f"✓ Created {len(created_jobs)} sample jobs:")
        for title in created_jobs:
            print(f"  - {title}")
        
        # Show total jobs count
        total_jobs = Job.query.count()
        print(f"\n✓ Total jobs in database: {total_jobs}")

if __name__ == '__main__':
    create_sample_jobs()
