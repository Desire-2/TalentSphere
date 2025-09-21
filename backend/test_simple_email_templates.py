"""
Simple test script for integrated email notification system
Tests all HTML email templates with mock data
"""

import sys
import os
from datetime import datetime, timedelta

# Add src directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

from services.email_service import EmailService, EmailNotification, EmailPriority

class MockUser:
    def __init__(self):
        self.id = 1
        self.first_name = "John"
        self.last_name = "Doe"
        self.email = "biodiversitynexus@yahoo.com"
        self.role = "job_seeker"
        self.created_at = datetime.utcnow()
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

class MockJob:
    def __init__(self):
        self.id = 1
        self.title = "Senior Software Engineer"
        self.company_name = "TechCorp Inc."
        self.description = "Join our innovative team to build next-generation software solutions."
        self.location = "San Francisco, CA"
        self.job_type = "full_time"
        self.experience_level = "senior"
        self.salary_range = "$120,000 - $180,000"
        self.skills_required = "Python, React, PostgreSQL, AWS, Docker"
        self.benefits = "Health Insurance, Dental, Vision, 401k, Remote Work"
        self.created_at = datetime.utcnow()

class MockApplication:
    def __init__(self, user, job):
        self.id = 1
        self.job_id = job.id
        self.applicant_id = user.id
        self.job = job
        self.applicant = user
        self.status = "submitted"
        self.applied_at = datetime.utcnow()

def test_job_alert_template():
    """Test job alert email template"""
    print("\n🎯 Testing Job Alert Template...")
    
    try:
        email_service = EmailService()
        
        # Create mock data
        user = MockUser()
        job = MockJob()
        
        # Prepare template data
        template_data = {
            'user_name': user.get_full_name(),
            'job_title': job.title,
            'company_name': job.company_name,
            'location': job.location,
            'job_type': job.job_type.replace('_', ' ').title(),
            'experience_level': job.experience_level.title(),
            'salary_range': job.salary_range,
            'job_url': f"https://talentsphere.com/jobs/{job.id}",
            'job_description': job.description,
            'skills_required': job.skills_required.split(',')[:5],
            'benefits': job.benefits.split(',')[:3],
            'posted_date': job.created_at.strftime('%B %d, %Y')
        }
        
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
        
        # Create mock data
        user = MockUser()
        job = MockJob()
        application = MockApplication(user, job)
        
        # Test different status updates
        statuses = ['submitted', 'under_review', 'shortlisted', 'hired']
        
        for status in statuses:
            print(f"   Testing status: {status}")
            
            # Status progress calculation
            status_steps = ['submitted', 'under_review', 'shortlisted', 'interview_scheduled', 'hired']
            current_step = status_steps.index(status) if status in status_steps else 0
            progress_percentage = ((current_step + 1) / len(status_steps)) * 100
            
            # Prepare template data
            template_data = {
                'user_name': user.get_full_name(),
                'job_title': job.title,
                'company_name': job.company_name,
                'application_date': application.applied_at.strftime('%B %d, %Y'),
                'status': status.replace('_', ' ').title(),
                'progress_percentage': progress_percentage,
                'current_step': current_step + 1,
                'total_steps': len(status_steps),
                'application_url': f"https://talentsphere.com/applications/{application.id}",
                'job_url': f"https://talentsphere.com/jobs/{job.id}",
                'is_positive': status in ['shortlisted', 'interview_scheduled', 'hired'],
                'next_step': 'Check your dashboard for next steps.' if status != 'hired' else 'Welcome to the team!'
            }
            
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
        
        # Create mock data
        user = MockUser()
        
        interview_date = datetime.now() + timedelta(days=2)
        time_until = interview_date - datetime.now()
        hours_until = int(time_until.total_seconds() / 3600)
        
        template_data = {
            'user_name': user.get_full_name(),
            'job_title': 'Senior Software Engineer',
            'company_name': 'TechCorp Inc.',
            'interview_date': interview_date.strftime('%B %d, %Y'),
            'interview_time': interview_date.strftime('%I:%M %p'),
            'interview_type': 'Video Call',
            'duration': '1 hour',
            'meeting_link': 'https://zoom.us/j/123456789',
            'interviewer_name': 'Sarah Johnson',
            'interviewer_email': 'sarah@techcorp.com',
            'location': 'Online',
            'hours_until': hours_until,
            'is_urgent': hours_until <= 24,
            'preparation_tips': [
                'Review the job description and company information',
                'Prepare examples of your relevant experience',
                'Test your internet connection and video setup',
                'Prepare thoughtful questions about the role'
            ],
            'documents_needed': ['Resume', 'Portfolio', 'References'],
            'special_instructions': 'Please test your camera and microphone before the interview.'
        }
        
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
            print(f"   📅 Interview: {template_data['interview_date']}")
            print(f"   🔗 Meeting: {template_data['meeting_link']}")
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
        
        # Create mock data
        user = MockUser()
        
        template_data = {
            'user_name': user.get_full_name(),
            'title': 'Profile Completion Reminder',
            'message': 'Your profile is 75% complete. Add more information to get better job matches!',
            'notification_type': 'profile_reminder',
            'stats': {
                'profile_completion': 75,
                'applications_sent': 8,
                'messages_unread': 3,
                'jobs_saved': 12
            },
            'recommendations': [
                'Upload a professional profile photo',
                'Add more skills to your profile',
                'Complete your work experience section'
            ],
            'recent_activity': [
                'Applied to 2 new jobs this week',
                'Received 1 message from recruiters',
                'Profile viewed by 5 employers'
            ],
            'action_url': 'https://talentsphere.com/dashboard',
            'action_text': 'Visit Dashboard'
        }
        
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
            print(f"   📊 Profile completion: {template_data['stats']['profile_completion']}%")
            print(f"   📧 Applications sent: {template_data['stats']['applications_sent']}")
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
        
        # Create mock data
        user = MockUser()
        
        template_data = {
            'user_name': user.get_full_name(),
            'user_email': user.email,
            'user_role': user.role.replace('_', ' ').title(),
            'registration_date': user.created_at.strftime('%B %d, %Y'),
            'dashboard_url': 'https://talentsphere.com/dashboard',
            'profile_url': 'https://talentsphere.com/profile',
            'jobs_url': 'https://talentsphere.com/jobs',
            'onboarding_steps': [
                {
                    'title': 'Complete Your Profile',
                    'description': 'Add your skills, experience, and preferences',
                    'url': 'https://talentsphere.com/profile/edit',
                    'completed': False
                },
                {
                    'title': 'Upload Your Resume',
                    'description': 'Make it easy for employers to find you',
                    'url': 'https://talentsphere.com/profile/resume',
                    'completed': False
                },
                {
                    'title': 'Set Job Preferences',
                    'description': 'Tell us what kind of job you\'re looking for',
                    'url': 'https://talentsphere.com/profile/preferences',
                    'completed': False
                }
            ],
            'features': [
                {
                    'icon': '🎯',
                    'title': 'Smart Job Matching',
                    'description': 'Get personalized job recommendations based on your profile'
                },
                {
                    'icon': '💬',
                    'title': 'Direct Messaging',
                    'description': 'Connect directly with employers and recruiters'
                },
                {
                    'icon': '📊',
                    'title': 'Application Tracking',
                    'description': 'Track your applications and get status updates'
                }
            ],
            'tips': [
                'Keep your profile updated to get better job matches',
                'Set up job alerts for positions you\'re interested in',
                'Engage with companies and recruiters on the platform'
            ]
        }
        
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
        print("\n🔗 API Endpoints Available:")
        print("  POST /api/job-alerts/send - Send job alerts")
        print("  POST /api/job-alerts/interview/schedule - Schedule interviews")
        print("  POST /api/job-alerts/messages/send - Send message notifications")
        print("  POST /api/job-alerts/welcome/send - Send welcome emails")
        print("  POST /api/job-alerts/system/send - Send system notifications")
        print("  POST /api/job-alerts/test/all-templates - Test all templates")
    else:
        print(f"\n⚠️  {total - passed} templates need attention")
    
    return passed == total

if __name__ == "__main__":
    test_all_templates()