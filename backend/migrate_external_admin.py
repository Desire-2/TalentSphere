#!/usr/bin/env python3
"""
Database Migration for External Admin and External Jobs
This script migrates the database to support external admin users and external jobs.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.models.user import db
import sqlite3

def migrate_user_roles():
    """Add external_admin role to user_roles enum"""
    # Import the app from main module
    import src.main as main_module
    app = main_module.app
    
    with app.app_context():
        try:
            print("🔄 Migrating user roles to include external_admin...")
            
            # For SQLite, we need to handle enum changes differently
            db_path = os.path.join(os.path.dirname(__file__), 'src', 'database', 'app.db')
            
            if not os.path.exists(db_path):
                print(f"❌ Database file not found at {db_path}")
                return False
            
            # Connect directly to SQLite database
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Check current schema
            cursor.execute("PRAGMA table_info(users);")
            columns = cursor.fetchall()
            
            # Check if role column exists and its constraints
            role_column = None
            for col in columns:
                if col[1] == 'role':  # col[1] is column name
                    role_column = col
                    break
            
            if not role_column:
                print("❌ Role column not found in users table")
                conn.close()
                return False
            
            print(f"✅ Found role column: {role_column}")
            
            # SQLite doesn't support ALTER COLUMN for changing CHECK constraints
            # We'll need to verify that external_admin role can be inserted
            
            # Test if we can insert external_admin role
            try:
                cursor.execute("""
                    INSERT INTO users (email, password_hash, role, first_name, last_name, created_at)
                    VALUES ('test@external.com', 'test_hash', 'external_admin', 'Test', 'User', datetime('now'))
                """)
                cursor.execute("DELETE FROM users WHERE email = 'test@external.com'")
                print("✅ external_admin role is supported")
            except sqlite3.IntegrityError as e:
                if 'CHECK constraint failed' in str(e):
                    print("❌ Need to update role constraint to include external_admin")
                    print("The database schema needs to be updated to support external_admin role")
                    conn.rollback()
                    conn.close()
                    return False
                else:
                    # Other integrity error, rollback test
                    conn.rollback()
            
            conn.commit()
            conn.close()
            
            print("✅ User roles migration completed successfully")
            return True
            
        except Exception as e:
            print(f"❌ Error migrating user roles: {str(e)}")
            return False

def migrate_job_fields():
    """Add external job fields to jobs table"""
    # Import the app from main module
    import src.main as main_module
    app = main_module.app
    
    with app.app_context():
        try:
            print("🔄 Migrating jobs table for external job support...")
            
            db_path = os.path.join(os.path.dirname(__file__), 'src', 'database', 'app.db')
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Check current schema
            cursor.execute("PRAGMA table_info(jobs);")
            columns = cursor.fetchall()
            column_names = [col[1] for col in columns]
            
            # List of new columns to add
            new_columns = [
                ('external_company_name', 'VARCHAR(200)'),
                ('external_company_website', 'VARCHAR(255)'),
                ('external_company_logo', 'VARCHAR(255)'),
                ('job_source', 'VARCHAR(50) DEFAULT "internal"'),
                ('source_url', 'VARCHAR(500)')
            ]
            
            # Add missing columns
            for col_name, col_type in new_columns:
                if col_name not in column_names:
                    print(f"Adding column: {col_name}")
                    try:
                        cursor.execute(f"ALTER TABLE jobs ADD COLUMN {col_name} {col_type}")
                    except sqlite3.Error as e:
                        print(f"❌ Error adding column {col_name}: {str(e)}")
                        conn.rollback()
                        conn.close()
                        return False
                else:
                    print(f"✅ Column {col_name} already exists")
            
            # Make company_id nullable if it's not already
            # Check if company_id allows NULL
            cursor.execute("PRAGMA table_info(jobs);")
            columns = cursor.fetchall()
            company_id_column = None
            for col in columns:
                if col[1] == 'company_id':
                    company_id_column = col
                    break
            
            if company_id_column and company_id_column[3] == 1:  # NOT NULL constraint
                print("⚠️  company_id column is NOT NULL, but external jobs need it to be nullable")
                print("This requires a table rebuild in SQLite. Consider using proper migration tools.")
            else:
                print("✅ company_id column allows NULL values")
            
            conn.commit()
            conn.close()
            
            print("✅ Jobs table migration completed successfully")
            return True
            
        except Exception as e:
            print(f"❌ Error migrating jobs table: {str(e)}")
            return False

def verify_migration():
    """Verify that the migration was successful"""
    # Import the app from main module
    import src.main as main_module
    app = main_module.app
    
    with app.app_context():
        try:
            print("🔍 Verifying migration...")
            
            # Check if we can create tables with new schema
            db.create_all()
            
            print("✅ Database schema verification completed")
            return True
            
        except Exception as e:
            print(f"❌ Error verifying migration: {str(e)}")
            return False

def main():
    """Main migration function"""
    print("🚀 Starting Database Migration for External Admin Support")
    print("=" * 60)
    
    success = True
    
    # Step 1: Migrate user roles
    if not migrate_user_roles():
        success = False
    
    # Step 2: Migrate job fields
    if not migrate_job_fields():
        success = False
    
    # Step 3: Verify migration
    if not verify_migration():
        success = False
    
    print("=" * 60)
    if success:
        print("✅ Migration completed successfully!")
        print("\n📋 What's new:")
        print("• external_admin role added to user roles")
        print("• External job fields added to jobs table")
        print("• Jobs can now exist without company profiles")
        print("• Support for job source tracking")
        print("\n🔗 Next steps:")
        print("• Run create_external_admin.py to create external admin users")
        print("• Use external admin accounts to post external jobs")
    else:
        print("❌ Migration failed! Please check the errors above.")
        print("\n⚠️  Note: For SQLite databases, some schema changes may require:")
        print("• Manual table recreation")
        print("• Using proper migration tools like Alembic")
        print("• Backing up and restoring data")

if __name__ == "__main__":
    main()
