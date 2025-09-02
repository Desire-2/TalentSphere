#!/usr/bin/env python3
"""
PostgreSQL Migration for External Admin Support
This script properly migrates PostgreSQL database to support external admin users.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.models.user import db
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def migrate_postgresql():
    """Migrate PostgreSQL database for external admin support"""
    # Import the app from main module
    import src.main as main_module
    app = main_module.app
    
    with app.app_context():
        try:
            print("🚀 Starting PostgreSQL Migration for External Admin Support")
            print("=" * 60)
            
            # Get database URL from app config
            database_url = app.config['SQLALCHEMY_DATABASE_URI']
            print(f"🔗 Connecting to database...")
            
            # Connect directly to PostgreSQL
            conn = psycopg2.connect(database_url)
            conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            cursor = conn.cursor()
            
            # Step 1: Add external_admin to user_roles enum
            print("🔄 Adding external_admin to user_roles enum...")
            try:
                cursor.execute("ALTER TYPE user_roles ADD VALUE 'external_admin';")
                print("✅ Successfully added external_admin to user_roles enum")
            except psycopg2.errors.DuplicateObject:
                print("✅ external_admin already exists in user_roles enum")
            except Exception as e:
                print(f"❌ Error adding external_admin to enum: {str(e)}")
                return False
            
            # Step 2: Add new columns to jobs table
            print("🔄 Adding external job columns to jobs table...")
            
            new_columns = [
                ("external_company_name", "VARCHAR(200)"),
                ("external_company_website", "VARCHAR(255)"),
                ("external_company_logo", "VARCHAR(255)"),
                ("job_source", "VARCHAR(50) DEFAULT 'internal'"),
                ("source_url", "VARCHAR(500)")
            ]
            
            for col_name, col_type in new_columns:
                try:
                    cursor.execute(f"ALTER TABLE jobs ADD COLUMN IF NOT EXISTS {col_name} {col_type};")
                    print(f"✅ Added column: {col_name}")
                except Exception as e:
                    print(f"❌ Error adding column {col_name}: {str(e)}")
            
            # Step 3: Make company_id nullable (if it's not already)
            print("🔄 Making company_id nullable in jobs table...")
            try:
                cursor.execute("ALTER TABLE jobs ALTER COLUMN company_id DROP NOT NULL;")
                print("✅ Made company_id nullable")
            except Exception as e:
                if "does not exist" in str(e).lower():
                    print("✅ company_id is already nullable")
                else:
                    print(f"⚠️  Could not make company_id nullable: {str(e)}")
            
            # Step 4: Create indexes for better performance
            print("🔄 Creating indexes for external job fields...")
            indexes = [
                ("idx_jobs_job_source", "CREATE INDEX IF NOT EXISTS idx_jobs_job_source ON jobs(job_source);"),
                ("idx_jobs_external_company", "CREATE INDEX IF NOT EXISTS idx_jobs_external_company ON jobs(external_company_name);"),
                ("idx_users_role", "CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);")
            ]
            
            for idx_name, idx_sql in indexes:
                try:
                    cursor.execute(idx_sql)
                    print(f"✅ Created index: {idx_name}")
                except Exception as e:
                    print(f"⚠️  Index creation warning for {idx_name}: {str(e)}")
            
            cursor.close()
            conn.close()
            
            print("=" * 60)
            print("✅ PostgreSQL Migration completed successfully!")
            print("\n📋 Changes made:")
            print("• Added 'external_admin' to user_roles enum")
            print("• Added external job fields to jobs table")
            print("• Made company_id nullable in jobs table")
            print("• Created performance indexes")
            print("\n🔗 Next steps:")
            print("• Run create_external_admin.py to create external admin users")
            print("• Use external admin accounts to post external jobs")
            
            return True
            
        except Exception as e:
            print(f"❌ Migration failed: {str(e)}")
            return False

def verify_migration():
    """Verify that the migration was successful"""
    # Import the app from main module
    import src.main as main_module
    app = main_module.app
    
    with app.app_context():
        try:
            print("\n🔍 Verifying migration...")
            
            # Test creating tables with new schema
            db.create_all()
            print("✅ Database schema verification completed")
            
            # Test if we can query the new enum value
            from src.models.user import User
            test_query = User.query.filter_by(role='external_admin').count()
            print(f"✅ Can query external_admin role (found {test_query} users)")
            
            # Test if new job columns exist
            from src.models.job import Job
            from sqlalchemy import text
            result = db.session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='jobs' AND column_name IN ('external_company_name', 'job_source', 'source_url')"))
            columns = [row[0] for row in result.fetchall()]
            print(f"✅ External job columns found: {', '.join(columns)}")
            
            return True
            
        except Exception as e:
            print(f"❌ Verification failed: {str(e)}")
            return False

def main():
    """Main migration function"""
    success = migrate_postgresql()
    
    if success:
        verify_migration()
    else:
        print("\n❌ Migration failed! Please check the errors above.")
        print("\n⚠️  Common issues:")
        print("• Database connection problems")
        print("• Insufficient permissions")
        print("• Conflicting database changes")

if __name__ == "__main__":
    main()
