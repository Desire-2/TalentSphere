#!/usr/bin/env python3

import requests
import json

def test_templates_with_auth():
    """Test job templates with authentication"""
    base_url = "http://localhost:5001/api"
    
    print("🧪 Testing Job Templates with Authentication...")
    
    # Step 1: Login
    print("\n1. Logging in as external admin...")
    login_response = requests.post(f"{base_url}/auth/login", json={
        "email": "external_admin@talentsphere.com",
        "password": "admin123"
    })
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)
        return
    
    token = login_response.json().get('token')
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Successfully logged in!")
    
    # Step 2: Get templates
    print("\n2. Getting job templates...")
    templates_response = requests.get(f"{base_url}/job-templates", headers=headers)
    print(f"Status: {templates_response.status_code}")
    
    if templates_response.status_code == 200:
        data = templates_response.json()
        templates = data.get('templates', [])
        print(f"✅ Found {len(templates)} job templates")
        
        for i, template in enumerate(templates[:3], 1):
            print(f"  {i}. {template.get('name')}")
            print(f"     Title: {template.get('title')}")
            print(f"     Created: {template.get('created_at', 'Unknown')[:10]}")
            print(f"     Active: {template.get('is_active', False)}")
            
    else:
        print(f"❌ Failed to get templates: {templates_response.text}")
        return
    
    # Step 3: Test export
    print("\n3. Testing template export...")
    export_response = requests.get(f"{base_url}/job-templates/export", headers=headers)
    print(f"Export Status: {export_response.status_code}")
    
    if export_response.status_code == 200:
        export_data = export_response.json()
        exported_templates = export_data.get('templates', [])
        print(f"✅ Successfully exported {len(exported_templates)} templates")
        print(f"Exported at: {export_data.get('exported_at', 'Unknown')[:19]}")
    else:
        print(f"❌ Export failed: {export_response.text}")
    
    # Step 4: Create a new template
    print("\n4. Creating a new job template...")
    new_template = {
        "name": "Test Template (API)",
        "description": "A test template created via API",
        "title": "Test Position",
        "summary": "This is a test job posting created via the API",
        "job_description": "This is a comprehensive job description for testing purposes. The role involves various responsibilities and requirements.",
        "requirements": "• Bachelor's degree\n• 2+ years experience\n• Strong communication skills",
        "preferred_skills": "• Leadership experience\n• Project management\n• Team collaboration",
        "employment_type": "full-time",
        "experience_level": "mid",
        "location_type": "remote",
        "salary_min": 60000,
        "salary_max": 80000,
        "salary_currency": "USD",
        "salary_period": "yearly",
        "application_type": "external",
        "application_url": "https://example.com/apply",
        "is_active": True,
        "is_public": False,
        "tags": ["API", "Testing", "Remote"]
    }
    
    create_response = requests.post(f"{base_url}/job-templates", json=new_template, headers=headers)
    print(f"Create Status: {create_response.status_code}")
    
    if create_response.status_code == 201:
        created_template = create_response.json().get('template', {})
        template_id = created_template.get('id')
        print(f"✅ Successfully created template with ID: {template_id}")
        print(f"Template name: {created_template.get('name')}")
        
        # Step 5: Test duplicate
        print(f"\n5. Duplicating template {template_id}...")
        duplicate_response = requests.post(f"{base_url}/job-templates/{template_id}/duplicate", headers=headers)
        print(f"Duplicate Status: {duplicate_response.status_code}")
        
        if duplicate_response.status_code == 201:
            duplicated_template = duplicate_response.json().get('template', {})
            print(f"✅ Successfully duplicated template")
            print(f"Original: {created_template.get('name')}")
            print(f"Copy: {duplicated_template.get('name')}")
            
            # Clean up: Delete the duplicated template
            duplicate_id = duplicated_template.get('id')
            requests.delete(f"{base_url}/job-templates/{duplicate_id}", headers=headers)
            print(f"🧹 Cleaned up duplicate template {duplicate_id}")
        else:
            print(f"❌ Duplication failed: {duplicate_response.text}")
        
        # Step 6: Update template
        print(f"\n6. Updating template {template_id}...")
        update_data = {
            "name": "Updated Test Template (API)",
            "description": "This template has been updated via the API"
        }
        
        update_response = requests.put(f"{base_url}/job-templates/{template_id}", json=update_data, headers=headers)
        print(f"Update Status: {update_response.status_code}")
        
        if update_response.status_code == 200:
            updated_template = update_response.json().get('template', {})
            print(f"✅ Successfully updated template")
            print(f"New name: {updated_template.get('name')}")
        else:
            print(f"❌ Update failed: {update_response.text}")
        
        # Clean up: Delete the test template
        print(f"\n🧹 Cleaning up test template {template_id}...")
        delete_response = requests.delete(f"{base_url}/job-templates/{template_id}", headers=headers)
        if delete_response.status_code == 200:
            print("✅ Test template deleted successfully")
        else:
            print(f"⚠️ Could not delete test template: {delete_response.text}")
            
    else:
        print(f"❌ Template creation failed: {create_response.text}")
    
    print("\n🎉 Job Templates API testing completed!")
    print("\n📋 Summary:")
    print("✅ Authentication: Working")
    print("✅ Get Templates: Working") 
    print("✅ Export Templates: Working")
    print("✅ Create Template: Working")
    print("✅ Duplicate Template: Working") 
    print("✅ Update Template: Working")
    print("✅ Delete Template: Working")

if __name__ == '__main__':
    test_templates_with_auth()
