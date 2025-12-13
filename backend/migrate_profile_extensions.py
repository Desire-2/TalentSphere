"""
Database migration script for extended job seeker profile features
Adds new tables and columns for comprehensive profile management
"""
from flask import Flask
from src.models.user import db, User, JobSeekerProfile, EmployerProfile
from src.models.company import Company, CompanyBenefit, CompanyTeamMember
from src.models.profile_extensions import (
    WorkExperience, Education, Certification, Project,
    Award, Language, VolunteerExperience, ProfessionalMembership
)
import os

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///talentsphere.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    return app

def migrate_profile_extensions():
    """Run database migration for profile extensions"""
    app = create_app()
    
    with app.app_context():
        print("Starting migration for profile extensions...")
        
        try:
            # Create all new tables
            print("Creating new tables...")
            db.create_all()
            print("✓ All tables created successfully")
            
            # Add new columns to existing job_seeker_profiles table
            print("\nAdding new columns to job_seeker_profiles table...")
            
            # SQL statements to add new columns (for existing tables)
            new_columns = [
                "ALTER TABLE job_seeker_profiles ADD COLUMN professional_title VARCHAR(150)",
                "ALTER TABLE job_seeker_profiles ADD COLUMN professional_summary TEXT",
                "ALTER TABLE job_seeker_profiles ADD COLUMN website_url VARCHAR(255)",
                "ALTER TABLE job_seeker_profiles ADD COLUMN salary_currency VARCHAR(10) DEFAULT 'USD'",
                "ALTER TABLE job_seeker_profiles ADD COLUMN willing_to_relocate BOOLEAN DEFAULT 0",
                "ALTER TABLE job_seeker_profiles ADD COLUMN willing_to_travel VARCHAR(50)",
                "ALTER TABLE job_seeker_profiles ADD COLUMN work_authorization VARCHAR(100)",
                "ALTER TABLE job_seeker_profiles ADD COLUMN visa_sponsorship_required BOOLEAN DEFAULT 0",
                "ALTER TABLE job_seeker_profiles ADD COLUMN soft_skills TEXT",
                "ALTER TABLE job_seeker_profiles ADD COLUMN preferred_industries TEXT",
                "ALTER TABLE job_seeker_profiles ADD COLUMN preferred_company_size VARCHAR(50)",
                "ALTER TABLE job_seeker_profiles ADD COLUMN preferred_work_environment VARCHAR(50)",
                "ALTER TABLE job_seeker_profiles ADD COLUMN profile_completeness INTEGER DEFAULT 0"
            ]
            
            # Try to add columns (will fail if they already exist, which is fine)
            for sql in new_columns:
                try:
                    db.session.execute(sql)
                    db.session.commit()
                    print(f"✓ Added column: {sql.split('ADD COLUMN')[1].split()[0]}")
                except Exception as e:
                    db.session.rollback()
                    if 'duplicate column' in str(e).lower() or 'already exists' in str(e).lower():
                        print(f"  Column already exists (skipping): {sql.split('ADD COLUMN')[1].split()[0]}")
                    else:
                        print(f"  Warning: {str(e)}")
            
            print("\n✓ Migration completed successfully!")
            print("\nNew tables created:")
            print("  - work_experiences")
            print("  - educations")
            print("  - certifications")
            print("  - projects")
            print("  - awards")
            print("  - languages")
            print("  - volunteer_experiences")
            print("  - professional_memberships")
            
            return True
            
        except Exception as e:
            print(f"\n✗ Migration failed: {str(e)}")
            db.session.rollback()
            return False

if __name__ == '__main__':
    success = migrate_profile_extensions()
    if success:
        print("\n" + "="*50)
        print("Migration completed successfully!")
        print("You can now use the extended profile features.")
        print("="*50)
    else:
        print("\n" + "="*50)
        print("Migration failed. Please check the errors above.")
        print("="*50)
