#!/usr/bin/env python3
"""
Test Email Service for TalentSphere
Tests the email notification system directly
"""

import os
import sys
from datetime import datetime, timezone

# Add the backend src directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.join(backend_dir, 'src')
sys.path.append(src_dir)

# Import Flask app and services
from src.main import app
from src.services.email_service import EmailService, EmailNotification, EmailPriority
from src.models.user import User

def test_email_service():
    """Test the email service directly"""
    
    with app.app_context():
        print("🔧 Testing Email Service...")
        
        # Create email service instance
        email_service = EmailService()
        
        # Check configuration
        print(f"📧 SMTP Server: {email_service.smtp_server}:{email_service.smtp_port}")
        print(f"📤 Sender Email: {email_service.sender_email}")
        print(f"📝 Sender Name: {email_service.sender_name}")
        print(f"🔑 Password Set: {'Yes' if email_service.sender_password else 'No'}")
        
        if not email_service.sender_password:
            print("❌ Email service not configured - SENDER_PASSWORD missing")
            return False
        
        # Find a test user
        test_user = User.query.filter_by(email='biodiversitynexus@yahoo.com').first()
        if not test_user:
            print("❌ Test user not found")
            return False
        
        print(f"👤 Test User: {test_user.email}")
        
        # Create test email notification
        test_email = EmailNotification(
            recipient_email=test_user.email,
            recipient_name=test_user.get_full_name(),
            template_name='system_notification',
            subject='🧪 Test Email from TalentSphere',
            variables={
                'user_name': test_user.get_full_name(),
                'title': 'Test Notification',
                'message': 'This is a test email to verify the email notification system is working correctly.',
                'action_url': f"{email_service.frontend_url}/notifications",
                'action_text': 'View Notifications',
                'app_name': 'TalentSphere',
                'current_year': datetime.now().year
            },
            priority=EmailPriority.HIGH,
            send_immediately=True
        )
        
        print("📨 Sending test email...")
        
        # Send test email
        try:
            success = email_service.send_notification_email(test_email)
            
            if success:
                print("✅ Test email sent successfully!")
                print(f"📬 Check your inbox at {test_user.email}")
                return True
            else:
                print("❌ Failed to send test email")
                return False
                
        except Exception as e:
            print(f"❌ Error sending test email: {str(e)}")
            return False

def test_smtp_connection():
    """Test SMTP connection only"""
    
    with app.app_context():
        print("🔌 Testing SMTP Connection...")
        
        email_service = EmailService()
        
        try:
            import smtplib
            
            print(f"🔗 Connecting to {email_service.smtp_server}:{email_service.smtp_port}")
            server = smtplib.SMTP(email_service.smtp_server, email_service.smtp_port)
            
            print("🔐 Starting TLS...")
            server.starttls()
            
            print("🔑 Authenticating...")
            server.login(email_service.sender_email, email_service.sender_password)
            
            print("✅ SMTP connection successful!")
            server.quit()
            return True
            
        except smtplib.SMTPAuthenticationError as e:
            print(f"❌ SMTP Authentication failed: {str(e)}")
            return False
        except smtplib.SMTPException as e:
            print(f"❌ SMTP error: {str(e)}")
            return False
        except Exception as e:
            print(f"❌ Connection error: {str(e)}")
            return False

if __name__ == "__main__":
    print("🚀 TalentSphere Email Service Test")
    print("=" * 50)
    
    # Test SMTP connection first
    print("\n1. Testing SMTP Connection...")
    smtp_success = test_smtp_connection()
    
    if smtp_success:
        print("\n2. Testing Email Service...")
        email_success = test_email_service()
        
        if email_success:
            print("\n🎉 All email tests passed!")
        else:
            print("\n❌ Email service test failed")
    else:
        print("\n❌ SMTP connection failed - cannot test email service")
    
    print("\n💡 If emails are not being sent for notifications, check:")
    print("   - Notification preferences are enabled for email")
    print("   - send_email flag is set to True when creating notifications")
    print("   - User email addresses are valid")