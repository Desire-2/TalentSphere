#!/usr/bin/env python3
"""
Test environment setup for TalentSphere backend
"""
import os
import sys
from dotenv import load_dotenv

print("🔍 Testing TalentSphere Backend Environment")
print("=" * 50)

# Load .env file
env_file = '.env'
if os.path.exists(env_file):
    load_dotenv(env_file)
    print(f"✅ Loaded {env_file}")
else:
    print(f"❌ {env_file} not found")

# Check Python version
print(f"🐍 Python version: {sys.version}")

# Check virtual environment
venv = os.environ.get('VIRTUAL_ENV')
if venv:
    print(f"📦 Virtual environment: {venv}")
else:
    print("⚠️  No virtual environment detected")

# Check important environment variables
env_vars = {
    'SECRET_KEY': os.environ.get('SECRET_KEY'),
    'DATABASE_URL': os.environ.get('DATABASE_URL'),
    'FLASK_ENV': os.environ.get('FLASK_ENV', 'development'),
}

print("\n🔐 Environment Variables:")
for key, value in env_vars.items():
    if value:
        # Mask sensitive information
        if key in ['SECRET_KEY', 'DATABASE_URL']:
            masked = value[:15] + '***' + value[-15:] if len(value) > 30 else '***'
            print(f"  ✅ {key}: {masked}")
        else:
            print(f"  ✅ {key}: {value}")
    else:
        print(f"  ❌ {key}: Not set")

# Test basic imports
print("\n📦 Testing imports...")
try:
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from src.main import app
    print("  ✅ Flask app import successful")
except Exception as e:
    print(f"  ❌ Flask app import failed: {e}")

print("\n🎯 Environment test complete!")
