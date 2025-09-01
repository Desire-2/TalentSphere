#!/usr/bin/env python3
"""
Database migration script to add password reset columns to existing User table
This script will add the reset_token and reset_token_expires_at columns if they don't exist
"""

import os
import sys
from datetime import datetime
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_database_connection():
    """Get database connection from environment variables"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise Exception("DATABASE_URL not found in environment variables")
    
    return psycopg2.connect(database_url)

def check_column_exists(conn, table_name, column_name):
    """Check if a column exists in a table"""
    with conn.cursor() as cursor:
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_name = %s AND column_name = %s
        """, (table_name, column_name))
        return cursor.fetchone()[0] > 0

def add_password_reset_columns():
    """Add password reset columns to the users table"""
    conn = None
    try:
        conn = get_database_connection()
        
        print("🔍 Connected to database successfully")
        print("📋 Checking existing columns...")
        
        # Check if columns already exist
        reset_token_exists = check_column_exists(conn, 'users', 'reset_token')
        reset_expires_exists = check_column_exists(conn, 'users', 'reset_token_expires_at')
        
        if reset_token_exists and reset_expires_exists:
            print("✅ Password reset columns already exist in the database.")
            return True
        
        print("➕ Adding missing password reset columns...")
        
        with conn.cursor() as cursor:
            # Add reset_token column if it doesn't exist
            if not reset_token_exists:
                print("  📝 Adding reset_token column...")
                cursor.execute("ALTER TABLE users ADD COLUMN reset_token VARCHAR(255)")
                print("  ✅ reset_token column added successfully")
            else:
                print("  ✅ reset_token column already exists")
            
            # Add reset_token_expires_at column if it doesn't exist
            if not reset_expires_exists:
                print("  📝 Adding reset_token_expires_at column...")
                cursor.execute("ALTER TABLE users ADD COLUMN reset_token_expires_at TIMESTAMP")
                print("  ✅ reset_token_expires_at column added successfully")
            else:
                print("  ✅ reset_token_expires_at column already exists")
        
        # Commit the changes
        conn.commit()
        print("✅ Database migration completed successfully!")
        return True
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Error during migration: {str(e)}")
        return False
        
    finally:
        if conn:
            conn.close()

def verify_migration():
    """Verify that the migration was successful"""
    conn = None
    try:
        conn = get_database_connection()
        print("🔍 Verifying migration...")
        
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name IN ('reset_token', 'reset_token_expires_at')
                ORDER BY column_name
            """)
            columns = cursor.fetchall()
            
            if len(columns) == 2:
                print("✅ Migration verification successful!")
                for col_name, data_type, nullable in columns:
                    print(f"  📋 {col_name}: {data_type} (nullable: {nullable})")
                return True
            else:
                print(f"❌ Migration verification failed. Found {len(columns)} columns instead of 2.")
                return False
                
    except Exception as e:
        print(f"❌ Error during verification: {str(e)}")
        return False
        
    finally:
        if conn:
            conn.close()

def main():
    """Main migration function"""
    print("🔧 TalentSphere Password Reset Migration")
    print("=" * 50)
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Check if we have the required environment
    if not os.getenv('DATABASE_URL'):
        print("❌ ERROR: DATABASE_URL environment variable not found")
        print("   Make sure you're running this from the backend directory with a .env file")
        sys.exit(1)
    
    print("🚀 Starting migration process...")
    
    # Run the migration
    if add_password_reset_columns():
        print()
        # Verify the migration
        if verify_migration():
            print()
            print("🎉 SUCCESS! Password reset functionality is now ready:")
            print("   • Users can request password resets via /api/auth/forgot-password")
            print("   • Reset tokens expire after 1 hour for security")
            print("   • Users can reset passwords via /api/auth/reset-password")
            print()
            print("📝 Next steps:")
            print("   1. The server should now handle forgot password requests")
            print("   2. Test the functionality using the frontend or test page")
            print("   3. Configure SMTP for production email sending")
        else:
            print("❌ Migration completed but verification failed")
            sys.exit(1)
    else:
        print("❌ Migration failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
