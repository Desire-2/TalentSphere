#!/usr/bin/env python3
"""
Test Job Notification System
Tests job posting notifications, digests, and user preferences
"""

import requests
import json
from datetime import datetime

# Configuration
API_URL = "http://localhost:5001/api"
HEADERS = {"Content-Type": "application/json"}

# Test credentials (update with real credentials)
TEST_USER_EMAIL = "bikorimanadesire5@gmail.com"
TEST_USER_PASSWORD = "Desire@#1"
TEST_EMPLOYER_EMAIL = "ladysessence1@gmail.com"
TEST_EMPLOYER_PASSWORD = "Desire@#1"

def print_section(title):
    """Print formatted section header"""
    print(f"\n{'='*60}")
    print(f" {title}")
    print(f"{'='*60}")

def test_login(email, password):
    """Login and get auth token"""
    print(f"\n🔐 Logging in as {email}...")
    response = requests.post(
        f"{API_URL}/auth/login",
        headers=HEADERS,
        json={"email": email, "password": password}
    )
    
    if response.status_code == 200:
        data = response.json()
        token = data.get('token')
        print(f"✅ Login successful!")
        return token
    else:
        print(f"❌ Login failed: {response.text}")
        return None

def test_get_notification_preferences(token):
    """Get user's notification preferences"""
    print_section("Testing Get Notification Preferences")
    
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{API_URL}/enhanced-notifications/notification-preferences",
        headers=auth_headers
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Preferences retrieved successfully")
        print(json.dumps(data, indent=2))
        return data
    else:
        print(f"❌ Failed to get preferences: {response.text}")
        return None

def test_update_notification_preferences(token):
    """Update user's notification preferences"""
    print_section("Testing Update Notification Preferences")
    
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    # Enable all job-related notifications
    preferences = {
        "email_enabled": True,
        "job_alerts_email": True,
        "new_features_email": True,
        "platform_updates_email": True,
        "weekly_digest_enabled": True,
        "weekly_digest_day": "monday",
        "daily_digest_enabled": True,
        "daily_digest_time": "09:00",
        "immediate_for_urgent": True,
        "batch_notifications": False  # Get immediate notifications
    }
    
    response = requests.put(
        f"{API_URL}/enhanced-notifications/notification-preferences",
        headers=auth_headers,
        json=preferences
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Preferences updated successfully")
        print(json.dumps(data, indent=2))
        return True
    else:
        print(f"❌ Failed to update preferences: {response.text}")
        return False

def test_create_job_alert(token):
    """Create a job alert for testing"""
    print_section("Testing Create Job Alert")
    
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    alert = {
        "name": "Software Engineer Jobs",
        "keywords": "python, flask, backend",
        "employment_type": "full-time",
        "experience_level": "mid",
        "is_remote": True,
        "frequency": "immediate"
    }
    
    response = requests.post(
        f"{API_URL}/job-alerts",
        headers=auth_headers,
        json=alert
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        data = response.json()
        print(f"✅ Job alert created successfully")
        print(json.dumps(data, indent=2))
        return data.get('alert', {}).get('id')
    else:
        print(f"❌ Failed to create job alert: {response.text}")
        return None

def test_create_job(token):
    """Create a test job posting"""
    print_section("Testing Create Job (Should Trigger Notifications)")
    
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    job = {
        "title": "Senior Backend Developer",
        "description": "Looking for an experienced Python/Flask developer",
        "summary": "Senior backend position with Python and Flask",
        "employment_type": "full-time",
        "experience_level": "senior",
        "location_type": "remote",
        "country": "United States",
        "required_skills": "python, flask, postgresql, redis",
        "salary_min": 100000,
        "salary_max": 150000,
        "salary_currency": "USD",
        "salary_period": "yearly",
        "show_salary": True,
        "category_id": 1,
        "status": "published",  # Publish immediately to trigger notifications
        "application_type": "internal"
    }
    
    response = requests.post(
        f"{API_URL}/jobs",
        headers=auth_headers,
        json=job
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        data = response.json()
        print(f"✅ Job created and published successfully")
        print(f"📧 Notifications should be triggered for matching users")
        print(json.dumps(data, indent=2))
        return data.get('job', {}).get('id')
    else:
        print(f"❌ Failed to create job: {response.text}")
        return None

def test_check_notifications(token):
    """Check if notifications were received"""
    print_section("Testing Check Notifications")
    
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{API_URL}/enhanced-notifications/notifications",
        headers=auth_headers
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        notifications = data.get('notifications', [])
        print(f"✅ Retrieved {len(notifications)} notifications")
        print(f"📬 Unread count: {data.get('unread_count', 0)}")
        
        # Show recent job alert notifications
        job_alerts = [n for n in notifications if n.get('notification_type') == 'job_alert']
        if job_alerts:
            print(f"\n📧 Recent Job Alert Notifications:")
            for notif in job_alerts[:3]:
                print(f"  - {notif['title']} ({notif['created_at']})")
        
        return notifications
    else:
        print(f"❌ Failed to check notifications: {response.text}")
        return []

def test_trigger_daily_digest(token):
    """Manually trigger daily digest (admin only)"""
    print_section("Testing Trigger Daily Digest")
    
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    response = requests.post(
        f"{API_URL}/admin/trigger-daily-digest",
        headers=auth_headers
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Daily digest triggered successfully")
        print(json.dumps(data, indent=2))
        return True
    else:
        print(f"❌ Failed to trigger digest: {response.text}")
        return False

def run_full_test():
    """Run complete notification system test"""
    print_section("Job Notification System Test Suite")
    print(f"Testing against: {API_URL}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test as job seeker
    print("\n" + "="*60)
    print(" PART 1: Job Seeker Tests")
    print("="*60)
    
    jobseeker_token = test_login(TEST_USER_EMAIL, TEST_USER_PASSWORD)
    if not jobseeker_token:
        print("\n⚠️  Skipping job seeker tests - login failed")
    else:
        # Get and update preferences
        test_get_notification_preferences(jobseeker_token)
        test_update_notification_preferences(jobseeker_token)
        
        # Create job alert
        test_create_job_alert(jobseeker_token)
    
    # Test as employer
    print("\n" + "="*60)
    print(" PART 2: Employer Tests")
    print("="*60)
    
    employer_token = test_login(TEST_EMPLOYER_EMAIL, TEST_EMPLOYER_PASSWORD)
    if not employer_token:
        print("\n⚠️  Skipping employer tests - login failed")
    else:
        # Create a job (should trigger notifications)
        job_id = test_create_job(employer_token)
        
        if job_id:
            print(f"\n✅ Job created with ID: {job_id}")
            print("📧 Check if notifications were sent to matching users")
    
    # Check notifications as job seeker
    if jobseeker_token:
        import time
        print("\n⏳ Waiting 3 seconds for notifications to be processed...")
        time.sleep(3)
        
        test_check_notifications(jobseeker_token)
    
    print_section("Test Suite Complete")
    print(f"Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    run_full_test()
