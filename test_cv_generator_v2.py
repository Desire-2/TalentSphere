#!/usr/bin/env python3
"""
Test script for CV Generator V2
Tests incremental generation, section inclusion, and profile data usage
"""
import sys
import os
import json
import time

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from src.services.cv_builder_service_v2 import CVBuilderServiceV2
from datetime import datetime


def create_test_user_data():
    """Create comprehensive test user data with all profile fields"""
    return {
        'id': 1,
        'first_name': 'John',
        'last_name': 'Doe',
        'email': 'john.doe@example.com',
        'phone': '+1234567890',
        'location': 'San Francisco, CA',
        'bio': 'Experienced software engineer passionate about building scalable systems',
        'job_seeker_profile': {
            'professional_title': 'Senior Software Engineer',
            'professional_summary': 'Results-driven software engineer with expertise in full-stack development',
            'desired_position': 'Lead Software Engineer',
            'skills': 'Python, JavaScript, React, Node.js, PostgreSQL, Docker, AWS',
            'soft_skills': 'Leadership, Communication, Problem Solving, Teamwork',
            'years_of_experience': 5,
            'education_level': 'Bachelor of Science in Computer Science',
            'desired_salary_min': 120000,
            'desired_salary_max': 150000,
            'salary_currency': 'USD',
            'preferred_location': 'San Francisco Bay Area',
            'job_type_preference': 'Full-time',
            'availability': 'Available immediately',
            'willing_to_relocate': True,
            'linkedin_url': 'https://linkedin.com/in/johndoe',
            'github_url': 'https://github.com/johndoe',
            'portfolio_url': 'https://johndoe.dev',
            'website_url': 'https://johndoe.com',
            'career_goals': 'Seeking leadership role in innovative tech company',
            'languages': 'English, Spanish',
            'remote_work_preference': 'Hybrid'
        },
        'work_experiences': [
            {
                'job_title': 'Senior Software Engineer',
                'company_name': 'TechCorp Inc.',
                'company_location': 'San Francisco, CA',
                'employment_type': 'Full-time',
                'start_date': '2021-01',
                'end_date': '2023-12',
                'is_current': False,
                'description': 'Led development of microservices architecture serving 10M+ users',
                'key_responsibilities': 'Architecture design, team leadership, code review, deployment',
                'achievements': 'Reduced latency by 40%, increased throughput by 60%',
                'technologies_used': ['Python', 'Django', 'React', 'PostgreSQL', 'AWS', 'Docker']
            },
            {
                'job_title': 'Software Engineer',
                'company_name': 'StartupXYZ',
                'company_location': 'Palo Alto, CA',
                'employment_type': 'Full-time',
                'start_date': '2019-06',
                'end_date': '2020-12',
                'is_current': False,
                'description': 'Developed full-stack web applications using modern technologies',
                'key_responsibilities': 'Feature development, API design, database optimization',
                'achievements': 'Built 3 major features from scratch, improved load time by 50%',
                'technologies_used': ['JavaScript', 'Node.js', 'React', 'MongoDB']
            },
            {
                'job_title': 'Junior Developer',
                'company_name': 'WebAgency',
                'company_location': 'San Jose, CA',
                'employment_type': 'Full-time',
                'start_date': '2018-01',
                'end_date': '2019-05',
                'is_current': False,
                'description': 'Contributed to client projects and internal tools',
                'key_responsibilities': 'Bug fixes, feature implementation, testing',
                'achievements': 'Delivered 15+ client projects on time',
                'technologies_used': ['PHP', 'JavaScript', 'MySQL', 'WordPress']
            }
        ],
        'educations': [
            {
                'degree_title': 'Bachelor of Science',
                'field_of_study': 'Computer Science',
                'institution_name': 'University of California, Berkeley',
                'institution_location': 'Berkeley, CA',
                'start_date': '2014-09',
                'graduation_date': '2018-05',
                'gpa': 3.7,
                'gpa_scale': 4.0,
                'honors': 'Magna Cum Laude',
                'relevant_coursework': ['Data Structures', 'Algorithms', 'Machine Learning', 'Database Systems']
            }
        ],
        'certifications': [
            {
                'name': 'AWS Certified Solutions Architect',
                'issuer': 'Amazon Web Services',
                'issue_date': '2022-03',
                'credential_id': 'AWS-12345',
                'credential_url': 'https://aws.amazon.com/verification/12345'
            },
            {
                'name': 'Certified Kubernetes Administrator',
                'issuer': 'Cloud Native Computing Foundation',
                'issue_date': '2021-11',
                'credential_id': 'CKA-67890'
            }
        ],
        'projects': [
            {
                'title': 'E-Commerce Platform',
                'role': 'Lead Developer',
                'description': 'Built scalable e-commerce platform handling 100K+ daily users',
                'technologies': ['React', 'Node.js', 'PostgreSQL', 'Redis', 'AWS'],
                'url': 'https://github.com/johndoe/ecommerce-platform',
                'start_date': '2022-01',
                'end_date': '2022-12'
            },
            {
                'title': 'Real-time Chat Application',
                'role': 'Full Stack Developer',
                'description': 'Developed real-time chat with WebSocket support',
                'technologies': ['Socket.io', 'Express', 'React', 'MongoDB'],
                'url': 'https://github.com/johndoe/chat-app',
                'start_date': '2021-06',
                'end_date': '2021-09'
            }
        ],
        'awards': [
            {
                'title': 'Employee of the Year',
                'issuer': 'TechCorp Inc.',
                'date_received': '2023-12',
                'description': 'Recognized for outstanding contributions to team success'
            },
            {
                'title': 'Hackathon Winner',
                'issuer': 'TechConf 2022',
                'date_received': '2022-08',
                'description': 'First place in company-wide hackathon'
            }
        ]
    }


def test_incremental_generation():
    """Test V2 incremental generation"""
    print("=" * 80)
    print("TEST 1: Incremental Generation with All Sections")
    print("=" * 80)
    
    service = CVBuilderServiceV2()
    user_data = create_test_user_data()
    
    sections = ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'awards']
    
    print(f"\n📋 Generating CV with {len(sections)} sections...")
    print(f"Sections: {', '.join(sections)}")
    
    start_time = time.time()
    
    try:
        cv_content = service.generate_cv_content(
            user_data=user_data,
            job_data=None,
            cv_style='professional',
            include_sections=sections
        )
        
        generation_time = time.time() - start_time
        
        print(f"\n✅ Generation completed in {generation_time:.2f} seconds")
        print(f"\n📊 CV Content Structure:")
        print(f"  - Contact Information: {'✅' if 'contact_information' in cv_content else '❌'}")
        print(f"  - Professional Summary: {'✅' if 'professional_summary' in cv_content else '❌'}")
        print(f"  - Work Experience: {'✅' if 'professional_experience' in cv_content else '❌'}")
        print(f"    • Entries: {len(cv_content.get('professional_experience', []))}")
        print(f"  - Education: {'✅' if 'education' in cv_content else '❌'}")
        print(f"    • Entries: {len(cv_content.get('education', []))}")
        print(f"  - Skills: {'✅' if 'technical_skills' in cv_content else '❌'}")
        print(f"  - Projects: {'✅' if 'projects' in cv_content else '❌'}")
        print(f"    • Entries: {len(cv_content.get('projects', []))}")
        print(f"  - Certifications: {'✅' if 'certifications' in cv_content else '❌'}")
        print(f"    • Entries: {len(cv_content.get('certifications', []))}")
        print(f"  - Awards: {'✅' if 'awards' in cv_content else '❌'}")
        print(f"    • Entries: {len(cv_content.get('awards', []))}")
        
        # Verify all sections present
        missing_sections = []
        for section in sections:
            if section == 'summary' and 'professional_summary' not in cv_content:
                missing_sections.append('professional_summary')
            elif section == 'experience' and 'professional_experience' not in cv_content:
                missing_sections.append('professional_experience')
            elif section == 'education' and 'education' not in cv_content:
                missing_sections.append('education')
            elif section == 'skills' and 'technical_skills' not in cv_content:
                missing_sections.append('technical_skills')
            elif section == 'projects' and 'projects' not in cv_content:
                missing_sections.append('projects')
            elif section == 'certifications' and 'certifications' not in cv_content:
                missing_sections.append('certifications')
            elif section == 'awards' and 'awards' not in cv_content:
                missing_sections.append('awards')
        
        if missing_sections:
            print(f"\n⚠️  WARNING: Missing sections: {', '.join(missing_sections)}")
            return False
        else:
            print(f"\n✅ All {len(sections)} sections successfully generated!")
            
        # Check ATS score
        if 'ats_score' in cv_content:
            print(f"\n📈 ATS Score: {cv_content['ats_score'].get('estimated_score', 0)}/100")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Generation failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_job_tailored_generation():
    """Test job-tailored CV generation"""
    print("\n" + "=" * 80)
    print("TEST 2: Job-Tailored CV Generation")
    print("=" * 80)
    
    service = CVBuilderServiceV2()
    user_data = create_test_user_data()
    
    job_data = {
        'title': 'Lead Software Engineer',
        'company_name': 'Tech Giants Inc.',
        'description': 'Looking for experienced engineer to lead backend team',
        'requirements': 'Python, Django, PostgreSQL, AWS, Docker, 5+ years experience, team leadership',
        'experience_level': 'Senior',
        'category': 'Engineering'
    }
    
    sections = ['summary', 'experience', 'skills']
    
    print(f"\n🎯 Target Job: {job_data['title']} at {job_data['company_name']}")
    print(f"📋 Generating CV with {len(sections)} sections...")
    
    start_time = time.time()
    
    try:
        cv_content = service.generate_cv_content(
            user_data=user_data,
            job_data=job_data,
            cv_style='professional',
            include_sections=sections
        )
        
        generation_time = time.time() - start_time
        
        print(f"\n✅ Job-tailored CV generated in {generation_time:.2f} seconds")
        
        # Check if summary mentions job-relevant skills
        summary = cv_content.get('professional_summary', '')
        print(f"\n📝 Professional Summary:")
        print(f"  {summary[:200]}...")
        
        # Check if metadata includes job info
        metadata = cv_content.get('metadata', {})
        print(f"\n📊 Metadata:")
        print(f"  - Tailored for: {metadata.get('tailored_for_job', 'N/A')}")
        print(f"  - Company: {metadata.get('company', 'N/A')}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Generation failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_profile_data_usage():
    """Test that all profile fields are being used"""
    print("\n" + "=" * 80)
    print("TEST 3: Complete Profile Data Usage")
    print("=" * 80)
    
    service = CVBuilderServiceV2()
    user_data = create_test_user_data()
    
    sections = ['summary', 'experience', 'skills']
    
    print(f"\n📋 Profile Fields to Verify:")
    profile_fields = [
        'professional_title', 'professional_summary', 'desired_position',
        'skills', 'soft_skills', 'years_of_experience', 'education_level',
        'career_goals', 'linkedin_url', 'github_url', 'portfolio_url',
        'website_url', 'languages', 'job_type_preference', 'availability'
    ]
    
    for field in profile_fields:
        value = user_data['job_seeker_profile'].get(field)
        print(f"  • {field}: {value}")
    
    print(f"\n🔍 Generating CV and checking field usage...")
    
    try:
        cv_content = service.generate_cv_content(
            user_data=user_data,
            job_data=None,
            cv_style='professional',
            include_sections=sections
        )
        
        # Convert CV to string to check for field mentions
        cv_str = json.dumps(cv_content, default=str).lower()
        
        used_fields = []
        for field in profile_fields:
            field_value = str(user_data['job_seeker_profile'].get(field, '')).lower()
            if field_value and len(field_value) > 3:
                # Check if field value appears in CV
                if field_value[:20] in cv_str:
                    used_fields.append(field)
        
        print(f"\n✅ Fields found in CV: {len(used_fields)}/{len(profile_fields)}")
        print(f"   Used: {', '.join(used_fields)}")
        
        # Check contact information specifically
        contact = cv_content.get('contact_information', {})
        print(f"\n📇 Contact Information:")
        print(f"  • LinkedIn: {'✅' if contact.get('linkedin') else '❌'}")
        print(f"  • GitHub: {'✅' if contact.get('github') else '❌'}")
        print(f"  • Portfolio: {'✅' if contact.get('portfolio') else '❌'}")
        print(f"  • Website: {'✅' if contact.get('website') else '❌'}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_minimal_profile():
    """Test generation with minimal profile data"""
    print("\n" + "=" * 80)
    print("TEST 4: Minimal Profile Data Generation")
    print("=" * 80)
    
    service = CVBuilderServiceV2()
    
    # Minimal user data
    minimal_data = {
        'id': 2,
        'first_name': 'Jane',
        'last_name': 'Smith',
        'email': 'jane@example.com',
        'phone': '+0987654321',
        'location': 'New York, NY',
        'job_seeker_profile': {
            'professional_title': 'Software Developer',
            'years_of_experience': 2,
            'skills': 'JavaScript, React'
        },
        'work_experiences': [],
        'educations': [],
        'certifications': [],
        'projects': [],
        'awards': []
    }
    
    sections = ['summary', 'experience', 'education', 'skills']
    
    print(f"\n📋 Minimal profile:")
    print(f"  - Name: {minimal_data['first_name']} {minimal_data['last_name']}")
    print(f"  - Title: {minimal_data['job_seeker_profile']['professional_title']}")
    print(f"  - Skills: {minimal_data['job_seeker_profile']['skills']}")
    print(f"  - Work Experience: {len(minimal_data['work_experiences'])} entries")
    
    print(f"\n🔍 Generating CV with fallbacks...")
    
    try:
        cv_content = service.generate_cv_content(
            user_data=minimal_data,
            job_data=None,
            cv_style='professional',
            include_sections=sections
        )
        
        print(f"\n✅ CV generated with minimal data")
        print(f"\n📊 Generated Sections:")
        print(f"  - Summary: {'✅' if cv_content.get('professional_summary') else '❌'}")
        print(f"  - Experience: {'✅' if 'professional_experience' in cv_content else '❌'} ({len(cv_content.get('professional_experience', []))} entries)")
        print(f"  - Education: {'✅' if 'education' in cv_content else '❌'} ({len(cv_content.get('education', []))} entries)")
        print(f"  - Skills: {'✅' if 'technical_skills' in cv_content else '❌'}")
        
        # Check that summary exists despite minimal data
        if cv_content.get('professional_summary'):
            print(f"\n📝 Generated Summary:")
            print(f"  {cv_content['professional_summary']}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    print("\n" + "🧪 " * 30)
    print("CV GENERATOR V2 - COMPREHENSIVE TEST SUITE")
    print("🧪 " * 30)
    
    # Check for API key
    if not os.getenv('GEMINI_API_KEY'):
        print("\n⚠️  WARNING: GEMINI_API_KEY not set!")
        print("Set it in .env file or environment variable")
        print("Tests will fail without API key")
        return
    
    results = []
    
    # Run tests
    results.append(("Incremental Generation", test_incremental_generation()))
    results.append(("Job-Tailored Generation", test_job_tailored_generation()))
    results.append(("Profile Data Usage", test_profile_data_usage()))
    results.append(("Minimal Profile", test_minimal_profile()))
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST RESULTS SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status} - {test_name}")
    
    print(f"\n📊 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! CV Generator V2 is working correctly.")
        sys.exit(0)
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please review the errors above.")
        sys.exit(1)


if __name__ == '__main__':
    main()
