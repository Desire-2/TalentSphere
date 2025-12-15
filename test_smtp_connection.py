#!/usr/bin/env python3
"""
SMTP Connection Tester
Tests SMTP configuration and provides troubleshooting guidance
"""

import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

# ANSI color codes
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
BOLD = '\033[1m'
RESET = '\033[0m'

def print_header(text):
    print(f"\n{BOLD}{BLUE}{'='*70}{RESET}")
    print(f"{BOLD}{BLUE}{text.center(70)}{RESET}")
    print(f"{BOLD}{BLUE}{'='*70}{RESET}\n")

def print_success(text):
    print(f"{GREEN}✅ {text}{RESET}")

def print_error(text):
    print(f"{RED}❌ {text}{RESET}")

def print_warning(text):
    print(f"{YELLOW}⚠️  {text}{RESET}")

def print_info(text):
    print(f"{BLUE}ℹ️  {text}{RESET}")

def test_smtp_connection():
    """Test SMTP connection with current configuration"""
    
    print_header("SMTP Configuration Test")
    
    # Get configuration
    smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.getenv('SMTP_PORT', '587'))
    sender_email = os.getenv('SENDER_EMAIL')
    sender_password = os.getenv('SENDER_PASSWORD')
    sender_name = os.getenv('SENDER_NAME', 'TalentSphere')
    
    # Display configuration
    print_info(f"SMTP Server: {smtp_server}")
    print_info(f"SMTP Port: {smtp_port}")
    print_info(f"Sender Email: {sender_email}")
    print_info(f"Sender Name: {sender_name}")
    print_info(f"Password: {'*' * len(sender_password) if sender_password else 'NOT SET'}")
    
    # Validation
    if not sender_email:
        print_error("SENDER_EMAIL not set in .env file")
        return False
    
    if not sender_password:
        print_error("SENDER_PASSWORD not set in .env file")
        return False
    
    # Determine email provider
    if 'gmail' in sender_email.lower():
        provider = 'Gmail'
        expected_server = 'smtp.gmail.com'
    elif 'yahoo' in sender_email.lower():
        provider = 'Yahoo'
        expected_server = 'smtp.mail.yahoo.com'
    elif 'outlook' in sender_email.lower() or 'hotmail' in sender_email.lower():
        provider = 'Outlook'
        expected_server = 'smtp.office365.com'
    else:
        provider = 'Unknown'
        expected_server = None
    
    print(f"\n{BOLD}Detected Provider: {provider}{RESET}")
    
    # Check if server matches provider
    if expected_server and smtp_server != expected_server:
        print_warning(f"SMTP server mismatch! Using {smtp_server} but expected {expected_server}")
        print_info(f"Update SMTP_SERVER={expected_server} in .env")
    
    # Test connection
    print(f"\n{BOLD}Testing SMTP Connection...{RESET}")
    
    try:
        print_info("Connecting to SMTP server...")
        server = smtplib.SMTP(smtp_server, smtp_port, timeout=10)
        print_success(f"Connected to {smtp_server}:{smtp_port}")
        
        print_info("Starting TLS encryption...")
        server.starttls()
        print_success("TLS encryption enabled")
        
        print_info("Attempting authentication...")
        server.login(sender_email, sender_password)
        print_success(f"Authentication successful for {sender_email}")
        
        server.quit()
        
        print(f"\n{GREEN}{BOLD}🎉 SMTP Configuration is WORKING!{RESET}")
        print_info("Your email service is properly configured.")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print_error(f"Authentication failed: {str(e)}")
        print("\n" + "="*70)
        print(f"{BOLD}TROUBLESHOOTING: Authentication Failed{RESET}")
        print("="*70)
        
        if provider == 'Gmail':
            print(f"""
{YELLOW}Gmail requires an App Password for SMTP access:{RESET}

1. Go to: https://myaccount.google.com/security
2. Enable 2-Step Verification (if not already enabled)
3. Go to: https://myaccount.google.com/apppasswords
4. Select app: "Mail", device: "Other (TalentSphere)"
5. Click "Generate"
6. Copy the 16-character password (remove spaces)
7. Update .env: SENDER_PASSWORD=xxxxxxxxxxxxxxxx

{RED}Note: Regular Gmail passwords don't work with SMTP!{RESET}
            """)
        elif provider == 'Yahoo':
            print(f"""
{YELLOW}Yahoo requires an App Password:{RESET}

1. Go to: https://login.yahoo.com/account/security
2. Click "Generate app password"
3. Select app: "Other App" (type "TalentSphere")
4. Click "Generate"
5. Copy the password
6. Update .env: SENDER_PASSWORD=your-app-password
            """)
        elif provider == 'Outlook':
            print(f"""
{YELLOW}Outlook/Hotmail App Password:{RESET}

1. Go to: https://account.microsoft.com/security
2. Enable 2-Step Verification
3. Go to App passwords
4. Create new app password
5. Update .env: SENDER_PASSWORD=your-app-password
            """)
        
        return False
        
    except smtplib.SMTPConnectError as e:
        print_error(f"Connection failed: {str(e)}")
        print_warning("Check if the SMTP server address and port are correct")
        return False
        
    except smtplib.SMTPException as e:
        print_error(f"SMTP error: {str(e)}")
        return False
        
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
        return False

def test_send_email(recipient_email=None):
    """Test sending an actual email"""
    
    if not recipient_email:
        recipient_email = input(f"\n{BOLD}Enter recipient email to test (or press Enter to skip): {RESET}").strip()
        if not recipient_email:
            print_info("Skipping email send test")
            return
    
    print_header("Testing Email Send")
    
    smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.getenv('SMTP_PORT', '587'))
    sender_email = os.getenv('SENDER_EMAIL')
    sender_password = os.getenv('SENDER_PASSWORD')
    sender_name = os.getenv('SENDER_NAME', 'TalentSphere')
    
    try:
        # Create test message
        message = MIMEMultipart('alternative')
        message['From'] = f"{sender_name} <{sender_email}>"
        message['To'] = recipient_email
        message['Subject'] = "TalentSphere SMTP Test"
        
        html = """
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #2563eb;">✅ SMTP Configuration Test Successful!</h2>
            <p>This is a test email from TalentSphere password reset system.</p>
            <p>If you received this email, your SMTP configuration is working correctly.</p>
            <hr>
            <p style="color: #666; font-size: 12px;">
                Sent from TalentSphere Email Service Test
            </p>
        </body>
        </html>
        """
        
        message.attach(MIMEText(html, 'html'))
        
        # Send email
        print_info(f"Sending test email to {recipient_email}...")
        server = smtplib.SMTP(smtp_server, smtp_port, timeout=10)
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, recipient_email, message.as_string())
        server.quit()
        
        print_success(f"Test email sent successfully to {recipient_email}")
        print_info("Check your inbox (and spam folder)")
        
    except Exception as e:
        print_error(f"Failed to send test email: {str(e)}")

def main():
    """Main function"""
    print_header("TalentSphere SMTP Configuration Tester")
    
    # Test connection
    success = test_smtp_connection()
    
    if success:
        # Offer to send test email
        test_send_email()
    else:
        print(f"\n{RED}{BOLD}Fix the authentication issue before testing email send.{RESET}")
    
    print(f"\n{BOLD}Configuration file: backend/.env{RESET}")
    print(f"{BOLD}After making changes, restart the backend server.{RESET}\n")

if __name__ == "__main__":
    main()
