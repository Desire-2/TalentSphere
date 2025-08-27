#!/usr/bin/env python3
"""
Script to create an admin user for TalentSphere
"""
import os
import sys

# Add the src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.main import app
from src.models.user import db, User

def create_admin_user():
    """Create an admin user"""
    with app.app_context():
        # Check if admin already exists
        admin_email = "admin@talentsphere.com"
        existing_admin = User.query.filter_by(email=admin_email).first()
        
        if existing_admin:
            print(f"Admin user with email {admin_email} already exists!")
            print(f"Admin ID: {existing_admin.id}")
            print(f"Admin Name: {existing_admin.get_full_name()}")
            return existing_admin
        
        # Create new admin user
        admin_user = User(
            email=admin_email,
            first_name="Admin",
            last_name="User",
            role="admin",
            location="TalentSphere HQ",
            bio="System Administrator for TalentSphere platform"
        )
        
        # Set a secure default password (should be changed after first login)
        admin_password = "AdminPass123!"
        admin_user.set_password(admin_password)
        
        # Save to database
        db.session.add(admin_user)
        db.session.commit()
        
        print("✅ Admin user created successfully!")
        print(f"📧 Email: {admin_email}")
        print(f"🔑 Password: {admin_password}")
        print(f"👤 ID: {admin_user.id}")
        print(f"📛 Name: {admin_user.get_full_name()}")
        print(f"🎭 Role: {admin_user.role}")
        print("\n⚠️  IMPORTANT: Please change the default password after first login!")
        
        return admin_user

if __name__ == "__main__":
    try:
        admin = create_admin_user()
    except Exception as e:
        print(f"❌ Error creating admin user: {str(e)}")
        sys.exit(1)
