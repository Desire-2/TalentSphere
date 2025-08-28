#!/usr/bin/env python3
"""
Test database connection for debugging Render deployment issues
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("🔍 Testing Database Connection")
print("=" * 50)

# Check DATABASE_URL
DATABASE_URL = os.getenv('DATABASE_URL')
if DATABASE_URL:
    # Mask the password for security
    if '@' in DATABASE_URL:
        masked_url = DATABASE_URL.split('@')[0][:20] + '***@' + DATABASE_URL.split('@')[1]
    else:
        masked_url = DATABASE_URL[:20] + '***'
    print(f"✅ DATABASE_URL found: {masked_url}")
    
    # Fix postgres:// to postgresql:// if needed
    if DATABASE_URL.startswith('postgres://'):
        DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
        print("🔧 Fixed postgres:// to postgresql://")
else:
    print("❌ DATABASE_URL not found")
    sys.exit(1)

# Test SQLAlchemy connection
try:
    from sqlalchemy import create_engine, text
    
    print("\n🔧 Testing SQLAlchemy connection...")
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        result = conn.execute(text('SELECT version()'))
        version = result.fetchone()[0]
        print(f"✅ PostgreSQL connected successfully")
        print(f"📊 Database version: {version}")
        
except Exception as e:
    print(f"❌ SQLAlchemy connection failed: {e}")
    sys.exit(1)

# Test Flask app import and database
try:
    print("\n🔧 Testing Flask app import...")
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from src.main import app
    print("✅ Flask app imported successfully")
    
    with app.app_context():
        from src.models.user import db
        print("✅ Database models imported successfully")
        
        # Test database connection through Flask-SQLAlchemy
        db.session.execute(text('SELECT 1'))
        print("✅ Flask-SQLAlchemy connection successful")
        
        # Try to create tables
        db.create_all()
        print("✅ Database tables created successfully")
        
except Exception as e:
    print(f"❌ Flask app test failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n🎉 All database tests passed!")
print("✅ Database connection is working correctly")
