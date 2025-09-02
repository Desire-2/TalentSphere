#!/usr/bin/env python3
"""
Test External Admin API Functionality
This script tests the external admin API endpoints after database migration.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

import requests
import json

def test_external_admin_login():
    """Test external admin login"""
    url = "http://localhost:5001/api/auth/login"
    data = {
        "email": "afritechbridge@yahoo.com", 
        "password": "Desire@123"
    }
    
    try:
        response = requests.post(url, json=data, timeout=5)
        print(f"Login Response Status: {response.status_code}")
        print(f"Login Response: {response.json()}")
        
        if response.status_code == 200:
            return response.json().get('token')  # Fixed: use 'token' instead of 'access_token'
        else:
            print("❌ Login failed")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return None

def test_create_external_job(token):
    """Test creating an external job"""
    url = "http://localhost:5001/api/jobs"
    headers = {"Authorization": f"Bearer {token}"}
    
    job_data = {
        "title": "Test External Job",
        "description": "This is a test external job posting",
        "external_company_name": "Test External Company",
        "external_company_website": "https://test-company.com",
        "external_company_logo": "https://test-company.com/logo.png",
        "source_url": "https://test-company.com/jobs/test",
        "employment_type": "full-time",
        "experience_level": "mid",
        "category_id": 1,
        "location_type": "remote",
        "application_type": "external",
        "application_url": "https://test-company.com/apply/test",
        "status": "published"
    }
    
    try:
        response = requests.post(url, json=job_data, headers=headers, timeout=5)
        print(f"Create Job Response Status: {response.status_code}")
        print(f"Create Job Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 201:
            return response.json().get('job', {}).get('id')
        else:
            print("❌ Job creation failed")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return None

def test_get_external_jobs(token):
    """Test getting external jobs"""
    url = "http://localhost:5001/api/external-jobs"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers, timeout=5)
        print(f"Get External Jobs Response Status: {response.status_code}")
        print(f"Get External Jobs Response: {json.dumps(response.json(), indent=2)}")
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")

def test_health_check():
    """Test health check endpoint"""
    url = "http://localhost:5001/api/health"
    
    try:
        response = requests.get(url, timeout=5)
        print(f"Health Check Status: {response.status_code}")
        print(f"Health Check Response: {response.json()}")
        return response.status_code == 200
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Health check failed: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 Testing External Admin API Functionality")
    print("=" * 50)
    
    # Test health check first
    if not test_health_check():
        print("❌ Server is not running or not healthy")
        return
    
    print("\n🔑 Testing External Admin Login...")
    token = test_external_admin_login()
    
    if not token:
        print("❌ Cannot proceed without authentication token")
        return
    
    print(f"✅ Login successful, token: {token[:20]}...")
    
    print("\n📝 Testing External Job Creation...")
    job_id = test_create_external_job(token)
    
    if job_id:
        print(f"✅ Job created successfully, ID: {job_id}")
    
    print("\n📋 Testing External Jobs Listing...")
    test_get_external_jobs(token)
    
    print("\n✅ External Admin API tests completed!")

if __name__ == "__main__":
    main()
