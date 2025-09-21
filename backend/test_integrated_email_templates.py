"""
Comprehensive test script for integrated email notification system
Tests all HTML email templates with real notification data
"""

import sys
import os
import json
from datetime import datetime, timedelta

# Add src directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

from services.notification_templates import EnhancedNotificationService, NotificationTemplateHandler
from services.email_service import EmailService, EmailNotification, EmailPriority
from models.user import User, db
from models.job import Job
from models.application import Application

def create_test_user():
    """Create a test user for email testing"""
    test_user = User(
        email="biodiversitynexus@yahoo.com",
        first_name="John",
        last_name="Doe",
        role="job_seeker",
        is_active=True,
        created_at=datetime.utcnow()
    )
    return test_user

def create_test_job():
    """Create a test job for email testing"""
    test_job = Job(
        id=1,
        title="Senior Software Engineer",
        company_name="TechCorp Inc.",
        description="We are looking for a passionate Senior Software Engineer to join our growing team. You will be responsible for developing scalable web applications and working with cutting-edge technologies.",
        location="San Francisco, CA",
        job_type="full_time",
        experience_level="senior",
        salary_range="$120,000 - $180,000",
        skills_required="Python, React, PostgreSQL, AWS, Docker",
        benefits="Health Insurance, Dental, Vision, 401k, Remote Work",
        application_deadline=datetime.utcnow() + timedelta(days=30),
        status="published",
        is_active=True,
        created_at=datetime.utcnow()
    )
    return test_job

def create_test_application(user, job):
    """Create a test application for email testing"""
    test_application = Application(
        id=1,
        job_id=job.id,
        applicant_id=user.id,
        job=job,
        applicant=user,
        status="submitted",
        applied_at=datetime.utcnow(),
        created_at=datetime.utcnow()
    )
    return test_application

def test_job_alert_template():
    """Test job alert email template"""
    print("\n🎯 Testing Job Alert Template...")
    
    try:
        email_service = EmailService()
        enhanced_service = EnhancedNotificationService(email_service)
        
        # Create test data
        user = create_test_user()
        job = create_test_job()
        
        # Prepare template data
        template_data = NotificationTemplateHandler.prepare_job_alert_data(
            user, job, frontend_url='https://talentsphere.com'
        )
        
        # Create email notification
        notification = EmailNotification(
            recipient_email="biodiversitynexus@yahoo.com",
            recipient_name="John Doe",
            template_name="job_alert",
            subject=f"🎯 New Job Alert: {job.title}",
            variables=template_data,
            priority=EmailPriority.NORMAL
        )
        
        # Send email
        success = email_service.send_notification_email(notification)
        
        if success:
            print("✅ Job alert template test passed")
            print(f"   📧 Sent to: {notification.recipient_email}")
            print(f"   📝 Job: {job.title} at {job.company_name}")
            return True
        else:
            print("❌ Job alert template test failed")
            return False
            
    except Exception as e:
        print(f"❌ Job alert template error: {e}")
        return False

def test_application_status_template():
    """Test application status email template"""
    print("\n📋 Testing Application Status Template...")
    
    try:
        email_service = EmailService()
        
        # Create test data
        user = create_test_user()
        job = create_test_job()
        application = create_test_application(user, job)
        
        # Test different status updates
        statuses = ['submitted', 'under_review', 'shortlisted', 'hired']
        
        for status in statuses:
            print(f"   Testing status: {status}")
            
            # Prepare template data
            template_data = NotificationTemplateHandler.prepare_application_status_data(
                user, application, status, frontend_url='https://talentsphere.com'
            )
            
            # Create email notification
            notification = EmailNotification(
                recipient_email="biodiversitynexus@yahoo.com",
                recipient_name="John Doe",
                template_name="application_status",
                subject=f"📋 Application Update: {status.replace('_', ' ').title()}",
                variables=template_data,
                priority=EmailPriority.NORMAL
            )
            
            # Send email
            success = email_service.send_notification_email(notification)
            
            if success:
                print(f"   ✅ Status '{status}' email sent successfully")
            else:
                print(f"   ❌ Status '{status}' email failed")
                return False
        
        print("✅ Application status template test passed")
        return True
        
    except Exception as e:
        print(f"❌ Application status template error: {e}")
        return False

def test_interview_reminder_template():
    """Test interview reminder email template"""
    print("\n⏰ Testing Interview Reminder Template...")
    
    try:
        email_service = EmailService()
        
        # Create test data
        user = create_test_user()
        
        interview_data = {
            'job_title': 'Senior Software Engineer',
            'company_name': 'TechCorp Inc.',
            'interview_date': (datetime.now() + timedelta(days=2)).isoformat(),
            'interview_type': 'Video Call',
            'duration': '1 hour',
            'meeting_link': 'https://zoom.us/j/123456789',
            'interviewer_name': 'Sarah Johnson',
            'interviewer_email': 'sarah@techcorp.com',
            'location': 'Online',
            'documents_needed': ['Resume', 'Portfolio', 'References'],
            'special_instructions': 'Please test your camera and microphone before the interview.'
        }
        
        # Prepare template data
        template_data = NotificationTemplateHandler.prepare_interview_reminder_data(
            user, interview_data, frontend_url='https://talentsphere.com'
        )
        
        # Create email notification
        notification = EmailNotification(
            recipient_email="biodiversitynexus@yahoo.com",
            recipient_name="John Doe",
            template_name="interview_reminder",
            subject="⏰ Interview Reminder: Senior Software Engineer",
            variables=template_data,
            priority=EmailPriority.HIGH
        )
        
        # Send email
        success = email_service.send_notification_email(notification)
        
        if success:
            print("✅ Interview reminder template test passed")
            print(f"   📅 Interview: {interview_data['interview_date']}")
            print(f"   🔗 Meeting: {interview_data['meeting_link']}")
            return True
        else:
            print("❌ Interview reminder template test failed")
            return False
            
    except Exception as e:
        print(f"❌ Interview reminder template error: {e}")
        return False

def test_system_notification_template():
    """Test system notification email template"""
    print("\n🔔 Testing System Notification Template...")
    
    try:
        email_service = EmailService()
        
        # Create test data
        user = create_test_user()
        
        system_data = {
            'title': 'Profile Completion Reminder',
            'message': 'Your profile is 75% complete. Add more information to get better job matches!',
            'type': 'profile_reminder',
            'profile_completion': 75,
            'applications_sent': 8,
            'messages_unread': 3,
            'jobs_saved': 12,
            'recommendations': [
                'Upload a professional profile photo',
                'Add more skills to your profile',
                'Complete your work experience section'
            ],
            'recent_activity': [
                'Applied to 2 new jobs this week',
                'Received 1 message from recruiters',
                'Profile viewed by 5 employers'
            ]
        }
        
        # Prepare template data
        template_data = NotificationTemplateHandler.prepare_system_data(
            user, system_data, frontend_url='https://talentsphere.com'
        )
        
        # Create email notification
        notification = EmailNotification(
            recipient_email="biodiversitynexus@yahoo.com",
            recipient_name="John Doe",
            template_name="system",
            subject="🔔 TalentSphere: Profile Completion Reminder",
            variables=template_data,
            priority=EmailPriority.NORMAL
        )
        
        # Send email
        success = email_service.send_notification_email(notification)
        
        if success:
            print("✅ System notification template test passed")
            print(f"   📊 Profile completion: {system_data['profile_completion']}%")
            print(f"   📧 Applications sent: {system_data['applications_sent']}")
            return True
        else:
            print("❌ System notification template test failed")
            return False
            
    except Exception as e:
        print(f"❌ System notification template error: {e}")
        return False

def test_welcome_email_template():
    """Test welcome email template"""
    print("\n🎉 Testing Welcome Email Template...")
    
    try:
        email_service = EmailService()
        
        # Create test data
        user = create_test_user()
        
        # Prepare template data
        template_data = NotificationTemplateHandler.prepare_welcome_data(
            user, frontend_url='https://talentsphere.com'
        )
        
        # Create email notification
        notification = EmailNotification(
            recipient_email="biodiversitynexus@yahoo.com",
            recipient_name="John Doe",
            template_name="welcome",
            subject="🎉 Welcome to TalentSphere, John!",
            variables=template_data,
            priority=EmailPriority.NORMAL
        )
        
        # Send email
        success = email_service.send_notification_email(notification)
        
        if success:
            print("✅ Welcome email template test passed")
            print(f"   👋 Welcome: {user.get_full_name()}")
            print(f"   📧 Email: {user.email}")
            return True
        else:
            print("❌ Welcome email template test failed")
            return False
            
    except Exception as e:
        print(f"❌ Welcome email template error: {e}")
        return False

def test_all_templates():
    """Run all template tests"""
    print("🚀 Testing Integrated Email Notification System")
    print("=" * 60)
    
    results = {}
    
    # Test each template
    results['job_alert'] = test_job_alert_template()
    results['application_status'] = test_application_status_template()
    results['interview_reminder'] = test_interview_reminder_template()
    results['system_notification'] = test_system_notification_template()
    results['welcome_email'] = test_welcome_email_template()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Results Summary:")
    print("-" * 30)
    
    passed = 0
    total = len(results)
    
    for template_name, success in results.items():
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{template_name.replace('_', ' ').title():.<25} {status}")
        if success:
            passed += 1
    
    print("-" * 30)
    print(f"Total: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All email templates are working perfectly!")
        print("📧 Check your inbox: biodiversitynexus@yahoo.com")
    else:
        print(f"\n⚠️  {total - passed} templates need attention")
    
    return passed == total

if __name__ == "__main__":
    test_all_templates()