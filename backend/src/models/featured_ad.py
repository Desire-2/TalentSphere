from src.models.user import db
from datetime import datetime, timedelta
from sqlalchemy import Numeric
import uuid

class FeaturedAdPackage(db.Model):
    __tablename__ = 'featured_ad_packages'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Package Information
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    
    # Package Features
    duration_days = db.Column(db.Integer, nullable=False)  # How long the ad stays featured
    priority_level = db.Column(db.Integer, default=1)  # Higher number = higher priority
    includes_homepage = db.Column(db.Boolean, default=False)  # Show on homepage
    includes_category_top = db.Column(db.Boolean, default=False)  # Top of category listings
    includes_search_boost = db.Column(db.Boolean, default=False)  # Boost in search results
    includes_social_media = db.Column(db.Boolean, default=False)  # Social media promotion
    includes_newsletter = db.Column(db.Boolean, default=False)  # Newsletter inclusion
    
    # Pricing
    price = db.Column(Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(3), default='USD')
    
    # Package Settings
    is_active = db.Column(db.Boolean, default=True)
    is_popular = db.Column(db.Boolean, default=False)  # Mark as popular choice
    display_order = db.Column(db.Integer, default=0)
    
    # Limits
    max_jobs_per_purchase = db.Column(db.Integer, default=1)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    featured_ads = db.relationship('FeaturedAd', backref='package', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'duration_days': self.duration_days,
            'priority_level': self.priority_level,
            'features': {
                'homepage': self.includes_homepage,
                'category_top': self.includes_category_top,
                'search_boost': self.includes_search_boost,
                'social_media': self.includes_social_media,
                'newsletter': self.includes_newsletter
            },
            'price': float(self.price),
            'currency': self.currency,
            'is_active': self.is_active,
            'is_popular': self.is_popular,
            'display_order': self.display_order,
            'max_jobs_per_purchase': self.max_jobs_per_purchase,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class FeaturedAd(db.Model):
    __tablename__ = 'featured_ads'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
    package_id = db.Column(db.Integer, db.ForeignKey('featured_ad_packages.id'), nullable=False)
    payment_id = db.Column(db.Integer, db.ForeignKey('payments.id'), nullable=False)
    
    # Ad Campaign Information
    campaign_name = db.Column(db.String(100))
    
    # Duration and Status
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(50), default='pending')  # pending, active, paused, expired, cancelled
    
    # Performance Tracking
    impressions = db.Column(db.Integer, default=0)  # How many times ad was shown
    clicks = db.Column(db.Integer, default=0)  # How many times ad was clicked
    applications_generated = db.Column(db.Integer, default=0)  # Applications from this ad
    
    # Targeting (optional)
    target_locations = db.Column(db.Text)  # JSON string of target locations
    target_keywords = db.Column(db.Text)  # JSON string of target keywords
    
    # Ad Creative (optional custom content)
    custom_title = db.Column(db.String(200))
    custom_description = db.Column(db.Text)
    custom_image_url = db.Column(db.String(255))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    payment = db.relationship('Payment', backref='featured_ads')
    
    def is_active(self):
        """Check if featured ad is currently active"""
        now = datetime.utcnow()
        return (self.status == 'active' and 
                self.start_date <= now <= self.end_date)
    
    def is_expired(self):
        """Check if featured ad has expired"""
        return datetime.utcnow() > self.end_date
    
    def days_remaining(self):
        """Get days remaining for the ad"""
        if self.is_expired():
            return 0
        return (self.end_date - datetime.utcnow()).days
    
    def get_ctr(self):
        """Calculate click-through rate"""
        if self.impressions == 0:
            return 0
        return (self.clicks / self.impressions) * 100
    
    def get_conversion_rate(self):
        """Calculate application conversion rate"""
        if self.clicks == 0:
            return 0
        return (self.applications_generated / self.clicks) * 100
    
    def to_dict(self, include_performance=False):
        data = {
            'id': self.id,
            'company_id': self.company_id,
            'job_id': self.job_id,
            'package_id': self.package_id,
            'payment_id': self.payment_id,
            'campaign_name': self.campaign_name,
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat(),
            'status': self.status,
            'is_active': self.is_active(),
            'is_expired': self.is_expired(),
            'days_remaining': self.days_remaining(),
            'custom_title': self.custom_title,
            'custom_description': self.custom_description,
            'custom_image_url': self.custom_image_url,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        if include_performance:
            data.update({
                'performance': {
                    'impressions': self.impressions,
                    'clicks': self.clicks,
                    'applications_generated': self.applications_generated,
                    'ctr': round(self.get_ctr(), 2),
                    'conversion_rate': round(self.get_conversion_rate(), 2)
                }
            })
        
        return data


class Payment(db.Model):
    __tablename__ = 'payments'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    
    # Payment Information
    payment_id = db.Column(db.String(100), unique=True, nullable=False)  # External payment ID
    transaction_id = db.Column(db.String(100), unique=True)  # Internal transaction ID
    
    # Payment Details
    amount = db.Column(Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(3), default='USD')
    payment_method = db.Column(db.String(50))  # credit_card, paypal, bank_transfer, etc.
    
    # Payment Status
    status = db.Column(db.String(50), default='pending')  # pending, completed, failed, refunded, cancelled
    
    # Payment Gateway Information
    gateway = db.Column(db.String(50))  # stripe, paypal, razorpay, etc.
    gateway_transaction_id = db.Column(db.String(255))
    gateway_response = db.Column(db.Text)  # JSON string of gateway response
    
    # Invoice Information
    invoice_number = db.Column(db.String(50), unique=True)
    invoice_url = db.Column(db.String(255))
    
    # Payment Purpose
    purpose = db.Column(db.String(100), default='featured_ad')  # featured_ad, subscription, etc.
    description = db.Column(db.Text)
    
    # Billing Information
    billing_name = db.Column(db.String(100))
    billing_email = db.Column(db.String(120))
    billing_address = db.Column(db.Text)
    tax_amount = db.Column(Numeric(10, 2), default=0)
    discount_amount = db.Column(Numeric(10, 2), default=0)
    
    # Refund Information
    refund_amount = db.Column(Numeric(10, 2), default=0)
    refund_reason = db.Column(db.Text)
    refunded_at = db.Column(db.DateTime)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    paid_at = db.Column(db.DateTime)
    
    # Relationships
    user = db.relationship('User', backref='payments')
    company = db.relationship('Company', backref='payments')
    
    def __init__(self, **kwargs):
        super(Payment, self).__init__(**kwargs)
        if not self.transaction_id:
            self.transaction_id = str(uuid.uuid4())
        if not self.invoice_number:
            self.invoice_number = f"INV-{datetime.utcnow().strftime('%Y%m%d')}-{self.id or uuid.uuid4().hex[:8].upper()}"
    
    def get_total_amount(self):
        """Get total amount including tax minus discount"""
        return float(self.amount) + float(self.tax_amount or 0) - float(self.discount_amount or 0)
    
    def is_successful(self):
        """Check if payment was successful"""
        return self.status == 'completed'
    
    def is_refundable(self):
        """Check if payment can be refunded"""
        return (self.status == 'completed' and 
                float(self.refund_amount or 0) < float(self.amount))
    
    def to_dict(self, include_sensitive=False):
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'company_id': self.company_id,
            'payment_id': self.payment_id,
            'transaction_id': self.transaction_id,
            'amount': float(self.amount),
            'currency': self.currency,
            'payment_method': self.payment_method,
            'status': self.status,
            'gateway': self.gateway,
            'invoice_number': self.invoice_number,
            'invoice_url': self.invoice_url,
            'purpose': self.purpose,
            'description': self.description,
            'billing_name': self.billing_name,
            'billing_email': self.billing_email,
            'tax_amount': float(self.tax_amount or 0),
            'discount_amount': float(self.discount_amount or 0),
            'total_amount': self.get_total_amount(),
            'refund_amount': float(self.refund_amount or 0),
            'is_successful': self.is_successful(),
            'is_refundable': self.is_refundable(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'refunded_at': self.refunded_at.isoformat() if self.refunded_at else None
        }
        
        if include_sensitive:
            data.update({
                'gateway_transaction_id': self.gateway_transaction_id,
                'gateway_response': self.gateway_response,
                'billing_address': self.billing_address,
                'refund_reason': self.refund_reason
            })
        
        return data


class Subscription(db.Model):
    __tablename__ = 'subscriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    
    # Subscription Information
    plan_name = db.Column(db.String(100), nullable=False)
    plan_type = db.Column(db.String(50), default='monthly')  # monthly, yearly
    
    # Subscription Features
    job_posts_limit = db.Column(db.Integer, default=5)  # Number of job posts allowed
    featured_ads_limit = db.Column(db.Integer, default=0)  # Number of featured ads allowed
    applications_limit = db.Column(db.Integer, default=100)  # Number of applications allowed
    
    # Pricing
    price = db.Column(Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(3), default='USD')
    
    # Subscription Status
    status = db.Column(db.String(50), default='active')  # active, cancelled, expired, suspended
    
    # Subscription Period
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    next_billing_date = db.Column(db.DateTime)
    
    # Usage Tracking
    job_posts_used = db.Column(db.Integer, default=0)
    featured_ads_used = db.Column(db.Integer, default=0)
    applications_received = db.Column(db.Integer, default=0)
    
    # Payment Information
    payment_method_id = db.Column(db.String(255))  # Stored payment method ID
    last_payment_id = db.Column(db.Integer, db.ForeignKey('payments.id'))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    cancelled_at = db.Column(db.DateTime)
    
    # Relationships
    company = db.relationship('Company', backref='subscriptions')
    last_payment = db.relationship('Payment', backref='subscriptions')
    
    def is_active(self):
        """Check if subscription is currently active"""
        return (self.status == 'active' and 
                datetime.utcnow() <= self.end_date)
    
    def is_expired(self):
        """Check if subscription has expired"""
        return datetime.utcnow() > self.end_date
    
    def days_remaining(self):
        """Get days remaining in subscription"""
        if self.is_expired():
            return 0
        return (self.end_date - datetime.utcnow()).days
    
    def can_post_job(self):
        """Check if company can post more jobs"""
        return self.job_posts_used < self.job_posts_limit
    
    def can_create_featured_ad(self):
        """Check if company can create more featured ads"""
        return self.featured_ads_used < self.featured_ads_limit
    
    def to_dict(self):
        return {
            'id': self.id,
            'company_id': self.company_id,
            'plan_name': self.plan_name,
            'plan_type': self.plan_type,
            'limits': {
                'job_posts': self.job_posts_limit,
                'featured_ads': self.featured_ads_limit,
                'applications': self.applications_limit
            },
            'usage': {
                'job_posts_used': self.job_posts_used,
                'featured_ads_used': self.featured_ads_used,
                'applications_received': self.applications_received
            },
            'price': float(self.price),
            'currency': self.currency,
            'status': self.status,
            'is_active': self.is_active(),
            'is_expired': self.is_expired(),
            'days_remaining': self.days_remaining(),
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat(),
            'next_billing_date': self.next_billing_date.isoformat() if self.next_billing_date else None,
            'can_post_job': self.can_post_job(),
            'can_create_featured_ad': self.can_create_featured_ad(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None
        }

