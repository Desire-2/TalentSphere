"""
AI-Powered CV Builder Service
Uses Google Gemini AI to create tailored, creative CV content based on user profile and target job
Frontend handles all styling, templates, and PDF generation for maximum flexibility
"""
from datetime import datetime
import json
import os
import time
from typing import Dict, List, Optional, Any

# Conditional import for Google Gemini - only needed for AI content generation
try:
    from google import genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    genai = None

# Import enhancements module
from src.services.cv_builder_enhancements import CVBuilderEnhancements


class CVBuilderService:
    """Service for generating AI-powered, job-tailored CV content (frontend handles rendering)"""
    
    def __init__(self):
        """Initialize the CV builder with Gemini AI client and OpenRouter fallback"""
        self.client = None
        self._api_key = os.getenv('GEMINI_API_KEY')
        self._openrouter_api_key = os.getenv('OPENROUTER_API_KEY')
        self._site_url = os.getenv('SITE_URL', 'https://talentsphere.com')
        self._site_name = os.getenv('SITE_NAME', 'TalentSphere')
        self._last_request_time = 0
        self._min_request_interval = 2  # Minimum 2 seconds between requests
        
        # API provider tracking
        self._current_provider = 'openrouter'  # Start with OpenRouter as default
        self._openrouter_quota_exhausted = False  # Track OpenRouter quota status
        self._gemini_quota_exhausted = False
        self.generation_progress = []
        self.section_todos = []
    
    def _get_client(self):
        """Lazy initialization of Gemini client"""
        if not GEMINI_AVAILABLE:
            raise ValueError(
                "Google Gemini package is not installed. "
                "Install it with: pip install google-generativeai"
            )
        
        if self.client is None:
            if not self._api_key:
                raise ValueError(
                    "GEMINI_API_KEY not found in environment variables. "
                    "Please add it to your .env file to use the CV Builder."
                )
            self.client = genai.Client(api_key=self._api_key)
        return self.client
    
    def _rate_limit_wait(self):
        """Ensure we don't exceed rate limits"""
        current_time = time.time()
        time_since_last_request = current_time - self._last_request_time
        
        if time_since_last_request < self._min_request_interval:
            wait_time = self._min_request_interval - time_since_last_request
            time.sleep(wait_time)
        
        self._last_request_time = time.time()
    
    def _call_openrouter_api(self, prompt: str, temperature: float = 0.7, max_tokens: int = 4096) -> str:
        """Call OpenRouter API as fallback when Gemini is unavailable"""
        if not self._openrouter_api_key:
            raise ValueError("OPENROUTER_API_KEY not found. Add it to .env to use fallback.")
        
        import requests
        
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self._openrouter_api_key}",
            "HTTP-Referer": self._site_url,
            "X-Title": self._site_name,
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "openai/gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=60)
            response.raise_for_status()
            result = response.json()
            
            if 'choices' in result and len(result['choices']) > 0:
                self._current_provider = 'openrouter'
                print(f"[CV Builder] ✅ OpenRouter API fallback successful")
                return result['choices'][0]['message']['content']
            else:
                raise Exception("OpenRouter returned empty response")
        except Exception as e:
            raise Exception(f"OpenRouter API failed: {str(e)}")
    
    def _make_api_request_with_retry(self, prompt: str, max_retries: int = 3) -> str:
        """Make API request with exponential backoff retry logic and automatic Gemini fallback
        
        Priority order:
        1. OpenRouter (default) - gpt-4o-mini, fast and reliable
        2. Gemini (fallback) - when OpenRouter hits limits or fails
        """
        
        # If we know OpenRouter quota is exhausted, use Gemini directly
        if self._openrouter_quota_exhausted and self._api_key:
            print(f"[CV Builder] 🔄 Using Gemini API (OpenRouter quota previously exhausted)")
            try:
                response = self._call_gemini_api(prompt, temperature=0.7, max_tokens=2048)
                print(f"[CV Builder] ✅ Gemini API succeeded")
                return response
            except Exception as e:
                # If Gemini also fails, try OpenRouter again (quota might have reset)
                print(f"[CV Builder] ⚠️ Gemini failed, trying OpenRouter again: {str(e)[:100]}")
                self._openrouter_quota_exhausted = False
        
        # Try OpenRouter first (PRIMARY API)
        if self._openrouter_api_key:
            for attempt in range(max_retries):
                try:
                    # Wait to respect rate limits
                    self._rate_limit_wait()
                    
                    response = self._call_openrouter_api(prompt, temperature=0.7, max_tokens=2048)
                    print(f"[CV Builder] ✅ OpenRouter API succeeded")
                    return response
                    
                except Exception as e:
                    error_str = str(e)
                    
                    # Check if it's a rate limit error
                    is_rate_limit = any(pattern in error_str for pattern in [
                        '429', 'quota', 'QUOTA', 'rate limit', 'Rate limit',
                        'too many requests', 'requests per minute', 'requests per day',
                        'RESOURCE_EXHAUSTED'
                    ])
                    
                    if is_rate_limit:
                        if attempt < max_retries - 1:
                            wait_time = (2 ** attempt) * 2  # Exponential backoff: 2s, 4s, 8s
                            print(f"[CV Builder] OpenRouter rate limit hit. Waiting {wait_time}s before retry {attempt + 1}/{max_retries}...")
                            time.sleep(wait_time)
                            continue
                        else:
                            # Mark OpenRouter quota as exhausted and try Gemini
                            self._openrouter_quota_exhausted = True
                            print(f"[CV Builder] ⚠️ OpenRouter rate limit exhausted after {max_retries} retries")
                            break
                    else:
                        # Non-rate-limit error - log and try Gemini
                        print(f"[CV Builder] ⚠️ OpenRouter error (attempt {attempt + 1}): {error_str[:150]}")
                        if attempt < max_retries - 1:
                            time.sleep(2)
                            continue
                        else:
                            break
        
        # Fallback to Gemini if OpenRouter failed or not configured
        print(f"[CV Builder] 🔄 Falling back to Gemini API...")
        
        if not self._api_key:
            raise Exception(
                "OpenRouter failed and no Gemini API key found. "
                "Please configure at least one API: GEMINI_API_KEY or OPENROUTER_API_KEY in .env"
            )
        
        client = self._get_client()
        
        for attempt in range(max_retries):
            try:
                # Wait to respect rate limits
                self._rate_limit_wait()
                
                # Make the API call
                response = client.models.generate_content(
                    model="gemini-flash-latest",  # Use stable flash model
                    contents=prompt,
                    config={
                        'temperature': 0.7,
                        'max_output_tokens': 2048,
                    }
                )
                
                # Check if response has valid text
                if not response:
                    print(f"[CV Builder] Attempt {attempt + 1}: No response object received")
                    if attempt < max_retries - 1:
                        time.sleep(2)
                        continue
                    raise Exception("API returned no response object")
                
                # Check for blocked content
                if hasattr(response, 'prompt_feedback'):
                    feedback = response.prompt_feedback
                    if hasattr(feedback, 'block_reason') and feedback.block_reason:
                        print(f"[CV Builder] Content blocked: {feedback.block_reason}")
                        raise Exception(f"Content was blocked by safety filters: {feedback.block_reason}")
                
                # Get the text from response
                if not hasattr(response, 'text') or not response.text:
                    # Try to get candidates
                    if hasattr(response, 'candidates') and response.candidates:
                        candidate = response.candidates[0]
                        if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                            text = ''.join(part.text for part in candidate.content.parts if hasattr(part, 'text'))
                            if text:
                                print(f"[CV Builder] ✅ Gemini API succeeded")
                                return text
                    
                    print(f"[CV Builder] Attempt {attempt + 1}: Response has no text")
                    print(f"[CV Builder] Response object: {dir(response)}")
                    if attempt < max_retries - 1:
                        time.sleep(2)
                        continue
                    raise Exception("API returned empty response - no text content found")
                
                print(f"[CV Builder] ✅ Gemini API succeeded")
                return response.text
                
            except Exception as e:
                error_str = str(e)
                
                # Check if it's a rate limit error (multiple patterns)
                is_rate_limit = any(pattern in error_str for pattern in [
                    '429', 'RESOURCE_EXHAUSTED', 'quota', 'QUOTA',
                    'rate limit', 'Rate limit', 'too many requests',
                    'requests per minute', 'requests per day'
                ])
                
                if is_rate_limit:
                    if attempt < max_retries - 1:
                        # Extract retry delay from error message if available
                        wait_time = (2 ** attempt) * 2  # Exponential backoff: 2s, 4s, 8s
                        
                        # Try to parse the suggested retry delay from error
                        if 'retry in' in error_str.lower():
                            try:
                                # Extract milliseconds and convert to seconds
                                import re
                                match = re.search(r'retry in ([\d.]+)ms', error_str)
                                if match:
                                    suggested_wait = float(match.group(1)) / 1000
                                    wait_time = max(wait_time, suggested_wait + 1)
                            except:
                                pass
                        
                        print(f"[CV Builder] Gemini rate limit hit. Waiting {wait_time}s before retry {attempt + 1}/{max_retries}...")
                        time.sleep(wait_time)
                        continue
                    else:
                        # Both APIs exhausted
                        self._gemini_quota_exhausted = True
                        raise Exception(
                            "Both OpenRouter and Gemini APIs rate limits exceeded. "
                            "Please wait a few minutes and try again. "
                            "Free tier limits: OpenRouter ~200 req/day, Gemini 15 req/min & 1500 req/day."
                        )
                else:
                    # Not a rate limit error, raise it
                    raise
        
        raise Exception("Max retries exceeded for both APIs")
        
    def _call_gemini_api(self, prompt: str, temperature: float = 0.7, max_tokens: int = 2048) -> str:
        """Direct call to Gemini API (used when it's the fallback)"""
        client = self._get_client()
        
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt,
            config={
                'temperature': temperature,
                'max_output_tokens': max_tokens,
            }
        )
        
        # Check if response has valid text
        if not response:
            raise Exception("Gemini API returned no response object")
        
        # Check for blocked content
        if hasattr(response, 'prompt_feedback'):
            feedback = response.prompt_feedback
            if hasattr(feedback, 'block_reason') and feedback.block_reason:
                raise Exception(f"Content was blocked by safety filters: {feedback.block_reason}")
        
        # Get the text from response
        if hasattr(response, 'text') and response.text:
            self._current_provider = 'gemini'
            return response.text
        
        # Try to get candidates
        if hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                text = ''.join(part.text for part in candidate.content.parts if hasattr(part, 'text'))
                if text:
                    self._current_provider = 'gemini'
                    return text
        
        raise Exception("Gemini API returned empty response")

    def generate_cv_content(
        self, 
        user_data: Dict[str, Any],
        job_data: Optional[Dict[str, Any]] = None,
        cv_style: str = "professional",
        include_sections: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Generate AI-optimized CV content tailored to specific job
        
        Args:
            user_data: Complete user profile including work experience, education, skills
            job_data: Target job information (title, description, requirements)
            cv_style: Style preference (professional, creative, modern, minimal, executive)
            include_sections: Sections to include (work, education, skills, projects, etc.)
            
        Returns:
            Dictionary with structured CV content and metadata
        """
        if include_sections is None:
            include_sections = ['work', 'education', 'skills', 'summary', 'projects', 'certifications', 'awards', 'references']
        
        # Debug logging
        print(f"[CV Builder Service] Generating CV with job_data: {job_data}")
        print(f"[CV Builder Service] Style: {cv_style}, Sections: {include_sections}")
        
        try:
            # Build comprehensive prompt for CV generation
            prompt = self._build_cv_generation_prompt(user_data, job_data, cv_style, include_sections)
            
            print(f"[CV Builder Service] Prompt length: {len(prompt)} characters")
        except Exception as prompt_err:
            print(f"[CV Builder Service] Error building prompt: {str(prompt_err)}")
            raise Exception(f"Failed to build CV prompt: {str(prompt_err)}")
        
        try:
            # Generate CV content using Gemini with retry logic, fallback to OpenRouter if needed
            try:
                response_text = self._make_api_request_with_retry(prompt)
                print(f"[CV Builder] ✅ Gemini API succeeded")
            except Exception as gemini_error:
                error_str = str(gemini_error)
                # Check if it's a quota/overload error that should trigger OpenRouter fallback
                should_fallback = any(pattern in error_str for pattern in [
                    'quota', 'QUOTA', 'RESOURCE_EXHAUSTED', '429',
                    'overloaded', 'UNAVAILABLE', '503',
                    'rate limit', 'too many requests'
                ])
                
                if should_fallback and self._openrouter_api_key:
                    print(f"[CV Builder] ⚠️ Gemini API error: {error_str[:100]}...")
                    print(f"[CV Builder] 🔄 Automatically switching to OpenRouter API as fallback...")
                    self._gemini_quota_exhausted = True
                    response_text = self._call_openrouter_api(prompt, temperature=0.7, max_tokens=2048)
                    print(f"[CV Builder] ✅ OpenRouter API succeeded (fallback active)")
                else:
                    # Re-raise if not a quota error or no OpenRouter key
                    raise
            
            # Log the raw response for debugging
            print(f"[CV Builder] Received response length: {len(response_text)} characters")
            
            # Parse the AI response
            cv_content = self._parse_cv_response(response_text)
            
            # === ENHANCED: Comprehensive data normalization ===
            cv_content = CVBuilderEnhancements.normalize_cv_data(cv_content)
            print("[CV Builder] Data normalization completed")
            
            # === ENHANCED: Validate that ALL selected sections are present ===
            cv_content = self._validate_and_fill_sections(cv_content, include_sections)
            
            # === ENHANCED: Post-generation final section check ===
            missing_critical = self._final_section_check(cv_content, include_sections)
            if missing_critical:
                print(f"[CV Builder] ⚠️  CRITICAL: Still missing sections after validation: {missing_critical}")
                # Force add them one more time
                for section in missing_critical:
                    cv_content = self._force_add_section(cv_content, section)
            
            # === ENHANCED: Calculate enhanced ATS score ===
            cv_content['ats_score'] = CVBuilderEnhancements.calculate_ats_score(cv_content, job_data)
            score = cv_content['ats_score'].get('total_score', cv_content['ats_score'].get('estimated_score', 0))
            print(f"[CV Builder] ATS Score: {score}/100")
            
            # === ENHANCED: Generate optimization tips ===
            cv_content['optimization_tips'] = CVBuilderEnhancements.generate_optimization_tips(cv_content, job_data)
            print(f"[CV Builder] Generated {len(cv_content['optimization_tips'])} optimization tips")
            
            # === ENHANCED: Add comprehensive metadata ===
            cv_content['metadata'] = {
                'generated_at': datetime.utcnow().isoformat(),
                'style': cv_style,
                'tailored_for_job': job_data.get('title') if job_data else None,
                'company': job_data.get('company_name') if job_data else None,
                'sections_included': include_sections,
                'sections_validated': len(include_sections),
                'user_id': user_data.get('id'),
                'version': '3.0-enhanced'
            }
            
            # === ENHANCED: Final quality score ===
            quality_score = self._calculate_quality_score(cv_content, include_sections)
            cv_content['metadata']['quality_score'] = quality_score
            print(f"[CV Builder] Overall quality score: {quality_score}/100")
            
            return cv_content
            
        except Exception as e:
            # Save problematic response for debugging
            if 'response_text' in locals():
                try:
                    import os
                    debug_dir = os.path.join(os.path.dirname(__file__), '../../debug_responses')
                    os.makedirs(debug_dir, exist_ok=True)
                    debug_file = os.path.join(debug_dir, f'failed_cv_response_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}.txt')
                    with open(debug_file, 'w') as f:
                        f.write(f"Error: {str(e)}\n\n")
                        f.write("=" * 80 + "\n")
                        f.write("RAW RESPONSE:\n")
                        f.write("=" * 80 + "\n")
                        f.write(response_text)
                    print(f"[CV Builder] Saved problematic response to {debug_file}")
                except Exception as save_err:
                    print(f"[CV Builder] Could not save debug response: {save_err}")
            
            raise Exception(f"CV generation failed: {str(e)}")
    
    def generate_cv_section_by_section(
        self,
        user_data: Dict,
        job_data: Optional[Dict] = None,
        cv_style: str = 'professional',
        include_sections: List[str] = None
    ) -> Dict[str, Any]:
        """
        Generate CV sections individually with targeted profile data
        
        Args:
            user_data: Complete user profile data
            job_data: Optional job posting data for tailoring
            cv_style: CV style template
            include_sections: List of sections to generate
            
        Returns:
            Complete CV content dictionary with all sections
        """
        print(f"[CV Builder] Starting section-by-section generation")
        
        # Reset progress tracking
        self.generation_progress = []
        self.section_todos = []
        
        # Default sections if not specified - Professional CV order
        if include_sections is None:
            include_sections = ['summary', 'work', 'education', 'skills', 'certifications', 'projects', 'awards', 'references']
        
        # Section-specific data mapping
        section_data_map = {
            'summary': ['personal_info', 'job_seeker_profile', 'work_experiences'],
            'work': ['work_experiences'],
            'education': ['educations'],
            'skills': ['job_seeker_profile'],
            'certifications': ['certifications'],
            'projects': ['projects'],
            'awards': ['awards'],
            'references': ['references']
        }
        
        # Initialize CV content structure
        cv_content = {
            'contact_information': self._extract_contact_info(user_data),
            'professional_summary': '',
            'professional_experience': [],
            'education': [],
            'technical_skills': {},
            'core_competencies': [],
            'certifications': [],
            'projects': [],
            'awards': [],
            'references': []
        }
        
        # Generate each section with only relevant data
        for section in include_sections:
            try:
                print(f"[CV Builder] 📝 Generating section: {section}")
                
                # Validate section data availability
                validation = self._validate_section_data(section, user_data)
                
                if not validation['has_data']:
                    print(f"[CV Builder] ⚠️  Section {section} has insufficient data: {validation['missing_fields']}")
                    self.section_todos.append({
                        'section': section,
                        'reason': 'insufficient_profile_data',
                        'missing_fields': validation['missing_fields'],
                        'suggestions': validation['suggestions']
                    })
                    self.generation_progress.append({
                        'section': section,
                        'status': 'skipped',
                        'reason': 'no_profile_data',
                        'timestamp': datetime.utcnow().isoformat()
                    })
                    continue
                
                # Get relevant data for this section
                section_user_data = self._extract_section_data(user_data, section_data_map.get(section, []))
                
                # Generate section content
                section_content = self._generate_single_section(
                    section=section,
                    user_data=section_user_data,
                    job_data=job_data,
                    cv_style=cv_style
                )
                
                # Merge section content into CV
                cv_content = self._merge_section_content(cv_content, section, section_content)
                
                # Track progress
                self.generation_progress.append({
                    'section': section,
                    'status': 'completed',
                    'has_data': bool(section_content),
                    'timestamp': datetime.utcnow().isoformat()
                })
                
                # Proactive improvement tasks per section
                default_tasks = {
                    'summary': ['Include target job title', 'Add 2 quantifiable achievements', 'Keep between 50-65 words'],
                    'work': ['Ensure only relevant roles included', 'Add metrics to each bullet', 'Use job keywords prominently'],
                    'education': ['Include relevant coursework', 'Add honors/GPA if strong'],
                    'skills': ['Prioritize skills matching job requirements', 'Group by categories (languages, frameworks, tools)'],
                    'certifications': ['Prioritize certifications relevant to job', 'Add credential ID/URL if available'],
                    'projects': ['Highlight impact and technologies', 'Limit to top 2-3 relevant projects'],
                    'awards': ['Include date and issuer', 'Explain significance briefly'],
                    'references': ['Prefer 2-3 professional references', 'Ensure contact info is present']
                }
                if section in default_tasks:
                    self.section_todos.append({
                        'section': section,
                        'reason': 'review_refinement',
                        'suggestions': default_tasks[section]
                    })

                # Add todo if section is incomplete or empty
                if not section_content:
                    self.section_todos.append({
                        'section': section,
                        'reason': 'no_data_in_profile',
                        'suggestion': f'Add {section} information to your profile for a complete CV'
                    })
                elif isinstance(section_content, list) and len(section_content) == 0:
                    self.section_todos.append({
                        'section': section,
                        'reason': 'empty_section',
                        'suggestion': f'Add {section} details to strengthen your CV'
                    })
                elif isinstance(section_content, str) and len(section_content) < 20:
                    self.section_todos.append({
                        'section': section,
                        'reason': 'insufficient_content',
                        'suggestion': f'Expand {section} with more details'
                    })
                
                print(f"[CV Builder] ✅ Completed section: {section}")
                
            except Exception as e:
                print(f"[CV Builder] ⚠️  Error generating {section}: {str(e)}")
                
                # Still mark as completed but with warning
                self.generation_progress.append({
                    'section': section,
                    'status': 'completed_with_warning',
                    'error': str(e),
                    'timestamp': datetime.utcnow().isoformat()
                })
                
                # Add a default empty value for the section
                if section == 'summary':
                    cv_content['professional_summary'] = ''
                elif section == 'work':
                    cv_content['professional_experience'] = []
                elif section == 'education':
                    cv_content['education'] = []
                elif section == 'skills':
                    cv_content['technical_skills'] = {}
                    cv_content['core_competencies'] = []
                elif section == 'certifications':
                    cv_content['certifications'] = []
                elif section == 'projects':
                    cv_content['projects'] = []
                elif section == 'awards':
                    cv_content['awards'] = []
                elif section == 'references':
                    cv_content['references'] = []
                
                self.section_todos.append({
                    'section': section,
                    'reason': 'generation_failed',
                    'error': str(e)[:200],  # Truncate long errors
                    'suggestion': f'Try regenerating {section} or add this information manually'
                })
        
        # Calculate ATS score
        cv_content['ats_score'] = CVBuilderEnhancements.calculate_ats_score(cv_content, job_data)
        score = cv_content['ats_score'].get('total_score', 0)
        print(f"[CV Builder] ATS Score: {score}/100")
        
        # Validate all requested sections are present
        section_validation = {
            'summary': 'professional_summary',
            'work': 'professional_experience',
            'education': 'education',
            'skills': ['technical_skills', 'core_competencies'],
            'certifications': 'certifications',
            'projects': 'projects',
            'awards': 'awards',
            'references': 'references'
        }
        
        missing_sections = []
        for section in include_sections:
            target = section_validation.get(section)
            if isinstance(target, list):
                # Check if any of the targets exist
                if not any(cv_content.get(t) for t in target):
                    missing_sections.append(section)
            elif target:
                if target not in cv_content or not cv_content[target]:
                    missing_sections.append(section)
        
        if missing_sections:
            print(f"[CV Builder] ⚠️  Missing sections after generation: {missing_sections}")
            for section in missing_sections:
                if not any(t['section'] == section for t in self.section_todos):
                    self.section_todos.append({
                        'section': section,
                        'reason': 'missing_after_generation',
                        'suggestion': f'Section {section} was not generated. Check your profile data or try again.'
                    })
        
        # Add metadata
        cv_content['metadata'] = {
            'generated_at': datetime.utcnow().isoformat(),
            'style': cv_style,
            'job_tailored': bool(job_data),
            'sections_generated': len([p for p in self.generation_progress if p['status'] == 'completed']),
            'sections_requested': len(include_sections),
            'generation_method': 'section_by_section',
            'todos': self.section_todos
        }
        
        print(f"[CV Builder] ✅ Section-by-section generation complete")
        print(f"[CV Builder] 📊 Progress: {len([p for p in self.generation_progress if p['status'] == 'completed'])}/{len(include_sections)} sections")
        if self.section_todos:
            print(f"[CV Builder] 📋 {len(self.section_todos)} todos for improvement")
        
        return cv_content
    
    def _extract_section_data(self, user_data: Dict, data_keys: List[str]) -> Dict:
        """Extract only relevant data for a specific section with enhanced profile info"""
        section_data = {}
        
        for key in data_keys:
            if key in user_data:
                section_data[key] = user_data[key]
        
        # Always include basic info
        if 'id' in user_data:
            section_data['id'] = user_data['id']
        if 'email' in user_data:
            section_data['email'] = user_data['email']
        if 'first_name' in user_data:
            section_data['first_name'] = user_data['first_name']
        if 'last_name' in user_data:
            section_data['last_name'] = user_data['last_name']
        
        # Always include job_seeker_profile for context (used by all sections)
        if 'job_seeker_profile' in user_data and 'job_seeker_profile' not in section_data:
            section_data['job_seeker_profile'] = user_data['job_seeker_profile']
            
        return section_data
    
    def _validate_section_data(self, section: str, user_data: Dict) -> Dict:
        """Validate if profile has sufficient data for a section and return validation result"""
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
        
        elif section == 'work' or section == 'experience':
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
        
        elif section == 'references':
            references = user_data.get('references', [])
            validation['has_data'] = len(references) > 0
            if not validation['has_data']:
                validation['missing_fields'].append('references')
                validation['suggestions'].append('Add professional references (optional but strengthens CV)')
        
        return validation
    
    def _generate_single_section(
        self,
        section: str,
        user_data: Dict,
        job_data: Optional[Dict],
        cv_style: str
    ) -> Any:
        """Generate a single CV section using targeted prompt"""
        
        # Build section-specific prompt
        prompt = self._build_section_prompt(section, user_data, job_data, cv_style)
        
        if not prompt:
            print(f"[CV Builder] No prompt generated for {section}")
            return None
        
        # Make API request with Gemini, fallback to OpenRouter if needed
        try:
            response_text = self._make_api_request_with_retry(prompt)
            print(f"[CV Builder] ✅ Gemini API succeeded for {section}")
        except Exception as gemini_error:
            error_str = str(gemini_error)
            # Check if it's a quota/overload error that should trigger OpenRouter fallback
            should_fallback = any(pattern in error_str for pattern in [
                'quota', 'QUOTA', 'RESOURCE_EXHAUSTED', '429',
                'overloaded', 'UNAVAILABLE', '503',
                'rate limit', 'too many requests'
            ])
            
            if should_fallback and self._openrouter_api_key:
                print(f"[CV Builder] ⚠️  Gemini error for {section}: {error_str[:100]}")
                print(f"[CV Builder] 🔄 Automatically switching to OpenRouter API for {section}...")
                self._gemini_quota_exhausted = True
                try:
                    response_text = self._call_openrouter_api(prompt, temperature=0.7, max_tokens=2048)
                    print(f"[CV Builder] ✅ OpenRouter API succeeded for {section} (fallback active)")
                except Exception as openrouter_error:
                    print(f"[CV Builder] ❌ Both APIs failed for {section}: Gemini rate limit + OpenRouter error: {str(openrouter_error)[:100]}")
                    return None
            else:
                if should_fallback:
                    print(f"[CV Builder] ❌ Gemini rate limit for {section} and no OpenRouter key configured")
                    print(f"[CV Builder] 💡 Add OPENROUTER_API_KEY to .env for automatic fallback")
                else:
                    print(f"[CV Builder] ❌ API request failed for {section}: {error_str[:100]}")
                return None
        
        # Parse response
        try:
            import json_repair
            section_content = json_repair.loads(response_text)
            result = section_content.get(section)
            if result:
                print(f"[CV Builder] ✅ Successfully parsed {section}")
            return result
        except Exception as e:
            print(f"[CV Builder] ⚠️  Failed to parse {section} response: {str(e)}")
            # Try to extract any useful data from response
            try:
                # Sometimes the AI returns just the content without wrapping
                return json_repair.loads(response_text)
            except:
                return None
    
    def _build_section_prompt(
        self,
        section: str,
        user_data: Dict,
        job_data: Optional[Dict],
        cv_style: str
    ) -> str:
        """Build a focused prompt for a specific section with targeted profile data"""
        
        # Extract profile information
        profile = user_data.get('job_seeker_profile', {})
        
        job_context = ""
        if job_data:
            job_context = f"""
🎯 TARGET JOB DETAILS:
Title: {job_data.get('title', 'N/A')}
Company: {job_data.get('company_name', 'N/A')}
Experience Level: {job_data.get('experience_level', 'N/A')}

Requirements:
{job_data.get('requirements', 'N/A')}

Description:
{job_data.get('description', 'N/A')[:500]}...

**IMPORTANT**: Tailor the content to match these job requirements and use relevant keywords.
"""
        
        section_prompts = {
            'summary': f"""Generate a compelling professional summary (40-70 words) that:
- Highlights key qualifications and years of experience
- Matches the job requirements{' from the job posting' if job_data else ''}
- Showcases unique value proposition
- Uses strong action words and measurable achievements

📋 PROFILE INFORMATION:
Professional Title: {profile.get('professional_title', 'Professional')}
Years of Experience: {profile.get('years_of_experience', 0)}
Career Level: {profile.get('career_level', 'Not specified')}
Desired Position: {profile.get('desired_position', 'Open to opportunities')}
Professional Summary: {profile.get('professional_summary', 'Not provided')}

💼 WORK EXPERIENCE CONTEXT:
{self._format_work_experience(user_data.get('work_experiences', []))}

🎓 EDUCATION LEVEL:
{profile.get('education_level', 'Not specified')}

{job_context}

Return JSON: {{"summary": "your professional summary here"}}""",
            
            'work': f"""Generate professional experience entries with:
- Job titles, companies, dates
- 3-5 achievement-focused bullet points per role
- Quantifiable results (numbers, percentages, metrics)
- Keywords matching{' the job requirements' if job_data else ' industry standards'}
- Action verbs (Led, Implemented, Achieved, etc.)

📋 PROFILE CONTEXT:
Professional Title: {profile.get('professional_title', 'Professional')}
Years of Experience: {profile.get('years_of_experience', 0)}
Career Level: {profile.get('career_level', 'Not specified')}
Skills: {profile.get('technical_skills', profile.get('skills', 'Various skills'))}

💼 WORK HISTORY (Use ONLY these most relevant roles to the target job; ignore unrelated roles):
{self._format_work_experience(self._filter_relevant_experiences(user_data.get('work_experiences', []), job_data))}

{job_context}

**INSTRUCTIONS**: For each work experience entry:
1. Use the job title, company, and dates from the work history
2. Enhance the description with professional language
3. Transform responsibilities into 3-5 achievement-focused bullets with metrics
4. Highlight technologies/skills used that match the job requirements
5. Quantify impact where possible (%, $, numbers)

Return JSON: {{"work": [{{"title": "...", "company": "...", "location": "...", "dates": "...", "description": "...", "achievements": ["...", "..."]}}]}}""",
            
            'education': f"""Format education entries with:
- Degree/qualification, institution, graduation date
- Relevant coursework, honors, GPA (if strong)
- Academic achievements and activities

📋 PROFILE CONTEXT:
Education Level: {profile.get('education_level', 'Not specified')}

🎓 EDUCATION HISTORY (Use this data):
{self._format_education(user_data.get('educations', []))}

{job_context}

**INSTRUCTIONS**: For each education entry:
1. Format degree properly (e.g., "Bachelor of Science in Computer Science")
2. Include GPA if >= 3.5
3. Highlight relevant coursework that matches job requirements
4. Include honors, awards, or academic achievements
5. Mention relevant activities or leadership roles

Return JSON: {{"education": [{{"degree": "...", "institution": "...", "location": "...", "date": "...", "gpa": "...", "honors": "...", "details": "..."}}]}}""",
            
            'skills': f"""Organize skills into categories:
- Technical Skills (programming languages, tools, frameworks, platforms)
- Core Competencies (6-12 key professional skills)
- Match skills to{' job requirements' if job_data else ' industry standards'}

📋 PROFILE SKILLS DATA:
Technical Skills: {profile.get('technical_skills', profile.get('skills', 'Various skills'))}
Soft Skills: {profile.get('soft_skills', 'Not specified')}
Years of Experience: {profile.get('years_of_experience', 0)}

💼 SKILLS FROM WORK EXPERIENCE:
{self._extract_technologies_from_work(user_data.get('work_experiences', []))}

{job_context}

**INSTRUCTIONS**:
1. Categorize technical skills (languages, frameworks, tools, platforms)
2. Create 6-12 core competencies (professional skills like "Team Leadership", "Strategic Planning")
3. Prioritize skills that match job requirements
4. Use industry-standard terminology
5. Include both hard and soft skills

Return JSON: {{"skills": {{"technical": ["..."], "tools": ["..."], "competencies": ["..."]}}, "core_competencies": ["..."]}}""",
            
            'certifications': f"""List professional certifications:
- Certification name, issuing organization, date
- Credential ID and URL if available
- Relevance to{' target role' if job_data else ' professional field'}

📋 CERTIFICATIONS DATA:
{self._format_certifications(user_data.get('certifications', []))}

{job_context}

**INSTRUCTIONS**:
1. Format each certification with full official name
2. Include issuing organization
3. Add credential ID and verification URL if available
4. Show issue date and expiry (if applicable)
5. Prioritize certifications relevant to the job

Return JSON: {{"certifications": [{{"name": "...", "issuer": "...", "date": "...", "credential_id": "...", "url": "..."}}]}}""",
            
            'projects': f"""Highlight key projects:
- Project name, role, technologies used
- Brief description and measurable impact
- Relevance to{' target position' if job_data else ' professional goals'}

📋 PROFILE CONTEXT:
Professional Title: {profile.get('professional_title', 'Professional')}
Portfolio URL: {profile.get('portfolio_url', 'Not provided')}
GitHub: {profile.get('github_url', 'Not provided')}

💼 PROJECTS DATA:
{self._format_projects(user_data.get('projects', []))}

{job_context}

**INSTRUCTIONS**:
1. Highlight 2-4 most impressive projects
2. Focus on projects relevant to the job
3. Include technologies/tools used
4. Quantify impact (users, performance, business value)
5. Mention your specific role and contributions

Return JSON: {{"projects": [{{"name": "...", "role": "...", "description": "...", "technologies": ["..."], "impact": "...", "url": "..."}}]}}""",

            'awards': f"""List awards and achievements:
- Award name, issuing organization, date
- Brief description of significance
- Relevance to professional accomplishments

📋 AWARDS DATA:
{self._format_awards(user_data.get('awards', []))}

**INSTRUCTIONS**:
1. List professional awards and recognitions
2. Include date received
3. Mention issuing organization
4. Briefly explain significance if not obvious
5. Prioritize most prestigious or relevant awards

Return JSON: {{"awards": [{{"title": "...", "issuer": "...", "date": "...", "description": "..."}}]}}""",

            'references': f"""List professional references:
- Reference name, position, company
- Contact information (email, phone)
- Relationship to candidate
- Brief context about professional relationship

📋 REFERENCES DATA:
{self._format_references(user_data.get('references', []))}

📋 PROFILE CONTEXT:
Professional Title: {profile.get('professional_title', 'Professional')}
Years of Experience: {profile.get('years_of_experience', 0)}

{job_context}

**INSTRUCTIONS**:
1. List 2-3 professional references (former managers, colleagues, clients)
2. Include full name, current position, and company
3. Provide contact details (email and phone if available)
4. Describe relationship (e.g., "Direct Manager at XYZ Corp", "Project Colleague")
5. If no references provided, return empty array []
6. ONLY include references if explicitly provided in user data

Return JSON: {{"references": [{{"name": "...", "position": "...", "company": "...", "email": "...", "phone": "...", "relationship": "..."}}]}}

Note: If no references data available, return {{"references": []}}"""
        }
        
        return section_prompts.get(section, "")
    
    def _merge_section_content(self, cv_content: Dict, section: str, section_content: Any) -> Dict:
        """Merge generated section content into CV structure"""
        
        if section_content is None:
            return cv_content
        
        section_mapping = {
            'summary': 'professional_summary',
            'work': 'professional_experience',
            'education': 'education',
            'skills': ['technical_skills', 'core_competencies'],
            'certifications': 'certifications',
            'projects': 'projects',
            'awards': 'awards',
            'references': 'references'
        }
        
        target_key = section_mapping.get(section)
        
        if section == 'skills' and isinstance(section_content, dict):
            if 'technical' in section_content:
                cv_content['technical_skills'] = section_content['technical']
            if 'competencies' in section_content:
                cv_content['core_competencies'] = section_content['competencies']
        elif target_key:
            cv_content[target_key] = section_content
        
        return cv_content
    
    def _build_cv_generation_prompt(
        self, 
        user_data: Dict, 
        job_data: Optional[Dict],
        cv_style: str,
        include_sections: List[str]
    ) -> str:
        """Build comprehensive prompt for AI CV generation"""
        
        # Extract user information
        personal_info = self._format_personal_info(user_data)
        profile_data = user_data.get('job_seeker_profile', {})
        work_experience = self._format_work_experience(user_data.get('work_experiences', []))
        education = self._format_education(user_data.get('educations', []))
        skills = self._format_skills(profile_data)
        certifications = self._format_certifications(user_data.get('certifications', []))
        projects = self._format_projects(user_data.get('projects', []))
        awards = self._format_awards(user_data.get('awards', []))
        
        # Determine which sections have actual data
        has_work = bool(user_data.get('work_experiences'))
        has_education = bool(user_data.get('educations'))
        has_skills = bool(profile_data.get('skills'))
        has_certifications = bool(user_data.get('certifications'))
        has_projects = bool(user_data.get('projects'))
        has_awards = bool(user_data.get('awards'))
        
        # Build comprehensive job matching analysis if job data provided
        job_context = ""
        matching_analysis = ""
        
        if job_data:
            # Deep analysis of job requirements vs candidate profile
            job_keywords = self._extract_job_keywords(job_data)
            profile_keywords = self._extract_profile_keywords(user_data, profile_data)
            matching_skills = self._analyze_skill_match(job_keywords, profile_keywords)
            experience_match = self._analyze_experience_match(user_data.get('work_experiences', []), job_data)
            
            matching_analysis = f"""

🎯 INTELLIGENT JOB MATCHING ANALYSIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MATCHING SKILLS FOUND: {', '.join(matching_skills[:15]) if matching_skills else 'Analyzing transferable skills'}
EXPERIENCE RELEVANCE: {experience_match}

STRATEGIC PROFILE-TO-JOB ALIGNMENT:
This candidate brings {profile_data.get('years_of_experience', 0)} years of experience as a {profile_data.get('professional_title', 'professional')}.
Target role seeks: {job_data.get('title', 'position')} at {job_data.get('company_name', 'company')}.
"""
            
            job_context = f"""

🎯 TARGET JOB CONTEXT (CRITICAL - OPTIMIZE CV FOR THIS SPECIFIC ROLE):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 POSITION DETAILS:
- Job Title: {job_data.get('title', 'Not specified')}
- Company: {job_data.get('company_name', 'Not specified')}
- Industry/Category: {job_data.get('category', 'Not specified')}
- Experience Level: {job_data.get('experience_level', 'Not specified')}
- Employment Type: {job_data.get('job_type', 'Not specified')}
- Location: {job_data.get('location', 'Not specified')}
- Salary Range: {job_data.get('salary_min', '')} - {job_data.get('salary_max', '')}

📝 FULL JOB DESCRIPTION:
{job_data.get('description', 'Not specified')}

✅ REQUIRED QUALIFICATIONS & SKILLS:
{job_data.get('requirements', 'Not specified')}

🎯 PREFERRED QUALIFICATIONS:
{job_data.get('preferred_qualifications', 'Analyze job description for implicit preferences')}

🏢 COMPANY CULTURE & VALUES:
{job_data.get('company_culture', 'Research based on job description tone and requirements')}
{matching_analysis}

🔍 ADVANCED JOB MATCHING STRATEGY (FOLLOW PRECISELY):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **DEEP REQUIREMENT ANALYSIS**:
   - Extract EVERY skill, qualification, and requirement from job description
   - Identify must-have vs nice-to-have qualifications
   - Note industry-specific terminology and buzzwords
   - Understand the job's core responsibilities and pain points

2. **PROFILE-TO-JOB MAPPING**:
   - Map candidate's experiences to job requirements (use ALL 19 profile fields)
   - Identify direct matches, transferable skills, and growth areas
   - Prioritize experiences that solve job's specific challenges
   - Find quantifiable achievements that demonstrate required capabilities

3. **STRATEGIC PROFESSIONAL SUMMARY**:
   - Open with candidate's years of experience + professional title
   - Immediately address the TOP 3 job requirements
   - Include 2-3 quantifiable achievements relevant to this role
   - Use exact keywords from job title and description
   - Position candidate as solution to employer's needs
   - Reference desired_position: "{profile_data.get('desired_position', '')}"

4. **INTELLIGENT EXPERIENCE PRIORITIZATION**:
   - Rank work experiences by relevance to THIS job (not chronology)
   - Expand most relevant role with 3 detailed achievements
   - Condense less relevant roles to 1-2 bullets or omit if space-constrained
   - Reframe achievements using job description's language
   - Emphasize technologies/methodologies mentioned in job posting

5. **SURGICAL SKILLS ALIGNMENT**:
   - Place matching skills from job requirements at the TOP
   - Use EXACT terminology from job posting (e.g., if they say "React.js", don't say "React")
   - Include skill proficiency levels if relevant to requirements
   - Add soft skills explicitly mentioned in job description
   - Reference soft_skills: "{profile_data.get('soft_skills', '')}"

6. **KEYWORD DENSITY OPTIMIZATION**:
   - Naturally integrate 8-12 key terms from job description
   - Use keywords in: summary (3x), experience bullets (5x), skills (4x)
   - Mirror job's language style (technical vs business-focused)
   - Include industry certifications/tools mentioned in requirements

7. **ACHIEVEMENT QUANTIFICATION FOR THIS ROLE**:
   - Every bullet must show HOW candidate solved problems LIKE those in job description
   - Use metrics that matter to THIS industry/role (% improvements, $ impact, time saved, team size, scale)
   - Show progression and growth in areas relevant to target position

8. **EDUCATION & CERTIFICATION RELEVANCE**:
   - Highlight degrees/certifications that match job requirements
   - Include relevant coursework if changing fields
   - Show continuous learning in job-relevant areas
   - Reference education_level: "{profile_data.get('education_level', '')}"

9. **ADDITIONAL PROFILE UTILIZATION**:
   - Availability: {profile_data.get('availability', 'Immediate')}
   - Job Type Preference: {profile_data.get('job_type_preference', 'Any')}
   - Salary Expectations: {profile_data.get('salary_expectation_min', '')} - {profile_data.get('salary_expectation_max', '')}
   - Location Preferences: {profile_data.get('preferred_locations', 'Flexible')}
   - Remote Work: {profile_data.get('remote_work_preference', 'Open')}
   - Languages: {profile_data.get('languages', 'English')}
   - Career Goals: {profile_data.get('career_goals', '')}

10. **ATS OPTIMIZATION FOR THIS COMPANY**:
    - Use standard headers that ATS can parse
    - Repeat job title from posting in professional title
    - Include company name context if candidate has industry experience
    - Add LinkedIn/Portfolio URLs: LinkedIn: {profile_data.get('linkedin_url', '')}, Portfolio: {profile_data.get('portfolio_url', '')}, GitHub: {profile_data.get('github_url', '')}, Website: {profile_data.get('website_url', '')}

⚠️ CRITICAL SUCCESS FACTORS:
- This CV must make candidate appear as the PERFECT match for THIS specific role
- Use job description language, not generic CV language
- Every section must answer: "Why is this person ideal for OUR position?"
- If candidate lacks a requirement, emphasize transferable skills and learning ability
- Create narrative connecting candidate's journey to this opportunity
"""
        else:
            job_context = f"""

📋 GENERAL CV CREATION (NO SPECIFIC JOB TARGET):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create a versatile, comprehensive CV showcasing the candidate's complete professional profile.

USE EVERY AVAILABLE DATA POINT FROM PROFILE:
- Professional Title: {profile_data.get('professional_title', '')}
- Desired Position: {profile_data.get('desired_position', '')}
- Years of Experience: {profile_data.get('years_of_experience', 0)}
- Education Level: {profile_data.get('education_level', '')}
- Career Goals: {profile_data.get('career_goals', '')}
- Skills: {profile_data.get('skills', '')}
- Soft Skills: {profile_data.get('soft_skills', '')}
- Languages: {profile_data.get('languages', '')}
- Job Type Preference: {profile_data.get('job_type_preference', '')}
- Remote Work: {profile_data.get('remote_work_preference', '')}
- Availability: {profile_data.get('availability', '')}
- LinkedIn: {profile_data.get('linkedin_url', '')}
- GitHub: {profile_data.get('github_url', '')}
- Portfolio: {profile_data.get('portfolio_url', '')}
- Website: {profile_data.get('website_url', '')}

STRATEGY: Create strong general-purpose CV with broad appeal across opportunities in candidate's field.
Focus on versatility, comprehensive skill showcase, and professional brand building.
"""
        
        # Build section-specific instructions
        section_requirements = self._build_section_requirements(include_sections, {
            'work': has_work,
            'education': has_education,
            'skills': has_skills,
            'certifications': has_certifications,
            'projects': has_projects,
            'awards': has_awards
        })
        
        prompt = f"""You are TalentSphere's Elite CV Architect, an AI specialist with deep expertise in:
- Resume writing and applicant tracking system (ATS) optimization
- Industry-specific hiring trends and employer expectations
- Professional branding and career positioning
- Achievement-based storytelling and quantifiable impact presentation
- Modern CV design principles and readability optimization

YOUR MISSION:
Create a {cv_style} CV that FITS ON 2 PAGES MAXIMUM and is strategically optimized for success.
This CV must be compelling, ATS-friendly, extremely concise, and showcase the candidate as the ideal match for their target role.

LENGTH CONSTRAINT: The final CV MUST fit on exactly 2 pages when rendered. Be ruthlessly selective:
- Include only the most relevant and impactful information
- Limit work experience to 3-4 most recent/relevant positions
- Maximum 3 bullet points per job (one line each)
- Limit projects to 2-3 most impressive
- Keep skills list to top 12 items
- Professional summary must be 2-3 sentences maximum (50 words)
- All content must be concise and impactful

COMPLETE CANDIDATE PROFILE:
{personal_info}

PROFESSIONAL PROFILE:
- Professional Title: {profile_data.get('professional_title', 'Not specified')}
- Professional Summary: {profile_data.get('professional_summary', 'Not provided')}
- Desired Position: {profile_data.get('desired_position', 'Not specified')}
- Years of Experience: {profile_data.get('years_of_experience', 0)}
- Education Level: {profile_data.get('education_level', 'Not specified')}
- LinkedIn: {profile_data.get('linkedin_url', 'Not provided')}
- GitHub: {profile_data.get('github_url', 'Not provided')}
- Portfolio: {profile_data.get('portfolio_url', 'Not provided')}
- Website: {profile_data.get('website_url', 'Not provided')}

WORK EXPERIENCE:
{work_experience}

EDUCATION:
{education}

SKILLS & EXPERTISE:
{skills}

CERTIFICATIONS & LICENSES:
{certifications}

PROJECTS & PORTFOLIO:
{projects}

AWARDS & ACHIEVEMENTS:
{awards}
{job_context}

CV STYLE GUIDE - {cv_style.upper()}:
{self._get_style_guidelines(cv_style)}

CRITICAL: REQUIRED SECTIONS TO INCLUDE:
{section_requirements}

OUTPUT REQUIREMENTS:

Return a JSON object with the following structure:

{{
  "professional_summary": "A compelling 2-3 sentence summary (MAXIMUM 50 words) that positions the candidate uniquely and highlights their value proposition. Use strong action words and quantifiable achievements.",
  
  "contact_information": {{
    "full_name": "Candidate's full name",
    "professional_title": "Current or target professional title",
    "email": "Contact email",
    "phone": "Phone number",
    "location": "City, State/Country",
    "linkedin": "LinkedIn profile URL if available",
    "portfolio": "Portfolio/website URL if available",
    "github": "GitHub profile if relevant"
  }},
  
  "core_competencies": [
    "5-8 key skills organized by relevance to target job",
    "Mix of technical and soft skills",
    "Use industry-standard terminology"
  ],
  
  "professional_experience": [
    {{
      "job_title": "Role title",
      "company": "Company name",
      "location": "City, State",
      "duration": "Month Year - Month Year (or Present)",
      "description": "Brief 1-sentence role context",
      "achievements": [
        "Bullet point starting with action verb, including quantifiable results (X% improvement, $Y saved, Z% growth)",
        "MAXIMUM 3 achievements per role - select only the most impactful",
        "Each bullet must be ONE line maximum (10-15 words)"
      ],
      "technologies": ["Relevant tools", "platforms", "methodologies"]
    }}
  ],
  
  "education": [
    {{
      "degree": "Degree type and field",
      "institution": "University/School name",
      "location": "City, State",
      "graduation_date": "Month Year",
      "gpa": "GPA if 3.5+ or as appropriate",
      "honors": "Academic honors if any",
      "relevant_coursework": ["Key courses if early career or highly relevant"]
    }}
  ],
  
  "certifications": [
    {{
      "name": "Certification name",
      "issuer": "Issuing organization",
      "date": "Month Year",
      "credential_id": "ID if applicable"
    }}
  ],
  
  "projects": [
    {{
      "name": "Project name",
      "role": "Your role",
      "description": "1-2 sentence description of project and your contribution",
      "impact": "Quantifiable outcome or achievement",
      "technologies": ["Tech stack used"]
    }}
  ],
  
  "technical_skills": {{
    "programming_languages": ["Languages if applicable"],
    "frameworks_tools": ["Frameworks, platforms, tools"],
    "methodologies": ["Agile, Scrum, etc."],
    "soft_skills": ["Communication", "Leadership", etc.]
  }},
  
  "awards": [
    {{
      "title": "Award name",
      "issuer": "Issuing organization",
      "date": "Month Year",
      "description": "Brief context if needed"
    }}
  ],
  
  "optimization_tips": [
    "Specific suggestions for further improvement",
    "Keywords to potentially add",
    "Gaps to address"
  ],
  
  "ats_score": {{
    "estimated_score": 85,
    "strengths": ["What makes this CV ATS-friendly"],
    "improvements": ["Suggestions for better ATS performance"]
  }}
}}

CRITICAL GUIDELINES:
1. **MANDATORY SECTION INCLUSION**: Every section listed in "REQUIRED SECTIONS TO INCLUDE" MUST be present in the output JSON, even if data is limited. Generate appropriate content based on available information.
2. **2-PAGE MAXIMUM**: The final CV MUST fit on 2 pages maximum when printed. Be extremely concise.
3. **Quantify Everything**: Every achievement should include numbers, percentages, or measurable outcomes
4. **Action-Oriented Language**: Start every bullet with strong action verbs (Led, Developed, Increased, Reduced, etc.)
5. **Extreme Conciseness**: Each bullet point must be ONE line only (10-15 words maximum)
6. **Relevance First**: Prioritize information most relevant to the target job - exclude less relevant items
7. **ATS Optimization**: Use standard section headers, avoid tables/graphics in text, include relevant keywords
8. **Truth & Accuracy**: Base all content on provided data - enhance presentation, not facts
9. **Professional Tone**: Maintain appropriate formality for {cv_style} style
10. **Modern Best Practices**: Follow current CV trends (no "References available upon request", etc.)
11. **Personal Branding**: Create a cohesive narrative that positions the candidate strategically
12. **Maximum Entries**: Work Experience: Top 3-4 roles only | Projects: Top 2-3 only | Skills: Top 12 only
13. **Job Matching**: If target job provided, explicitly match profile to job requirements in summary and prioritize relevant experience/skills
14. **Profile Utilization**: Use ALL 19 job_seeker_profile fields where applicable (professional_title, years_of_experience, desired_position, education_level, skills, soft_skills, salary preferences, job_type_preference, availability, LinkedIn, GitHub, portfolio, website URLs, etc.)

SECTION VALIDATION CHECKLIST (MUST VERIFY BEFORE RETURNING):
- If "summary" in required sections → professional_summary field MUST have content
- If "experience" in required sections → professional_experience array MUST exist (can be empty [] if no data)
- If "education" in required sections → education array MUST exist (can be empty [] if no data)
- If "skills" in required sections → technical_skills or core_competencies MUST have content
- If "certifications" in required sections → certifications array MUST exist (can be empty [] if no data)
- If "projects" in required sections → projects array MUST exist (can be empty [] if no data)
- If "awards" in required sections → awards array MUST exist (can be empty [] if no data)

JSON FORMATTING REQUIREMENTS (CRITICAL):
- Return ONLY the JSON object, no additional text before or after
- ALL property names MUST be enclosed in double quotes (e.g., "property_name": value)
- Use double quotes for all string values (NEVER single quotes)
- NO trailing commas after the last item in arrays or objects
- Properly escape special characters in strings (quotes, backslashes, newlines)
- Arrays of strings must have each element in double quotes: ["item1", "item2"]
- Empty arrays should be [] not empty
- The response must be valid, parseable JSON that passes strict JSON validation

Example of correct formatting:
{{
  "property": "value",
  "array": ["item1", "item2"],
  "nested": {{
    "key": "value"
  }}
}}
"""
        
        return prompt
    
    def _format_personal_info(self, user_data: Dict) -> str:
        """Format personal information for prompt"""
        return f"""
Name: {user_data.get('first_name', '')} {user_data.get('last_name', '')}
Email: {user_data.get('email', '')}
Phone: {user_data.get('phone', 'Not provided')}
Location: {user_data.get('location', 'Not specified')}
Bio: {user_data.get('bio', 'Not provided')}
"""
    
    def _format_work_experience(self, experiences: List[Dict]) -> str:
        """Format work experience for prompt"""
        if not experiences:
            return "No work experience provided."
        
        formatted = []
        for exp in experiences:
            entry = f"""
Position: {exp.get('job_title', 'Not specified')}
Company: {exp.get('company_name', 'Not specified')}
Location: {exp.get('company_location', 'Not specified')}
Type: {exp.get('employment_type', 'Not specified')}
Duration: {exp.get('start_date', 'Unknown')} to {exp.get('end_date', 'Present') if not exp.get('is_current') else 'Present'}
Description: {exp.get('description', 'No description')}
Key Responsibilities: {', '.join(exp.get('key_responsibilities', [])) if isinstance(exp.get('key_responsibilities'), list) else exp.get('key_responsibilities', 'None listed')}
Achievements: {', '.join(exp.get('achievements', [])) if isinstance(exp.get('achievements'), list) else exp.get('achievements', 'None listed')}
Technologies: {', '.join(exp.get('technologies_used', [])) if isinstance(exp.get('technologies_used'), list) else exp.get('technologies_used', 'None listed')}
"""
            formatted.append(entry)
        
        return "\n---\n".join(formatted)
    
    def _format_education(self, educations: List[Dict]) -> str:
        """Format education for prompt"""
        if not educations:
            return "No education provided."
        
        formatted = []
        for edu in educations:
            entry = f"""
Degree: {edu.get('degree_title', 'Not specified')}
Institution: {edu.get('institution_name', 'Not specified')}
Location: {edu.get('institution_location', 'Not specified')}
Field: {edu.get('field_of_study', 'Not specified')}
Duration: {edu.get('start_date', 'Unknown')} to {edu.get('graduation_date', 'Unknown')}
GPA: {edu.get('gpa', 'Not provided')} / {edu.get('gpa_scale', 4.0)}
Honors: {edu.get('honors', 'None')}
Relevant Coursework: {', '.join(edu.get('relevant_coursework', [])) if isinstance(edu.get('relevant_coursework'), list) else edu.get('relevant_coursework', 'None listed')}
"""
            formatted.append(entry)
        
        return "\n---\n".join(formatted)
    
    def _format_skills(self, profile: Dict) -> str:
        """Format skills from job seeker profile"""
        skills_data = profile.get('skills', [])
        if isinstance(skills_data, str):
            return f"Skills: {skills_data}"
        elif isinstance(skills_data, list):
            return f"Skills: {', '.join(skills_data)}"
        return "No skills information provided."
    
    def _extract_technologies_from_work(self, experiences: List[Dict]) -> str:
        """Extract and format technologies used across work experiences"""
        if not experiences:
            return "No work experience to extract technologies from."
        
        all_technologies = []
        for exp in experiences:
            techs = exp.get('technologies_used', [])
            if isinstance(techs, list):
                all_technologies.extend(techs)
            elif isinstance(techs, str) and techs:
                # Parse comma-separated string
                all_technologies.extend([t.strip() for t in techs.split(',') if t.strip()])
        
        # Remove duplicates and format
        unique_techs = list(set(all_technologies))
        if unique_techs:
            return f"Technologies from work experience: {', '.join(unique_techs)}"
        return "No technologies listed in work experience."
    
    def _format_certifications(self, certifications: List[Dict]) -> str:
        """Format certifications for prompt"""
        if not certifications:
            return "No certifications provided."
        
        formatted = []
        for cert in certifications:
            entry = f"{cert.get('name', 'Unnamed')} - {cert.get('issuer', 'Unknown issuer')} ({cert.get('issue_date', 'Date unknown')})"
            formatted.append(entry)
        
        return "\n".join(formatted)
    
    def _format_projects(self, projects: List[Dict]) -> str:
        """Format projects for prompt"""
        if not projects:
            return "No projects provided."
        
        formatted = []
        for proj in projects:
            entry = f"""
Project: {proj.get('title', 'Unnamed')}
Description: {proj.get('description', 'No description')}
Role: {proj.get('role', 'Not specified')}
Technologies: {', '.join(proj.get('technologies', [])) if isinstance(proj.get('technologies'), list) else proj.get('technologies', 'None listed')}
URL: {proj.get('url', 'Not provided')}
"""
            formatted.append(entry)
        
        return "\n---\n".join(formatted)
    
    def _format_awards(self, awards: List[Dict]) -> str:
        """Format awards for prompt"""
        if not awards:
            return "No awards provided."
        
        formatted = []
        for award in awards:
            entry = f"{award.get('title', 'Unnamed')} - {award.get('issuer', 'Unknown issuer')} ({award.get('date', 'Date unknown')})"
            formatted.append(entry)
        
        return "\n".join(formatted)
    
    def _format_references(self, references: List[Dict]) -> str:
        """Format references for prompt"""
        if not references:
            return "No references provided. Return empty array []."
        
        formatted = []
        for ref in references:
            entry = f"""
Reference: {ref.get('name', 'Name not provided')}
Position: {ref.get('position', 'Not specified')}
Company: {ref.get('company', 'Not specified')}
Email: {ref.get('email', 'Not provided')}
Phone: {ref.get('phone', 'Not provided')}
Relationship: {ref.get('relationship', 'Professional contact')}
"""
            formatted.append(entry)
        
        return "\n---\n".join(formatted)
    
    def _build_section_requirements(self, include_sections: List[str], has_data: Dict[str, bool]) -> str:
        """Build detailed section requirements based on what user selected and what data exists"""
        requirements = []
        
        section_instructions = {
            'summary': {
                'required': True,
                'instruction': "**Professional Summary**: REQUIRED. 2-3 sentences (50 words max) highlighting key strengths, experience, and career focus. Must be present even if no data available - synthesize from available information."
            },
            'experience': {
                'required': has_data.get('work', False),
                'instruction': "**Work Experience**: Include ALL relevant work experiences with company, role, dates, and 2-3 achievement bullets each. If user selected this section, it MUST appear even if empty."
            },
            'education': {
                'required': has_data.get('education', False),
                'instruction': "**Education**: Include ALL educational qualifications with institution, degree, field, and dates. If user selected this section, it MUST appear even if empty."
            },
            'skills': {
                'required': has_data.get('skills', False),
                'instruction': "**Skills**: Top 12 most relevant skills organized by category (Technical, Soft Skills, Tools/Technologies, Languages). If user selected this section, it MUST appear even if empty."
            },
            'certifications': {
                'required': has_data.get('certifications', False),
                'instruction': "**Certifications**: All certifications with issuer and date. If user selected this section, it MUST appear even if empty."
            },
            'projects': {
                'required': has_data.get('projects', False),
                'instruction': "**Projects**: 2-3 most impressive/relevant projects with description, role, and technologies. If user selected this section, it MUST appear even if empty."
            },
            'awards': {
                'required': has_data.get('awards', False),
                'instruction': "**Awards & Achievements**: All awards with issuer and date. If user selected this section, it MUST appear even if empty."
            }
        }
        
        for section in include_sections:
            if section in section_instructions:
                requirements.append(section_instructions[section]['instruction'])
        
        if not requirements:
            return "Include ALL standard CV sections: Summary, Experience, Education, Skills"
        
        return "\n".join([f"{i+1}. {req}" for i, req in enumerate(requirements)])
    
    def _get_style_guidelines(self, style: str) -> str:
        """Get style-specific guidelines"""
        styles = {
            "professional": """
- Clean, traditional layout with clear section hierarchies
- Conservative color scheme (navy, dark gray, black)
- Focus on substance over style
- Chronological organization
- Formal tone throughout
- Suitable for corporate, finance, legal, consulting roles
""",
            "creative": """
- Modern, visually engaging layout with creative elements
- Use of color and design elements (while maintaining ATS compatibility)
- Personality and uniqueness encouraged
- Portfolio/project highlights prominent
- Conversational yet professional tone
- Suitable for design, marketing, media, creative industries
""",
            "modern": """
- Clean, minimalist design with subtle modern touches
- Strategic use of color and white space
- Icons and visual elements for quick scanning
- Skills and achievements prominently featured
- Professional but approachable tone
- Suitable for tech, startups, digital industries
""",
            "minimal": """
- Ultra-clean, no-frills layout
- Maximum white space, minimal visual elements
- Focus entirely on content and achievements
- Simple typography and structure
- Direct, concise tone
- Suitable for senior executive, academic, research roles
""",
            "executive": """
- Sophisticated, leadership-focused presentation
- Strategic achievements and business impact emphasized
- Board-level language and metrics
- Leadership competencies highlighted
- Authoritative, confident tone
- Suitable for C-suite, VP, director-level positions
"""
        }
        
        return styles.get(style, styles["professional"])
    
    def _parse_cv_response(self, response_text: str) -> Dict:
        """Parse AI response into structured CV data"""
        import re
        
        try:
            # Validate input
            if not response_text or not isinstance(response_text, str):
                raise Exception("Invalid or empty response from AI")
            
            # Remove markdown code blocks if present
            cleaned = response_text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            
            cleaned = cleaned.strip()
            
            # Pre-process: Apply quick fixes before attempting json-repair
            # This helps json-repair succeed more often
            cleaned = self._quick_json_fixes(cleaned)
            
            # First attempt: Try with json-repair library (most robust)
            try:
                from json_repair import repair_json
                repaired = repair_json(cleaned)
                cv_data = json.loads(repaired)
                print("[CV Builder] Successfully parsed with json-repair")
                return cv_data
            except ImportError:
                print("[CV Builder] json-repair not available, using fallback methods")
            except Exception as repair_err:
                print(f"[CV Builder] json-repair failed: {repair_err}")
                print(f"[CV Builder] Problematic JSON snippet (first 500 chars): {cleaned[:500]}")
                print("[CV Builder] Trying manual fixes...")
            
            # Second attempt: Apply manual fixes
            cleaned = self._fix_json_formatting(cleaned)
            cv_data = json.loads(cleaned)
            print("[CV Builder] Successfully parsed with manual fixes")
            return cv_data
            
        except json.JSONDecodeError as e:
            # Try alternative parsing strategies
            print(f"[CV Builder] Initial JSON parse failed: {str(e)}")
            
            # Strategy 1: Extract JSON and try repair library
            if response_text:
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    try:
                        from json_repair import repair_json
                        json_str = json_match.group()
                        repaired = repair_json(json_str)
                        result = json.loads(repaired)
                        print("[CV Builder] Fallback 1 (extract + repair) succeeded")
                        return result
                    except ImportError:
                        pass
                    except Exception as inner_e:
                        print(f"[CV Builder] Fallback 1 failed: {inner_e}")
                        
                    # Try with manual fixes if repair library didn't work
                    try:
                        json_str = json_match.group()
                        json_str = self._fix_json_formatting(json_str)
                        result = json.loads(json_str)
                        print("[CV Builder] Fallback 1b (extract + manual fix) succeeded")
                        return result
                    except Exception as e1b:
                        print(f"[CV Builder] Fallback 1b failed: {e1b}")
            
            # Strategy 2: Try ast.literal_eval for Python-like dicts
            try:
                import ast
                cleaned_for_ast = response_text.strip()
                if cleaned_for_ast.startswith("```"):
                    cleaned_for_ast = re.sub(r'```json\s*', '', cleaned_for_ast)
                    cleaned_for_ast = re.sub(r'```\s*$', '', cleaned_for_ast)
                result = ast.literal_eval(cleaned_for_ast.strip())
                if isinstance(result, dict):
                    print("[CV Builder] Fallback 2 (ast.literal_eval) succeeded")
                    return result
            except Exception as ast_err:
                print(f"[CV Builder] Fallback 2 (ast.literal_eval) failed: {ast_err}")
            
            # Strategy 3: Try json5 if available
            try:
                import json5
                result = json5.loads(response_text)
                print("[CV Builder] Fallback 3 (json5) succeeded")
                return result
            except ImportError:
                print("[CV Builder] json5 not available for fallback parsing")
            except Exception as json5_err:
                print(f"[CV Builder] Fallback 3 (json5) failed: {json5_err}")
            
            # If all else fails, provide detailed error with character analysis
            error_position = e.pos if hasattr(e, 'pos') else 'unknown'
            context_start = max(0, int(error_position) - 100) if isinstance(error_position, (int, float)) else 0
            context_end = min(len(response_text), int(error_position) + 100) if isinstance(error_position, (int, float)) else 200
            error_context = response_text[context_start:context_end] if response_text else 'N/A'
            
            # Show the exact character causing the issue
            error_char = ''
            if isinstance(error_position, (int, float)) and 0 <= error_position < len(response_text):
                error_char = response_text[int(error_position)]
                error_char_repr = repr(error_char)
                print(f"[CV Builder] Character at error position {error_position}: {error_char_repr} (ord: {ord(error_char)})")
            
            raise Exception(
                f"Failed to parse CV response after multiple attempts. JSON error: {str(e)}. "
                f"Error near: ...{error_context}..."
            )
    
    def _validate_and_fill_sections(self, cv_data: Dict, include_sections: List[str]) -> Dict:
        """
        ENHANCED: Comprehensive validation ensuring all selected sections are present.
        Intelligently fills missing sections with contextual content.
        
        Args:
            cv_data: Parsed CV data from AI
            include_sections: List of sections user selected
            
        Returns:
            CV data with all required sections present and validated
        """
        section_mapping = {
            'summary': 'professional_summary',
            'experience': 'professional_experience',
            'work': 'professional_experience',  # Alias
            'education': 'education',
            'skills': ['technical_skills', 'core_competencies', 'skills'],  # Multiple possible keys
            'certifications': 'certifications',
            'projects': 'projects',
            'awards': 'awards',
            'references': 'references'
        }
        
        print(f"[CV Builder] Validating {len(include_sections)} selected sections: {include_sections}")
        missing_sections = []
        empty_sections = []
        
        for section in include_sections:
            if section not in section_mapping:
                print(f"[CV Builder] Warning: Unknown section '{section}' requested")
                continue
                
            mapping = section_mapping[section]
            
            # Handle sections that can have multiple keys
            if isinstance(mapping, list):
                has_any = any(key in cv_data and cv_data[key] for key in mapping)
                if not has_any:
                    # Check if any key exists but is empty
                    exists_but_empty = any(key in cv_data for key in mapping)
                    
                    if exists_but_empty:
                        empty_sections.append(section)
                    else:
                        missing_sections.append(section)
                    
                    # Add the first key with intelligent content
                    cv_data[mapping[0]] = self._generate_intelligent_content(section, cv_data)
                    print(f"[CV Builder] ⚠️  Added missing/empty section: {mapping[0]}")
            else:
                # Single key mapping
                if mapping not in cv_data:
                    missing_sections.append(section)
                    cv_data[mapping] = self._generate_intelligent_content(section, cv_data)
                    print(f"[CV Builder] ⚠️  Added missing section: {mapping}")
                elif not cv_data[mapping]:  # Exists but empty
                    empty_sections.append(section)
                    cv_data[mapping] = self._generate_intelligent_content(section, cv_data)
                    print(f"[CV Builder] ⚠️  Filled empty section: {mapping}")
        
        # Validate content quality
        cv_data = self._validate_content_quality(cv_data, include_sections)
        
        # Log validation results
        if missing_sections:
            print(f"[CV Builder] ⚠️  Originally missing sections: {', '.join(missing_sections)}")
        if empty_sections:
            print(f"[CV Builder] ⚠️  Originally empty sections: {', '.join(empty_sections)}")
        
        print(f"[CV Builder] ✅ All {len(include_sections)} sections validated and present")
        
        return cv_data
    
    def _generate_intelligent_content(self, section: str, cv_data: Dict):
        """
        ENHANCED: Generate intelligent default content based on existing CV data.
        Creates contextual, personalized content instead of generic defaults.
        
        Args:
            section: Section name that needs content
            cv_data: Existing CV data for context
            
        Returns:
            Contextually appropriate content for the section
        """
        # Extract context from existing data
        contact = cv_data.get('contact_information', {})
        name = contact.get('full_name', 'Professional')
        title = contact.get('professional_title', 'Professional')
        
        # Intelligent defaults based on section and context
        if section == 'summary':
            # Generate contextual summary from available data
            years = self._estimate_years_of_experience(cv_data)
            skills_summary = self._extract_key_skills_summary(cv_data)
            
            if years > 0 and skills_summary:
                return f"{title} with {years}+ years of experience. Expertise in {skills_summary}. Proven track record of delivering results and driving innovation. Seeking opportunities to contribute skills and expertise to dynamic organizations."
            elif skills_summary:
                return f"Motivated {title} with strong expertise in {skills_summary}. Quick learner with passion for excellence and commitment to continuous improvement. Ready to contribute to organizational success."
            else:
                return f"Dedicated {title} with proven ability to deliver results. Strong analytical and problem-solving skills. Committed to professional excellence and continuous learning."
        
        elif section == 'experience':
            return []  # Empty array for work experience
        
        elif section == 'education':
            return []  # Empty array for education
        
        elif section in ['skills', 'technical_skills', 'core_competencies']:
            # Try to extract skills from other sections
            extracted_skills = self._extract_skills_from_context(cv_data)
            if extracted_skills:
                return {
                    'technical_skills': extracted_skills.get('technical', []),
                    'soft_skills': extracted_skills.get('soft', ['Communication', 'Teamwork', 'Problem Solving', 'Time Management']),
                    'tools': extracted_skills.get('tools', [])
                }
            return {
                'technical_skills': [],
                'soft_skills': ['Communication', 'Teamwork', 'Problem Solving', 'Adaptability', 'Critical Thinking'],
                'tools': []
            }
        
        elif section == 'certifications':
            return []  # Empty array
        
        elif section == 'projects':
            return []  # Empty array
        
        elif section == 'awards':
            return []  # Empty array
        
        elif section == 'references':
            return "References available upon request."
        
        return []  # Default empty array
    
    def _estimate_years_of_experience(self, cv_data: Dict) -> int:
        """Estimate years of experience from work history"""
        experiences = cv_data.get('professional_experience', [])
        if not experiences:
            return 0
        
        # Simple estimation: count number of positions
        return len(experiences)
    
    def _extract_key_skills_summary(self, cv_data: Dict) -> str:
        """Extract key skills for summary generation"""
        skills_data = cv_data.get('technical_skills', {}) or cv_data.get('core_competencies', []) or cv_data.get('skills', {})
        
        skills_list = []
        if isinstance(skills_data, dict):
            for category, skills in skills_data.items():
                if isinstance(skills, list):
                    skills_list.extend(skills[:3])  # Take top 3 from each category
        elif isinstance(skills_data, list):
            skills_list = skills_data[:5]  # Take top 5
        
        if skills_list:
            return ', '.join(skills_list[:3])  # Return top 3 skills
        return ''
    
    def _extract_skills_from_context(self, cv_data: Dict) -> Dict[str, List[str]]:
        """Extract skills mentioned in other sections"""
        skills = {'technical': [], 'soft': [], 'tools': []}
        
        # Common technical keywords
        tech_keywords = ['python', 'java', 'javascript', 'react', 'node', 'sql', 'aws', 'docker', 'kubernetes', 
                        'machine learning', 'data analysis', 'api', 'backend', 'frontend', 'database']
        
        # Look in professional experience
        for exp in cv_data.get('professional_experience', []):
            description = str(exp.get('description', '')).lower()
            achievements = ' '.join(str(a) for a in exp.get('achievements', []))
            text = description + ' ' + achievements
            
            # Find technical skills
            for keyword in tech_keywords:
                if keyword in text and keyword.title() not in skills['technical']:
                    skills['technical'].append(keyword.title())
        
        return skills if any(skills.values()) else None
    
    def _validate_content_quality(self, cv_data: Dict, include_sections: List[str]) -> Dict:
        """
        ENHANCED: Validate the quality and completeness of CV content.
        Ensures content meets minimum standards for professional CVs.
        
        Args:
            cv_data: CV data to validate
            include_sections: Sections that should be present
            
        Returns:
            Enhanced CV data with quality improvements
        """
        # Validate professional summary length
        if 'professional_summary' in cv_data:
            summary = cv_data['professional_summary']
            if isinstance(summary, str):
                word_count = len(summary.split())
                if word_count < 15:
                    print(f"[CV Builder] ⚠️  Summary too short ({word_count} words), should be 30-80 words")
                elif word_count > 100:
                    print(f"[CV Builder] ⚠️  Summary too long ({word_count} words), consider condensing")
        
        # Validate work experience has achievements
        if 'professional_experience' in cv_data:
            for i, exp in enumerate(cv_data['professional_experience']):
                if not exp.get('achievements'):
                    print(f"[CV Builder] ⚠️  Work experience {i+1} missing achievements")
                    # Add placeholder
                    exp['achievements'] = ["Contributed to team success and organizational goals"]
        
        # Validate contact information completeness
        if 'contact_information' in cv_data:
            contact = cv_data['contact_information']
            required_fields = ['full_name', 'email', 'phone']
            for field in required_fields:
                if not contact.get(field):
                    print(f"[CV Builder] ⚠️  Contact info missing: {field}")
        
        # Ensure skills are properly categorized
        if 'technical_skills' in cv_data:
            skills = cv_data['technical_skills']
            if isinstance(skills, list):  # Convert flat list to categorized
                cv_data['technical_skills'] = {
                    'core_skills': skills[:8],
                    'additional_skills': skills[8:] if len(skills) > 8 else []
                }
                print(f"[CV Builder] ✓ Categorized {len(skills)} skills")
        
        print(f"[CV Builder] ✓ Content quality validation complete")
        return cv_data
    
    def _get_default_section_content(self, section: str):
        """Get default content for a missing section"""
        defaults = {
            'summary': 'Experienced professional seeking new opportunities to contribute skills and expertise.',
            'experience': [],
            'education': [],
            'skills': {
                'programming_languages': [],
                'frameworks_tools': [],
                'methodologies': [],
                'soft_skills': []
            },
            'certifications': [],
            'projects': [],
            'awards': []
        }
        return defaults.get(section, [])
    
    def _extract_job_keywords(self, job_data: Dict) -> List[str]:
        """Extract important keywords from job posting for matching"""
        keywords = []
        
        # Extract from title
        if job_data.get('title'):
            keywords.extend(job_data['title'].lower().split())
        
        # Extract from requirements
        if job_data.get('requirements'):
            req_text = job_data['requirements'].lower()
            # Common skill indicators
            skill_patterns = [
                r'experience with ([a-z0-9\+\#\.]+)',
                r'proficient in ([a-z0-9\+\#\.]+)',
                r'knowledge of ([a-z0-9\+\#\.]+)',
                r'skilled in ([a-z0-9\+\#\.]+)',
                r'([a-z0-9\+\#\.]+) experience',
            ]
            import re
            for pattern in skill_patterns:
                matches = re.findall(pattern, req_text)
                keywords.extend(matches)
        
        # Extract from description
        if job_data.get('description'):
            desc_text = job_data['description'].lower()
            # Technical terms and tools
            tech_words = [w for w in desc_text.split() if len(w) > 3 and not w in ['the', 'and', 'for', 'with', 'that', 'this', 'will', 'from', 'have']]
            keywords.extend(tech_words[:20])
        
        return list(set(keywords))[:30]  # Return unique keywords, max 30
    
    def _extract_profile_keywords(self, user_data: Dict, profile_data: Dict) -> List[str]:
        """Extract keywords from candidate profile"""
        keywords = []
        
        # From skills
        if profile_data.get('skills'):
            keywords.extend([s.lower() for s in str(profile_data['skills']).split(',')])
        
        # From professional title
        if profile_data.get('professional_title'):
            keywords.extend(profile_data['professional_title'].lower().split())
        
        # From work experience
        for exp in user_data.get('work_experiences', []):
            if exp.get('job_title'):
                keywords.extend(exp['job_title'].lower().split())
            if exp.get('description'):
                keywords.extend([w for w in exp['description'].lower().split() if len(w) > 4][:5])
        
        return list(set(keywords))
    
    def _analyze_skill_match(self, job_keywords: List[str], profile_keywords: List[str]) -> List[str]:
        """Find matching skills between job and profile"""
        return list(set(job_keywords) & set(profile_keywords))
    
    def _analyze_experience_match(self, work_experiences: List[Dict], job_data: Dict) -> str:
        """Analyze how well work experience matches job requirements"""
        if not work_experiences:
            return "Entry level - emphasize education, projects, and transferable skills"
        
        total_years = len(work_experiences)
        job_title = job_data.get('title', '').lower()
        
        # Check for title matches
        title_match = False
        for exp in work_experiences:
            if exp.get('job_title', '').lower() in job_title or job_title in exp.get('job_title', '').lower():
                title_match = True
                break
        
        if title_match:
            return f"Strong match - {total_years}+ roles with similar title/responsibilities"
        elif total_years >= 3:
            return f"Moderate match - {total_years} years experience, emphasize transferable skills"
        else:
            return "Career pivot - focus on transferable skills and adaptability"

    def _filter_relevant_experiences(self, work_experiences: List[Dict], job_data: Optional[Dict], max_results: int = 4) -> List[Dict]:
        """Filter and rank work experiences that best match the target job.

        Scoring heuristics:
        - Title similarity with job title
        - Keyword overlap between job requirements/description and experience description/technologies
        - Recency (current or latest roles favored)
        - Presence of achievements/metrics

        Returns top N experiences sorted by relevance.
        """
        if not job_data or not work_experiences:
            return work_experiences or []

        job_title = str(job_data.get('title', '')).lower()
        job_keywords = set([kw.lower() for kw in self._extract_job_keywords(job_data)])

        def exp_score(exp: Dict) -> float:
            score = 0.0
            title = str(exp.get('job_title', '')).lower()
            desc = str(exp.get('description', '')).lower()
            techs = set([str(t).lower() for t in exp.get('technologies_used', [])])
            ach = exp.get('achievements', []) or []

            # Title similarity
            if job_title and (job_title in title or title in job_title):
                score += 20

            # Keyword overlap in description and technologies
            if job_keywords:
                overlap_desc = len(job_keywords & set(desc.split()))
                overlap_tech = len(job_keywords & techs)
                score += overlap_desc * 1.5 + overlap_tech * 3

            # Achievements present, bonus
            if ach:
                score += min(10, len(ach) * 2)

            # Recency bonus: current role or latest
            try:
                if exp.get('is_current'):
                    score += 8
                # Prefer roles with later end_date or current
                if (not exp.get('end_date')) or exp.get('is_current'):
                    score += 4
            except Exception:
                pass

            return score

        ranked = sorted(work_experiences, key=exp_score, reverse=True)
        return ranked[:max_results]
    
    def _quick_json_fixes(self, json_str: str) -> str:
        """
        Apply quick, safe JSON fixes before attempting full parsing.
        These are common AI response issues that can be fixed with simple patterns.
        
        Args:
            json_str: Potentially malformed JSON string
            
        Returns:
            JSON string with quick fixes applied
        """
        import re
        
        # Fix 1: Remove BOM (Byte Order Mark) if present
        if json_str.startswith('\ufeff'):
            json_str = json_str[1:]
        
        # Fix 2: Handle unterminated strings (CRITICAL FIX for production issue)
        # Pattern: "property": "value that never closes\n  "next_property":
        # This is a very common AI error where strings don't have closing quotes
        lines = json_str.split('\n')
        fixed_lines = []
        
        for i, line in enumerate(lines):
            # Check if this line has an unterminated string
            # Count quotes (excluding escaped ones)
            clean_line = line.replace('\\"', '')
            quote_count = clean_line.count('"')
            
            # If odd number of quotes, this line has an unterminated string
            if quote_count % 2 == 1:
                # Find the position of the last unescaped quote
                last_quote_pos = -1
                for j in range(len(line) - 1, -1, -1):
                    if line[j] == '"' and (j == 0 or line[j-1] != '\\'):
                        last_quote_pos = j
                        break
                
                # Add closing quote before line end (before any trailing comma/whitespace)
                if last_quote_pos != -1:
                    # Find the end of the value (before comma or brace)
                    rest_of_line = line[last_quote_pos+1:].rstrip()
                    if rest_of_line and not rest_of_line.startswith('"'):
                        # Need to add closing quote
                        # Insert it before any trailing punctuation
                        if rest_of_line.endswith(','):
                            line = line[:last_quote_pos+1] + line[last_quote_pos+1:].rstrip()[:-1] + '",'
                        elif rest_of_line:
                            line = line[:last_quote_pos+1] + line[last_quote_pos+1:].rstrip() + '"'
                        else:
                            line = line.rstrip() + '"'
            
            fixed_lines.append(line)
        
        json_str = '\n'.join(fixed_lines)
        
        # Fix 3: Fix unescaped quotes in common patterns
        # Pattern: "text": "value with "quotes" inside"
        # This is the most common issue causing "Expecting property name" errors
        
        # Strategy: Find patterns like ": "value with "nested" quotes"" and fix them
        # We'll use a more careful approach to avoid breaking valid JSON
        
        # First, temporarily replace correctly escaped quotes
        json_str = json_str.replace('\\"', '|||ESCAPED_QUOTE|||')
        
        # Now fix the pattern: "property": "value with "internal" quotes",
        # The issue is the internal quotes aren't escaped
        # We'll find these by looking for quotes inside quoted values
        def fix_internal_quotes(match):
            full_match = match.group(0)
            # Count quotes - if more than 2, we have internal quotes to escape
            quote_positions = [i for i, char in enumerate(full_match) if char == '"']
            if len(quote_positions) <= 2:
                return full_match  # Valid pattern, leave it
            
            # We have internal quotes - escape the middle ones
            result = full_match[:quote_positions[1]]  # Up to and including second quote
            middle_section = full_match[quote_positions[1]+1:quote_positions[-1]]
            result += middle_section.replace('"', '\\"')  # Escape internal quotes
            result += full_match[quote_positions[-1]:]  # Final quote and rest
            return result
        
        # Apply the fix to property values (careful regex to avoid false positives)
        # Match: ": "anything with possible "quotes" inside"[,}]
        json_str = re.sub(
            r':\s*"[^"]*"[^",}\]]*"[^",}\]]*"(?=\s*[,}\]])',
            fix_internal_quotes,
            json_str,
            flags=re.DOTALL
        )
        
        # Restore escaped quotes
        json_str = json_str.replace('|||ESCAPED_QUOTE|||', '\\"')
        
        # Fix 4: Remove trailing commas (extremely common)
        json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
        
        # Fix 5: Fix property names without quotes
        # Match: {propertyName: or ,propertyName:
        json_str = re.sub(r'([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'\1"\2":', json_str)
        
        # Fix 6: Remove JavaScript comments (sometimes AI adds explanations)
        json_str = re.sub(r'//.*?$', '', json_str, flags=re.MULTILINE)
        
        return json_str
    
    def _fix_json_formatting(self, json_str: str) -> str:
        """
        Apply comprehensive fixes to malformed JSON from AI responses
        
        Args:
            json_str: Potentially malformed JSON string
            
        Returns:
            Fixed JSON string ready for parsing
        """
        import re
        
        # ===== PHASE 1: Pre-processing cleanup =====
        # Remove comments (AI sometimes adds explanatory comments)
        json_str = re.sub(r'//.*?$', '', json_str, flags=re.MULTILINE)
        json_str = re.sub(r'/\*.*?\*/', '', json_str, flags=re.DOTALL)
        
        # ===== PHASE 2: Fix quote issues (MOST COMMON PROBLEM) =====
        # Fix single quotes to double quotes (but not in contractions)
        # Match: 'key' or 'value' but not don't, can't, etc.
        json_str = re.sub(r"(?<![a-zA-Z])'([^']*?)'(?![a-zA-Z])", r'"\1"', json_str)
        
        # Fix unescaped quotes inside strings
        # This is tricky - we need to escape quotes that are inside string values
        # Pattern: "text with "nested" quotes"
        # Strategy: Find strings and escape internal quotes
        def escape_nested_quotes(match):
            content = match.group(1)
            # Escape any unescaped internal quotes
            content = content.replace('\\"', '|||ESCAPED_QUOTE|||')  # Temporarily mark already escaped
            content = content.replace('"', '\\"')  # Escape unescaped quotes
            content = content.replace('|||ESCAPED_QUOTE|||', '\\"')  # Restore already escaped
            return f'"{content}"'
        
        # This regex is complex - it tries to match property values that might have nested quotes
        # We'll apply it carefully to avoid breaking valid JSON
        try:
            # Match patterns like: "property": "value with "nested" quotes"
            json_str = re.sub(
                r':\s*"([^"]*?"[^"]*?)"(?=\s*[,}\]])',
                escape_nested_quotes,
                json_str
            )
        except Exception as e:
            print(f"[CV Builder] Warning: Nested quote fix failed: {e}")
        
        # ===== PHASE 3: Fix property name issues =====
        # Property names without quotes (common AI mistake)
        # Match: {propertyName: or ,propertyName:
        json_str = re.sub(r'([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'\1"\2":', json_str)
        
        # ===== PHASE 4: Fix trailing commas =====
        # Remove trailing commas before closing brackets/braces
        json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
        
        # ===== PHASE 5: Fix multiple consecutive commas =====
        json_str = re.sub(r',\s*,+', ',', json_str)
        
        # ===== PHASE 6: Fix newlines in string values =====
        # JSON doesn't allow literal newlines in strings - they must be \n
        # Find strings with newlines and escape them
        def fix_string_newlines(match):
            content = match.group(1)
            # Replace literal newlines with \n
            content = content.replace('\n', '\\n')
            content = content.replace('\r', '\\r')
            content = content.replace('\t', '\\t')
            return f'"{content}"'
        
        # Match strings that might contain newlines
        # This is a simplified approach - we'll try to fix obvious cases
        lines = json_str.split('\n')
        fixed_lines = []
        in_multiline_string = False
        multiline_buffer = ""
        
        for line in lines:
            # Simple heuristic: if a line starts with quotes but doesn't end with quotes or comma,
            # it might be a multiline string
            stripped = line.strip()
            
            if in_multiline_string:
                multiline_buffer += " " + stripped
                # Check if this line closes the string
                if stripped.endswith('"') or stripped.endswith('",') or stripped.endswith('"'):
                    # End of multiline string
                    fixed_lines.append(multiline_buffer)
                    in_multiline_string = False
                    multiline_buffer = ""
            else:
                # Check if this starts a multiline string
                # Pattern: "key": "value that doesn't end
                if '"' in stripped:
                    quote_count = stripped.count('"') - stripped.count('\\"')
                    if quote_count % 2 == 1:  # Odd number of quotes
                        # Might be starting a multiline string
                        in_multiline_string = True
                        multiline_buffer = line
                    else:
                        fixed_lines.append(line)
                else:
                    fixed_lines.append(line)
        
        # If we still have a buffer, add it
        if multiline_buffer:
            fixed_lines.append(multiline_buffer)
        
        json_str = '\n'.join(fixed_lines)
        
        # ===== PHASE 7: Fix missing commas between array/object elements =====
        # Pattern: }" { or }" [
        json_str = re.sub(r'\}"\s*\{', '}",{', json_str)
        json_str = re.sub(r'\]"\s*\{', ']",{', json_str)
        json_str = re.sub(r'\}"\s*\[', '}",[', json_str)
        
        # ===== PHASE 8: Fix boolean/null values with quotes =====
        # AI sometimes writes "true" instead of true
        json_str = re.sub(r':\s*"(true|false|null)"', r': \1', json_str)
        
        # ===== PHASE 9: Remove leading/trailing whitespace =====
        json_str = json_str.strip()
        
        return json_str
    
    def get_style_metadata(self) -> List[Dict]:
        """
        Get metadata about available CV styles for frontend rendering
        
        Returns:
            List of style definitions with IDs and descriptions
        """
        return [
            {
                'id': 'professional',
                'name': 'Professional',
                'description': 'Clean, traditional layout ideal for corporate roles',
                'colorScheme': 'Blue & Gray',
                'bestFor': ['Corporate', 'Finance', 'Consulting', 'Legal']
            },
            {
                'id': 'creative',
                'name': 'Creative',
                'description': 'Modern, visually engaging with gradient accents',
                'colorScheme': 'Purple Gradient',
                'bestFor': ['Design', 'Marketing', 'Media', 'Creative Industries']
            },
            {
                'id': 'modern',
                'name': 'Modern',
                'description': 'Sleek minimalist design with contemporary elements',
                'colorScheme': 'Teal & White',
                'bestFor': ['Tech', 'Startups', 'Digital', 'Product']
            },
            {
                'id': 'minimal',
                'name': 'Minimal',
                'description': 'Ultra-clean, content-focused with maximum white space',
                'colorScheme': 'Black & White',
                'bestFor': ['Executive', 'Academic', 'Research', 'Senior Roles']
            },
            {
                'id': 'executive',
                'name': 'Executive',
                'description': 'Sophisticated leadership-focused presentation',
                'colorScheme': 'Navy & Gold',
                'bestFor': ['C-Suite', 'VP', 'Director', 'Senior Management']
            },
            {
                'id': 'tech',
                'name': 'Tech',
                'description': 'Code-inspired with monospace accents',
                'colorScheme': 'Green & Dark',
                'bestFor': ['Software Engineering', 'DevOps', 'Data Science']
            },
            {
                'id': 'bold',
                'name': 'Bold',
                'description': 'Confident and impactful with strong visual hierarchy',
                'colorScheme': 'Red & Black',
                'bestFor': ['Sales', 'Business Development', 'Marketing', 'Consulting']
            },
            {
                'id': 'elegant',
                'name': 'Elegant',
                'description': 'Refined and sophisticated with subtle design elements',
                'colorScheme': 'Purple & Gray',
                'bestFor': ['Luxury Brands', 'Fashion', 'High-end Services', 'Executive']
            }
        ]
    
    def _final_section_check(self, cv_data: Dict, include_sections: List[str]) -> List[str]:
        """
        Final verification that all selected sections are actually present.
        Returns list of still-missing sections.
        """
        section_mapping = {
            'summary': 'professional_summary',
            'experience': 'professional_experience',
            'work': 'professional_experience',
            'education': 'education',
            'skills': ['technical_skills', 'core_competencies', 'skills'],
            'certifications': 'certifications',
            'projects': 'projects',
            'awards': 'awards',
            'references': 'references'
        }
        
        missing = []
        for section in include_sections:
            if section not in section_mapping:
                continue
            
            mapping = section_mapping[section]
            
            if isinstance(mapping, list):
                # Check if ANY of the possible keys exist and have content
                has_content = False
                for key in mapping:
                    if key in cv_data and cv_data[key]:
                        has_content = True
                        break
                if not has_content:
                    missing.append(section)
            else:
                # Single key - check if exists and has content
                if mapping not in cv_data or not cv_data[mapping]:
                    missing.append(section)
        
        return missing
    
    def _force_add_section(self, cv_data: Dict, section: str) -> Dict:
        """Force add a missing section with minimal content"""
        section_mapping = {
            'summary': 'professional_summary',
            'experience': 'professional_experience',
            'work': 'professional_experience',
            'education': 'education',
            'skills': 'technical_skills',
            'certifications': 'certifications',
            'projects': 'projects',
            'awards': 'awards',
            'references': 'references'
        }
        
        if section in section_mapping:
            key = section_mapping[section]
            cv_data[key] = self._generate_intelligent_content(section, cv_data)
            print(f"[CV Builder] ✅ Force-added section: {key}")
        
        return cv_data
    
    def _calculate_quality_score(self, cv_data: Dict, include_sections: List[str]) -> int:
        """
        Calculate overall quality score (0-100) for the generated CV.
        Considers completeness, content quality, and ATS optimization.
        """
        score = 0
        max_score = 100
        
        # Section completeness (30 points)
        sections_present = 0
        for section in include_sections:
            if self._section_has_content(cv_data, section):
                sections_present += 1
        section_score = (sections_present / len(include_sections)) * 30 if include_sections else 0
        score += section_score
        
        # Content quality (40 points)
        # Professional summary quality (10 points)
        if 'professional_summary' in cv_data:
            summary = cv_data['professional_summary']
            word_count = len(str(summary).split())
            if 30 <= word_count <= 80:
                score += 10
            elif 20 <= word_count < 30 or 80 < word_count <= 100:
                score += 7
            elif word_count >= 15:
                score += 4
        
        # Work experience quality (15 points)
        experiences = cv_data.get('professional_experience', [])
        if experiences:
            has_achievements = sum(1 for exp in experiences if exp.get('achievements'))
            score += min(15, has_achievements * 5)
        
        # Skills completeness (10 points)
        skills = cv_data.get('technical_skills', {}) or cv_data.get('skills', {})
        if skills:
            if isinstance(skills, dict):
                skill_count = sum(len(v) for v in skills.values() if isinstance(v, list))
            elif isinstance(skills, list):
                skill_count = len(skills)
            else:
                skill_count = 0
            
            if skill_count >= 10:
                score += 10
            elif skill_count >= 5:
                score += 7
            elif skill_count >= 1:
                score += 4
        
        # Contact information (5 points)
        contact = cv_data.get('contact_information', {})
        if contact.get('email') and contact.get('phone'):
            score += 5
        
        # ATS Score integration (30 points)
        ats_score = cv_data.get('ats_score', {})
        if ats_score and ats_score.get('estimated_score'):
            # Scale ATS score (0-100) to 30 points
            score += (ats_score['estimated_score'] / 100) * 30
        
        return min(int(score), max_score)
    
    def _section_has_content(self, cv_data: Dict, section: str) -> bool:
        """Check if a section exists and has actual content"""
        section_mapping = {
            'summary': 'professional_summary',
            'experience': 'professional_experience',
            'work': 'professional_experience',
            'education': 'education',
            'skills': ['technical_skills', 'core_competencies', 'skills'],
            'certifications': 'certifications',
            'projects': 'projects',
            'awards': 'awards',
            'references': 'references'
        }
        
        if section not in section_mapping:
            return False
        
        mapping = section_mapping[section]
        
        if isinstance(mapping, list):
            for key in mapping:
                if key in cv_data and cv_data[key]:
                    return True
            return False
        else:
            return mapping in cv_data and bool(cv_data[mapping])