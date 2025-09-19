#!/usr/bin/env python3

import sys
import os
import requests
import json
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

def test_job_templates_api():
    """Test the job templates API endpoints"""
    base_url = "http://localhost:5001/api"
    
    print("🧪 Testing Job Templates API endpoints...")
    
    # First, we need to get an auth token
    # For testing, we'll assume there's an external admin user
    
    # Test 1: Get job templates (should work without auth for public endpoints, but templates require auth)
    print("\n1. Testing GET /job-templates")
    try:
        response = requests.get(f"{base_url}/job-templates")
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("✅ Correctly requires authentication")
        else:
            print(f"Response: {response.json()}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Get job categories (public endpoint)
    print("\n2. Testing GET /job-categories")
    try:
        response = requests.get(f"{base_url}/job-categories")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {len(data.get('categories', []))} categories")
            print(f"Categories: {[cat['name'] for cat in data.get('categories', [])[:3]]}...")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: Health check
    print("\n3. Testing GET /health")
    try:
        response = requests.get("http://localhost:5001/health")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend is {data.get('status')}")
            print(f"Database: {data.get('database')}")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 4: Try to login with external admin credentials (if exists)
    print("\n4. Testing external admin authentication")
    try:
        # Check if we have any users first
        response = requests.post(f"{base_url}/auth/login", json={
            "email": "external_admin@example.com",
            "password": "admin123"
        })
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            print("✅ Successfully authenticated as external admin")
            
            # Test authenticated template endpoints
            headers = {"Authorization": f"Bearer {token}"}
            
            print("\n5. Testing authenticated GET /job-templates")
            template_response = requests.get(f"{base_url}/job-templates", headers=headers)
            print(f"Status: {template_response.status_code}")
            
            if template_response.status_code == 200:
                template_data = template_response.json()
                templates = template_data.get('templates', [])
                print(f"✅ Found {len(templates)} job templates")
                for template in templates[:3]:  # Show first 3
                    print(f"  - {template.get('name')}: {template.get('title')}")
            else:
                print(f"❌ Template fetch error: {template_response.text}")
                
        else:
            print(f"⚠️  External admin login failed: {response.status_code}")
            print("This is expected if external admin user doesn't exist yet")
    
    except Exception as e:
        print(f"❌ Auth test error: {e}")
    
    print("\n🎉 API testing completed!")

if __name__ == '__main__':
    test_job_templates_api()
