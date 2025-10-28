"""
Enhanced Email Notification Service for TalentSphere
Provides comprehensive email delivery with templates, tracking, and batching
"""

import os
import smtplib
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from dataclasses import dataclass
from enum import Enum
import logging

from src.models.user import db
from src.models.notification import Notification, NotificationTemplate


class EmailPriority(Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class NotificationType(Enum):
    JOB_ALERT = "job_alert"
    APPLICATION_STATUS = "application_status"
    MESSAGE = "message"
    SYSTEM = "system"
    PROMOTION = "promotion"
    COMPANY_UPDATE = "company_update"
    INTERVIEW_REMINDER = "interview_reminder"
    DEADLINE_REMINDER = "deadline_reminder"
    DIGEST = "digest"
    WELCOME = "welcome"


@dataclass
class EmailTemplate:
    """Email template data structure"""
    subject: str
    html_body: str
    text_body: str
    variables: Dict[str, Any]


@dataclass
class EmailNotification:
    """Email notification data structure"""
    recipient_email: str
    recipient_name: str
    template_name: str
    subject: str
    variables: Dict[str, Any]
    priority: EmailPriority = EmailPriority.NORMAL
    send_immediately: bool = True
    scheduled_for: Optional[datetime] = None
    notification_id: Optional[int] = None


class EmailService:
    """Enhanced email service with templates, batching, and delivery tracking"""
    
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.mail.yahoo.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.sender_email = os.getenv('SENDER_EMAIL', os.getenv('SMTP_USERNAME', 'biodiversitynexus@yahoo.com'))
        self.sender_password = os.getenv('SENDER_PASSWORD', os.getenv('SMTP_PASSWORD', 'vnjpjjdkdlmncrya'))
        self.sender_name = os.getenv('SENDER_NAME', os.getenv('FROM_NAME', 'TalentSphere'))
        self.frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        
        # Setup logging
        self.logger = logging.getLogger(__name__)
        
        # Email templates
        self.templates = self._load_templates()
        
        # Batch settings
        self.batch_size = int(os.getenv('EMAIL_BATCH_SIZE', '50'))
        self.batch_delay = int(os.getenv('EMAIL_BATCH_DELAY', '1'))  # seconds
        
        # Rate limiting
        self.rate_limit = int(os.getenv('EMAIL_RATE_LIMIT', '100'))  # emails per hour
    
    def _load_templates(self) -> Dict[str, EmailTemplate]:
        """Load email templates with beautiful HTML designs"""
        return {
            'job_alert': EmailTemplate(
                subject="🎯 New Job Alert: {job_title} at {company_name}",
                html_body=self._load_html_template('email_job_alert.html'),
                text_body=self._get_job_alert_text(),
                variables=['job_title', 'company_name', 'job_url', 'user_name', 'location', 'employment_type', 'experience_level', 'category', 'salary_range', 'job_description', 'apply_url', 'unsubscribe_url', 'preferences_url']
            ),
            'application_status': EmailTemplate(
                subject="� Application Update: {job_title} at {company_name}",
                html_body=self._load_html_template('email_application_status.html'),
                text_body=self._get_application_status_text(),
                variables=['job_title', 'company_name', 'current_status', 'application_date', 'location', 'employment_type', 'update_message', 'progress_percentage', 'step2_class', 'step3_class', 'step4_class', 'application_url', 'messages_url', 'unsubscribe_url', 'preferences_url']
            ),
            'message': EmailTemplate(
                subject="💬 New Message from {sender_name} at {company_name}",
                html_body=self._load_html_template('email_message.html'),
                text_body=self._get_message_notification_text(),
                variables=['sender_name', 'sender_title', 'company_name', 'sender_initials', 'subject', 'message_body', 'timestamp', 'reply_url', 'profile_url', 'messages_url', 'unsubscribe_url', 'preferences_url']
            ),
            'interview_reminder': EmailTemplate(
                subject="⏰ Interview Reminder: {position_title} at {company_name}",
                html_body=self._load_html_template('email_interview_reminder.html'),
                text_body=self._get_interview_reminder_text(),
                variables=['position_title', 'company_name', 'interview_date', 'interview_time', 'interview_type', 'duration', 'meeting_link', 'interview_location', 'interviewer_names', 'days', 'hours', 'minutes', 'calendar_link', 'company_profile', 'unsubscribe_url', 'preferences_url']
            ),
            'deadline_reminder': EmailTemplate(
                subject="⚠️ Application Deadline Reminder: {position}",
                html_body=self._load_html_template('email_interview_reminder.html'),  # Reuse template
                text_body=self._get_deadline_reminder_text(),
                variables=['position', 'company_name', 'deadline_date', 'user_name', 'job_url', 'unsubscribe_url', 'preferences_url']
            ),
            'system': EmailTemplate(
                subject="� TalentSphere: {notification_title}",
                html_body=self._load_html_template('email_system.html'),
                text_body=self._get_system_notification_text(),
                variables=['notification_title', 'notification_type', 'icon', 'message', 'action_url', 'action_text', 'percentage', 'missing_sections', 'stats', 'recommendations', 'unsubscribe_url', 'preferences_url']
            ),
            'welcome': EmailTemplate(
                subject="🎉 Welcome to TalentSphere, {user_name}!",
                html_body=self._load_html_template('email_welcome.html'),
                text_body=self._get_welcome_text(),
                variables=['user_name', 'profile_url', 'jobs_url', 'unsubscribe_url', 'preferences_url']
            ),
            'company_update': EmailTemplate(
                subject="🏢 Company Update: {company_name}",
                html_body=self._load_html_template('email_job_alert.html'),  # Reuse job alert template
                text_body=self._get_company_update_text(),
                variables=['company_name', 'update_title', 'update_content', 'user_name', 'company_url', 'unsubscribe_url', 'preferences_url']
            ),
            'promotion': EmailTemplate(
                subject="⭐ Featured Opportunity: {job_title}",
                html_body=self._load_html_template('email_job_alert.html'),  # Reuse job alert template
                text_body=self._get_promotion_text(),
                variables=['job_title', 'company_name', 'job_url', 'user_name', 'location', 'employment_type', 'salary_range', 'unsubscribe_url', 'preferences_url']
            )
        }
    
    def send_notification_email(self, notification: EmailNotification) -> bool:
        """Send a single notification email"""
        try:
            if not self.sender_password:
                self.logger.warning("Email service not configured - SENDER_PASSWORD missing")
                return False
            
            template = self.templates.get(notification.template_name)
            if not template:
                self.logger.error(f"Template '{notification.template_name}' not found")
                return False
            
            # Render email content
            subject = self._render_template(notification.subject, notification.variables)
            html_body = self._render_template(template.html_body, notification.variables)
            text_body = self._render_template(template.text_body, notification.variables)
            
            # Create email message
            message = MIMEMultipart('alternative')
            message['From'] = f"{self.sender_name} <{self.sender_email}>"
            message['To'] = notification.recipient_email
            message['Subject'] = subject
            
            # Add priority headers
            if notification.priority == EmailPriority.HIGH:
                message['X-Priority'] = '2'
                message['Importance'] = 'high'
            elif notification.priority == EmailPriority.URGENT:
                message['X-Priority'] = '1'
                message['Importance'] = 'high'
            
            # Attach text and HTML parts
            text_part = MIMEText(text_body, 'plain', 'utf-8')
            html_part = MIMEText(html_body, 'html', 'utf-8')
            
            message.attach(text_part)
            message.attach(html_part)
            
            # Send email
            success = self._send_smtp_email(notification.recipient_email, message)
            
            # Update notification status if provided
            if success and notification.notification_id:
                self._update_notification_status(notification.notification_id)
            
            return success
            
        except Exception as e:
            self.logger.error(f"Error sending notification email: {str(e)}")
            return False
    
    def send_batch_emails(self, notifications: List[EmailNotification]) -> Dict[str, int]:
        """Send multiple emails in batches"""
        results = {'sent': 0, 'failed': 0, 'skipped': 0}
        
        try:
            # Group by priority
            urgent_emails = [n for n in notifications if n.priority == EmailPriority.URGENT]
            high_emails = [n for n in notifications if n.priority == EmailPriority.HIGH]
            normal_emails = [n for n in notifications if n.priority in [EmailPriority.NORMAL, EmailPriority.LOW]]
            
            # Send in priority order
            for email_group in [urgent_emails, high_emails, normal_emails]:
                for i in range(0, len(email_group), self.batch_size):
                    batch = email_group[i:i + self.batch_size]
                    
                    for notification in batch:
                        if self.send_notification_email(notification):
                            results['sent'] += 1
                        else:
                            results['failed'] += 1
                    
                    # Rate limiting between batches
                    if i + self.batch_size < len(email_group):
                        import time
                        time.sleep(self.batch_delay)
            
            return results
            
        except Exception as e:
            self.logger.error(f"Error in batch email sending: {str(e)}")
            return results
    
    def send_digest_email(self, user_id: int, digest_data: Dict[str, Any]) -> bool:
        """Send weekly/daily digest email"""
        try:
            from src.models.user import User
            user = User.query.get(user_id)
            if not user:
                return False
            
            notification = EmailNotification(
                recipient_email=user.email,
                recipient_name=user.get_full_name(),
                template_name='weekly_digest',
                subject="📊 Your Weekly Job Activity Digest",
                variables={
                    'user_name': user.get_full_name(),
                    'new_jobs_count': digest_data.get('new_jobs_count', 0),
                    'applications_count': digest_data.get('applications_count', 0),
                    'messages_count': digest_data.get('messages_count', 0),
                    'jobs_list': digest_data.get('jobs_list', []),
                    'dashboard_url': f"{self.frontend_url}/dashboard"
                },
                priority=EmailPriority.NORMAL
            )
            
            return self.send_notification_email(notification)
            
        except Exception as e:
            self.logger.error(f"Error sending digest email: {str(e)}")
            return False
    
    def create_and_send_notification(self, user_id: int, notification_type: NotificationType, 
                                   title: str, message: str, variables: Dict[str, Any] = None,
                                   send_email: bool = True, priority: EmailPriority = EmailPriority.NORMAL) -> bool:
        """Create in-app notification and optionally send email"""
        try:
            from src.models.user import User
            user = User.query.get(user_id)
            if not user:
                return False
            
            # Create in-app notification
            notification = Notification(
                user_id=user_id,
                title=title,
                message=message,
                notification_type=notification_type.value,
                priority=priority.value,
                send_email=send_email,
                data=json.dumps(variables) if variables else None
            )
            
            db.session.add(notification)
            db.session.flush()  # Get notification ID
            
            # Send email if requested
            if send_email and self._should_send_email(user, notification_type):
                template_map = {
                    NotificationType.JOB_ALERT: 'job_alert',
                    NotificationType.APPLICATION_STATUS: 'application_status',
                    NotificationType.MESSAGE: 'message_notification',
                    NotificationType.INTERVIEW_REMINDER: 'interview_reminder',
                    NotificationType.DEADLINE_REMINDER: 'deadline_reminder',
                    NotificationType.COMPANY_UPDATE: 'company_update',
                    NotificationType.SYSTEM: 'system_notification',
                    NotificationType.WELCOME: 'welcome'
                }
                
                template_name = template_map.get(notification_type, 'system_notification')
                
                email_notification = EmailNotification(
                    recipient_email=user.email,
                    recipient_name=user.get_full_name(),
                    template_name=template_name,
                    subject=title,
                    variables={
                        'user_name': user.get_full_name(),
                        **(variables or {})
                    },
                    priority=priority,
                    notification_id=notification.id
                )
                
                email_success = self.send_notification_email(email_notification)
                if email_success:
                    notification.mark_as_sent()
            
            db.session.commit()
            return True
            
        except Exception as e:
            db.session.rollback()
            self.logger.error(f"Error creating and sending notification: {str(e)}")
            return False
    
    def _should_send_email(self, user, notification_type: NotificationType) -> bool:
        """Check if user wants to receive email for this notification type"""
        # TODO: Implement user preferences check
        # For now, return True for important notifications
        important_types = [
            NotificationType.APPLICATION_STATUS,
            NotificationType.INTERVIEW_REMINDER,
            NotificationType.DEADLINE_REMINDER,
            NotificationType.WELCOME
        ]
        return notification_type in important_types
    
    def _send_smtp_email(self, recipient_email: str, message: MIMEMultipart) -> bool:
        """Send email via SMTP"""
        try:
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.sender_email, self.sender_password)
            server.sendmail(self.sender_email, recipient_email, message.as_string())
            server.quit()
            
            self.logger.info(f"Email sent successfully to {recipient_email}")
            return True
            
        except smtplib.SMTPAuthenticationError:
            self.logger.error(f"SMTP Authentication failed for {self.sender_email}")
            return False
        except smtplib.SMTPException as e:
            self.logger.error(f"SMTP error: {str(e)}")
            return False
        except Exception as e:
            self.logger.error(f"Error sending email: {str(e)}")
            return False
    
    def _update_notification_status(self, notification_id: int):
        """Update notification as sent"""
        try:
            notification = Notification.query.get(notification_id)
            if notification:
                notification.mark_as_sent()
        except Exception as e:
            self.logger.error(f"Error updating notification status: {str(e)}")
    
    def _render_template(self, template: str, variables: Dict[str, Any]) -> str:
        """Render template with variables"""
        try:
            return template.format(**variables)
        except KeyError as e:
            self.logger.warning(f"Missing template variable: {str(e)}")
            return template
        except Exception as e:
            self.logger.error(f"Error rendering template: {str(e)}")
            return template
    
    def _load_html_template(self, template_filename: str) -> str:
        """Load HTML template from file"""
        try:
            template_path = os.path.join(
                os.path.dirname(__file__), 
                '..', 
                'templates', 
                template_filename
            )
            
            with open(template_path, 'r', encoding='utf-8') as file:
                return file.read()
        except FileNotFoundError:
            self.logger.error(f"Template file not found: {template_filename}")
            return self._get_fallback_template()
        except Exception as e:
            self.logger.error(f"Error loading template {template_filename}: {str(e)}")
            return self._get_fallback_template()
    
    def _get_fallback_template(self) -> str:
        """Get fallback template when main template fails to load"""
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>TalentSphere Notification</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #6366f1;">TalentSphere</h1>
            <p>You have a new notification from TalentSphere.</p>
            <p>Please visit your dashboard for more details.</p>
        </body>
        </html>
        """
    
    # Template HTML content methods
    def _get_job_alert_html(self) -> str:
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Job Alert</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">🚀 New Job Alert</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 18px; margin-bottom: 20px;">Hi {user_name},</p>
                
                <p>We found a great new job opportunity that matches your preferences:</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
                    <h2 style="color: #667eea; margin-top: 0;">{job_title}</h2>
                    <p style="color: #666; margin: 5px 0;"><strong>Company:</strong> {company_name}</p>
                </div>
                
                <p style="text-align: center; margin: 30px 0;">
                    <a href="{job_url}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Job Details</a>
                </p>
                
                <hr style="border: none; height: 1px; background: #ddd; margin: 30px 0;">
                
                <p style="color: #666; font-size: 14px; text-align: center;">
                    Don't want to receive job alerts? <a href="#" style="color: #667eea;">Update your preferences</a>
                </p>
            </div>
        </body>
        </html>
        """
    
    def _get_job_alert_text(self) -> str:
        return """
        New Job Alert - TalentSphere
        
        Hi {user_name},
        
        We found a great new job opportunity that matches your preferences:
        
        Job Title: {job_title}
        Company: {company_name}
        
        View the full job details at: {job_url}
        
        Best regards,
        The TalentSphere Team
        
        Don't want to receive job alerts? Update your preferences in your account settings.
        """
    
    def _get_application_status_html(self) -> str:
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Application Update</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">📋 Application Update</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 18px; margin-bottom: 20px;">Hi {user_name},</p>
                
                <p>There's an update on your job application:</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #56ab2f; margin: 20px 0;">
                    <h2 style="color: #56ab2f; margin-top: 0;">{job_title}</h2>
                    <p style="color: #666; margin: 5px 0;"><strong>Company:</strong> {company_name}</p>
                    <p style="color: #666; margin: 5px 0;"><strong>Status:</strong> <span style="color: #56ab2f; font-weight: bold;">{status}</span></p>
                </div>
                
                <p style="text-align: center; margin: 30px 0;">
                    <a href="{application_url}" style="background: #56ab2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Application</a>
                </p>
                
                <hr style="border: none; height: 1px; background: #ddd; margin: 30px 0;">
                
                <p style="color: #666; font-size: 14px; text-align: center;">
                    Keep track of all your applications in your <a href="#" style="color: #56ab2f;">dashboard</a>
                </p>
            </div>
        </body>
        </html>
        """
    
    def _get_application_status_text(self) -> str:
        return """
        Application Update - TalentSphere
        
        Hi {user_name},
        
        There's an update on your job application:
        
        Job Title: {job_title}
        Company: {company_name}
        Status: {status}
        
        View your application details at: {application_url}
        
        Best regards,
        The TalentSphere Team
        """
    
    def _get_message_notification_html(self) -> str:
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Message</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">💬 New Message</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 18px; margin-bottom: 20px;">Hi {user_name},</p>
                
                <p>You have received a new message from <strong>{sender_name}</strong>:</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
                    <h3 style="color: #667eea; margin-top: 0;">{subject}</h3>
                    <p style="color: #666; font-style: italic;">{message_preview}...</p>
                </div>
                
                <p style="text-align: center; margin: 30px 0;">
                    <a href="{message_url}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Read Message</a>
                </p>
            </div>
        </body>
        </html>
        """
    
    def _get_message_notification_text(self) -> str:
        return """
        New Message - TalentSphere
        
        Hi {user_name},
        
        You have received a new message from {sender_name}:
        
        Subject: {subject}
        Preview: {message_preview}...
        
        Read the full message at: {message_url}
        
        Best regards,
        The TalentSphere Team
        """
    
    def _get_interview_reminder_html(self) -> str:
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Interview Reminder</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">📅 Interview Reminder</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 18px; margin-bottom: 20px;">Hi {user_name},</p>
                
                <p>Don't forget about your upcoming interview:</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ff6b6b; margin: 20px 0;">
                    <h2 style="color: #ff6b6b; margin-top: 0;">{job_title}</h2>
                    <p style="color: #666; margin: 5px 0;"><strong>Company:</strong> {company_name}</p>
                    <p style="color: #666; margin: 5px 0;"><strong>Date:</strong> {interview_date}</p>
                    <p style="color: #666; margin: 5px 0;"><strong>Time:</strong> {interview_time}</p>
                </div>
                
                <p style="text-align: center; margin: 30px 0;">
                    <a href="{details_url}" style="background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Details</a>
                </p>
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
                    <p style="margin: 0; color: #856404;"><strong>💡 Tip:</strong> Make sure to prepare for your interview and arrive on time. Good luck!</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _get_interview_reminder_text(self) -> str:
        return """
        Interview Reminder - TalentSphere
        
        Hi {user_name},
        
        Don't forget about your upcoming interview:
        
        Job Title: {job_title}
        Company: {company_name}
        Date: {interview_date}
        Time: {interview_time}
        
        View full details at: {details_url}
        
        Good luck with your interview!
        
        Best regards,
        The TalentSphere Team
        """
    
    def _get_deadline_reminder_html(self) -> str:
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Application Deadline Reminder</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">⏰ Application Deadline Reminder</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 18px; margin-bottom: 20px;">Hi {user_name},</p>
                
                <p>The application deadline for this job is approaching:</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #dc3545; margin: 20px 0;">
                    <h2 style="color: #dc3545; margin-top: 0;">{job_title}</h2>
                    <p style="color: #666; margin: 5px 0;"><strong>Company:</strong> {company_name}</p>
                    <p style="color: #dc3545; margin: 5px 0;"><strong>Deadline:</strong> {deadline_date}</p>
                </div>
                
                <p style="text-align: center; margin: 30px 0;">
                    <a href="{job_url}" style="background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Apply Now</a>
                </p>
                
                <div style="background: #f8d7da; padding: 15px; border-radius: 5px; border-left: 4px solid #dc3545;">
                    <p style="margin: 0; color: #721c24;"><strong>⚠️ Urgent:</strong> Don't miss this opportunity! Apply before the deadline.</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _get_deadline_reminder_text(self) -> str:
        return """
        Application Deadline Reminder - TalentSphere
        
        Hi {user_name},
        
        The application deadline for this job is approaching:
        
        Job Title: {job_title}
        Company: {company_name}
        Deadline: {deadline_date}
        
        Apply now at: {job_url}
        
        Don't miss this opportunity!
        
        Best regards,
        The TalentSphere Team
        """
    
    def _get_weekly_digest_html(self) -> str:
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Weekly Job Activity Digest</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">📊 Your Weekly Digest</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 18px; margin-bottom: 20px;">Hi {user_name},</p>
                
                <p>Here's your weekly job activity summary:</p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin: 20px 0;">
                    <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; border-top: 4px solid #6c5ce7;">
                        <h3 style="color: #6c5ce7; margin: 0; font-size: 24px;">{new_jobs_count}</h3>
                        <p style="margin: 5px 0; color: #666;">New Jobs</p>
                    </div>
                    <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; border-top: 4px solid #00b894;">
                        <h3 style="color: #00b894; margin: 0; font-size: 24px;">{applications_count}</h3>
                        <p style="margin: 5px 0; color: #666;">Applications</p>
                    </div>
                    <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; border-top: 4px solid #e17055;">
                        <h3 style="color: #e17055; margin: 0; font-size: 24px;">{messages_count}</h3>
                        <p style="margin: 5px 0; color: #666;">Messages</p>
                    </div>
                </div>
                
                <p style="text-align: center; margin: 30px 0;">
                    <a href="{dashboard_url}" style="background: #6c5ce7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Dashboard</a>
                </p>
            </div>
        </body>
        </html>
        """
    
    def _get_weekly_digest_text(self) -> str:
        return """
        Weekly Job Activity Digest - TalentSphere
        
        Hi {user_name},
        
        Here's your weekly job activity summary:
        
        • {new_jobs_count} new job matches
        • {applications_count} applications submitted
        • {messages_count} new messages
        
        View your full dashboard at: {dashboard_url}
        
        Best regards,
        The TalentSphere Team
        """
    
    def _get_company_update_html(self) -> str:
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Company Update</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #00b894 0%, #00cec9 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">🏢 Company Update</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 18px; margin-bottom: 20px;">Hi {user_name},</p>
                
                <p>{company_name} has shared an update:</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #00b894; margin: 20px 0;">
                    <h2 style="color: #00b894; margin-top: 0;">{update_title}</h2>
                    <p style="color: #666;">{update_content}</p>
                </div>
                
                <p style="text-align: center; margin: 30px 0;">
                    <a href="{company_url}" style="background: #00b894; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Company Page</a>
                </p>
            </div>
        </body>
        </html>
        """
    
    def _get_company_update_text(self) -> str:
        return """
        Company Update - TalentSphere
        
        Hi {user_name},
        
        {company_name} has shared an update:
        
        {update_title}
        {update_content}
        
        View the company page at: {company_url}
        
        Best regards,
        The TalentSphere Team
        """
    
    def _get_system_notification_html(self) -> str:
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>System Notification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #636e72 0%, #b2bec3 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">🔔 System Notification</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 18px; margin-bottom: 20px;">Hi {user_name},</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #636e72; margin: 20px 0;">
                    <h2 style="color: #636e72; margin-top: 0;">{title}</h2>
                    <p style="color: #666;">{message}</p>
                </div>
                
                <p style="text-align: center; margin: 30px 0;">
                    <a href="{action_url}" style="background: #636e72; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">{action_text}</a>
                </p>
            </div>
        </body>
        </html>
        """
    
    def _get_system_notification_text(self) -> str:
        return """
        System Notification - TalentSphere
        
        Hi {user_name},
        
        {title}
        {message}
        
        {action_text}: {action_url}
        
        Best regards,
        The TalentSphere Team
        """
    
    def _get_welcome_text(self) -> str:
        """Welcome email text template"""
        return """
        Welcome to TalentSphere, {user_name}!
        
        We're thrilled to have you join our community of ambitious professionals.
        
        Get started in 3 easy steps:
        1. Complete your profile: {profile_url}
        2. Set up job alerts
        3. Start applying to jobs: {jobs_url}
        
        Best regards,
        The TalentSphere Team
        """
    
    def _get_promotion_text(self) -> str:
        """Promotion email text template"""
        return """
        Featured Job Opportunity - TalentSphere
        
        Hi {user_name},
        
        We have an exclusive job opportunity for you:
        
        Job Title: {job_title}
        Company: {company_name}
        Location: {location}
        Type: {employment_type}
        Salary: {salary_range}
        
        View details: {job_url}
        
        Best regards,
        The TalentSphere Team
        """


# Global email service instance
email_service = EmailService()