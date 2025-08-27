from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import jwt
import re
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
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'first_name', 'last_name', 'role']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
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
        
        # Create new user
        user = User(
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            role=data['role'],
            phone=data.get('phone'),
            location=data.get('location'),
            bio=data.get('bio')
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
                education_level=data.get('education_level')
            )
            db.session.add(profile)
        elif data['role'] == 'employer':
            profile = EmployerProfile(
                user_id=user.id,
                job_title=data.get('job_title'),
                department=data.get('department')
            )
            db.session.add(profile)
        
        db.session.commit()
        
        # Generate token
        token = user.generate_token()
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict(),
            'token': token
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Registration failed', 'details': str(e)}), 500

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

