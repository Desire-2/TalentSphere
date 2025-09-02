#!/usr/bin/env python3
"""
Create Sample External Jobs Script
This script creates sample external jobs for testing the external admin functionality.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.models.user import db, User
from src.models.job import Job, JobCategory
from datetime import datetime, timedelta
import random

# Sample external jobs data
SAMPLE_EXTERNAL_JOBS = [
    {
        'title': 'Senior Software Engineer',
        'external_company_name': 'TechCorp Solutions',
        'external_company_website': 'https://techcorp.com',
        'description': 'We are seeking a Senior Software Engineer to join our growing team. You will be responsible for designing, developing, and maintaining scalable software solutions using modern technologies.',
        'summary': 'Senior Software Engineer role at TechCorp Solutions with focus on scalable software development.',
        'employment_type': 'full-time',
        'experience_level': 'senior',
        'location_type': 'remote',
        'city': 'San Francisco',
        'state': 'California',
        'country': 'USA',
        'salary_min': 120000,
        'salary_max': 180000,
        'required_skills': 'Python, React, AWS, Docker, PostgreSQL',
        'application_url': 'https://techcorp.com/careers/senior-software-engineer',
        'source_url': 'https://jobs.techcorp.com/senior-engineer-2024'
    },
    {
        'title': 'Data Scientist',
        'external_company_name': 'DataInnovate Inc',
        'external_company_website': 'https://datainnovate.com',
        'description': 'Join our data science team to work on cutting-edge machine learning projects. You will analyze large datasets, build predictive models, and drive data-driven decision making.',
        'summary': 'Data Scientist position focusing on machine learning and predictive analytics.',
        'employment_type': 'full-time',
        'experience_level': 'mid',
        'location_type': 'hybrid',
        'city': 'New York',
        'state': 'New York',
        'country': 'USA',
        'salary_min': 100000,
        'salary_max': 150000,
        'required_skills': 'Python, R, Machine Learning, SQL, Statistics',
        'application_email': 'careers@datainnovate.com',
        'source_url': 'https://datainnovate.com/jobs/data-scientist'
    },
    {
        'title': 'Frontend Developer',
        'external_company_name': 'WebStudio Creative',
        'external_company_website': 'https://webstudio.com',
        'description': 'We are looking for a talented Frontend Developer to create amazing user experiences. You will work closely with our design team to implement responsive and interactive web applications.',
        'summary': 'Frontend Developer role creating amazing user experiences with modern web technologies.',
        'employment_type': 'contract',
        'experience_level': 'mid',
        'location_type': 'remote',
        'salary_min': 80000,
        'salary_max': 120000,
        'required_skills': 'React, TypeScript, CSS3, HTML5, JavaScript',
        'application_url': 'https://webstudio.com/apply/frontend-developer',
        'source_url': 'https://careers.webstudio.com/frontend-2024'
    },
    {
        'title': 'DevOps Engineer',
        'external_company_name': 'CloudNative Systems',
        'external_company_website': 'https://cloudnative.com',
        'description': 'Join our DevOps team to build and maintain scalable cloud infrastructure. You will work with containerization, CI/CD pipelines, and monitoring systems.',
        'summary': 'DevOps Engineer position focusing on cloud infrastructure and automation.',
        'employment_type': 'full-time',
        'experience_level': 'senior',
        'location_type': 'on-site',
        'city': 'Seattle',
        'state': 'Washington',
        'country': 'USA',
        'salary_min': 130000,
        'salary_max': 190000,
        'required_skills': 'AWS, Kubernetes, Docker, Terraform, Jenkins',
        'application_email': 'jobs@cloudnative.com',
        'source_url': 'https://cloudnative.com/careers/devops-engineer'
    },
    {
        'title': 'Product Manager',
        'external_company_name': 'InnovateLab',
        'external_company_website': 'https://innovatelab.com',
        'description': 'We are seeking an experienced Product Manager to lead our product development initiatives. You will work cross-functionally to define product strategy and drive execution.',
        'summary': 'Product Manager role leading product development and strategy initiatives.',
        'employment_type': 'full-time',
        'experience_level': 'senior',
        'location_type': 'hybrid',
        'city': 'Austin',
        'state': 'Texas',
        'country': 'USA',
        'salary_min': 110000,
        'salary_max': 160000,
        'required_skills': 'Product Strategy, Agile, Analytics, User Research',
        'application_url': 'https://innovatelab.com/careers/product-manager',
        'source_url': 'https://jobs.innovatelab.com/pm-2024'
    },
    {
        'title': 'UX/UI Designer',
        'external_company_name': 'DesignForward Studio',
        'external_company_website': 'https://designforward.com',
        'description': 'Join our design team to create intuitive and beautiful user interfaces. You will conduct user research, create wireframes, and design user-centered solutions.',
        'summary': 'UX/UI Designer position creating intuitive and beautiful user interfaces.',
        'employment_type': 'full-time',
        'experience_level': 'mid',
        'location_type': 'remote',
        'salary_min': 75000,
        'salary_max': 110000,
        'required_skills': 'Figma, Adobe Creative Suite, User Research, Prototyping',
        'application_email': 'hello@designforward.com',
        'source_url': 'https://designforward.com/jobs/ux-ui-designer'
    },
    {
        'title': 'Marketing Specialist',
        'external_company_name': 'GrowthHackers Media',
        'external_company_website': 'https://growthhackers.com',
        'description': 'We are looking for a Marketing Specialist to develop and execute marketing campaigns. You will work on digital marketing, content creation, and brand management.',
        'summary': 'Marketing Specialist role developing and executing digital marketing campaigns.',
        'employment_type': 'full-time',
        'experience_level': 'entry',
        'location_type': 'on-site',
        'city': 'Los Angeles',
        'state': 'California',
        'country': 'USA',
        'salary_min': 50000,
        'salary_max': 70000,
        'required_skills': 'Digital Marketing, Social Media, Content Creation, Analytics',
        'application_url': 'https://growthhackers.com/careers/marketing-specialist',
        'source_url': 'https://jobs.growthhackers.com/marketing-2024'
    },
    {
        'title': 'Sales Manager',
        'external_company_name': 'SalesForce Pro',
        'external_company_website': 'https://salesforcepro.com',
        'description': 'Join our sales team as a Sales Manager to lead and mentor our sales representatives. You will develop sales strategies and drive revenue growth.',
        'summary': 'Sales Manager position leading sales team and driving revenue growth.',
        'employment_type': 'full-time',
        'experience_level': 'senior',
        'location_type': 'hybrid',
        'city': 'Chicago',
        'state': 'Illinois',
        'country': 'USA',
        'salary_min': 80000,
        'salary_max': 120000,
        'required_skills': 'Sales Management, CRM, Team Leadership, Negotiation',
        'application_email': 'careers@salesforcepro.com',
        'source_url': 'https://salesforcepro.com/careers/sales-manager'
    },
    {
        'title': 'Cybersecurity Analyst',
        'external_company_name': 'SecureNet Technologies',
        'external_company_website': 'https://securenet.com',
        'description': 'We are seeking a Cybersecurity Analyst to protect our organization from cyber threats. You will monitor security events, conduct risk assessments, and implement security measures.',
        'summary': 'Cybersecurity Analyst role protecting against cyber threats and implementing security measures.',
        'employment_type': 'full-time',
        'experience_level': 'mid',
        'location_type': 'on-site',
        'city': 'Washington',
        'state': 'DC',
        'country': 'USA',
        'salary_min': 90000,
        'salary_max': 130000,
        'required_skills': 'Network Security, SIEM, Incident Response, Risk Assessment',
        'application_url': 'https://securenet.com/careers/cybersecurity-analyst',
        'source_url': 'https://jobs.securenet.com/cyber-analyst-2024'
    },
    {
        'title': 'Business Analyst',
        'external_company_name': 'ConsultPro Services',
        'external_company_website': 'https://consultpro.com',
        'description': 'Join our consulting team as a Business Analyst to help clients optimize their business processes. You will analyze requirements, design solutions, and support implementation.',
        'summary': 'Business Analyst position helping clients optimize business processes and design solutions.',
        'employment_type': 'contract',
        'experience_level': 'mid',
        'location_type': 'remote',
        'salary_min': 70000,
        'salary_max': 100000,
        'required_skills': 'Business Analysis, Process Modeling, Requirements Gathering, SQL',
        'application_email': 'jobs@consultpro.com',
        'source_url': 'https://consultpro.com/careers/business-analyst'
    }
]

def create_sample_external_jobs():
    """Create sample external jobs"""
    # Import the app from main module
    import src.main as main_module
    app = main_module.app
    
    with app.app_context():
        try:
            print("🚀 Creating Sample External Jobs")
            print("=" * 50)
            
            # Check if external admin exists
            external_admin = User.query.filter_by(role='external_admin').first()
            if not external_admin:
                print("❌ No external admin user found!")
                print("Please run create_external_admin.py first to create an external admin user.")
                return False
            
            print(f"✅ Using external admin: {external_admin.get_full_name()} ({external_admin.email})")
            
            # Get available job categories
            categories = JobCategory.query.filter_by(is_active=True).all()
            if not categories:
                print("❌ No job categories found!")
                print("Please ensure job categories exist in the database.")
                return False
            
            print(f"✅ Found {len(categories)} job categories")
            
            # Create external jobs
            created_jobs = []
            for job_data in SAMPLE_EXTERNAL_JOBS:
                try:
                    # Select a random category
                    category = random.choice(categories)
                    
                    # Generate unique slug
                    from src.routes.job import generate_job_slug
                    slug = generate_job_slug(job_data['title'], job_data['external_company_name'])
                    counter = 1
                    original_slug = slug
                    while Job.query.filter_by(slug=slug).first():
                        slug = f"{original_slug}-{counter}"
                        counter += 1
                    
                    # Set expiry date (30 days from now)
                    expires_at = datetime.utcnow() + timedelta(days=30)
                    
                    # Determine application type
                    application_type = 'external'
                    if job_data.get('application_email'):
                        application_type = 'email'
                    elif job_data.get('application_url'):
                        application_type = 'external'
                    
                    # Create external job
                    job = Job(
                        company_id=None,  # External jobs don't have company profiles
                        category_id=category.id,
                        posted_by=external_admin.id,
                        title=job_data['title'],
                        slug=slug,
                        description=job_data['description'],
                        summary=job_data.get('summary'),
                        employment_type=job_data['employment_type'],
                        experience_level=job_data['experience_level'],
                        location_type=job_data.get('location_type', 'on-site'),
                        city=job_data.get('city'),
                        state=job_data.get('state'),
                        country=job_data.get('country', 'USA'),
                        is_remote=job_data.get('location_type') == 'remote',
                        salary_min=job_data.get('salary_min'),
                        salary_max=job_data.get('salary_max'),
                        salary_currency='USD',
                        salary_period='yearly',
                        show_salary=True,
                        required_skills=job_data.get('required_skills'),
                        years_experience_min=1 if job_data['experience_level'] == 'entry' else 3 if job_data['experience_level'] == 'mid' else 5,
                        years_experience_max=10 if job_data['experience_level'] == 'senior' else None,
                        application_type=application_type,
                        application_url=job_data.get('application_url'),
                        application_email=job_data.get('application_email'),
                        status='published',
                        published_at=datetime.utcnow(),
                        expires_at=expires_at,
                        # External job specific fields
                        job_source='external',
                        external_company_name=job_data['external_company_name'],
                        external_company_website=job_data.get('external_company_website'),
                        source_url=job_data.get('source_url'),
                        # SEO fields
                        meta_title=f"{job_data['title']} - {job_data['external_company_name']}",
                        meta_description=job_data['summary'][:160] + "..." if len(job_data['summary']) > 160 else job_data['summary']
                    )
                    
                    db.session.add(job)
                    created_jobs.append(job_data['title'])
                    
                except Exception as e:
                    print(f"❌ Error creating job '{job_data['title']}': {str(e)}")
            
            db.session.commit()
            
            print("\n" + "=" * 50)
            print(f"✅ Successfully Created {len(created_jobs)} External Jobs!")
            print("=" * 50)
            
            for i, job_title in enumerate(created_jobs, 1):
                print(f"{i:2d}. {job_title}")
            
            print("\n📋 External Jobs Summary:")
            print(f"• Total external jobs created: {len(created_jobs)}")
            print(f"• Posted by: {external_admin.get_full_name()}")
            print(f"• Job source: external")
            print(f"• Status: published")
            print(f"• Expiry: 30 days from now")
            
            print("\n🔗 These jobs represent:")
            print("• Jobs from external companies without TalentSphere profiles")
            print("• Various job types and experience levels")
            print("• Different application methods (external URL, email)")
            print("• Remote, hybrid, and on-site positions")
            
            return True
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error creating external jobs: {str(e)}")
            return False

def list_external_jobs():
    """List all external jobs"""
    # Import the app from main module
    import src.main as main_module
    app = main_module.app
    
    with app.app_context():
        try:
            external_jobs = Job.query.filter_by(job_source='external').all()
            
            if not external_jobs:
                print("📋 No external jobs found")
                return
            
            print(f"\n📋 Found {len(external_jobs)} External Job(s):")
            print("=" * 100)
            print(f"{'ID':<5} {'Title':<30} {'Company':<25} {'Type':<12} {'Status':<10} {'Created'}")
            print("-" * 100)
            
            for job in external_jobs:
                created_date = job.created_at.strftime('%Y-%m-%d') if job.created_at else 'Unknown'
                print(f"{job.id:<5} {job.title[:29]:<30} {job.external_company_name[:24]:<25} {job.employment_type:<12} {job.status:<10} {created_date}")
            
            print("=" * 100)
            
            # Statistics
            published_count = len([j for j in external_jobs if j.status == 'published'])
            draft_count = len([j for j in external_jobs if j.status == 'draft'])
            
            print(f"\n📊 Statistics:")
            print(f"• Published: {published_count}")
            print(f"• Draft: {draft_count}")
            print(f"• Total: {len(external_jobs)}")
            
        except Exception as e:
            print(f"❌ Error listing external jobs: {str(e)}")

def main():
    """Main function"""
    if len(sys.argv) > 1 and sys.argv[1] == "list":
        list_external_jobs()
    else:
        create_sample_external_jobs()

if __name__ == "__main__":
    main()
