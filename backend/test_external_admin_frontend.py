#!/usr/bin/env python3
"""
Test External Admin Frontend Integration
This script tests the external admin login and verifies the user gets the right role for frontend navigation.
"""

import requests
import json

def test_external_admin_frontend_integration():
    """Test external admin login and role verification for frontend"""
    print("🎯 Testing External Admin Frontend Integration")
    print("=" * 60)
    
    # Test login
    login_url = "http://localhost:5001/api/auth/login"
    login_data = {
        "email": "afritechbridge@yahoo.com",
        "password": "Desire@123"
    }
    
    try:
        print("🔑 Testing login...")
        response = requests.post(login_url, json=login_data, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ Login failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        login_result = response.json()
        token = login_result.get('token')
        user = login_result.get('user')
        
        print(f"✅ Login successful!")
        print(f"   User: {user.get('full_name')}")
        print(f"   Role: {user.get('role')}")
        print(f"   Email: {user.get('email')}")
        print(f"   Token: {token[:20]}...")
        
        # Verify it's external_admin role
        if user.get('role') != 'external_admin':
            print(f"❌ Expected role 'external_admin', got '{user.get('role')}'")
            return False
        
        print("✅ Role verification passed!")
        
        # Test getting external jobs to verify API access
        print("\n📋 Testing external jobs API access...")
        jobs_url = "http://localhost:5001/api/external-jobs"
        headers = {"Authorization": f"Bearer {token}"}
        
        jobs_response = requests.get(jobs_url, headers=headers, timeout=10)
        
        if jobs_response.status_code != 200:
            print(f"❌ External jobs API failed: {jobs_response.status_code}")
            return False
        
        jobs_data = jobs_response.json()
        total_jobs = jobs_data.get('pagination', {}).get('total', 0)
        
        print(f"✅ External jobs API access successful!")
        print(f"   Total external jobs: {total_jobs}")
        
        # Test health check
        print("\n🏥 Testing API health check...")
        health_response = requests.get("http://localhost:5001/api/health", timeout=5)
        
        if health_response.status_code == 200:
            health_data = health_response.json()
            print(f"✅ API health check passed!")
            print(f"   Status: {health_data.get('status')}")
            print(f"   Database: {health_data.get('database')}")
        else:
            print(f"⚠️  Health check warning: {health_response.status_code}")
        
        print("\n🎉 Frontend Integration Test Summary:")
        print("=" * 60)
        print("✅ External admin login: SUCCESS")
        print("✅ Role verification: SUCCESS")
        print("✅ API authentication: SUCCESS") 
        print("✅ External jobs access: SUCCESS")
        print("✅ Ready for frontend testing!")
        print("\n🌐 Frontend URL: http://localhost:5177")
        print("🔑 Test Credentials:")
        print("   Email: afritechbridge@yahoo.com")
        print("   Password: Desire@123")
        print("   Role: external_admin")
        print("\n📱 Expected Frontend Flow:")
        print("1. Login with external admin credentials")
        print("2. Should redirect to /external-admin dashboard")
        print("3. Access external job management features")
        print("4. Create, edit, and manage external job postings")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = test_external_admin_frontend_integration()
    exit(0 if success else 1)
