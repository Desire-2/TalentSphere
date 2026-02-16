"""
CV Builder API Routes
Provides endpoints for AI-powered CV content generation
Frontend handles all rendering, styling, and PDF export
"""
from flask import Blueprint, request, jsonify
from functools import wraps
from datetime import datetime
import jwt
import os
import json

import re

from src.models.user import db, User
from src.models.profile_extensions import WorkExperience, Education, Certification, Project, Award
from src.services.cv.cv_builder_service import CVBuilderService  # Refactored modular service
from src.utils.db_utils import safe_db_operation

cv_builder_bp = Blueprint('cv_builder', __name__, url_prefix='/api/cv-builder')

# Initialize CV Builder Service (Refactored - now ~300 lines instead of 2667!)
cv_service = CVBuilderService()

# Token verification decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                return jsonify({'success': False, 'message': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'success': False, 'message': 'Authentication token is missing'}), 401
        
        try:
            # Decode token
            from flask import current_app
            secret_key = current_app.config.get('SECRET_KEY', 'asdf#FGSgvasgf$5$WGT')
            payload = jwt.decode(token, secret_key, algorithms=['HS256'])
            current_user = User.query.get(payload['user_id'])
            
            if not current_user:
                return jsonify({'success': False, 'message': 'User not found'}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'message': 'Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated


def role_required(*allowed_roles):
    """Decorator to check if user has required role"""
    def decorator(f):
        @wraps(f)
        def decorated_function(current_user, *args, **kwargs):
            if current_user.role not in allowed_roles:
                return jsonify({
                    'success': False,
                    'message': f'Access denied. Required roles: {", ".join(allowed_roles)}'
                }), 403
            return f(current_user, *args, **kwargs)
        return decorated_function
    return decorator


@cv_builder_bp.route('/generate', methods=['POST'])
@token_required
@role_required('job_seeker', 'admin')
def generate_cv(current_user):
    """
    Generate AI-powered CV content for the current user
    Frontend will handle rendering with different templates
    
    Request body:
    {
        "job_id": 123,  // Optional: ID of job to tailor CV for
        "job_data": {   // Optional: Custom job data if not using job_id
            "title": "Software Engineer",
            "description": "...",
            "requirements": "...",
            ...
        },
        "style": "professional",  // Style preference for AI content tone
        "sections": ["work", "education", "skills", "summary", "projects", "certifications"]
    }
    
    Response:
    {
        "success": true,
        "data": {
            "cv_content": { /* Structured CV data */ },
            "metadata": { /* Generation metadata */ }
        }
    }
    """
    try:
        data = request.get_json()
        
        # Debug logging
        print(f"[CV Builder] Received request data: {data}")
        
        # Get user profile data
        user_data = _get_user_profile_data(current_user)
        
        # Get job data if job_id provided
        job_data = None
        if data.get('job_id'):
            from src.models.job import Job
            job = Job.query.get(data['job_id'])
            if job:
                job_data = _build_comprehensive_job_data(job)
        elif data.get('job_data'):
            job_data = _normalize_custom_job_data(data['job_data'])
            print(f"[CV Builder] Using normalized custom job data: {job_data.get('title')}")
        
        # Get CV preferences
        cv_style = data.get('style', 'professional')
        sections = data.get('sections', ['work', 'education', 'skills', 'summary', 'projects', 'certifications'])
        use_incremental = data.get('incremental', True)  # Default to incremental generation
        
        # Choose service based on preference
        if use_incremental:
            print(f"[CV Builder] Using V2 incremental generation")
            # Generate CV content using V2 incremental AI (better for rate limits)
            cv_content = cv_service.generate_cv_content(
                user_data=user_data,
                job_data=job_data,
                cv_style=cv_style,
                include_sections=sections
            )
        else:
            print(f"[CV Builder] Using V1 full generation")
            # Generate CV content using V1 full generation
            cv_content = cv_service.generate_cv_content(
                user_data=user_data,
                job_data=job_data,
                cv_style=cv_style,
                include_sections=sections
            )
        
        return jsonify({
            'success': True,
            'message': 'CV content generated successfully',
            'data': {
                'cv_content': cv_content,
                'user_data': {
                    'name': f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}",
                    'email': user_data.get('email'),
                    'phone': user_data.get('phone'),
                    'location': user_data.get('location')
                }
            }
        }), 200
        
    except Exception as e:
        print(f"CV generation error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'CV generation failed: {str(e)}'
        }), 500


@cv_builder_bp.route('/user-data', methods=['GET'])
@token_required
@role_required('job_seeker', 'admin')
def get_user_cv_data(current_user):
    """
    Get user profile data formatted for CV generation
    Useful for frontend to preview what data will be used
    """
    try:
        user_data = _get_user_profile_data(current_user)
        
        return jsonify({
            'success': True,
            'message': 'User data retrieved',
            'data': user_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to retrieve user data: {str(e)}'
        }), 500


@cv_builder_bp.route('/styles', methods=['GET'])
def get_available_styles():
    """
    Get list of available CV styles with descriptions
    Frontend uses this to offer template options to users
    """
    try:
        styles = cv_service.get_style_metadata()  # Use V2 for consistent metadata
        
        return jsonify({
            'success': True,
            'data': styles
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to get styles: {str(e)}'
        }), 500


@cv_builder_bp.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint for CV Builder service
    Returns status of API providers and system health
    """
    try:
        from flask import current_app
        
        # Check API provider availability
        api_stats = cv_service.api_client.get_statistics()
        
        # Check database connection
        db_healthy = True
        try:
            from src.models.user import db
            db.session.execute('SELECT 1')
        except Exception:
            db_healthy = False
        
        # Overall health status
        is_healthy = (
            db_healthy and
            not (api_stats.get('openrouter_exhausted') and api_stats.get('gemini_exhausted'))
        )
        
        return jsonify({
            'success': True,
            'status': 'healthy' if is_healthy else 'degraded',
            'timestamp': datetime.utcnow().isoformat(),
            'components': {
                'database': 'healthy' if db_healthy else 'unhealthy',
                'api_providers': {
                    'openrouter': 'available' if not api_stats.get('openrouter_exhausted') else 'rate_limited',
                    'gemini': 'available' if not api_stats.get('gemini_exhausted') else 'rate_limited',
                    'active': api_stats.get('current_provider')
                },
                'statistics': api_stats
            }
        }), 200 if is_healthy else 503
    except Exception as e:
        return jsonify({
            'success': False,
            'status': 'unhealthy',
            'error': str(e)
        }), 503


@cv_builder_bp.route('/generate-incremental', methods=['POST'])
@token_required
@role_required('job_seeker', 'admin')
def generate_cv_incremental(current_user):
    """
    Generate CV content incrementally section by section
    Better for avoiding API rate limits and provides progress updates
    
    Request body:
    {
        "job_id": 123,  // Optional
        "job_data": {},  // Optional custom job data
        "style": "professional",
        "sections": ["summary", "experience", "education", "skills", "projects"]
    }
    
    Response:
    {
        "success": true,
        "message": "CV generated successfully with 5 sections",
        "data": {
            "cv_content": { /* Complete CV data */ },
            "sections_generated": ["summary", "experience", "education", "skills", "projects"],
            "generation_time": 15.5
        }
    }
    """
    import time as time_module
    start_time = time_module.time()
    
    try:
        data = request.get_json()
        
        # Get user profile data
        user_data = _get_user_profile_data(current_user)
        
        # Get job data if provided
        job_data = None
        if data.get('job_id'):
            from src.models.job import Job
            job = Job.query.get(data['job_id'])
            if job:
                job_data = _build_comprehensive_job_data(job)
        elif data.get('job_data'):
            job_data = _normalize_custom_job_data(data['job_data'])
        
        # Get preferences
        cv_style = data.get('style', 'professional')
        sections = data.get('sections', ['summary', 'experience', 'education', 'skills', 'projects', 'certifications'])
        
        print(f"[CV Builder] Incremental generation: {len(sections)} sections")
        
        # Generate CV using V2 service (incremental)
        cv_content = cv_service.generate_cv_content(
            user_data=user_data,
            job_data=job_data,
            cv_style=cv_style,
            include_sections=sections
        )
        
        generation_time = time_module.time() - start_time
        
        return jsonify({
            'success': True,
            'message': f'CV generated successfully with {len(sections)} sections',
            'data': {
                'cv_content': cv_content,
                'user_data': {
                    'name': f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}",
                    'email': user_data.get('email'),
                    'phone': user_data.get('phone'),
                    'location': user_data.get('location')
                },
                'sections_generated': sections,
                'generation_time': round(generation_time, 2)
            }
        }), 200
        
    except Exception as e:
        print(f"Incremental CV generation error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'CV generation failed: {str(e)}'
        }), 500


@cv_builder_bp.route('/quick-generate', methods=['POST'])
@token_required
@role_required('job_seeker', 'admin')
def quick_generate_cv(current_user):
    """
    Quick CV generation endpoint (section-by-section method)
    Optimized for frontend with progress tracking and todos
    
    Request body:
    {
        "job_id": 123,                  // Optional
        "custom_job": {...},            // Optional custom job data
        "style": "professional",
        "sections": ["summary", "work", "education", "skills"],
        "use_section_by_section": true
    }
    
    Response:
    {
        "success": true,
        "message": "CV generated successfully",
        "data": {
            "cv_content": {...},
            "progress": [...],
            "todos": [...]
        }
    }
    """
    try:
        import time as time_module
        start_time = time_module.time()
        
        data = request.get_json()
        
        # Gather user profile data
        user_data = _get_user_profile_data(current_user)
        
        # Handle job targeting
        job_data = None
        if data.get('job_id'):
            from src.models.job import Job
            job = Job.query.get(data['job_id'])
            if job:
                job_data = _build_comprehensive_job_data(job)
        elif data.get('custom_job'):
            job_data = _normalize_custom_job_data(data['custom_job'])
        
        # Get preferences
        cv_style = data.get('style', 'professional')
        sections = data.get('sections', ['summary', 'work', 'education', 'skills', 'projects', 'certifications'])
        use_section_by_section = data.get('use_section_by_section', True)
        
        print(f"[CV Builder] Quick generate: {len(sections)} sections, section-by-section={use_section_by_section}")
        
        # Generate CV content
        if use_section_by_section:
            # Use section-by-section generation for better control
            cv_content = cv_service.generate_cv_content(
                user_data=user_data,
                job_data=job_data,
                cv_style=cv_style,
                include_sections=sections
            )
        else:
            # Use full generation
            cv_content = cv_service.generate_cv_content(
                user_data=user_data,
                job_data=job_data,
                cv_style=cv_style,
                include_sections=sections
            )
        
        generation_time = time_module.time() - start_time
        
        # Extract job match analysis for top-level access
        job_match = cv_content.get('job_match_analysis', None)
        
        return jsonify({
            'success': True,
            'message': 'CV generated successfully',
            'data': {
                'cv_content': cv_content,
                'progress': cv_content.get('generation_progress', []),
                'todos': cv_content.get('todos', []),
                'job_match_analysis': job_match,
                'user_data': {
                    'name': f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}",
                    'email': user_data.get('email'),
                    'phone': user_data.get('phone'),
                    'location': user_data.get('location')
                },
                'generation_time': round(generation_time, 2)
            }
        }), 200
        
    except Exception as e:
        print(f"Quick CV generation error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'CV generation failed: {str(e)}'
        }), 500


@cv_builder_bp.route('/generate-targeted', methods=['POST'])
@token_required
@role_required('job_seeker', 'admin')
def generate_cv_targeted(current_user):
    """
    Generate CV with V3 targeted section-by-section processing
    Each section receives only relevant profile data and job requirements
    Includes progress tracking and todo items for follow-up
    
    Request body:
    {
        "job_id": 123,
        "job_data": {...},
        "style": "professional",
        "sections": ["summary", "experience", "education", "skills"]
    }
    
    Response includes:
    - cv_content: Complete CV data
    - generation_progress: Array of progress updates per section
    - todos: Array of follow-up items for incomplete sections
    - generation_time: Total time taken
    """
    try:
        import time as time_module
        start_time = time_module.time()
        
        data = request.get_json()
        
        # Gather user profile data
        user_data = _get_user_profile_data(current_user)
        
        # Handle job targeting
        job_data = None
        if data.get('job_id'):
            from src.models.job import Job
            job = Job.query.get(data['job_id'])
            if job:
                job_data = _build_comprehensive_job_data(job)
        elif data.get('job_data'):
            job_data = _normalize_custom_job_data(data['job_data'])
        
        # Get preferences
        cv_style = data.get('style', 'professional')
        sections = data.get('sections', ['summary', 'experience', 'education', 'skills', 'projects', 'certifications'])
        
        print(f"[CV Builder V3] Targeted generation: {len(sections)} sections")
        print(f"[CV Builder V3] Job targeting: {job_data.get('title') if job_data else 'General CV'}")
        
        # Generate CV using V3 service (targeted section-by-section)
        cv_content = cv_service.generate_cv_section_by_section(
            user_data=user_data,
            job_data=job_data,
            cv_style=cv_style,
            include_sections=sections
        )
        
        generation_time = time_module.time() - start_time
        
        return jsonify({
            'success': True,
            'message': f'CV generated with targeted section processing ({len(sections)} sections)',
            'data': {
                'cv_content': cv_content,
                'user_data': {
                    'name': f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}",
                    'email': user_data.get('email'),
                    'phone': user_data.get('phone'),
                    'location': user_data.get('location')
                },
                'sections_generated': sections,
                'generation_progress': cv_content.get('generation_progress', []),
                'todos': cv_content.get('todos', []),
                'generation_time': round(generation_time, 2),
                'version': '3.0-targeted'
            }
        }), 200
        
    except Exception as e:
        print(f"Targeted CV generation error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'CV generation failed: {str(e)}'
        }), 500


# ──────────────────────────────────────────────────────────────────────────────
# Custom Job Normalization — enriches raw custom_job input to match
# the structured format of _build_comprehensive_job_data()
# ──────────────────────────────────────────────────────────────────────────────

def _normalize_custom_job_data(raw: dict) -> dict:
    """Normalize and enrich custom job data from the frontend form.
    
    The frontend custom job form can send:
      Minimal:   {title, company, description, requirements}
      Extended:   + required_skills, preferred_skills, experience_level,
                    employment_type, location, education_requirement,
                    years_experience_min, years_experience_max,
                    salary_min, salary_max, full_posting
    
    This function:
      1. Maps frontend field names to the canonical format
      2. Extracts structured data from free-text description/requirements
      3. Fills in gaps so the matcher & prompt builder get rich data
    """
    combined_text = ' '.join([
        str(raw.get('description', '')),
        str(raw.get('requirements', '')),
        str(raw.get('full_posting', '')),
    ]).lower()

    # --- Skills extraction from free text ---
    def _extract_skills_from_text(text: str) -> list:
        """Extract skills/technologies from free-form text using patterns."""
        skills = set()
        
        # Known tech terms & tools (broad coverage)
        known_terms = [
            'python', 'javascript', 'typescript', 'java', 'c\\+\\+', 'c#', 'ruby', 'go',
            'rust', 'swift', 'kotlin', 'php', 'scala', 'r\\b', 'dart', 'sql',
            'react', 'angular', 'vue', 'svelte', 'next\\.js', 'nuxt', 'node\\.js',
            'express', 'django', 'flask', 'fastapi', 'spring', 'rails', 'laravel',
            'html', 'css', 'sass', 'tailwind', 'bootstrap',
            'aws', 'azure', 'gcp', 'google cloud', 'heroku', 'vercel',
            'docker', 'kubernetes', 'jenkins', 'terraform', 'ansible',
            'git', 'github', 'gitlab', 'bitbucket',
            'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
            'dynamodb', 'firebase', 'supabase', 'oracle', 'sqlite',
            'pandas', 'numpy', 'tensorflow', 'pytorch', 'scikit-learn',
            'tableau', 'power bi', 'excel', 'matlab',
            'figma', 'sketch', 'adobe', 'photoshop', 'illustrator',
            'jira', 'confluence', 'trello', 'asana', 'slack',
            'salesforce', 'hubspot', 'sap', 'quickbooks',
            'machine learning', 'deep learning', 'data science', 'data analysis',
            'project management', 'agile', 'scrum', 'kanban',
            'ci/cd', 'devops', 'microservices', 'rest api', 'graphql',
            'blockchain', 'cybersecurity', 'networking',
        ]
        for term in known_terms:
            if re.search(r'\b' + term + r'\b', text):
                skills.add(term.replace('\\+\\+', '++').replace('\\.', '.').replace('\\b', ''))
        
        # Pattern: "experience with/in X, Y, and Z" - extract just the skill names
        patterns = [
            r'(?:experience|proficient|proficiency|knowledge|expertise|skilled|familiar)\s+(?:with|in|of|using)\s+([a-zA-Z0-9\+\#\.\-/]+(?:\s*(?:,|and)\s*[a-zA-Z0-9\+\#\.\-/]+)*)',
            r'(?:must|should)\s+(?:have|know)\s+([a-zA-Z0-9\+\#\.\-/\s]+?)(?:\.|,|;|\n)',
        ]
        skip_prefixes = {'experience with', 'experience in', 'knowledge of', 'proficient in', 'familiar with'}
        for pattern in patterns:
            for match in re.findall(pattern, text):
                for part in re.split(r'\s*[,;]\s*|\s+and\s+', match):
                    part = part.strip().rstrip('.,;:!?')
                    # Skip overly long or generic phrases
                    if not part or len(part) <= 1 or len(part) > 30:
                        continue
                    lower = part.lower()
                    if any(lower.startswith(p) for p in skip_prefixes):
                        continue
                    skills.add(lower)
        
        # Deduplicate: remove entries with trailing punctuation
        cleaned = set()
        for s in skills:
            s = s.strip().rstrip('.,;:!?')
            if s:
                cleaned.add(s)
        
        return sorted(cleaned)

    # --- Experience level detection ---
    def _detect_experience_level(text: str) -> str:
        patterns = {
            'executive': r'\b(?:chief|cto|ceo|cfo|coo|vp|vice president|director|head of|c-level|c-suite)\b',
            'senior': r'\b(?:senior|sr\.|lead|principal|staff|expert|seasoned)\b',
            'mid': r'\b(?:mid[- ]?level|intermediate|experienced|3-5 years|4-6 years|5-7 years|3\+? years)\b',
            'junior': r'\b(?:junior|jr\.|entry[- ]?level|associate|intern|graduate|trainee|0-2 years|1-2 years|1-3 years)\b',
        }
        for level, pattern in patterns.items():
            if re.search(pattern, text):
                return level
        return raw.get('experience_level', 'mid')

    # --- Employment type detection ---
    def _detect_employment_type(text: str) -> str:
        patterns = {
            'full-time': r'\b(?:full[- ]?time)\b',
            'part-time': r'\b(?:part[- ]?time)\b',
            'contract': r'\b(?:contract|freelance|contractor)\b',
            'internship': r'\b(?:internship|intern)\b',
            'temporary': r'\b(?:temporary|temp position)\b',
        }
        for emp_type, pattern in patterns.items():
            if re.search(pattern, text):
                return emp_type
        return raw.get('employment_type', 'full-time')

    # --- Education requirement detection ---
    def _detect_education(text: str) -> str:
        patterns = [
            (r"\b(?:phd|doctorate|doctoral)\b", "PhD"),
            (r"\b(?:master'?s?|msc|mba|m\.s\.)\b", "Master's"),
            (r"\b(?:bachelor'?s?|bsc|b\.s\.|b\.a\.)\b", "Bachelor's"),
            (r"\b(?:associate'?s?|diploma)\b", "Associate's"),
            (r"\b(?:high school|ged|secondary)\b", "High School"),
        ]
        for pattern, label in patterns:
            if re.search(pattern, text):
                return label
        return raw.get('education_requirement', None)

    # --- Years of experience extraction ---
    def _extract_years(text: str) -> tuple:
        m = re.search(r'(\d+)\s*(?:\+|or more)\s*(?:years?|yrs?)', text)
        if m:
            return int(m.group(1)), None
        m = re.search(r'(\d+)\s*-\s*(\d+)\s*(?:years?|yrs?)', text)
        if m:
            return int(m.group(1)), int(m.group(2))
        return raw.get('years_experience_min'), raw.get('years_experience_max')

    # --- Location extraction ---
    def _detect_remote(text: str) -> bool:
        return bool(re.search(r'\b(?:remote|work from home|wfh|distributed|anywhere)\b', text))

    # --- Build normalized job data ---
    required_skills_raw = raw.get('required_skills')
    if isinstance(required_skills_raw, str):
        required_skills = [s.strip() for s in required_skills_raw.split(',') if s.strip()]
    elif isinstance(required_skills_raw, list):
        required_skills = required_skills_raw
    else:
        # Extract from description/requirements text
        required_skills = _extract_skills_from_text(combined_text)

    preferred_skills_raw = raw.get('preferred_skills')
    if isinstance(preferred_skills_raw, str):
        preferred_skills = [s.strip() for s in preferred_skills_raw.split(',') if s.strip()]
    elif isinstance(preferred_skills_raw, list):
        preferred_skills = preferred_skills_raw
    else:
        preferred_skills = []

    years_min, years_max = _extract_years(combined_text)

    normalized = {
        # Core identification
        'id': None,
        'title': raw.get('title', ''),
        'company_name': raw.get('company', raw.get('company_name', '')),
        'description': raw.get('description', ''),
        'summary': raw.get('summary', ''),

        # Requirements text preserved for prompt
        'requirements': raw.get('requirements', ''),

        # Full original posting if pasted
        'full_posting': raw.get('full_posting', ''),

        # Job requirements & skills
        'required_skills': required_skills,
        'preferred_skills': preferred_skills,
        'education_requirement': _detect_education(combined_text),
        'years_experience_min': years_min,
        'years_experience_max': years_max,

        # Job classification
        'employment_type': _detect_employment_type(combined_text),
        'experience_level': _detect_experience_level(combined_text),
        'category': raw.get('category', None),
        'keywords': raw.get('keywords', []),

        # Location info
        'location': raw.get('location', ''),
        'location_type': 'remote' if _detect_remote(combined_text) else raw.get('location_type', ''),
        'is_remote': _detect_remote(combined_text),

        # Compensation
        'salary_min': raw.get('salary_min'),
        'salary_max': raw.get('salary_max'),
        'salary_currency': raw.get('salary_currency', 'USD'),

        # Source info
        'job_source': 'custom',
        'is_featured': False,
        'is_urgent': False,
    }

    auto_fields = []
    if required_skills and not required_skills_raw:
        auto_fields.append(f"{len(required_skills)} skills")
    if normalized['experience_level'] != 'mid' or raw.get('experience_level'):
        auto_fields.append(f"level={normalized['experience_level']}")
    if normalized['education_requirement']:
        auto_fields.append(f"edu={normalized['education_requirement']}")
    if years_min:
        auto_fields.append(f"exp={years_min}-{years_max or 'N/A'}y")
    if normalized['is_remote']:
        auto_fields.append("remote")

    print(f"[CV Builder] Normalized custom job: title='{normalized['title']}', "
          f"company='{normalized['company_name']}', "
          f"skills={len(normalized['required_skills'])} required / "
          f"{len(normalized['preferred_skills'])} preferred"
          + (f", auto-detected: {', '.join(auto_fields)}" if auto_fields else ""))

    return normalized


@cv_builder_bp.route('/parse-job-posting', methods=['POST'])
@token_required
@role_required('job_seeker', 'admin')
def parse_job_posting(current_user):
    """
    AI-powered job posting parser.
    Accepts raw text from a pasted job posting and returns structured fields.
    Frontend uses this to auto-fill the custom job form.
    
    Request: { "raw_text": "Full job posting text..." }
    Response: { "success": true, "data": { "title": "...", "company": "...", ... } }
    """
    try:
        data = request.get_json()
        raw_text = data.get('raw_text', '').strip()

        if not raw_text or len(raw_text) < 30:
            return jsonify({
                'success': False,
                'message': 'Please paste a complete job posting (at least 30 characters)'
            }), 400

        # Truncate very long postings to keep token usage reasonable 
        if len(raw_text) > 8000:
            raw_text = raw_text[:8000]

        prompt = f"""You are an expert job posting parser. Extract structured information from this job posting and return ONLY valid JSON.

JOB POSTING:
\"\"\"
{raw_text}
\"\"\"

Return a JSON object with these fields (use empty string "" if not found, use [] for empty arrays):
{{
  "title": "Exact job title",
  "company": "Company name",
  "description": "Main job description / overview (2-4 sentences)",
  "requirements": "Full requirements section as text",
  "required_skills": ["skill1", "skill2", ...],
  "preferred_skills": ["skill1", "skill2", ...],
  "experience_level": "junior|mid|senior|executive",
  "employment_type": "full-time|part-time|contract|internship|temporary",
  "education_requirement": "Highest education required",
  "years_experience_min": null or number,
  "years_experience_max": null or number,
  "location": "City, Country or Remote",
  "salary_min": null or number,
  "salary_max": null or number,
  "salary_currency": "USD" or relevant currency,
  "category": "Industry/field category"
}}

Return ONLY the JSON object, no explanation."""

        # Use the CV service API client (same rate-limit-aware client)
        response_text = cv_service.api_client.make_request_with_retry(prompt)

        # Parse JSON from response
        import re as re_module
        json_match = re_module.search(r'\{.*\}', response_text, re_module.DOTALL)
        if json_match:
            parsed = json.loads(json_match.group())
        else:
            parsed = json.loads(response_text)

        # Ensure arrays are proper lists
        for key in ['required_skills', 'preferred_skills']:
            if isinstance(parsed.get(key), str):
                parsed[key] = [s.strip() for s in parsed[key].split(',') if s.strip()]
            elif not isinstance(parsed.get(key), list):
                parsed[key] = []

        print(f"[CV Builder] Parsed job posting: title='{parsed.get('title', '')}', "
              f"company='{parsed.get('company', '')}', "
              f"skills={len(parsed.get('required_skills', []))} required")

        return jsonify({
            'success': True,
            'message': 'Job posting parsed successfully',
            'data': parsed
        }), 200

    except json.JSONDecodeError as e:
        print(f"[CV Builder] Parse job posting JSON error: {e}")
        return jsonify({
            'success': False,
            'message': 'Could not parse job posting. Please try with a clearer posting.'
        }), 422
    except Exception as e:
        print(f"[CV Builder] Parse job posting error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Failed to parse job posting: {str(e)}'
        }), 500


# Helper function to build comprehensive job data for CV generation
def _build_comprehensive_job_data(job) -> dict:
    """Build rich job data dictionary from a Job model instance.
    
    Extracts all relevant fields that the enhanced job_matcher and
    prompt_builder need for deep CV-job tailoring.
    """
    import json as json_module
    
    # Determine company name from relationship or external field
    company_name = None
    if job.company_id and job.company:
        company_name = job.company.name
    elif job.external_company_name:
        company_name = job.external_company_name
    
    # Parse JSON skill fields safely
    def _parse_json_field(field_value):
        if not field_value:
            return []
        if isinstance(field_value, list):
            return field_value
        try:
            parsed = json_module.loads(field_value)
            return parsed if isinstance(parsed, list) else [str(parsed)]
        except (json_module.JSONDecodeError, TypeError):
            # Treat as comma-separated string
            return [s.strip() for s in str(field_value).split(',') if s.strip()]
    
    # Parse keywords field
    keywords = _parse_json_field(job.keywords) if job.keywords else []
    
    job_data = {
        # Core identification
        'id': job.id,
        'title': job.title,
        'company_name': company_name,
        'description': job.description,
        'summary': job.summary,
        
        # Job requirements & skills
        'required_skills': _parse_json_field(job.required_skills),
        'preferred_skills': _parse_json_field(job.preferred_skills),
        'education_requirement': job.education_requirement,
        'years_experience_min': job.years_experience_min,
        'years_experience_max': job.years_experience_max,
        
        # Job classification
        'employment_type': job.employment_type,
        'experience_level': job.experience_level,
        'category': job.category.name if job.category else None,
        'keywords': keywords,
        
        # Location info
        'location': job.get_location_display(),
        'location_type': job.location_type,
        'city': job.city,
        'state': job.state,
        'country': job.country,
        'is_remote': job.is_remote,
        
        # Compensation (for salary expectation alignment)
        'salary_min': job.salary_min,
        'salary_max': job.salary_max,
        'salary_currency': job.salary_currency or 'USD',
        'salary_period': job.salary_period or 'yearly',
        
        # Application requirements (helps tailor CV emphasis)
        'requires_resume': job.requires_resume,
        'requires_cover_letter': job.requires_cover_letter,
        'requires_portfolio': job.requires_portfolio,
        
        # Source info
        'job_source': job.job_source,
        'is_featured': job.is_featured,
        'is_urgent': job.is_urgent,
    }
    
    print(f"[CV Builder] Built comprehensive job data: title='{job.title}', "
          f"company='{company_name}', skills={len(job_data['required_skills'])} required / "
          f"{len(job_data['preferred_skills'])} preferred, exp_level='{job.experience_level}'")
    
    return job_data


# Helper function to gather user profile data
def _get_user_profile_data(user: User) -> dict:
    """Gather comprehensive user profile data for CV generation"""
    
    # Base user info
    user_data = {
        'id': user.id,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email,
        'phone': user.phone,
        'location': user.location,
        'bio': user.bio,
        'profile_picture': user.profile_picture
    }
    
    # Job seeker profile
    if user.job_seeker_profile:
        profile = user.job_seeker_profile
        user_data['job_seeker_profile'] = {
            'professional_title': getattr(profile, 'professional_title', None),
            'professional_summary': getattr(profile, 'professional_summary', None),
            'desired_position': getattr(profile, 'desired_position', None),
            'skills': getattr(profile, 'skills', None),
            'soft_skills': getattr(profile, 'soft_skills', None),
            'years_of_experience': getattr(profile, 'years_of_experience', 0),
            'education_level': getattr(profile, 'education_level', None),
            'career_level': getattr(profile, 'career_level', None),
            'desired_salary_min': getattr(profile, 'desired_salary_min', None),
            'desired_salary_max': getattr(profile, 'desired_salary_max', None),
            'salary_currency': getattr(profile, 'salary_currency', 'USD'),
            'preferred_location': getattr(profile, 'preferred_location', None),
            'preferred_locations': getattr(profile, 'preferred_locations', None),
            'job_type_preference': getattr(profile, 'job_type_preference', None),
            'job_types': getattr(profile, 'job_types', None),
            'availability': getattr(profile, 'availability', None),
            'willing_to_relocate': getattr(profile, 'willing_to_relocate', False),
            'willing_to_travel': getattr(profile, 'willing_to_travel', None),
            'work_authorization': getattr(profile, 'work_authorization', None),
            'visa_sponsorship_required': getattr(profile, 'visa_sponsorship_required', False),
            'notice_period': getattr(profile, 'notice_period', None),
            'preferred_industries': getattr(profile, 'preferred_industries', None),
            'preferred_company_size': getattr(profile, 'preferred_company_size', None),
            'preferred_work_environment': getattr(profile, 'preferred_work_environment', None),
            'linkedin_url': getattr(profile, 'linkedin_url', None),
            'github_url': getattr(profile, 'github_url', None),
            'portfolio_url': getattr(profile, 'portfolio_url', None),
            'website_url': getattr(profile, 'website_url', None),
            'resume_url': getattr(profile, 'resume_url', None),
            'languages': getattr(profile, 'languages', None),
            'certifications': getattr(profile, 'certifications', None)
        }
    else:
        # Create minimal profile data if no profile exists
        user_data['job_seeker_profile'] = {
            'professional_title': None,
            'professional_summary': None,
            'skills': None,
            'soft_skills': None,
            'years_of_experience': 0,
            'education_level': None,
            'career_level': None,
            'languages': None
        }
    
    # Work experiences
    work_experiences = WorkExperience.query.filter_by(user_id=user.id).order_by(
        WorkExperience.is_current.desc(),
        WorkExperience.start_date.desc()
    ).all()
    
    user_data['work_experiences'] = []
    for exp in work_experiences:
        exp_dict = exp.to_dict()
        user_data['work_experiences'].append(exp_dict)
    
    # Education
    educations = Education.query.filter_by(user_id=user.id).order_by(
        Education.graduation_date.desc()
    ).all()
    
    user_data['educations'] = []
    for edu in educations:
        edu_dict = edu.to_dict()
        user_data['educations'].append(edu_dict)
    
    # Certifications
    certifications = Certification.query.filter_by(user_id=user.id).order_by(
        Certification.issue_date.desc()
    ).all()
    
    user_data['certifications'] = []
    for cert in certifications:
        cert_dict = cert.to_dict()
        user_data['certifications'].append(cert_dict)
    
    # Projects
    projects = Project.query.filter_by(user_id=user.id).order_by(
        Project.end_date.desc()
    ).all()
    
    user_data['projects'] = []
    for proj in projects:
        proj_dict = proj.to_dict()
        user_data['projects'].append(proj_dict)
    
    # Awards
    awards = Award.query.filter_by(user_id=user.id).order_by(
        Award.date_received.desc()
    ).all()
    
    user_data['awards'] = []
    for award in awards:
        award_dict = award.to_dict()
        user_data['awards'].append(award_dict)
    
    return user_data
