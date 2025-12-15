"""
Job Scheduler Service
Handles automated cleanup and management of jobs
"""

import logging
import threading
import time
from datetime import datetime, timedelta
from typing import Optional

from src.models.user import db
from src.models.job import Job
from src.models.application import Application
from src.models.notification import Notification


class JobScheduler:
    """Service for automated job management and cleanup"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.is_running = False
        self.scheduler_thread = None
        # Check every 6 hours by default (configurable via environment)
        self.check_interval = 6 * 60 * 60  # 6 hours in seconds
        self.auto_delete_enabled = True  # Can be configured
        self.grace_period_days = 7  # Grace period before deletion after expiry
        self.notify_before_expiry_days = 3  # Notify employers before expiry
        
    def start(self):
        """Start the job scheduler"""
        if self.is_running:
            self.logger.warning("Job scheduler is already running")
            return
        
        self.is_running = True
        self.scheduler_thread = threading.Thread(target=self._run_scheduler, daemon=True)
        self.scheduler_thread.start()
        self.logger.info("Job scheduler started")
    
    def stop(self):
        """Stop the job scheduler"""
        if not self.is_running:
            return
        
        self.is_running = False
        if self.scheduler_thread:
            self.scheduler_thread.join(timeout=5)
        self.logger.info("Job scheduler stopped")
    
    def _run_scheduler(self):
        """Main scheduler loop"""
        while self.is_running:
            try:
                self._mark_expired_jobs()
                self._notify_expiring_jobs()
                
                if self.auto_delete_enabled:
                    self._delete_old_expired_jobs()
                
                time.sleep(self.check_interval)
                
            except Exception as e:
                self.logger.error(f"Error in job scheduler loop: {str(e)}")
                time.sleep(self.check_interval)
    
    def _mark_expired_jobs(self):
        """Mark jobs as expired if their expiry date has passed"""
        try:
            current_time = datetime.utcnow()
            
            # Find published jobs that have expired but not marked as such
            expired_jobs = Job.query.filter(
                Job.expires_at <= current_time,
                Job.status == 'published',
                Job.is_active == True
            ).all()
            
            if not expired_jobs:
                return
            
            self.logger.info(f"Marking {len(expired_jobs)} jobs as expired")
            
            for job in expired_jobs:
                job.status = 'expired'
                job.is_active = False
                
                # Log the action
                self.logger.info(
                    f"Job #{job.id} '{job.title}' marked as expired "
                    f"(expired on: {job.expires_at.isoformat()})"
                )
                
                # Optionally notify the employer
                self._notify_job_expired(job)
            
            db.session.commit()
            self.logger.info(f"Successfully marked {len(expired_jobs)} jobs as expired")
            
        except Exception as e:
            db.session.rollback()
            self.logger.error(f"Error marking expired jobs: {str(e)}")
    
    def _notify_expiring_jobs(self):
        """Notify employers about jobs expiring soon"""
        try:
            current_time = datetime.utcnow()
            warning_date = current_time + timedelta(days=self.notify_before_expiry_days)
            
            # Find jobs expiring in the next N days that are still published
            expiring_jobs = Job.query.filter(
                Job.expires_at <= warning_date,
                Job.expires_at > current_time,
                Job.status == 'published',
                Job.is_active == True
            ).all()
            
            if not expiring_jobs:
                return
            
            self.logger.info(f"Found {len(expiring_jobs)} jobs expiring soon")
            
            for job in expiring_jobs:
                # Check if we've already sent a notification for this job
                # (avoid sending multiple notifications)
                recent_notification = Notification.query.filter(
                    Notification.user_id == job.posted_by,
                    Notification.notification_type == 'job_expiring_soon',
                    Notification.metadata.contains(f'"job_id": {job.id}'),
                    Notification.created_at >= current_time - timedelta(days=self.notify_before_expiry_days)
                ).first()
                
                if not recent_notification:
                    self._notify_job_expiring_soon(job)
            
            db.session.commit()
            
        except Exception as e:
            db.session.rollback()
            self.logger.error(f"Error notifying about expiring jobs: {str(e)}")
    
    def _delete_old_expired_jobs(self):
        """
        Delete jobs that have been expired for more than the grace period.
        This is a soft cleanup - only deletes jobs with no applications or after a grace period.
        """
        try:
            current_time = datetime.utcnow()
            grace_period_date = current_time - timedelta(days=self.grace_period_days)
            
            # Find jobs that expired more than grace_period_days ago
            old_expired_jobs = Job.query.filter(
                Job.expires_at <= grace_period_date,
                Job.status == 'expired'
            ).all()
            
            if not old_expired_jobs:
                return
            
            deleted_count = 0
            skipped_count = 0
            
            for job in old_expired_jobs:
                # Check if job has applications
                application_count = Application.query.filter_by(job_id=job.id).count()
                
                # Only delete jobs with no applications or very old ones
                if application_count == 0:
                    self.logger.info(
                        f"Deleting expired job #{job.id} '{job.title}' "
                        f"(expired on: {job.expires_at.isoformat()}, no applications)"
                    )
                    db.session.delete(job)
                    deleted_count += 1
                else:
                    # For jobs with applications, just keep them as expired
                    # You might want to archive them instead
                    self.logger.debug(
                        f"Skipping job #{job.id} '{job.title}' "
                        f"({application_count} applications exist)"
                    )
                    skipped_count += 1
            
            if deleted_count > 0:
                db.session.commit()
                self.logger.info(
                    f"Deleted {deleted_count} old expired jobs, "
                    f"skipped {skipped_count} jobs with applications"
                )
            
        except Exception as e:
            db.session.rollback()
            self.logger.error(f"Error deleting old expired jobs: {str(e)}")
    
    def _notify_job_expired(self, job: Job):
        """Send notification to employer that their job has expired"""
        try:
            from src.models.user import User
            
            employer = User.query.get(job.posted_by)
            if not employer:
                return
            
            notification = Notification(
                user_id=job.posted_by,
                title=f"Job Posting Expired: {job.title}",
                message=f"Your job posting '{job.title}' has expired and is no longer visible to job seekers. You can renew it from your dashboard.",
                notification_type="job_expired",
                priority="normal",
                metadata=f'{{"job_id": {job.id}, "job_title": "{job.title}", "expired_at": "{job.expires_at.isoformat()}"}}',
                action_url=f"/employer/jobs/{job.id}",
                is_read=False,
                send_email=True
            )
            
            db.session.add(notification)
            self.logger.info(f"Created expiration notification for job #{job.id}")
            
        except Exception as e:
            self.logger.error(f"Error creating job expiration notification: {str(e)}")
    
    def _notify_job_expiring_soon(self, job: Job):
        """Send notification to employer that their job is expiring soon"""
        try:
            from src.models.user import User
            
            employer = User.query.get(job.posted_by)
            if not employer:
                return
            
            days_left = (job.expires_at - datetime.utcnow()).days
            
            notification = Notification(
                user_id=job.posted_by,
                title=f"Job Posting Expiring Soon: {job.title}",
                message=f"Your job posting '{job.title}' will expire in {days_left} day{'s' if days_left != 1 else ''}. Consider extending the deadline to keep it visible.",
                notification_type="job_expiring_soon",
                priority="high",
                metadata=f'{{"job_id": {job.id}, "job_title": "{job.title}", "expires_at": "{job.expires_at.isoformat()}", "days_left": {days_left}}}',
                action_url=f"/employer/jobs/{job.id}/edit",
                is_read=False,
                send_email=True
            )
            
            db.session.add(notification)
            self.logger.info(
                f"Created expiring-soon notification for job #{job.id} "
                f"({days_left} days left)"
            )
            
        except Exception as e:
            self.logger.error(f"Error creating job expiring-soon notification: {str(e)}")
    
    def configure(
        self, 
        check_interval_hours: Optional[int] = None,
        auto_delete_enabled: Optional[bool] = None,
        grace_period_days: Optional[int] = None,
        notify_before_expiry_days: Optional[int] = None
    ):
        """Configure scheduler parameters"""
        if check_interval_hours is not None:
            self.check_interval = check_interval_hours * 60 * 60
            self.logger.info(f"Check interval set to {check_interval_hours} hours")
        
        if auto_delete_enabled is not None:
            self.auto_delete_enabled = auto_delete_enabled
            self.logger.info(f"Auto-delete {'enabled' if auto_delete_enabled else 'disabled'}")
        
        if grace_period_days is not None:
            self.grace_period_days = grace_period_days
            self.logger.info(f"Grace period set to {grace_period_days} days")
        
        if notify_before_expiry_days is not None:
            self.notify_before_expiry_days = notify_before_expiry_days
            self.logger.info(f"Expiry notification set to {notify_before_expiry_days} days before")
    
    def run_manual_cleanup(self):
        """Manually trigger a cleanup cycle (useful for testing or admin actions)"""
        self.logger.info("Manual cleanup triggered")
        try:
            self._mark_expired_jobs()
            
            if self.auto_delete_enabled:
                self._delete_old_expired_jobs()
            
            self.logger.info("Manual cleanup completed successfully")
            return True
        except Exception as e:
            self.logger.error(f"Error during manual cleanup: {str(e)}")
            return False


# Global scheduler instance
job_scheduler = JobScheduler()
