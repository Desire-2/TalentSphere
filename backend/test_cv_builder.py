#!/usr/bin/env python3
"""
Test script for AI CV Builder system
Tests the complete CV generation workflow with various scenarios
"""

import requests
import json
import os
from datetime import datetime

# Configuration
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:5001')
TEST_USER_EMAIL = os.getenv('TEST_USER_EMAIL', 'bikorimanadesire5@gmail.com')
TEST_USER_PASSWORD = os.getenv('TEST_USER_PASSWORD', 'Desire@#1')

class CVBuilderTester:
    def __init__(self):
        self.base_url = API_BASE_URL
        self.token = None
        self.user_data = None
        
    def print_section(self, title):
        """Print formatted section header"""
        print("\n" + "="*70)
        print(f"  {title}")
        print("="*70 + "\n")
    
    def print_success(self, message):
        """Print success message"""
        print(f"✅ {message}")
    
    def print_error(self, message):
        """Print error message"""
        print(f"❌ {message}")
    
    def print_info(self, message):
        """Print info message"""
        print(f"ℹ️  {message}")
    
    def login(self):
        """Authenticate test user"""
        self.print_section("Authentication Test")
        
        try:
            response = requests.post(
                f"{self.base_url}/api/auth/login",
                json={
                    'email': TEST_USER_EMAIL,
                    'password': TEST_USER_PASSWORD
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('token')
                self.user_data = data.get('user')
                self.print_success(f"Logged in as {self.user_data.get('email')}")
                return True
            else:
                self.print_error(f"Login failed: {response.status_code}")
                print(response.text)
                return False
                
        except Exception as e:
            self.print_error(f"Login error: {str(e)}")
            return False
    
    def get_headers(self):
        """Get authorization headers"""
        return {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
    
    def test_get_user_data(self):
        """Test retrieving user CV data"""
        self.print_section("Test: Get User CV Data")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/cv-builder/user-data",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    user_data = data.get('data', {})
                    self.print_success("User CV data retrieved successfully")
                    self.print_info(f"Work experiences: {len(user_data.get('work_experiences', []))}")
                    self.print_info(f"Education entries: {len(user_data.get('educations', []))}")
                    self.print_info(f"Certifications: {len(user_data.get('certifications', []))}")
                    self.print_info(f"Projects: {len(user_data.get('projects', []))}")
                    return True, user_data
                else:
                    self.print_error(f"Failed: {data.get('message')}")
                    return False, None
            else:
                self.print_error(f"Request failed: {response.status_code}")
                print(response.text)
                return False, None
                
        except Exception as e:
            self.print_error(f"Error: {str(e)}")
            return False, None
    
    def test_get_styles(self):
        """Test retrieving available CV styles"""
        self.print_section("Test: Get Available CV Styles")
        
        try:
            response = requests.get(f"{self.base_url}/api/cv-builder/styles")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    styles = data.get('data', [])
                    self.print_success(f"Retrieved {len(styles)} CV styles")
                    for style in styles:
                        print(f"  • {style['name']}: {style['description']}")
                    return True, styles
                else:
                    self.print_error(f"Failed: {data.get('message')}")
                    return False, None
            else:
                self.print_error(f"Request failed: {response.status_code}")
                return False, None
                
        except Exception as e:
            self.print_error(f"Error: {str(e)}")
            return False, None
    
    def test_generate_general_cv(self):
        """Test generating a general CV without specific job"""
        self.print_section("Test: Generate General CV")
        
        try:
            payload = {
                'style': 'professional',
                'sections': ['work', 'education', 'skills', 'summary', 'projects', 'certifications']
            }
            
            self.print_info("Generating general CV with professional style...")
            
            response = requests.post(
                f"{self.base_url}/api/cv-builder/quick-generate",
                headers=self.get_headers(),
                json=payload
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    cv_data = data.get('data', {})
                    cv_content = cv_data.get('cv_content', {})
                    
                    self.print_success("General CV generated successfully")
                    
                    # Display CV details
                    contact = cv_content.get('contact_information', {})
                    self.print_info(f"Name: {contact.get('full_name')}")
                    self.print_info(f"Title: {contact.get('professional_title')}")
                    
                    summary = cv_content.get('professional_summary', '')
                    self.print_info(f"Summary length: {len(summary)} characters")
                    
                    experience = cv_content.get('professional_experience', [])
                    self.print_info(f"Experience entries: {len(experience)}")
                    
                    education = cv_content.get('education', [])
                    self.print_info(f"Education entries: {len(education)}")
                    
                    competencies = cv_content.get('core_competencies', [])
                    self.print_info(f"Core competencies: {len(competencies)}")
                    
                    # ATS Score
                    ats_score = cv_content.get('ats_score', {})
                    if ats_score:
                        self.print_info(f"ATS Score: {ats_score.get('estimated_score')}%")
                    
                    return True, cv_content
                else:
                    self.print_error(f"Failed: {data.get('message')}")
                    return False, None
            else:
                self.print_error(f"Request failed: {response.status_code}")
                print(response.text)
                return False, None
                
        except Exception as e:
            self.print_error(f"Error: {str(e)}")
            return False, None
    
    def test_generate_tailored_cv(self):
        """Test generating CV tailored to specific job"""
        self.print_section("Test: Generate Job-Tailored CV")
        
        try:
            payload = {
                'job_data': {
                    'title': 'Senior Full Stack Developer',
                    'company_name': 'Tech Innovators Inc.',
                    'description': 'We are seeking an experienced Full Stack Developer to join our team. You will work on cutting-edge projects using React, Node.js, and cloud technologies.',
                    'requirements': 'Requirements: 5+ years experience with React and Node.js, Strong knowledge of AWS or Azure, Experience with microservices architecture, Excellent problem-solving skills'
                },
                'style': 'modern',
                'sections': ['work', 'education', 'skills', 'summary', 'projects', 'certifications']
            }
            
            self.print_info("Generating CV tailored for Senior Full Stack Developer position...")
            
            response = requests.post(
                f"{self.base_url}/api/cv-builder/quick-generate",
                headers=self.get_headers(),
                json=payload
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    cv_data = data.get('data', {})
                    cv_content = cv_data.get('cv_content', {})
                    
                    self.print_success("Tailored CV generated successfully")
                    
                    # Display optimization info
                    metadata = cv_content.get('metadata', {})
                    self.print_info(f"Tailored for: {metadata.get('tailored_for_job')}")
                    
                    # Show optimization tips
                    tips = cv_content.get('optimization_tips', [])
                    if tips:
                        print("\n  Optimization Tips:")
                        for i, tip in enumerate(tips[:3], 1):
                            print(f"    {i}. {tip}")
                    
                    return True, cv_content
                else:
                    self.print_error(f"Failed: {data.get('message')}")
                    return False, None
            else:
                self.print_error(f"Request failed: {response.status_code}")
                print(response.text)
                return False, None
                
        except Exception as e:
            self.print_error(f"Error: {str(e)}")
            return False, None
    
    def test_different_styles(self):
        """Test generating CVs with different styles"""
        self.print_section("Test: Generate CVs with Different Styles")
        
        styles = ['professional', 'creative', 'modern', 'minimal', 'executive']
        results = {}
        
        for style in styles:
            try:
                self.print_info(f"Testing {style} style...")
                
                payload = {
                    'style': style,
                    'sections': ['work', 'education', 'skills', 'summary']
                }
                
                response = requests.post(
                    f"{self.base_url}/api/cv-builder/quick-generate",
                    headers=self.get_headers(),
                    json=payload
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success'):
                        results[style] = True
                        self.print_success(f"{style.capitalize()} style CV generated")
                    else:
                        results[style] = False
                        self.print_error(f"{style.capitalize()} style failed: {data.get('message')}")
                else:
                    results[style] = False
                    self.print_error(f"{style.capitalize()} style request failed")
                    
            except Exception as e:
                results[style] = False
                self.print_error(f"{style.capitalize()} style error: {str(e)}")
        
        # Summary
        successful = sum(1 for v in results.values() if v)
        print(f"\n  Summary: {successful}/{len(styles)} styles generated successfully")
        
        return all(results.values()), results
    
    def test_html_preview(self, cv_content):
        """Test HTML preview generation"""
        self.print_section("Test: HTML Preview Generation")
        
        try:
            payload = {
                'cv_content': cv_content,
                'style': 'professional'
            }
            
            response = requests.post(
                f"{self.base_url}/api/cv-builder/preview-html",
                headers=self.get_headers(),
                json=payload
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    html = data.get('data', {}).get('html', '')
                    self.print_success(f"HTML preview generated ({len(html)} characters)")
                    
                    # Check for key HTML elements
                    has_doctype = '<!DOCTYPE html>' in html
                    has_head = '<head>' in html
                    has_body = '<body>' in html
                    has_styles = '<style>' in html
                    
                    self.print_info(f"Valid HTML structure: {has_doctype and has_head and has_body}")
                    self.print_info(f"Contains CSS: {has_styles}")
                    
                    return True, html
                else:
                    self.print_error(f"Failed: {data.get('message')}")
                    return False, None
            else:
                self.print_error(f"Request failed: {response.status_code}")
                return False, None
                
        except Exception as e:
            self.print_error(f"Error: {str(e)}")
            return False, None
    
    def run_all_tests(self):
        """Run all CV builder tests"""
        print("\n" + "="*70)
        print("  TalentSphere AI CV Builder - Comprehensive Test Suite")
        print("="*70)
        print(f"  Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"  API URL: {self.base_url}")
        print("="*70)
        
        results = {}
        
        # Authentication
        if not self.login():
            self.print_error("Authentication failed. Cannot proceed with tests.")
            return
        
        # Test 1: Get user data
        success, user_data = self.test_get_user_data()
        results['get_user_data'] = success
        
        # Test 2: Get available styles
        success, styles = self.test_get_styles()
        results['get_styles'] = success
        
        # Test 3: Generate general CV
        success, cv_content = self.test_generate_general_cv()
        results['generate_general_cv'] = success
        
        # Test 4: Generate tailored CV
        success, tailored_cv = self.test_generate_tailored_cv()
        results['generate_tailored_cv'] = success
        
        # Test 5: Different styles
        success, style_results = self.test_different_styles()
        results['different_styles'] = success
        
        # Test 6: HTML preview (if we have CV content)
        if cv_content:
            success, html = self.test_html_preview(cv_content)
            results['html_preview'] = success
        
        # Final Summary
        self.print_section("Test Summary")
        
        passed = sum(1 for v in results.values() if v)
        total = len(results)
        
        print(f"Tests Passed: {passed}/{total}")
        print("\nDetailed Results:")
        for test_name, passed in results.items():
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"  {test_name}: {status}")
        
        if passed == total:
            print("\n🎉 All tests passed! CV Builder system is working correctly.")
        else:
            print(f"\n⚠️  {total - passed} test(s) failed. Please review the errors above.")
        
        return results


if __name__ == '__main__':
    tester = CVBuilderTester()
    tester.run_all_tests()
