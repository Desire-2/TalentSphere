"""
Enhanced notification template handlers for connecting HTML email templates with real notification data
"""

from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from src.models.user import User
from src.models.job import Job
from src.models.application import Application
from src.models.notification import Message
from src.services.email_service import NotificationType


class NotificationTemplateHandler:
    """Handles template data preparation for different notification types"""
    
    @staticmethod
    def prepare_job_alert_data(user: User, job: Job, **kwargs) -> Dict[str, Any]:
        """Prepare data for job alert email template"""
        return {
            'user_name': user.get_full_name(),
            'job_title': job.title,
            'company_name': job.company.company_name if job.company else job.company_name,
            'location': job.location,
            'job_type': job.job_type.replace('_', ' ').title() if job.job_type else 'Full-time',
            'experience_level': job.experience_level.replace('_', ' ').title() if job.experience_level else 'Any Level',
            'salary_range': job.salary_range if job.salary_range else 'Competitive',
            'job_url': f"{kwargs.get('frontend_url', 'https://talentsphere.com')}/jobs/{job.id}",
            'job_description': job.description[:200] + '...' if len(job.description) > 200 else job.description,
            'posted_date': job.created_at.strftime('%B %d, %Y'),
            'application_deadline': job.application_deadline.strftime('%B %d, %Y') if job.application_deadline else None,
            'skills_required': job.skills_required.split(',')[:5] if job.skills_required else [],
            'benefits': job.benefits.split(',')[:3] if job.benefits else []
        }
    
    @staticmethod
    def prepare_application_status_data(user: User, application: Application, status: str, **kwargs) -> Dict[str, Any]:
        """Prepare data for application status update email template"""
        job = application.job
        
        # Status progress calculation
        status_steps = ['submitted', 'under_review', 'shortlisted', 'interview_scheduled', 'hired']
        current_step = status_steps.index(status) if status in status_steps else 0
        progress_percentage = ((current_step + 1) / len(status_steps)) * 100
        
        status_messages = {
            'submitted': 'Your application has been successfully submitted.',
            'under_review': 'Your application is currently being reviewed by our team.',
            'shortlisted': 'Congratulations! You have been shortlisted for this position.',
            'interview_scheduled': 'An interview has been scheduled. Please check your email for details.',
            'hired': 'Congratulations! You have been selected for this position.',
            'rejected': 'We appreciate your interest, but we have decided to move forward with other candidates.'
        }
        
        return {
            'user_name': user.get_full_name(),
            'job_title': job.title,
            'company_name': job.company.company_name if job.company else job.company_name,
            'application_date': application.applied_at.strftime('%B %d, %Y'),
            'status': status.replace('_', ' ').title(),
            'status_message': status_messages.get(status, 'Your application status has been updated.'),
            'progress_percentage': progress_percentage,
            'current_step': current_step + 1,
            'total_steps': len(status_steps),
            'application_url': f"{kwargs.get('frontend_url', 'https://talentsphere.com')}/applications/{application.id}",
            'job_url': f"{kwargs.get('frontend_url', 'https://talentsphere.com')}/jobs/{job.id}",
            'is_positive': status in ['shortlisted', 'interview_scheduled', 'hired'],
            'next_step': 'Check your dashboard for next steps.' if status != 'hired' else 'Welcome to the team!'
        }
    
    @staticmethod
    def prepare_interview_reminder_data(user: User, interview_data: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """Prepare data for interview reminder email template"""
        interview_date = interview_data.get('interview_date')
        if isinstance(interview_date, str):
            interview_date = datetime.fromisoformat(interview_date.replace('Z', '+00:00'))
        
        time_until = interview_date - datetime.now()
        hours_until = int(time_until.total_seconds() / 3600)
        
        return {
            'user_name': user.get_full_name(),
            'job_title': interview_data.get('job_title', 'Position'),
            'company_name': interview_data.get('company_name', 'Company'),
            'interview_date': interview_date.strftime('%B %d, %Y'),
            'interview_time': interview_date.strftime('%I:%M %p'),
            'interview_type': interview_data.get('interview_type', 'Video Call'),
            'duration': interview_data.get('duration', '1 hour'),
            'meeting_link': interview_data.get('meeting_link', ''),
            'interviewer_name': interview_data.get('interviewer_name', 'HR Team'),
            'interviewer_email': interview_data.get('interviewer_email', ''),
            'location': interview_data.get('location', 'Online'),
            'hours_until': hours_until,
            'is_urgent': hours_until <= 24,
            'preparation_tips': [
                'Review the job description and company information',
                'Prepare examples of your relevant experience',
                'Test your internet connection and video setup',
                'Prepare thoughtful questions about the role'
            ],
            'documents_needed': interview_data.get('documents_needed', []),
            'special_instructions': interview_data.get('special_instructions', '')
        }
    
    @staticmethod
    def prepare_message_data(user: User, message: Message, **kwargs) -> Dict[str, Any]:
        """Prepare data for new message notification email template"""
        sender = message.sender
        
        return {
            'user_name': user.get_full_name(),
            'sender_name': sender.get_full_name(),
            'sender_email': sender.email,
            'sender_role': sender.role.replace('_', ' ').title(),
            'sender_avatar': f"{kwargs.get('frontend_url', 'https://talentsphere.com')}/api/users/{sender.id}/avatar",
            'message_subject': message.subject,
            'message_preview': message.content[:100] + '...' if len(message.content) > 100 else message.content,
            'message_date': message.created_at.strftime('%B %d, %Y at %I:%M %p'),
            'message_url': f"{kwargs.get('frontend_url', 'https://talentsphere.com')}/messages/{message.id}",
            'reply_url': f"{kwargs.get('frontend_url', 'https://talentsphere.com')}/messages/compose?reply_to={message.id}",
            'has_attachments': len(message.attachments) > 0 if hasattr(message, 'attachments') else False,
            'attachment_count': len(message.attachments) if hasattr(message, 'attachments') else 0,
            'is_urgent': message.priority == 'urgent' if hasattr(message, 'priority') else False
        }
    
    @staticmethod
    def prepare_system_data(user: User, system_data: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """Prepare data for system notification email template"""
        return {
            'user_name': user.get_full_name(),
            'title': system_data.get('title', 'System Notification'),
            'message': system_data.get('message', ''),
            'notification_type': system_data.get('type', 'general'),
            'stats': {
                'profile_completion': system_data.get('profile_completion', 75),
                'applications_sent': system_data.get('applications_sent', 0),
                'messages_unread': system_data.get('messages_unread', 0),
                'jobs_saved': system_data.get('jobs_saved', 0)
            },
            'recommendations': system_data.get('recommendations', [
                'Complete your profile to get better job matches',
                'Upload a professional profile photo',
                'Add more skills to your profile'
            ]),
            'recent_activity': system_data.get('recent_activity', []),
            'action_url': system_data.get('action_url', f"{kwargs.get('frontend_url', 'https://talentsphere.com')}/dashboard"),
            'action_text': system_data.get('action_text', 'Visit Dashboard')
        }
    
    @staticmethod
    def prepare_welcome_data(user: User, **kwargs) -> Dict[str, Any]:
        """Prepare data for welcome email template"""
        return {
            'user_name': user.get_full_name(),
            'user_email': user.email,
            'user_role': user.role.replace('_', ' ').title(),
            'registration_date': user.created_at.strftime('%B %d, %Y'),
            'dashboard_url': f"{kwargs.get('frontend_url', 'https://talentsphere.com')}/dashboard",
            'profile_url': f"{kwargs.get('frontend_url', 'https://talentsphere.com')}/profile",
            'jobs_url': f"{kwargs.get('frontend_url', 'https://talentsphere.com')}/jobs",
            'onboarding_steps': [
                {
                    'title': 'Complete Your Profile',
                    'description': 'Add your skills, experience, and preferences',
                    'url': f"{kwargs.get('frontend_url', 'https://talentsphere.com')}/profile/edit",
                    'completed': False
                },
                {
                    'title': 'Upload Your Resume',
                    'description': 'Make it easy for employers to find you',
                    'url': f"{kwargs.get('frontend_url', 'https://talentsphere.com')}/profile/resume",
                    'completed': False
                },
                {
                    'title': 'Set Job Preferences',
                    'description': 'Tell us what kind of job you\'re looking for',
                    'url': f"{kwargs.get('frontend_url', 'https://talentsphere.com')}/profile/preferences",
                    'completed': False
                }
            ],
            'features': [
                {
                    'icon': '🎯',
                    'title': 'Smart Job Matching',
                    'description': 'Get personalized job recommendations based on your profile'
                },
                {
                    'icon': '💬',
                    'title': 'Direct Messaging',
                    'description': 'Connect directly with employers and recruiters'
                },
                {
                    'icon': '📊',
                    'title': 'Application Tracking',
                    'description': 'Track your applications and get status updates'
                }
            ],
            'tips': [
                'Keep your profile updated to get better job matches',
                'Set up job alerts for positions you\'re interested in',
                'Engage with companies and recruiters on the platform'
            ]
        }


class EnhancedNotificationService:
    """Enhanced notification service that integrates HTML templates with real data"""
    
    def __init__(self, email_service):
        self.email_service = email_service
        self.template_handler = NotificationTemplateHandler()
    
    def send_job_alert(self, user_id: int, job_id: int, **kwargs) -> bool:
        """Send job alert with beautiful HTML template"""
        try:
            user = User.query.get(user_id)
            job = Job.query.get(job_id)
            
            if not user or not job:
                return False
            
            template_data = self.template_handler.prepare_job_alert_data(user, job, **kwargs)
            
            return self.email_service.create_and_send_notification(
                user_id=user_id,
                notification_type='job_alert',
                title=f"New Job Alert: {job.title}",
                message=f"We found a new job that matches your preferences: {job.title} at {template_data['company_name']}",
                variables=template_data,
                send_email=True
            )
            
        except Exception as e:
            print(f"Error sending job alert: {e}")
            return False
    
    def send_application_status_update(self, application_id: int, new_status: str, **kwargs) -> bool:
        """Send application status update with beautiful HTML template"""
        try:
            application = Application.query.get(application_id)
            if not application:
                return False
            
            user = application.applicant
            template_data = self.template_handler.prepare_application_status_data(user, application, new_status, **kwargs)
            
            return self.email_service.create_and_send_notification(
                user_id=user.id,
                notification_type='application_status',
                title=f"Application Update: {application.job.title}",
                message=f"Your application status has been updated to: {new_status.replace('_', ' ').title()}",
                variables=template_data,
                send_email=True
            )
            
        except Exception as e:
            print(f"Error sending application status update: {e}")
            return False
    
    def send_interview_reminder(self, user_id: int, interview_data: Dict[str, Any], **kwargs) -> bool:
        """Send interview reminder with beautiful HTML template"""
        try:
            user = User.query.get(user_id)
            if not user:
                return False
            
            template_data = self.template_handler.prepare_interview_reminder_data(user, interview_data, **kwargs)
            
            return self.email_service.create_and_send_notification(
                user_id=user_id,
                notification_type='interview_reminder',
                title=f"Interview Reminder: {interview_data.get('job_title', 'Position')}",
                message=f"Your interview is scheduled for {template_data['interview_date']} at {template_data['interview_time']}",
                variables=template_data,
                send_email=True
            )
            
        except Exception as e:
            print(f"Error sending interview reminder: {e}")
            return False
    
    def send_new_message_notification(self, user_id: int, message_id: int, **kwargs) -> bool:
        """Send new message notification with beautiful HTML template"""
        try:
            user = User.query.get(user_id)
            message = Message.query.get(message_id)
            
            if not user or not message:
                return False
            
            template_data = self.template_handler.prepare_message_data(user, message, **kwargs)
            
            return self.email_service.create_and_send_notification(
                user_id=user_id,
                notification_type='message',
                title=f"New Message: {message.subject}",
                message=f"You have a new message from {message.sender.get_full_name()}",
                variables=template_data,
                send_email=True
            )
            
        except Exception as e:
            print(f"Error sending message notification: {e}")
            return False
    
    def send_welcome_email(self, user_id: int, **kwargs) -> bool:
        """Send welcome email with beautiful HTML template"""
        try:
            user = User.query.get(user_id)
            if not user:
                return False
            
            template_data = self.template_handler.prepare_welcome_data(user, **kwargs)
            
            return self.email_service.create_and_send_notification(
                user_id=user_id,
                notification_type=NotificationType.WELCOME,
                title=f"Welcome to TalentSphere, {user.get_full_name()}!",
                message="Welcome to TalentSphere! We're excited to help you find your dream job.",
                variables=template_data,
                send_email=True
            )
            
        except Exception as e:
            print(f"Error sending welcome email: {e}")
            return False
    
    def send_system_notification(self, user_id: int, system_data: Dict[str, Any], **kwargs) -> bool:
        """Send system notification with beautiful HTML template"""
        try:
            user = User.query.get(user_id)
            if not user:
                return False
            
            template_data = self.template_handler.prepare_system_data(user, system_data, **kwargs)
            
            return self.email_service.create_and_send_notification(
                user_id=user_id,
                notification_type='system',
                title=system_data.get('title', 'System Notification'),
                message=system_data.get('message', ''),
                variables=template_data,
                send_email=True
            )
            
        except Exception as e:
            print(f"Error sending system notification: {e}")
            return False