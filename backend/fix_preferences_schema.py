#!/usr/bin/env python3
"""
Fix Notification Preferences Database Schema
Aligns the notification_preferences table with the enhanced notification models
"""

import sys
import os
sys.path.append('.')

from src.main import app
from src.models.user import db
from sqlalchemy import text, inspect
from datetime import datetime

def fix_notification_preferences():
    """Fix notification_preferences table schema"""
    inspector = inspect(db.engine)
    columns = {col['name']: col for col in inspector.get_columns('notification_preferences')}
    
    # Add missing columns that the enhanced model expects
    missing_columns = [
        # Email preferences
        ('promotions_email', 'BOOLEAN DEFAULT FALSE'),
        
        # Push preferences
        ('promotions_push', 'BOOLEAN DEFAULT FALSE'),
        
        # SMS preferences
        ('sms_enabled', 'BOOLEAN DEFAULT FALSE'),
        ('interview_reminders_sms', 'BOOLEAN DEFAULT FALSE'),
        ('deadline_reminders_sms', 'BOOLEAN DEFAULT FALSE'),
        
        # Digest preferences
        ('weekly_digest_enabled', 'BOOLEAN DEFAULT TRUE'),
        ('weekly_digest_day', 'VARCHAR(10) DEFAULT \'monday\''),
        ('daily_digest_enabled', 'BOOLEAN DEFAULT FALSE'),
        ('daily_digest_time', 'TIME DEFAULT \'09:00\''),
        
        # Enhanced quiet hours
        ('quiet_hours_timezone', 'VARCHAR(50) DEFAULT \'UTC\''),
        
        # Frequency settings
        ('max_emails_per_day', 'INTEGER DEFAULT 10'),
        ('batch_notifications', 'BOOLEAN DEFAULT TRUE'),
        ('immediate_for_urgent', 'BOOLEAN DEFAULT TRUE')
    ]
    
    add_columns = []
    for col_name, col_definition in missing_columns:
        if col_name not in columns:
            add_columns.append(f'ADD COLUMN {col_name} {col_definition}')
    
    if add_columns:
        for add_col in add_columns:
            alter_sql = f"ALTER TABLE notification_preferences {add_col}"
            print(f"Executing: {alter_sql}")
            db.session.execute(text(alter_sql))
        db.session.commit()
        print("✅ Added missing columns to notification_preferences")
    
    # Handle existing column mappings/renames
    renames = []
    
    # Map weekly_digest_email to weekly_digest_enabled if needed
    if 'weekly_digest_email' in columns and 'weekly_digest_enabled' not in columns:
        # Check if we just added weekly_digest_enabled
        updated_inspector = inspect(db.engine)
        updated_columns = {col['name']: col for col in updated_inspector.get_columns('notification_preferences')}
        if 'weekly_digest_enabled' not in updated_columns:
            renames.append(('weekly_digest_email', 'weekly_digest_enabled'))
    
    # Map timezone to quiet_hours_timezone if needed  
    if 'timezone' in columns and 'quiet_hours_timezone' not in columns:
        # Check if we just added quiet_hours_timezone
        updated_inspector = inspect(db.engine)
        updated_columns = {col['name']: col for col in updated_inspector.get_columns('notification_preferences')}
        if 'quiet_hours_timezone' not in updated_columns:
            renames.append(('timezone', 'quiet_hours_timezone'))
    
    for old_name, new_name in renames:
        if old_name in columns:
            print(f"Renaming {old_name} to {new_name}")
            db.session.execute(text(f"ALTER TABLE notification_preferences RENAME COLUMN {old_name} TO {new_name}"))
            db.session.commit()
    
    print("✅ notification_preferences table updated")

def main():
    """Run the preferences schema fix"""
    print("🔧 Fixing notification_preferences database schema...")
    
    with app.app_context():
        try:
            # Check if table exists
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            
            if 'notification_preferences' in tables:
                fix_notification_preferences()
            else:
                print("❌ notification_preferences table not found")
            
            print("\n✅ Schema migration completed successfully!")
            
            # Verify the changes
            print("\n📋 Verifying changes:")
            columns = inspector.get_columns('notification_preferences')
            print("\nnotification_preferences columns:")
            for col in columns:
                print(f"  ✓ {col['name']}: {col['type']}")
                    
        except Exception as e:
            print(f"❌ Error during migration: {e}")
            db.session.rollback()
            return False
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)