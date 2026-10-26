from flask import Blueprint, request, jsonify, current_app, redirect
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
import threading
import time

from src.models.user import db, User, JobSeekerProfile, EmployerProfile
from src.utils.db_utils import db_transaction, safe_db_operation
from src.services.notification_templates import EnhancedNotificationService
from src.services.email_service import email_service

auth_bp = Blueprint('auth', __name__)

# Employer endpoints that must remain accessible before onboarding is complete.
EMPLOYER_ONBOARDING_ALLOWED_EXACT_PATHS = {
    '/api/auth/profile',
    '/api/auth/verify-employer',
    '/api/auth/employer/verification-status',
    '/api/auth/employer/onboarding-status',
    '/api/auth/employer/onboarding-guide',
    '/api/my-company',
    '/api/companies'
}

EMPLOYER_ONBOARDING_ALLOWED_PATH_PREFIXES = [
    '/api/my-company/settings',
    '/api/companies/'
]


def is_employer_onboarding_allowed_path(request_path):
    """Allow only onboarding and company-setup related endpoints before verification."""
    if request_path in EMPLOYER_ONBOARDING_ALLOWED_EXACT_PATHS:
        return True

    return any(request_path.startswith(prefix) for prefix in EMPLOYER_ONBOARDING_ALLOWED_PATH_PREFIXES)

# Notification services
enhanced_notification_service = EnhancedNotificationService(email_service)

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

def _authorization_token():
    """Return the bearer token from the request without logging its value."""
    auth_header = request.headers.get('Authorization', '').strip()
    if not auth_header:
        return None, 'Token is missing'

    parts = auth_header.split()
    if len(parts) == 2 and parts[0].lower() == 'bearer' and parts[1].strip():
        return parts[1].strip(), None

    # Keep accepting the legacy raw-token format for existing API clients, but
    # reject malformed multi-part headers instead of guessing which part is a
    # credential.
    if len(parts) == 1 and parts[0]:
        return parts[0], None

    return None, 'Invalid token format'

def _decode_access_token(token, verify_expiration=True):
    """Decode one of TalentSphere's PyJWT access tokens."""
    options = {'require': ['user_id', 'exp']}
    if not verify_expiration:
        options['verify_exp'] = False

    return jwt.decode(
        token,
        current_app.config['SECRET_KEY'],
        algorithms=['HS256'],
        options=options,
        leeway=current_app.config.get('JWT_CLOCK_SKEW_SECONDS', 5),
    )

# ---------------------------------------------------------------------------
# Identity cache for high-frequency read-only endpoints
# ---------------------------------------------------------------------------
# Resolving id -> (role, is_active) costs one database round trip. On a remote
# database that is a large slice of a polling request's budget even though
# role/active state change rarely, so a short per-process cache removes the
# query entirely. Handing the endpoint a narrow stand-in (instead of a User
# row) guarantees a route can never silently observe None for a column that
# was never loaded: anything but id/role/is_active raises AttributeError.
IDENTITY_CACHED_ENDPOINTS = frozenset({
    'career_agent.generate_package',
    'career_agent.get_generation',
    'career_agent.list_generations',
    'enhanced_notification.get_notifications',
    'enhanced_notification.get_notification_stats',
})

IDENTITY_CACHE_TTL = float(os.getenv('AUTH_IDENTITY_CACHE_TTL', '30'))

_identity_lock = threading.Lock()
_identity_cache = {}


class IdentityUser:
    """Read-only stand-in exposing only id, role and is_active."""

    __slots__ = ('id', 'role', 'is_active')

    def __init__(self, user_id, role, is_active):
        self.id = user_id
        self.role = role
        self.is_active = is_active

    def __repr__(self):
        return f'<IdentityUser id={self.id} role={self.role}>'


def _identity_get(user_id):
    if user_id is None:
        return None
    with _identity_lock:
        entry = _identity_cache.get(user_id)
    if not entry:
        return None
    expires_at, role, is_active = entry
    if time.time() >= expires_at:
        invalidate_identity_cache(user_id)
        return None
    return IdentityUser(user_id, role, is_active)


def _identity_put(user_id, role, is_active):
    if user_id is None:
        return
    with _identity_lock:
        if len(_identity_cache) > 4096:
            _identity_cache.clear()
        _identity_cache[user_id] = (time.time() + IDENTITY_CACHE_TTL, role, is_active)


def invalidate_identity_cache(user_id=None):
    """Drop cached identity rows. Call after a role or account-status change."""
    with _identity_lock:
        if user_id is None:
            _identity_cache.clear()
        else:
            _identity_cache.pop(user_id, None)


def token_required(f):
    """Decorator to require valid JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        # Allow CORS preflight requests to pass through without authentication
        if request.method == 'OPTIONS':
            return current_app.make_default_options_response()

        token, token_error = _authorization_token()
        if not token:
            return jsonify({
                'error': token_error,
                'message': 'Authorization header must be "Bearer <token>"'
            }), 401
        
        try:
            # Decode and validate token
            data = _decode_access_token(token)
            
            # High-frequency, read-only endpoints only need identity, role and
            # active state. They resolve those from a short-lived cache so a
            # polling request does not pay a users SELECT on every call; all
            # other endpoints still hydrate the full user row.
            user_id = data.get('user_id')
            if request.endpoint in IDENTITY_CACHED_ENDPOINTS:
                current_user = _identity_get(user_id)
                if current_user is None:
                    row = (
                        db.session.query(User.id, User.role, User.is_active)
                        .filter(User.id == user_id)
                        .first()
                    )
                    if row is not None:
                        _identity_put(row.id, row.role, row.is_active)
                        current_user = IdentityUser(row.id, row.role, row.is_active)
            else:
                current_user = db.session.get(User, user_id)

            if not current_user:
                current_app.logger.warning(f"User not found for token user_id: {data.get('user_id')}")
                return jsonify({
                    'error': 'Invalid token',
                    'message': 'User not found'
                }), 401
                
            if not current_user.is_active:
                current_app.logger.warning(f"Inactive user attempted access: user_id={current_user.id}")
                return jsonify({
                    'error': 'Account inactive',
                    'message': 'Your account has been deactivated'
                }), 401
                
        except jwt.ExpiredSignatureError:
            current_app.logger.info("Token expired")
            return jsonify({
                'error': 'Token has expired',
                'message': 'Please login again'
            }), 401
        except jwt.InvalidTokenError as e:
            current_app.logger.warning(f"Invalid token: {str(e)}")
            return jsonify({
                'error': 'Invalid token',
                'message': 'Token validation failed'
            }), 401
        except Exception as e:
            current_app.logger.error(f"Unexpected error in token validation: {str(e)}")
            return jsonify({
                'error': 'Authentication error',
                'message': 'An error occurred during authentication'
            }), 500
        
        return f(current_user, *args, **kwargs)
    return decorated

def optional_token(f):
    """Attach the current user when a valid token is present, otherwise None."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == 'OPTIONS':
            return current_app.make_default_options_response()
        current_user = None
        token, _ = _authorization_token()
        if token:
            try:
                payload = _decode_access_token(token)
                current_user = db.session.get(User, payload.get('user_id'))
                if current_user and not current_user.is_active:
                    current_user = None
            except (jwt.InvalidTokenError, KeyError, TypeError, ValueError):
                current_user = None
        return f(current_user, *args, **kwargs)
    return decorated

def role_required(*allowed_roles):
    """Decorator to require specific user roles"""
    def decorator(f):
        @wraps(f)
        def decorated(current_user, *args, **kwargs):
            if current_user.role not in allowed_roles:
                return jsonify({'error': 'Insufficient permissions'}), 403

            # Enforce employer onboarding/verification before accessing restricted features.
            if current_user.role == 'employer':
                request_path = request.path or ''
                is_allowed_during_onboarding = is_employer_onboarding_allowed_path(request_path)

                if not is_allowed_during_onboarding:
                    onboarding_status = build_employer_onboarding_status(current_user)
                    if not onboarding_status.get('onboarding_complete', False):
                        return jsonify({
                            'error': 'Complete company onboarding and verification before using this feature',
                            'code': 'EMPLOYER_ONBOARDING_REQUIRED',
                            'onboarding_status': onboarding_status
                        }), 403

            return f(current_user, *args, **kwargs)
        return decorated
    return decorator


def _company_profile_missing_fields(company):
    """Return missing required company profile fields for onboarding."""
    if not company:
        return ['name', 'industry', 'company_size', 'company_type', 'description', 'website', 'country', 'city']

    required_fields = {
        'name': company.name,
        'industry': company.industry,
        'company_size': company.company_size,
        'company_type': company.company_type,
        'description': company.description,
        'website': company.website,
        'country': company.country,
        'city': company.city
    }

    missing = []
    for field_name, field_value in required_fields.items():
        if field_value is None:
            missing.append(field_name)
            continue

        if isinstance(field_value, str) and not field_value.strip():
            missing.append(field_name)

    return missing


def _company_profile_completion(company):
    """Calculate company profile completion using the same fields as Company Profile Management UI."""
    if not company:
        return 0

    profile_fields = [
        'name',
        'description',
        'tagline',
        'website',
        'email',
        'phone',
        'city',
        'state',
        'country',
        'industry',
        'company_size',
        'founded_year',
        'company_type',
        'logo_url'
    ]

    completed_count = 0
    for field_name in profile_fields:
        field_value = getattr(company, field_name, None)
        if field_value is None:
            continue

        if isinstance(field_value, str):
            if field_value.strip():
                completed_count += 1
        else:
            completed_count += 1

    return int((completed_count / len(profile_fields)) * 100)


def build_employer_onboarding_status(user):
    """Build normalized onboarding/verification status for employer access control."""
    status = {
        'has_employer_profile': False,
        'company_linked': False,
        'company_profile_complete': False,
        'company_profile_completion': 0,
        'company_verified': False,
        'employer_verified': False,
        'profile_completion': 0,
        'missing_company_fields': [],
        'required_actions': [],
        'onboarding_complete': False,
        'verification_state': 'not_started'
    }

    if not user or user.role != 'employer' or not user.employer_profile:
        status['required_actions'] = [
            {'action': 'create_profile', 'description': 'Complete employer profile'}
        ]
        return status

    profile = user.employer_profile
    status['has_employer_profile'] = True
    status['employer_verified'] = bool(profile.is_verified_employer)
    status['profile_completion'] = calculate_employer_profile_completion(user)
    status['required_actions'] = get_employer_required_actions(user)

    company = None
    if profile.company_id:
        from src.models.company import Company
        company = Company.query.get(profile.company_id)

    status['company_linked'] = bool(company)
    if company:
        missing_company_fields = _company_profile_missing_fields(company)
        status['missing_company_fields'] = missing_company_fields
        status['company_profile_completion'] = _company_profile_completion(company)
        status['company_profile_complete'] = len(missing_company_fields) == 0
        status['company_verified'] = bool(company.is_verified)

    # Access threshold: once company profile reaches at least 50%, employer can use normal features.
    minimum_profile_threshold_met = (
        status['company_linked'] and status['company_profile_completion'] >= 50
    )

    status['onboarding_complete'] = (
        status['has_employer_profile'] and minimum_profile_threshold_met
    )

    if not status['company_linked']:
        status['verification_state'] = 'company_required'
    elif status['company_profile_completion'] < 50:
        status['verification_state'] = 'profile_incomplete'
    elif not status['company_verified']:
        status['verification_state'] = 'minimum_profile_complete_pending_verification'
    else:
        status['verification_state'] = 'verified'

    return status

@auth_bp.route('/register', methods=['POST'])
def register():
    """Enhanced register endpoint with comprehensive employer support"""
    try:
        data = request.get_json()
        
        current_app.logger.info(f"Registration attempt for email: {data.get('email')}")
        
        # Validate required fields
        required_fields = ['email', 'password', 'first_name', 'last_name', 'role']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Role-specific validation
        if data['role'] == 'employer':
            # Employers can complete company setup during onboarding after account creation.
            employer_required = ['job_title']
            for field in employer_required:
                if not data.get(field) or (isinstance(data.get(field), str) and not data.get(field).strip()):
                    return jsonify({'error': f'{field} is required for employers'}), 400
        
        # Validate email format
        if not validate_email(data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            current_app.logger.warning(f"Registration failed: Email already exists - {data.get('email')}")
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
        current_app.logger.info(f"User account created successfully for: {user.email}")
        
        # Generate token
        token = user.generate_token()
        current_app.logger.info(f"Token generated successfully for: {user.email}")
        
        # Send welcome notification/email (don't fail registration if these fail)
        welcome_email_sent = False
        welcome_notification_sent = False
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        try:
            welcome_notification_sent = enhanced_notification_service.send_welcome_email(
                user.id,
                frontend_url=frontend_url
            )
            welcome_email_sent = welcome_notification_sent
            if welcome_notification_sent:
                current_app.logger.info(f"Enhanced welcome notification sent to: {user.email}")
        except Exception as notification_error:
            current_app.logger.error(
                f"Enhanced welcome notification failed for {user.email}: {str(notification_error)}"
            )
        
        # Fallback to basic SMTP email if enhanced notification failed
        if not welcome_email_sent:
            try:
                welcome_email_sent = send_basic_welcome_email(user)
                if welcome_email_sent:
                    current_app.logger.info(f"Fallback welcome email sent to: {user.email}")
                else:
                    current_app.logger.warning(f"Fallback welcome email could not be sent to: {user.email}")
            except Exception as email_error:
                current_app.logger.error(f"Error sending fallback welcome email to {user.email}: {str(email_error)}")
        
        # Prepare response data
        response_data = {
            'message': 'User registered successfully',
            'user': user.to_dict(),
            'token': token,
            'welcome_email_sent': welcome_email_sent,
            'welcome_notification_sent': welcome_notification_sent
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
        
        current_app.logger.info(f"Registration completed successfully for: {user.email}")
        return jsonify(response_data), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Registration error: {str(e)}")
        import traceback
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
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
        onboarding_status = build_employer_onboarding_status(current_user)

        status_info = {
            'is_verified': profile.is_verified_employer,
            'has_submitted_docs': bool(profile.verification_documents),
            'profile_completion': onboarding_status.get('profile_completion', 0),
            'company_profile_completion': onboarding_status.get('company_profile_completion', 0),
            'company_linked': onboarding_status.get('company_linked', False),
            'company_profile_complete': onboarding_status.get('company_profile_complete', False),
            'company_verified': onboarding_status.get('company_verified', False),
            'onboarding_complete': onboarding_status.get('onboarding_complete', False),
            'verification_state': onboarding_status.get('verification_state', 'not_started'),
            'missing_company_fields': onboarding_status.get('missing_company_fields', []),
            'required_actions': onboarding_status.get('required_actions', [])
        }

        return jsonify(status_info), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get verification status', 'details': str(e)}), 500


@auth_bp.route('/employer/onboarding-status', methods=['GET'])
@token_required
@role_required('employer')
def get_employer_onboarding_status(current_user):
    """Get normalized employer onboarding status used by route and API guards."""
    try:
        return jsonify(build_employer_onboarding_status(current_user)), 200
    except Exception as e:
        return jsonify({'error': 'Failed to get onboarding status', 'details': str(e)}), 500

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
        actions.append({'action': 'link_company', 'description': 'Create and link your company profile'})
        return actions

    from src.models.company import Company
    company = Company.query.get(profile.company_id)

    if not company:
        actions.append({'action': 'link_company', 'description': 'Link a valid company profile'})
        return actions

    missing_company_fields = _company_profile_missing_fields(company)
    if missing_company_fields:
        actions.append({
            'action': 'complete_company_profile',
            'description': f"Complete company profile fields: {', '.join(missing_company_fields)}"
        })

    if not company.is_verified:
        actions.append({'action': 'await_company_verification', 'description': 'Company verification is pending admin approval'})

    if not profile.verification_documents:
        actions.append({'action': 'submit_verification_docs', 'description': 'Submit employer verification documents'})
    
    return actions

@auth_bp.route('/employer/onboarding-guide', methods=['GET'])
@token_required
@role_required('employer')
def get_employer_onboarding_guide(current_user):
    """Get personalized onboarding guide for employers"""
    try:
        onboarding_status = build_employer_onboarding_status(current_user)
        completion = onboarding_status.get('company_profile_completion', 0)
        required_actions = onboarding_status.get('required_actions', [])
        
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
                'completed': bool(onboarding_status.get('company_profile_complete')),
                'priority': 'high'
            },
            {
                'id': 'verification',
                'title': 'Verify Your Account',
                'description': 'Submit verification documents to build trust with candidates',
                'completed': bool(onboarding_status.get('company_verified')),
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
        jobs_query = Job.query.filter_by(posted_by=current_user.id)
        total_jobs = jobs_query.count()
        active_jobs = jobs_query.filter_by(is_active=True).count()
        draft_jobs = jobs_query.filter_by(status='draft').count()
        expired_jobs = jobs_query.filter(
            Job.expires_at.isnot(None),
            Job.expires_at < datetime.utcnow()
        ).count()
        
        # Get application statistics
        total_applications = 0
        awaiting_review = 0
        reviewed_applications = 0
        applications_this_month = 0
        recent_activity = []
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        if hasattr(Application, 'job_id'):
            # Get all applications for this employer's jobs
            job_ids = [job.id for job in jobs_query.all()]
            if job_ids:
                applications_query = Application.query.filter(Application.job_id.in_(job_ids))
                total_applications = applications_query.count()
                awaiting_review = applications_query.filter(
                    Application.reviewed_at.is_(None)
                ).count()
                reviewed_applications = applications_query.filter(
                    Application.reviewed_at.isnot(None)
                ).count()
                applications_this_month = applications_query.filter(
                    Application.created_at >= month_start
                ).count()

                from src.models.application import ApplicationActivity
                activities = (
                    db.session.query(ApplicationActivity)
                    .join(Application, ApplicationActivity.application_id == Application.id)
                    .filter(Application.job_id.in_(job_ids))
                    .order_by(ApplicationActivity.created_at.desc())
                    .limit(10)
                    .all()
                )
                recent_activity = [
                    {
                        'type': activity.activity_type,
                        'description': activity.description,
                        'application_id': activity.application_id,
                        'timestamp': activity.created_at.isoformat()
                    }
                    for activity in activities
                ]
        
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
                'draft': draft_jobs,
                'expired': expired_jobs
            },
            'applications': {
                'total': total_applications,
                'pending': awaiting_review,
                'awaiting_review': awaiting_review,
                'reviewed': reviewed_applications,
                'this_month': applications_this_month
            },
            'company': company.to_dict() if company else None,
            'required_actions': get_employer_required_actions(current_user),
            'recent_activity': recent_activity
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get dashboard stats', 'details': str(e)}), 500

@auth_bp.route('/send-welcome-email', methods=['POST'])
@token_required
def send_welcome_email(current_user):
    """Send welcome email to new users"""
    try:
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        email_type = 'employer_welcome' if current_user.role == 'employer' else 'jobseeker_welcome'

        enhanced_sent = enhanced_notification_service.send_welcome_email(
            current_user.id,
            frontend_url=frontend_url
        )

        fallback_sent = False
        if not enhanced_sent:
            fallback_sent = send_basic_welcome_email(current_user)

        sent = enhanced_sent or fallback_sent
        status_message = 'Welcome email sent successfully' if sent else 'Welcome email queued but delivery failed'
        status_code = 200 if sent else 207  # 207 Multi-Status to indicate partial success
        
        return jsonify({
            'message': status_message,
            'email_type': email_type,
            'sent_to': current_user.email,
            'delivery': {
                'enhanced_notification': enhanced_sent,
                'fallback_email': fallback_sent
            }
        }), status_code
        
    except Exception as e:
        return jsonify({'error': 'Failed to send welcome email', 'details': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return JWT token"""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user by email with session management
        try:
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
            
        except Exception as db_error:
            db.session.rollback()
            current_app.logger.error(f"Database error during login: {str(db_error)}")
            raise db_error
        finally:
            # Ensure session is properly closed
            db.session.close()
        
    except Exception as e:
        current_app.logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Login failed', 'details': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """End the client session.

    Access tokens are stateless. Logout is intentionally idempotent and does
    not require a still-valid token; the client must discard its credentials.
    This also lets a tab log out cleanly after its access token has expired.
    """
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

        # Handle primary email updates with validation and uniqueness checks.
        if 'email' in data:
            new_email = (data.get('email') or '').strip().lower()

            if not new_email:
                return jsonify({'error': 'Email cannot be empty'}), 400

            if not validate_email(new_email):
                return jsonify({'error': 'Invalid email format'}), 400

            if new_email != (current_user.email or '').lower():
                existing_user = User.query.filter(
                    User.email == new_email,
                    User.id != current_user.id
                ).first()

                if existing_user:
                    return jsonify({'error': 'Email already registered'}), 409

                current_user.email = new_email
        
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
        if current_user.role == 'job_seeker':
            from src.services.career_agent.memory import notify_profile_changed
            notify_profile_changed(current_user.id)
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
        
        issued_at = datetime.utcnow()
        token = jwt.encode(
            {
                'user_id': current_user.id,
                'email': current_user.email,
                'purpose': 'email_verification',
                'iat': issued_at,
                'exp': issued_at + timedelta(hours=24)
            },
            current_app.config['SECRET_KEY'],
            algorithm='HS256'
        )
        backend_url = request.url_root.rstrip('/')
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173').rstrip('/')
        verification_link = (
            f"{backend_url}/api/auth/verify-email-link?token={token}"
        )
        html_body = f"""
        <p>Confirm your TalentSphere email address by selecting the button below.</p>
        <p><a href="{verification_link}">Verify email address</a></p>
        <p>This link expires in 24 hours. If you did not request it, you can ignore this email.</p>
        <p><a href="{frontend_url}">Open TalentSphere</a></p>
        """
        text_body = (
            "Confirm your TalentSphere email address:\\n"
            f"{verification_link}\\n\\n"
            "This link expires in 24 hours. If you did not request it, ignore this email."
        )
        sent = email_service.send_custom_email(
            current_user.email,
            current_user.get_full_name(),
            'Verify your TalentSphere email',
            html_body,
            text_body
        )
        if not sent:
            return jsonify({
                'error': 'Email delivery is not configured. Please try again later.',
                'code': 'EMAIL_DELIVERY_UNAVAILABLE'
            }), 503
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
        
        try:
            payload = jwt.decode(
                token,
                current_app.config['SECRET_KEY'],
                algorithms=['HS256'],
                options={'require': ['user_id', 'email', 'purpose', 'exp']},
                leeway=5
            )
        except jwt.PyJWTError:
            return jsonify({
                'error': 'Verification link is invalid or has expired.',
                'code': 'INVALID_VERIFICATION_TOKEN'
            }), 400

        if payload.get('purpose') != 'email_verification':
            return jsonify({'error': 'Invalid verification token.'}), 400

        user = User.query.get(payload.get('user_id'))
        if not user or user.email.lower() != str(payload.get('email', '')).lower():
            return jsonify({'error': 'Verification link is invalid.'}), 400

        if not user.is_verified:
            user.is_verified = True
            user.email_verified_at = datetime.utcnow()
            user.updated_at = datetime.utcnow()
            db.session.commit()
        return jsonify({'message': 'Email verified successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to verify email', 'details': str(e)}), 500

@auth_bp.route('/verify-email-link', methods=['GET'])
def verify_email_link():
    """Verify an emailed token and redirect into the verification UI."""
    token = request.args.get('token', '')
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173').rstrip('/')
    redirect_url = f"{frontend_url}/verify-email"
    if token:
        redirect_url = f"{redirect_url}?token={token}"
    return redirect(redirect_url, code=302)

@auth_bp.route('/verify-token', methods=['POST'])
def verify_token():
    """Verify if a token is valid - optimized version"""
    try:
        data = request.get_json(silent=True) or {}
        token = data.get('token')
        
        if not isinstance(token, str) or not token.strip():
            return jsonify({'valid': False, 'error': 'Token is required'}), 400
        
        user = User.verify_token(token.strip())
        if user and user.is_active:
            # Return minimal user data to avoid slow to_dict() calls
            user_data = {
                'id': user.id,
                'email': user.email,
                'role': user.role,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_active': user.is_active,
                'is_verified': user.is_verified
            }
            return jsonify({
                'valid': True,
                'user': user_data
            }), 200
        else:
            return jsonify({'valid': False, 'error': 'Invalid or expired token'}), 401
            
    except Exception as exc:
        # Keep infrastructure failures distinct from invalid credentials. A
        # temporary database outage must not make the browser discard a valid
        # session and force a needless login.
        current_app.logger.error(f"Token verification unavailable: {str(exc)}")
        return jsonify({'valid': False, 'error': 'Token verification temporarily unavailable'}), 503

@auth_bp.route('/refresh-token', methods=['POST'])
def refresh_token():
    """Refresh JWT token"""
    try:
        if request.method == 'OPTIONS':
            return current_app.make_default_options_response()

        token, token_error = _authorization_token()
        if not token:
            return jsonify({'error': token_error, 'message': 'Authorization header is required'}), 401

        # Refresh can be called by a sleeping browser tab after the access
        # token expires. It is still bounded by a short grace period, so an
        # old stolen access token cannot be refreshed indefinitely.
        data = _decode_access_token(token, verify_expiration=False)
        expires_at = data.get('exp')
        refresh_grace = current_app.config.get('JWT_REFRESH_GRACE_SECONDS', 900)
        if not expires_at or expires_at < datetime.utcnow().timestamp() - refresh_grace:
            return jsonify({'error': 'Token has expired', 'message': 'Please login again'}), 401

        current_user = db.session.get(User, data.get('user_id'))
        if not current_user or not current_user.is_active:
            return jsonify({'error': 'Invalid token', 'message': 'User account is not active'}), 401

        new_token = current_user.generate_token()
        return jsonify({
            'message': 'Token refreshed successfully',
            'token': new_token
        }), 200
    except jwt.ExpiredSignatureError:
        # Kept for compatibility if the JWT library verifies exp before the
        # bounded-grace branch above.
        return jsonify({'error': 'Token has expired', 'message': 'Please login again'}), 401
    except (jwt.InvalidTokenError, KeyError, TypeError, ValueError):
        return jsonify({'error': 'Invalid token', 'message': 'Token validation failed'}), 401
    except Exception as e:
        current_app.logger.error(f"Token refresh error: {str(e)}")
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

def send_basic_welcome_email(user):
    """Send welcome email to new users"""
    try:
        # Get email configuration from environment variables (no fallbacks to prevent using wrong credentials)
        smtp_server = os.getenv('SMTP_SERVER', 'smtp.mail.yahoo.com')
        smtp_port = int(os.getenv('SMTP_PORT', '587'))
        sender_email = os.getenv('SENDER_EMAIL')
        sender_password = os.getenv('SENDER_PASSWORD')
        sender_name = os.getenv('SENDER_NAME', 'TalentSphere Team')
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        
        # Check if email configuration is complete
        if not sender_email or not sender_password:
            print("⚠️  EMAIL CONFIG MISSING: SENDER_EMAIL or SENDER_PASSWORD not set in environment variables")
            print(f"📧 Would send welcome email to: {user.email}")
            return False  # Return False if email can't be sent
        
        print(f"📧 Sending welcome email using: {sender_email}")
        
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

# Password reset email is now handled by email_service.send_password_reset_email()

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Request password reset"""
    try:
        data = request.get_json()
        
        if not data:
            current_app.logger.warning('Forgot password: No data provided')
            return jsonify({'error': 'No data provided'}), 400
        
        email = data.get('email', '').strip().lower()
        
        # Validate email
        if not email:
            current_app.logger.warning('Forgot password: No email provided')
            return jsonify({'error': 'Email is required'}), 400
            
        if not validate_email(email):
            current_app.logger.warning(f'Forgot password: Invalid email format: {email}')
            return jsonify({'error': 'Invalid email format'}), 400
        
        current_app.logger.info(f'📧 Password reset requested for email: {email}')
        
        # Find user by email
        user = User.query.filter_by(email=email, is_active=True).first()
        
        # Always return success to prevent email enumeration attacks
        if user:
            # Generate reset token and persist it
            try:
                reset_token = user.generate_reset_token()
                db.session.commit()
                current_app.logger.info(f'✅ Reset token generated for user: {user.email}')
            except Exception as db_err:
                db.session.rollback()
                current_app.logger.error(f"❌ Database error saving reset token for {user.email}: {str(db_err)}")
                # Continue and still attempt to return success (avoid revealing failure)
                reset_token = getattr(user, 'reset_token', None) or ''
            
            # Send reset email using the centralized email service
            try:
                email_sent = email_service.send_password_reset_email(
                    user_email=user.email,
                    user_name=user.get_full_name(),
                    reset_token=reset_token
                )
                
                if email_sent:
                    current_app.logger.info(f'✅ Password reset email sent successfully to {user.email}')
                else:
                    current_app.logger.warning(f'⚠️  Password reset email could not be sent to {user.email}. Check SMTP configuration.')
                    
            except Exception as send_err:
                email_sent = False
                current_app.logger.error(f"❌ Error sending reset email to {user.email}: {str(send_err)}")

            # Always return success to the client to prevent email enumeration
            return jsonify({
                'success': True,
                'email_sent': bool(email_sent),
                'message': 'If an account with this email exists, a password reset link has been sent.'
            }), 200
        else:
            current_app.logger.info(f'ℹ️  Password reset requested for non-existent email: {email}')
            # Still return success to prevent email enumeration
            return jsonify({
                'success': True,
                'message': 'If an account with this email exists, a password reset link has been sent.'
            }), 200
            
    except Exception as e:
        current_app.logger.error(f"❌ Forgot password error: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password with token"""
    try:
        data = request.get_json()
        
        if not data:
            current_app.logger.error('Reset password: No data provided')
            return jsonify({'error': 'No data provided'}), 400
        
        token = data.get('token', '').strip()
        # Support both 'password' and 'new_password' field names
        new_password = data.get('password', data.get('new_password', '')).strip()
        confirm_password = data.get('confirm_password', '').strip()
        
        # Validate input
        if not token:
            current_app.logger.warning('Reset password: No token provided')
            return jsonify({'error': 'Reset token is required'}), 400
            
        if not new_password:
            current_app.logger.warning('Reset password: No password provided')
            return jsonify({'error': 'New password is required'}), 400
            
        if new_password != confirm_password:
            current_app.logger.warning('Reset password: Passwords do not match')
            return jsonify({'error': 'Passwords do not match'}), 400
        
        # Validate password strength
        is_valid, message = validate_password(new_password)
        if not is_valid:
            current_app.logger.warning(f'Reset password: Weak password - {message}')
            return jsonify({'error': message}), 400
        
        # Find user with valid reset token
        user = User.query.filter_by(reset_token=token, is_active=True).first()
        
        if not user:
            current_app.logger.warning(f'Reset password: Invalid token {token[:10]}...')
            return jsonify({'error': 'Invalid or expired reset token'}), 400
        
        # Verify token is not expired
        if not user.verify_reset_token(token):
            current_app.logger.warning(f'Reset password: Expired token for user {user.email}')
            return jsonify({'error': 'Reset token has expired'}), 400
        
        # Update password
        user.set_password(new_password)
        user.clear_reset_token()
        user.updated_at = datetime.utcnow()
        
        # Save changes
        db.session.commit()
        
        current_app.logger.info(f'✅ Password reset successful for user: {user.email}')
        
        return jsonify({
            'success': True,
            'message': 'Password has been successfully reset. You can now log in with your new password.'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Reset password error: {str(e)}', exc_info=True)
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
