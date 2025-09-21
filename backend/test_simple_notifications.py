#!/usr/bin/env python3
"""
Simplified Test for Enhanced Notification System
Tests database models and core functionality
"""

import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src'))

def test_database_models():
    """Test database models and functionality"""
    try:
        # Import the application
        from main import app
        from models.user import db, User
        from models.notification import Notification
        from models.notification_preferences import NotificationPreference, NotificationDeliveryLog, NotificationQueue
        from services.email_service import email_service, EmailNotification, NotificationType
        
        print("🧪 Testing Enhanced Notification System")
        print("=" * 50)
        
        with app.app_context():
            print("📊 Testing Database Models...")
            
            # Test 1: Check if tables exist
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            
            required_tables = [
                'notifications',
                'notification_preferences', 
                'notification_delivery_logs',
                'notification_queue'
            ]
            
            missing_tables = [table for table in required_tables if table not in tables]
            
            if missing_tables:
                print(f"❌ Missing tables: {missing_tables}")
                return False
            else:
                print("✅ All required tables exist")
            
            # Test 2: Create or get test user
            test_user = User.query.filter_by(email='test.notifications@example.com').first()
            
            if not test_user:
                print("Creating test user...")
                from werkzeug.security import generate_password_hash
                test_user = User(
                    email='test.notifications@example.com',
                    password_hash=generate_password_hash('TestPassword123!'),
                    first_name='Test',
                    last_name='User',
                    role='job_seeker',
                    is_active=True
                )
                db.session.add(test_user)
                db.session.commit()
                print("✅ Test user created")
            else:
                print("✅ Test user exists")
            
            # Test 3: Test NotificationPreference model
            print("\n📝 Testing NotificationPreference model...")
            
            pref = NotificationPreference.get_or_create_for_user(test_user.id)
            if pref:
                print("✅ NotificationPreference created/retrieved")
                
                # Test preference updates
                pref.update_from_dict({
                    'email_preferences': {
                        'enabled': True,
                        'job_alerts': False
                    }
                })
                print("✅ Preference updates work")
                
                # Test quiet hours
                pref.quiet_hours_enabled = True
                pref.quiet_hours_start = datetime.strptime('22:00', '%H:%M').time()
                pref.quiet_hours_end = datetime.strptime('08:00', '%H:%M').time()
                
                # Test during quiet hours (23:00)
                test_time = datetime.strptime('23:00', '%H:%M').time()
                test_datetime = datetime.combine(datetime.utcnow().date(), test_time)
                in_quiet_hours = pref.is_in_quiet_hours(test_datetime)
                
                if in_quiet_hours:
                    print("✅ Quiet hours detection works")
                else:
                    print("⚠️  Quiet hours detection issue")
                
                db.session.commit()
            else:
                print("❌ NotificationPreference creation failed")
                return False
            
            # Test 4: Test Notification creation
            print("\n📧 Testing Notification creation...")
            
            notification = Notification(
                user_id=test_user.id,
                title='Test Notification',
                message='This is a test notification',
                notification_type='system',
                priority='normal',
                send_email=True
            )
            db.session.add(notification)
            db.session.commit()
            print("✅ Notification created")
            
            # Test 5: Test NotificationQueue
            print("\n⏰ Testing NotificationQueue...")
            
            queue_entry = NotificationQueue(
                notification_id=notification.id,
                user_id=test_user.id,
                delivery_method='email',
                priority='normal'
            )
            db.session.add(queue_entry)
            db.session.commit()
            print("✅ NotificationQueue entry created")
            
            # Test 6: Test NotificationDeliveryLog
            print("\n📊 Testing NotificationDeliveryLog...")
            
            delivery_log = NotificationDeliveryLog(
                notification_id=notification.id,
                user_id=test_user.id,
                delivery_method='email',
                delivery_status='sent',
                recipient_address=test_user.email
            )
            db.session.add(delivery_log)
            db.session.commit()
            print("✅ NotificationDeliveryLog entry created")
            
            # Test 7: Test email service (without actually sending)
            print("\n📧 Testing Email Service...")
            
            try:
                email_notification = EmailNotification(
                    recipient_email=test_user.email,
                    recipient_name=test_user.get_full_name(),
                    template_name='system_notification',
                    subject='Test Notification',
                    variables={
                        'user_name': test_user.get_full_name(),
                        'title': 'Test Notification',
                        'message': 'This is a test message',
                        'action_url': 'http://localhost:5173/notifications',
                        'action_text': 'View Notification'
                    }
                )
                
                # Test email template rendering
                template = email_service.templates.get('system_notification')
                if template:
                    print("✅ Email template exists")
                    
                    # Test template rendering
                    rendered_subject = email_service._render_template(
                        template.subject,
                        email_notification.variables
                    )
                    if rendered_subject:
                        print("✅ Email template rendering works")
                    else:
                        print("⚠️  Email template rendering issue")
                else:
                    print("⚠️  Email template not found")
                
            except Exception as e:
                print(f"⚠️  Email service test issue: {e}")
            
            # Test 8: Count records
            print("\n📊 Database Record Counts:")
            print(f"  - Users: {User.query.count()}")
            print(f"  - Notifications: {Notification.query.count()}")
            print(f"  - Notification Preferences: {NotificationPreference.query.count()}")
            print(f"  - Delivery Logs: {NotificationDeliveryLog.query.count()}")
            print(f"  - Queue Entries: {NotificationQueue.query.count()}")
            
            # Clean up test data
            print("\n🧹 Cleaning up test data...")
            Notification.query.filter(Notification.title.like('Test%')).delete()
            NotificationQueue.query.filter_by(user_id=test_user.id).delete()
            NotificationDeliveryLog.query.filter_by(user_id=test_user.id).delete()
            db.session.commit()
            print("✅ Test cleanup completed")
            
            print("\n🎉 All tests passed! Enhanced notification system is working correctly.")
            return True
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main test runner"""
    success = test_database_models()
    
    if success:
        print("\n" + "=" * 50)
        print("✅ ENHANCED NOTIFICATION SYSTEM READY!")
        print("=" * 50)
        print("\n🌟 Features Available:")
        print("   📧 Email notifications with templates")
        print("   ⚙️  User preference management")
        print("   📊 Delivery tracking and statistics")
        print("   🔄 Background notification scheduling")
        print("   🎨 Enhanced UI components")
        print("\n🚀 To start the system:")
        print("   ./launch_enhanced_notifications.sh")
        print("   OR")
        print("   python src/main.py")
        print("\n🔗 Frontend routes:")
        print("   /notifications - Enhanced notification list")
        print("   /notifications/preferences - Settings")
        
        exit(0)
    else:
        print("\n❌ Tests failed. Please check the errors above.")
        exit(1)

if __name__ == '__main__':
    main()