import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

from services.email_service import EmailService, EmailNotification, EmailPriority
import smtplib

def test_email_connection():
    """Test basic email connection first"""
    print("🔗 Testing Email Connection...")
    try:
        email_service = EmailService()
        # Test SMTP connection
        server = smtplib.SMTP('smtp.mail.yahoo.com', 587)
        server.starttls()
        server.login(email_service.sender_email, email_service.sender_password)
        server.quit()
        print("✅ SMTP connection successful")
        return True
    except Exception as e:
        print(f"❌ SMTP connection failed: {e}")
        return False

def test_simple_email():
    """Test sending a simple text email first"""
    print("\n📧 Testing Simple Email...")
    try:
        email_service = EmailService()
        
        # Create a simple notification
        notification = EmailNotification(
            recipient_email="biodiversitynexus@yahoo.com",
            recipient_name="Test User",
            template_name="system",
            subject="TalentSphere - Test Email",
            variables={
                'notification_title': 'Test Email',
                'notification_type': 'system',
                'icon': '✅',
                'message': 'This is a test email from TalentSphere notification system.',
                'action_url': 'https://talentsphere.com',
                'action_text': 'Visit TalentSphere',
                'percentage': '100',
                'missing_sections': '',
                'stats': '',
                'recommendations': '',
                'unsubscribe_url': 'https://talentsphere.com/unsubscribe',
                'preferences_url': 'https://talentsphere.com/preferences'
            },
            priority=EmailPriority.NORMAL
        )
        
        success = email_service.send_notification_email(notification)
        if success:
            print("✅ Simple email sent successfully")
            return True
        else:
            print("❌ Simple email failed")
            return False
    except Exception as e:
        print(f"❌ Simple email error: {e}")
        return False

def test_job_alert_email():
    """Test sending the beautiful job alert email"""
    print("\n🎯 Testing Job Alert Email...")
    try:
        email_service = EmailService()
        
        # Create job alert notification
        notification = EmailNotification(
            recipient_email="biodiversitynexus@yahoo.com",
            recipient_name="John Doe",
            template_name="job_alert",
            subject="🎯 New Job Alert: Senior Software Engineer at Tech Innovations Inc.",
            variables={
                'user_name': 'John Doe',
                'job_title': 'Senior Software Engineer',
                'company_name': 'Tech Innovations Inc.',
                'location': 'San Francisco, CA',
                'job_type': 'Full-time',
                'employment_type': 'Full-time',
                'experience_level': '5-7 years',
                'salary_range': '$120,000 - $180,000',
                'job_url': 'https://talentsphere.com/jobs/123',
                'apply_url': 'https://talentsphere.com/jobs/123/apply',
                'job_description': 'Join our innovative team to build next-generation software solutions.',
                'category': 'Software Development',
                'unsubscribe_url': 'https://talentsphere.com/unsubscribe',
                'preferences_url': 'https://talentsphere.com/preferences'
            },
            priority=EmailPriority.NORMAL
        )
        
        success = email_service.send_notification_email(notification)
        if success:
            print("✅ Job alert email sent successfully")
            return True
        else:
            print("❌ Job alert email failed")
            return False
    except Exception as e:
        print(f"❌ Job alert email error: {e}")
        return False

def test_all_email_templates():
    print("🚀 Testing Beautiful Email Templates")
    print("=" * 50)
    
    # Step 1: Test connection
    if not test_email_connection():
        print("❌ Cannot proceed without SMTP connection")
        return
    
    # Step 2: Test simple email
    if not test_simple_email():
        print("❌ Cannot proceed without basic email functionality")
        return
    
    # Step 3: Test job alert email
    if not test_job_alert_email():
        print("❌ Job alert email failed")
        return
    
    print("\n🎉 Testing Complete!")
    print("✅ All tests passed!")
    print("📧 Check your inbox: biodiversitynexus@yahoo.com")

if __name__ == "__main__":
    test_all_email_templates()