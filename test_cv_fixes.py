#!/usr/bin/env python3
"""
Quick test script to verify CV Builder fixes
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def test_json_parser():
    """Test enhanced JSON parser"""
    print("🧪 Testing JSON Parser...")
    try:
        from src.services.cv.parser import CVParser
        
        parser = CVParser()
        
        # Test truncated JSON
        truncated_json = '''{"contact_information": {"full_name": "John Doe", "email": "john@example.com"'''
        result = parser.parse_cv_response(truncated_json)
        
        if result and isinstance(result, dict):
            print("✅ JSON parser handles truncated JSON")
            return True
        else:
            print("❌ JSON parser failed")
            return False
    except Exception as e:
        print(f"❌ JSON parser error: {e}")
        return False

def test_ats_scoring():
    """Test enhanced ATS scoring"""
    print("\n🧪 Testing ATS Scoring...")
    try:
        from src.services.cv_builder_enhancements import CVBuilderEnhancements
        
        test_cv = {
            'contact_information': {
                'email': 'test@example.com',
                'phone': '+1234567890',
                'linkedin': 'linkedin.com/in/test'
            },
            'professional_summary': 'Experienced software engineer with 5 years of experience in full-stack development',
            'professional_experience': [
                {
                    'company': 'Tech Corp',
                    'achievements': ['Improved performance by 45%', 'Led team of 5 developers']
                }
            ],
            'education': [{'degree': 'BS Computer Science'}],
            'technical_skills': {'core_skills': ['Python', 'JavaScript', 'React']}
        }
        
        score = CVBuilderEnhancements.calculate_ats_score(test_cv)
        
        if score and 'total_score' in score and 'breakdown' in score:
            print(f"✅ ATS scoring works - Score: {score['total_score']}/100")
            print(f"   Strengths: {len(score.get('strengths', []))}")
            print(f"   Improvements: {len(score.get('improvements', []))}")
            return True
        else:
            print("❌ ATS scoring failed")
            return False
    except Exception as e:
        print(f"❌ ATS scoring error: {e}")
        return False

def test_api_client():
    """Test API client enhancements"""
    print("\n🧪 Testing API Client...")
    try:
        from src.services.cv.api_client import CVAPIClient
        
        client = CVAPIClient()
        stats = client.get_statistics()
        
        if stats and 'total_requests' in stats:
            print(f"✅ API client works - Stats: {stats}")
            return True
        else:
            print("❌ API client failed")
            return False
    except Exception as e:
        print(f"❌ API client error: {e}")
        return False

def test_structured_logger():
    """Test structured logging"""
    print("\n🧪 Testing Structured Logger...")
    try:
        from src.utils.cv_logger import cv_generation_logger
        
        cv_generation_logger.log_generation_start(user_id=1, sections=['summary', 'work'])
        cv_generation_logger.log_section_start('summary')
        cv_generation_logger.log_section_complete('summary', status='success')
        
        print("✅ Structured logger works")
        return True
    except Exception as e:
        print(f"❌ Structured logger error: {e}")
        return False

def test_optimization_tips():
    """Test optimization tips generator"""
    print("\n🧪 Testing Optimization Tips...")
    try:
        from src.services.cv_builder_enhancements import CVBuilderEnhancements
        
        test_cv = {
            'professional_summary': 'Short summary',
            'professional_experience': [],
            'technical_skills': {'core_skills': ['Python']},
            'contact_information': {'email': 'test@example.com'}
        }
        
        tips = CVBuilderEnhancements.generate_optimization_tips(test_cv)
        
        if tips and len(tips) > 0:
            print(f"✅ Optimization tips work - Generated {len(tips)} tips")
            for i, tip in enumerate(tips[:3], 1):
                print(f"   {i}. {tip[:60]}...")
            return True
        else:
            print("❌ Optimization tips failed")
            return False
    except Exception as e:
        print(f"❌ Optimization tips error: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("CV Builder Fixes - Test Suite")
    print("=" * 60)
    
    tests = [
        test_json_parser,
        test_ats_scoring,
        test_api_client,
        test_structured_logger,
        test_optimization_tips
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            if test():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"❌ Test crashed: {e}")
            failed += 1
    
    print("\n" + "=" * 60)
    print(f"Test Results: {passed} passed, {failed} failed")
    print("=" * 60)
    
    if failed == 0:
        print("🎉 All tests passed! CV Builder is ready.")
        return 0
    else:
        print(f"⚠️  {failed} test(s) failed. Check the errors above.")
        return 1

if __name__ == '__main__':
    sys.exit(main())
