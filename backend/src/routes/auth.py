from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import jwt
import re
import uuid
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta

from src.models.user import db, User, JobSeekerProfile, EmployerProfile

auth_bp = Blueprint('auth', __name__)

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    return True, "Password is valid"

def token_required(f):
    """Decorator to require valid JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user or not current_user.is_active:
                return jsonify({'error': 'Invalid token'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

def role_required(*allowed_roles):
    """Decorator to require specific user roles"""
    def decorator(f):
        @wraps(f)
        def decorated(current_user, *args, **kwargs):
            if current_user.role not in allowed_roles:
                return jsonify({'error': 'Insufficient permissions'}), 403
            return f(current_user, *args, **kwargs)
        return decorated
    return decorator

@auth_bp.route('/register', methods=['POST'])
def register():
    """Enhanced register endpoint with comprehensive employer support"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'first_name', 'last_name', 'role']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Role-specific validation
        if data['role'] == 'employer':
            employer_required = ['job_title', 'company_name', 'industry', 'company_size', 'company_type']
            for field in employer_required:
                if not data.get(field) or (isinstance(data.get(field), str) and not data.get(field).strip()):
                    return jsonify({'error': f'{field} is required for employers'}), 400
        
        # Validate email format
        if not validate_email(data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 409
        
        # Validate password
        is_valid, message = validate_password(data['password'])
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Validate role
        if data['role'] not in ['job_seeker', 'employer']:
            return jsonify({'error': 'Invalid role. Must be job_seeker or employer'}), 400
        
        # Validate URLs if provided
        url_fields = ['company_website', 'work_email']
        for field in url_fields:
            if data.get(field) and data[field].strip():
                if field == 'work_email':
                    if not validate_email(data[field]):
                        return jsonify({'error': f'Invalid {field} format'}), 400
                elif field == 'company_website':
                    # Basic URL validation
                    if not (data[field].startswith('http://') or data[field].startswith('https://')):
                        return jsonify({'error': f'Invalid {field} format. Must start with http:// or https://'}), 400
        
        # Create new user
        user = User(
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            role=data['role'],
            phone=data.get('phone'),
            location=data.get('location'),
            bio=data.get('bio'),
            profile_picture=data.get('profile_picture')
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.flush()  # Get user ID
        
        # Create role-specific profile
        if data['role'] == 'job_seeker':
            profile = JobSeekerProfile(
                user_id=user.id,
                desired_position=data.get('desired_position'),
                years_of_experience=data.get('years_of_experience', 0),
                education_level=data.get('education_level'),
                skills=data.get('skills')
            )
            db.session.add(profile)
        elif data['role'] == 'employer':
            # Create employer profile
            profile = EmployerProfile(
                user_id=user.id,
                job_title=data['job_title'],
                department=data.get('department'),
                hiring_authority=data.get('hiring_authority', False),
                work_phone=data.get('work_phone'),
                work_email=data.get('work_email')
            )
            db.session.add(profile)
            
            # Create company if provided
            if data.get('company_name'):
                from src.models.company import Company
                
                # Check if company already exists
                existing_company = Company.query.filter_by(name=data['company_name']).first()
                
                if existing_company:
                    # Link employer to existing company
                    profile.company_id = existing_company.id
                else:
                    # Create new company
                    def generate_slug(name):
                        import re
                        slug = re.sub(r'[^\w\s-]', '', name).strip().lower()
                        slug = re.sub(r'[\s_-]+', '-', slug)
                        return slug
                    
                    slug = generate_slug(data['company_name'])
                    counter = 1
                    original_slug = slug
                    while Company.query.filter_by(slug=slug).first():
                        slug = f"{original_slug}-{counter}"
                        counter += 1
                    
                    company = Company(
                        name=data['company_name'],
                        slug=slug,
                        description=data.get('company_description'),
                        website=data.get('company_website'),
                        email=data.get('company_email'),
                        phone=data.get('company_phone'),
                        address_line1=data.get('address_line1'),
                        address_line2=data.get('address_line2'),
                        city=data.get('city'),
                        state=data.get('state'),
                        country=data.get('country'),
                        postal_code=data.get('postal_code'),
                        industry=data.get('industry'),
                        company_size=data.get('company_size'),
                        founded_year=data.get('founded_year'),
                        company_type=data.get('company_type'),
                        is_verified=False,  # New companies need verification
                        is_active=True
                    )
                    
                    db.session.add(company)
                    db.session.flush()  # Get company ID
                    
                    # Link employer profile to new company
                    profile.company_id = company.id
        
        db.session.commit()
        
        # Generate token
        token = user.generate_token()
        
        # Send welcome email
        welcome_email_sent = send_welcome_email(user)
        
        # Prepare response data
        response_data = {
            'message': 'User registered successfully',
            'user': user.to_dict(),
            'token': token,
            'welcome_email_sent': welcome_email_sent
        }
        
        # Add profile data
        if data['role'] == 'job_seeker' and user.job_seeker_profile:
            response_data['profile'] = user.job_seeker_profile.to_dict()
        elif data['role'] == 'employer' and user.employer_profile:
            response_data['profile'] = user.employer_profile.to_dict()
            
            # Add company data if available
            if user.employer_profile.company_id:
                from src.models.company import Company
                company = Company.query.get(user.employer_profile.company_id)
                if company:
                    response_data['company'] = company.to_dict()
        
        return jsonify(response_data), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Registration failed', 'details': str(e)}), 500

@auth_bp.route('/verify-employer', methods=['POST'])
@token_required
@role_required('employer')
def verify_employer(current_user):
    """Submit employer verification documents"""
    try:
        data = request.get_json()
        
        if not current_user.employer_profile:
            return jsonify({'error': 'Employer profile not found'}), 404
        
        # Store verification documents (URLs to uploaded files)
        verification_docs = {
            'business_license': data.get('business_license'),
            'tax_id': data.get('tax_id'),
            'company_registration': data.get('company_registration'),
            'employment_authorization': data.get('employment_authorization'),
            'additional_documents': data.get('additional_documents', [])
        }
        
        import json
        current_user.employer_profile.verification_documents = json.dumps(verification_docs)
        current_user.employer_profile.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Verification documents submitted successfully',
            'status': 'pending_verification'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to submit verification', 'details': str(e)}), 500

@auth_bp.route('/employer/verification-status', methods=['GET'])
@token_required
@role_required('employer')
def get_verification_status(current_user):
    """Get employer verification status"""
    try:
        if not current_user.employer_profile:
            return jsonify({'error': 'Employer profile not found'}), 404
        
        profile = current_user.employer_profile
        
        status_info = {
            'is_verified': profile.is_verified_employer,
            'has_submitted_docs': bool(profile.verification_documents),
            'profile_completion': calculate_employer_profile_completion(current_user),
            'company_linked': bool(profile.company_id),
            'required_actions': get_employer_required_actions(current_user)
        }
        
        return jsonify(status_info), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get verification status', 'details': str(e)}), 500

def calculate_employer_profile_completion(user):
    """Calculate employer profile completion percentage"""
    if not user.employer_profile:
        return 0
    
    profile = user.employer_profile
    total_fields = 8
    completed_fields = 0
    
    # Check user fields
    if user.first_name: completed_fields += 1
    if user.last_name: completed_fields += 1
    if user.email: completed_fields += 1
    if user.phone: completed_fields += 1
    
    # Check employer profile fields
    if profile.job_title: completed_fields += 1
    if profile.work_email: completed_fields += 1
    if profile.company_id: completed_fields += 1
    if profile.verification_documents: completed_fields += 1
    
    return int((completed_fields / total_fields) * 100)

def get_employer_required_actions(user):
    """Get list of actions required to complete employer setup"""
    actions = []
    
    if not user.employer_profile:
        actions.append({'action': 'create_profile', 'description': 'Complete employer profile'})
        return actions
    
    profile = user.employer_profile
    
    if not profile.job_title:
        actions.append({'action': 'add_job_title', 'description': 'Add your job title'})
    
    if not profile.work_email:
        actions.append({'action': 'add_work_email', 'description': 'Add work email address'})
    
    if not profile.company_id:
        actions.append({'action': 'link_company', 'description': 'Link or create company profile'})
    
    if not profile.verification_documents:
        actions.append({'action': 'submit_verification', 'description': 'Submit verification documents'})
    elif not profile.is_verified_employer:
        actions.append({'action': 'await_verification', 'description': 'Verification in progress'})
    
    return actions

@auth_bp.route('/employer/onboarding-guide', methods=['GET'])
@token_required
@role_required('employer')
def get_employer_onboarding_guide(current_user):
    """Get personalized onboarding guide for employers"""
    try:
        completion = calculate_employer_profile_completion(current_user)
        required_actions = get_employer_required_actions(current_user)
        
        # Onboarding steps
        steps = [
            {
                'id': 'profile_setup',
                'title': 'Complete Your Profile',
                'description': 'Add your professional information and contact details',
                'completed': bool(current_user.first_name and current_user.last_name and current_user.employer_profile.job_title),
                'priority': 'high'
            },
            {
                'id': 'company_setup',
                'title': 'Set Up Company Profile',
                'description': 'Create or link your company profile with detailed information',
                'completed': bool(current_user.employer_profile.company_id),
                'priority': 'high'
            },
            {
                'id': 'verification',
                'title': 'Verify Your Account',
                'description': 'Submit verification documents to build trust with candidates',
                'completed': current_user.employer_profile.is_verified_employer,
                'priority': 'medium'
            },
            {
                'id': 'first_job',
                'title': 'Post Your First Job',
                'description': 'Create your first job posting to start attracting candidates',
                'completed': False,  # Would need to check jobs table
                'priority': 'high'
            },
            {
                'id': 'premium_features',
                'title': 'Explore Premium Features',
                'description': 'Unlock advanced recruiting tools and analytics',
                'completed': False,
                'priority': 'low'
            }
        ]
        
        return jsonify({
            'completion_percentage': completion,
            'required_actions': required_actions,
            'onboarding_steps': steps,
            'estimated_completion_time': '15-20 minutes'
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get onboarding guide', 'details': str(e)}), 500

@auth_bp.route('/employer/dashboard-stats', methods=['GET'])
@token_required
@role_required('employer')
def get_employer_dashboard_stats(current_user):
    """Get employer dashboard statistics"""
    try:
        if not current_user.employer_profile:
            return jsonify({'error': 'Employer profile not found'}), 404
        
        # Import here to avoid circular imports
        from src.models.job import Job
        from src.models.application import Application
        
        # Get company info
        company = None
        if current_user.employer_profile.company_id:
            from src.models.company import Company
            company = Company.query.get(current_user.employer_profile.company_id)
        
        # Get job statistics
        jobs_query = Job.query.filter_by(employer_id=current_user.id) if hasattr(Job, 'employer_id') else Job.query.filter_by(user_id=current_user.id)
        total_jobs = jobs_query.count()
        active_jobs = jobs_query.filter_by(is_active=True).count()
        
        # Get application statistics
        total_applications = 0
        pending_applications = 0
        
        if hasattr(Application, 'job_id'):
            # Get all applications for this employer's jobs
            job_ids = [job.id for job in jobs_query.all()]
            if job_ids:
                applications_query = Application.query.filter(Application.job_id.in_(job_ids))
                total_applications = applications_query.count()
                pending_applications = applications_query.filter_by(status='pending').count()
        
        # Profile completion
        profile_completion = calculate_employer_profile_completion(current_user)
        
        stats = {
            'profile': {
                'completion_percentage': profile_completion,
                'is_verified': current_user.employer_profile.is_verified_employer,
                'company_linked': bool(current_user.employer_profile.company_id)
            },
            'jobs': {
                'total': total_jobs,
                'active': active_jobs,
                'draft': 0,  # Would need to implement draft status
                'expired': total_jobs - active_jobs
            },
            'applications': {
                'total': total_applications,
                'pending': pending_applications,
                'reviewed': total_applications - pending_applications,
                'this_month': 0  # Would need date filtering
            },
            'company': company.to_dict() if company else None,
            'required_actions': get_employer_required_actions(current_user),
            'recent_activity': []  # Would implement activity tracking
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get dashboard stats', 'details': str(e)}), 500

@auth_bp.route('/send-welcome-email', methods=['POST'])
@token_required
def send_welcome_email(current_user):
    """Send welcome email to new users"""
    try:
        # In a real application, you would integrate with an email service
        # For now, just return success
        
        email_type = 'employer_welcome' if current_user.role == 'employer' else 'jobseeker_welcome'
        
        # Log the welcome email sending
        welcome_data = {
            'user_id': current_user.id,
            'email': current_user.email,
            'role': current_user.role,
            'email_type': email_type,
            'sent_at': datetime.utcnow().isoformat()
        }
        
        return jsonify({
            'message': 'Welcome email sent successfully',
            'email_type': email_type,
            'sent_to': current_user.email
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to send welcome email', 'details': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return JWT token"""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user by email
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 401
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Generate token
        token = user.generate_token()
        
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict(),
            'token': token
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Login failed', 'details': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user):
    """Logout user (client should discard token)"""
    return jsonify({'message': 'Logout successful'}), 200

@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    """Get current user profile"""
    try:
        profile_data = current_user.to_dict(include_sensitive=True)
        
        # Add role-specific profile data
        if current_user.role == 'job_seeker' and current_user.job_seeker_profile:
            profile_data['job_seeker_profile'] = current_user.job_seeker_profile.to_dict()
        elif current_user.role == 'employer' and current_user.employer_profile:
            employer_profile_data = current_user.employer_profile.to_dict()
            # Add company information if available
            if current_user.employer_profile.company_id:
                from src.models.company import Company
                company = Company.query.get(current_user.employer_profile.company_id)
                if company:
                    employer_profile_data['company_name'] = company.name
                    employer_profile_data['company_website'] = company.website
                    employer_profile_data['company_logo'] = company.logo_url
            profile_data['employer_profile'] = employer_profile_data
        
        return jsonify(profile_data), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get profile', 'details': str(e)}), 500

@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    """Update current user profile"""
    try:
        data = request.get_json()
        
        # Update basic user information
        if 'first_name' in data:
            current_user.first_name = data['first_name']
        if 'last_name' in data:
            current_user.last_name = data['last_name']
        if 'phone' in data:
            current_user.phone = data['phone']
        if 'location' in data:
            current_user.location = data['location']
        if 'bio' in data:
            current_user.bio = data['bio']
        if 'profile_picture' in data:
            current_user.profile_picture = data['profile_picture']
        
        # Update role-specific profile
        if current_user.role == 'job_seeker':
            profile = current_user.job_seeker_profile
            if not profile:
                profile = JobSeekerProfile(user_id=current_user.id)
                db.session.add(profile)
            
            # Update job seeker specific fields
            profile_fields = [
                'resume_url', 'portfolio_url', 'linkedin_url', 'github_url',
                'desired_position', 'desired_salary_min', 'desired_salary_max',
                'preferred_location', 'job_type_preference', 'availability',
                'years_of_experience', 'skills', 'education_level', 'certifications',
                'profile_visibility', 'open_to_opportunities'
            ]
            for field in profile_fields:
                if field in data:
                    setattr(profile, field, data[field])
        
        elif current_user.role == 'employer':
            profile = current_user.employer_profile
            if not profile:
                profile = EmployerProfile(user_id=current_user.id)
                db.session.add(profile)
            
            # Update employer specific fields
            profile_fields = [
                'company_id', 'job_title', 'department', 'hiring_authority',
                'work_phone', 'work_email'
            ]
            for field in profile_fields:
                if field in data:
                    setattr(profile, field, data[field])
        
        current_user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': current_user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update profile', 'details': str(e)}), 500

@auth_bp.route('/change-password', methods=['POST'])
@token_required
def change_password(current_user):
    """Change user password"""
    try:
        data = request.get_json()
        
        if not data.get('current_password') or not data.get('new_password'):
            return jsonify({'error': 'Current password and new password are required'}), 400
        
        # Verify current password
        if not current_user.check_password(data['current_password']):
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        # Validate new password
        is_valid, message = validate_password(data['new_password'])
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Update password
        current_user.set_password(data['new_password'])
        current_user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to change password', 'details': str(e)}), 500

@auth_bp.route('/send-verification-email', methods=['POST'])
@token_required
def send_verification_email(current_user):
    """Send email verification"""
    try:
        if current_user.is_verified:
            return jsonify({'error': 'Email is already verified'}), 400
        
        # In a real application, you would send an actual email here
        # For now, we'll just return a success message
        return jsonify({'message': 'Verification email sent successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to send verification email', 'details': str(e)}), 500

@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    """Verify email with token"""
    try:
        data = request.get_json()
        token = data.get('token')
        
        if not token:
            return jsonify({'error': 'Verification token is required'}), 400
        
        # In a real application, you would verify the token and mark email as verified
        # For now, we'll just return a success message
        return jsonify({'message': 'Email verified successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to verify email', 'details': str(e)}), 500

@auth_bp.route('/verify-token', methods=['POST'])
def verify_token():
    """Verify if a token is valid"""
    try:
        data = request.get_json()
        token = data.get('token')
        
        if not token:
            return jsonify({'valid': False, 'error': 'Token is required'}), 400
        
        user = User.verify_token(token)
        if user and user.is_active:
            return jsonify({
                'valid': True,
                'user': user.to_dict()
            }), 200
        else:
            return jsonify({'valid': False, 'error': 'Invalid or expired token'}), 401
            
    except Exception as e:
        return jsonify({'valid': False, 'error': str(e)}), 500

@auth_bp.route('/refresh-token', methods=['POST'])
@token_required
def refresh_token(current_user):
    """Refresh JWT token"""
    try:
        new_token = current_user.generate_token()
        return jsonify({
            'message': 'Token refreshed successfully',
            'token': new_token
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to refresh token', 'details': str(e)}), 500

@auth_bp.route('/deactivate-account', methods=['POST'])
@token_required
def deactivate_account(current_user):
    """Deactivate user account"""
    try:
        data = request.get_json()
        
        # Verify password for security
        if not data.get('password'):
            return jsonify({'error': 'Password is required to deactivate account'}), 400
        
        if not current_user.check_password(data['password']):
            return jsonify({'error': 'Incorrect password'}), 401
        
        # Deactivate account
        current_user.is_active = False
        current_user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Account deactivated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to deactivate account', 'details': str(e)}), 500

def send_welcome_email(user):
    """Send welcome email to new users"""
    try:
        # Get email configuration from environment variables
        smtp_server = os.getenv('SMTP_SERVER', 'smtp.mail.yahoo.com')
        smtp_port = int(os.getenv('SMTP_PORT', '587'))
        sender_email = os.getenv('SENDER_EMAIL', 'afritechbridge@yahoo.com')
        sender_password = os.getenv('SENDER_PASSWORD')
        sender_name = os.getenv('SENDER_NAME', 'TalentSphere Team')
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        
        # Check if email configuration is complete
        if not sender_password:
            print("⚠️  EMAIL CONFIG MISSING: SENDER_PASSWORD not set in environment variables")
            print(f"📧 Would send welcome email to: {user.email}")
            return False  # Return False if email can't be sent
        
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = f"Welcome to TalentSphere, {user.first_name}!"
        message["From"] = f"{sender_name} <{sender_email}>"
        message["To"] = user.email
        
        # Determine welcome message based on user role
        if user.role == 'employer':
            role_specific_content = """
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1e40af; margin-top: 0;">🏢 Employer Features</h3>
                <ul style="color: #374151; line-height: 1.6;">
                    <li>Post unlimited job listings</li>
                    <li>Access to our talent pool of qualified candidates</li>
                    <li>Advanced applicant tracking system</li>
                    <li>Company profile and branding tools</li>
                    <li>Analytics and reporting dashboard</li>
                </ul>
            </div>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{}/dashboard" 
                   style="background-color: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                    Post Your First Job
                </a>
            </div>
            """.format(frontend_url)
        else:
            role_specific_content = """
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #15803d; margin-top: 0;">🎯 Job Seeker Features</h3>
                <ul style="color: #374151; line-height: 1.6;">
                    <li>Browse thousands of job opportunities</li>
                    <li>Create a professional profile</li>
                    <li>Get matched with relevant positions</li>
                    <li>Track your applications</li>
                    <li>Receive job alerts and notifications</li>
                </ul>
            </div>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{}/jobs" 
                   style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                    Explore Jobs
                </a>
            </div>
            """.format(frontend_url)
        
        # HTML email template
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to TalentSphere</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0; font-size: 32px;">🚀 TalentSphere</h1>
                    <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 18px;">Your Journey Starts Here!</p>
                </div>
                
                <div style="margin-bottom: 30px;">
                    <h2 style="color: #374151; margin-bottom: 20px;">Hello {user.first_name}! 👋</h2>
                    <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px; font-size: 16px;">
                        Welcome to TalentSphere! We're thrilled to have you join our community of talented professionals and forward-thinking employers.
                    </p>
                    <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px; font-size: 16px;">
                        Your account has been successfully created as a <strong style="color: #2563eb;">{user.role.replace('_', ' ').title()}</strong>. 
                        You're now ready to explore all the amazing features we have to offer!
                    </p>
                </div>
                
                {role_specific_content}
                
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 30px 0;">
                    <h3 style="color: #374151; margin-top: 0;">🎁 What's Next?</h3>
                    <div style="color: #6b7280; line-height: 1.6;">
                        <p style="margin-bottom: 10px;">✅ Complete your profile to get better matches</p>
                        <p style="margin-bottom: 10px;">✅ Upload a professional photo</p>
                        <p style="margin-bottom: 10px;">✅ Set up your preferences and notifications</p>
                        <p style="margin-bottom: 0;">✅ Start connecting with the right opportunities!</p>
                    </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{frontend_url}/dashboard" 
                       style="background-color: #8b5cf6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px; margin-right: 10px;">
                        Go to Dashboard
                    </a>
                    <a href="{frontend_url}/profile" 
                       style="background-color: #64748b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                        Complete Profile
                    </a>
                </div>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 14px; margin-bottom: 10px;">
                        Need help getting started? Check out our resources:
                    </p>
                    <div style="text-align: center;">
                        <a href="{frontend_url}/help" style="color: #2563eb; text-decoration: none; margin: 0 10px; font-size: 14px;">Help Center</a>
                        <a href="{frontend_url}/contact" style="color: #2563eb; text-decoration: none; margin: 0 10px; font-size: 14px;">Contact Support</a>
                        <a href="{frontend_url}/about" style="color: #2563eb; text-decoration: none; margin: 0 10px; font-size: 14px;">About Us</a>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        © 2024 TalentSphere. All rights reserved. | Made with ❤️ for connecting talent with opportunity
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Create HTML part
        html_part = MIMEText(html, "html")
        message.attach(html_part)
        
        # Send email using SMTP
        print(f"📧 Sending welcome email to: {user.email}")
        
        try:
            # Connect to SMTP server
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()  # Enable TLS encryption
            server.login(sender_email, sender_password)
            
            # Send email
            server.sendmail(sender_email, user.email, message.as_string())
            server.quit()
            
            print(f"✅ Welcome email sent successfully to {user.email}")
            return True
            
        except smtplib.SMTPAuthenticationError:
            print(f"❌ SMTP Authentication failed. Check email credentials for {sender_email}")
            print("💡 For Yahoo Mail, make sure to use an App Password, not your regular password")
            return False
        except smtplib.SMTPException as e:
            print(f"❌ SMTP error: {str(e)}")
            return False
        except Exception as e:
            print(f"❌ Error sending email: {str(e)}")
            return False
        
    except Exception as e:
        print(f"Error sending welcome email: {str(e)}")
        return False

def send_reset_email(user_email, reset_token, user_name):
    """Send password reset email using environment configuration"""
    try:
        # Get email configuration from environment variables
        smtp_server = os.getenv('SMTP_SERVER', 'smtp.mail.yahoo.com')
        smtp_port = int(os.getenv('SMTP_PORT', '587'))
        sender_email = os.getenv('SENDER_EMAIL', 'afritechbridge@yahoo.com')
        sender_password = os.getenv('SENDER_PASSWORD')
        sender_name = os.getenv('SENDER_NAME', 'AfriTech Bridge')
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        
        # Check if email configuration is complete
        if not sender_password:
            print("⚠️  EMAIL CONFIG MISSING: SENDER_PASSWORD not set in environment variables")
            print(f"📧 Would send password reset email to: {user_email}")
            print(f"🔗 Reset link would be: {frontend_url}/reset-password?token={reset_token}")
            return True  # Return True for development, but log the issue
        
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = "Reset Your TalentSphere Password"
        message["From"] = f"{sender_name} <{sender_email}>"
        message["To"] = user_email
        
        # Reset URL using environment variable
        reset_url = f"{frontend_url}/reset-password?token={reset_token}"
        
        # HTML email template
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0; font-size: 28px;">TalentSphere</h1>
                    <p style="color: #6b7280; margin: 5px 0 0 0;">Password Reset Request</p>
                </div>
                
                <div style="margin-bottom: 30px;">
                    <h2 style="color: #374151; margin-bottom: 20px;">Hello {user_name},</h2>
                    <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
                        We received a request to reset your password for your TalentSphere account. If you didn't make this request, you can safely ignore this email.
                    </p>
                    <p style="color: #6b7280; line-height: 1.6; margin-bottom: 30px;">
                        To reset your password, click the button below. This link will expire in 1 hour for security reasons.
                    </p>
                </div>
                
                <div style="text-align: center; margin: 40px 0;">
                    <a href="{reset_url}" 
                       style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                        Reset My Password
                    </a>
                </div>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 14px; margin-bottom: 10px;">
                        If the button above doesn't work, copy and paste this link into your browser:
                    </p>
                    <p style="color: #2563eb; word-break: break-all; font-size: 14px; margin-bottom: 20px;">
                        {reset_url}
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        This link will expire in 1 hour. If you need help, contact our support team.
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        © 2024 TalentSphere. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Create HTML part
        html_part = MIMEText(html, "html")
        message.attach(html_part)
        
        # Send email using SMTP
        print(f"📧 Sending password reset email to: {user_email}")
        print(f"🔗 Reset URL: {reset_url}")
        
        try:
            # Connect to SMTP server
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()  # Enable TLS encryption
            server.login(sender_email, sender_password)
            
            # Send email
            server.sendmail(sender_email, user_email, message.as_string())
            server.quit()
            
            print(f"✅ Password reset email sent successfully to {user_email}")
            return True
            
        except smtplib.SMTPAuthenticationError:
            print(f"❌ SMTP Authentication failed. Check email credentials for {sender_email}")
            print("💡 For Yahoo Mail, make sure to use an App Password, not your regular password")
            return False
        except smtplib.SMTPException as e:
            print(f"❌ SMTP error: {str(e)}")
            return False
        except Exception as e:
            print(f"❌ Error sending email: {str(e)}")
            return False
        
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Request password reset"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        email = data.get('email', '').strip().lower()
        
        # Validate email
        if not email:
            return jsonify({'error': 'Email is required'}), 400
            
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Find user by email
        user = User.query.filter_by(email=email, is_active=True).first()
        
        # Always return success to prevent email enumeration attacks
        if user:
            # Generate reset token
            reset_token = user.generate_reset_token()
            
            # Save to database
            db.session.commit()
            
            # Send reset email
            if send_reset_email(user.email, reset_token, user.get_full_name()):
                return jsonify({
                    'success': True,
                    'message': 'If an account with this email exists, a password reset link has been sent.'
                }), 200
            else:
                return jsonify({
                    'error': 'Failed to send reset email. Please try again later.'
                }), 500
        else:
            # Still return success to prevent email enumeration
            return jsonify({
                'success': True,
                'message': 'If an account with this email exists, a password reset link has been sent.'
            }), 200
            
    except Exception as e:
        print(f"Forgot password error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password with token"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        token = data.get('token', '').strip()
        new_password = data.get('password', '').strip()
        confirm_password = data.get('confirm_password', '').strip()
        
        # Validate input
        if not token:
            return jsonify({'error': 'Reset token is required'}), 400
            
        if not new_password:
            return jsonify({'error': 'New password is required'}), 400
            
        if new_password != confirm_password:
            return jsonify({'error': 'Passwords do not match'}), 400
        
        # Validate password strength
        is_valid, message = validate_password(new_password)
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Find user with valid reset token
        user = User.query.filter_by(reset_token=token, is_active=True).first()
        
        if not user:
            return jsonify({'error': 'Invalid or expired reset token'}), 400
        
        # Verify token is not expired
        if not user.verify_reset_token(token):
            return jsonify({'error': 'Reset token has expired'}), 400
        
        # Update password
        user.set_password(new_password)
        user.clear_reset_token()
        user.updated_at = datetime.utcnow()
        
        # Save changes
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Password has been successfully reset. You can now log in with your new password.'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Reset password error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/verify-reset-token', methods=['POST'])
def verify_reset_token():
    """Verify if reset token is valid"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        token = data.get('token', '').strip()
        
        if not token:
            return jsonify({'error': 'Reset token is required'}), 400
        
        # Find user with token
        user = User.query.filter_by(reset_token=token, is_active=True).first()
        
        if not user or not user.verify_reset_token(token):
            return jsonify({
                'valid': False,
                'message': 'Invalid or expired reset token'
            }), 200
        
        return jsonify({
            'valid': True,
            'message': 'Reset token is valid',
            'email': user.email,
            'name': user.get_full_name()
        }), 200
        
    except Exception as e:
        print(f"Verify reset token error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# Error handlers
@auth_bp.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400

@auth_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({'error': 'Unauthorized'}), 401

@auth_bp.errorhandler(403)
def forbidden(error):
    return jsonify({'error': 'Forbidden'}), 403

@auth_bp.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@auth_bp.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

