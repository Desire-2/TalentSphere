#!/usr/bin/env python3
"""
Test script to verify Job Seeker Profile integration
Tests all profile endpoints and data structures
"""
import os
import sys
import json
import requests

# Configuration
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:5001/api')
TEST_EMAIL = 'testjobseeker@example.com'
TEST_PASSWORD = 'TestPassword123!'

class ProfileTester:
    def __init__(self):
        self.token = None
        self.user = None
        self.base_url = API_BASE_URL
        
    def log(self, message, status='INFO'):
        symbols = {
            'INFO': '📝',
            'SUCCESS': '✅',
            'ERROR': '❌',
            'WARNING': '⚠️',
            'TEST': '🧪'
        }
        print(f"{symbols.get(status, '•')} {message}")
    
    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make an API request with proper headers"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            
            if response.status_code == expected_status:
                self.log(f"{method} {endpoint} - SUCCESS ({response.status_code})", 'SUCCESS')
                return response.json() if response.content else None
            else:
                self.log(f"{method} {endpoint} - FAILED ({response.status_code}): {response.text}", 'ERROR')
                return None
        except Exception as e:
            self.log(f"{method} {endpoint} - EXCEPTION: {e}", 'ERROR')
            return None
    
    def test_auth(self):
        """Test authentication"""
        self.log("Testing Authentication...", 'TEST')
        
        # Login
        login_data = {'email': TEST_EMAIL, 'password': TEST_PASSWORD}
        response = self.make_request('POST', '/auth/login', login_data)
        
        if response and 'token' in response:
            self.token = response['token']
            self.user = response.get('user', {})
            self.log(f"Logged in as: {self.user.get('email')}", 'SUCCESS')
            return True
        else:
            self.log("Login failed - trying to register", 'WARNING')
            # Try registration
            register_data = {
                'email': TEST_EMAIL,
                'password': TEST_PASSWORD,
                'first_name': 'Test',
                'last_name': 'JobSeeker',
                'role': 'job_seeker'
            }
            response = self.make_request('POST', '/auth/register', register_data, expected_status=201)
            if response and 'token' in response:
                self.token = response['token']
                self.user = response.get('user', {})
                self.log(f"Registered and logged in as: {self.user.get('email')}", 'SUCCESS')
                return True
        
        return False
    
    def test_get_profile(self):
        """Test getting profile data"""
        self.log("Testing GET /auth/profile...", 'TEST')
        profile = self.make_request('GET', '/auth/profile')
        
        if profile:
            self.log("Profile fields present:", 'INFO')
            self.log(f"  - Basic: first_name, last_name, email", 'INFO')
            if 'job_seeker_profile' in profile:
                jsp = profile['job_seeker_profile']
                self.log(f"  - JobSeekerProfile ID: {jsp.get('id')}", 'INFO')
                self.log(f"  - Fields: {', '.join(jsp.keys())}", 'INFO')
                
                # Check for new fields
                new_fields = ['technical_skills', 'career_level', 'notice_period', 'professional_title']
                present = [f for f in new_fields if f in jsp]
                missing = [f for f in new_fields if f not in jsp]
                
                if present:
                    self.log(f"  - New fields present: {', '.join(present)}", 'SUCCESS')
                if missing:
                    self.log(f"  - New fields missing: {', '.join(missing)}", 'WARNING')
            return profile
        return None
    
    def test_update_profile(self):
        """Test updating profile"""
        self.log("Testing PUT /auth/profile...", 'TEST')
        
        update_data = {
            'professional_title': 'Senior Python Developer',
            'professional_summary': 'Experienced Python developer with expertise in Flask and Django',
            'career_level': 'senior',
            'notice_period': '2-weeks',
            'technical_skills': ['Python', 'Flask', 'PostgreSQL', 'React'],
            'soft_skills': ['Communication', 'Leadership', 'Problem Solving'],
            'desired_position': 'Senior Backend Developer',
            'years_of_experience': 5,
            'education_level': 'bachelors',
            'willing_to_relocate': True,
            'profile_visibility': 'public'
        }
        
        response = self.make_request('PUT', '/auth/profile', update_data)
        return response is not None
    
    def test_profile_extensions(self):
        """Test profile extensions endpoints"""
        self.log("Testing Profile Extensions...", 'TEST')
        
        # Test work experience
        work_exp_data = {
            'job_title': 'Python Developer',
            'company_name': 'Tech Corp',
            'start_date': '2020-01-01',
            'is_current': True,
            'description': 'Developing web applications',
            'technologies_used': ['Python', 'Flask', 'PostgreSQL']
        }
        work_exp = self.make_request('POST', '/profile/work-experience', work_exp_data, expected_status=201)
        
        # Test education
        edu_data = {
            'institution_name': 'University of Technology',
            'degree_type': 'bachelor',
            'field_of_study': 'Computer Science',
            'start_date': '2015-09-01',
            'graduation_date': '2019-06-01'
        }
        education = self.make_request('POST', '/profile/education', edu_data, expected_status=201)
        
        # Test certifications
        cert_data = {
            'name': 'AWS Certified Developer',
            'issuing_organization': 'Amazon Web Services',
            'issue_date': '2021-03-15',
            'does_not_expire': False
        }
        cert = self.make_request('POST', '/profile/certifications', cert_data, expected_status=201)
        
        # Get complete profile
        self.log("Testing GET /profile/complete-profile...", 'TEST')
        complete = self.make_request('GET', '/profile/complete-profile')
        if complete:
            self.log(f"  - Work Experiences: {len(complete.get('work_experiences', []))}", 'INFO')
            self.log(f"  - Educations: {len(complete.get('educations', []))}", 'INFO')
            self.log(f"  - Certifications: {len(complete.get('certifications', []))}", 'INFO')
        
        return True
    
    def run_all_tests(self):
        """Run all tests"""
        print("\n" + "=" * 60)
        print("  Job Seeker Profile Integration Tests")
        print("=" * 60 + "\n")
        
        if not self.test_auth():
            self.log("Authentication failed - cannot proceed", 'ERROR')
            return False
        
        print()
        self.test_get_profile()
        
        print()
        self.test_update_profile()
        
        print()
        self.test_get_profile()  # Check updated data
        
        print()
        self.test_profile_extensions()
        
        print("\n" + "=" * 60)
        self.log("All tests completed!", 'SUCCESS')
        print("=" * 60 + "\n")

if __name__ == '__main__':
    tester = ProfileTester()
    tester.run_all_tests()
