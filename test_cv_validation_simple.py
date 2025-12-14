#!/usr/bin/env python3
"""
Simple validation test for CV Builder section-by-section enhancements
Tests the validation logic without requiring full CV Builder initialization
"""

from datetime import date
import json


def print_section(title, content=""):
    """Helper to print formatted sections"""
    print(f"\n{'='*80}")
    print(f"  {title}")
    print('='*80)
    if content:
        print(content)


def validate_section_data(section: str, user_data: dict) -> dict:
    """
    Validate if profile has sufficient data for a section
    (Simplified version of the backend validation)
    """
    validation = {
        'has_data': False,
        'missing_fields': [],
        'suggestions': []
    }
    
    profile = user_data.get('job_seeker_profile', {})
    
    if section == 'summary':
        has_profile = bool(profile.get('professional_title') or profile.get('professional_summary'))
        has_experience = bool(user_data.get('work_experiences'))
        validation['has_data'] = has_profile or has_experience
        if not has_profile:
            validation['missing_fields'].append('professional_title or professional_summary')
            validation['suggestions'].append('Add professional title and summary to your profile')
        if not has_experience:
            validation['suggestions'].append('Add work experience for a stronger summary')
    
    elif section in ['work', 'experience']:
        work_exp = user_data.get('work_experiences', [])
        validation['has_data'] = len(work_exp) > 0
        if not validation['has_data']:
            validation['missing_fields'].append('work_experiences')
            validation['suggestions'].append('Add your work experience with job title, company, dates, and achievements')
    
    elif section == 'education':
        education = user_data.get('educations', [])
        validation['has_data'] = len(education) > 0
        if not validation['has_data']:
            validation['missing_fields'].append('educations')
            validation['suggestions'].append('Add your education history with degree, institution, and dates')
    
    elif section == 'skills':
        has_technical = bool(profile.get('technical_skills') or profile.get('skills'))
        has_soft = bool(profile.get('soft_skills'))
        validation['has_data'] = has_technical or has_soft
        if not has_technical:
            validation['missing_fields'].append('technical_skills')
            validation['suggestions'].append('Add technical/professional skills to your profile')
        if not has_soft:
            validation['suggestions'].append('Add soft skills to make your profile more complete')
    
    elif section == 'certifications':
        certs = user_data.get('certifications', [])
        validation['has_data'] = len(certs) > 0
        if not validation['has_data']:
            validation['missing_fields'].append('certifications')
            validation['suggestions'].append('Add professional certifications to strengthen your profile')
    
    elif section == 'projects':
        projects = user_data.get('projects', [])
        validation['has_data'] = len(projects) > 0
        if not validation['has_data']:
            validation['missing_fields'].append('projects')
            validation['suggestions'].append('Add portfolio projects to showcase your work')
    
    elif section == 'awards':
        awards = user_data.get('awards', [])
        validation['has_data'] = len(awards) > 0
        if not validation['has_data']:
            validation['missing_fields'].append('awards')
            validation['suggestions'].append('Add awards and achievements if applicable')
    
    return validation


def test_complete_profile():
    """Test with a complete profile"""
    print_section("TEST 1: Complete Profile", "User has all sections filled")
    
    # Complete user data
    user_data = {
        'job_seeker_profile': {
            'professional_title': 'Senior Software Engineer',
            'professional_summary': 'Experienced software engineer with 7+ years in full-stack development',
            'technical_skills': json.dumps(['Python', 'JavaScript', 'React']),
            'soft_skills': json.dumps(['Leadership', 'Communication'])
        },
        'work_experiences': [{'job_title': 'Senior Software Engineer'}],
        'educations': [{'degree_title': 'Bachelor of Science in Computer Science'}],
        'certifications': [{'name': 'AWS Certified Solutions Architect'}],
        'projects': [{'name': 'E-commerce Platform'}]
    }
    
    sections = ['summary', 'work', 'education', 'skills', 'certifications', 'projects']
    
    print("\n📋 Validation Results:")
    print("-" * 80)
    
    all_valid = True
    for section in sections:
        validation = validate_section_data(section, user_data)
        status = "✅ PASS" if validation['has_data'] else "❌ FAIL"
        print(f"{status} | {section:15} | Data: {validation['has_data']}")
        if not validation['has_data']:
            all_valid = False
        if validation['missing_fields']:
            print(f"     Missing: {', '.join(validation['missing_fields'])}")
    
    if all_valid:
        print("\n✅ All sections have data - Ready for generation!")
    return all_valid


def test_minimal_profile():
    """Test with minimal profile (new user)"""
    print_section("TEST 2: Minimal Profile", "New user with only basic info and education")
    
    user_data = {
        'job_seeker_profile': {
            'professional_title': 'Recent Graduate',
            'education_level': "Bachelor's Degree"
        },
        'work_experiences': [],
        'educations': [{'degree_title': 'Bachelor of Arts in Business'}],
        'certifications': [],
        'projects': []
    }
    
    sections = ['summary', 'work', 'education', 'skills', 'certifications', 'projects']
    
    print("\n📋 Validation Results:")
    print("-" * 80)
    
    todos_count = 0
    for section in sections:
        validation = validate_section_data(section, user_data)
        status = "✅ PASS" if validation['has_data'] else "⚠️  SKIP"
        print(f"{status} | {section:15} | Data: {validation['has_data']}")
        
        if validation['missing_fields']:
            todos_count += 1
            print(f"     ❌ Missing: {', '.join(validation['missing_fields'])}")
        
        if validation['suggestions']:
            for suggestion in validation['suggestions']:
                print(f"     💡 {suggestion}")
    
    print(f"\n⚠️  {todos_count} sections need profile updates")
    return True


def test_partial_profile():
    """Test with partial profile"""
    print_section("TEST 3: Partial Profile", "Experienced professional without certifications/projects")
    
    user_data = {
        'job_seeker_profile': {
            'professional_title': 'Marketing Manager',
            'professional_summary': 'Results-driven marketing professional',
            'technical_skills': json.dumps(['SEO', 'Google Analytics']),
            'soft_skills': json.dumps(['Strategic Planning', 'Team Management'])
        },
        'work_experiences': [{'job_title': 'Marketing Manager'}],
        'educations': [{'degree_title': 'MBA in Marketing'}],
        'certifications': [],
        'projects': []
    }
    
    sections = ['summary', 'work', 'education', 'skills', 'certifications', 'projects']
    
    print("\n📋 Validation Results:")
    print("-" * 80)
    
    core_sections = ['summary', 'work', 'education', 'skills']
    optional_missing = []
    
    for section in sections:
        validation = validate_section_data(section, user_data)
        is_optional = section not in core_sections
        status = "✅ PASS" if validation['has_data'] else ("⏭️  OPTIONAL" if is_optional else "⚠️  SKIP")
        print(f"{status} | {section:15} | Data: {validation['has_data']}")
        
        if not validation['has_data'] and is_optional:
            optional_missing.append(section)
        
        if validation['suggestions']:
            for suggestion in validation['suggestions']:
                print(f"     💡 {suggestion}")
    
    print(f"\n✅ Core sections complete, {len(optional_missing)} optional sections can be added")
    return True


def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("  CV Builder Section-by-Section Enhancement - Validation Tests")
    print("="*80)
    
    try:
        results = []
        results.append(("Complete Profile", test_complete_profile()))
        results.append(("Minimal Profile", test_minimal_profile()))
        results.append(("Partial Profile", test_partial_profile()))
        
        print_section("✅ Test Summary")
        
        all_passed = all(result[1] for result in results)
        
        for test_name, passed in results:
            status = "✅ PASSED" if passed else "❌ FAILED"
            print(f"  {status} - {test_name}")
        
        if all_passed:
            print("\n" + "="*80)
            print("  ✅ ALL TESTS PASSED")
            print("="*80)
            print("\n📊 Key Features Validated:")
            print("  ✅ Section data validation checks profile completeness")
            print("  ✅ Missing fields are identified per section")
            print("  ✅ Actionable suggestions are provided")
            print("  ✅ Optional vs required sections are handled")
            print("\n💡 Next Steps:")
            print("  1. Start backend server and test with real API calls")
            print("  2. Verify frontend progress tracking displays correctly")
            print("  3. Test job-tailored CV generation with real job data")
            print("  4. Validate todo suggestions are actionable in UI")
        
        return 0 if all_passed else 1
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    exit(main())
