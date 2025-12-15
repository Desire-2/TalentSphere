#!/usr/bin/env python3
"""
Comprehensive Password Reset System Test Script
Tests the complete password reset flow including email delivery
"""

import requests
import json
import sys
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5001/api"
TEST_EMAIL = "test@example.com"  # Change this to a real email for email testing
TEST_PASSWORD = "OldPassword123"
NEW_PASSWORD = "NewPassword123"

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

def print_header(message):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{message.center(60)}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}\n")

def print_success(message):
    print(f"{Colors.OKGREEN}✅ {message}{Colors.ENDC}")

def print_error(message):
    print(f"{Colors.FAIL}❌ {message}{Colors.ENDC}")

def print_info(message):
    print(f"{Colors.OKBLUE}ℹ️  {message}{Colors.ENDC}")

def print_warning(message):
    print(f"{Colors.WARNING}⚠️  {message}{Colors.ENDC}")

def test_forgot_password():
    """Test the forgot password endpoint"""
    print_header("Testing Forgot Password Endpoint")
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/forgot-password",
            json={"email": TEST_EMAIL},
            headers={"Content-Type": "application/json"}
        )
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print_success("Forgot password request successful")
                
                if data.get('email_sent'):
                    print_success("Email was sent successfully")
                else:
                    print_warning("Email was not sent (check SMTP configuration)")
                
                return True
            else:
                print_error(f"Request failed: {data.get('message', 'Unknown error')}")
                return False
        else:
            print_error(f"HTTP Error: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print_error("Connection error - Is the backend server running?")
        print_info(f"Attempting to connect to: {BASE_URL}")
        return False
    except Exception as e:
        print_error(f"Exception: {str(e)}")
        return False

def test_verify_reset_token(token):
    """Test the verify reset token endpoint"""
    print_header("Testing Verify Reset Token Endpoint")
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/verify-reset-token",
            json={"token": token},
            headers={"Content-Type": "application/json"}
        )
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('valid'):
                print_success("Token is valid")
                print_info(f"User: {data.get('name')} ({data.get('email')})")
                return True
            else:
                print_error(f"Token is invalid: {data.get('message')}")
                return False
        else:
            print_error(f"HTTP Error: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Exception: {str(e)}")
        return False

def test_reset_password(token):
    """Test the reset password endpoint"""
    print_header("Testing Reset Password Endpoint")
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/reset-password",
            json={
                "token": token,
                "password": NEW_PASSWORD,
                "confirm_password": NEW_PASSWORD
            },
            headers={"Content-Type": "application/json"}
        )
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print_success("Password reset successful")
                return True
            else:
                print_error(f"Reset failed: {data.get('message', 'Unknown error')}")
                return False
        else:
            print_error(f"HTTP Error: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Exception: {str(e)}")
        return False

def test_invalid_scenarios():
    """Test various invalid scenarios"""
    print_header("Testing Invalid Scenarios")
    
    tests = [
        {
            "name": "Invalid email format",
            "endpoint": "/auth/forgot-password",
            "data": {"email": "invalid-email"},
            "expected_status": 400
        },
        {
            "name": "Missing email",
            "endpoint": "/auth/forgot-password",
            "data": {},
            "expected_status": 400
        },
        {
            "name": "Invalid reset token",
            "endpoint": "/auth/reset-password",
            "data": {
                "token": "invalid-token-12345",
                "password": "NewPassword123",
                "confirm_password": "NewPassword123"
            },
            "expected_status": 400
        },
        {
            "name": "Password mismatch",
            "endpoint": "/auth/reset-password",
            "data": {
                "token": "some-token",
                "password": "Password123",
                "confirm_password": "DifferentPassword123"
            },
            "expected_status": 400
        },
        {
            "name": "Weak password",
            "endpoint": "/auth/reset-password",
            "data": {
                "token": "some-token",
                "password": "weak",
                "confirm_password": "weak"
            },
            "expected_status": 400
        }
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        print(f"\n{Colors.OKCYAN}Testing: {test['name']}{Colors.ENDC}")
        
        try:
            response = requests.post(
                f"{BASE_URL}{test['endpoint']}",
                json=test['data'],
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == test['expected_status']:
                print_success(f"Expected status {test['expected_status']} received")
                passed += 1
            else:
                print_error(f"Expected {test['expected_status']}, got {response.status_code}")
                failed += 1
                
        except Exception as e:
            print_error(f"Exception: {str(e)}")
            failed += 1
    
    print(f"\n{Colors.BOLD}Invalid Scenarios Test Results:{Colors.ENDC}")
    print(f"{Colors.OKGREEN}Passed: {passed}{Colors.ENDC}")
    print(f"{Colors.FAIL}Failed: {failed}{Colors.ENDC}")
    
    return passed, failed

def main():
    """Main test runner"""
    print_header("Password Reset System Test Suite")
    print_info(f"Testing against: {BASE_URL}")
    print_info(f"Test email: {TEST_EMAIL}")
    print_info(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test 1: Forgot Password
    forgot_success = test_forgot_password()
    
    if not forgot_success:
        print_error("\nForgot password test failed. Check if backend is running.")
        sys.exit(1)
    
    # Test 2: Invalid Scenarios
    passed, failed = test_invalid_scenarios()
    
    # Test 3: Manual token testing (if user provides a token)
    print_header("Manual Token Testing")
    print_info("To test the complete flow:")
    print_info("1. Check your email for the reset link")
    print_info("2. Extract the token from the URL")
    print_info("3. Run this script with the token as an argument:")
    print_info(f"   python {sys.argv[0]} <your-token-here>")
    
    if len(sys.argv) > 1:
        token = sys.argv[1]
        print_info(f"\nTesting with provided token: {token[:20]}...")
        
        # Verify token
        if test_verify_reset_token(token):
            # Reset password
            test_reset_password(token)
    
    # Summary
    print_header("Test Summary")
    print_info(f"Forgot Password: {'✅ Passed' if forgot_success else '❌ Failed'}")
    print_info(f"Invalid Scenarios: {passed} passed, {failed} failed")
    
    if forgot_success and failed == 0:
        print_success("\n🎉 All automated tests passed!")
        print_info("Check your email and test the complete flow manually.")
    else:
        print_warning("\n⚠️  Some tests failed. Check the logs above for details.")

if __name__ == "__main__":
    main()
