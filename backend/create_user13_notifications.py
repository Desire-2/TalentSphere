#!/usr/bin/env python3
"""
Create specific notifications for user ID 13 (biodiversitynexus@yahoo.com)
"""

import os
import sys
from datetime import datetime, timedelta, timezone
import json

# Add the backend src directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.join(backend_dir, 'src')
sys.path.append(src_dir)

# Import Flask app and database
from src.main import app
from src.models.user import db
from src.models.notification import Notification

def create_notifications_for_user13():
    """Create notifications specifically for user ID 13"""
    
    with app.app_context():
        print("🔄 Creating notifications for user ID 13...")
        
        # Sample notifications for the specific user
        notifications_data = [
            {
                'title': 'Welcome to TalentSphere!',
                'message': 'Welcome to TalentSphere! Your employer account has been set up successfully. You can now start posting jobs and finding great candidates.',
                'notification_type': 'system',
                'priority': 'normal'
            },
            {
                'title': 'New Job Application Received',
                'message': 'You have received a new job application for your Software Engineer position. The candidate has 5+ years of experience in React and Node.js.',
                'notification_type': 'application_status',
                'priority': 'high'
            },
            {
                'title': 'Profile Views Update',
                'message': 'Your company profile has been viewed 15 times this week. Consider updating your company description to attract more talent.',
                'notification_type': 'system',
                'priority': 'low'
            },
            {
                'title': 'Featured Job Promotion Available',
                'message': 'Boost your job listing visibility! Promote your Senior Developer position to reach 3x more qualified candidates.',
                'notification_type': 'promotion',
                'priority': 'normal'
            },
            {
                'title': 'Interview Reminder',
                'message': 'Don\'t forget: You have an interview scheduled tomorrow at 2:00 PM with Sarah Johnson for the Frontend Developer position.',
                'notification_type': 'interview_reminder',
                'priority': 'urgent'
            },
            {
                'title': 'New Message from Candidate',
                'message': 'John Smith has sent you a message regarding the Full Stack Developer position. "Thank you for considering my application. I\'d love to discuss the role further."',
                'notification_type': 'message',
                'priority': 'high'
            },
            {
                'title': 'Job Posting Expires Soon',
                'message': 'Your job posting for "Marketing Manager" will expire in 3 days. Would you like to extend or repost it?',
                'notification_type': 'deadline_reminder',
                'priority': 'high'
            },
            {
                'title': 'Weekly Analytics Report',
                'message': 'Your weekly report is ready! This week: 25 job views, 8 applications received, 3 interviews scheduled. Your most popular position: Senior Software Engineer.',
                'notification_type': 'system',
                'priority': 'low'
            }
        ]
        
        user_id = 13
        created_count = 0
        
        for i, notif_data in enumerate(notifications_data):
            # Create notification with slight time variations
            hours_ago = [1, 2, 6, 12, 24, 48, 72, 96][i] if i < 8 else i * 12
            created_at = datetime.now(timezone.utc) - timedelta(hours=hours_ago)
            
            notification = Notification(
                user_id=user_id,
                title=notif_data['title'],
                message=notif_data['message'],
                notification_type=notif_data['notification_type'],
                priority=notif_data['priority'],
                data=json.dumps({}),
                created_at=created_at,
                is_read=i > 5,  # First 6 notifications are unread
                send_email=i < 4,  # First 4 have email enabled
                is_sent=i < 3  # First 3 are marked as sent
            )
            
            try:
                db.session.add(notification)
                created_count += 1
            except Exception as e:
                print(f"❌ Error creating notification: {e}")
                continue
        
        # Commit all notifications
        try:
            db.session.commit()
            print(f"✅ Successfully created {created_count} notifications for user ID 13!")
            
            # Print summary
            user_notifications = Notification.query.filter_by(user_id=user_id).all()
            unread_count = len([n for n in user_notifications if not n.is_read])
            
            print(f"\n📊 User ID 13 Notification Statistics:")
            print(f"   Total notifications: {len(user_notifications)}")
            print(f"   Unread notifications: {unread_count}")
            print(f"   Read notifications: {len(user_notifications) - unread_count}")
            
        except Exception as e:
            print(f"❌ Error committing notifications: {e}")
            db.session.rollback()

if __name__ == "__main__":
    print("🚀 Creating Notifications for User ID 13")
    print("=" * 50)
    create_notifications_for_user13()
    print("\n🎉 Notifications created successfully!")
    print("💡 You can now test the enhanced notification system.")