from src.models.user import db
from datetime import datetime

class ScholarshipShare(db.Model):
    """Model to track scholarship sharing for analytics and engagement"""
    __tablename__ = 'scholarship_shares'
    
    id = db.Column(db.Integer, primary_key=True)
    scholarship_id = db.Column(db.Integer, db.ForeignKey('scholarships.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Nullable for anonymous shares
    
    # Share details
    platform = db.Column(db.String(50), nullable=False)  # linkedin, twitter, facebook, whatsapp, email, etc.
    custom_message = db.Column(db.Text)  # Custom message used when sharing
    recipient_info = db.Column(db.String(255))  # Email or recipient identifier if applicable
    
    # Tracking information
    share_url = db.Column(db.String(500))  # The URL that was shared (may include UTM parameters)
    user_agent = db.Column(db.String(500))  # Browser/device information
    ip_address = db.Column(db.String(45))  # IPv4 or IPv6
    referrer = db.Column(db.String(500))  # Where the share action originated from
    
    # Engagement tracking
    click_count = db.Column(db.Integer, default=0)  # How many times the shared link was clicked
    conversion_count = db.Column(db.Integer, default=0)  # How many applications resulted from this share
    
    # Metadata
    extra_data = db.Column(db.Text)  # JSON string for additional data
    
    # Timestamps
    shared_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    last_click_at = db.Column(db.DateTime)  # Last time someone clicked the shared link
    
    # Relationships
    scholarship = db.relationship('Scholarship', backref=db.backref('shares', lazy='dynamic', cascade='all, delete-orphan'))
    user = db.relationship('User', backref=db.backref('scholarship_shares', lazy='dynamic'))
    
    def to_dict(self):
        """Convert share record to dictionary"""
        return {
            'id': self.id,
            'scholarship_id': self.scholarship_id,
            'user_id': self.user_id,
            'platform': self.platform,
            'custom_message': self.custom_message,
            'recipient_info': self.recipient_info,
            'share_url': self.share_url,
            'click_count': self.click_count,
            'conversion_count': self.conversion_count,
            'shared_at': self.shared_at.isoformat(),
            'last_click_at': self.last_click_at.isoformat() if self.last_click_at else None
        }
    
    @staticmethod
    def get_scholarship_share_stats(scholarship_id):
        """Get sharing statistics for a scholarship"""
        shares = ScholarshipShare.query.filter_by(scholarship_id=scholarship_id).all()
        
        if not shares:
            return {
                'total_shares': 0,
                'platforms': {},
                'total_clicks': 0,
                'total_conversions': 0
            }
        
        platforms = {}
        total_clicks = 0
        total_conversions = 0
        
        for share in shares:
            platform = share.platform
            if platform not in platforms:
                platforms[platform] = {
                    'count': 0,
                    'clicks': 0,
                    'conversions': 0
                }
            
            platforms[platform]['count'] += 1
            platforms[platform]['clicks'] += share.click_count
            platforms[platform]['conversions'] += share.conversion_count
            
            total_clicks += share.click_count
            total_conversions += share.conversion_count
        
        return {
            'total_shares': len(shares),
            'platforms': platforms,
            'total_clicks': total_clicks,
            'total_conversions': total_conversions,
            'most_shared_platform': max(platforms.items(), key=lambda x: x[1]['count'])[0] if platforms else None
        }
    
    @staticmethod
    def get_top_shared_scholarships(limit=10):
        """Get most shared scholarships"""
        from sqlalchemy import func
        
        results = db.session.query(
            ScholarshipShare.scholarship_id,
            func.count(ScholarshipShare.id).label('share_count'),
            func.sum(ScholarshipShare.click_count).label('total_clicks')
        ).group_by(
            ScholarshipShare.scholarship_id
        ).order_by(
            func.count(ScholarshipShare.id).desc()
        ).limit(limit).all()
        
        return [{
            'scholarship_id': r.scholarship_id,
            'share_count': r.share_count,
            'total_clicks': r.total_clicks or 0
        } for r in results]
    
    @staticmethod
    def get_platform_stats():
        """Get overall platform statistics"""
        from sqlalchemy import func
        
        results = db.session.query(
            ScholarshipShare.platform,
            func.count(ScholarshipShare.id).label('count'),
            func.sum(ScholarshipShare.click_count).label('clicks')
        ).group_by(
            ScholarshipShare.platform
        ).all()
        
        return [{
            'platform': r.platform,
            'share_count': r.count,
            'total_clicks': r.clicks or 0
        } for r in results]
    
    def __repr__(self):
        return f'<ScholarshipShare {self.id}: {self.platform} - Scholarship {self.scholarship_id}>'
