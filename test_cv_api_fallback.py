#!/usr/bin/env python3
"""
Test script for CV Builder API Fallback System
Tests automatic switching from Gemini to OpenRouter when quota is exhausted
"""

import os
import sys
from datetime import datetime

# Add backend src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'src'))

from services.cv_builder_service_v3 import CVBuilderServiceV3


def print_section(title):
    """Print formatted section header"""
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}\n")


def test_api_configuration():
    """Test 1: Verify API keys are configured"""
    print_section("TEST 1: API Configuration Check")
    
    gemini_key = os.getenv('GEMINI_API_KEY')
    openrouter_key = os.getenv('OPENROUTER_API_KEY')
    
    print(f"✓ GEMINI_API_KEY: {'SET ✓' if gemini_key else 'NOT SET ✗'}")
    print(f"✓ OPENROUTER_API_KEY: {'SET ✓' if openrouter_key else 'NOT SET ✗'}")
    
    if not gemini_key:
        print("\n⚠️  Warning: GEMINI_API_KEY not set. Add to .env file.")
    if not openrouter_key:
        print("⚠️  Warning: OPENROUTER_API_KEY not set. Fallback won't work.")
    
    return bool(gemini_key and openrouter_key)


def test_service_initialization():
    """Test 2: Initialize CV Builder Service"""
    print_section("TEST 2: Service Initialization")
    
    try:
        service = CVBuilderServiceV3()
        print("✅ CVBuilderServiceV3 initialized successfully")
        print(f"   - Current provider: {service._current_provider}")
        print(f"   - Gemini exhausted: {service._gemini_quota_exhausted}")
        print(f"   - Switch count: {service._provider_switch_count}")
        return service
    except Exception as e:
        print(f"❌ Service initialization failed: {e}")
        return None


def test_openrouter_fallback(service):
    """Test 3: Force OpenRouter fallback and test"""
    print_section("TEST 3: OpenRouter Fallback Test")
    
    if not service:
        print("❌ Service not initialized. Skipping test.")
        return False
    
    # Force fallback to OpenRouter
    print("🔄 Forcing switch to OpenRouter (simulating Gemini quota exhaustion)...")
    service._gemini_quota_exhausted = True
    service._current_provider = 'openrouter'
    
    # Test simple prompt
    test_prompt = """Create a brief professional summary (2 sentences) for:
- Job Seeker with 5 years experience in software development
- Skills: Python, JavaScript, React
- Target: Senior Developer role

Return only the summary text."""
    
    try:
        print("\n📤 Sending test prompt to OpenRouter API...")
        response = service._make_api_request_with_retry(test_prompt)
        
        print("\n✅ OpenRouter API response received:")
        print(f"   Length: {len(response)} characters")
        print(f"   Preview: {response[:200]}...")
        
        return True
    except Exception as e:
        print(f"\n❌ OpenRouter API call failed: {e}")
        return False


def test_gemini_to_openrouter_switch(service):
    """Test 4: Test automatic switching from Gemini to OpenRouter"""
    print_section("TEST 4: Automatic API Switch Test")
    
    if not service:
        print("❌ Service not initialized. Skipping test.")
        return False
    
    # Reset service to use Gemini
    service._gemini_quota_exhausted = False
    service._current_provider = 'gemini'
    service._provider_switch_count = 0
    
    print("📊 Initial state:")
    print(f"   - Provider: {service._current_provider}")
    print(f"   - Gemini exhausted: {service._gemini_quota_exhausted}")
    
    # This will try Gemini first, then fallback if quota is exhausted
    test_prompt = "Write one sentence about software engineering."
    
    try:
        print("\n📤 Attempting API request (will try Gemini first)...")
        response = service._make_api_request_with_retry(test_prompt)
        
        print("\n✅ Request completed successfully")
        print(f"   - Final provider: {service._current_provider}")
        print(f"   - Gemini exhausted: {service._gemini_quota_exhausted}")
        print(f"   - Switch count: {service._provider_switch_count}")
        print(f"   - Response preview: {response[:100]}...")
        
        return True
    except Exception as e:
        print(f"\n❌ Request failed: {e}")
        return False


def test_cv_generation_with_metadata(service):
    """Test 5: Generate sample CV and check metadata"""
    print_section("TEST 5: CV Generation with API Metadata")
    
    if not service:
        print("❌ Service not initialized. Skipping test.")
        return False
    
    # Sample minimal user data
    test_user_data = {
        'first_name': 'John',
        'last_name': 'Doe',
        'email': 'john.doe@example.com',
        'phone': '+1234567890',
        'location': 'San Francisco, CA',
        'job_seeker_profile': {
            'professional_title': 'Software Engineer',
            'years_of_experience': 5,
            'professional_summary': 'Experienced software engineer with focus on web development',
            'skills': 'Python, JavaScript, React, Node.js, PostgreSQL',
            'soft_skills': 'Leadership, Communication, Problem Solving'
        },
        'work_experiences': [
            {
                'job_title': 'Senior Developer',
                'company_name': 'Tech Corp',
                'company_location': 'San Francisco, CA',
                'start_date': '2020-01',
                'end_date': '2024-12',
                'is_current': True,
                'description': 'Lead development of web applications',
                'key_responsibilities': 'Architecture, code review, mentoring',
                'achievements': 'Improved performance by 40%',
                'technologies_used': ['Python', 'React', 'AWS']
            }
        ],
        'educations': [
            {
                'degree_title': 'Bachelor of Science in Computer Science',
                'institution_name': 'University of California',
                'graduation_date': '2019-05'
            }
        ]
    }
    
    test_job_data = {
        'title': 'Senior Software Engineer',
        'company_name': 'Innovation Inc',
        'requirements': 'Python, React, 5+ years experience',
        'description': 'Build scalable web applications'
    }
    
    try:
        print("🚀 Generating CV (this may take 30-60 seconds)...")
        print(f"   - Target role: {test_job_data['title']}")
        print(f"   - Current provider: {service._current_provider}")
        
        result = service.generate_cv_section_by_section(
            user_data=test_user_data,
            job_data=test_job_data,
            cv_style='professional',
            include_sections=['summary', 'experience', 'skills']
        )
        
        print("\n✅ CV generated successfully!")
        
        # Check API metadata
        if 'api_metadata' in result:
            metadata = result['api_metadata']
            print("\n📊 API Metadata:")
            print(f"   - Primary provider: {metadata.get('primary_provider')}")
            print(f"   - Current provider: {metadata.get('current_provider')}")
            print(f"   - Gemini exhausted: {metadata.get('gemini_quota_exhausted')}")
            print(f"   - Provider switches: {metadata.get('provider_switches')}")
            print(f"   - Fallback enabled: {metadata.get('fallback_enabled')}")
        
        # Check generation progress
        completed = len([p for p in result.get('generation_progress', []) if p['status'] == 'completed'])
        print(f"\n📈 Generation Stats:")
        print(f"   - Sections completed: {completed}")
        print(f"   - Todos created: {len(result.get('todos', []))}")
        
        # Check for API quota todos
        api_todos = [t for t in result.get('todos', []) if t['section'] == 'api_quota']
        if api_todos:
            print("\n⚠️  API Quota Todos:")
            for todo in api_todos:
                print(f"   - {todo['issue']}: {todo['suggestion']}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ CV generation failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    print_section("CV Builder API Fallback System - Test Suite")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = []
    
    # Test 1: Configuration
    config_ok = test_api_configuration()
    results.append(('API Configuration', config_ok))
    
    if not config_ok:
        print("\n⚠️  Cannot proceed with API tests without proper configuration.")
        print("Please set GEMINI_API_KEY and OPENROUTER_API_KEY in .env file.")
        return
    
    # Test 2: Initialization
    service = test_service_initialization()
    results.append(('Service Initialization', service is not None))
    
    if not service:
        print("\n❌ Cannot proceed with API tests. Service initialization failed.")
        return
    
    # Test 3: OpenRouter fallback
    openrouter_ok = test_openrouter_fallback(service)
    results.append(('OpenRouter Fallback', openrouter_ok))
    
    # Reinitialize service for next test
    service = CVBuilderServiceV3()
    
    # Test 4: Automatic switching
    switch_ok = test_gemini_to_openrouter_switch(service)
    results.append(('Automatic API Switch', switch_ok))
    
    # Test 5: Full CV generation
    # Note: This uses real API calls and may be slow
    print("\n⏳ Final test will generate a real CV (may take 30-60 seconds)...")
    user_input = input("Proceed with CV generation test? (y/n): ")
    
    if user_input.lower() == 'y':
        service = CVBuilderServiceV3()
        cv_ok = test_cv_generation_with_metadata(service)
        results.append(('CV Generation with Metadata', cv_ok))
    else:
        print("Skipping CV generation test.")
        results.append(('CV Generation with Metadata', None))
    
    # Summary
    print_section("Test Results Summary")
    
    for test_name, result in results:
        if result is None:
            status = "⊘ SKIPPED"
        elif result:
            status = "✅ PASSED"
        else:
            status = "❌ FAILED"
        
        print(f"{status}  {test_name}")
    
    passed = sum(1 for _, r in results if r is True)
    failed = sum(1 for _, r in results if r is False)
    skipped = sum(1 for _, r in results if r is None)
    total = len(results)
    
    print(f"\n📊 Final Score: {passed}/{total} passed, {failed} failed, {skipped} skipped")
    
    if failed == 0 and passed > 0:
        print("\n🎉 All tests passed! API fallback system is working correctly.")
    elif failed > 0:
        print("\n⚠️  Some tests failed. Review the output above for details.")
    
    print(f"\nTest completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
