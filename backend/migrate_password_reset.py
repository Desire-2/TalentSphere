#!/usr/bin/env python3
"""
Migration script to add password reset fields to the User table
Run this script to add the necessary columns for password reset functionality
"""

from src.models.user import db, User
from src.main import app
import os
import sys

def add_password_reset_columns():
    """Add password reset columns to the User table"""
    try:
        with app.app_context():
            # Check if columns already exist
            inspector = db.inspect(db.engine)
            columns = [col['name'] for col in inspector.get_columns('users')]
            
            if 'reset_token' in columns and 'reset_token_expires_at' in columns:
                print("Password reset columns already exist in the database.")
                return True
            
            # Add the columns using raw SQL
            with db.engine.connect() as conn:
                if 'reset_token' not in columns:
                    conn.execute(db.text("ALTER TABLE users ADD COLUMN reset_token VARCHAR(255)"))
                    print("Added reset_token column")
                
                if 'reset_token_expires_at' not in columns:
                    conn.execute(db.text("ALTER TABLE users ADD COLUMN reset_token_expires_at DATETIME"))
                    print("Added reset_token_expires_at column")
                
                conn.commit()
            
            print("Successfully added password reset columns to the database!")
            return True
            
    except Exception as e:
        print(f"Error adding password reset columns: {str(e)}")
        return False

def main():
    """Main migration function"""
    print("TalentSphere Password Reset Migration")
    print("=" * 40)
    
    # Check if we're in the right directory
    if not os.path.exists('src/models/user.py'):
        print("Error: Please run this script from the backend directory")
        print("Usage: cd backend && python migrate_password_reset.py")
        sys.exit(1)
    
    print("Adding password reset columns to User table...")
    
    if add_password_reset_columns():
        print("\nMigration completed successfully!")
        print("\nPassword reset functionality is now ready to use:")
        print("- Users can request password reset via /api/auth/forgot-password")
        print("- Reset tokens expire after 1 hour for security")
        print("- Users can reset password via /api/auth/reset-password")
    else:
        print("\nMigration failed. Please check the error messages above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
