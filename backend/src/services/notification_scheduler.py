"""
Notification Scheduler Service
Handles batched and scheduled notification delivery
"""

import asyncio
import logging
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any
import threading
import time

from src.models.user import db
from src.models.notification import Notification
from src.models.notification_preferences import NotificationQueue, NotificationDeliveryLog, NotificationPreference
from src.services.email_service import email_service, EmailNotification, EmailPriority


class NotificationScheduler:
    """Service for scheduling and batching notification deliveries"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.is_running = False
        self.scheduler_thread = None
        self.check_interval = 60  # Check every minute
        self.batch_size = 50
        
    def start(self):
        """Start the notification scheduler"""
        if self.is_running:
            self.logger.warning("Notification scheduler is already running")
            return
        
        self.is_running = True
        self.scheduler_thread = threading.Thread(target=self._run_scheduler, daemon=True)
        self.scheduler_thread.start()
        self.logger.info("Notification scheduler started")
    
    def stop(self):
        """Stop the notification scheduler"""
        if not self.is_running:
            return
        
        self.is_running = False
        if self.scheduler_thread:
            self.scheduler_thread.join(timeout=5)
        self.logger.info("Notification scheduler stopped")
    
    def _run_scheduler(self):
        """Main scheduler loop"""
        while self.is_running:
            try:
                self._process_scheduled_notifications()
                self._process_queued_notifications()
                self._process_digest_notifications()
                self._cleanup_old_logs()
                
                time.sleep(self.check_interval)
                
            except Exception as e:
                self.logger.error(f"Error in scheduler loop: {str(e)}")
                time.sleep(self.check_interval)
    
    def _process_scheduled_notifications(self):
        """Process notifications scheduled for delivery"""
        try:
            current_time = datetime.utcnow()
            
            # Get notifications scheduled for delivery
            scheduled_notifications = Notification.query.filter(
                Notification.scheduled_for <= current_time,
                Notification.is_sent == False,
                Notification.send_email == True
            ).limit(self.batch_size).all()
            
            if not scheduled_notifications:
                return
            
            self.logger.info(f"Processing {len(scheduled_notifications)} scheduled notifications")
            
            for notification in scheduled_notifications:
                try:
                    self._send_notification_email(notification)
                except Exception as e:
                    self.logger.error(f"Error sending scheduled notification {notification.id}: {str(e)}")
            
            db.session.commit()
            
        except Exception as e:
            db.session.rollback()
            self.logger.error(f"Error processing scheduled notifications: {str(e)}")
    
    def _process_queued_notifications(self):
        """Process queued notifications"""
        try:
            current_time = datetime.utcnow()
            
            # Get queued notifications ready for delivery
            queued_notifications = NotificationQueue.query.filter(
                NotificationQueue.status == 'queued',
                NotificationQueue.scheduled_for <= current_time
            ).order_by(
                NotificationQueue.priority.desc(),
                NotificationQueue.scheduled_for.asc()
            ).limit(self.batch_size).all()
            
            if not queued_notifications:
                return
            
            self.logger.info(f"Processing {len(queued_notifications)} queued notifications")
            
            # Group by priority for batch processing
            priority_groups = {}
            for queue_entry in queued_notifications:
                priority = queue_entry.priority
                if priority not in priority_groups:
                    priority_groups[priority] = []
                priority_groups[priority].append(queue_entry)
            
            # Process in priority order
            for priority in ['urgent', 'high', 'normal', 'low']:
                if priority in priority_groups:
                    self._process_queue_batch(priority_groups[priority])
            
            db.session.commit()
            
        except Exception as e:
            db.session.rollback()
            self.logger.error(f"Error processing queued notifications: {str(e)}")
    
    def _process_queue_batch(self, queue_entries: List[NotificationQueue]):
        """Process a batch of queue entries"""
        email_notifications = []
        
        for queue_entry in queue_entries:
            try:
                queue_entry.status = 'processing'
                queue_entry.processed_at = datetime.utcnow()
                
                # Get the notification
                notification = Notification.query.get(queue_entry.notification_id)
                if not notification:
                    queue_entry.status = 'failed'
                    continue
                
                # Get user for email data
                from src.models.user import User
                user = User.query.get(queue_entry.user_id)
                if not user:
                    queue_entry.status = 'failed'
                    continue
                
                # Check user preferences
                preferences = NotificationPreference.get_or_create_for_user(user.id)
                if not preferences.should_send_notification(
                    notification.notification_type, 
                    queue_entry.delivery_method,
                    notification.priority == 'urgent'
                ):
                    queue_entry.status = 'skipped'
                    continue
                
                if queue_entry.delivery_method == 'email':
                    # Parse delivery data
                    delivery_data = json.loads(queue_entry.delivery_data) if queue_entry.delivery_data else {}
                    
                    # Create email notification
                    email_notification = EmailNotification(
                        recipient_email=user.email,
                        recipient_name=user.get_full_name(),
                        template_name=delivery_data.get('template_name', 'system_notification'),
                        subject=notification.title,
                        variables={
                            'user_name': user.get_full_name(),
                            'title': notification.title,
                            'message': notification.message,
                            **delivery_data.get('variables', {})
                        },
                        priority=EmailPriority(queue_entry.priority) if queue_entry.priority in ['low', 'normal', 'high', 'urgent'] else EmailPriority.NORMAL,
                        notification_id=notification.id
                    )
                    
                    email_notifications.append((email_notification, queue_entry, notification))
                
            except Exception as e:
                self.logger.error(f"Error preparing queue entry {queue_entry.id}: {str(e)}")
                queue_entry.status = 'failed'
        
        # Send emails in batch
        if email_notifications:
            self._send_email_batch(email_notifications)
    
    def _send_email_batch(self, email_notifications: List[tuple]):
        """Send a batch of email notifications"""
        for email_notification, queue_entry, notification in email_notifications:
            try:
                success = email_service.send_notification_email(email_notification)
                
                if success:
                    queue_entry.status = 'sent'
                    notification.mark_as_sent()
                    
                    # Log successful delivery
                    delivery_log = NotificationDeliveryLog(
                        notification_id=notification.id,
                        user_id=queue_entry.user_id,
                        delivery_method='email',
                        delivery_status='sent',
                        recipient_address=email_notification.recipient_email,
                        delivery_provider='smtp'
                    )
                    db.session.add(delivery_log)
                    
                else:
                    queue_entry.status = 'failed'
                    queue_entry.retry_count += 1
                    
                    # Schedule retry if not exceeded max retries
                    if queue_entry.retry_count < queue_entry.max_retries:
                        retry_delay = min(2 ** queue_entry.retry_count * 60, 3600)  # Exponential backoff, max 1 hour
                        queue_entry.next_retry_at = datetime.utcnow() + timedelta(seconds=retry_delay)
                        queue_entry.status = 'queued'
                    
                    # Log failed delivery
                    delivery_log = NotificationDeliveryLog(
                        notification_id=notification.id,
                        user_id=queue_entry.user_id,
                        delivery_method='email',
                        delivery_status='failed',
                        recipient_address=email_notification.recipient_email,
                        delivery_provider='smtp',
                        delivery_response='Email delivery failed'
                    )
                    db.session.add(delivery_log)
                
            except Exception as e:
                self.logger.error(f"Error sending email for notification {notification.id}: {str(e)}")
                queue_entry.status = 'failed'
                queue_entry.retry_count += 1
    
    def _send_notification_email(self, notification: Notification):
        """Send email for a single notification"""
        try:
            from src.models.user import User
            user = User.query.get(notification.user_id)
            if not user:
                return False
            
            # Check user preferences
            preferences = NotificationPreference.get_or_create_for_user(user.id)
            if not preferences.should_send_notification(
                notification.notification_type, 
                'email',
                notification.priority == 'urgent'
            ):
                notification.is_sent = True  # Mark as sent but skipped
                return True
            
            # Map notification type to email template
            template_map = {
                'job_alert': 'job_alert',
                'application_status': 'application_status',
                'message': 'message_notification',
                'interview_reminder': 'interview_reminder',
                'deadline_reminder': 'deadline_reminder',
                'company_update': 'company_update',
                'system': 'system_notification',
                'promotion': 'system_notification'
            }
            
            template_name = template_map.get(notification.notification_type, 'system_notification')
            
            # Parse notification data
            variables = json.loads(notification.data) if notification.data else {}
            
            # Create email notification
            email_notification = EmailNotification(
                recipient_email=user.email,
                recipient_name=user.get_full_name(),
                template_name=template_name,
                subject=notification.title,
                variables={
                    'user_name': user.get_full_name(),
                    'title': notification.title,
                    'message': notification.message,
                    'action_url': notification.action_url or f"{email_service.frontend_url}/notifications",
                    'action_text': notification.action_text or 'View Notification',
                    **variables
                },
                priority=EmailPriority(notification.priority) if notification.priority in ['low', 'normal', 'high', 'urgent'] else EmailPriority.NORMAL,
                notification_id=notification.id
            )
            
            # Send email
            success = email_service.send_notification_email(email_notification)
            
            if success:
                notification.mark_as_sent()
                
                # Log successful delivery
                delivery_log = NotificationDeliveryLog(
                    notification_id=notification.id,
                    user_id=user.id,
                    delivery_method='email',
                    delivery_status='sent',
                    recipient_address=user.email,
                    delivery_provider='smtp'
                )
                db.session.add(delivery_log)
            else:
                # Log failed delivery
                delivery_log = NotificationDeliveryLog(
                    notification_id=notification.id,
                    user_id=user.id,
                    delivery_method='email',
                    delivery_status='failed',
                    recipient_address=user.email,
                    delivery_provider='smtp',
                    delivery_response='Email delivery failed'
                )
                db.session.add(delivery_log)
            
            return success
            
        except Exception as e:
            self.logger.error(f"Error sending notification email: {str(e)}")
            return False
    
    def _process_digest_notifications(self):
        """Process digest notifications (weekly/daily)"""
        try:
            current_time = datetime.utcnow()
            current_day = current_time.strftime('%A').lower()
            current_hour = current_time.hour
            
            # Process weekly digests
            if current_day == 'monday' and current_hour == 9:  # Monday 9 AM
                self._send_weekly_digests()
            
            # Process daily digests
            if current_hour == 9:  # 9 AM
                self._send_daily_digests()
                
        except Exception as e:
            self.logger.error(f"Error processing digest notifications: {str(e)}")
    
    def _send_weekly_digests(self):
        """Send weekly digest emails to users who have it enabled"""
        try:
            # Get users with weekly digest enabled
            preferences = NotificationPreference.query.filter_by(
                weekly_digest_enabled=True
            ).all()
            
            for pref in preferences:
                try:
                    from src.models.user import User
                    user = User.query.get(pref.user_id)
                    if not user:
                        continue
                    
                    # Calculate digest data
                    week_ago = datetime.utcnow() - timedelta(days=7)
                    
                    new_jobs_count = Notification.query.filter(
                        Notification.user_id == user.id,
                        Notification.notification_type == 'job_alert',
                        Notification.created_at >= week_ago
                    ).count()
                    
                    applications_count = 0  # Placeholder
                    
                    from src.models.notification import Message
                    messages_count = Message.query.filter(
                        Message.recipient_id == user.id,
                        Message.created_at >= week_ago
                    ).count()
                    
                    digest_data = {
                        'new_jobs_count': new_jobs_count,
                        'applications_count': applications_count,
                        'messages_count': messages_count,
                        'jobs_list': []
                    }
                    
                    # Send digest
                    email_service.send_digest_email(user.id, digest_data)
                    
                except Exception as e:
                    self.logger.error(f"Error sending weekly digest to user {pref.user_id}: {str(e)}")
            
        except Exception as e:
            self.logger.error(f"Error in weekly digest processing: {str(e)}")
    
    def _send_daily_digests(self):
        """Send daily digest emails to users who have it enabled"""
        try:
            # Get users with daily digest enabled
            preferences = NotificationPreference.query.filter_by(
                daily_digest_enabled=True
            ).all()
            
            for pref in preferences:
                try:
                    # Check if it's the right time for this user
                    if pref.daily_digest_time and pref.daily_digest_time.hour != datetime.utcnow().hour:
                        continue
                    
                    from src.models.user import User
                    user = User.query.get(pref.user_id)
                    if not user:
                        continue
                    
                    # Calculate digest data for the day
                    day_ago = datetime.utcnow() - timedelta(days=1)
                    
                    unread_count = Notification.query.filter(
                        Notification.user_id == user.id,
                        Notification.is_read == False,
                        Notification.created_at >= day_ago
                    ).count()
                    
                    if unread_count > 0:  # Only send if there are unread notifications
                        digest_data = {
                            'unread_count': unread_count,
                            'day': day_ago.strftime('%A')
                        }
                        
                        # Send daily digest (you can create a separate template for this)
                        email_service.send_digest_email(user.id, digest_data)
                    
                except Exception as e:
                    self.logger.error(f"Error sending daily digest to user {pref.user_id}: {str(e)}")
            
        except Exception as e:
            self.logger.error(f"Error in daily digest processing: {str(e)}")
    
    def _cleanup_old_logs(self):
        """Clean up old delivery logs and completed queue entries"""
        try:
            # Clean up old delivery logs (older than 30 days)
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            
            old_logs_count = NotificationDeliveryLog.query.filter(
                NotificationDeliveryLog.attempted_at < thirty_days_ago
            ).count()
            
            if old_logs_count > 0:
                NotificationDeliveryLog.query.filter(
                    NotificationDeliveryLog.attempted_at < thirty_days_ago
                ).delete()
                
                self.logger.info(f"Cleaned up {old_logs_count} old delivery logs")
            
            # Clean up old completed queue entries (older than 7 days)
            seven_days_ago = datetime.utcnow() - timedelta(days=7)
            
            old_queue_count = NotificationQueue.query.filter(
                NotificationQueue.status.in_(['sent', 'failed']),
                NotificationQueue.processed_at < seven_days_ago
            ).count()
            
            if old_queue_count > 0:
                NotificationQueue.query.filter(
                    NotificationQueue.status.in_(['sent', 'failed']),
                    NotificationQueue.processed_at < seven_days_ago
                ).delete()
                
                self.logger.info(f"Cleaned up {old_queue_count} old queue entries")
            
            db.session.commit()
            
        except Exception as e:
            db.session.rollback()
            self.logger.error(f"Error in cleanup: {str(e)}")
    
    def queue_notification(self, notification_id: int, user_id: int, delivery_method: str = 'email', 
                          priority: str = 'normal', scheduled_for: datetime = None, 
                          delivery_data: Dict[str, Any] = None) -> bool:
        """Queue a notification for later delivery"""
        try:
            queue_entry = NotificationQueue(
                notification_id=notification_id,
                user_id=user_id,
                delivery_method=delivery_method,
                priority=priority,
                scheduled_for=scheduled_for or datetime.utcnow(),
                delivery_data=json.dumps(delivery_data) if delivery_data else None
            )
            
            db.session.add(queue_entry)
            db.session.commit()
            
            self.logger.info(f"Queued notification {notification_id} for user {user_id}")
            return True
            
        except Exception as e:
            db.session.rollback()
            self.logger.error(f"Error queuing notification: {str(e)}")
            return False
    
    def get_queue_status(self) -> Dict[str, Any]:
        """Get current queue status"""
        try:
            queued_count = NotificationQueue.query.filter_by(status='queued').count()
            processing_count = NotificationQueue.query.filter_by(status='processing').count()
            failed_count = NotificationQueue.query.filter_by(status='failed').count()
            
            # Get counts by priority
            priority_counts = db.session.query(
                NotificationQueue.priority,
                db.func.count(NotificationQueue.id)
            ).filter_by(status='queued').group_by(NotificationQueue.priority).all()
            
            return {
                'is_running': self.is_running,
                'queued': queued_count,
                'processing': processing_count,
                'failed': failed_count,
                'by_priority': dict(priority_counts)
            }
            
        except Exception as e:
            self.logger.error(f"Error getting queue status: {str(e)}")
            return {'error': str(e)}


# Global scheduler instance
notification_scheduler = NotificationScheduler()