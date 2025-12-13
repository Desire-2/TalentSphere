#!/usr/bin/env python3
"""
Database Migration: Add missing fields to job_seeker_profiles table
This migration adds all the enhanced profile fields needed for the CV Builder
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy import create_engine, text
from src.models.user import db

def run_migration():
    """Run the migration to add missing columns"""
    
    print("🚀 Starting JobSeekerProfile Migration")
    print("=" * 60)
    
    # Get database URL
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL not found in environment variables")
        return False
    
    # Handle postgres:// vs postgresql://
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    
    print(f"📊 Connecting to database...")
    
    try:
        engine = create_engine(database_url)
        
        with engine.connect() as conn:
            print("\n📋 Adding missing columns to job_seeker_profiles table...")
            
            # List of columns to add
            migrations = [
                # Professional Header
                ("professional_title", "VARCHAR(150)", "Professional title/headline"),
                ("professional_summary", "TEXT", "Professional summary"),
                
                # Professional Information
                ("resume_url", "VARCHAR(255)", "Resume URL"),
                ("portfolio_url", "VARCHAR(255)", "Portfolio URL"),
                ("linkedin_url", "VARCHAR(255)", "LinkedIn URL"),
                ("github_url", "VARCHAR(255)", "GitHub URL"),
                ("website_url", "VARCHAR(255)", "Personal website URL"),
                
                # Job Preferences
                ("desired_position", "VARCHAR(100)", "Desired job position"),
                ("desired_salary_min", "INTEGER", "Minimum desired salary"),
                ("desired_salary_max", "INTEGER", "Maximum desired salary"),
                ("salary_currency", "VARCHAR(10) DEFAULT 'USD'", "Salary currency"),
                ("preferred_location", "VARCHAR(100)", "Preferred work location"),
                ("job_type_preference", "VARCHAR(50)", "Job type preference"),
                ("availability", "VARCHAR(50)", "Availability status"),
                ("willing_to_relocate", "BOOLEAN DEFAULT FALSE", "Willing to relocate"),
                ("willing_to_travel", "VARCHAR(50)", "Willingness to travel"),
                
                # Work Authorization
                ("work_authorization", "VARCHAR(100)", "Work authorization status"),
                ("visa_sponsorship_required", "BOOLEAN DEFAULT FALSE", "Visa sponsorship needed"),
                
                # Experience and Skills
                ("years_of_experience", "INTEGER DEFAULT 0", "Years of experience"),
                ("skills", "TEXT", "Skills (JSON)"),
                ("soft_skills", "TEXT", "Soft skills (JSON)"),
                ("education_level", "VARCHAR(50)", "Education level"),
                ("certifications", "TEXT", "Certifications (JSON)"),
                
                # Industry Preferences
                ("preferred_industries", "TEXT", "Preferred industries (JSON)"),
                ("preferred_company_size", "VARCHAR(50)", "Preferred company size"),
                ("preferred_work_environment", "VARCHAR(50)", "Preferred work environment"),
                
                # Profile Visibility
                ("profile_visibility", "VARCHAR(20) DEFAULT 'public'", "Profile visibility"),
                ("open_to_opportunities", "BOOLEAN DEFAULT TRUE", "Open to opportunities"),
                ("profile_completeness", "INTEGER DEFAULT 0", "Profile completeness percentage"),
            ]
            
            added_count = 0
            skipped_count = 0
            
            for column_name, column_type, description in migrations:
                try:
                    # Try to add the column
                    sql = text(f"""
                        ALTER TABLE job_seeker_profiles 
                        ADD COLUMN IF NOT EXISTS {column_name} {column_type}
                    """)
                    
                    conn.execute(sql)
                    conn.commit()
                    
                    print(f"  ✅ Added column: {column_name} ({description})")
                    added_count += 1
                    
                except Exception as e:
                    if "already exists" in str(e).lower():
                        print(f"  ⚪ Column already exists: {column_name}")
                        skipped_count += 1
                    else:
                        print(f"  ⚠️  Warning for {column_name}: {str(e)}")
                        skipped_count += 1
            
            print(f"\n📊 Migration Summary:")
            print(f"  ✅ Columns added: {added_count}")
            print(f"  ⚪ Columns skipped: {skipped_count}")
            print(f"  📝 Total processed: {len(migrations)}")
            
            # Verify the table structure
            print("\n🔍 Verifying table structure...")
            result = conn.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'job_seeker_profiles'
                ORDER BY ordinal_position
            """))
            
            columns = result.fetchall()
            print(f"\n📋 Current table structure ({len(columns)} columns):")
            for col in columns:
                print(f"  • {col[0]}: {col[1]}")
            
            print("\n✅ Migration completed successfully!")
            return True
            
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    success = run_migration()
    sys.exit(0 if success else 1)
