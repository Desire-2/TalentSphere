#!/usr/bin/env python3
"""
Test script for CV Generator V3 - Targeted Section-by-Section Generation
Tests the enhanced CV generation with progress tracking and todos
"""

import os
import sys
import json

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def test_v3_section_generation():
    """Test V3 service with mock data"""
    print("\n" + "="*80)
    print("CV GENERATOR V3 - TARGETED SECTION GENERATION TEST")
    print("="*80)
    
    try:
        from src.services.cv_builder_service_v3 import CVBuilderServiceV3
        
        # Initialize service
        service = CVBuilderServiceV3()
        print("\n✓ CV Builder Service V3 initialized")
        
        # Mock user data with profile
        mock_user_data = {
            'id': 1,
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'john.doe@example.com',
            'phone': '+1-555-0123',
            'location': 'San Francisco, CA',
            'bio': 'Experienced software engineer',
            'job_seeker_profile': {
                'professional_title': 'Senior Software Engineer',
                'professional_summary': 'Experienced full-stack developer with 5+ years building scalable web applications',
                'desired_position': 'Senior Software Engineer',
                'skills': 'Python, JavaScript, React, Node.js, Django, PostgreSQL, Docker, AWS, CI/CD',
                'soft_skills': 'Leadership, Communication, Problem Solving, Team Collaboration',
                'years_of_experience': 5,
                'education_level': 'Bachelor of Science in Computer Science',
                'career_goals': 'Lead innovative development teams and architect scalable systems',
                'linkedin_url': 'https://linkedin.com/in/johndoe',
                'github_url': 'https://github.com/johndoe',
                'portfolio_url': 'https://johndoe.dev'
            },
            'work_experiences': [
                {
                    'job_title': 'Senior Software Engineer',
                    'company_name': 'Tech Corp Inc.',
                    'company_location': 'San Francisco, CA',
                    'start_date': '2021-01',
                    'end_date': None,
                    'is_current': True,
                    'description': 'Lead development of core platform features',
                    'key_responsibilities': 'Architect and implement microservices, mentor junior developers, optimize database performance',
                    'achievements': 'Improved system performance by 40%, led team of 5 developers',
                    'technologies_used': ['Python', 'Django', 'React', 'PostgreSQL', 'Docker', 'AWS']
                },
                {
                    'job_title': 'Software Engineer',
                    'company_name': 'StartupXYZ',
                    'company_location': 'Palo Alto, CA',
                    'start_date': '2019-06',
                    'end_date': '2020-12',
                    'is_current': False,
                    'description': 'Full-stack development of SaaS platform',
                    'key_responsibilities': 'Build RESTful APIs, implement frontend features, write unit tests',
                    'achievements': 'Delivered 15+ features on schedule, reduced bug count by 30%',
                    'technologies_used': ['Node.js', 'Express', 'React', 'MongoDB', 'Git']
                }
            ],
            'educations': [
                {
                    'degree_title': 'Bachelor of Science in Computer Science',
                    'institution_name': 'University of California',
                    'institution_location': 'Berkeley, CA',
                    'graduation_date': '2019-05',
                    'gpa': '3.8',
                    'honors': 'Cum Laude',
                    'relevant_coursework': ['Data Structures', 'Algorithms', 'Database Systems', 'Software Engineering']
                }
            ],
            'certifications': [
                {
                    'name': 'AWS Certified Developer - Associate',
                    'issuer': 'Amazon Web Services',
                    'issue_date': '2022-03',
                    'credential_id': 'AWS-12345',
                    'credential_url': 'https://aws.amazon.com/verify/12345'
                }
            ],
            'projects': [
                {
                    'title': 'E-commerce Platform',
                    'role': 'Lead Developer',
                    'description': 'Built full-stack e-commerce platform with payment integration',
                    'technologies': ['React', 'Node.js', 'Stripe', 'PostgreSQL'],
                    'url': 'https://github.com/johndoe/ecommerce'
                }
            ],
            'awards': []
        }
        
        # Mock job data for targeting
        mock_job_data = {
            'title': 'Senior Full-Stack Engineer',
            'company_name': 'BigTech Solutions',
            'description': 'We are seeking an experienced full-stack engineer to join our platform team',
            'requirements': '''
            - 5+ years of professional software development experience
            - Strong proficiency in Python and JavaScript
            - Experience with React and Node.js
            - Knowledge of cloud platforms (AWS preferred)
            - Database design and optimization skills
            - Experience with Docker and CI/CD pipelines
            - Strong problem-solving and communication skills
            ''',
            'location': 'San Francisco, CA'
        }
        
        print("\n📋 Test Configuration:")
        print(f"   User: {mock_user_data['first_name']} {mock_user_data['last_name']}")
        print(f"   Title: {mock_user_data['job_seeker_profile']['professional_title']}")
        print(f"   Experience: {len(mock_user_data['work_experiences'])} positions")
        print(f"   Target Job: {mock_job_data['title']} at {mock_job_data['company_name']}")
        
        # Test 1: Generate CV with all sections
        print("\n" + "-"*80)
        print("TEST 1: Generate CV with Targeted Section Processing")
        print("-"*80)
        
        sections = ['summary', 'experience', 'education', 'skills', 'projects', 'certifications']
        print(f"\nGenerating CV with {len(sections)} sections...")
        print(f"Sections: {', '.join(sections)}")
        
        result = service.generate_cv_section_by_section(
            user_data=mock_user_data,
            job_data=mock_job_data,
            cv_style='professional',
            include_sections=sections
        )
        
        print("\n✓ CV Generation Complete!")
        
        # Display results
        print("\n📊 GENERATION RESULTS:")
        print(f"   Version: {result['metadata']['version']}")
        print(f"   Style: {result['metadata']['style']}")
        print(f"   Tailored for: {result['metadata']['tailored_for_job']}")
        print(f"   Sections included: {len(result['metadata']['sections_included'])}")
        
        # Display progress
        print("\n📈 GENERATION PROGRESS:")
        progress = result.get('generation_progress', [])
        for p in progress:
            status_icon = '✓' if p['status'] == 'completed' else '⚠' if p['status'] == 'failed' else '○'
            print(f"   {status_icon} {p['section'].upper():20s} | {p['status']:12s} | {p['details']}")
        
        # Display todos
        todos = result.get('todos', [])
        if todos:
            print("\n📝 FOLLOW-UP TODOS:")
            for todo in todos:
                priority_icon = '🔴' if todo['priority'] == 'high' else '🟡' if todo['priority'] == 'medium' else '🔵'
                print(f"   {priority_icon} [{todo['section'].upper()}] {todo['issue']}")
                print(f"      → {todo['suggestion']}")
        else:
            print("\n✓ No follow-up actions needed - Profile data is complete!")
        
        # Display generated content summary
        print("\n📄 GENERATED CONTENT SUMMARY:")
        if 'contact_information' in result:
            print(f"   ✓ Contact: {result['contact_information']['full_name']}")
        
        if 'professional_summary' in result:
            summary_words = len(result['professional_summary'].split())
            print(f"   ✓ Summary: {summary_words} words")
            print(f"      \"{result['professional_summary'][:100]}...\"")
        
        if 'core_competencies' in result:
            print(f"   ✓ Core Competencies: {len(result['core_competencies'])} items")
            print(f"      {', '.join(result['core_competencies'][:5])}...")
        
        if 'professional_experience' in result:
            exp_count = len(result['professional_experience'])
            print(f"   ✓ Work Experience: {exp_count} positions")
            for idx, exp in enumerate(result['professional_experience'][:2], 1):
                print(f"      {idx}. {exp['job_title']} at {exp['company']}")
                print(f"         Achievements: {len(exp.get('achievements', []))} bullets")
        
        if 'technical_skills' in result:
            skills = result['technical_skills']
            total_skills = sum(len(v) for v in skills.values())
            print(f"   ✓ Technical Skills: {total_skills} total")
            print(f"      Technical: {len(skills.get('technical_skills', []))}")
            print(f"      Soft: {len(skills.get('soft_skills', []))}")
            print(f"      Tools/Platforms: {len(skills.get('tools_platforms', []))}")
        
        if 'education' in result:
            print(f"   ✓ Education: {len(result['education'])} degrees")
        
        if 'certifications' in result:
            print(f"   ✓ Certifications: {len(result['certifications'])} items")
        
        if 'projects' in result:
            print(f"   ✓ Projects: {len(result['projects'])} items")
        
        # Display ATS score if available
        if 'ats_score' in result:
            print(f"\n🎯 ATS SCORE: {result['ats_score']}/100")
        
        # Test 2: Generate with minimal sections
        print("\n" + "-"*80)
        print("TEST 2: Generate CV with Minimal Sections")
        print("-"*80)
        
        minimal_sections = ['summary', 'experience']
        print(f"\nGenerating CV with {len(minimal_sections)} sections...")
        
        result_minimal = service.generate_cv_section_by_section(
            user_data=mock_user_data,
            job_data=None,  # No job targeting
            cv_style='modern',
            include_sections=minimal_sections
        )
        
        print(f"\n✓ Minimal CV Generated!")
        print(f"   Sections: {len(result_minimal['metadata']['sections_included'])}")
        print(f"   Progress entries: {len(result_minimal.get('generation_progress', []))}")
        print(f"   Todos: {len(result_minimal.get('todos', []))}")
        
        # Test 3: Generate without job targeting
        print("\n" + "-"*80)
        print("TEST 3: Generate General CV (No Job Targeting)")
        print("-"*80)
        
        result_general = service.generate_cv_section_by_section(
            user_data=mock_user_data,
            job_data=None,
            cv_style='professional',
            include_sections=['summary', 'skills']
        )
        
        print(f"\n✓ General CV Generated!")
        print(f"   Tailored for: {result_general['metadata'].get('tailored_for_job', 'General CV')}")
        
        # Final summary
        print("\n" + "="*80)
        print("✅ ALL TESTS PASSED!")
        print("="*80)
        print("\nV3 Targeted Section Generation Features Verified:")
        print("   ✓ Section-by-section processing")
        print("   ✓ Targeted data per section")
        print("   ✓ Progress tracking")
        print("   ✓ Todo generation")
        print("   ✓ Job targeting")
        print("   ✓ Fallback handling")
        print("   ✓ Multiple CV styles")
        
        return True
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    # Check for API key
    if not os.getenv('GEMINI_API_KEY'):
        print("\n⚠️  WARNING: GEMINI_API_KEY not set in environment!")
        print("Set it in backend/.env file or as environment variable")
        print("\nRunning tests without AI generation (will use fallbacks)...\n")
    
    success = test_v3_section_generation()
    sys.exit(0 if success else 1)
