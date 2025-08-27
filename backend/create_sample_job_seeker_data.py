#!/usr/bin/env python3

import sys
import os

# Add the src directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.models.user import User, JobSeekerProfile, db
from src.models.application import Application
from src.models.job import Job
from src.models.company import Company
from src.main import app
import json
from datetime import datetime, timedelta
import random

def create_sample_job_seeker_data():
    with app.app_context():
        # Create a sample job seeker user
        existing_user = User.query.filter_by(email='jobseeker@example.com').first()
        if existing_user:
            print("Job seeker user already exists")
            user = existing_user
        else:
            user = User(
                email='jobseeker@example.com',
                password_hash='scrypt:32768:8:1$LL2FTx8m23p1raZ5$5cc73818ae3fe22bb33c728f8dc0c525a11166dd4fb8a7ffc07076eaf37c7bc2dede54fde7ddeba477576f1b05cbc0d634d5e873a940f1e9214b1599265bc3de',
                first_name='Alex',
                last_name='Johnson',
                phone='+1-555-0123',
                role='job_seeker',
                is_active=True,
                is_verified=True,
                location='San Francisco, CA',
                bio='Experienced full-stack developer passionate about building scalable web applications.'
            )
            db.session.add(user)
            db.session.flush()
            print(f"Created job seeker user: {user.email}")

        # Create job seeker profile
        existing_profile = JobSeekerProfile.query.filter_by(user_id=user.id).first()
        if existing_profile:
            print("Job seeker profile already exists")
            profile = existing_profile
        else:
            skills = ['JavaScript', 'React', 'Node.js', 'Python', 'TypeScript', 'MongoDB', 'SQL', 'Git', 'AWS']
            
            profile = JobSeekerProfile(
                user_id=user.id,
                desired_position='Full Stack Developer',
                years_of_experience=3,
                education_level="Bachelor's Degree",
                preferred_location='San Francisco, CA',
                job_type_preference='full-time',
                desired_salary_min=80000,
                desired_salary_max=120000,
                open_to_opportunities=True,
                skills=json.dumps(skills),
                availability='2 weeks notice',
                resume_url='https://example.com/resume/alex-johnson.pdf',
                portfolio_url='https://alexjohnson.dev',
                linkedin_url='https://linkedin.com/in/alexjohnson',
                github_url='https://github.com/alexjohnson'
            )
            db.session.add(profile)
            print(f"Created job seeker profile for user: {user.get_full_name()}")

        # Create some sample applications
        jobs = Job.query.filter_by(status='published').limit(5).all()
        
        if jobs:
            application_statuses = ['submitted', 'under_review', 'shortlisted', 'interviewed', 'hired', 'rejected']
            stages = {
                'submitted': 'Application Submitted',
                'under_review': 'Under Review',
                'shortlisted': 'Shortlisted',
                'interviewed': 'Interview Completed', 
                'hired': 'Offer Received',
                'rejected': 'Not Selected'
            }
            
            for i, job in enumerate(jobs):
                # Check if application already exists
                existing_app = Application.query.filter_by(
                    job_id=job.id, 
                    applicant_id=user.id
                ).first()
                
                if not existing_app:
                    status = application_statuses[i % len(application_statuses)]
                    application = Application(
                        job_id=job.id,
                        applicant_id=user.id,
                        cover_letter=f"I am very interested in the {job.title} position at {job.company.name}. My experience with {', '.join(skills[:3])} makes me a great fit for this role.",
                        resume_url='https://example.com/resume/alex-johnson.pdf',
                        status=status,
                        stage=stages.get(status, 'Application Review'),
                        created_at=datetime.utcnow() - timedelta(days=random.randint(1, 30)),
                        updated_at=datetime.utcnow() - timedelta(days=random.randint(0, 5))
                    )
                    
                    # Set interview details for appropriate statuses
                    if status in ['shortlisted', 'interviewed', 'hired']:
                        application.interview_scheduled = True
                        application.interview_datetime = datetime.utcnow() + timedelta(days=random.randint(1, 14))
                        application.interview_type = random.choice(['video', 'phone', 'in-person'])
                    
                    db.session.add(application)
                    print(f"Created application for job: {job.title} with status: {status}")

        db.session.commit()
        print("✅ Sample job seeker data created successfully!")

if __name__ == '__main__':
    create_sample_job_seeker_data()
