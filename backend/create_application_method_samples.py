#!/usr/bin/env python3
"""
Test script to create sample jobs with different application methods
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.models.user import db, User
from src.models.job import Job, JobCategory
from src.models.company import Company
from src.main import app
from datetime import datetime, timedelta

def create_sample_jobs_with_application_methods():
    """Create sample jobs demonstrating all three application methods"""
    
    with app.app_context():
        # Get test employer and company
        employer = User.query.filter_by(email='employer@test.com').first()
        company = Company.query.filter_by(name='TechCorp Inc').first()
        
        if not employer or not company:
            print("❌ Test employer or company not found. Run setup_test_data.py first.")
            return False
        
        # Get some categories
        software_dev = JobCategory.query.filter_by(name='Software Development').first()
        marketing = JobCategory.query.filter_by(name='Marketing & Sales').first()
        design = JobCategory.query.filter_by(name='Design & UX').first()
        
        if not all([software_dev, marketing, design]):
            print("❌ Required job categories not found. Run setup_test_data.py first.")
            return False
        
        jobs_data = [
            {
                'title': 'Senior Frontend Developer (Internal Application)',
                'category_id': software_dev.id,
                'description': '''We're looking for a Senior Frontend Developer to join our engineering team. 
                
**Responsibilities:**
- Develop and maintain React-based web applications
- Collaborate with designers and backend developers
- Write clean, maintainable, and testable code
- Participate in code reviews and technical discussions

**Requirements:**
- 5+ years of experience with React and JavaScript
- Strong understanding of modern web technologies
- Experience with TypeScript, Redux, and testing frameworks
- Bachelor's degree in Computer Science or related field

**What We Offer:**
- Competitive salary and equity package
- Flexible working hours and remote options
- Professional development opportunities
- Great team culture and work-life balance''',
                'employment_type': 'full-time',
                'experience_level': 'senior',
                'location_type': 'hybrid',
                'city': 'San Francisco',
                'state': 'California',
                'country': 'United States',
                'salary_min': 120000,
                'salary_max': 180000,
                'required_skills': 'React, JavaScript, TypeScript, Redux, HTML, CSS',
                'preferred_skills': 'Next.js, GraphQL, AWS, Docker',
                'application_type': 'internal',
                'application_instructions': 'Please submit your resume and a brief cover letter explaining why you\'re interested in this role.',
                'requires_resume': True,
                'requires_cover_letter': True,
                'requires_portfolio': False
            },
            {
                'title': 'Marketing Manager (External Application)',
                'category_id': marketing.id,
                'description': '''Join our marketing team as a Marketing Manager and help drive our growth strategy.
                
**Key Responsibilities:**
- Develop and execute comprehensive marketing campaigns
- Manage social media presence and content strategy
- Analyze marketing metrics and ROI
- Collaborate with sales team on lead generation
- Oversee marketing budget and vendor relationships

**Qualifications:**
- 3+ years of marketing experience
- Strong analytical and creative thinking skills
- Experience with digital marketing tools and platforms
- Excellent communication and project management skills
- MBA or Marketing degree preferred

**Benefits:**
- Competitive base salary plus performance bonuses
- Health, dental, and vision insurance
- 401(k) with company matching
- Flexible PTO policy''',
                'employment_type': 'full-time',
                'experience_level': 'mid',
                'location_type': 'on-site',
                'city': 'San Francisco',
                'state': 'California',
                'country': 'United States',
                'salary_min': 80000,
                'salary_max': 120000,
                'required_skills': 'Digital Marketing, Analytics, Campaign Management, Social Media',
                'preferred_skills': 'HubSpot, Google Analytics, Facebook Ads, SEO',
                'application_type': 'external',
                'application_url': 'https://techcorp.com/careers/marketing-manager',
                'application_instructions': 'Apply directly through our company website. Include examples of successful campaigns you\'ve managed.'
            },
            {
                'title': 'UX/UI Designer (Email Application)',
                'category_id': design.id,
                'description': '''We're seeking a talented UX/UI Designer to create exceptional user experiences for our products.

**What You'll Do:**
- Design user interfaces for web and mobile applications
- Conduct user research and usability testing
- Create wireframes, prototypes, and high-fidelity mockups
- Collaborate with product managers and developers
- Maintain and evolve our design system

**Requirements:**
- 2-4 years of UX/UI design experience
- Proficiency in Figma, Sketch, or similar design tools
- Strong portfolio demonstrating design process and outcomes
- Understanding of user-centered design principles
- Experience with design systems and component libraries

**Nice to Have:**
- Front-end development skills (HTML/CSS/JavaScript)
- Experience with user research methodologies
- Knowledge of accessibility standards
- Motion design capabilities

**Perks:**
- Creative and collaborative work environment
- Latest design tools and equipment
- Professional development budget
- Flexible work arrangements''',
                'employment_type': 'full-time',
                'experience_level': 'mid',
                'location_type': 'remote',
                'salary_min': 90000,
                'salary_max': 130000,
                'required_skills': 'UI Design, UX Design, Figma, User Research, Prototyping',
                'preferred_skills': 'HTML, CSS, JavaScript, Accessibility, Motion Design',
                'application_type': 'email',
                'application_email': 'design-jobs@techcorp.com',
                'application_instructions': '''Please email us with:
1. Your resume/CV
2. Portfolio showcasing your best work (website link or PDF)
3. A brief note about which projects you're most proud of and why
4. Your availability to start

Subject line: UX/UI Designer Application - [Your Name]'''
            }
        ]
        
        created_jobs = []
        
        for job_data in jobs_data:
            # Check if job already exists
            existing_job = Job.query.filter_by(title=job_data['title']).first()
            if existing_job:
                print(f"⏭️  Job already exists: {job_data['title']}")
                continue
            
            # Generate slug
            slug = job_data['title'].lower().replace(' ', '-').replace('(', '').replace(')', '').replace('/', '-')
            counter = 1
            original_slug = slug
            while Job.query.filter_by(slug=slug).first():
                slug = f"{original_slug}-{counter}"
                counter += 1
            
            # Create job
            job = Job(
                company_id=company.id,
                category_id=job_data['category_id'],
                posted_by=employer.id,
                title=job_data['title'],
                slug=slug,
                description=job_data['description'],
                employment_type=job_data['employment_type'],
                experience_level=job_data['experience_level'],
                location_type=job_data['location_type'],
                city=job_data.get('city'),
                state=job_data.get('state'),
                country=job_data.get('country'),
                is_remote=job_data['location_type'] == 'remote',
                salary_min=job_data.get('salary_min'),
                salary_max=job_data.get('salary_max'),
                salary_currency='USD',
                salary_period='yearly',
                show_salary=True,
                required_skills=job_data.get('required_skills'),
                preferred_skills=job_data.get('preferred_skills'),
                application_type=job_data['application_type'],
                application_email=job_data.get('application_email'),
                application_url=job_data.get('application_url'),
                application_instructions=job_data.get('application_instructions'),
                requires_resume=job_data.get('requires_resume', True),
                requires_cover_letter=job_data.get('requires_cover_letter', False),
                requires_portfolio=job_data.get('requires_portfolio', False),
                status='published',
                published_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(days=30)
            )
            
            db.session.add(job)
            created_jobs.append(job_data['title'])
            print(f"✅ Created job: {job_data['title']} (Application: {job_data['application_type']})")
        
        # Update company job count
        company.total_jobs_posted = Job.query.filter_by(company_id=company.id).count()
        
        db.session.commit()
        
        return created_jobs

def main():
    print("🚀 Creating Sample Jobs with Application Methods")
    print("=" * 60)
    
    created_jobs = create_sample_jobs_with_application_methods()
    
    if created_jobs:
        print(f"\n✅ Created {len(created_jobs)} new job(s):")
        for job_title in created_jobs:
            print(f"   - {job_title}")
        
        print("\n📋 Application Methods Demonstrated:")
        print("   🏢 Internal: Apply through TalentSphere platform")
        print("   🔗 External: Apply through external company URL")
        print("   📧 Email: Apply by sending email to specified address")
        
        print("\n🌐 You can now test these at:")
        print("   Frontend: http://localhost:5174/jobs")
        print("   Backend API: http://localhost:5001/api/jobs")
        
        print("\n🔧 Test the PostJob form at:")
        print("   http://localhost:5174/employer/jobs/create")
        print("   Login: employer@test.com / TestPassword123!")
        
    else:
        print("ℹ️  No new jobs were created (may already exist)")
    
    print("\n🎉 Sample jobs setup complete!")

if __name__ == '__main__':
    main()
