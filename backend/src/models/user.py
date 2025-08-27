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
    role = db.Column(db.Enum('job_seeker', 'employer', 'admin', name='user_roles'), nullable=False, default='job_seeker')
    
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
    
    # Professional Information
    resume_url = db.Column(db.String(255))
    portfolio_url = db.Column(db.String(255))
    linkedin_url = db.Column(db.String(255))
    github_url = db.Column(db.String(255))
    
    # Job Preferences
    desired_position = db.Column(db.String(100))
    desired_salary_min = db.Column(db.Integer)
    desired_salary_max = db.Column(db.Integer)
    preferred_location = db.Column(db.String(100))
    job_type_preference = db.Column(db.String(50))  # full-time, part-time, contract, remote
    availability = db.Column(db.String(50))  # immediate, 2-weeks, 1-month, etc.
    
    # Experience and Skills
    years_of_experience = db.Column(db.Integer, default=0)
    skills = db.Column(db.Text)  # JSON string of skills array
    education_level = db.Column(db.String(50))
    certifications = db.Column(db.Text)  # JSON string of certifications
    
    # Profile Visibility
    profile_visibility = db.Column(db.String(20), default='public')  # public, private, employers_only
    open_to_opportunities = db.Column(db.Boolean, default=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'resume_url': self.resume_url,
            'portfolio_url': self.portfolio_url,
            'linkedin_url': self.linkedin_url,
            'github_url': self.github_url,
            'desired_position': self.desired_position,
            'desired_salary_min': self.desired_salary_min,
            'desired_salary_max': self.desired_salary_max,
            'preferred_location': self.preferred_location,
            'job_type_preference': self.job_type_preference,
            'availability': self.availability,
            'years_of_experience': self.years_of_experience,
            'skills': self.skills,
            'education_level': self.education_level,
            'certifications': self.certifications,
            'profile_visibility': self.profile_visibility,
            'open_to_opportunities': self.open_to_opportunities,
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

