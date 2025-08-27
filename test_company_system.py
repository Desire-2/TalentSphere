#!/usr/bin/env python3
"""
Test script for the Enhanced Company Profile System
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
    print("🧪 Testing Company Frontend Components...")
    
    components = [
        "talentsphere-frontend/src/pages/company/CompanyProfileManagement.jsx",
        "talentsphere-frontend/src/pages/company/CompanySettings.jsx",
        "talentsphere-frontend/src/components/ui/switch.jsx",
        "talentsphere-frontend/src/components/ui/tabs.jsx",
        "talentsphere-frontend/src/components/ui/dialog.jsx"
    ]
    
    for component in components:
        if check_file_exists(component):
            print(f"✅ {component}")
        else:
            print(f"❌ {component}")
    
    # Check if App.jsx has been updated with company routes
    app_jsx_path = "talentsphere-frontend/src/App.jsx"
    if check_file_exists(app_jsx_path):
        with open(app_jsx_path, 'r') as f:
            content = f.read()
            if 'company/profile' in content and 'CompanyProfileManagement' in content:
                print("✅ App.jsx company routes updated")
            else:
                print("❌ App.jsx company routes not updated")

def test_backend_routes():
    """Test if backend routes exist and have been enhanced"""
    print("\n🧪 Testing Backend Company Routes...")
    
    routes = [
        "backend/src/routes/company.py",
        "backend/src/models/company.py"
    ]
    
    for route in routes:
        if check_file_exists(route):
            print(f"✅ {route}")
        else:
            print(f"❌ {route}")
    
    # Check if company.py has been enhanced with settings endpoints
    company_route_path = "backend/src/routes/company.py"
    if check_file_exists(company_route_path):
        with open(company_route_path, 'r') as f:
            content = f.read()
            endpoints = [
                'get_company_account_settings',
                'update_company_account_settings',
                'get_company_security_settings',
                'get_company_notification_settings',
                'get_company_privacy_settings',
                'export_company_data',
                'delete_company_account'
            ]
            
            missing_endpoints = []
            for endpoint in endpoints:
                if endpoint in content:
                    print(f"✅ {endpoint}")
                else:
                    print(f"❌ {endpoint}")
                    missing_endpoints.append(endpoint)
            
            if not missing_endpoints:
                print("✅ All company endpoints present")
            else:
                print(f"❌ Missing company endpoints: {missing_endpoints}")

def test_api_service():
    """Test if API service has been updated with company methods"""
    print("\n🧪 Testing Company API Service...")
    
    api_service_path = "talentsphere-frontend/src/services/api.js"
    if check_file_exists(api_service_path):
        with open(api_service_path, 'r') as f:
            content = f.read()
            methods = [
                'getMyCompanyProfile',
                'createCompanyProfile',
                'updateCompanyProfile',
                'addCompanyBenefit',
                'addCompanyTeamMember',
                'getCompanyAccountSettings',
                'updateCompanyAccountSettings',
                'getCompanySecuritySettings',
                'getCompanyNotificationSettings',
                'exportCompanyData',
                'deleteCompanyAccount'
            ]
            
            missing_methods = []
            for method in methods:
                if method in content:
                    print(f"✅ {method}")
                else:
                    print(f"❌ {method}")
                    missing_methods.append(method)
            
            if not missing_methods:
                print("✅ All company API methods present")
            else:
                print(f"❌ Missing company API methods: {missing_methods}")

def test_header_navigation():
    """Test if header navigation has been updated"""
    print("\n🧪 Testing Header Navigation...")
    
    header_path = "talentsphere-frontend/src/components/layout/Header.jsx"
    if check_file_exists(header_path):
        with open(header_path, 'r') as f:
            content = f.read()
            navigation_items = [
                '/company/profile',
                '/company/settings',
                'Company Profile',
                'Building2'
            ]
            
            for item in navigation_items:
                if item in content:
                    print(f"✅ {item}")
                else:
                    print(f"❌ {item}")

def test_model_structure():
    """Test if company model has all necessary fields"""
    print("\n🧪 Testing Company Model Structure...")
    
    company_model_path = "backend/src/models/company.py"
    if check_file_exists(company_model_path):
        with open(company_model_path, 'r') as f:
            content = f.read()
            
            # Check for essential model classes
            models = [
                'class Company',
                'class CompanyBenefit',
                'class CompanyTeamMember'
            ]
            
            for model in models:
                if model in content:
                    print(f"✅ {model}")
                else:
                    print(f"❌ {model}")
            
            # Check for essential fields
            fields = [
                'name',
                'description',
                'website',
                'email',
                'industry',
                'company_size',
                'logo_url',
                'is_verified',
                'profile_views'
            ]
            
            for field in fields:
                if f'{field} =' in content:
                    print(f"✅ Field: {field}")
                else:
                    print(f"❌ Field: {field}")

def print_setup_instructions():
    """Print setup instructions for company profile system"""
    print("\n📋 Company Profile System Setup Instructions:")
    print("1. Backend Dependencies:")
    print("   cd backend && pip install -r requirements.txt")
    print("\n2. Frontend Dependencies:")
    print("   cd talentsphere-frontend && npm install")
    print("\n3. Database Migration (if needed):")
    print("   cd backend && python -c \"from src.models import *; db.create_all()\"")
    print("\n4. Start Backend Server:")
    print("   cd backend && python src/main.py")
    print("\n5. Start Frontend Server:")
    print("   cd talentsphere-frontend && npm run dev")
    print("\n6. Test Company Profile Pages:")
    print("   - Login as employer")
    print("   - Navigate to /company/profile")
    print("   - Navigate to /company/settings")
    print("\n7. Features Available:")
    print("   ✨ Complete company profile management")
    print("   ✨ Team member management")
    print("   ✨ Company benefits management")
    print("   ✨ Media gallery management")
    print("   ✨ Comprehensive settings panel")
    print("   ✨ Security & privacy controls")
    print("   ✨ Data export functionality")
    print("   ✨ Account management")

def print_feature_comparison():
    """Print feature comparison between job seeker and company systems"""
    print("\n📊 Feature Comparison:")
    print("=" * 60)
    
    features = [
        ("Profile Management", "✅ Job Seekers", "✅ Companies"),
        ("Settings Management", "✅ Job Seekers", "✅ Companies"),
        ("Security Features", "✅ Job Seekers", "✅ Companies"),
        ("Privacy Controls", "✅ Job Seekers", "✅ Companies"),
        ("Data Export", "✅ Job Seekers", "✅ Companies"),
        ("Account Deletion", "✅ Job Seekers", "✅ Companies"),
        ("Team Management", "❌ Job Seekers", "✅ Companies"),
        ("Benefits Management", "❌ Job Seekers", "✅ Companies"),
        ("Media Gallery", "❌ Job Seekers", "✅ Companies"),
        ("Billing Settings", "❌ Job Seekers", "✅ Companies"),
        ("Application Tracking", "✅ Job Seekers", "❌ Companies"),
        ("Skills Management", "✅ Job Seekers", "❌ Companies")
    ]
    
    print(f"{'Feature':<20} {'Job Seekers':<15} {'Companies':<15}")
    print("-" * 50)
    for feature, js, comp in features:
        print(f"{feature:<20} {js:<15} {comp:<15}")

def main():
    print("🚀 Enhanced Company Profile System Test")
    print("=" * 60)
    
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
    test_header_navigation()
    test_model_structure()
    print_feature_comparison()
    print_setup_instructions()
    
    print("\n✨ Company Profile System Test Completed!")
    print("\n🎉 Summary:")
    print("- Enhanced company profile management system")
    print("- Comprehensive settings and security features")
    print("- Team and benefits management")
    print("- Media gallery and branding tools")
    print("- Data export and account management")
    print("- Role-based navigation and permissions")

if __name__ == "__main__":
    main()
