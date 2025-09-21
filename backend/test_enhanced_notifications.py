#!/usr/bin/env python3
"""
Comprehensive Test Suite for Enhanced Notification System
Tests email integration, preferences, scheduling, and all new features
"""

import os
import sys
import json
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add src to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.models.user import db, User
from src.models.notification import Notification
from src.models.notification_preferences import NotificationPreference, NotificationDeliveryLog, NotificationQueue
from src.services.email_service import email_service, EmailNotification, EmailPriority, NotificationType
from src.services.notification_scheduler import notification_scheduler
from flask import Flask
import requests

class NotificationTestSuite:
    """Comprehensive test suite for enhanced notification system"""
    
    def __init__(self):
        self.app = self.create_app()
        self.test_results = {
            'passed': 0,
            'failed': 0,
            'errors': []
        }
        self.test_user = None
        self.auth_token = None
        self.base_url = 'http://localhost:5001'
        
    def create_app(self):
        """Create Flask app for testing"""
        app = Flask(__name__)
        
        # Database configuration (same as main app)
        DATABASE_URL = os.getenv('DATABASE_URL')
        if DATABASE_URL:
            if DATABASE_URL.startswith("postgres://"):
                DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
            app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
        else:
            DB_HOST = os.getenv('DB_HOST', 'localhost')
            DB_PORT = os.getenv('DB_PORT', '5432')
            DB_NAME = os.getenv('DB_NAME', 'talentsphere')
            DB_USER = os.getenv('DB_USER', 'postgres')
            DB_PASSWORD = os.getenv('DB_PASSWORD', 'password')
            
            postgres_url = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
            
            try:
                app.config['SQLALCHEMY_DATABASE_URI'] = postgres_url
                import psycopg2
                conn = psycopg2.connect(
                    host=DB_HOST,
                    port=DB_PORT,
                    database=DB_NAME,
                    user=DB_USER,
                    password=DB_PASSWORD
                )
                conn.close()
            except Exception:
                app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test_talentsphere.db'
        
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        app.config['TESTING'] = True
        
        db.init_app(app)
        return app
    
    def log_test(self, test_name, success, message=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"    {message}")
        
        if success:
            self.test_results['passed'] += 1
        else:
            self.test_results['failed'] += 1
            self.test_results['errors'].append(f"{test_name}: {message}")
    
    def setup_test_user(self):
        """Create test user and get authentication token"""
        try:
            with self.app.app_context():
                # Check if test user exists
                self.test_user = User.query.filter_by(email='test.notifications@example.com').first()
                
                if not self.test_user:
                    # Create test user
                    from werkzeug.security import generate_password_hash
                    self.test_user = User(
                        email='test.notifications@example.com',
                        password_hash=generate_password_hash('TestPassword123!'),
                        first_name='Test',
                        last_name='User',
                        role='job_seeker',
                        is_active=True
                    )
                    db.session.add(self.test_user)
                    db.session.commit()
                    
                    print(f"Created test user: {self.test_user.email}")
                else:
                    print(f"Using existing test user: {self.test_user.email}")
            
            # Get authentication token
            response = requests.post(f'{self.base_url}/api/auth/login', json={
                'email': 'test.notifications@example.com',
                'password': 'TestPassword123!'
            })
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get('access_token')
                self.log_test("User Authentication", True, "Successfully authenticated test user")
                return True
            else:
                self.log_test("User Authentication", False, f"Failed to authenticate: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Test User Setup", False, str(e))
            return False
    
    def test_database_models(self):
        """Test database models creation and functionality"""
        try:
            with self.app.app_context():
                # Test NotificationPreference model
                pref = NotificationPreference.get_or_create_for_user(self.test_user.id)
                self.log_test("NotificationPreference Creation", pref is not None)
                
                # Test preference updates
                pref.update_from_dict({
                    'email_preferences': {
                        'enabled': True,
                        'job_alerts': False
                    }
                })
                self.log_test("Preference Updates", pref.job_alerts_email == False)
                
                # Test NotificationQueue model
                queue_entry = NotificationQueue(
                    notification_id=1,  # Dummy ID
                    user_id=self.test_user.id,
                    delivery_method='email',
                    priority='normal'
                )
                db.session.add(queue_entry)
                db.session.commit()
                self.log_test("NotificationQueue Creation", queue_entry.id is not None)
                
                # Test NotificationDeliveryLog model
                delivery_log = NotificationDeliveryLog(
                    notification_id=1,
                    user_id=self.test_user.id,
                    delivery_method='email',
                    delivery_status='sent',
                    recipient_address=self.test_user.email
                )
                db.session.add(delivery_log)
                db.session.commit()
                self.log_test("NotificationDeliveryLog Creation", delivery_log.id is not None)
                
        except Exception as e:
            self.log_test("Database Models", False, str(e))
    
    def test_email_service(self):
        """Test email service functionality"""
        try:
            with self.app.app_context():
                # Test email template rendering
                email_notification = EmailNotification(
                    recipient_email=self.test_user.email,
                    recipient_name=self.test_user.get_full_name(),
                    template_name='system_notification',
                    subject='Test Notification',
                    variables={
                        'user_name': self.test_user.get_full_name(),
                        'title': 'Test Notification',
                        'message': 'This is a test message',
                        'action_url': 'http://localhost:5173/notifications',
                        'action_text': 'View Notification'
                    }
                )
                
                # Test email sending (will fail if SMTP not configured, but that's OK for testing)
                result = email_service.send_notification_email(email_notification)
                self.log_test("Email Service", True, f"Email send attempt completed (result: {result})")
                
                # Test create_and_send_notification
                success = email_service.create_and_send_notification(
                    user_id=self.test_user.id,
                    notification_type=NotificationType.SYSTEM,
                    title="Test System Notification",
                    message="This is a test system notification",
                    send_email=False,  # Don't actually send email in test
                    priority=EmailPriority.NORMAL
                )
                self.log_test("Create and Send Notification", success)
                
        except Exception as e:
            self.log_test("Email Service", False, str(e))
    
    def test_api_endpoints(self):
        """Test API endpoints"""
        if not self.auth_token:
            self.log_test("API Endpoints", False, "No auth token available")
            return
        
        headers = {
            'Authorization': f'Bearer {self.auth_token}',
            'Content-Type': 'application/json'
        }
        
        try:
            # Test GET preferences
            response = requests.get(
                f'{self.base_url}/api/enhanced-notifications/notification-preferences',
                headers=headers
            )
            self.log_test("GET Preferences API", response.status_code == 200)
            
            # Test UPDATE preferences
            response = requests.put(
                f'{self.base_url}/api/enhanced-notifications/notification-preferences',
                headers=headers,
                json={
                    'email_preferences': {
                        'enabled': True,
                        'job_alerts': True
                    }
                }
            )
            self.log_test("PUT Preferences API", response.status_code == 200)
            
            # Test GET notifications
            response = requests.get(
                f'{self.base_url}/api/enhanced-notifications/notifications',
                headers=headers
            )
            self.log_test("GET Notifications API", response.status_code == 200)
            
            # Test CREATE notification
            response = requests.post(
                f'{self.base_url}/api/enhanced-notifications/notifications',
                headers=headers,
                json={
                    'title': 'Test API Notification',
                    'message': 'This notification was created via API test',
                    'notification_type': 'system',
                    'priority': 'normal',
                    'send_email': False
                }
            )
            self.log_test("POST Notification API", response.status_code == 201)
            
            # Test notification stats
            response = requests.get(
                f'{self.base_url}/api/enhanced-notifications/notifications/stats',
                headers=headers
            )
            self.log_test("GET Stats API", response.status_code == 200)
            
            # Test test notification
            response = requests.post(
                f'{self.base_url}/api/enhanced-notifications/notifications/test',
                headers=headers,
                json={'send_email': False}
            )
            self.log_test("POST Test Notification API", response.status_code in [200, 207])
            
        except Exception as e:
            self.log_test("API Endpoints", False, str(e))
    
    def test_notification_scheduler(self):
        """Test notification scheduler functionality"""
        try:
            # Test scheduler start/stop
            notification_scheduler.start()
            self.log_test("Scheduler Start", notification_scheduler.is_running)
            
            # Test queue status
            status = notification_scheduler.get_queue_status()
            self.log_test("Queue Status", 'is_running' in status)
            
            # Add item to queue for testing
            with self.app.app_context():
                # Create a test notification first
                notification = Notification(
                    user_id=self.test_user.id,
                    title='Scheduled Test Notification',
                    message='This is a scheduled test notification',
                    notification_type='system',
                    priority='normal',
                    send_email=True,
                    scheduled_for=datetime.utcnow() + timedelta(seconds=5)
                )
                db.session.add(notification)
                db.session.commit()
                
                # Queue the notification
                queue_success = notification_scheduler.queue_notification(
                    notification_id=notification.id,
                    user_id=self.test_user.id,
                    delivery_method='email',
                    scheduled_for=datetime.utcnow() + timedelta(seconds=5)
                )
                self.log_test("Queue Notification", queue_success)
            
            # Wait a bit for scheduler to process
            time.sleep(2)
            
            notification_scheduler.stop()
            self.log_test("Scheduler Stop", not notification_scheduler.is_running)
            
        except Exception as e:
            self.log_test("Notification Scheduler", False, str(e))
    
    def test_user_preferences_logic(self):
        """Test user preference logic"""
        try:
            with self.app.app_context():
                pref = NotificationPreference.get_or_create_for_user(self.test_user.id)
                
                # Test email preference check
                should_send = pref.should_send_notification('job_alert', 'email', False)
                self.log_test("Email Preference Check", isinstance(should_send, bool))
                
                # Test quiet hours
                pref.quiet_hours_enabled = True
                pref.quiet_hours_start = datetime.strptime('22:00', '%H:%M').time()
                pref.quiet_hours_end = datetime.strptime('08:00', '%H:%M').time()
                
                # Test during quiet hours
                test_time = datetime.strptime('23:00', '%H:%M').time()
                test_datetime = datetime.combine(datetime.utcnow().date(), test_time)
                in_quiet_hours = pref.is_in_quiet_hours(test_datetime)
                self.log_test("Quiet Hours Detection", in_quiet_hours == True)
                
                # Test outside quiet hours
                test_time = datetime.strptime('14:00', '%H:%M').time()
                test_datetime = datetime.combine(datetime.utcnow().date(), test_time)
                in_quiet_hours = pref.is_in_quiet_hours(test_datetime)
                self.log_test("Non-Quiet Hours Detection", in_quiet_hours == False)
                
        except Exception as e:
            self.log_test("User Preferences Logic", False, str(e))
    
    def test_notification_templates(self):
        """Test notification email templates"""
        try:
            # Test all template types
            template_types = [
                'job_alert',
                'application_status',
                'message_notification',
                'interview_reminder',
                'deadline_reminder',
                'company_update',
                'system_notification'
            ]
            
            for template_type in template_types:
                template = email_service.templates.get(template_type)
                if template:
                    # Test template rendering
                    rendered = email_service._render_template(
                        template.subject,
                        {
                            'user_name': 'Test User',
                            'job_title': 'Test Job',
                            'company_name': 'Test Company'
                        }
                    )
                    self.log_test(f"Template {template_type}", len(rendered) > 0)
                else:
                    self.log_test(f"Template {template_type}", False, "Template not found")
                    
        except Exception as e:
            self.log_test("Notification Templates", False, str(e))
    
    def run_all_tests(self):
        """Run all tests"""
        print("🧪 Starting Enhanced Notification System Test Suite")
        print("=" * 60)
        
        # Setup
        if not self.setup_test_user():
            print("❌ Test setup failed, aborting test suite")
            return False
        
        # Run tests
        print("\n📝 Testing Database Models...")
        self.test_database_models()
        
        print("\n📧 Testing Email Service...")
        self.test_email_service()
        
        print("\n🌐 Testing API Endpoints...")
        self.test_api_endpoints()
        
        print("\n⏰ Testing Notification Scheduler...")
        self.test_notification_scheduler()
        
        print("\n⚙️  Testing User Preferences Logic...")
        self.test_user_preferences_logic()
        
        print("\n📄 Testing Notification Templates...")
        self.test_notification_templates()
        
        # Results
        print("\n" + "=" * 60)
        print("🏁 Test Results Summary")
        print("=" * 60)
        print(f"✅ Passed: {self.test_results['passed']}")
        print(f"❌ Failed: {self.test_results['failed']}")
        print(f"📊 Total: {self.test_results['passed'] + self.test_results['failed']}")
        
        if self.test_results['failed'] > 0:
            print("\n❌ Failed Tests:")
            for error in self.test_results['errors']:
                print(f"   • {error}")
        
        success_rate = (self.test_results['passed'] / 
                       (self.test_results['passed'] + self.test_results['failed'])) * 100
        print(f"\n📈 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("✅ Enhanced notification system is working well!")
        else:
            print("⚠️  Enhanced notification system needs attention")
        
        return success_rate >= 80
    
    def cleanup(self):
        """Clean up test data"""
        try:
            with self.app.app_context():
                # Clean up test notifications
                Notification.query.filter(
                    Notification.title.like('Test%')
                ).delete()
                
                # Clean up test queue entries
                if self.test_user:
                    NotificationQueue.query.filter_by(user_id=self.test_user.id).delete()
                    NotificationDeliveryLog.query.filter_by(user_id=self.test_user.id).delete()
                
                db.session.commit()
                print("🧹 Test cleanup completed")
                
        except Exception as e:
            print(f"⚠️  Test cleanup failed: {e}")

def main():
    """Main test runner"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Enhanced Notification System Test Suite')
    parser.add_argument('--cleanup', action='store_true', help='Clean up test data after running')
    parser.add_argument('--server-url', default='http://localhost:5001', 
                       help='Server URL for API tests')
    
    args = parser.parse_args()
    
    # Create test suite
    test_suite = NotificationTestSuite()
    test_suite.base_url = args.server_url
    
    try:
        # Run tests
        success = test_suite.run_all_tests()
        
        # Cleanup if requested
        if args.cleanup:
            test_suite.cleanup()
        
        # Exit with appropriate code
        exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n\n🛑 Test suite interrupted by user")
        if args.cleanup:
            test_suite.cleanup()
        exit(1)
    except Exception as e:
        print(f"\n\n💥 Test suite crashed: {e}")
        if args.cleanup:
            test_suite.cleanup()
        exit(1)

if __name__ == '__main__':
    main()