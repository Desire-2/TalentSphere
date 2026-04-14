"""
Custom Advertising System Models - Production Grade
Optimized for high-volume tracking and efficient querying
"""

from src.models.user import db
from datetime import datetime, date
from sqlalchemy import Numeric, Index, Text
import json

# ========================
# CAMPAIGN MODELS
# ========================

class AdCampaign(db.Model):
    """Main campaign container for advertising"""
    __tablename__ = 'ad_campaigns'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Campaign Owner
    employer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Campaign Details
    name = db.Column(db.String(200), nullable=False)
    objective = db.Column(db.String(50), nullable=False)  # AWARENESS, TRAFFIC, ENGAGEMENT, LEADS
    status = db.Column(db.String(50), default='DRAFT', index=True)  # DRAFT, PENDING_REVIEW, ACTIVE, PAUSED, COMPLETED, REJECTED
    
    # Schedule
    start_date = db.Column(db.DateTime)
    end_date = db.Column(db.DateTime)
    
    # Budget
    budget_total = db.Column(Numeric(12, 2), nullable=False)
    budget_spent = db.Column(Numeric(12, 2), default=0)
    
    # Billing
    billing_type = db.Column(db.String(50), nullable=False, default='CPM')  # CPM, CPC, FLAT_RATE
    bid_amount = db.Column(Numeric(10, 4), nullable=False)  # Cost per 1000 impressions or per click
    
    # Targeting Configuration (stored as JSON)
    targeting_json = db.Column(Text)  # JSON: {"locations": [], "keywords": [], "job_categories": []}
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    employer = db.relationship('User', backref='ad_campaigns', foreign_keys=[employer_id])
    creatives = db.relationship('AdCreative', backref='campaign', lazy='dynamic', cascade='all, delete-orphan')
    placements = db.relationship('AdCampaignPlacement', backref='campaign', lazy='dynamic', cascade='all, delete-orphan')
    impressions = db.relationship('AdImpression', backref='campaign', lazy='dynamic', cascade='all, delete-orphan')
    clicks = db.relationship('AdClick', backref='campaign', lazy='dynamic', cascade='all, delete-orphan')
    analytics_daily = db.relationship('AdAnalyticsDaily', backref='campaign', lazy='dynamic', cascade='all, delete-orphan')
    reviews = db.relationship('AdReview', backref='campaign', uselist=False, cascade='all, delete-orphan')
    
    # Indexes
    __table_args__ = (
        Index('idx_employer_status', 'employer_id', 'status'),
        Index('idx_status_dates', 'status', 'start_date', 'end_date'),
    )
    
    def get_targeting(self):
        """Parse targeting JSON"""
        if not self.targeting_json:
            return {}
        try:
            return json.loads(self.targeting_json)
        except:
            return {}
    
    def set_targeting(self, targeting_dict):
        """Store targeting as JSON"""
        self.targeting_json = json.dumps(targeting_dict)
    
    def get_budget_remaining(self):
        """Calculate remaining budget"""
        return float(self.budget_total) - float(self.budget_spent)
    
    def is_budget_exceeded(self):
        """Check if budget is exceeded"""
        return float(self.budget_spent) >= float(self.budget_total)
    
    def is_active(self):
        """Check if campaign is currently active"""
        now = datetime.utcnow()
        return (self.status == 'ACTIVE' and 
                self.start_date <= now and 
                (not self.end_date or now <= self.end_date))
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'employer_id': self.employer_id,
            'name': self.name,
            'objective': self.objective,
            'status': self.status,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'budget_total': float(self.budget_total),
            'budget_spent': float(self.budget_spent),
            'budget_remaining': self.get_budget_remaining(),
            'billing_type': self.billing_type,
            'bid_amount': float(self.bid_amount),
            'is_active': self.is_active(),
            'targeting': self.get_targeting(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<AdCampaign {self.id}: {self.name}>'


# ========================
# CREATIVE MODELS
# ========================

class AdCreative(db.Model):
    """Ad creative content"""
    __tablename__ = 'ad_creatives'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Campaign Association
    campaign_id = db.Column(db.Integer, db.ForeignKey('ad_campaigns.id'), nullable=False, index=True)
    
    # Creative Content
    title = db.Column(db.String(80), nullable=False)
    body_text = db.Column(db.String(200), nullable=False)
    cta_text = db.Column(db.String(30), nullable=False, default='Learn More')
    cta_url = db.Column(db.String(500), nullable=False)
    image_url = db.Column(db.String(500))
    
    # Format & Status
    ad_format = db.Column(db.String(50), nullable=False)  # BANNER_HORIZONTAL, BANNER_VERTICAL, CARD, INLINE_FEED, SPONSORED_JOB, SPOTLIGHT
    is_active = db.Column(db.Boolean, default=True)
    
    # Timestamp
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    impressions = db.relationship('AdImpression', backref='creative', lazy='dynamic', cascade='all, delete-orphan')
    clicks = db.relationship('AdClick', backref='creative', lazy='dynamic', cascade='all, delete-orphan')
    analytics_daily = db.relationship('AdAnalyticsDaily', backref='creative', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'campaign_id': self.campaign_id,
            'title': self.title,
            'body_text': self.body_text,
            'cta_text': self.cta_text,
            'cta_url': self.cta_url,
            'image_url': self.image_url,
            'ad_format': self.ad_format,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<AdCreative {self.id}: {self.title}>'


# ========================
# PLACEMENT MODELS
# ========================

class AdPlacement(db.Model):
    """Available ad placement locations on the platform"""
    __tablename__ = 'ad_placements'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Placement Info
    name = db.Column(db.String(100), nullable=False)
    display_name = db.Column(db.String(150), nullable=False)  # User-friendly display name
    description = db.Column(Text)
    
    # Placement Configuration
    placement_order = db.Column(db.Integer)
    max_ads_per_period = db.Column(db.Integer)
    rotation_interval = db.Column(db.Integer)
    
    # Pricing
    base_cpm = db.Column(Numeric(10, 4))  # Base cost per 1000 impressions
    price_multiplier = db.Column(Numeric(10, 2))
    
    # Features
    is_active = db.Column(db.Boolean, default=True, index=True)
    requires_approval = db.Column(db.Boolean)
    supports_video = db.Column(db.Boolean)
    supports_custom_image = db.Column(db.Boolean)
    recommended_image_width = db.Column(db.Integer)
    recommended_image_height = db.Column(db.Integer)
    max_title_length = db.Column(db.Integer)
    max_description_length = db.Column(db.Integer)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Placement targeting
    placement_key = db.Column(db.String(100), unique=True, index=True)  # e.g., "job_feed_top"
    page_context = db.Column(db.String(50))  # JOB_LISTING, JOB_DETAIL, SCHOLARSHIP_LISTING, DASHBOARD, ALL
    
    # Configuration
    allowed_formats = db.Column(Text)  # JSON array of allowed ad_format values
    max_ads_per_load = db.Column(db.Integer, default=2)
    
    # Relationships
    campaign_placements = db.relationship('AdCampaignPlacement', backref='placement', lazy='dynamic', cascade='all, delete-orphan')
    
    def get_allowed_formats(self):
        """Parse allowed formats JSON"""
        if not self.allowed_formats:
            return []
        try:
            return json.loads(self.allowed_formats)
        except:
            return []
    
    def set_allowed_formats(self, formats_list):
        """Store allowed formats as JSON"""
        self.allowed_formats = json.dumps(formats_list)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'display_name': self.display_name,
            'description': self.description,
            'placement_key': self.placement_key,
            'page_context': self.page_context,
            'allowed_formats': self.get_allowed_formats(),
            'max_ads_per_load': self.max_ads_per_load,
            'is_active': self.is_active
        }
    
    def __repr__(self):
        return f'<AdPlacement {self.id}: {self.placement_key}>'


class AdCampaignPlacement(db.Model):
    """Junction table: which placements a campaign uses"""
    __tablename__ = 'ad_campaign_placements'
    
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('ad_campaigns.id'), nullable=False, index=True)
    placement_id = db.Column(db.Integer, db.ForeignKey('ad_placements.id'), nullable=False)
    
    # Unique constraint on campaign + placement
    __table_args__ = (
        db.UniqueConstraint('campaign_id', 'placement_id', name='unique_campaign_placement'),
    )
    
    def __repr__(self):
        return f'<AdCampaignPlacement {self.id}>'


# ========================
# IMPRESSION & CLICK TRACKING (Write-Optimized, High Volume)
# ========================

class AdImpression(db.Model):
    """High-volume impression tracking - optimized for writes"""
    __tablename__ = 'ad_impressions'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Foreign Keys
    campaign_id = db.Column(db.Integer, db.ForeignKey('ad_campaigns.id'), nullable=False, index=True)
    creative_id = db.Column(db.Integer, db.ForeignKey('ad_creatives.id'), nullable=False, index=True)
    placement_id = db.Column(db.Integer, db.ForeignKey('ad_placements.id'), nullable=False, index=True)
    
    # Viewer Information
    viewer_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Null if anonymous
    ip_hash = db.Column(db.String(64))  # Hashed IP for frequency capping
    session_id = db.Column(db.String(100), index=True)  # Session identifier
    
    # Timestamp (indexed for time-range queries)
    viewed_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    viewer = db.relationship('User', foreign_keys=[viewer_user_id])
    placement = db.relationship('AdPlacement')
    
    # Indexes for common queries
    __table_args__ = (
        Index('idx_campaign_viewed', 'campaign_id', 'viewed_at'),
        Index('idx_placement_viewed', 'placement_id', 'viewed_at'),
        Index('idx_creative_viewed', 'creative_id', 'viewed_at'),
    )
    
    def __repr__(self):
        return f'<AdImpression {self.id}>'


class AdClick(db.Model):
    """Click tracking for ad interactions"""
    __tablename__ = 'ad_clicks'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Foreign Keys
    campaign_id = db.Column(db.Integer, db.ForeignKey('ad_campaigns.id'), nullable=False, index=True)
    creative_id = db.Column(db.Integer, db.ForeignKey('ad_creatives.id'), nullable=False, index=True)
    placement_id = db.Column(db.Integer, db.ForeignKey('ad_placements.id'), nullable=False, index=True)
    
    # Clicker Information
    clicker_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    ip_hash = db.Column(db.String(64))
    session_id = db.Column(db.String(100), index=True)
    
    # Timestamp (indexed for time-range queries)
    clicked_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    clicker = db.relationship('User', foreign_keys=[clicker_user_id])
    placement = db.relationship('AdPlacement')
    
    # Indexes for common queries
    __table_args__ = (
        Index('idx_campaign_clicked', 'campaign_id', 'clicked_at'),
        Index('idx_placement_clicked', 'placement_id', 'clicked_at'),
        Index('idx_creative_clicked', 'creative_id', 'clicked_at'),
    )
    
    def __repr__(self):
        return f'<AdClick {self.id}>'


# ========================
# ANALYTICS MODELS
# ========================

class AdAnalyticsDaily(db.Model):
    """Pre-aggregated daily analytics - rebuilt nightly"""
    __tablename__ = 'ad_analytics_daily'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Foreign Keys
    campaign_id = db.Column(db.Integer, db.ForeignKey('ad_campaigns.id'), nullable=False, index=True)
    creative_id = db.Column(db.Integer, db.ForeignKey('ad_creatives.id'), nullable=False, index=True)
    placement_id = db.Column(db.Integer, db.ForeignKey('ad_placements.id'), nullable=False, index=True)
    
    # Date (indexed heavily for time-range queries)
    date = db.Column(db.Date, nullable=False, index=True)
    
    # Metrics
    impressions = db.Column(db.Integer, default=0)
    clicks = db.Column(db.Integer, default=0)
    ctr = db.Column(Numeric(5, 2))  # Click-through rate (percentage)
    spend = db.Column(Numeric(12, 2), default=0)
    reach = db.Column(db.Integer, default=0)  # Unique viewers
    
    # Composite index for common queries
    __table_args__ = (
        Index('idx_campaign_date', 'campaign_id', 'date'),
        Index('idx_creative_date', 'creative_id', 'date'),
        Index('idx_placement_date', 'placement_id', 'date'),
        db.UniqueConstraint('campaign_id', 'creative_id', 'placement_id', 'date', 
                            name='unique_daily_analytics'),
    )
    
    def calculate_ctr(self):
        """Calculate and update CTR"""
        if self.impressions == 0:
            self.ctr = 0
        else:
            self.ctr = Numeric((float(self.clicks) / float(self.impressions)) * 100)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'campaign_id': self.campaign_id,
            'creative_id': self.creative_id,
            'placement_id': self.placement_id,
            'date': self.date.isoformat(),
            'impressions': self.impressions,
            'clicks': self.clicks,
            'ctr': float(self.ctr) if self.ctr else 0,
            'spend': float(self.spend),
            'reach': self.reach
        }
    
    def __repr__(self):
        return f'<AdAnalyticsDaily {self.date}: {self.campaign_id}>'


# ========================
# BILLING MODELS
# ========================

class AdCredit(db.Model):
    """Billing credits for employers"""
    __tablename__ = 'ad_credits'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Credit Owner
    employer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Transaction Details
    amount = db.Column(Numeric(12, 2), nullable=False)
    transaction_type = db.Column(db.String(50), nullable=False)  # PURCHASE, SPEND, REFUND, BONUS
    reference_id = db.Column(db.String(100))  # Invoice or campaign reference
    note = db.Column(db.Text)
    
    # Timestamp
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    employer = db.relationship('User', backref='ad_credits')
    
    # Index for common queries
    __table_args__ = (
        Index('idx_employer_created', 'employer_id', 'created_at'),
    )
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'employer_id': self.employer_id,
            'amount': float(self.amount),
            'transaction_type': self.transaction_type,
            'reference_id': self.reference_id,
            'note': self.note,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<AdCredit {self.id}: {self.transaction_type}>'


# ========================
# MODERATION MODELS
# ========================

class AdReview(db.Model):
    """Ad moderation and review"""
    __tablename__ = 'ad_reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Campaign Review
    campaign_id = db.Column(db.Integer, db.ForeignKey('ad_campaigns.id'), nullable=False, unique=True)
    
    # Reviewer (nullable if not yet reviewed)
    reviewer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Review Decision
    decision = db.Column(db.String(50), nullable=True)  # APPROVED, REJECTED, NEEDS_CHANGES, or None for pending
    notes = db.Column(db.Text)
    
    # Timestamp
    reviewed_at = db.Column(db.DateTime)
    
    # Relationships
    reviewer = db.relationship('User', backref='ad_reviews', foreign_keys=[reviewer_id])
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'campaign_id': self.campaign_id,
            'reviewer_id': self.reviewer_id,
            'decision': self.decision,
            'notes': self.notes,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None
        }
    
    def __repr__(self):
        return f'<AdReview {self.id}: {self.decision}>'
