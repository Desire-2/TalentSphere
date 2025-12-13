from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import jwt
import os

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum('job_seeker', 'employer', 'admin', 'external_admin', name='user_roles'), nullable=False, default='job_seeker')
    
    # Profile Information
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    phone = db.Column(db.String(20))
    profile_picture = db.Column(db.String(255))
    bio = db.Column(db.Text)
    location = db.Column(db.String(100))
    
    # Account Status
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    email_verified_at = db.Column(db.DateTime)
    last_login = db.Column(db.DateTime)
    
    # Password Reset
    reset_token = db.Column(db.String(255))
    reset_token_expires_at = db.Column(db.DateTime)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    job_seeker_profile = db.relationship('JobSeekerProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    employer_profile = db.relationship('EmployerProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    applications = db.relationship('Application', foreign_keys='Application.applicant_id', backref='applicant', lazy='dynamic', cascade='all, delete-orphan')
    notifications = db.relationship('Notification', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    reviews_given = db.relationship('Review', foreign_keys='Review.reviewer_id', backref='reviewer', lazy='dynamic')
    reviews_received = db.relationship('Review', foreign_keys='Review.reviewee_id', backref='reviewee', lazy='dynamic')
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if provided password matches hash"""
        return check_password_hash(self.password_hash, password)
    
    def generate_token(self, expires_in=3600):
        """Generate JWT token for authentication"""
        from flask import current_app
        payload = {
            'user_id': self.id,
            'email': self.email,
            'role': self.role,
            'exp': datetime.utcnow() + timedelta(seconds=expires_in)
        }
        try:
            secret_key = current_app.config['SECRET_KEY']
        except RuntimeError:
            # Fallback if no application context
            secret_key = 'asdf#FGSgvasgf$5$WGT'
        return jwt.encode(payload, secret_key, algorithm='HS256')
    
    @staticmethod
    def verify_token(token):
        """Verify JWT token and return user"""
        try:
            from flask import current_app
            try:
                secret_key = current_app.config['SECRET_KEY']
            except RuntimeError:
                # Fallback if no application context
                secret_key = 'asdf#FGSgvasgf$5$WGT'
            payload = jwt.decode(token, secret_key, algorithms=['HS256'])
            return User.query.get(payload['user_id'])
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def get_full_name(self):
        """Get user's full name"""
        return f"{self.first_name} {self.last_name}"
    
    def generate_reset_token(self):
        """Generate a password reset token"""
        import uuid
        self.reset_token = str(uuid.uuid4())
        self.reset_token_expires_at = datetime.utcnow() + timedelta(hours=1)
        return self.reset_token
    
    def verify_reset_token(self, token):
        """Verify if the reset token is valid and not expired"""
        if not self.reset_token or not self.reset_token_expires_at:
            return False
        return (self.reset_token == token and 
                datetime.utcnow() < self.reset_token_expires_at)
    
    def clear_reset_token(self):
        """Clear the reset token after use"""
        self.reset_token = None
        self.reset_token_expires_at = None
    
    def to_dict(self, include_sensitive=False):
        """Convert user to dictionary"""
        data = {
            'id': self.id,
            'email': self.email,
            'role': self.role,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.get_full_name(),
            'phone': self.phone,
            'profile_picture': self.profile_picture,
            'bio': self.bio,
            'location': self.location,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        if include_sensitive:
            data.update({
                'email_verified_at': self.email_verified_at.isoformat() if self.email_verified_at else None
            })
        
        return data
    
    def __repr__(self):
        return f'<User {self.email}>'


class JobSeekerProfile(db.Model):
    __tablename__ = 'job_seeker_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Professional Header
    professional_title = db.Column(db.String(150))  # e.g., "Senior Software Engineer"
    professional_summary = db.Column(db.Text)  # 3-4 sentence impactful statement
    
    # Professional Information
    resume_url = db.Column(db.String(255))
    portfolio_url = db.Column(db.String(255))
    linkedin_url = db.Column(db.String(255))
    github_url = db.Column(db.String(255))
    website_url = db.Column(db.String(255))
    
    # Job Preferences
    desired_position = db.Column(db.String(100))
    desired_salary_min = db.Column(db.Integer)
    desired_salary_max = db.Column(db.Integer)
    expected_salary = db.Column(db.Integer)  # Single expected salary field
    salary_currency = db.Column(db.String(10), default='USD')
    preferred_location = db.Column(db.String(100))
    preferred_locations = db.Column(db.Text)  # JSON array of preferred locations
    job_type_preference = db.Column(db.String(50))  # Legacy field: full-time, part-time, contract, remote
    job_types = db.Column(db.Text)  # JSON array of job types
    availability = db.Column(db.String(50))  # immediate, 2-weeks, 1-month, etc.
    willing_to_relocate = db.Column(db.Boolean, default=False)
    willing_to_travel = db.Column(db.String(50))  # none, occasionally, frequently, 50%, etc.
    
    # Work Authorization
    work_authorization = db.Column(db.String(100))  # citizen, permanent_resident, work_visa, etc.
    visa_sponsorship_required = db.Column(db.Boolean, default=False)
    
    # Experience and Skills
    years_of_experience = db.Column(db.Integer, default=0)
    skills = db.Column(db.Text)  # JSON string of all skills (legacy, kept for compatibility)
    technical_skills = db.Column(db.Text)  # JSON string of technical skills array
    soft_skills = db.Column(db.Text)  # JSON string of soft skills array
    education_level = db.Column(db.String(50))
    certifications = db.Column(db.Text)  # JSON string of certifications
    
    # Professional Development
    professional_title = db.Column(db.String(150))  # e.g., "Senior Software Engineer"
    professional_summary = db.Column(db.Text)  # 3-4 sentence impactful statement
    career_level = db.Column(db.String(50))  # entry, mid, senior, lead, executive
    notice_period = db.Column(db.String(50))  # immediate, 2-weeks, 1-month, etc.
    
    # Industry Preferences
    preferred_industries = db.Column(db.Text)  # JSON array
    preferred_company_size = db.Column(db.String(50))  # startup, small, medium, large, enterprise
    preferred_work_environment = db.Column(db.String(50))  # office, remote, hybrid
    
    # Profile Visibility
    profile_visibility = db.Column(db.String(20), default='public')  # public, private, employers_only
    open_to_opportunities = db.Column(db.Boolean, default=True)
    profile_completeness = db.Column(db.Integer, default=0)  # Calculated percentage
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        import json
        
        # Helper function to parse JSON fields
        def parse_json_field(field_value):
            if not field_value:
                return []
            if isinstance(field_value, str):
                try:
                    return json.loads(field_value)
                except:
                    return []
            return field_value
        
        return {
            'id': self.id,
            'user_id': self.user_id,
            'professional_title': self.professional_title,
            'professional_summary': self.professional_summary,
            'career_level': self.career_level,
            'notice_period': self.notice_period,
            'resume_url': self.resume_url,
            'portfolio_url': self.portfolio_url,
            'linkedin_url': self.linkedin_url,
            'github_url': self.github_url,
            'website_url': self.website_url,
            'desired_position': self.desired_position,
            'desired_salary_min': self.desired_salary_min,
            'desired_salary_max': self.desired_salary_max,
            'expected_salary': self.expected_salary,
            'salary_currency': self.salary_currency,
            'preferred_location': self.preferred_location,
            'preferred_locations': parse_json_field(self.preferred_locations),
            'job_type_preference': self.job_type_preference,
            'job_types': parse_json_field(self.job_types),
            'availability': self.availability,
            'willing_to_relocate': self.willing_to_relocate,
            'willing_to_travel': self.willing_to_travel,
            'work_authorization': self.work_authorization,
            'visa_sponsorship_required': self.visa_sponsorship_required,
            'years_of_experience': self.years_of_experience,
            'skills': self.skills,  # Legacy field
            'technical_skills': self.technical_skills,
            'soft_skills': self.soft_skills,
            'education_level': self.education_level,
            'certifications': self.certifications,
            'preferred_industries': self.preferred_industries,
            'preferred_company_size': self.preferred_company_size,
            'preferred_work_environment': self.preferred_work_environment,
            'profile_visibility': self.profile_visibility,
            'open_to_opportunities': self.open_to_opportunities,
            'profile_completeness': self.profile_completeness,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class EmployerProfile(db.Model):
    __tablename__ = 'employer_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=True)
    
    # Professional Information
    job_title = db.Column(db.String(100))
    department = db.Column(db.String(100))
    hiring_authority = db.Column(db.Boolean, default=False)
    
    # Contact Information
    work_phone = db.Column(db.String(20))
    work_email = db.Column(db.String(120))
    
    # Verification
    is_verified_employer = db.Column(db.Boolean, default=False)
    verification_documents = db.Column(db.Text)  # JSON string of document URLs
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'company_id': self.company_id,
            'job_title': self.job_title,
            'department': self.department,
            'hiring_authority': self.hiring_authority,
            'work_phone': self.work_phone,
            'work_email': self.work_email,
            'is_verified_employer': self.is_verified_employer,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

