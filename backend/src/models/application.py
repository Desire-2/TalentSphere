from src.models.user import db
from datetime import datetime

class Application(db.Model):
    __tablename__ = 'applications'
    
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
    applicant_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Application Content
    cover_letter = db.Column(db.Text)
    resume_url = db.Column(db.String(255))
    portfolio_url = db.Column(db.String(255))
    additional_documents = db.Column(db.Text)  # JSON string of document URLs
    
    # Custom Questions and Answers
    custom_responses = db.Column(db.Text)  # JSON string of question-answer pairs
    
    # Application Status
    status = db.Column(db.String(50), default='submitted')  # submitted, under_review, shortlisted, interviewed, rejected, hired, withdrawn
    stage = db.Column(db.String(100))  # Custom hiring stage (e.g., "Phone Screen", "Technical Interview")
    
    # Employer Notes and Feedback
    employer_notes = db.Column(db.Text)
    feedback = db.Column(db.Text)
    rating = db.Column(db.Integer)  # 1-5 rating from employer
    match_score = db.Column(db.Integer)  # AI-calculated match score percentage (0-100)
    
    # Interview Information
    interview_scheduled = db.Column(db.Boolean, default=False)
    interview_datetime = db.Column(db.DateTime)
    interview_type = db.Column(db.String(50))  # phone, video, in-person
    interview_location = db.Column(db.String(255))
    interview_notes = db.Column(db.Text)
    
    # Salary and Offer Information
    offered_salary = db.Column(db.Integer)
    offer_details = db.Column(db.Text)
    offer_expiry = db.Column(db.DateTime)
    
    # Communication Tracking
    last_communication = db.Column(db.DateTime)
    communication_count = db.Column(db.Integer, default=0)
    
    # Application Source
    source = db.Column(db.String(100))  # direct, referral, job_board, social_media
    referrer_id = db.Column(db.Integer, db.ForeignKey('users.id'))  # If referred by someone
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    reviewed_at = db.Column(db.DateTime)
    
    # Relationships
    referrer = db.relationship('User', foreign_keys=[referrer_id], backref='referrals')
    application_activities = db.relationship('ApplicationActivity', backref='application', lazy='dynamic', cascade='all, delete-orphan')
    
    def get_status_display(self):
        """Get human-readable status"""
        status_map = {
            'submitted': 'Application Submitted',
            'under_review': 'Under Review',
            'shortlisted': 'Shortlisted',
            'interviewed': 'Interviewed',
            'rejected': 'Not Selected',
            'hired': 'Hired',
            'withdrawn': 'Withdrawn'
        }
        return status_map.get(self.status, self.status.title())
    
    def get_status_color(self):
        """Get status color for UI"""
        color_map = {
            'submitted': 'blue',
            'under_review': 'yellow',
            'shortlisted': 'green',
            'interviewed': 'purple',
            'rejected': 'red',
            'hired': 'green',
            'withdrawn': 'gray'
        }
        return color_map.get(self.status, 'gray')
    
    def days_since_application(self):
        """Get days since application was submitted"""
        return (datetime.utcnow() - self.created_at).days
    
    def is_offer_expired(self):
        """Check if job offer has expired"""
        if self.offer_expiry:
            return datetime.utcnow() > self.offer_expiry
        return False
    
    def to_dict(self, include_sensitive=False, for_employer=False):
        """Convert application to dictionary"""
        data = {
            'id': self.id,
            'job_id': self.job_id,
            'applicant_id': self.applicant_id,
            'status': self.status,
            'status_display': self.get_status_display(),
            'status_color': self.get_status_color(),
            'stage': self.stage,
            'source': self.source,
            'days_since_application': self.days_since_application(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None
        }
        
        # Include application content for both applicant and employer
        if include_sensitive or for_employer:
            data.update({
                'cover_letter': self.cover_letter,
                'resume_url': self.resume_url,
                'portfolio_url': self.portfolio_url,
                'custom_responses': self.custom_responses,
                'interview_scheduled': self.interview_scheduled,
                'interview_datetime': self.interview_datetime.isoformat() if self.interview_datetime else None,
                'interview_type': self.interview_type,
                'interview_location': self.interview_location,
                'last_communication': self.last_communication.isoformat() if self.last_communication else None,
                'communication_count': self.communication_count
            })
        
        # Employer-specific information
        if for_employer:
            data.update({
                'employer_notes': self.employer_notes,
                'feedback': self.feedback,
                'rating': self.rating,
                'interview_notes': self.interview_notes,
                'offered_salary': self.offered_salary,
                'offer_details': self.offer_details,
                'offer_expiry': self.offer_expiry.isoformat() if self.offer_expiry else None,
                'is_offer_expired': self.is_offer_expired(),
                'referrer_id': self.referrer_id
            })
        
        return data
    
    def __repr__(self):
        return f'<Application {self.id} - Job {self.job_id}>'


class ApplicationActivity(db.Model):
    __tablename__ = 'application_activities'
    
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey('applications.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)  # Who performed the action
    
    # Activity Information
    activity_type = db.Column(db.String(50), nullable=False)  # status_change, note_added, interview_scheduled, etc.
    description = db.Column(db.Text, nullable=False)
    old_value = db.Column(db.String(255))  # Previous value (for status changes)
    new_value = db.Column(db.String(255))  # New value (for status changes)
    
    # Additional Data
    additional_data = db.Column(db.Text)  # JSON string for additional activity data
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='application_activities')
    
    def to_dict(self):
        return {
            'id': self.id,
            'application_id': self.application_id,
            'user_id': self.user_id,
            'activity_type': self.activity_type,
            'description': self.description,
            'old_value': self.old_value,
            'new_value': self.new_value,
            'metadata': self.additional_data,
            'created_at': self.created_at.isoformat()
        }


class ApplicationQuestion(db.Model):
    __tablename__ = 'application_questions'
    
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
    
    # Question Information
    question = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(50), default='text')  # text, textarea, select, radio, checkbox, file
    options = db.Column(db.Text)  # JSON string of options for select/radio/checkbox
    
    # Validation
    is_required = db.Column(db.Boolean, default=False)
    max_length = db.Column(db.Integer)
    file_types = db.Column(db.String(255))  # Allowed file types for file questions
    
    # Display
    display_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    job = db.relationship('Job', backref='application_questions')
    
    def to_dict(self):
        return {
            'id': self.id,
            'job_id': self.job_id,
            'question': self.question,
            'question_type': self.question_type,
            'options': self.options,
            'is_required': self.is_required,
            'max_length': self.max_length,
            'file_types': self.file_types,
            'display_order': self.display_order,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class ApplicationTemplate(db.Model):
    __tablename__ = 'application_templates'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    
    # Template Information
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    
    # Template Configuration
    requires_resume = db.Column(db.Boolean, default=True)
    requires_cover_letter = db.Column(db.Boolean, default=False)
    requires_portfolio = db.Column(db.Boolean, default=False)
    
    # Custom Questions (JSON string)
    custom_questions = db.Column(db.Text)
    
    # Settings
    is_default = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = db.relationship('Company', backref='application_templates')
    
    def to_dict(self):
        return {
            'id': self.id,
            'company_id': self.company_id,
            'name': self.name,
            'description': self.description,
            'requires_resume': self.requires_resume,
            'requires_cover_letter': self.requires_cover_letter,
            'requires_portfolio': self.requires_portfolio,
            'custom_questions': self.custom_questions,
            'is_default': self.is_default,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

