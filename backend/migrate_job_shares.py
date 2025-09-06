#!/usr/bin/env python3
"""
Migration script to create job_shares table for tracking job sharing analytics
"""

import os
import sys
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.models.user import db, User
from src.models.job import Job, JobShare
from src.main import app

def create_job_shares_table():
    """Create the job_shares table"""
    try:
        with app.app_context():
            # Check if table already exists
            inspector = db.inspect(db.engine)
            if 'job_shares' in inspector.get_table_names():
                print("✓ job_shares table already exists")
                return True
            
            print("Creating job_shares table...")
            
            # Create the table
            JobShare.__table__.create(db.engine)
            
            print("✓ job_shares table created successfully")
            
            # Add some indexes for performance
            with db.engine.connect() as conn:
                conn.execute(db.text("""
                    CREATE INDEX IF NOT EXISTS idx_job_shares_job_id ON job_shares(job_id);
                    CREATE INDEX IF NOT EXISTS idx_job_shares_user_id ON job_shares(user_id);
                    CREATE INDEX IF NOT EXISTS idx_job_shares_platform ON job_shares(platform);
                    CREATE INDEX IF NOT EXISTS idx_job_shares_timestamp ON job_shares(timestamp);
                    CREATE INDEX IF NOT EXISTS idx_job_shares_job_timestamp ON job_shares(job_id, timestamp);
                """))
                conn.commit()
            
            print("✓ Indexes created successfully")
            return True
            
    except Exception as e:
        print(f"✗ Error creating job_shares table: {e}")
        return False

def create_sample_shares():
    """Create some sample share data for testing"""
    try:
        with app.app_context():
            # Check if we already have sample data
            existing_shares = JobShare.query.count()
            if existing_shares > 0:
                print(f"✓ Found {existing_shares} existing job shares")
                return True
            
            print("Creating sample job shares...")
            
            # Get some users and jobs
            users = User.query.limit(3).all()
            jobs = Job.query.limit(10).all()
            
            if not users or not jobs:
                print("⚠ No users or jobs found - cannot create sample shares")
                return True
            
            # Create sample shares
            platforms = ['linkedin', 'twitter', 'facebook', 'whatsapp', 'email_client', 'direct_email', 'clipboard']
            sample_messages = [
                "Check out this amazing opportunity!",
                "Great job opening that might interest you",
                "Perfect role for someone in your network",
                "Exciting career opportunity - sharing is caring!",
                "",  # Empty message
            ]
            
            import random
            from datetime import timedelta
            
            shares_created = 0
            for i in range(50):  # Create 50 sample shares
                user = random.choice(users)
                job = random.choice(jobs)
                platform = random.choice(platforms)
                message = random.choice(sample_messages)
                recipient_count = random.randint(1, 5)
                
                # Random timestamp in last 30 days
                days_ago = random.randint(0, 30)
                timestamp = datetime.utcnow() - timedelta(days=days_ago)
                
                share = JobShare(
                    job_id=job.id,
                    user_id=user.id,
                    platform=platform,
                    custom_message=message,
                    recipient_count=recipient_count,
                    share_url=f"https://talentsphere.com/jobs/{job.id}",
                    user_agent="TalentSphere Migration Script",
                    timestamp=timestamp
                )
                
                db.session.add(share)
                shares_created += 1
            
            db.session.commit()
            print(f"✓ Created {shares_created} sample job shares")
            return True
            
    except Exception as e:
        print(f"✗ Error creating sample shares: {e}")
        db.session.rollback()
        return False

def main():
    """Run the migration"""
    print("🚀 Starting JobShare table migration...")
    print("=" * 50)
    
    # Create the table
    if not create_job_shares_table():
        sys.exit(1)
    
    # Create sample data
    if not create_sample_shares():
        print("⚠ Warning: Sample data creation failed, but table was created successfully")
    
    print("=" * 50)
    print("✅ JobShare migration completed successfully!")
    print("\nNew endpoints available:")
    print("- POST /api/jobs/{id}/share - Record a job share")
    print("- POST /api/jobs/{id}/share/email - Send job via email")
    print("- GET /api/jobs/{id}/share/stats - Get job share statistics")
    print("- GET /api/analytics/shares - Get user share analytics")
    print("- GET /api/analytics/shares/export - Export user share data")
    print("- GET /api/jobs/trending-shares - Get trending shared jobs")

if __name__ == "__main__":
    main()
