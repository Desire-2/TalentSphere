#!/usr/bin/env python3
"""
Create External Admin User Script
This script creates an external admin user who can post jobs from external sources without creating company profiles.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.models.user import db, User
from datetime import datetime
import getpass

def create_external_admin():
    """Create an external admin user"""
    # Import the app from main module
    import src.main as main_module
    app = main_module.app
    
    with app.app_context():
        try:
            print("🚀 Creating External Admin User")
            print("=" * 50)
            
            # Get user input
            first_name = input("Enter first name: ").strip()
            if not first_name:
                print("❌ First name is required")
                return False
            
            last_name = input("Enter last name: ").strip()
            if not last_name:
                print("❌ Last name is required")
                return False
            
            email = input("Enter email: ").strip().lower()
            if not email:
                print("❌ Email is required")
                return False
            
            # Check if email already exists
            existing_user = User.query.filter_by(email=email).first()
            if existing_user:
                print(f"❌ User with email {email} already exists")
                return False
            
            # Get password
            while True:
                password = getpass.getpass("Enter password (min 8 characters): ")
                if len(password) < 8:
                    print("❌ Password must be at least 8 characters long")
                    continue
                
                confirm_password = getpass.getpass("Confirm password: ")
                if password != confirm_password:
                    print("❌ Passwords do not match")
                    continue
                break
            
            # Optional fields
            phone = input("Enter phone (optional): ").strip() or None
            location = input("Enter location (optional): ").strip() or None
            bio = input("Enter bio (optional): ").strip() or None
            
            # Create external admin user
            external_admin = User(
                email=email,
                first_name=first_name,
                last_name=last_name,
                role='external_admin',
                phone=phone,
                location=location,
                bio=bio,
                is_active=True,
                is_verified=True,  # Auto-verify external admin
                email_verified_at=datetime.utcnow(),
                created_at=datetime.utcnow()
            )
            
            external_admin.set_password(password)
            
            # Save to database
            db.session.add(external_admin)
            db.session.commit()
            
            print("\n" + "=" * 50)
            print("✅ External Admin User Created Successfully!")
            print("=" * 50)
            print(f"ID: {external_admin.id}")
            print(f"Name: {external_admin.get_full_name()}")
            print(f"Email: {external_admin.email}")
            print(f"Role: {external_admin.role}")
            print(f"Active: {external_admin.is_active}")
            print(f"Verified: {external_admin.is_verified}")
            print(f"Created: {external_admin.created_at}")
            print("=" * 50)
            print("\n📋 External Admin Capabilities:")
            print("• Post jobs from external sources without creating company profiles")
            print("• Manage external job listings")
            print("• Bulk import jobs from various sources")
            print("• Update and delete their own external job postings")
            print("• View applications for their external jobs")
            print("\n🔗 Use this account to:")
            print("• Import job listings from job boards")
            print("• Post jobs from partner companies")
            print("• Manage external recruitment campaigns")
            print("• Aggregate jobs from multiple sources")
            
            return True
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error creating external admin: {str(e)}")
            return False

def list_external_admins():
    """List all external admin users"""
    # Import the app from main module
    import src.main as main_module
    app = main_module.app
    
    with app.app_context():
        try:
            external_admins = User.query.filter_by(role='external_admin').all()
            
            if not external_admins:
                print("📋 No external admin users found")
                return
            
            print(f"\n📋 Found {len(external_admins)} External Admin(s):")
            print("=" * 80)
            print(f"{'ID':<5} {'Name':<25} {'Email':<30} {'Active':<8} {'Created'}")
            print("-" * 80)
            
            for admin in external_admins:
                created_date = admin.created_at.strftime('%Y-%m-%d') if admin.created_at else 'Unknown'
                print(f"{admin.id:<5} {admin.get_full_name():<25} {admin.email:<30} {'✅' if admin.is_active else '❌':<8} {created_date}")
            
            print("=" * 80)
            
        except Exception as e:
            print(f"❌ Error listing external admins: {str(e)}")

def main():
    """Main function"""
    if len(sys.argv) > 1 and sys.argv[1] == "list":
        list_external_admins()
    else:
        create_external_admin()

if __name__ == "__main__":
    main()
