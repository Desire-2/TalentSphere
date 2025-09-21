#!/usr/bin/env python3
"""
Sample Notifications Generator for TalentSphere
Creates various types of notifications for testing the enhanced notification system
"""

import os
import sys
from datetime import datetime, timedelta, timezone
import random
import json

# Add the backend src directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.join(backend_dir, 'src')
sys.path.append(src_dir)

# Import Flask app and database
from src.main import app
from src.models.user import db
from src.models.notification import Notification
from src.models.user import User

def create_sample_notifications():
    """Create diverse sample notifications for testing"""
    
    with app.app_context():
        print("🔄 Creating sample notifications...")
        
        # Get some users to assign notifications to
        users = User.query.limit(5).all()
        if not users:
            print("❌ No users found! Please create some users first.")
            return
        
        print(f"📝 Found {len(users)} users to create notifications for")
        
        # Sample notification data
        notifications_data = [
            # Job Alerts
            {
                'title': 'New Job Match: Senior Software Engineer',
                'message': 'A new job matching your profile has been posted: Senior Software Engineer at TechCorp Inc. Location: San Francisco, CA. Salary: $120,000 - $180,000',
                'notification_type': 'job_alert',
                'priority': 'high',
                'category': 'jobs',
                'data': {
                    'job_id': 1,
                    'company': 'TechCorp Inc',
                    'location': 'San Francisco, CA',
                    'salary_range': '$120,000 - $180,000'
                }
            },
            {
                'title': 'Weekly Job Digest',
                'message': '15 new jobs matching your criteria have been posted this week. Check out opportunities in Software Development, Data Science, and Product Management.',
                'notification_type': 'job_alert',
                'priority': 'normal',
                'category': 'jobs',
                'data': {
                    'job_count': 15,
                    'categories': ['Software Development', 'Data Science', 'Product Management']
                }
            },
            
            # Application Status Updates
            {
                'title': 'Application Update: Frontend Developer Position',
                'message': 'Your application for Frontend Developer at WebFlow Studios has been reviewed and moved to the next stage. Expect to hear from HR within 2-3 business days.',
                'notification_type': 'application_status',
                'priority': 'high',
                'category': 'applications',
                'data': {
                    'application_id': 1,
                    'company': 'WebFlow Studios',
                    'position': 'Frontend Developer',
                    'status': 'under_review'
                }
            },
            {
                'title': 'Application Submitted Successfully',
                'message': 'Your application for Product Manager at StartupXYZ has been submitted successfully. Application ID: #APP-2024-001',
                'notification_type': 'application_status',
                'priority': 'normal',
                'category': 'applications',
                'data': {
                    'application_id': 2,
                    'company': 'StartupXYZ',
                    'position': 'Product Manager',
                    'confirmation_id': 'APP-2024-001'
                }
            },
            
            # Interview Reminders
            {
                'title': 'Interview Reminder: Tomorrow at 2:00 PM',
                'message': 'You have an interview scheduled tomorrow (September 22, 2025) at 2:00 PM with DataTech Solutions for the Data Analyst position. Meeting link: https://meet.google.com/abc-defg-hij',
                'notification_type': 'interview_reminder',
                'priority': 'urgent',
                'category': 'interviews',
                'data': {
                    'interview_date': '2025-09-22',
                    'interview_time': '14:00',
                    'company': 'DataTech Solutions',
                    'position': 'Data Analyst',
                    'meeting_link': 'https://meet.google.com/abc-defg-hij'
                }
            },
            {
                'title': 'Interview Scheduled: ML Engineer Position',
                'message': 'Great news! Your interview for Machine Learning Engineer at AI Innovations has been scheduled for September 25, 2025 at 10:00 AM. Please prepare for technical questions about deep learning and Python.',
                'notification_type': 'interview_reminder',
                'priority': 'high',
                'category': 'interviews',
                'data': {
                    'interview_date': '2025-09-25',
                    'interview_time': '10:00',
                    'company': 'AI Innovations',
                    'position': 'Machine Learning Engineer'
                }
            },
            
            # Messages
            {
                'title': 'New Message from TechCorp Recruiter',
                'message': 'Sarah Johnson from TechCorp has sent you a message regarding the Senior Software Engineer position. "Hi, I\'d like to discuss the opportunity further. Are you available for a quick call this week?"',
                'notification_type': 'message',
                'priority': 'high',
                'category': 'messages',
                'data': {
                    'sender': 'Sarah Johnson',
                    'company': 'TechCorp',
                    'message_id': 'msg_001'
                }
            },
            {
                'title': 'Connection Request from LinkedIn',
                'message': 'Michael Chen, HR Director at InnovateLabs, wants to connect with you on LinkedIn. He mentioned: "Impressed with your background in React development."',
                'notification_type': 'message',
                'priority': 'normal',
                'category': 'networking',
                'data': {
                    'sender': 'Michael Chen',
                    'company': 'InnovateLabs',
                    'platform': 'LinkedIn'
                }
            },
            
            # Company Updates
            {
                'title': 'TechCorp Inc. Company Update',
                'message': 'TechCorp Inc. has updated their company profile and added 5 new job openings. They are now hiring for remote positions and offering competitive benefits package.',
                'notification_type': 'company_update',
                'priority': 'normal',
                'category': 'companies',
                'data': {
                    'company': 'TechCorp Inc',
                    'new_jobs': 5,
                    'updates': ['remote positions', 'benefits package']
                }
            },
            
            # Deadline Reminders
            {
                'title': 'Application Deadline Tomorrow',
                'message': 'Reminder: The application deadline for Senior UX Designer at DesignHub is tomorrow (September 22, 2025). Don\'t miss this opportunity!',
                'notification_type': 'deadline_reminder',
                'priority': 'urgent',
                'category': 'deadlines',
                'data': {
                    'deadline_date': '2025-09-22',
                    'position': 'Senior UX Designer',
                    'company': 'DesignHub'
                }
            },
            
            # System Notifications
            {
                'title': 'Profile Completeness: 85%',
                'message': 'Your profile is 85% complete. Add your portfolio projects and certifications to increase your visibility to employers.',
                'notification_type': 'system',
                'priority': 'low',
                'category': 'profile',
                'data': {
                    'completion_percentage': 85,
                    'missing_sections': ['portfolio', 'certifications']
                }
            },
            {
                'title': 'Weekly Activity Summary',
                'message': 'This week you applied to 3 jobs, received 2 profile views, and got 1 interview invitation. Keep up the great work!',
                'notification_type': 'system',
                'priority': 'low',
                'category': 'analytics',
                'data': {
                    'applications_count': 3,
                    'profile_views': 2,
                    'interview_invitations': 1
                }
            },
            
            # Promotion/Featured
            {
                'title': 'Featured Job Opportunity',
                'message': 'Exclusive opportunity: Principal Engineer at MegaTech Corp is looking for someone with your skills. This position offers $200K+ salary and equity options.',
                'notification_type': 'promotion',
                'priority': 'high',
                'category': 'featured',
                'data': {
                    'company': 'MegaTech Corp',
                    'position': 'Principal Engineer',
                    'salary': '$200K+',
                    'benefits': ['equity options']
                }
            }
        ]
        
        # Create notifications for each user
        created_count = 0
        for user in users:
            # Each user gets 3-5 random notifications
            user_notifications = random.sample(notifications_data, random.randint(3, 5))
            
            for i, notif_data in enumerate(user_notifications):
                # Create notification with slight time variations
                created_at = datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 72))
                
                notification = Notification(
                    user_id=user.id,
                    title=notif_data['title'],
                    message=notif_data['message'],
                    notification_type=notif_data['notification_type'],
                    priority=notif_data['priority'],
                    data=json.dumps(notif_data.get('data', {})),  # Convert to JSON string
                    created_at=created_at,
                    is_read=random.choice([True, False, False]),  # Most notifications unread
                    send_email=random.choice([True, False]),
                    is_sent=random.choice([True, False])
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
            print(f"✅ Successfully created {created_count} sample notifications!")
            
            # Print summary statistics
            total_notifications = Notification.query.count()
            unread_count = Notification.query.filter_by(is_read=False).count()
            
            print(f"\n📊 Notification Statistics:")
            print(f"   Total notifications: {total_notifications}")
            print(f"   Unread notifications: {unread_count}")
            print(f"   Read notifications: {total_notifications - unread_count}")
            
            # Show breakdown by type
            print(f"\n📋 Breakdown by type:")
            for notif_type in ['job_alert', 'application_status', 'interview_reminder', 'message', 'company_update', 'deadline_reminder', 'system', 'promotion']:
                count = Notification.query.filter_by(notification_type=notif_type).count()
                if count > 0:
                    print(f"   {notif_type}: {count}")
            
        except Exception as e:
            print(f"❌ Error committing notifications: {e}")
            db.session.rollback()

def clear_existing_notifications():
    """Clear existing notifications (optional)"""
    
    with app.app_context():
        try:
            count = Notification.query.count()
            if count > 0:
                response = input(f"Found {count} existing notifications. Clear them? (y/N): ")
                if response.lower() == 'y':
                    Notification.query.delete()
                    db.session.commit()
                    print(f"✅ Cleared {count} existing notifications")
        except Exception as e:
            print(f"❌ Error clearing notifications: {e}")

if __name__ == "__main__":
    print("🚀 TalentSphere Sample Notifications Generator")
    print("=" * 50)
    
    # Check if we should clear existing notifications
    if len(sys.argv) > 1 and sys.argv[1] == '--clear':
        clear_existing_notifications()
    
    # Create sample notifications
    create_sample_notifications()
    
    print("\n🎉 Sample notifications created successfully!")
    print("💡 You can now test the enhanced notification system in the frontend.")
    print("🔗 Visit: http://localhost:5175/notifications")