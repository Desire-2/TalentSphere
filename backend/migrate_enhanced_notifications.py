#!/usr/bin/env python3
"""
Database Migration Script for Enhanced Notifications
Adds new tables for notification preferences, delivery logs, and queue
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add src to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.models.user import db
from src.models.notification_preferences import NotificationPreference, NotificationDeliveryLog, NotificationQueue
from flask import Flask

def create_app():
    """Create Flask app for migration"""
    app = Flask(__name__)
    
    # Database configuration
    DATABASE_URL = os.getenv('DATABASE_URL')
    if DATABASE_URL:
        # Production: Use PostgreSQL from Render
        if DATABASE_URL.startswith("postgres://"):
            DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
    else:
        # Development: Use local PostgreSQL or SQLite
        DB_HOST = os.getenv('DB_HOST', 'localhost')
        DB_PORT = os.getenv('DB_PORT', '5432')
        DB_NAME = os.getenv('DB_NAME', 'talentsphere')
        DB_USER = os.getenv('DB_USER', 'postgres')
        DB_PASSWORD = os.getenv('DB_PASSWORD', 'password')
        
        postgres_url = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        
        # Try PostgreSQL first, fall back to SQLite
        try:
            app.config['SQLALCHEMY_DATABASE_URI'] = postgres_url
            # Test connection
            import psycopg2
            conn = psycopg2.connect(
                host=DB_HOST,
                port=DB_PORT,
                database=DB_NAME,
                user=DB_USER,
                password=DB_PASSWORD
            )
            conn.close()
            print(f"✅ Using PostgreSQL: {DB_HOST}:{DB_PORT}/{DB_NAME}")
        except Exception as e:
            print(f"⚠️  PostgreSQL connection failed: {e}")
            print("🔄 Falling back to SQLite...")
            app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///talentsphere.db'
    
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_size': 10,
        'pool_timeout': 120,
        'pool_recycle': -1,
        'max_overflow': 0
    }
    
    db.init_app(app)
    return app

def run_migration():
    """Run the migration"""
    try:
        app = create_app()
        
        with app.app_context():
            print("🔄 Running enhanced notification system migration...")
            
            # Create all new tables
            db.create_all()
            
            print("✅ Migration completed successfully!")
            print("\nNew tables created:")
            print("  - notification_preferences")
            print("  - notification_delivery_logs") 
            print("  - notification_queue")
            
            # Check if tables were created
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            
            expected_tables = [
                'notification_preferences',
                'notification_delivery_logs',
                'notification_queue'
            ]
            
            missing_tables = [table for table in expected_tables if table not in tables]
            
            if missing_tables:
                print(f"⚠️  Warning: Some tables may not have been created: {missing_tables}")
            else:
                print("✅ All expected tables are present")
                
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        return False
    
    return True

def rollback_migration():
    """Rollback the migration (drop new tables)"""
    try:
        app = create_app()
        
        with app.app_context():
            print("🔄 Rolling back enhanced notification system migration...")
            
            # Drop the new tables
            tables_to_drop = [
                'notification_queue',
                'notification_delivery_logs',
                'notification_preferences'
            ]
            
            for table_name in tables_to_drop:
                try:
                    db.session.execute(db.text(f'DROP TABLE IF EXISTS {table_name} CASCADE'))
                    print(f"  - Dropped table: {table_name}")
                except Exception as e:
                    print(f"  - Warning: Could not drop {table_name}: {e}")
            
            db.session.commit()
            print("✅ Rollback completed successfully!")
            
    except Exception as e:
        print(f"❌ Rollback failed: {str(e)}")
        return False
    
    return True

def check_migration_status():
    """Check if migration has been applied"""
    try:
        app = create_app()
        
        with app.app_context():
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            
            expected_tables = [
                'notification_preferences',
                'notification_delivery_logs',
                'notification_queue'
            ]
            
            present_tables = [table for table in expected_tables if table in tables]
            missing_tables = [table for table in expected_tables if table not in tables]
            
            print("📊 Migration Status:")
            print(f"  Present tables: {present_tables}")
            print(f"  Missing tables: {missing_tables}")
            
            if not missing_tables:
                print("✅ Migration is complete")
                return True
            else:
                print("⚠️  Migration is incomplete")
                return False
                
    except Exception as e:
        print(f"❌ Could not check migration status: {str(e)}")
        return False

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Enhanced Notification System Migration')
    parser.add_argument('command', choices=['migrate', 'rollback', 'status'], 
                       help='Migration command to run')
    
    args = parser.parse_args()
    
    if args.command == 'migrate':
        success = run_migration()
        exit(0 if success else 1)
    elif args.command == 'rollback':
        success = rollback_migration()
        exit(0 if success else 1)
    elif args.command == 'status':
        success = check_migration_status()
        exit(0 if success else 1)