"""
Job Notification Service
Sends notifications when new jobs are posted based on user preferences
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy import and_, or_
import os

from src.models.user import User, db
from src.models.job import Job, JobAlert
from src.models.notification_preferences import NotificationPreference
from src.services.notification_templates import EnhancedNotificationService
from src.services.email_service import email_service


class JobNotificationService:
    """Service for sending job notifications to users based on their preferences"""
    
    def __init__(self):
        self.enhanced_notification_service = EnhancedNotificationService(email_service)
        self.frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    
    def notify_new_job_posted(self, job_id: int) -> Dict[str, Any]:
        """
        Send notifications to users when a new job is posted
        Matches users based on job alerts and preferences
        """
        job = Job.query.get(job_id)
        if not job or job.status != 'published':
            return {
                'success': False,
                'message': 'Job not found or not published',
                'sent_count': 0,
                'failed_count': 0
            }
        
        # Find matching users
        matching_users = self._find_matching_users_for_job(job)
        
        sent_count = 0
        failed_count = 0
        immediate_notifications = []
        digest_notifications = []
        
        for user in matching_users:
            try:
                # Check user notification preferences
                prefs = user.notification_preferences
                if not prefs or not prefs.get_email_preference('job_alert'):
                    continue
                
                # Check if user wants immediate notifications or digest
                if prefs.immediate_for_urgent or not prefs.batch_notifications:
                    # Send immediate notification
                    success = self.enhanced_notification_service.send_job_alert(
                        user.id,
                        job.id,
                        frontend_url=self.frontend_url
                    )
                    if success:
                        sent_count += 1
                        immediate_notifications.append(user.email)
                    else:
                        failed_count += 1
                else:
                    # Queue for digest
                    digest_notifications.append(user.id)
                
            except Exception as e:
                print(f"❌ Failed to send job alert to user {user.id}: {e}")
                failed_count += 1
        
        return {
            'success': True,
            'message': f'Job notifications processed for {job.title}',
            'sent_count': sent_count,
            'failed_count': failed_count,
            'queued_for_digest': len(digest_notifications),
            'immediate_notifications': immediate_notifications,
            'digest_queue': digest_notifications
        }
    
    def _find_matching_users_for_job(self, job: Job) -> List[User]:
        """
        Find users who should receive notifications for this job
        Based on job alerts and notification preferences
        """
        matching_users = []
        
        # Get all active job alerts
        job_alerts = JobAlert.query.filter_by(is_active=True).all()
        
        for alert in job_alerts:
            if self._job_matches_alert(job, alert):
                user = User.query.get(alert.user_id)
                if user and user.is_active and user not in matching_users:
                    # Check notification preferences
                    prefs = NotificationPreference.query.filter_by(user_id=user.id).first()
                    if prefs and prefs.job_alerts_email:
                        matching_users.append(user)
        
        return matching_users
    
    def _job_matches_alert(self, job: Job, alert: JobAlert) -> bool:
        """Check if a job matches a user's job alert criteria"""
        
        # Check category match
        if alert.category_id and job.category_id != alert.category_id:
            return False
        
        # Check employment type match
        if alert.employment_type and job.employment_type != alert.employment_type:
            return False
        
        # Check experience level match
        if alert.experience_level and job.experience_level != alert.experience_level:
            return False
        
        # Check location match
        if alert.location:
            job_location = f"{job.city or ''} {job.state or ''} {job.country or ''}".strip().lower()
            if alert.location.lower() not in job_location:
                return False
        
        # Check remote preference
        if alert.is_remote is not None and job.is_remote != alert.is_remote:
            return False
        
        # Check salary minimum
        if alert.salary_min and job.salary_min:
            if job.salary_min < alert.salary_min:
                return False
        
        # Check keywords match
        if alert.keywords:
            keywords = [kw.strip().lower() for kw in alert.keywords.split(',')]
            job_text = f"{job.title} {job.description or ''} {job.required_skills or ''}".lower()
            
            # Job should match at least one keyword
            if not any(keyword in job_text for keyword in keywords):
                return False
        
        return True
    
    def send_daily_digest(self) -> Dict[str, Any]:
        """Send daily job digest to users who have enabled it"""
        return self._send_digest('daily')
    
    def send_weekly_digest(self) -> Dict[str, Any]:
        """Send weekly job digest to users who have enabled it"""
        return self._send_digest('weekly')
    
    def _send_digest(self, digest_type: str) -> Dict[str, Any]:
        """Send job digest (daily or weekly) to users"""
        
        # Get users with digest enabled
        if digest_type == 'daily':
            preferences = NotificationPreference.query.filter_by(
                daily_digest_enabled=True,
                email_enabled=True
            ).all()
            time_range = timedelta(days=1)
        else:  # weekly
            current_day = datetime.now().strftime('%A').lower()
            preferences = NotificationPreference.query.filter_by(
                weekly_digest_enabled=True,
                weekly_digest_day=current_day,
                email_enabled=True
            ).all()
            time_range = timedelta(days=7)
        
        sent_count = 0
        failed_count = 0
        
        for pref in preferences:
            try:
                user = User.query.get(pref.user_id)
                if not user or not user.is_active:
                    continue
                
                # Get jobs posted in the time range that match user's interests
                cutoff_date = datetime.utcnow() - time_range
                matching_jobs = self._get_matching_jobs_for_user(user, cutoff_date)
                
                if not matching_jobs:
                    continue  # Skip if no matching jobs
                
                # Send digest email
                success = self._send_digest_email(user, matching_jobs, digest_type)
                if success:
                    sent_count += 1
                else:
                    failed_count += 1
                    
            except Exception as e:
                print(f"❌ Failed to send {digest_type} digest to user {pref.user_id}: {e}")
                failed_count += 1
        
        return {
            'success': True,
            'message': f'{digest_type.capitalize()} digest sent',
            'digest_type': digest_type,
            'sent_count': sent_count,
            'failed_count': failed_count,
            'total_users': len(preferences)
        }
    
    def _get_matching_jobs_for_user(self, user: User, since_date: datetime) -> List[Job]:
        """Get jobs that match user's job alert preferences since a given date"""
        matching_jobs = set()
        
        # Get user's job alerts
        job_alerts = JobAlert.query.filter_by(
            user_id=user.id,
            is_active=True
        ).all()
        
        if not job_alerts:
            # If no job alerts, return recent published jobs (limited)
            recent_jobs = Job.query.filter(
                Job.status == 'published',
                Job.created_at >= since_date,
                Job.is_active == True
            ).order_by(Job.created_at.desc()).limit(10).all()
            return recent_jobs
        
        # Find jobs matching each alert
        for alert in job_alerts:
            jobs = Job.query.filter(
                Job.status == 'published',
                Job.created_at >= since_date,
                Job.is_active == True
            )
            
            # Apply alert filters
            if alert.category_id:
                jobs = jobs.filter(Job.category_id == alert.category_id)
            
            if alert.employment_type:
                jobs = jobs.filter(Job.employment_type == alert.employment_type)
            
            if alert.experience_level:
                jobs = jobs.filter(Job.experience_level == alert.experience_level)
            
            if alert.is_remote is not None:
                jobs = jobs.filter(Job.is_remote == alert.is_remote)
            
            if alert.salary_min:
                jobs = jobs.filter(Job.salary_min >= alert.salary_min)
            
            # Execute query and add to set
            for job in jobs.limit(20).all():
                if self._job_matches_alert(job, alert):
                    matching_jobs.add(job)
        
        # Return sorted by date (most recent first)
        return sorted(list(matching_jobs), key=lambda j: j.created_at, reverse=True)[:20]
    
    def _send_digest_email(self, user: User, jobs: List[Job], digest_type: str) -> bool:
        """Send digest email with multiple job listings"""
        try:
            # Prepare job data for template
            jobs_data = []
            for job in jobs[:10]:  # Limit to 10 jobs in digest
                jobs_data.append({
                    'id': job.id,
                    'title': job.title,
                    'company_name': job.company.name if job.company else job.external_company_name,
                    'location': job.get_location_display(),
                    'employment_type': job.employment_type,
                    'experience_level': job.experience_level,
                    'salary_range': job.get_salary_range(),
                    'url': f"{self.frontend_url}/jobs/{job.id}",
                    'posted_date': job.created_at.strftime('%B %d, %Y')
                })
            
            template_data = {
                'user_name': user.get_full_name(),
                'digest_type': digest_type,
                'job_count': len(jobs_data),
                'jobs': jobs_data,
                'preferences_url': f"{self.frontend_url}/settings/notifications",
                'unsubscribe_url': f"{self.frontend_url}/settings/notifications?tab=digest"
            }
            
            # Send via email service
            return email_service.create_and_send_notification(
                user_id=user.id,
                notification_type='job_alert',
                title=f"Your {digest_type.capitalize()} Job Digest - {len(jobs_data)} New Jobs",
                message=f"We found {len(jobs_data)} new jobs matching your preferences",
                variables=template_data,
                send_email=True
            )
            
        except Exception as e:
            print(f"❌ Error sending digest email to {user.email}: {e}")
            return False


# Create singleton instance
job_notification_service = JobNotificationService()
