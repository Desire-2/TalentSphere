#!/usr/bin/env python3
"""
Add missing columns to job_seeker_profiles and fix volunteer_experiences table
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.main import app
from src.models.user import db
from sqlalchemy import text

def add_missing_columns():
    """Add missing columns to tables"""
    with app.app_context():
        try:
            print("=" * 60)
            print("  Database Schema Migration")
            print("=" * 60)
            
            # Get database dialect
            dialect = db.engine.dialect.name
            print(f"\n📊 Database: {dialect}")
            
            migrations = []
            
            # Check and add columns to job_seeker_profiles
            jsp_columns = {
                'technical_skills': 'TEXT',
                'career_level': 'VARCHAR(50)',
                'notice_period': 'VARCHAR(50)'
            }
            
            for col_name, col_type in jsp_columns.items():
                migrations.append({
                    'table': 'job_seeker_profiles',
                    'column': col_name,
                    'type': col_type
                })
            
            # Check and add missing column to volunteer_experiences
            ve_columns = {
                'responsibilities': 'TEXT',
                'impact': 'TEXT',
                'display_order': 'INTEGER DEFAULT 0'
            }
            
            for col_name, col_type in ve_columns.items():
                migrations.append({
                    'table': 'volunteer_experiences',
                    'column': col_name,
                    'type': col_type
                })
            
            # Execute migrations
            for migration in migrations:
                try:
                    if dialect == 'postgresql':
                        sql = f"ALTER TABLE {migration['table']} ADD COLUMN IF NOT EXISTS {migration['column']} {migration['type']};"
                    else:  # SQLite
                        # SQLite doesn't support IF NOT EXISTS in ALTER TABLE
                        # Try to add and ignore if it exists
                        sql = f"ALTER TABLE {migration['table']} ADD COLUMN {migration['column']} {migration['type']};"
                    
                    db.session.execute(text(sql))
                    db.session.commit()
                    print(f"✅ Added {migration['column']} to {migration['table']}")
                except Exception as e:
                    error_msg = str(e).lower()
                    if 'already exists' in error_msg or 'duplicate column' in error_msg:
                        print(f"⏭️  {migration['column']} already exists in {migration['table']}")
                        db.session.rollback()
                    else:
                        print(f"❌ Failed to add {migration['column']} to {migration['table']}: {e}")
                        db.session.rollback()
            
            print("\n" + "=" * 60)
            print("✅ Migration completed!")
            print("=" * 60)
            
        except Exception as e:
            print(f"\n❌ Migration failed: {e}")
            db.session.rollback()
            raise

if __name__ == '__main__':
    add_missing_columns()
