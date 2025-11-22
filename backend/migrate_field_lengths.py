#!/usr/bin/env python3
"""
Database Migration: Increase field lengths
Date: 2025-11-22
Description: Increase character limits for title, organization names, and other text fields
"""

import sys
import os

# Add the src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from database import db
from sqlalchemy import text

def run_migration():
    """Run the database migration to increase field lengths"""
    
    print("🔄 Starting database migration: Increase field lengths")
    print("=" * 70)
    
    try:
        # Connect to database
        print("\n📊 Connecting to database...")
        
        # Run migrations
        migrations = [
            # Scholarships table
            ("ALTER TABLE scholarships ALTER COLUMN title TYPE VARCHAR(500)", 
             "Increase scholarships.title to 500 chars"),
            
            ("ALTER TABLE scholarships ALTER COLUMN slug TYPE VARCHAR(500)", 
             "Increase scholarships.slug to 500 chars"),
            
            ("ALTER TABLE scholarships ALTER COLUMN external_organization_name TYPE VARCHAR(300)", 
             "Increase scholarships.external_organization_name to 300 chars"),
            
            ("ALTER TABLE scholarships ALTER COLUMN external_organization_website TYPE VARCHAR(500)", 
             "Increase scholarships.external_organization_website to 500 chars"),
            
            ("ALTER TABLE scholarships ALTER COLUMN scholarship_type TYPE VARCHAR(100)", 
             "Increase scholarships.scholarship_type to 100 chars"),
            
            ("ALTER TABLE scholarships ALTER COLUMN study_level TYPE VARCHAR(200)", 
             "Increase scholarships.study_level to 200 chars (supports multiple values)"),
            
            ("ALTER TABLE scholarships ALTER COLUMN field_of_study TYPE VARCHAR(300)", 
             "Increase scholarships.field_of_study to 300 chars"),
            
            # Jobs table
            ("ALTER TABLE jobs ALTER COLUMN title TYPE VARCHAR(500)", 
             "Increase jobs.title to 500 chars"),
            
            ("ALTER TABLE jobs ALTER COLUMN slug TYPE VARCHAR(500)", 
             "Increase jobs.slug to 500 chars"),
            
            ("ALTER TABLE jobs ALTER COLUMN external_company_name TYPE VARCHAR(300)", 
             "Increase jobs.external_company_name to 300 chars"),
            
            ("ALTER TABLE jobs ALTER COLUMN external_company_website TYPE VARCHAR(500)", 
             "Increase jobs.external_company_website to 500 chars"),
        ]
        
        print(f"\n✅ Found {len(migrations)} migration(s) to run\n")
        
        # Execute each migration
        for i, (sql, description) in enumerate(migrations, 1):
            try:
                print(f"[{i}/{len(migrations)}] {description}...")
                db.session.execute(text(sql))
                db.session.commit()
                print(f"    ✓ Success")
            except Exception as e:
                error_msg = str(e)
                if "already exists" in error_msg.lower() or "does not exist" in error_msg.lower():
                    print(f"    ⚠ Skipped (already applied or not needed)")
                    db.session.rollback()
                else:
                    print(f"    ✗ Error: {error_msg}")
                    db.session.rollback()
                    raise
        
        print("\n" + "=" * 70)
        print("✅ Migration completed successfully!")
        print("\n📝 Summary:")
        print("   - Scholarship title: 200 → 500 characters")
        print("   - Job title: 200 → 500 characters")
        print("   - Organization names: 200 → 300 characters")
        print("   - Organization websites: 255 → 500 characters")
        print("   - Study level: 50 → 200 characters (multiple values supported)")
        print("   - Field of study: 100 → 300 characters")
        print("   - Scholarship type: 50 → 100 characters")
        print("\n🎉 Your database is now ready to accept longer field values!")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        print("\nPlease check the error message above and try again.")
        print("If the issue persists, you may need to run the migration manually.")
        return False

if __name__ == '__main__':
    print("\n" + "=" * 70)
    print("  DATABASE MIGRATION: Increase Field Lengths")
    print("=" * 70)
    print("\nThis migration will:")
    print("  • Increase title fields from 200 to 500 characters")
    print("  • Increase organization name fields from 200 to 300 characters")
    print("  • Increase website URL fields from 255 to 500 characters")
    print("  • Increase study_level field to support multiple values")
    print("\n⚠️  IMPORTANT: Make sure you have a database backup before proceeding!")
    
    response = input("\nDo you want to continue? (yes/no): ").strip().lower()
    
    if response in ['yes', 'y']:
        success = run_migration()
        sys.exit(0 if success else 1)
    else:
        print("\n❌ Migration cancelled by user.")
        sys.exit(0)
