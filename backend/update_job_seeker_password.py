#!/usr/bin/env python3

import sys
import os

# Add the src directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.models.user import User, db
from src.main import app
from werkzeug.security import generate_password_hash

def update_job_seeker_password():
    with app.app_context():
        # Find the job seeker user
        user = User.query.filter_by(email='jobseeker@example.com').first()
        if user:
            # Update password
            user.password_hash = generate_password_hash('jobseeker123')
            db.session.commit()
            print(f"✅ Updated password for user: {user.email}")
        else:
            print("❌ Job seeker user not found")

if __name__ == '__main__':
    update_job_seeker_password()
