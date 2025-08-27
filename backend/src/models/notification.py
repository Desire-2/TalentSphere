from src.models.user import db
from datetime import datetime

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Notification Content
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(50), nullable=False)  # application_status, job_alert, system, promotion
    
    # Notification Data
    data = db.Column(db.Text)  # JSON string for additional notification data
    
    # Related Objects
    related_job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'))
    related_application_id = db.Column(db.Integer, db.ForeignKey('applications.id'))
    related_company_id = db.Column(db.Integer, db.ForeignKey('companies.id'))
    
    # Notification Status
    is_read = db.Column(db.Boolean, default=False)
    is_sent = db.Column(db.Boolean, default=False)  # For email/SMS notifications
    
    # Delivery Channels
    send_email = db.Column(db.Boolean, default=False)
    send_sms = db.Column(db.Boolean, default=False)
    send_push = db.Column(db.Boolean, default=True)
    
    # Priority and Scheduling
    priority = db.Column(db.String(20), default='normal')  # low, normal, high, urgent
    scheduled_for = db.Column(db.DateTime)  # For scheduled notifications
    
    # Action Information
    action_url = db.Column(db.String(255))  # URL to redirect when notification is clicked
    action_text = db.Column(db.String(100))  # Text for action button
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    read_at = db.Column(db.DateTime)
    sent_at = db.Column(db.DateTime)
    
    # Relationships
    related_job = db.relationship('Job', backref='notifications')
    related_application = db.relationship('Application', backref='notifications')
    related_company = db.relationship('Company', backref='notifications')
    
    def mark_as_read(self):
        """Mark notification as read"""
        self.is_read = True
        self.read_at = datetime.utcnow()
        db.session.commit()
    
    def mark_as_sent(self):
        """Mark notification as sent"""
        self.is_sent = True
        self.sent_at = datetime.utcnow()
        db.session.commit()
    
    def get_priority_color(self):
        """Get color for notification priority"""
        colors = {
            'low': 'gray',
            'normal': 'blue',
            'high': 'orange',
            'urgent': 'red'
        }
        return colors.get(self.priority, 'blue')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'notification_type': self.notification_type,
            'data': self.data,
            'related_job_id': self.related_job_id,
            'related_application_id': self.related_application_id,
            'related_company_id': self.related_company_id,
            'is_read': self.is_read,
            'is_sent': self.is_sent,
            'priority': self.priority,
            'priority_color': self.get_priority_color(),
            'action_url': self.action_url,
            'action_text': self.action_text,
            'created_at': self.created_at.isoformat(),
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None
        }


class NotificationTemplate(db.Model):
    __tablename__ = 'notification_templates'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Template Information
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    notification_type = db.Column(db.String(50), nullable=False)
    
    # Template Content
    title_template = db.Column(db.String(200), nullable=False)
    message_template = db.Column(db.Text, nullable=False)
    email_subject_template = db.Column(db.String(200))
    email_body_template = db.Column(db.Text)
    sms_template = db.Column(db.Text)
    
    # Template Settings
    is_active = db.Column(db.Boolean, default=True)
    default_priority = db.Column(db.String(20), default='normal')
    
    # Delivery Settings
    default_send_email = db.Column(db.Boolean, default=False)
    default_send_sms = db.Column(db.Boolean, default=False)
    default_send_push = db.Column(db.Boolean, default=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'notification_type': self.notification_type,
            'title_template': self.title_template,
            'message_template': self.message_template,
            'email_subject_template': self.email_subject_template,
            'email_body_template': self.email_body_template,
            'sms_template': self.sms_template,
            'is_active': self.is_active,
            'default_priority': self.default_priority,
            'default_delivery': {
                'email': self.default_send_email,
                'sms': self.default_send_sms,
                'push': self.default_send_push
            },
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class Review(db.Model):
    __tablename__ = 'reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    reviewer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    reviewee_id = db.Column(db.Integer, db.ForeignKey('users.id'))  # For user reviews
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'))  # For company reviews
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'))  # Related job (optional)
    
    # Review Content
    rating = db.Column(db.Integer, nullable=False)  # 1-5 stars
    title = db.Column(db.String(200))
    review_text = db.Column(db.Text)
    
    # Review Categories (for company reviews)
    work_life_balance = db.Column(db.Integer)  # 1-5 rating
    compensation = db.Column(db.Integer)  # 1-5 rating
    career_growth = db.Column(db.Integer)  # 1-5 rating
    management = db.Column(db.Integer)  # 1-5 rating
    culture = db.Column(db.Integer)  # 1-5 rating
    
    # Review Type and Context
    review_type = db.Column(db.String(50), nullable=False)  # company, user, interview_experience
    employment_status = db.Column(db.String(50))  # current_employee, former_employee, interviewed
    job_title = db.Column(db.String(100))
    department = db.Column(db.String(100))
    employment_duration = db.Column(db.String(50))  # e.g., "2 years", "6 months"
    
    # Review Status
    is_approved = db.Column(db.Boolean, default=False)
    is_featured = db.Column(db.Boolean, default=False)
    is_anonymous = db.Column(db.Boolean, default=False)
    
    # Moderation
    moderation_status = db.Column(db.String(50), default='pending')  # pending, approved, rejected
    moderation_notes = db.Column(db.Text)
    moderated_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    moderated_at = db.Column(db.DateTime)
    
    # Helpful Votes
    helpful_count = db.Column(db.Integer, default=0)
    not_helpful_count = db.Column(db.Integer, default=0)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    moderator = db.relationship('User', foreign_keys=[moderated_by], backref='moderated_reviews')
    
    def get_overall_rating(self):
        """Calculate overall rating from category ratings"""
        if self.review_type == 'company':
            ratings = [
                self.work_life_balance,
                self.compensation,
                self.career_growth,
                self.management,
                self.culture
            ]
            valid_ratings = [r for r in ratings if r is not None]
            if valid_ratings:
                return sum(valid_ratings) / len(valid_ratings)
        return self.rating
    
    def get_helpfulness_ratio(self):
        """Calculate helpfulness ratio"""
        total_votes = self.helpful_count + self.not_helpful_count
        if total_votes == 0:
            return 0
        return (self.helpful_count / total_votes) * 100
    
    def to_dict(self, include_reviewer=False):
        data = {
            'id': self.id,
            'reviewer_id': self.reviewer_id if not self.is_anonymous else None,
            'reviewee_id': self.reviewee_id,
            'company_id': self.company_id,
            'job_id': self.job_id,
            'rating': self.rating,
            'title': self.title,
            'review_text': self.review_text,
            'review_type': self.review_type,
            'employment_status': self.employment_status,
            'job_title': self.job_title,
            'department': self.department,
            'employment_duration': self.employment_duration,
            'is_approved': self.is_approved,
            'is_featured': self.is_featured,
            'is_anonymous': self.is_anonymous,
            'helpful_count': self.helpful_count,
            'not_helpful_count': self.not_helpful_count,
            'helpfulness_ratio': round(self.get_helpfulness_ratio(), 2),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        if self.review_type == 'company':
            data.update({
                'category_ratings': {
                    'work_life_balance': self.work_life_balance,
                    'compensation': self.compensation,
                    'career_growth': self.career_growth,
                    'management': self.management,
                    'culture': self.culture
                },
                'overall_rating': round(self.get_overall_rating(), 2)
            })
        
        return data


class ReviewVote(db.Model):
    __tablename__ = 'review_votes'
    
    id = db.Column(db.Integer, primary_key=True)
    review_id = db.Column(db.Integer, db.ForeignKey('reviews.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Vote Information
    is_helpful = db.Column(db.Boolean, nullable=False)  # True for helpful, False for not helpful
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Unique constraint to prevent duplicate votes
    __table_args__ = (db.UniqueConstraint('review_id', 'user_id', name='unique_review_vote'),)
    
    # Relationships
    review = db.relationship('Review', backref='votes')
    user = db.relationship('User', backref='review_votes')
    
    def to_dict(self):
        return {
            'id': self.id,
            'review_id': self.review_id,
            'user_id': self.user_id,
            'is_helpful': self.is_helpful,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class Message(db.Model):
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    recipient_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Message Content
    subject = db.Column(db.String(200))
    message = db.Column(db.Text, nullable=False)
    
    # Message Context
    related_job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'))
    related_application_id = db.Column(db.Integer, db.ForeignKey('applications.id'))
    message_type = db.Column(db.String(50), default='general')  # general, job_inquiry, application_update
    
    # Message Status
    is_read = db.Column(db.Boolean, default=False)
    is_archived = db.Column(db.Boolean, default=False)
    
    # Attachments
    attachments = db.Column(db.Text)  # JSON string of attachment URLs
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    read_at = db.Column(db.DateTime)
    
    # Relationships
    sender = db.relationship('User', foreign_keys=[sender_id], backref='sent_messages')
    recipient = db.relationship('User', foreign_keys=[recipient_id], backref='received_messages')
    related_job = db.relationship('Job', backref='messages')
    related_application = db.relationship('Application', backref='messages')
    
    def mark_as_read(self):
        """Mark message as read"""
        self.is_read = True
        self.read_at = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self, for_user_id=None):
        data = {
            'id': self.id,
            'sender_id': self.sender_id,
            'recipient_id': self.recipient_id,
            'subject': self.subject,
            'message': self.message,
            'related_job_id': self.related_job_id,
            'related_application_id': self.related_application_id,
            'message_type': self.message_type,
            'is_read': self.is_read,
            'is_archived': self.is_archived,
            'attachments': self.attachments,
            'created_at': self.created_at.isoformat(),
            'read_at': self.read_at.isoformat() if self.read_at else None
        }
        
        # Add direction information if user_id is provided
        if for_user_id:
            data['direction'] = 'sent' if self.sender_id == for_user_id else 'received'
        
        return data

