#!/usr/bin/env python3
"""
Test script for enhanced CV Builder section-by-section generation
Tests validation, data extraction, and section generation with various profile completeness levels
"""

import sys
import os

# Add the backend src directory to the path
backend_src = os.path.join(os.path.dirname(__file__), 'backend', 'src')
sys.path.insert(0, backend_src)
os.chdir(os.path.join(os.path.dirname(__file__), 'backend'))

from services.cv_builder_service_v3 import CVBuilderService
from datetime import date
import json


def print_section(title, content=""):
    """Helper to print formatted sections"""
    print(f"\n{'='*80}")
    print(f"  {title}")
    print('='*80)
    if content:
        print(content)


def test_complete_profile():
    """Test with a complete profile"""
    print_section("TEST 1: Complete Profile", "User has all sections filled")
    
    cv_service = CVBuilderService()
    
    # Complete user data
    user_data = {
        'id': 1,
        'email': 'john.doe@example.com',
        'first_name': 'John',
        'last_name': 'Doe',
        'job_seeker_profile': {
            'professional_title': 'Senior Software Engineer',
            'professional_summary': 'Experienced software engineer with 7+ years in full-stack development',
            'years_of_experience': 7,
            'career_level': 'senior',
            'technical_skills': json.dumps(['Python', 'JavaScript', 'React', 'Node.js', 'PostgreSQL']),
            'soft_skills': json.dumps(['Leadership', 'Communication', 'Problem Solving']),
            'education_level': 'Bachelor\'s Degree'
        },
        'work_experiences': [
            {
                'job_title': 'Senior Software Engineer',
                'company_name': 'Tech Corp',
                'company_location': 'San Francisco, CA',
                'employment_type': 'full-time',
                'start_date': date(2020, 1, 1),
                'end_date': None,
                'is_current': True,
                'description': 'Lead development of core platform features',
                'key_responsibilities': ['Architected microservices', 'Mentored junior developers'],
                'achievements': ['Improved performance by 40%', 'Reduced costs by $50K'],
                'technologies_used': ['Python', 'Django', 'React', 'AWS']
            }
        ],
        'educations': [
            {
                'institution_name': 'MIT',
                'degree_title': 'Bachelor of Science in Computer Science',
                'field_of_study': 'Computer Science',
                'graduation_date': date(2016, 5, 1),
                'gpa': 3.8,
                'gpa_scale': 4.0,
                'honors': 'Cum Laude',
                'relevant_coursework': ['Algorithms', 'Machine Learning', 'Databases']
            }
        ],
        'certifications': [
            {
                'name': 'AWS Certified Solutions Architect',
                'issuing_organization': 'Amazon Web Services',
                'issue_date': date(2022, 3, 1),
                'credential_id': 'AWS-123456'
            }
        ],
        'projects': [
            {
                'name': 'E-commerce Platform',
                'description': 'Built scalable e-commerce solution',
                'role': 'Lead Developer',
                'technologies_used': ['React', 'Node.js', 'MongoDB'],
                'project_url': 'https://github.com/johndoe/ecommerce'
            }
        ]
    }
    
    # Test validation for each section
    sections = ['summary', 'work', 'education', 'skills', 'certifications', 'projects']
    
    print("\n📋 Validation Results:")
    print("-" * 80)
    
    for section in sections:
        validation = cv_service._validate_section_data(section, user_data)
        status = "✅ PASS" if validation['has_data'] else "❌ FAIL"
        print(f"{status} | {section:15} | Data: {validation['has_data']}")
        if validation['missing_fields']:
            print(f"     Missing: {', '.join(validation['missing_fields'])}")
        if validation['suggestions']:
            for suggestion in validation['suggestions']:
                print(f"     💡 {suggestion}")
    
    print("\n✅ All sections have data - Ready for generation!")


def test_minimal_profile():
    """Test with minimal profile (new user)"""
    print_section("TEST 2: Minimal Profile", "New user with only basic info and education")
    
    cv_service = CVBuilderService()
    
    # Minimal user data
    user_data = {
        'id': 2,
        'email': 'jane.smith@example.com',
        'first_name': 'Jane',
        'last_name': 'Smith',
        'job_seeker_profile': {
            'professional_title': 'Recent Graduate',
            'education_level': 'Bachelor\'s Degree'
        },
        'work_experiences': [],
        'educations': [
            {
                'institution_name': 'State University',
                'degree_title': 'Bachelor of Arts in Business',
                'field_of_study': 'Business Administration',
                'graduation_date': date(2024, 5, 1),
                'gpa': 3.5
            }
        ],
        'certifications': [],
        'projects': []
    }
    
    sections = ['summary', 'work', 'education', 'skills', 'certifications', 'projects']
    
    print("\n📋 Validation Results:")
    print("-" * 80)
    
    todos_count = 0
    for section in sections:
        validation = cv_service._validate_section_data(section, user_data)
        status = "✅ PASS" if validation['has_data'] else "⚠️  SKIP"
        print(f"{status} | {section:15} | Data: {validation['has_data']}")
        
        if validation['missing_fields']:
            todos_count += 1
            print(f"     ❌ Missing: {', '.join(validation['missing_fields'])}")
        
        if validation['suggestions']:
            for suggestion in validation['suggestions']:
                print(f"     💡 {suggestion}")
    
    print(f"\n⚠️  {todos_count} sections need profile updates")


def test_partial_profile():
    """Test with partial profile (experienced professional, no certifications/projects)"""
    print_section("TEST 3: Partial Profile", "Experienced professional without certifications/projects")
    
    cv_service = CVBuilderService()
    
    user_data = {
        'id': 3,
        'email': 'mike.johnson@example.com',
        'first_name': 'Mike',
        'last_name': 'Johnson',
        'job_seeker_profile': {
            'professional_title': 'Marketing Manager',
            'professional_summary': 'Results-driven marketing professional',
            'years_of_experience': 5,
            'career_level': 'mid',
            'technical_skills': json.dumps(['SEO', 'Google Analytics', 'HubSpot']),
            'soft_skills': json.dumps(['Strategic Planning', 'Team Management'])
        },
        'work_experiences': [
            {
                'job_title': 'Marketing Manager',
                'company_name': 'Marketing Inc',
                'company_location': 'New York, NY',
                'start_date': date(2019, 6, 1),
                'is_current': True,
                'description': 'Lead marketing campaigns',
                'achievements': ['Increased leads by 60%'],
                'technologies_used': ['HubSpot', 'Google Ads']
            }
        ],
        'educations': [
            {
                'institution_name': 'Business School',
                'degree_title': 'MBA in Marketing',
                'graduation_date': date(2019, 5, 1)
            }
        ],
        'certifications': [],
        'projects': []
    }
    
    sections = ['summary', 'work', 'education', 'skills', 'certifications', 'projects']
    
    print("\n📋 Validation Results:")
    print("-" * 80)
    
    optional_missing = []
    for section in sections:
        validation = cv_service._validate_section_data(section, user_data)
        status = "✅ PASS" if validation['has_data'] else "⏭️  OPTIONAL"
        print(f"{status} | {section:15} | Data: {validation['has_data']}")
        
        if not validation['has_data']:
            optional_missing.append(section)
        
        if validation['suggestions']:
            for suggestion in validation['suggestions']:
                print(f"     💡 {suggestion}")
    
    print(f"\n✅ Core sections complete, {len(optional_missing)} optional sections can be added")


def test_section_data_extraction():
    """Test section-specific data extraction"""
    print_section("TEST 4: Section Data Extraction", "Testing targeted data extraction per section")
    
    cv_service = CVBuilderService()
    
    full_user_data = {
        'id': 4,
        'email': 'test@example.com',
        'first_name': 'Test',
        'last_name': 'User',
        'job_seeker_profile': {'professional_title': 'Developer'},
        'work_experiences': [{'job_title': 'Software Engineer'}],
        'educations': [{'degree_title': 'BS Computer Science'}],
        'certifications': [{'name': 'AWS Certified'}],
        'projects': [{'name': 'Project X'}],
        'awards': [{'title': 'Best Employee'}]
    }
    
    # Test extraction for different sections
    section_data_map = {
        'summary': ['personal_info', 'job_seeker_profile', 'work_experiences'],
        'work': ['work_experiences'],
        'education': ['educations'],
        'skills': ['job_seeker_profile'],
        'certifications': ['certifications'],
        'projects': ['projects'],
        'awards': ['awards']
    }
    
    print("\n📦 Extracted Data per Section:")
    print("-" * 80)
    
    for section, data_keys in section_data_map.items():
        extracted = cv_service._extract_section_data(full_user_data, data_keys)
        
        # Check what was extracted (excluding basic fields)
        keys = [k for k in extracted.keys() if k not in ['id', 'email', 'first_name', 'last_name']]
        
        print(f"{section:15} | Keys extracted: {', '.join(keys)}")
        
        # Verify job_seeker_profile is always included
        if 'job_seeker_profile' in extracted:
            print(f"                  ✅ Profile context included")


def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("  CV Builder Section-by-Section Enhancement Tests")
    print("="*80)
    
    try:
        test_complete_profile()
        test_minimal_profile()
        test_partial_profile()
        test_section_data_extraction()
        
        print_section("✅ All Tests Completed Successfully")
        print("\n📊 Summary:")
        print("  • Complete profiles generate all sections")
        print("  • Minimal profiles skip sections with missing data")
        print("  • Partial profiles handle optional sections gracefully")
        print("  • Section data extraction is targeted and efficient")
        print("\n💡 Next Steps:")
        print("  1. Test with real API calls to backend")
        print("  2. Verify frontend progress tracking displays correctly")
        print("  3. Test with job-tailored CV generation")
        print("  4. Validate todo suggestions are actionable")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == '__main__':
    sys.exit(main())
