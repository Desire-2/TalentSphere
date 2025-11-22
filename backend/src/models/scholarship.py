from src.models.user import db
from datetime import datetime, timedelta
import json

class ScholarshipCategory(db.Model):
    __tablename__ = 'scholarship_categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    slug = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    icon = db.Column(db.String(100))
    color = db.Column(db.String(7))  # Hex color code
    is_active = db.Column(db.Boolean, default=True)
    display_order = db.Column(db.Integer, default=0)
    
    # Parent-child relationship for subcategories
    parent_id = db.Column(db.Integer, db.ForeignKey('scholarship_categories.id'))
    children = db.relationship('ScholarshipCategory', backref=db.backref('parent', remote_side=[id]))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    scholarships = db.relationship('Scholarship', backref='category', lazy='dynamic')
    
    def to_dict(self, include_children=False):
        data = {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'description': self.description,
            'icon': self.icon,
            'color': self.color,
            'is_active': self.is_active,
            'display_order': self.display_order,
            'parent_id': self.parent_id,
            'scholarship_count': self.scholarships.filter_by(is_active=True).count(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        if include_children:
            data['children'] = [child.to_dict() for child in self.children if child.is_active]
        
        return data


class Scholarship(db.Model):
    __tablename__ = 'scholarships'
    
    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=True)  # Optional organization profile
    category_id = db.Column(db.Integer, db.ForeignKey('scholarship_categories.id'), nullable=False)
    posted_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # External organization information (for scholarships without organization profiles)
    external_organization_name = db.Column(db.String(300))
    external_organization_website = db.Column(db.String(500))
    external_organization_logo = db.Column(db.String(255))
    scholarship_source = db.Column(db.String(50), default='internal')  # internal, external, imported
    source_url = db.Column(db.String(500))  # Original scholarship posting URL
    
    # Basic Information
    title = db.Column(db.String(500), nullable=False, index=True)
    slug = db.Column(db.String(500), nullable=False, index=True)
    description = db.Column(db.Text, nullable=False)
    summary = db.Column(db.Text)  # Short description for listings
    
    # Scholarship Details
    scholarship_type = db.Column(db.String(100), nullable=False)  # merit-based, need-based, sports, academic, research
    study_level = db.Column(db.String(200))  # Can store multiple values: undergraduate, graduate, postgraduate, phd, vocational
    field_of_study = db.Column(db.String(300))  # engineering, medicine, arts, business, etc.
    
    # Location Information
    location_type = db.Column(db.String(50), default='any')  # any, specific-country, specific-city
    country = db.Column(db.String(100))
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    
    # Financial Information
    amount_min = db.Column(db.Integer)  # Minimum scholarship amount
    amount_max = db.Column(db.Integer)  # Maximum scholarship amount
    currency = db.Column(db.String(3), default='USD')
    funding_type = db.Column(db.String(50), default='full')  # full, partial, tuition-only, living-expenses
    renewable = db.Column(db.Boolean, default=False)  # Can be renewed for multiple years
    duration_years = db.Column(db.Integer, default=1)  # Number of years covered
    
    # Eligibility Criteria
    min_gpa = db.Column(db.Float)  # Minimum GPA requirement
    max_age = db.Column(db.Integer)  # Maximum age limit
    nationality_requirements = db.Column(db.Text)  # JSON string of eligible nationalities
    gender_requirements = db.Column(db.String(20))  # any, male, female, other
    other_requirements = db.Column(db.Text)  # Additional requirements as text
    
    # Application Information
    application_type = db.Column(db.String(50), default='external')  # internal, external, email
    application_deadline = db.Column(db.DateTime, nullable=False)
    application_email = db.Column(db.String(120))
    application_url = db.Column(db.String(255))
    application_instructions = db.Column(db.Text)
    required_documents = db.Column(db.Text)  # JSON string of required documents
    
    # Academic Requirements
    requires_transcript = db.Column(db.Boolean, default=True)
    requires_recommendation_letters = db.Column(db.Boolean, default=True)
    num_recommendation_letters = db.Column(db.Integer, default=2)
    requires_essay = db.Column(db.Boolean, default=True)
    essay_topics = db.Column(db.Text)  # JSON string of essay topics/prompts
    requires_portfolio = db.Column(db.Boolean, default=False)
    
    # Scholarship Status and Visibility
    status = db.Column(db.String(50), default='draft')  # draft, published, paused, closed, expired
    is_active = db.Column(db.Boolean, default=True)
    is_featured = db.Column(db.Boolean, default=False)
    is_urgent = db.Column(db.Boolean, default=False)  # Deadline approaching
    
    # SEO and Promotion
    meta_title = db.Column(db.String(255))
    meta_description = db.Column(db.Text)
    keywords = db.Column(db.Text)  # JSON string of keywords
    
    # Statistics
    view_count = db.Column(db.Integer, default=0)
    application_count = db.Column(db.Integer, default=0)
    bookmark_count = db.Column(db.Integer, default=0)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at = db.Column(db.DateTime)
    
    # Relationships
    poster = db.relationship('User', backref='posted_scholarships')
    applications = db.relationship('ScholarshipApplication', backref='scholarship', lazy='dynamic', cascade='all, delete-orphan')
    bookmarks = db.relationship('ScholarshipBookmark', backref='scholarship', lazy='dynamic', cascade='all, delete-orphan')
    
    def is_expired(self):
        """Check if scholarship application deadline has expired"""
        return datetime.utcnow() > self.application_deadline
    
    def days_until_deadline(self):
        """Get days until application deadline"""
        delta = self.application_deadline - datetime.utcnow()
        return max(0, delta.days)
    
    def get_amount_range(self):
        """Get formatted scholarship amount range"""
        if not self.amount_min and not self.amount_max:
            return "Amount not disclosed"
        
        currency_symbol = {'USD': '$', 'EUR': '€', 'GBP': '£'}.get(self.currency, self.currency)
        
        if self.amount_min and self.amount_max:
            return f"{currency_symbol}{self.amount_min:,} - {currency_symbol}{self.amount_max:,}"
        elif self.amount_min:
            return f"{currency_symbol}{self.amount_min:,}+"
        elif self.amount_max:
            return f"Up to {currency_symbol}{self.amount_max:,}"
        
        return "Amount not disclosed"
    
    def get_location_display(self):
        """Get formatted location string"""
        if self.location_type == 'any':
            return "Any location"
        
        location_parts = [self.city, self.state, self.country]
        return ', '.join(filter(None, location_parts)) or "Location not specified"
    
    def get_eligibility_summary(self):
        """Get formatted eligibility summary"""
        criteria = []
        
        if self.min_gpa:
            criteria.append(f"Min GPA: {self.min_gpa}")
        
        if self.max_age:
            criteria.append(f"Max Age: {self.max_age}")
        
        if self.study_level:
            criteria.append(f"Level: {self.study_level.title()}")
        
        if self.field_of_study:
            criteria.append(f"Field: {self.field_of_study.title()}")
        
        return " • ".join(criteria) if criteria else "General eligibility"
    
    def to_dict(self, include_details=False, include_stats=False):
        """Convert scholarship to dictionary"""
        
        # Get organization information (either from organization relationship or external data)
        organization_info = None
        if self.organization_id and hasattr(self, 'organization') and self.organization:
            organization_info = {
                'id': self.organization.id,
                'name': self.organization.name,
                'slug': self.organization.slug,
                'logo_url': self.organization.logo_url,
                'website': self.organization.website,
                'is_verified': self.organization.is_verified
            }
        elif self.scholarship_source == 'external' and self.external_organization_name:
            organization_info = {
                'id': None,
                'name': self.external_organization_name,
                'slug': None,
                'logo_url': self.external_organization_logo,
                'website': self.external_organization_website,
                'is_verified': False,
                'is_external': True
            }
        
        data = {
            'id': self.id,
            'organization_id': self.organization_id,
            'category_id': self.category_id,
            'title': self.title,
            'slug': self.slug,
            'summary': self.summary,
            'scholarship_type': self.scholarship_type,
            'study_level': self.study_level,
            'field_of_study': self.field_of_study,
            'scholarship_source': self.scholarship_source,
            'source_url': self.source_url,
            'external_organization_name': self.external_organization_name,
            'organization': organization_info,
            'location': {
                'type': self.location_type,
                'city': self.city,
                'state': self.state,
                'country': self.country,
                'display': self.get_location_display()
            },
            'funding': {
                'min': self.amount_min,
                'max': self.amount_max,
                'currency': self.currency,
                'type': self.funding_type,
                'renewable': self.renewable,
                'duration_years': self.duration_years,
                'display': self.get_amount_range()
            },
            'application_deadline': self.application_deadline.isoformat(),
            'days_until_deadline': self.days_until_deadline(),
            'eligibility_summary': self.get_eligibility_summary(),
            'status': self.status,
            'is_active': self.is_active,
            'is_featured': self.is_featured,
            'is_urgent': self.is_urgent,
            'is_expired': self.is_expired(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'published_at': self.published_at.isoformat() if self.published_at else None
        }
        
        if include_details:
            data.update({
                'description': self.description,
                'min_gpa': self.min_gpa,
                'max_age': self.max_age,
                'nationality_requirements': self.nationality_requirements,
                'gender_requirements': self.gender_requirements,
                'other_requirements': self.other_requirements,
                'application_type': self.application_type,
                'application_email': self.application_email,
                'application_url': self.application_url,
                'application_instructions': self.application_instructions,
                'required_documents': self.required_documents,
                'requirements': {
                    'transcript': self.requires_transcript,
                    'recommendation_letters': self.requires_recommendation_letters,
                    'num_recommendation_letters': self.num_recommendation_letters,
                    'essay': self.requires_essay,
                    'essay_topics': self.essay_topics,
                    'portfolio': self.requires_portfolio
                },
                'external_organization_website': self.external_organization_website,
                'external_organization_logo': self.external_organization_logo
            })
        
        if include_stats:
            data.update({
                'statistics': {
                    'view_count': self.view_count,
                    'application_count': self.application_count,
                    'bookmark_count': self.bookmark_count
                }
            })
        
        return data
    
    def __repr__(self):
        return f'<Scholarship {self.title}>'


class ScholarshipApplication(db.Model):
    __tablename__ = 'scholarship_applications'
    
    id = db.Column(db.Integer, primary_key=True)
    scholarship_id = db.Column(db.Integer, db.ForeignKey('scholarships.id'), nullable=False)
    applicant_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Application Status
    status = db.Column(db.String(50), default='pending')  # pending, under_review, shortlisted, selected, rejected
    
    # Application Data
    personal_statement = db.Column(db.Text)
    academic_achievements = db.Column(db.Text)
    extracurricular_activities = db.Column(db.Text)
    financial_need_statement = db.Column(db.Text)
    
    # Document Uploads
    transcript_url = db.Column(db.String(255))
    recommendation_letters = db.Column(db.Text)  # JSON array of URLs
    essay_responses = db.Column(db.Text)  # JSON object with essay responses
    portfolio_url = db.Column(db.String(255))
    additional_documents = db.Column(db.Text)  # JSON array of additional document URLs
    
    # Review Information
    reviewer_notes = db.Column(db.Text)
    score = db.Column(db.Float)  # Review score if applicable
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    submitted_at = db.Column(db.DateTime)
    reviewed_at = db.Column(db.DateTime)
    
    # Relationships
    applicant = db.relationship('User', backref='scholarship_applications')
    
    def to_dict(self, include_documents=False):
        data = {
            'id': self.id,
            'scholarship_id': self.scholarship_id,
            'applicant_id': self.applicant_id,
            'status': self.status,
            'score': self.score,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None
        }
        
        if include_documents:
            data.update({
                'personal_statement': self.personal_statement,
                'academic_achievements': self.academic_achievements,
                'extracurricular_activities': self.extracurricular_activities,
                'financial_need_statement': self.financial_need_statement,
                'transcript_url': self.transcript_url,
                'recommendation_letters': self.recommendation_letters,
                'essay_responses': self.essay_responses,
                'portfolio_url': self.portfolio_url,
                'additional_documents': self.additional_documents,
                'reviewer_notes': self.reviewer_notes
            })
        
        return data


class ScholarshipBookmark(db.Model):
    __tablename__ = 'scholarship_bookmarks'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    scholarship_id = db.Column(db.Integer, db.ForeignKey('scholarships.id'), nullable=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Unique constraint to prevent duplicate bookmarks
    __table_args__ = (db.UniqueConstraint('user_id', 'scholarship_id', name='unique_user_scholarship_bookmark'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'scholarship_id': self.scholarship_id,
            'created_at': self.created_at.isoformat()
        }


class ScholarshipAlert(db.Model):
    __tablename__ = 'scholarship_alerts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Alert Configuration
    name = db.Column(db.String(100), nullable=False)
    keywords = db.Column(db.String(255))
    study_level = db.Column(db.String(50))
    field_of_study = db.Column(db.String(100))
    category_id = db.Column(db.Integer, db.ForeignKey('scholarship_categories.id'))
    scholarship_type = db.Column(db.String(50))
    country = db.Column(db.String(100))
    min_amount = db.Column(db.Integer)
    max_gpa_requirement = db.Column(db.Float)
    
    # Alert Settings
    frequency = db.Column(db.String(20), default='daily')  # daily, weekly, immediate
    is_active = db.Column(db.Boolean, default=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_sent = db.Column(db.DateTime)
    
    # Relationships
    user = db.relationship('User', backref='scholarship_alerts')
    category = db.relationship('ScholarshipCategory', backref='scholarship_alerts')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'keywords': self.keywords,
            'study_level': self.study_level,
            'field_of_study': self.field_of_study,
            'category_id': self.category_id,
            'scholarship_type': self.scholarship_type,
            'country': self.country,
            'min_amount': self.min_amount,
            'max_gpa_requirement': self.max_gpa_requirement,
            'frequency': self.frequency,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'last_sent': self.last_sent.isoformat() if self.last_sent else None
        }
