from src.models.user import db
from datetime import datetime
import json

class JobTemplate(db.Model):
    __tablename__ = 'job_templates'
    
    id = db.Column(db.Integer, primary_key=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('job_categories.id'), nullable=True)
    
    # Template Information
    name = db.Column(db.String(200), nullable=False, index=True)
    description = db.Column(db.Text)
    
    # Job Details Template
    title = db.Column(db.String(200), nullable=False)
    summary = db.Column(db.Text)
    job_description = db.Column(db.Text, nullable=False)
    requirements = db.Column(db.Text)
    preferred_skills = db.Column(db.Text)
    
    # Employment Details Template
    employment_type = db.Column(db.String(50), nullable=False)  # full-time, part-time, contract, internship, freelance
    experience_level = db.Column(db.String(50))  # entry, mid, senior, lead, executive
    education_requirement = db.Column(db.String(100))
    
    # Location Information Template
    location_type = db.Column(db.String(50), default='on-site')  # on-site, remote, hybrid
    location_city = db.Column(db.String(100))
    location_state = db.Column(db.String(100))
    location_country = db.Column(db.String(100))
    
    # Compensation Template
    salary_min = db.Column(db.Integer)
    salary_max = db.Column(db.Integer)
    salary_currency = db.Column(db.String(3), default='USD')
    salary_period = db.Column(db.String(20), default='yearly')  # yearly, monthly, hourly
    salary_negotiable = db.Column(db.Boolean, default=False)
    show_salary = db.Column(db.Boolean, default=True)
    
    # Application Information Template
    application_type = db.Column(db.String(50), default='external')  # internal, external, email
    application_email = db.Column(db.String(120))
    application_url = db.Column(db.String(255))
    application_instructions = db.Column(db.Text)
    requires_resume = db.Column(db.Boolean, default=True)
    requires_cover_letter = db.Column(db.Boolean, default=False)
    requires_portfolio = db.Column(db.Boolean, default=False)
    
    # Template Settings
    is_active = db.Column(db.Boolean, default=True)
    is_public = db.Column(db.Boolean, default=False)  # Whether other users can use this template
    tags = db.Column(db.Text)  # JSON string of tags
    
    # Usage Statistics
    usage_count = db.Column(db.Integer, default=0)
    last_used = db.Column(db.DateTime)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = db.relationship('User', backref='job_templates')
    category = db.relationship('JobCategory', backref='job_templates')
    
    def to_dict(self, include_usage_stats=False):
        """Convert template to dictionary"""
        data = {
            'id': self.id,
            'created_by': self.created_by,
            'category_id': self.category_id,
            'name': self.name,
            'description': self.description,
            'title': self.title,
            'summary': self.summary,
            'job_description': self.job_description,
            'requirements': self.requirements,
            'preferred_skills': self.preferred_skills,
            'employment_type': self.employment_type,
            'experience_level': self.experience_level,
            'education_requirement': self.education_requirement,
            'location_type': self.location_type,
            'location_city': self.location_city,
            'location_state': self.location_state,
            'location_country': self.location_country,
            'salary_min': self.salary_min,
            'salary_max': self.salary_max,
            'salary_currency': self.salary_currency,
            'salary_period': self.salary_period,
            'salary_negotiable': self.salary_negotiable,
            'show_salary': self.show_salary,
            'application_type': self.application_type,
            'application_email': self.application_email,
            'application_url': self.application_url,
            'application_instructions': self.application_instructions,
            'requires_resume': self.requires_resume,
            'requires_cover_letter': self.requires_cover_letter,
            'requires_portfolio': self.requires_portfolio,
            'is_active': self.is_active,
            'is_public': self.is_public,
            'tags': json.loads(self.tags) if self.tags else [],
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'last_used': self.last_used.isoformat() if self.last_used else None
        }
        
        if include_usage_stats:
            data['usage_count'] = self.usage_count
        
        # Add related data
        if self.category:
            data['category'] = self.category.to_dict()
        
        if self.creator:
            data['creator'] = {
                'id': self.creator.id,
                'name': f"{self.creator.first_name} {self.creator.last_name}",
                'email': self.creator.email
            }
        
        return data
    
    def increment_usage(self):
        """Increment usage count and update last used timestamp"""
        self.usage_count += 1
        self.last_used = datetime.utcnow()
    
    def get_tags_list(self):
        """Get tags as a list"""
        if self.tags:
            try:
                return json.loads(self.tags)
            except json.JSONDecodeError:
                return []
        return []
    
    def set_tags_list(self, tags_list):
        """Set tags from a list"""
        if isinstance(tags_list, list):
            self.tags = json.dumps(tags_list)
        else:
            self.tags = json.dumps([])
    
    def __repr__(self):
        return f'<JobTemplate {self.name}>'
