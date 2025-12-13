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

from src.models.user import db, User
from src.models.profile_extensions import WorkExperience, Education, Certification, Project, Award
from src.services.cv_builder_service import CVBuilderService
from src.utils.db_utils import safe_db_operation

cv_builder_bp = Blueprint('cv_builder', __name__, url_prefix='/api/cv-builder')

# Initialize CV Builder Service
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
                job_data = {
                    'id': job.id,
                    'title': job.title,
                    'company_name': job.company_name,
                    'description': job.description,
                    'requirements': job.requirements,
                    'experience_level': job.experience_level,
                    'category': job.category.name if job.category else None
                }
        elif data.get('job_data'):
            job_data = data['job_data']
            print(f"[CV Builder] Using custom job data: {job_data}")
        
        # Get CV preferences
        cv_style = data.get('style', 'professional')
        sections = data.get('sections', ['work', 'education', 'skills', 'summary', 'projects', 'certifications'])
        
        # Generate CV content using AI
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
        styles = cv_service.get_style_metadata()
        
        return jsonify({
            'success': True,
            'data': styles
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to get styles: {str(e)}'
        }), 500


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
            'desired_salary_min': getattr(profile, 'desired_salary_min', None),
            'desired_salary_max': getattr(profile, 'desired_salary_max', None),
            'salary_currency': getattr(profile, 'salary_currency', 'USD'),
            'preferred_location': getattr(profile, 'preferred_location', None),
            'job_type_preference': getattr(profile, 'job_type_preference', None),
            'availability': getattr(profile, 'availability', None),
            'willing_to_relocate': getattr(profile, 'willing_to_relocate', False),
            'linkedin_url': getattr(profile, 'linkedin_url', None),
            'github_url': getattr(profile, 'github_url', None),
            'portfolio_url': getattr(profile, 'portfolio_url', None),
            'website_url': getattr(profile, 'website_url', None),
            'resume_url': getattr(profile, 'resume_url', None)
        }
    else:
        # Create minimal profile data if no profile exists
        user_data['job_seeker_profile'] = {
            'professional_title': None,
            'professional_summary': None,
            'skills': None,
            'years_of_experience': 0
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
