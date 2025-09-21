#!/usr/bin/env python3
"""
Fix Notification Database Schema
Aligns the database tables with the enhanced notification models
"""

import sys
import os
sys.path.append('.')

from src.main import app
from src.models.user import db
from sqlalchemy import text, inspect
from datetime import datetime

def fix_notification_delivery_logs():
    """Fix notification_delivery_logs table schema"""
    inspector = inspect(db.engine)
    columns = {col['name']: col for col in inspector.get_columns('notification_delivery_logs')}
    
    # First, add missing columns
    expected_columns = {
        'delivery_provider': 'VARCHAR(50)',
        'opened_at': 'TIMESTAMP',
        'clicked_at': 'TIMESTAMP'
    }
    
    add_columns = []
    for col_name, col_type in expected_columns.items():
        if col_name not in columns:
            add_columns.append(f'ADD COLUMN {col_name} {col_type}')
    
    if add_columns:
        alter_sql = f"ALTER TABLE notification_delivery_logs {', '.join(add_columns)}"
        print(f"Executing: {alter_sql}")
        db.session.execute(text(alter_sql))
        db.session.commit()
    
    # Then handle renames separately
    if 'error_message' in columns and 'delivery_response' not in columns:
        print("Renaming error_message to delivery_response")
        db.session.execute(text("ALTER TABLE notification_delivery_logs RENAME COLUMN error_message TO delivery_response"))
        db.session.commit()
    
    print("✅ notification_delivery_logs table updated")

def fix_notification_queue():
    """Fix notification_queue table schema"""
    inspector = inspect(db.engine)
    columns = {col['name']: col for col in inspector.get_columns('notification_queue')}
    
    # Add missing columns
    expected_columns = {
        'next_retry_at': 'TIMESTAMP',
        'batch_id': 'VARCHAR(50)',
        'delivery_data': 'TEXT',
        'processed_at': 'TIMESTAMP'
    }
    
    add_columns = []
    for col_name, col_type in expected_columns.items():
        if col_name not in columns:
            add_columns.append(f'ADD COLUMN {col_name} {col_type}')
    
    if add_columns:
        alter_sql = f"ALTER TABLE notification_queue {', '.join(add_columns)}"
        print(f"Executing: {alter_sql}")
        db.session.execute(text(alter_sql))
        db.session.commit()
    
    print("✅ notification_queue table updated")

def main():
    """Run all schema fixes"""
    print("🔧 Fixing notification database schema...")
    
    with app.app_context():
        try:
            # Check if tables exist
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            
            if 'notification_delivery_logs' in tables:
                fix_notification_delivery_logs()
            else:
                print("❌ notification_delivery_logs table not found")
            
            if 'notification_queue' in tables:
                fix_notification_queue()
            else:
                print("❌ notification_queue table not found")
            
            print("\n✅ Schema migration completed successfully!")
            
            # Verify the changes
            print("\n📋 Verifying changes:")
            
            # Check delivery logs
            if 'notification_delivery_logs' in tables:
                columns = inspector.get_columns('notification_delivery_logs')
                print("\nnotification_delivery_logs columns:")
                for col in columns:
                    print(f"  ✓ {col['name']}: {col['type']}")
            
            # Check queue
            if 'notification_queue' in tables:
                columns = inspector.get_columns('notification_queue')
                print("\nnotification_queue columns:")
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