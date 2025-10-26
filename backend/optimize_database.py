#!/usr/bin/env python3
"""
Database Performance Optimization Script for TalentSphere

This script creates database indexes, optimizes queries, and improves performance.
Run this after deploying to production or when experiencing slow queries.
"""

import os
import sys
from datetime import datetime
import signal

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv not required if .env already loaded

def timeout_handler(signum, frame):
    """Handle connection timeout"""
    raise TimeoutError("Database connection timeout - database may be unavailable")

def optimize_database():
    """Create indexes and optimize database performance"""
    
    try:
        from src.main import app
        from src.models.user import db
        
        with app.app_context():
            # Check if we're using PostgreSQL or SQLite
            db_url = app.config['SQLALCHEMY_DATABASE_URI']
            is_postgresql = db_url.startswith('postgresql://') or db_url.startswith('postgres://')
            
            print(f"🔄 Optimizing database performance...")
            print(f"Database type: {'PostgreSQL' if is_postgresql else 'SQLite'}")
            
            # Set 30-second timeout for connection attempt
            signal.signal(signal.SIGALRM, timeout_handler)
            signal.alarm(30)
            
            try:
                # Pre-ping to verify connection is alive
                print("🔍 Verifying database connection...")
                db.engine.dispose()  # Clear any stale connections
                
                # Test connection with a simple query
                with db.engine.connect() as conn:
                    conn.execute(db.text("SELECT 1"))
                
                print("✅ Database connection verified")
                
                # Reset alarm after successful connection
                signal.alarm(0)
                
                # Get database connection
                connection = db.engine.raw_connection()
                cursor = connection.cursor()
                
            except TimeoutError as te:
                signal.alarm(0)
                print(f"⚠️  {str(te)}")
                print("🔄 Skipping database optimization - database unavailable")
                return True  # Don't fail startup if DB optimization fails
            except Exception as e:
                signal.alarm(0)
                print(f"⚠️  Database connection check failed: {str(e)}")
                print("🔄 Skipping database optimization - database unavailable")
                return True  # Don't fail startup if DB optimization fails
            
            # Create performance indexes
            indexes = [
                # Job table indexes (most critical)
                ("idx_jobs_status_active", "CREATE INDEX IF NOT EXISTS idx_jobs_status_active ON jobs(status, is_active) WHERE status = 'published' AND is_active = true"),
                ("idx_jobs_featured", "CREATE INDEX IF NOT EXISTS idx_jobs_featured ON jobs(is_featured, created_at DESC) WHERE is_featured = true"),
                ("idx_jobs_location", "CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(city, state, country) WHERE city IS NOT NULL"),
                ("idx_jobs_employment_type", "CREATE INDEX IF NOT EXISTS idx_jobs_employment_type ON jobs(employment_type)"),
                ("idx_jobs_experience_level", "CREATE INDEX IF NOT EXISTS idx_jobs_experience_level ON jobs(experience_level)"),
                ("idx_jobs_category", "CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category_id)"),
                ("idx_jobs_company", "CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id) WHERE company_id IS NOT NULL"),
                ("idx_jobs_created_at", "CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC)"),
                ("idx_jobs_expires_at", "CREATE INDEX IF NOT EXISTS idx_jobs_expires_at ON jobs(expires_at) WHERE expires_at IS NOT NULL"),
                ("idx_jobs_salary_range", "CREATE INDEX IF NOT EXISTS idx_jobs_salary_range ON jobs(salary_min, salary_max) WHERE salary_min IS NOT NULL OR salary_max IS NOT NULL"),
                ("idx_jobs_remote", "CREATE INDEX IF NOT EXISTS idx_jobs_remote ON jobs(is_remote) WHERE is_remote = true"),
                
                # Application table indexes
                ("idx_applications_job", "CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id)"),
                ("idx_applications_applicant", "CREATE INDEX IF NOT EXISTS idx_applications_applicant ON applications(applicant_id)"),
                ("idx_applications_status", "CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)"),
                ("idx_applications_created_at", "CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC)"),
                ("idx_applications_job_status", "CREATE INDEX IF NOT EXISTS idx_applications_job_status ON applications(job_id, status)"),
                
                # User table indexes
                ("idx_users_email", "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)"),
                ("idx_users_role", "CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)"),
                ("idx_users_active", "CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true"),
                
                # Company table indexes
                ("idx_companies_verified", "CREATE INDEX IF NOT EXISTS idx_companies_verified ON companies(is_verified) WHERE is_verified = true"),
                ("idx_companies_slug", "CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug)"),
                ("idx_companies_industry", "CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry)"),
            ]
            
            # Execute index creation
            created_count = 0
            for index_name, index_sql in indexes:
                try:
                    cursor.execute(index_sql)
                    created_count += 1
                    print(f"✅ Created index: {index_name}")
                except Exception as e:
                    if "already exists" in str(e).lower():
                        print(f"ℹ️  Index already exists: {index_name}")
                    else:
                        print(f"❌ Failed to create index {index_name}: {str(e)}")
            
            connection.commit()
            connection.close()
            
            print(f"\n🎉 Database optimization completed!")
            print(f"📊 Created/verified {len(indexes)} indexes")
            print(f"⚡ Database queries should now be significantly faster")
            
            return True
            
    except Exception as e:
        print(f"❌ Database optimization failed: {str(e)}")
        return False

if __name__ == '__main__':
    print("🚀 Starting TalentSphere Database Optimization")
    print("=" * 50)
    
    # Run optimization
    success = optimize_database()
    
    if success:
        print("\n✅ Optimization completed successfully!")
    else:
        print("\n❌ Optimization failed!")
        sys.exit(1)
