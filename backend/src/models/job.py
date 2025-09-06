from src.models.user import db
from datetime import datetime, timedelta

class JobCategory(db.Model):
    __tablename__ = 'job_categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    slug = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    icon = db.Column(db.String(100))
    color = db.Column(db.String(7))  # Hex color code
    is_active = db.Column(db.Boolean, default=True)
    display_order = db.Column(db.Integer, default=0)
    
    # Parent-child relationship for subcategories
    parent_id = db.Column(db.Integer, db.ForeignKey('job_categories.id'))
    children = db.relationship('JobCategory', backref=db.backref('parent', remote_side=[id]))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    jobs = db.relationship('Job', backref='category', lazy='dynamic')
    
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
            'job_count': self.jobs.filter_by(is_active=True).count(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        if include_children:
            data['children'] = [child.to_dict() for child in self.children if child.is_active]
        
        return data


class Job(db.Model):
    __tablename__ = 'jobs'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=True)  # Made nullable for external jobs
    category_id = db.Column(db.Integer, db.ForeignKey('job_categories.id'), nullable=False)
    posted_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # External job source information
    external_company_name = db.Column(db.String(200))  # For external jobs without company profile
    external_company_website = db.Column(db.String(255))  # External company website
    external_company_logo = db.Column(db.String(255))  # External company logo URL
    job_source = db.Column(db.String(50), default='internal')  # internal, external, scraped
    source_url = db.Column(db.String(500))  # Original job posting URL for external jobs
    
    # Basic Information
    title = db.Column(db.String(200), nullable=False, index=True)
    slug = db.Column(db.String(200), nullable=False, index=True)
    description = db.Column(db.Text, nullable=False)
    summary = db.Column(db.Text)  # Short description for listings
    
    # Job Details
    employment_type = db.Column(db.String(50), nullable=False)  # full-time, part-time, contract, internship, freelance
    experience_level = db.Column(db.String(50))  # entry, mid, senior, executive
    education_requirement = db.Column(db.String(100))
    
    # Location Information
    location_type = db.Column(db.String(50), default='on-site')  # on-site, remote, hybrid
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    country = db.Column(db.String(100))
    is_remote = db.Column(db.Boolean, default=False)
    remote_policy = db.Column(db.Text)  # Remote work policy details
    
    # Compensation
    salary_min = db.Column(db.Integer)
    salary_max = db.Column(db.Integer)
    salary_currency = db.Column(db.String(3), default='USD')
    salary_period = db.Column(db.String(20), default='yearly')  # yearly, monthly, hourly
    salary_negotiable = db.Column(db.Boolean, default=False)
    show_salary = db.Column(db.Boolean, default=True)
    
    # Requirements and Skills
    required_skills = db.Column(db.Text)  # JSON string of required skills
    preferred_skills = db.Column(db.Text)  # JSON string of preferred skills
    years_experience_min = db.Column(db.Integer, default=0)
    years_experience_max = db.Column(db.Integer)
    
    # Application Information
    application_type = db.Column(db.String(50), default='internal')  # internal, external, email
    application_deadline = db.Column(db.DateTime)
    application_email = db.Column(db.String(120))
    application_url = db.Column(db.String(255))
    application_instructions = db.Column(db.Text)
    requires_resume = db.Column(db.Boolean, default=True)
    requires_cover_letter = db.Column(db.Boolean, default=False)
    requires_portfolio = db.Column(db.Boolean, default=False)
    
    # Job Status and Visibility
    status = db.Column(db.String(50), default='draft')  # draft, published, paused, closed, expired
    is_active = db.Column(db.Boolean, default=True)
    is_featured = db.Column(db.Boolean, default=False)
    is_urgent = db.Column(db.Boolean, default=False)
    
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
    expires_at = db.Column(db.DateTime)
    
    # Relationships
    poster = db.relationship('User', backref='posted_jobs')
    applications = db.relationship('Application', backref='job', lazy='dynamic', cascade='all, delete-orphan')
    bookmarks = db.relationship('JobBookmark', backref='job', lazy='dynamic', cascade='all, delete-orphan')
    featured_ads = db.relationship('FeaturedAd', backref='job', lazy='dynamic', cascade='all, delete-orphan')
    
    def is_expired(self):
        """Check if job posting has expired"""
        if self.expires_at:
            return datetime.utcnow() > self.expires_at
        return False
    
    def days_until_expiry(self):
        """Get days until job expires"""
        if self.expires_at:
            delta = self.expires_at - datetime.utcnow()
            return max(0, delta.days)
        return None
    
    def get_salary_range(self):
        """Get formatted salary range"""
        if not self.show_salary or (not self.salary_min and not self.salary_max):
            return "Salary not disclosed"
        
        if self.salary_negotiable:
            return "Negotiable"
        
        currency_symbol = {'USD': '$', 'EUR': '€', 'GBP': '£'}.get(self.salary_currency, self.salary_currency)
        
        if self.salary_min and self.salary_max:
            return f"{currency_symbol}{self.salary_min:,} - {currency_symbol}{self.salary_max:,} {self.salary_period}"
        elif self.salary_min:
            return f"{currency_symbol}{self.salary_min:,}+ {self.salary_period}"
        elif self.salary_max:
            return f"Up to {currency_symbol}{self.salary_max:,} {self.salary_period}"
        
        return "Salary not disclosed"
    
    def get_location_display(self):
        """Get formatted location string"""
        if self.is_remote:
            if self.location_type == 'remote':
                return "Remote"
            elif self.location_type == 'hybrid':
                location_parts = [self.city, self.state, self.country]
                location = ', '.join(filter(None, location_parts))
                return f"{location} (Hybrid)" if location else "Hybrid"
        
        location_parts = [self.city, self.state, self.country]
        return ', '.join(filter(None, location_parts)) or "Location not specified"
    
    def to_dict(self, include_details=False, include_stats=False):
        """Convert job to dictionary"""
        
        # Get company information (either from company relationship or external data)
        company_info = None
        if self.company_id and self.company:
            company_info = {
                'id': self.company.id,
                'name': self.company.name,
                'slug': self.company.slug,
                'logo_url': self.company.logo_url,
                'website': self.company.website,
                'is_verified': self.company.is_verified
            }
        elif self.job_source == 'external' and self.external_company_name:
            company_info = {
                'id': None,
                'name': self.external_company_name,
                'slug': None,
                'logo_url': self.external_company_logo,
                'website': self.external_company_website,
                'is_verified': False,
                'is_external': True
            }
        
        data = {
            'id': self.id,
            'company_id': self.company_id,
            'category_id': self.category_id,
            'title': self.title,
            'slug': self.slug,
            'summary': self.summary,
            'employment_type': self.employment_type,
            'experience_level': self.experience_level,
            'job_source': self.job_source,
            'source_url': self.source_url,
            'external_company_name': self.external_company_name,
            'company': company_info,
            'location': {
                'type': self.location_type,
                'city': self.city,
                'state': self.state,
                'country': self.country,
                'is_remote': self.is_remote,
                'display': self.get_location_display()
            },
            'salary': {
                'min': self.salary_min,
                'max': self.salary_max,
                'currency': self.salary_currency,
                'period': self.salary_period,
                'negotiable': self.salary_negotiable,
                'show_salary': self.show_salary,
                'display': self.get_salary_range()
            },
            'status': self.status,
            'is_active': self.is_active,
            'is_featured': self.is_featured,
            'is_urgent': self.is_urgent,
            'is_expired': self.is_expired(),
            'days_until_expiry': self.days_until_expiry(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'published_at': self.published_at.isoformat() if self.published_at else None
        }
        
        if include_details:
            data.update({
                'description': self.description,
                'education_requirement': self.education_requirement,
                'required_skills': self.required_skills,
                'preferred_skills': self.preferred_skills,
                'years_experience_min': self.years_experience_min,
                'years_experience_max': self.years_experience_max,
                'application_type': self.application_type,
                'application_deadline': self.application_deadline.isoformat() if self.application_deadline else None,
                'application_email': self.application_email,
                'application_url': self.application_url,
                'application_instructions': self.application_instructions,
                'requirements': {
                    'resume': self.requires_resume,
                    'cover_letter': self.requires_cover_letter,
                    'portfolio': self.requires_portfolio
                },
                'remote_policy': self.remote_policy,
                'expires_at': self.expires_at.isoformat() if self.expires_at else None,
                'external_company_website': self.external_company_website,
                'external_company_logo': self.external_company_logo
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
        return f'<Job {self.title}>'


class JobBookmark(db.Model):
    __tablename__ = 'job_bookmarks'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Unique constraint to prevent duplicate bookmarks
    __table_args__ = (db.UniqueConstraint('user_id', 'job_id', name='unique_user_job_bookmark'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'job_id': self.job_id,
            'created_at': self.created_at.isoformat()
        }


class JobAlert(db.Model):
    __tablename__ = 'job_alerts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Alert Configuration
    name = db.Column(db.String(100), nullable=False)
    keywords = db.Column(db.String(255))
    location = db.Column(db.String(100))
    category_id = db.Column(db.Integer, db.ForeignKey('job_categories.id'))
    employment_type = db.Column(db.String(50))
    experience_level = db.Column(db.String(50))
    salary_min = db.Column(db.Integer)
    is_remote = db.Column(db.Boolean)
    
    # Alert Settings
    frequency = db.Column(db.String(20), default='daily')  # daily, weekly, immediate
    is_active = db.Column(db.Boolean, default=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_sent = db.Column(db.DateTime)
    
    # Relationships
    user = db.relationship('User', backref='job_alerts')
    category = db.relationship('JobCategory', backref='job_alerts')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'keywords': self.keywords,
            'location': self.location,
            'category_id': self.category_id,
            'employment_type': self.employment_type,
            'experience_level': self.experience_level,
            'salary_min': self.salary_min,
            'is_remote': self.is_remote,
            'frequency': self.frequency,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'last_sent': self.last_sent.isoformat() if self.last_sent else None
        }


class JobShare(db.Model):
    __tablename__ = 'job_shares'
    
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    platform = db.Column(db.String(50), nullable=False)  # linkedin, twitter, email, etc.
    custom_message = db.Column(db.Text)
    recipient_count = db.Column(db.Integer, default=1)
    share_url = db.Column(db.String(500))
    user_agent = db.Column(db.String(500))
    extra_data = db.Column(db.Text)  # JSON string for additional data (renamed from metadata)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    job = db.relationship('Job', backref=db.backref('shares', lazy='dynamic', cascade='all, delete-orphan'))
    user = db.relationship('User', backref=db.backref('job_shares', lazy='dynamic'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'job_id': self.job_id,
            'user_id': self.user_id,
            'platform': self.platform,
            'custom_message': self.custom_message,
            'recipient_count': self.recipient_count,
            'share_url': self.share_url,
            'timestamp': self.timestamp.isoformat(),
            'extra_data': self.extra_data
        }

