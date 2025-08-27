#!/usr/bin/env python3
"""
Test script for the Job Seeker Profile System
This script verifies that all components and APIs are properly configured
"""

import os
import sys

def check_file_exists(file_path):
    """Check if a file exists and is not empty"""
    if os.path.exists(file_path):
        file_size = os.path.getsize(file_path)
        return file_size > 0
    return False

def test_frontend_components():
    """Test if all frontend components exist"""
    print("🧪 Testing Frontend Components...")
    
    components = [
        "talentsphere-frontend/src/pages/jobseeker/JobSeekerProfile.jsx",
        "talentsphere-frontend/src/pages/jobseeker/ProfileSettings.jsx",
        "talentsphere-frontend/src/pages/jobseeker/ApplicationsDashboard.jsx",
        "talentsphere-frontend/src/components/ui/switch.jsx"
    ]
    
    for component in components:
        if check_file_exists(component):
            print(f"✅ {component}")
        else:
            print(f"❌ {component}")
    
    # Check if App.jsx has been updated with routes
    app_jsx_path = "talentsphere-frontend/src/App.jsx"
    if check_file_exists(app_jsx_path):
        with open(app_jsx_path, 'r') as f:
            content = f.read()
            if 'jobseeker/profile' in content and 'JobSeekerProfile' in content:
                print("✅ App.jsx routes updated")
            else:
                print("❌ App.jsx routes not updated")

def test_backend_routes():
    """Test if backend routes exist"""
    print("\n🧪 Testing Backend Routes...")
    
    routes = [
        "backend/src/routes/user.py",
        "backend/src/routes/auth.py"
    ]
    
    for route in routes:
        if check_file_exists(route):
            print(f"✅ {route}")
        else:
            print(f"❌ {route}")

def test_api_service():
    """Test if API service has been updated"""
    print("\n🧪 Testing API Service...")
    
    api_service_path = "talentsphere-frontend/src/services/api.js"
    if check_file_exists(api_service_path):
        with open(api_service_path, 'r') as f:
            content = f.read()
            methods = [
                'getJobSeekerProfile',
                'updateJobSeekerProfile',
                'changePassword',
                'getNotificationPreferences',
                'updateNotificationPreferences',
                'getPrivacySettings',
                'updatePrivacySettings'
            ]
            
            missing_methods = []
            for method in methods:
                if method in content:
                    print(f"✅ {method}")
                else:
                    print(f"❌ {method}")
                    missing_methods.append(method)
            
            if not missing_methods:
                print("✅ All API methods present")
            else:
                print(f"❌ Missing API methods: {missing_methods}")

def test_requirements():
    """Test if requirements.txt has necessary dependencies"""
    print("\n🧪 Testing Backend Requirements...")
    
    req_path = "backend/requirements.txt"
    if check_file_exists(req_path):
        with open(req_path, 'r') as f:
            content = f.read()
            required_deps = [
                'flask-jwt-extended',
                'flask-bcrypt',
                'PyJWT',
                'bcrypt'
            ]
            
            for dep in required_deps:
                if dep in content:
                    print(f"✅ {dep}")
                else:
                    print(f"❌ {dep}")

def print_setup_instructions():
    """Print setup instructions"""
    print("\n📋 Setup Instructions:")
    print("1. Install backend dependencies:")
    print("   cd backend && pip install -r requirements.txt")
    print("\n2. Install frontend dependencies:")
    print("   cd talentsphere-frontend && npm install")
    print("\n3. Start the backend server:")
    print("   cd backend && python src/main.py")
    print("\n4. Start the frontend development server:")
    print("   cd talentsphere-frontend && npm run dev")
    print("\n5. Navigate to job seeker profile pages:")
    print("   - /jobseeker/profile")
    print("   - /jobseeker/settings")
    print("   - /jobseeker/applications")

def main():
    print("🚀 Job Seeker Profile System Test")
    print("=" * 50)
    
    # Change to project directory
    project_dir = "/home/desire/My_Project/TalentSphere"
    if os.path.exists(project_dir):
        os.chdir(project_dir)
        print(f"📁 Working directory: {project_dir}")
    else:
        print(f"❌ Project directory not found: {project_dir}")
        return
    
    test_frontend_components()
    test_backend_routes()
    test_api_service()
    test_requirements()
    print_setup_instructions()
    
    print("\n✨ Test completed!")

if __name__ == "__main__":
    main()
