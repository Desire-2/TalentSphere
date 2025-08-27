from src.models.user import db
from datetime import datetime

class Company(db.Model):
    __tablename__ = 'companies'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Basic Information
    name = db.Column(db.String(200), nullable=False, index=True)
    slug = db.Column(db.String(200), unique=True, nullable=False, index=True)
    description = db.Column(db.Text)
    tagline = db.Column(db.String(255))
    
    # Contact Information
    website = db.Column(db.String(255))
    email = db.Column(db.String(120))
    phone = db.Column(db.String(20))
    
    # Address Information
    address_line1 = db.Column(db.String(255))
    address_line2 = db.Column(db.String(255))
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    country = db.Column(db.String(100))
    postal_code = db.Column(db.String(20))
    
    # Company Details
    industry = db.Column(db.String(100))
    company_size = db.Column(db.String(50))  # 1-10, 11-50, 51-200, 201-500, 500+
    founded_year = db.Column(db.Integer)
    company_type = db.Column(db.String(50))  # startup, corporation, non-profit, government
    
    # Media
    logo_url = db.Column(db.String(255))
    cover_image_url = db.Column(db.String(255))
    gallery_images = db.Column(db.Text)  # JSON string of image URLs
    
    # Social Media
    linkedin_url = db.Column(db.String(255))
    twitter_url = db.Column(db.String(255))
    facebook_url = db.Column(db.String(255))
    instagram_url = db.Column(db.String(255))
    
    # Verification and Status
    is_verified = db.Column(db.Boolean, default=False)
    is_featured = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    verification_documents = db.Column(db.Text)  # JSON string of document URLs
    
    # SEO and Marketing
    meta_title = db.Column(db.String(255))
    meta_description = db.Column(db.Text)
    keywords = db.Column(db.Text)  # JSON string of keywords
    
    # Statistics
    total_jobs_posted = db.Column(db.Integer, default=0)
    total_employees_hired = db.Column(db.Integer, default=0)
    profile_views = db.Column(db.Integer, default=0)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    employer_profiles = db.relationship('EmployerProfile', backref='company', lazy='dynamic')
    jobs = db.relationship('Job', backref='company', lazy='dynamic', cascade='all, delete-orphan')
    featured_ads = db.relationship('FeaturedAd', backref='company', lazy='dynamic', cascade='all, delete-orphan')
    reviews = db.relationship('Review', foreign_keys='Review.company_id', backref='company', lazy='dynamic')
    
    def get_active_jobs_count(self):
        """Get count of active job postings"""
        return self.jobs.filter_by(is_active=True).count()
    
    def get_average_rating(self):
        """Calculate average rating from reviews"""
        reviews = self.reviews.all()
        if not reviews:
            return 0
        return sum(review.rating for review in reviews) / len(reviews)
    
    def get_full_address(self):
        """Get formatted full address"""
        address_parts = [
            self.address_line1,
            self.address_line2,
            self.city,
            self.state,
            self.postal_code,
            self.country
        ]
        return ', '.join(filter(None, address_parts))
    
    def to_dict(self, include_stats=False):
        """Convert company to dictionary"""
        data = {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'description': self.description,
            'tagline': self.tagline,
            'website': self.website,
            'email': self.email,
            'phone': self.phone,
            'address': {
                'line1': self.address_line1,
                'line2': self.address_line2,
                'city': self.city,
                'state': self.state,
                'country': self.country,
                'postal_code': self.postal_code,
                'full_address': self.get_full_address()
            },
            'industry': self.industry,
            'company_size': self.company_size,
            'founded_year': self.founded_year,
            'company_type': self.company_type,
            'logo_url': self.logo_url,
            'cover_image_url': self.cover_image_url,
            'social_media': {
                'linkedin': self.linkedin_url,
                'twitter': self.twitter_url,
                'facebook': self.facebook_url,
                'instagram': self.instagram_url
            },
            'is_verified': self.is_verified,
            'is_featured': self.is_featured,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        if include_stats:
            data.update({
                'statistics': {
                    'total_jobs_posted': self.total_jobs_posted,
                    'active_jobs': self.get_active_jobs_count(),
                    'total_employees_hired': self.total_employees_hired,
                    'profile_views': self.profile_views,
                    'average_rating': round(self.get_average_rating(), 2)
                }
            })
        
        return data
    
    def __repr__(self):
        return f'<Company {self.name}>'


class CompanyBenefit(db.Model):
    __tablename__ = 'company_benefits'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    
    # Benefit Information
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50))  # health, financial, time-off, professional-development, etc.
    icon = db.Column(db.String(100))  # icon class or URL
    
    # Display Options
    is_highlighted = db.Column(db.Boolean, default=False)
    display_order = db.Column(db.Integer, default=0)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'company_id': self.company_id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'icon': self.icon,
            'is_highlighted': self.is_highlighted,
            'display_order': self.display_order,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class CompanyTeamMember(db.Model):
    __tablename__ = 'company_team_members'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    
    # Member Information
    name = db.Column(db.String(100), nullable=False)
    position = db.Column(db.String(100))
    bio = db.Column(db.Text)
    photo_url = db.Column(db.String(255))
    
    # Contact Information
    email = db.Column(db.String(120))
    linkedin_url = db.Column(db.String(255))
    
    # Display Options
    is_leadership = db.Column(db.Boolean, default=False)
    display_order = db.Column(db.Integer, default=0)
    is_visible = db.Column(db.Boolean, default=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'company_id': self.company_id,
            'name': self.name,
            'position': self.position,
            'bio': self.bio,
            'photo_url': self.photo_url,
            'email': self.email,
            'linkedin_url': self.linkedin_url,
            'is_leadership': self.is_leadership,
            'display_order': self.display_order,
            'is_visible': self.is_visible,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

