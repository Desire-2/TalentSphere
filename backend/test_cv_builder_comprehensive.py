#!/usr/bin/env python3
"""
Comprehensive CV Builder Testing Script
Tests all CV builder functionality including edge cases and error handling
"""
import os
import sys
import json
import requests
import getpass
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configuration
BASE_URL = "http://localhost:5001"

# Interactive credential input
print("\n🔐 CV Builder Test - Login Required")
print("=" * 60)
print("Please provide job seeker credentials to test CV Builder.")
print("You can use any existing job seeker account from the database.")
print("=" * 60)

TEST_USER_EMAIL = input("Email: ").strip()
TEST_USER_PASSWORD = getpass.getpass("Password: ")

class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(text):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'=' * 80}")
    print(f"{text}")
    print(f"{'=' * 80}{Colors.ENDC}\n")

def print_test(test_name):
    print(f"{Colors.OKBLUE}▶ Testing:{Colors.ENDC} {test_name}")

def print_success(message):
    print(f"{Colors.OKGREEN}✓ {message}{Colors.ENDC}")

def print_error(message):
    print(f"{Colors.FAIL}✗ {message}{Colors.ENDC}")

def print_warning(message):
    print(f"{Colors.WARNING}⚠ {message}{Colors.ENDC}")

def login_user():
    """Login and get authentication token"""
    print_test("User Authentication")
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        token = data.get('access_token')
        print_success(f"Logged in successfully")
        return token
    else:
        print_error(f"Login failed: {response.json().get('message')}")
        return None

def test_get_styles(token):
    """Test fetching available CV styles"""
    print_test("Get Available CV Styles")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/cv-builder/styles", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        styles = data.get('data', [])
        print_success(f"Retrieved {len(styles)} CV styles")
        for style in styles:
            print(f"  • {style['name']}: {style['description']}")
        return True
    else:
        print_error(f"Failed to get styles: {response.json()}")
        return False

def test_get_user_data(token):
    """Test fetching user CV data"""
    print_test("Get User CV Data")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/cv-builder/user-data", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        user_data = data.get('data', {})
        print_success("Retrieved user profile data")
        print(f"  • Name: {user_data.get('first_name')} {user_data.get('last_name')}")
        print(f"  • Email: {user_data.get('email')}")
        print(f"  • Work Experiences: {len(user_data.get('work_experiences', []))}")
        print(f"  • Education: {len(user_data.get('educations', []))}")
        print(f"  • Projects: {len(user_data.get('projects', []))}")
        return True
    else:
        print_error(f"Failed to get user data: {response.json()}")
        return False

def test_generate_cv(token, style='professional', job_id=None, custom_job=None):
    """Test CV generation"""
    test_name = f"Generate CV ({style} style"
    if job_id:
        test_name += f", job_id={job_id}"
    elif custom_job:
        test_name += f", custom job: {custom_job['title']}"
    else:
        test_name += ", general"
    test_name += ")"
    
    print_test(test_name)
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "style": style,
        "sections": ["work", "education", "skills", "summary", "projects", "certifications"]
    }
    
    if job_id:
        payload["job_id"] = job_id
    elif custom_job:
        payload["job_data"] = custom_job
    
    print(f"  Payload: {json.dumps(payload, indent=2)}")
    
    response = requests.post(
        f"{BASE_URL}/api/cv-builder/generate",
        headers=headers,
        json=payload
    )
    
    if response.status_code == 200:
        data = response.json()
        cv_content = data.get('data', {}).get('cv_content', {})
        print_success("CV generated successfully!")
        
        # Validate CV structure
        required_fields = ['contact_information', 'professional_summary', 'ats_score', 'optimization_tips']
        missing_fields = [field for field in required_fields if field not in cv_content]
        
        if missing_fields:
            print_warning(f"Missing fields: {', '.join(missing_fields)}")
        else:
            print_success("All required fields present")
        
        # Show ATS score
        ats_score = cv_content.get('ats_score', {})
        score = ats_score.get('estimated_score', 0)
        print(f"\n  📊 ATS Score: {score}/100")
        
        strengths = ats_score.get('strengths', [])
        if strengths:
            print(f"\n  ✓ Strengths ({len(strengths)}):")
            for strength in strengths[:3]:
                print(f"    • {strength}")
        
        improvements = ats_score.get('improvements', [])
        if improvements:
            print(f"\n  ⚠ Improvements ({len(improvements)}):")
            for improvement in improvements[:3]:
                print(f"    • {improvement}")
        
        # Show optimization tips
        tips = cv_content.get('optimization_tips', [])
        if tips:
            print(f"\n  💡 Optimization Tips ({len(tips)}):")
            for tip in tips[:3]:
                print(f"    • {tip}")
        
        print(f"\n  📄 CV Sections:")
        for section in ['professional_experience', 'education', 'technical_skills', 'certifications', 'projects']:
            if section in cv_content:
                content = cv_content[section]
                if isinstance(content, list):
                    print(f"    • {section}: {len(content)} items")
                elif isinstance(content, dict):
                    print(f"    • {section}: {len(content)} categories")
                else:
                    print(f"    • {section}: present")
        
        return cv_content
    else:
        print_error(f"CV generation failed: {response.json()}")
        return None

def test_all_styles(token):
    """Test CV generation with all available styles"""
    print_header("Testing All CV Styles")
    
    styles = ['professional', 'modern', 'creative', 'minimal', 'executive']
    results = []
    
    for style in styles:
        cv_content = test_generate_cv(token, style=style)
        results.append((style, cv_content is not None))
        print()
    
    print_header("Style Test Results")
    for style, success in results:
        if success:
            print_success(f"{style.capitalize()}: ✓")
        else:
            print_error(f"{style.capitalize()}: ✗")

def test_custom_job(token):
    """Test CV generation with custom job details"""
    print_header("Testing Custom Job Tailoring")
    
    custom_job = {
        "title": "Senior Full Stack Developer",
        "company_name": "TechCorp Inc.",
        "description": "We are seeking an experienced Full Stack Developer to join our team. You will work on cutting-edge web applications using React, Node.js, and PostgreSQL.",
        "requirements": "5+ years of experience with JavaScript, React, Node.js, PostgreSQL, AWS, Docker, and Kubernetes. Strong problem-solving skills and excellent communication abilities.",
        "experience_level": "Senior",
        "category": "Software Development"
    }
    
    cv_content = test_generate_cv(token, style='professional', custom_job=custom_job)
    
    if cv_content:
        print("\n" + "="*80)
        print_success("Custom job tailoring successful!")
        
        # Check if job keywords appear in CV
        summary = cv_content.get('professional_summary', '')
        keywords = ['React', 'Node', 'Full Stack', 'JavaScript']
        found_keywords = [kw for kw in keywords if kw.lower() in summary.lower()]
        
        print(f"\n  Keywords found in summary: {', '.join(found_keywords) if found_keywords else 'None'}")
        
        if len(found_keywords) >= 2:
            print_success("Good keyword optimization!")
        else:
            print_warning("Summary could include more job-specific keywords")

def test_error_cases(token):
    """Test error handling"""
    print_header("Testing Error Handling")
    
    # Test 1: Invalid style
    print_test("Invalid CV Style")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(
        f"{BASE_URL}/api/cv-builder/generate",
        headers=headers,
        json={"style": "invalid_style", "sections": ["work"]}
    )
    # Should still work (defaults to professional)
    if response.status_code == 200:
        print_success("Handled gracefully with default style")
    else:
        print_warning(f"Returned error: {response.status_code}")
    
    # Test 2: Empty sections
    print_test("Empty Sections Array")
    response = requests.post(
        f"{BASE_URL}/api/cv-builder/generate",
        headers=headers,
        json={"style": "professional", "sections": []}
    )
    if response.status_code in [200, 400]:
        print_success("Handled empty sections")
    else:
        print_error(f"Unexpected error: {response.status_code}")
    
    # Test 3: Invalid job_id
    print_test("Invalid Job ID")
    response = requests.post(
        f"{BASE_URL}/api/cv-builder/generate",
        headers=headers,
        json={"style": "professional", "sections": ["work"], "job_id": 999999}
    )
    if response.status_code in [200, 404]:
        print_success("Handled invalid job_id")
    else:
        print_error(f"Unexpected error: {response.status_code}")

def main():
    print_header("CV Builder Comprehensive Test Suite")
    print(f"Target: {BASE_URL}")
    print(f"User: {TEST_USER_EMAIL}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Authenticate
    token = login_user()
    if not token:
        print_error("Authentication failed. Cannot proceed with tests.")
        return
    
    print()
    
    # Run tests
    test_get_styles(token)
    print()
    
    test_get_user_data(token)
    print()
    
    # Test single CV generation
    print_header("Testing Single CV Generation")
    test_generate_cv(token, style='professional')
    print()
    
    # Test all styles
    test_all_styles(token)
    print()
    
    # Test custom job
    test_custom_job(token)
    print()
    
    # Test error handling
    test_error_cases(token)
    print()
    
    print_header("Test Suite Complete!")
    print(f"{Colors.OKGREEN}All tests completed. Review results above for any issues.{Colors.ENDC}\n")

if __name__ == "__main__":
    main()
