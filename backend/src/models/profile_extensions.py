"""
Extended profile models for comprehensive job seeker profiles
Includes work experience, education, certifications, projects, awards, etc.
"""
from datetime import datetime
from src.models.user import db

class WorkExperience(db.Model):
    """Model for job seeker work experience history"""
    __tablename__ = 'work_experiences'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Job Details
    job_title = db.Column(db.String(150), nullable=False)
    company_name = db.Column(db.String(150), nullable=False)
    company_location = db.Column(db.String(150))
    employment_type = db.Column(db.String(50))  # full-time, part-time, contract, internship, etc.
    
    # Dates
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date)  # NULL if current position
    is_current = db.Column(db.Boolean, default=False)
    
    # Details
    description = db.Column(db.Text)
    key_responsibilities = db.Column(db.Text)  # JSON array of responsibilities
    achievements = db.Column(db.Text)  # JSON array of quantifiable achievements
    technologies_used = db.Column(db.Text)  # JSON array of technologies/skills
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Display order
    display_order = db.Column(db.Integer, default=0)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('work_experiences', lazy='dynamic', cascade='all, delete-orphan'))
    
    def to_dict(self):
        import json
        return {
            'id': self.id,
            'user_id': self.user_id,
            'job_title': self.job_title,
            'company_name': self.company_name,
            'company_location': self.company_location,
            'employment_type': self.employment_type,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'is_current': self.is_current,
            'description': self.description,
            'key_responsibilities': json.loads(self.key_responsibilities) if self.key_responsibilities else [],
            'achievements': json.loads(self.achievements) if self.achievements else [],
            'technologies_used': json.loads(self.technologies_used) if self.technologies_used else [],
            'display_order': self.display_order,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class Education(db.Model):
    """Model for job seeker education history"""
    __tablename__ = 'educations'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Institution Details
    institution_name = db.Column(db.String(200), nullable=False)
    institution_location = db.Column(db.String(150))
    
    # Degree Details
    degree_type = db.Column(db.String(50))  # bachelor, master, phd, associate, certificate, etc.
    field_of_study = db.Column(db.String(150))
    degree_title = db.Column(db.String(200))  # e.g., "Bachelor of Science in Computer Science"
    
    # Dates
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    graduation_date = db.Column(db.Date)
    is_current = db.Column(db.Boolean, default=False)
    
    # Academic Performance
    gpa = db.Column(db.Float)
    gpa_scale = db.Column(db.Float, default=4.0)
    honors = db.Column(db.String(100))  # cum laude, magna cum laude, etc.
    
    # Additional Details
    relevant_coursework = db.Column(db.Text)  # JSON array
    activities = db.Column(db.Text)  # Clubs, societies, etc.
    description = db.Column(db.Text)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Display order
    display_order = db.Column(db.Integer, default=0)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('educations', lazy='dynamic', cascade='all, delete-orphan'))
    
    def to_dict(self):
        import json
        return {
            'id': self.id,
            'user_id': self.user_id,
            'institution_name': self.institution_name,
            'institution_location': self.institution_location,
            'degree_type': self.degree_type,
            'field_of_study': self.field_of_study,
            'degree_title': self.degree_title,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'graduation_date': self.graduation_date.isoformat() if self.graduation_date else None,
            'is_current': self.is_current,
            'gpa': self.gpa,
            'gpa_scale': self.gpa_scale,
            'honors': self.honors,
            'relevant_coursework': json.loads(self.relevant_coursework) if self.relevant_coursework else [],
            'activities': self.activities,
            'description': self.description,
            'display_order': self.display_order,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class Certification(db.Model):
    """Model for professional certifications and licenses"""
    __tablename__ = 'certifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Certification Details
    name = db.Column(db.String(200), nullable=False)
    issuing_organization = db.Column(db.String(200), nullable=False)
    credential_id = db.Column(db.String(100))
    credential_url = db.Column(db.String(255))
    
    # Dates
    issue_date = db.Column(db.Date)
    expiry_date = db.Column(db.Date)
    does_not_expire = db.Column(db.Boolean, default=False)
    
    # Additional Details
    description = db.Column(db.Text)
    skills_acquired = db.Column(db.Text)  # JSON array
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Display order
    display_order = db.Column(db.Integer, default=0)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('certifications', lazy='dynamic', cascade='all, delete-orphan'))
    
    def to_dict(self):
        import json
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'issuing_organization': self.issuing_organization,
            'credential_id': self.credential_id,
            'credential_url': self.credential_url,
            'issue_date': self.issue_date.isoformat() if self.issue_date else None,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'does_not_expire': self.does_not_expire,
            'description': self.description,
            'skills_acquired': json.loads(self.skills_acquired) if self.skills_acquired else [],
            'display_order': self.display_order,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class Project(db.Model):
    """Model for professional projects and portfolio items"""
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Project Details
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    role = db.Column(db.String(100))  # Your role in the project
    
    # Links
    project_url = db.Column(db.String(255))
    github_url = db.Column(db.String(255))
    demo_url = db.Column(db.String(255))
    
    # Dates
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    is_ongoing = db.Column(db.Boolean, default=False)
    
    # Additional Details
    technologies_used = db.Column(db.Text)  # JSON array
    key_features = db.Column(db.Text)  # JSON array
    outcomes = db.Column(db.Text)  # Quantifiable results
    team_size = db.Column(db.Integer)
    
    # Media
    images = db.Column(db.Text)  # JSON array of image URLs
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Display order
    display_order = db.Column(db.Integer, default=0)
    is_featured = db.Column(db.Boolean, default=False)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('projects', lazy='dynamic', cascade='all, delete-orphan'))
    
    def to_dict(self):
        import json
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'description': self.description,
            'role': self.role,
            'project_url': self.project_url,
            'github_url': self.github_url,
            'demo_url': self.demo_url,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'is_ongoing': self.is_ongoing,
            'technologies_used': json.loads(self.technologies_used) if self.technologies_used else [],
            'key_features': json.loads(self.key_features) if self.key_features else [],
            'outcomes': self.outcomes,
            'team_size': self.team_size,
            'images': json.loads(self.images) if self.images else [],
            'display_order': self.display_order,
            'is_featured': self.is_featured,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class Award(db.Model):
    """Model for awards, honors, and achievements"""
    __tablename__ = 'awards'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Award Details
    title = db.Column(db.String(200), nullable=False)
    issuer = db.Column(db.String(200), nullable=False)
    date_received = db.Column(db.Date)
    description = db.Column(db.Text)
    
    # Additional Details
    award_url = db.Column(db.String(255))
    certificate_url = db.Column(db.String(255))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Display order
    display_order = db.Column(db.Integer, default=0)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('awards', lazy='dynamic', cascade='all, delete-orphan'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'issuer': self.issuer,
            'date_received': self.date_received.isoformat() if self.date_received else None,
            'description': self.description,
            'award_url': self.award_url,
            'certificate_url': self.certificate_url,
            'display_order': self.display_order,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class Language(db.Model):
    """Model for language proficiency"""
    __tablename__ = 'languages'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Language Details
    language = db.Column(db.String(100), nullable=False)
    proficiency_level = db.Column(db.String(50), nullable=False)  # native, fluent, advanced, intermediate, basic
    
    # Certifications
    certification = db.Column(db.String(200))  # e.g., TOEFL, IELTS score
    certification_score = db.Column(db.String(50))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Display order
    display_order = db.Column(db.Integer, default=0)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('languages', lazy='dynamic', cascade='all, delete-orphan'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'language': self.language,
            'proficiency_level': self.proficiency_level,
            'certification': self.certification,
            'certification_score': self.certification_score,
            'display_order': self.display_order,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class VolunteerExperience(db.Model):
    """Model for volunteer work and community service"""
    __tablename__ = 'volunteer_experiences'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Organization Details
    organization = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(150), nullable=False)
    cause = db.Column(db.String(100))  # Education, Environment, Healthcare, etc.
    
    # Dates
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    is_current = db.Column(db.Boolean, default=False)
    
    # Details
    description = db.Column(db.Text)
    responsibilities = db.Column(db.Text)  # JSON array
    impact = db.Column(db.Text)  # Quantifiable impact
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Display order
    display_order = db.Column(db.Integer, default=0)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('volunteer_experiences', lazy='dynamic', cascade='all, delete-orphan'))
    
    def to_dict(self):
        import json
        return {
            'id': self.id,
            'user_id': self.user_id,
            'organization': self.organization,
            'role': self.role,
            'cause': self.cause,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'is_current': self.is_current,
            'description': self.description,
            'responsibilities': json.loads(self.responsibilities) if self.responsibilities else [],
            'impact': self.impact,
            'display_order': self.display_order,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class ProfessionalMembership(db.Model):
    """Model for professional associations and memberships"""
    __tablename__ = 'professional_memberships'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Organization Details
    organization_name = db.Column(db.String(200), nullable=False)
    membership_type = db.Column(db.String(100))  # Member, Fellow, Associate, etc.
    member_id = db.Column(db.String(100))
    
    # Dates
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    is_current = db.Column(db.Boolean, default=True)
    
    # Additional Details
    description = db.Column(db.Text)
    organization_url = db.Column(db.String(255))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Display order
    display_order = db.Column(db.Integer, default=0)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('professional_memberships', lazy='dynamic', cascade='all, delete-orphan'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'organization_name': self.organization_name,
            'membership_type': self.membership_type,
            'member_id': self.member_id,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'is_current': self.is_current,
            'description': self.description,
            'organization_url': self.organization_url,
            'display_order': self.display_order,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
