#!/usr/bin/env python3
"""
Quick SMTP Connection Test
Tests if email credentials are working
"""

import smtplib
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.mail.yahoo.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SENDER_EMAIL = os.getenv('SENDER_EMAIL')
SENDER_PASSWORD = os.getenv('SENDER_PASSWORD')

print("=" * 60)
print("SMTP Connection Test".center(60))
print("=" * 60)
print(f"\n📧 Configuration:")
print(f"   Server: {SMTP_SERVER}")
print(f"   Port: {SMTP_PORT}")
print(f"   Email: {SENDER_EMAIL}")
print(f"   Password: {'*' * len(SENDER_PASSWORD) if SENDER_PASSWORD else 'NOT SET'}")
print()

if not SENDER_EMAIL or not SENDER_PASSWORD:
    print("❌ ERROR: Email credentials not configured in .env file")
    exit(1)

print("🔄 Testing SMTP connection...")

try:
    # Connect to SMTP server
    print(f"   → Connecting to {SMTP_SERVER}:{SMTP_PORT}...")
    server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=10)
    print("   ✅ Connected")
    
    # Start TLS
    print("   → Starting TLS encryption...")
    server.starttls()
    print("   ✅ TLS started")
    
    # Login
    print(f"   → Authenticating as {SENDER_EMAIL}...")
    server.login(SENDER_EMAIL, SENDER_PASSWORD)
    print("   ✅ Authentication successful")
    
    # Close connection
    server.quit()
    print("\n🎉 SUCCESS! SMTP configuration is working correctly.")
    print("✅ You can now send password reset emails.")
    
except smtplib.SMTPAuthenticationError as e:
    print(f"\n❌ AUTHENTICATION FAILED")
    print(f"   Error: {str(e)}")
    print("\n💡 Solutions:")
    print("   1. For Yahoo Mail:")
    print("      - Go to https://login.yahoo.com/account/security")
    print("      - Generate an App Password")
    print("      - Use that password in SENDER_PASSWORD")
    print("   2. Check email/password are correct in .env")
    
except smtplib.SMTPConnectError as e:
    print(f"\n❌ CONNECTION FAILED")
    print(f"   Error: {str(e)}")
    print("\n💡 Solutions:")
    print("   1. Check your internet connection")
    print("   2. Check if firewall is blocking port 587")
    print("   3. Try SMTP_PORT=465 with SSL")
    
except smtplib.SMTPException as e:
    print(f"\n❌ SMTP ERROR")
    print(f"   Error: {str(e)}")
    print("\n💡 This might be:")
    print("   - Connection closed by server")
    print("   - Invalid credentials")
    print("   - Server temporarily unavailable")
    
except Exception as e:
    print(f"\n❌ UNEXPECTED ERROR")
    print(f"   Error: {str(e)}")
    print(f"   Type: {type(e).__name__}")

print("\n" + "=" * 60)
