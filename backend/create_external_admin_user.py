#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from src.main import app
from src.models.user import db, User
from werkzeug.security import generate_password_hash

def create_external_admin_user():
    """Create an external admin user for testing"""
    try:
        with app.app_context():
            # Check if external admin already exists
            existing_admin = User.query.filter_by(email='external_admin@talentsphere.com').first()
            
            if existing_admin:
                print("✅ External admin user already exists")
                print(f"Email: {existing_admin.email}")
                print(f"Role: {existing_admin.role}")
                return existing_admin
            
            # Create external admin user
            external_admin = User(
                first_name='External',
                last_name='Admin',
                email='external_admin@talentsphere.com',
                password_hash=generate_password_hash('admin123'),
                role='external_admin',
                is_active=True,
                is_verified=True
            )
            
            db.session.add(external_admin)
            db.session.commit()
            
            print("✅ External admin user created successfully!")
            print(f"Email: {external_admin.email}")
            print(f"Password: admin123")
            print(f"Role: {external_admin.role}")
            print(f"ID: {external_admin.id}")
            
            return external_admin
            
    except Exception as e:
        print(f"❌ Failed to create external admin user: {e}")
        return None

if __name__ == '__main__':
    user = create_external_admin_user()
    if user:
        print("\n🎉 External admin user is ready for testing!")
        print("\nYou can now log in with:")
        print("Email: external_admin@talentsphere.com")
        print("Password: admin123")
    else:
        print("💥 Failed to create external admin user!")
        sys.exit(1)
