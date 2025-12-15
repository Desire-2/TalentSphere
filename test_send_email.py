#!/usr/bin/env python3
"""
Test email sending directly without Flask app context
"""
import os
import sys

# Add backend to path
sys.path.insert(0, '/home/desire/My_Project/TalentSphere/backend')

# Load environment variables
from dotenv import load_dotenv
load_dotenv('/home/desire/My_Project/TalentSphere/backend/.env')

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Get configuration from .env
SMTP_SERVER = os.getenv('SMTP_SERVER')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SENDER_EMAIL = os.getenv('SENDER_EMAIL')
SENDER_PASSWORD = os.getenv('SENDER_PASSWORD')
SENDER_NAME = os.getenv('SENDER_NAME', 'TalentSphere')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')

print("=" * 70)
print("Email Sending Test".center(70))
print("=" * 70)
print("\n📧 Configuration from .env:")
print(f"   SMTP Server: {SMTP_SERVER}")
print(f"   SMTP Port: {SMTP_PORT}")
print(f"   Sender Email: {SENDER_EMAIL}")
print(f"   Password Set: {'Yes' if SENDER_PASSWORD else 'No'}")
if SENDER_PASSWORD:
    print(f"   Password Length: {len(SENDER_PASSWORD)} chars")
    print(f"   Password (masked): {SENDER_PASSWORD[:4]}...{SENDER_PASSWORD[-4:]}")
print()

if not SENDER_EMAIL or not SENDER_PASSWORD:
    print("❌ ERROR: SENDER_EMAIL or SENDER_PASSWORD not set in .env")
    sys.exit(1)

# Test recipient
TEST_EMAIL = input("Enter test email address (or press Enter for bikorimanadesire5@gmail.com): ").strip()
if not TEST_EMAIL:
    TEST_EMAIL = "bikorimanadesire5@gmail.com"

print(f"\n🔄 Testing email send to: {TEST_EMAIL}")
print()

try:
    # Step 1: Connect
    print("1️⃣ Connecting to SMTP server...")
    server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=10)
    print(f"   ✅ Connected to {SMTP_SERVER}:{SMTP_PORT}")
    
    # Step 2: Start TLS
    print("2️⃣ Starting TLS encryption...")
    server.starttls()
    print("   ✅ TLS started")
    
    # Step 3: Login
    print("3️⃣ Authenticating...")
    server.login(SENDER_EMAIL, SENDER_PASSWORD)
    print(f"   ✅ Authenticated as {SENDER_EMAIL}")
    
    # Step 4: Create message
    print("4️⃣ Creating test email...")
    message = MIMEMultipart("alternative")
    message["Subject"] = "Test Email from TalentSphere"
    message["From"] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
    message["To"] = TEST_EMAIL
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #2563eb;">✅ Email Test Successful!</h1>
            <p style="color: #6b7280; line-height: 1.6;">
                This is a test email from TalentSphere to verify the email configuration is working correctly.
            </p>
            <p style="color: #6b7280; line-height: 1.6;">
                <strong>Configuration:</strong><br>
                SMTP Server: {SMTP_SERVER}<br>
                Sender: {SENDER_EMAIL}<br>
            </p>
            <p style="color: #10b981; font-weight: bold;">
                🎉 Your email system is configured correctly!
            </p>
        </div>
    </body>
    </html>
    """
    
    html_part = MIMEText(html, "html")
    message.attach(html_part)
    print("   ✅ Message created")
    
    # Step 5: Send
    print("5️⃣ Sending email...")
    server.sendmail(SENDER_EMAIL, TEST_EMAIL, message.as_string())
    print("   ✅ Email sent successfully!")
    
    # Step 6: Close
    server.quit()
    print()
    print("=" * 70)
    print("🎉 SUCCESS! Email was sent successfully!".center(70))
    print("=" * 70)
    print(f"\n✅ Check the inbox of {TEST_EMAIL}")
    print("✅ The password reset system should now work correctly")
    
except smtplib.SMTPAuthenticationError as e:
    print(f"\n❌ AUTHENTICATION FAILED")
    print(f"   Error: {str(e)}")
    print("\n💡 Solutions:")
    print("   1. Generate a new Yahoo App Password:")
    print("      https://login.yahoo.com/account/security")
    print("   2. Update SENDER_PASSWORD in backend/.env")
    
except smtplib.SMTPException as e:
    print(f"\n❌ SMTP ERROR")
    print(f"   Error: {str(e)}")
    print("\n💡 Check:")
    print("   - SMTP server and port are correct")
    print("   - Password is valid and not expired")
    print("   - Network/firewall allows SMTP connections")
    
except Exception as e:
    print(f"\n❌ ERROR")
    print(f"   Type: {type(e).__name__}")
    print(f"   Message: {str(e)}")
    import traceback
    print("\nFull traceback:")
    traceback.print_exc()
