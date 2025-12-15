"""
User Notification Preferences Model
Allows users to configure their notification delivery preferences
"""

from src.models.user import db
from datetime import datetime
import json


class NotificationPreference(db.Model):
    __tablename__ = 'notification_preferences'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    
    # Email Preferences
    email_enabled = db.Column(db.Boolean, default=True)
    job_alerts_email = db.Column(db.Boolean, default=True)
    application_status_email = db.Column(db.Boolean, default=True)
    messages_email = db.Column(db.Boolean, default=True)
    interview_reminders_email = db.Column(db.Boolean, default=True)
    deadline_reminders_email = db.Column(db.Boolean, default=True)
    company_updates_email = db.Column(db.Boolean, default=False)
    system_notifications_email = db.Column(db.Boolean, default=True)
    promotions_email = db.Column(db.Boolean, default=False)
    new_features_email = db.Column(db.Boolean, default=True)  # New feature announcements
    platform_updates_email = db.Column(db.Boolean, default=True)  # Platform updates
    
    # In-App Preferences
    push_enabled = db.Column(db.Boolean, default=True)
    job_alerts_push = db.Column(db.Boolean, default=True)
    application_status_push = db.Column(db.Boolean, default=True)
    messages_push = db.Column(db.Boolean, default=True)
    interview_reminders_push = db.Column(db.Boolean, default=True)
    deadline_reminders_push = db.Column(db.Boolean, default=True)
    company_updates_push = db.Column(db.Boolean, default=True)
    system_notifications_push = db.Column(db.Boolean, default=True)
    promotions_push = db.Column(db.Boolean, default=False)
    new_features_push = db.Column(db.Boolean, default=True)  # New feature announcements
    platform_updates_push = db.Column(db.Boolean, default=True)  # Platform updates
    
    # SMS Preferences (for future implementation)
    sms_enabled = db.Column(db.Boolean, default=False)
    interview_reminders_sms = db.Column(db.Boolean, default=False)
    deadline_reminders_sms = db.Column(db.Boolean, default=False)
    
    # Digest Preferences
    weekly_digest_enabled = db.Column(db.Boolean, default=True)
    weekly_digest_day = db.Column(db.String(10), default='monday')  # day of week
    daily_digest_enabled = db.Column(db.Boolean, default=False)
    daily_digest_time = db.Column(db.Time, default=datetime.strptime('09:00', '%H:%M').time())
    
    # Quiet Hours
    quiet_hours_enabled = db.Column(db.Boolean, default=False)
    quiet_hours_start = db.Column(db.Time, default=datetime.strptime('22:00', '%H:%M').time())
    quiet_hours_end = db.Column(db.Time, default=datetime.strptime('08:00', '%H:%M').time())
    quiet_hours_timezone = db.Column(db.String(50), default='UTC')
    
    # Frequency Settings
    max_emails_per_day = db.Column(db.Integer, default=10)
    batch_notifications = db.Column(db.Boolean, default=True)
    immediate_for_urgent = db.Column(db.Boolean, default=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('notification_preferences', uselist=False))
    
    def get_email_preference(self, notification_type: str) -> bool:
        """Get email preference for a specific notification type"""
        if not self.email_enabled:
            return False
        
        preference_map = {
            'job_alert': self.job_alerts_email,
            'application_status': self.application_status_email,
            'message': self.messages_email,
            'interview_reminder': self.interview_reminders_email,
            'deadline_reminder': self.deadline_reminders_email,
            'company_update': self.company_updates_email,
            'system': self.system_notifications_email,
            'promotion': self.promotions_email,
            'new_feature': self.new_features_email,
            'platform_update': self.platform_updates_email
        }
        
        return preference_map.get(notification_type, False)
    
    def get_push_preference(self, notification_type: str) -> bool:
        """Get push notification preference for a specific notification type"""
        if not self.push_enabled:
            return False
        
        preference_map = {
            'job_alert': self.job_alerts_push,
            'application_status': self.application_status_push,
            'message': self.messages_push,
            'interview_reminder': self.interview_reminders_push,
            'deadline_reminder': self.deadline_reminders_push,
            'company_update': self.company_updates_push,
            'system': self.system_notifications_push,
            'promotion': self.promotions_push,
            'new_feature': self.new_features_push,
            'platform_update': self.platform_updates_push
        }
        
        return preference_map.get(notification_type, True)
    
    def is_in_quiet_hours(self, current_time: datetime = None) -> bool:
        """Check if current time is within quiet hours"""
        if not self.quiet_hours_enabled:
            return False
        
        if current_time is None:
            current_time = datetime.utcnow()
        
        current_time_only = current_time.time()
        
        # Handle overnight quiet hours (e.g., 22:00 to 08:00)
        if self.quiet_hours_start > self.quiet_hours_end:
            return current_time_only >= self.quiet_hours_start or current_time_only <= self.quiet_hours_end
        else:
            return self.quiet_hours_start <= current_time_only <= self.quiet_hours_end
    
    def should_send_notification(self, notification_type: str, delivery_method: str, 
                               is_urgent: bool = False, current_time: datetime = None) -> bool:
        """Determine if notification should be sent based on preferences"""
        
        # Always send urgent notifications (unless specifically disabled)
        if is_urgent and self.immediate_for_urgent:
            if delivery_method == 'email':
                return self.get_email_preference(notification_type)
            elif delivery_method == 'push':
                return self.get_push_preference(notification_type)
        
        # Check quiet hours for non-urgent notifications
        if not is_urgent and self.is_in_quiet_hours(current_time):
            return False
        
        # Check specific preferences
        if delivery_method == 'email':
            return self.get_email_preference(notification_type)
        elif delivery_method == 'push':
            return self.get_push_preference(notification_type)
        
        return False
    
    def to_dict(self) -> dict:
        """Convert preferences to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'email_preferences': {
                'enabled': self.email_enabled,
                'job_alerts': self.job_alerts_email,
                'application_status': self.application_status_email,
                'messages': self.messages_email,
                'interview_reminders': self.interview_reminders_email,
                'deadline_reminders': self.deadline_reminders_email,
                'company_updates': self.company_updates_email,
                'system_notifications': self.system_notifications_email,
                'promotions': self.promotions_email
            },
            'push_preferences': {
                'enabled': self.push_enabled,
                'job_alerts': self.job_alerts_push,
                'application_status': self.application_status_push,
                'messages': self.messages_push,
                'interview_reminders': self.interview_reminders_push,
                'deadline_reminders': self.deadline_reminders_push,
                'company_updates': self.company_updates_push,
                'system_notifications': self.system_notifications_push,
                'promotions': self.promotions_push
            },
            'sms_preferences': {
                'enabled': self.sms_enabled,
                'interview_reminders': self.interview_reminders_sms,
                'deadline_reminders': self.deadline_reminders_sms
            },
            'digest_preferences': {
                'weekly_digest_enabled': self.weekly_digest_enabled,
                'weekly_digest_day': self.weekly_digest_day,
                'daily_digest_enabled': self.daily_digest_enabled,
                'daily_digest_time': self.daily_digest_time.strftime('%H:%M') if self.daily_digest_time else None
            },
            'quiet_hours': {
                'enabled': self.quiet_hours_enabled,
                'start': self.quiet_hours_start.strftime('%H:%M') if self.quiet_hours_start else None,
                'end': self.quiet_hours_end.strftime('%H:%M') if self.quiet_hours_end else None,
                'timezone': self.quiet_hours_timezone
            },
            'frequency_settings': {
                'max_emails_per_day': self.max_emails_per_day,
                'batch_notifications': self.batch_notifications,
                'immediate_for_urgent': self.immediate_for_urgent
            },
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    @classmethod
    def get_or_create_for_user(cls, user_id: int):
        """Get preferences for user or create default preferences"""
        preferences = cls.query.filter_by(user_id=user_id).first()
        
        if not preferences:
            preferences = cls(user_id=user_id)
            db.session.add(preferences)
            db.session.commit()
        
        return preferences
    
    def update_from_dict(self, data: dict):
        """Update preferences from dictionary data"""
        try:
            # Email preferences
            email_prefs = data.get('email_preferences', {})
            if 'enabled' in email_prefs:
                self.email_enabled = email_prefs['enabled']
            if 'job_alerts' in email_prefs:
                self.job_alerts_email = email_prefs['job_alerts']
            if 'application_status' in email_prefs:
                self.application_status_email = email_prefs['application_status']
            if 'messages' in email_prefs:
                self.messages_email = email_prefs['messages']
            if 'interview_reminders' in email_prefs:
                self.interview_reminders_email = email_prefs['interview_reminders']
            if 'deadline_reminders' in email_prefs:
                self.deadline_reminders_email = email_prefs['deadline_reminders']
            if 'company_updates' in email_prefs:
                self.company_updates_email = email_prefs['company_updates']
            if 'system_notifications' in email_prefs:
                self.system_notifications_email = email_prefs['system_notifications']
            if 'promotions' in email_prefs:
                self.promotions_email = email_prefs['promotions']
            
            # Push preferences
            push_prefs = data.get('push_preferences', {})
            if 'enabled' in push_prefs:
                self.push_enabled = push_prefs['enabled']
            if 'job_alerts' in push_prefs:
                self.job_alerts_push = push_prefs['job_alerts']
            if 'application_status' in push_prefs:
                self.application_status_push = push_prefs['application_status']
            if 'messages' in push_prefs:
                self.messages_push = push_prefs['messages']
            if 'interview_reminders' in push_prefs:
                self.interview_reminders_push = push_prefs['interview_reminders']
            if 'deadline_reminders' in push_prefs:
                self.deadline_reminders_push = push_prefs['deadline_reminders']
            if 'company_updates' in push_prefs:
                self.company_updates_push = push_prefs['company_updates']
            if 'system_notifications' in push_prefs:
                self.system_notifications_push = push_prefs['system_notifications']
            if 'promotions' in push_prefs:
                self.promotions_push = push_prefs['promotions']
            
            # Digest preferences
            digest_prefs = data.get('digest_preferences', {})
            if 'weekly_digest_enabled' in digest_prefs:
                self.weekly_digest_enabled = digest_prefs['weekly_digest_enabled']
            if 'weekly_digest_day' in digest_prefs:
                self.weekly_digest_day = digest_prefs['weekly_digest_day']
            if 'daily_digest_enabled' in digest_prefs:
                self.daily_digest_enabled = digest_prefs['daily_digest_enabled']
            if 'daily_digest_time' in digest_prefs:
                time_str = digest_prefs['daily_digest_time']
                self.daily_digest_time = datetime.strptime(time_str, '%H:%M').time()
            
            # Quiet hours
            quiet_hours = data.get('quiet_hours', {})
            if 'enabled' in quiet_hours:
                self.quiet_hours_enabled = quiet_hours['enabled']
            if 'start' in quiet_hours:
                start_str = quiet_hours['start']
                self.quiet_hours_start = datetime.strptime(start_str, '%H:%M').time()
            if 'end' in quiet_hours:
                end_str = quiet_hours['end']
                self.quiet_hours_end = datetime.strptime(end_str, '%H:%M').time()
            if 'timezone' in quiet_hours:
                self.quiet_hours_timezone = quiet_hours['timezone']
            
            # Frequency settings
            freq_settings = data.get('frequency_settings', {})
            if 'max_emails_per_day' in freq_settings:
                self.max_emails_per_day = freq_settings['max_emails_per_day']
            if 'batch_notifications' in freq_settings:
                self.batch_notifications = freq_settings['batch_notifications']
            if 'immediate_for_urgent' in freq_settings:
                self.immediate_for_urgent = freq_settings['immediate_for_urgent']
            
            self.updated_at = datetime.utcnow()
            db.session.commit()
            
        except Exception as e:
            db.session.rollback()
            raise e


class NotificationDeliveryLog(db.Model):
    """Track notification delivery attempts and results"""
    __tablename__ = 'notification_delivery_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    notification_id = db.Column(db.Integer, db.ForeignKey('notifications.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Delivery Details
    delivery_method = db.Column(db.String(20), nullable=False)  # email, push, sms
    delivery_status = db.Column(db.String(20), nullable=False)  # sent, failed, skipped, bounced
    
    # Delivery Metadata
    recipient_address = db.Column(db.String(255))  # email address, phone number, etc.
    delivery_provider = db.Column(db.String(50))  # smtp, twilio, firebase, etc.
    delivery_response = db.Column(db.Text)  # provider response/error message
    
    # Timestamps
    attempted_at = db.Column(db.DateTime, default=datetime.utcnow)
    delivered_at = db.Column(db.DateTime)
    opened_at = db.Column(db.DateTime)  # for email open tracking
    clicked_at = db.Column(db.DateTime)  # for link click tracking
    
    # Relationships
    notification = db.relationship('Notification', backref='delivery_logs')
    user = db.relationship('User', backref='notification_delivery_logs')
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'notification_id': self.notification_id,
            'user_id': self.user_id,
            'delivery_method': self.delivery_method,
            'delivery_status': self.delivery_status,
            'recipient_address': self.recipient_address,
            'delivery_provider': self.delivery_provider,
            'delivery_response': self.delivery_response,
            'attempted_at': self.attempted_at.isoformat() if self.attempted_at else None,
            'delivered_at': self.delivered_at.isoformat() if self.delivered_at else None,
            'opened_at': self.opened_at.isoformat() if self.opened_at else None,
            'clicked_at': self.clicked_at.isoformat() if self.clicked_at else None
        }


class NotificationQueue(db.Model):
    """Queue for scheduled and batched notifications"""
    __tablename__ = 'notification_queue'
    
    id = db.Column(db.Integer, primary_key=True)
    notification_id = db.Column(db.Integer, db.ForeignKey('notifications.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Queue Settings
    delivery_method = db.Column(db.String(20), nullable=False)  # email, push, sms
    priority = db.Column(db.String(20), default='normal')  # low, normal, high, urgent
    status = db.Column(db.String(20), default='queued')  # queued, processing, sent, failed
    
    # Scheduling
    scheduled_for = db.Column(db.DateTime, default=datetime.utcnow)
    retry_count = db.Column(db.Integer, default=0)
    max_retries = db.Column(db.Integer, default=3)
    next_retry_at = db.Column(db.DateTime)
    
    # Metadata
    batch_id = db.Column(db.String(50))  # for grouping related notifications
    delivery_data = db.Column(db.Text)  # JSON string with additional delivery data
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    processed_at = db.Column(db.DateTime)
    
    # Relationships
    notification = db.relationship('Notification', backref='queue_entries')
    user = db.relationship('User', backref='notification_queue_entries')
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'notification_id': self.notification_id,
            'user_id': self.user_id,
            'delivery_method': self.delivery_method,
            'priority': self.priority,
            'status': self.status,
            'scheduled_for': self.scheduled_for.isoformat() if self.scheduled_for else None,
            'retry_count': self.retry_count,
            'max_retries': self.max_retries,
            'next_retry_at': self.next_retry_at.isoformat() if self.next_retry_at else None,
            'batch_id': self.batch_id,
            'delivery_data': json.loads(self.delivery_data) if self.delivery_data else None,
            'created_at': self.created_at.isoformat(),
            'processed_at': self.processed_at.isoformat() if self.processed_at else None
        }