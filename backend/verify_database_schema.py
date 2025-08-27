#!/usr/bin/env python3
"""
Database verification script to check if application_type field exists
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.models.user import db
from src.models.job import Job
from src.main import app

def check_database_schema():
    """Check if the application_type field exists in jobs table"""
    
    with app.app_context():
        try:
            # Check table structure
            with db.engine.connect() as conn:
                result = conn.execute(db.text("PRAGMA table_info(jobs);"))
                columns = [row[1] for row in result.fetchall()]
                
                print("📊 Jobs table columns:")
                for col in sorted(columns):
                    print(f"   - {col}")
                
                if 'application_type' in columns:
                    print("\n✅ application_type column exists!")
                    
                    # Check existing data
                    result = conn.execute(db.text("SELECT application_type, COUNT(*) as count FROM jobs GROUP BY application_type;"))
                    rows = result.fetchall()
                    
                    print("\n📈 Application type distribution:")
                    for row in rows:
                        app_type, count = row
                        print(f"   - {app_type}: {count} jobs")
                    
                    return True
                else:
                    print("\n❌ application_type column NOT found!")
                    return False
                    
        except Exception as e:
            print(f"❌ Database check failed: {str(e)}")
            return False

def test_job_creation():
    """Test creating a job with application_type"""
    
    with app.app_context():
        try:
            from src.models.user import User
            from src.models.company import Company
            
            # Get test user
            user = User.query.filter_by(email='employer@test.com').first()
            company = Company.query.filter_by(name='TechCorp Inc').first()
            
            if not user or not company:
                print("❌ Test user or company not found")
                return False
            
            # Test creating a job with application_type
            test_job = Job(
                title="Test Job with Application Type",
                company_id=company.id,
                category_id=1,
                posted_by=user.id,
                description="Test job description",
                employment_type="full-time",
                experience_level="mid",
                location_type="remote",
                application_type="internal",
                status="draft"
            )
            
            db.session.add(test_job)
            db.session.commit()
            
            print("✅ Successfully created test job with application_type!")
            
            # Clean up
            db.session.delete(test_job)
            db.session.commit()
            
            return True
            
        except Exception as e:
            print(f"❌ Job creation test failed: {str(e)}")
            db.session.rollback()
            return False

def main():
    print("🔍 TalentSphere Database Schema Check")
    print("=" * 50)
    
    # Check schema
    schema_ok = check_database_schema()
    
    if schema_ok:
        print("\n🧪 Testing job creation...")
        creation_ok = test_job_creation()
        
        if creation_ok:
            print("\n🎉 All tests passed!")
            print("The database schema is properly updated and functional.")
        else:
            print("\n⚠️  Schema exists but job creation failed.")
    else:
        print("\n❌ Database schema needs to be updated.")
        print("Please run the migration script: python3 migrate_application_type.py")

if __name__ == '__main__':
    main()
