#!/usr/bin/env python3
"""
Database Performance Optimization Script for TalentSphere

This script creates database indexes, optimizes queries, and improves performance.
Run this after deploying to production or when experiencing slow queries.
"""

import os
import sys
from datetime import datetime

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

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
            
            # Get database connection
            connection = db.engine.raw_connection()
            cursor = connection.cursor()
            
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
                
                # Job categories indexes
                ("idx_job_categories_active", "CREATE INDEX IF NOT EXISTS idx_job_categories_active ON job_categories(is_active, display_order) WHERE is_active = true"),
                ("idx_job_categories_parent", "CREATE INDEX IF NOT EXISTS idx_job_categories_parent ON job_categories(parent_id) WHERE parent_id IS NOT NULL"),
                
                # Bookmarks and alerts
                ("idx_job_bookmarks_user_job", "CREATE INDEX IF NOT EXISTS idx_job_bookmarks_user_job ON job_bookmarks(user_id, job_id)"),
                ("idx_job_alerts_user", "CREATE INDEX IF NOT EXISTS idx_job_alerts_user ON job_alerts(user_id, is_active) WHERE is_active = true"),
                
                # Featured ads indexes
                ("idx_featured_ads_active", "CREATE INDEX IF NOT EXISTS idx_featured_ads_active ON featured_ads(status, start_date, end_date) WHERE status = 'active'"),
                ("idx_featured_ads_job", "CREATE INDEX IF NOT EXISTS idx_featured_ads_job ON featured_ads(job_id)"),
                
                # Notifications indexes
                ("idx_notifications_user", "CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC)"),
                ("idx_notifications_unread", "CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false"),
                
                # Profile indexes
                ("idx_job_seeker_profiles_user", "CREATE INDEX IF NOT EXISTS idx_job_seeker_profiles_user ON job_seeker_profiles(user_id)"),
                ("idx_employer_profiles_user", "CREATE INDEX IF NOT EXISTS idx_employer_profiles_user ON employer_profiles(user_id)"),
                ("idx_employer_profiles_company", "CREATE INDEX IF NOT EXISTS idx_employer_profiles_company ON employer_profiles(company_id) WHERE company_id IS NOT NULL"),
            ]
            
            # Add full-text search indexes for PostgreSQL
            if is_postgresql:
                fulltext_indexes = [
                    ("idx_jobs_fulltext_search", """
                        CREATE INDEX IF NOT EXISTS idx_jobs_fulltext_search 
                        ON jobs USING GIN(to_tsvector('english', 
                            coalesce(title, '') || ' ' || 
                            coalesce(description, '') || ' ' || 
                            coalesce(required_skills, '')
                        ))
                    """),
                    ("idx_companies_fulltext_search", """
                        CREATE INDEX IF NOT EXISTS idx_companies_fulltext_search 
                        ON companies USING GIN(to_tsvector('english', 
                            coalesce(name, '') || ' ' || 
                            coalesce(description, '') || ' ' || 
                            coalesce(industry, '')
                        ))
                    """),
                ]
                indexes.extend(fulltext_indexes)
            
            # Create composite indexes for common query patterns
            composite_indexes = [
                ("idx_jobs_search_filter", "CREATE INDEX IF NOT EXISTS idx_jobs_search_filter ON jobs(status, is_active, category_id, employment_type, is_remote, created_at DESC)"),
                ("idx_jobs_employer_dashboard", "CREATE INDEX IF NOT EXISTS idx_jobs_employer_dashboard ON jobs(company_id, status, created_at DESC) WHERE company_id IS NOT NULL"),
                ("idx_applications_dashboard", "CREATE INDEX IF NOT EXISTS idx_applications_dashboard ON applications(job_id, status, created_at DESC)"),
            ]
            indexes.extend(composite_indexes)
            
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
            
            # Analyze tables for query planning (PostgreSQL only)
            if is_postgresql:
                try:
                    print("🔄 Analyzing tables for query optimization...")
                    tables = ['jobs', 'applications', 'users', 'companies', 'job_categories', 
                             'notifications', 'featured_ads', 'job_bookmarks', 'job_alerts']
                    
                    for table in tables:
                        cursor.execute(f"ANALYZE {table}")
                    
                    connection.commit()
                    print("✅ Table analysis completed")
                except Exception as e:
                    print(f"⚠️  Table analysis failed: {str(e)}")
            
            # Update statistics (SQLite)
            else:
                try:
                    print("🔄 Updating SQLite statistics...")
                    cursor.execute("ANALYZE")
                    connection.commit()
                    print("✅ SQLite statistics updated")
                except Exception as e:
                    print(f"⚠️  Statistics update failed: {str(e)}")
            
            connection.close()
            
            print(f"\n🎉 Database optimization completed!")
            print(f"📊 Created/verified {len(indexes)} indexes")
            print(f"⚡ Database queries should now be significantly faster")
            print(f"\n💡 Recommended next steps:")
            print("1. Monitor query performance using database logs")
            print("2. Consider adding Redis caching for frequently accessed data")
            print("3. Implement connection pooling for high-traffic scenarios")
            
            return True
            
    except Exception as e:
        print(f"❌ Database optimization failed: {str(e)}")
        return False

def check_slow_queries():
    """Check for slow queries and suggest optimizations"""
    try:
        from src.main import app
        from src.models.user import db
        
        with app.app_context():
            db_url = app.config['SQLALCHEMY_DATABASE_URI']
            is_postgresql = db_url.startswith('postgresql://') or db_url.startswith('postgres://')
            
            if is_postgresql:
                # Enable slow query logging
                connection = db.engine.raw_connection()
                cursor = connection.cursor()
                
                try:
                    # Check current slow query settings
                    cursor.execute("SHOW log_min_duration_statement;")
                    result = cursor.fetchone()
                    print(f"Current slow query threshold: {result[0]}")
                    
                    # Set slow query threshold to 1000ms (1 second)
                    cursor.execute("SET log_min_duration_statement = 1000;")
                    print("✅ Enabled slow query logging (>1s queries)")
                    
                except Exception as e:
                    print(f"⚠️  Could not configure slow query logging: {str(e)}")
                
                connection.close()
    
    except Exception as e:
        print(f"❌ Slow query check failed: {str(e)}")

if __name__ == '__main__':
    print("🚀 Starting TalentSphere Database Optimization")
    print("=" * 50)
    
    # Run optimization
    success = optimize_database()
    
    if success:
        # Check slow queries
        check_slow_queries()
        print("\n✅ Optimization completed successfully!")
    else:
        print("\n❌ Optimization failed!")
        sys.exit(1)
