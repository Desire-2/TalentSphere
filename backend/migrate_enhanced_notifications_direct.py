#!/usr/bin/env python3
"""
Direct SQL Migration Script for Enhanced Notifications
Creates new notification tables using raw SQL to avoid model conflicts
"""

import os
import sys
import psycopg2
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

class DirectSQLMigration:
    """Direct SQL migration without SQLAlchemy model conflicts"""
    
    def __init__(self):
        self.connection = None
        self.cursor = None
        
    def connect(self):
        """Connect to database"""
        try:
            # Get database connection details
            DATABASE_URL = os.getenv('DATABASE_URL')
            
            if DATABASE_URL:
                # Parse DATABASE_URL for connection
                if DATABASE_URL.startswith("postgres://"):
                    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
                
                # Connect using URL
                self.connection = psycopg2.connect(DATABASE_URL)
            else:
                # Connect using individual parameters
                self.connection = psycopg2.connect(
                    host=os.getenv('DB_HOST', 'localhost'),
                    port=os.getenv('DB_PORT', '5432'),
                    database=os.getenv('DB_NAME', 'talentsphere'),
                    user=os.getenv('DB_USER', 'postgres'),
                    password=os.getenv('DB_PASSWORD', 'password')
                )
            
            self.cursor = self.connection.cursor()
            print("✅ Connected to database")
            return True
            
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            return False
    
    def disconnect(self):
        """Disconnect from database"""
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
        print("✅ Disconnected from database")
    
    def log(self, message):
        """Log with timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {message}")
    
    def table_exists(self, table_name):
        """Check if table exists"""
        check_sql = """
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = %s
        );
        """
        self.cursor.execute(check_sql, (table_name,))
        return self.cursor.fetchone()[0]
    
    def ensure_notifications_table(self):
        """Ensure notifications table exists"""
        if not self.table_exists('notifications'):
            self.log("Creating notifications table...")
            create_sql = """
            CREATE TABLE notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                title VARCHAR(200) NOT NULL,
                message TEXT NOT NULL,
                notification_type VARCHAR(50) NOT NULL,
                data TEXT,
                related_job_id INTEGER,
                related_application_id INTEGER,
                related_company_id INTEGER,
                is_read BOOLEAN DEFAULT false,
                is_sent BOOLEAN DEFAULT false,
                send_email BOOLEAN DEFAULT false,
                send_sms BOOLEAN DEFAULT false,
                send_push BOOLEAN DEFAULT true,
                priority VARCHAR(20) DEFAULT 'normal',
                scheduled_for TIMESTAMP,
                action_url VARCHAR(255),
                action_text VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                read_at TIMESTAMP,
                sent_at TIMESTAMP
            );
            """
            self.cursor.execute(create_sql)
            self.log("✅ notifications table created")
        else:
            self.log("✅ notifications table already exists")
    
    def create_notification_preferences_table(self):
        """Create notification_preferences table"""
        if self.table_exists('notification_preferences'):
            self.log("notification_preferences table already exists")
            return
            
        self.log("Creating notification_preferences table...")
        create_sql = """
        CREATE TABLE notification_preferences (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            
            -- Email preferences
            email_enabled BOOLEAN DEFAULT true,
            job_alerts_email BOOLEAN DEFAULT true,
            application_status_email BOOLEAN DEFAULT true,
            messages_email BOOLEAN DEFAULT true,
            interview_reminders_email BOOLEAN DEFAULT true,
            deadline_reminders_email BOOLEAN DEFAULT true,
            company_updates_email BOOLEAN DEFAULT true,
            system_notifications_email BOOLEAN DEFAULT true,
            weekly_digest_email BOOLEAN DEFAULT true,
            
            -- Push notification preferences
            push_enabled BOOLEAN DEFAULT true,
            job_alerts_push BOOLEAN DEFAULT true,
            application_status_push BOOLEAN DEFAULT true,
            messages_push BOOLEAN DEFAULT true,
            interview_reminders_push BOOLEAN DEFAULT true,
            deadline_reminders_push BOOLEAN DEFAULT true,
            company_updates_push BOOLEAN DEFAULT false,
            system_notifications_push BOOLEAN DEFAULT true,
            
            -- In-app notification preferences
            inapp_enabled BOOLEAN DEFAULT true,
            job_alerts_inapp BOOLEAN DEFAULT true,
            application_status_inapp BOOLEAN DEFAULT true,
            messages_inapp BOOLEAN DEFAULT true,
            interview_reminders_inapp BOOLEAN DEFAULT true,
            deadline_reminders_inapp BOOLEAN DEFAULT true,
            company_updates_inapp BOOLEAN DEFAULT true,
            system_notifications_inapp BOOLEAN DEFAULT true,
            
            -- Frequency and timing
            digest_frequency VARCHAR(20) DEFAULT 'weekly',
            quiet_hours_enabled BOOLEAN DEFAULT false,
            quiet_hours_start TIME,
            quiet_hours_end TIME,
            timezone VARCHAR(50) DEFAULT 'UTC',
            
            -- Timestamps
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            CONSTRAINT unique_user_preferences UNIQUE(user_id)
        );
        """
        
        self.cursor.execute(create_sql)
        
        # Add index
        self.cursor.execute("CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);")
        
        self.log("✅ notification_preferences table created")
    
    def create_notification_delivery_logs_table(self):
        """Create notification_delivery_logs table"""
        if self.table_exists('notification_delivery_logs'):
            self.log("notification_delivery_logs table already exists")
            return
            
        self.log("Creating notification_delivery_logs table...")
        create_sql = """
        CREATE TABLE notification_delivery_logs (
            id SERIAL PRIMARY KEY,
            notification_id INTEGER,
            user_id INTEGER NOT NULL,
            
            -- Delivery information
            delivery_method VARCHAR(20) NOT NULL,
            delivery_status VARCHAR(20) NOT NULL,
            recipient_address VARCHAR(255),
            
            -- Error tracking
            error_message TEXT,
            retry_count INTEGER DEFAULT 0,
            
            -- Timestamps
            attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            delivered_at TIMESTAMP,
            failed_at TIMESTAMP
        );
        """
        
        self.cursor.execute(create_sql)
        
        # Add indexes
        indexes = [
            "CREATE INDEX idx_delivery_logs_notification_id ON notification_delivery_logs(notification_id);",
            "CREATE INDEX idx_delivery_logs_user_id ON notification_delivery_logs(user_id);",
            "CREATE INDEX idx_delivery_logs_status ON notification_delivery_logs(delivery_status);",
            "CREATE INDEX idx_delivery_logs_attempted_at ON notification_delivery_logs(attempted_at);"
        ]
        
        for index_sql in indexes:
            self.cursor.execute(index_sql)
        
        self.log("✅ notification_delivery_logs table created")
    
    def create_notification_queue_table(self):
        """Create notification_queue table"""
        if self.table_exists('notification_queue'):
            self.log("notification_queue table already exists")
            return
            
        self.log("Creating notification_queue table...")
        create_sql = """
        CREATE TABLE notification_queue (
            id SERIAL PRIMARY KEY,
            notification_id INTEGER,
            user_id INTEGER NOT NULL,
            
            -- Queue information
            delivery_method VARCHAR(20) NOT NULL,
            priority VARCHAR(20) DEFAULT 'normal',
            status VARCHAR(20) DEFAULT 'pending',
            
            -- Scheduling
            scheduled_for TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            processing_started_at TIMESTAMP,
            completed_at TIMESTAMP,
            
            -- Error handling
            retry_count INTEGER DEFAULT 0,
            max_retries INTEGER DEFAULT 3,
            last_error TEXT,
            
            -- Timestamps
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        
        self.cursor.execute(create_sql)
        
        # Add indexes
        indexes = [
            "CREATE INDEX idx_queue_status ON notification_queue(status);",
            "CREATE INDEX idx_queue_scheduled_for ON notification_queue(scheduled_for);",
            "CREATE INDEX idx_queue_priority ON notification_queue(priority);",
            "CREATE INDEX idx_queue_user_id ON notification_queue(user_id);"
        ]
        
        for index_sql in indexes:
            self.cursor.execute(index_sql)
        
        self.log("✅ notification_queue table created")
    
    def run_migration(self):
        """Run the complete migration"""
        if not self.connect():
            return False
        
        try:
            self.log("Starting enhanced notification system migration...")
            
            # Ensure base notifications table exists
            self.ensure_notifications_table()
            
            # Create new tables
            self.create_notification_preferences_table()
            self.create_notification_delivery_logs_table()
            self.create_notification_queue_table()
            
            # Commit all changes
            self.connection.commit()
            
            self.log("✅ Migration completed successfully!")
            return True
            
        except Exception as e:
            self.log(f"❌ Migration failed: {e}")
            self.connection.rollback()
            return False
        finally:
            self.disconnect()
    
    def check_status(self):
        """Check migration status"""
        if not self.connect():
            return False
        
        try:
            self.log("Checking migration status...")
            
            required_tables = [
                'notifications',
                'notification_preferences',
                'notification_delivery_logs', 
                'notification_queue'
            ]
            
            existing_tables = []
            missing_tables = []
            
            for table in required_tables:
                if self.table_exists(table):
                    existing_tables.append(table)
                    
                    # Get table info
                    self.cursor.execute(f"SELECT COUNT(*) FROM {table}")
                    count = self.cursor.fetchone()[0]
                    self.log(f"✅ {table}: exists ({count} records)")
                else:
                    missing_tables.append(table)
                    self.log(f"❌ {table}: missing")
            
            if missing_tables:
                self.log(f"Migration not complete. Missing tables: {missing_tables}")
                return False
            else:
                self.log("✅ All required tables exist. Migration is complete.")
                return True
                
        except Exception as e:
            self.log(f"❌ Status check failed: {e}")
            return False
        finally:
            self.disconnect()
    
    def rollback(self):
        """Rollback migration by dropping new tables"""
        if not self.connect():
            return False
        
        try:
            self.log("Rolling back enhanced notification system migration...")
            
            # Drop tables in reverse order to handle dependencies
            tables_to_drop = [
                'notification_queue',
                'notification_delivery_logs', 
                'notification_preferences'
            ]
            
            for table in tables_to_drop:
                if self.table_exists(table):
                    self.cursor.execute(f'DROP TABLE {table} CASCADE')
                    self.log(f"✅ Dropped table: {table}")
                else:
                    self.log(f"⚠️  Table {table} does not exist")
            
            # Commit changes
            self.connection.commit()
            
            self.log("✅ Rollback completed successfully!")
            return True
            
        except Exception as e:
            self.log(f"❌ Rollback failed: {e}")
            self.connection.rollback()
            return False
        finally:
            self.disconnect()

def main():
    """Main migration command"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Enhanced Notifications Database Migration')
    parser.add_argument('command', choices=['migrate', 'status', 'rollback'], 
                       help='Migration command to run')
    
    args = parser.parse_args()
    
    migration = DirectSQLMigration()
    
    if args.command == 'migrate':
        success = migration.run_migration()
        exit(0 if success else 1)
    elif args.command == 'status':
        success = migration.check_status()
        exit(0 if success else 1)
    elif args.command == 'rollback':
        success = migration.rollback()
        exit(0 if success else 1)

if __name__ == '__main__':
    main()