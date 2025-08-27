#!/usr/bin/env python3
"""
Script to create a job seeker user and application for testing TalentSphere
"""
import os
import sys
import json

# Add the src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.main import app
from src.models.user import db, User, JobSeekerProfile
from src.models.application import Application

def create_job_seeker_and_application():
    """Create a job seeker user and application"""
    with app.app_context():
        # Create job seeker user
        job_seeker_email = "john.doe@email.com"
        existing_user = User.query.filter_by(email=job_seeker_email).first()
        
        if not existing_user:
            job_seeker = User(
                email=job_seeker_email,
                first_name="John",
                last_name="Doe",
                role="job_seeker",
                location="New York, NY",
                bio="Experienced Full Stack Developer"
            )
            job_seeker.set_password("jobseeker123")
            db.session.add(job_seeker)
            db.session.flush()
            
            # Create job seeker profile
            profile = JobSeekerProfile(
                user_id=job_seeker.id,
                desired_position='Full Stack Developer',
                skills=json.dumps(['JavaScript', 'React', 'Node.js', 'Python']),
                years_of_experience=3,
                education_level="Bachelor's Degree",
                preferred_location='Remote',
                job_type_preference='full-time',
                open_to_opportunities=True
            )
            db.session.add(profile)
        else:
            job_seeker = existing_user
        
        # Create application for job ID 1
        existing_app = Application.query.filter_by(job_id=1, applicant_id=job_seeker.id).first()
        if not existing_app:
            application = Application(
                job_id=1,
                applicant_id=job_seeker.id,
                status='pending',
                cover_letter="I am very interested in this position and believe my skills would be a great fit."
            )
            db.session.add(application)
        
        db.session.commit()
        
        print(f"✅ Job seeker and application created successfully!")
        print(f"👤 Job Seeker ID: {job_seeker.id} - {job_seeker.get_full_name()}")
        print(f"📧 Email: {job_seeker_email}")
        print(f"📝 Application created for Job ID: 1")
        
        return job_seeker

if __name__ == "__main__":
    try:
        job_seeker = create_job_seeker_and_application()
    except Exception as e:
        print(f"❌ Error creating job seeker and application: {str(e)}")
        sys.exit(1)
