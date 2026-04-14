#!/usr/bin/env python3
"""
Comprehensive API endpoint test script
Tests all employer company endpoints with proper authentication
"""

import subprocess
import time
import requests
import json
from datetime import datetime

# Configuration
BACKEND_URL = "http://localhost:5001"
PROXY_URL = "http://localhost:5173"
API_ENDPOINTS_TO_TEST = [
    "/api/my-company",
    "/api/my-company/settings/account",
    "/api/my-company/settings/security",
    "/api/my-company/settings/privacy",
    "/api/my-company/settings/billing",
    "/api/my-company/settings/notifications",
]

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def print_header(text):
    print(f"\n{Colors.BLUE}{'='*60}")
    print(f"{text}")
    print(f"{'='*60}{Colors.RESET}\n")

def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.RESET}")

def print_error(text):
    print(f"{Colors.RED}✗ {text}{Colors.RESET}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠ {text}{Colors.RESET}")

def check_port_listening(host, port):
    """Check if a port is listening"""
    try:
        result = subprocess.run(
            f"lsof -i :{port} 2>/dev/null | wc -l",
            shell=True,
            capture_output=True,
            text=True
        )
        return int(result.stdout.strip()) > 1
    except:
        return False

def test_backend_direct():
    """Test backend directly (port 5001)"""
    print_header("Testing Backend Direct Connection (5001)")
    
    if not check_port_listening("localhost", 5001):
        print_error("Backend not listening on port 5001")
        return False
    
    print_success("Backend is listening on port 5001")
    
    # Test health endpoint
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        print(f"Health endpoint: {Colors.YELLOW}{response.status_code}{Colors.RESET}")
        if response.status_code == 200:
            data = response.json()
            print_success(f"Backend healthy: {data.get('message')}")
            return True
        else:
            print_error(f"Health check failed with status {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Health check failed: {e}")
        return False

def test_vite_proxy():
    """Test Vite proxy configuration"""
    print_header("Testing Vite Proxy (5173)")
    
    if not check_port_listening("localhost", 5173):
        print_error("Vite dev server not listening on port 5173")
        return False
    
    print_success("Vite dev server is listening on port 5173")
    
    # Test proxy forwarding
    headers = {"Authorization": "Bearer test_token"}
    try:
        response = requests.get(
            f"{PROXY_URL}/api/my-company",
            headers=headers,
            timeout=5
        )
        print(f"Proxy test request status: {Colors.YELLOW}{response.status_code}{Colors.RESET}")
        
        if response.status_code in [200, 401, 404]:
            print_success(f"Proxy is forwarding requests correctly")
            if response.status_code == 401:
                print_warning("Response is 401 (Auth error) - this is expected without valid token")
            elif response.status_code == 404:
                print_error("Response is 404 - route might not exist!")
                print(f"Response: {response.text}")
                return False
            return True
        else:
            print_error(f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Proxy test failed: {e}")
        return False

def test_endpoints_directly(base_url, base_name):
    """Test all endpoints"""
    print_header(f"Testing API Endpoints ({base_name}) - {base_url}")
    
    successful = 0
    failed = 0
    
    # Test without token (should get 401 or error)
    headers = {"Authorization": "Bearer invalid_test_token"}
    
    for endpoint in API_ENDPOINTS_TO_TEST:
        try:
            response = requests.get(
                f"{base_url}{endpoint}",
                headers=headers,
                timeout=5
            )
            
            status = response.status_code
            status_color = Colors.YELLOW if status in [401, 403] else (Colors.RED if status >= 400 else Colors.GREEN)
            
            print(f"{endpoint:45} {status_color}{status}{Colors.RESET}", end="")
            
            if status == 404:
                print_error(f" ROUTE NOT FOUND")
                print(f"  Response: {response.text[:100]}")
                failed += 1
            elif status in [401, 403]:
                print_success(" (auth error - expected)")
                successful += 1
            elif status == 200:
                print_success(" (OK)")
                successful += 1
            else:
                print_warning(f" (unexpected status)")
                failed += 1
                
        except requests.exceptions.ConnectionError:
            print_error(f"{endpoint:45} CONNECTION REFUSED")
            failed += 1
        except Exception as e:
            print_error(f"{endpoint:45} ERROR: {str(e)[:50]}")
            failed += 1
    
    print(f"\nResults: {Colors.GREEN}{successful} passed{Colors.RESET}, {Colors.RED}{failed} failed{Colors.RESET}")
    return failed == 0

def check_frontend_config():
    """Check frontend configuration"""
    print_header("Checking Frontend Configuration")
    
    config_file = "/home/desire/My_Project/Client_Project/TalentSphere/talentsphere-frontend/src/config/environment.js"
    api_file = "/home/desire/My_Project/Client_Project/TalentSphere/talentsphere-frontend/src/ services/api.js"
    
    try:
        with open(config_file, 'r') as f:
            content = f.read()
            if "BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api'" in content:
                print_success("Frontend config correctly defaults to '/api'")
            else:
                print_warning("Frontend config BASE_URL might be overridden")
        
        with open(api_file, 'r') as f:
            content = f.read()
            if 'const API_BASE_URL = config.API.BASE_URL' in content:
                print_success("API service correctly uses config")
            else:
                print_error("API service might not be using correct config")
    except FileNotFoundError as e:
        print_error(f"Config file not found: {e}")

def check_vite_config():
    """Check Vite proxy configuration"""
    print_header("Checking Vite Proxy Configuration")
    
    vite_config = "/home/desire/My_Project/Client_Project/TalentSphere/talentsphere-frontend/vite.config.js"
    
    try:
        with open(vite_config, 'r') as f:
            content = f.read()
            if "'/api': {" in content and "'http://localhost:5001'" in content:
                print_success("Vite proxy configured to forward /api to backend")
                if "configure: (proxy, options)" in content:
                    print_success("Proxy logging configured")
            else:
                print_error("Vite proxy configuration might be missing")
    except FileNotFoundError as e:
        print_error(f"Vite config file not found: {e}")

def main():
    print(f"\n{Colors.BLUE}TalentSphere API Diagnostic Test{Colors.RESET}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Check configurations
    check_frontend_config()
    check_vite_config()
    
    # Test backend
    backend_ok = test_backend_direct()
    
    # Test Vite proxy
    proxy_ok = test_vite_proxy()
    
    # Test endpoints
    if backend_ok:
        test_endpoints_directly(BACKEND_URL, "Direct to Backend")
    
    if proxy_ok:
        test_endpoints_directly(PROXY_URL, "Through Vite Proxy")
    
    # Summary
    print_header("Summary")
    print("\n" + "="*60)
    print("KEY FINDINGS:")
    print("="*60)
    
    if backend_ok:
        print_success("Backend is running and responding")
    else:
        print_error("Backend is not responding")
    
    if proxy_ok:
        print_success("Vite proxy is forwarding requests")
    else:
        print_error("Vite proxy might have issues")
    
    print("\nNEXT STEPS:")
    if backend_ok and proxy_ok:
        print("1. Ensure you are logged in (valid token in localStorage)")
        print("2. Open browser DevTools Network tab")
        print("3. Navigate to /employer/company/settings")
        print("4. Check the Network tab for API requests")
        print("5. Verify token is being sent in Authorization header")
    else:
        print("1. Fix backend or proxy issues first")
    
    print("\n")

if __name__ == "__main__":
    main()
