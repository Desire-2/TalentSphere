#!/usr/bin/env python3
"""
Script to create an employer user for TalentSphere
"""
import os
import sys

# Add the src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.main import app
from src.models.user import db, User

def create_employer_user():
    """Create an employer user"""
    with app.app_context():
        # Check if employer already exists
        employer_email = "employer@techcorp.com"
        existing_employer = User.query.filter_by(email=employer_email).first()
        
        if existing_employer:
            print(f"Employer user with email {employer_email} already exists!")
            print(f"Employer ID: {existing_employer.id}")
            print(f"Employer Name: {existing_employer.get_full_name()}")
            return existing_employer
        
        # Create new employer user
        employer_user = User(
            email=employer_email,
            first_name="John",
            last_name="Manager",
            role="employer",
            location="San Francisco, CA",
            bio="HR Manager at TechCorp Solutions"
        )
        
        # Set a secure default password
        employer_password = "employer123"
        employer_user.set_password(employer_password)
        
        # Save to database
        db.session.add(employer_user)
        db.session.commit()
        
        print("✅ Employer user created successfully!")
        print(f"📧 Email: {employer_email}")
        print(f"🔑 Password: {employer_password}")
        print(f"👤 ID: {employer_user.id}")
        print(f"📛 Name: {employer_user.get_full_name()}")
        print(f"🎭 Role: {employer_user.role}")
        
        return employer_user

if __name__ == "__main__":
    try:
        employer = create_employer_user()
    except Exception as e:
        print(f"❌ Error creating employer user: {str(e)}")
        sys.exit(1)
