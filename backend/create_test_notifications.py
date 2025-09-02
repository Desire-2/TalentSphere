#!/usr/bin/env python3

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.models.user import db, User
from src.models.notification import Notification
from src.main import app
from datetime import datetime

def create_test_notifications():
    """Create test notifications for the employer user"""
    with app.app_context():
        # Find the test employer user
        employer = User.query.filter_by(email='employer@test.com').first()
        if not employer:
            print("❌ Test employer not found. Please run setup_test_data.py first")
            return
        
        # Check if notifications already exist
        existing = Notification.query.filter_by(user_id=employer.id).count()
        if existing > 0:
            print(f"ℹ️  User already has {existing} notifications")
        
        # Create sample notifications
        notifications = [
            {
                'user_id': employer.id,
                'notification_type': 'system',
                'title': 'Welcome to TalentSphere!',
                'message': 'Your account has been successfully set up. Start exploring our features and posting jobs.',
                'priority': 'normal',
                'is_read': False
            },
            {
                'user_id': employer.id,
                'notification_type': 'system',
                'title': 'Profile Setup Complete',
                'message': 'Your employer profile is ready. You can now start posting jobs and reviewing applications.',
                'priority': 'normal',
                'is_read': False
            },
            {
                'user_id': employer.id,
                'notification_type': 'company',
                'title': 'Company Verification Pending',
                'message': 'Your company information is under review. We\'ll notify you once the verification is complete.',
                'priority': 'high',
                'is_read': False
            },
            {
                'user_id': employer.id,
                'notification_type': 'promotion',
                'title': 'Boost Your Job Posts',
                'message': 'Upgrade to premium to get 3x more visibility for your job postings.',
                'priority': 'low',
                'is_read': True,  # One read notification for testing
                'action_url': '/pricing'
            }
        ]
        
        created_count = 0
        for notif_data in notifications:
            notification = Notification(**notif_data)
            db.session.add(notification)
            created_count += 1
        
        db.session.commit()
        
        print(f"✅ Created {created_count} test notifications for {employer.email}")
        
        # Show unread count
        unread_count = Notification.query.filter_by(user_id=employer.id, is_read=False).count()
        print(f"📬 Unread notifications: {unread_count}")

if __name__ == '__main__':
    create_test_notifications()
