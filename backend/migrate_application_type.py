#!/usr/bin/env python3
"""
Database migration script to add application_type field to jobs table
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.models.user import db
from src.main import app

def migrate_add_application_type():
    """Add application_type column to jobs table"""
    
    print("🔄 Starting database migration: Add application_type to jobs table")
    
    with app.app_context():
        try:
            # Check if column already exists
            with db.engine.connect() as conn:
                result = conn.execute(db.text("PRAGMA table_info(jobs);"))
                columns = [row[1] for row in result.fetchall()]
                
                if 'application_type' in columns:
                    print("✅ application_type column already exists")
                    return True
                
                # Add the new column with default value
                conn.execute(db.text("ALTER TABLE jobs ADD COLUMN application_type VARCHAR(50) DEFAULT 'internal';"))
                
                # Update existing records to have 'internal' as application_type
                conn.execute(db.text("UPDATE jobs SET application_type = 'internal' WHERE application_type IS NULL;"))
                
                conn.commit()
            
            print("✅ Successfully added application_type column to jobs table")
            print("✅ Set default value 'internal' for existing records")
            
            return True
            
        except Exception as e:
            print(f"❌ Migration failed: {str(e)}")
            return False

def verify_migration():
    """Verify that the migration was successful"""
    
    with app.app_context():
        try:
            # Check if column exists and has correct values
            with db.engine.connect() as conn:
                result = conn.execute(db.text("SELECT application_type, COUNT(*) as count FROM jobs GROUP BY application_type;"))
                rows = result.fetchall()
                
                print("\n📊 Migration verification:")
                print("Application types in database:")
                for row in rows:
                    app_type, count = row
                    print(f"  - {app_type}: {count} jobs")
            
            return True
            
        except Exception as e:
            print(f"❌ Verification failed: {str(e)}")
            return False

def main():
    print("🚀 TalentSphere Database Migration")
    print("=" * 50)
    
    # Run migration
    success = migrate_add_application_type()
    
    if success:
        print("\n🔍 Verifying migration...")
        verify_migration()
        
        print("\n🎉 Migration completed successfully!")
        print("=" * 50)
        print("The jobs table now includes the application_type field with values:")
        print("- 'internal': Apply through TalentSphere platform (default)")
        print("- 'external': Apply through external URL")
        print("- 'email': Apply via email")
        
    else:
        print("\n❌ Migration failed!")
        print("Please check the error messages above and try again.")
        sys.exit(1)

if __name__ == '__main__':
    main()
