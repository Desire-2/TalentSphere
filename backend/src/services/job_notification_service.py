"""
Job Notification Service
Sends notifications when new jobs are posted based on user preferences
"""

from datetime import datetime, timedelta
from datetime import timezone as dt_timezone
from typing import List, Dict, Any
from sqlalchemy import and_, or_, func
import os
from zoneinfo import ZoneInfo

from src.models.user import User, db
from src.models.job import Job, JobAlert
from src.models.scholarship import Scholarship
from src.models.notification_preferences import NotificationPreference
from src.services.notification_templates import EnhancedNotificationService
from src.services.email_service import email_service


class JobNotificationService:
    """Service for sending job notifications to users based on their preferences"""
    
    def __init__(self):
        self.enhanced_notification_service = EnhancedNotificationService(email_service)
        self.frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        self.local_tz = self._get_local_timezone()
        self.local_tz_name = os.getenv('APP_TIMEZONE', 'system-local')
    
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
        """Backward-compatible alias for morning top jobs email update."""
        return self.send_morning_top_jobs_update()
    
    def send_weekly_digest(self) -> Dict[str, Any]:
        """Backward-compatible alias for weekly jobs/scholarships digest."""
        return self.send_weekly_jobs_scholarships_digest()

    def send_morning_top_jobs_update(self) -> Dict[str, Any]:
        """Send top 5 recently added/updated jobs and scholarships to all active users."""
        users = self._get_active_users_with_email()
        top_jobs = self._get_recently_updated_or_added_jobs(limit=5)
        top_scholarships = self._get_recently_updated_or_added_scholarships(limit=5)

        sent_count = 0
        failed_count = 0

        if not top_jobs and not top_scholarships:
            return {
                'success': True,
                'message': 'No eligible jobs or scholarships found for morning update',
                'sent_count': 0,
                'failed_count': 0,
                'total_users': len(users)
            }

        for user in users:
            try:
                if self._send_morning_update_email(user, top_jobs, top_scholarships):
                    sent_count += 1
                else:
                    failed_count += 1
            except Exception as e:
                print(f"❌ Failed to send morning update to user {user.id}: {e}")
                failed_count += 1

        return {
            'success': True,
            'message': 'Morning jobs/scholarships update completed',
            'sent_count': sent_count,
            'failed_count': failed_count,
            'total_users': len(users),
            'jobs_included': len(top_jobs),
            'scholarships_included': len(top_scholarships)
        }

    def send_weekly_jobs_scholarships_digest(self) -> Dict[str, Any]:
        """Send weekly digest with jobs and scholarships added in the current calendar week (Mon-Fri)."""
        users = self._get_active_users_with_email()
        week_start_utc, week_end_utc, week_start_local, week_end_local = self._get_current_calendar_week_window()

        weekly_jobs = Job.query.filter(
            Job.status == 'published',
            Job.is_active == True,
            Job.created_at >= week_start_utc,
            Job.created_at <= week_end_utc
        ).order_by(Job.created_at.desc()).limit(15).all()

        weekly_scholarships = Scholarship.query.filter(
            Scholarship.status == 'published',
            Scholarship.is_active == True,
            Scholarship.created_at >= week_start_utc,
            Scholarship.created_at <= week_end_utc
        ).order_by(Scholarship.created_at.desc()).limit(15).all()

        sent_count = 0
        failed_count = 0

        if not weekly_jobs and not weekly_scholarships:
            return {
                'success': True,
                'message': 'No new jobs or scholarships found for weekly digest',
                'sent_count': 0,
                'failed_count': 0,
                'total_users': len(users)
            }

        for user in users:
            try:
                if self._send_weekly_digest_email(user, weekly_jobs, weekly_scholarships, week_start_local, week_end_local):
                    sent_count += 1
                else:
                    failed_count += 1
            except Exception as e:
                print(f"❌ Failed to send weekly digest to user {user.id}: {e}")
                failed_count += 1

        return {
            'success': True,
            'message': 'Weekly jobs/scholarships digest completed',
            'sent_count': sent_count,
            'failed_count': failed_count,
            'total_users': len(users),
            'jobs_included': len(weekly_jobs),
            'scholarships_included': len(weekly_scholarships),
            'week_start': week_start_local.isoformat(),
            'week_end': week_end_local.isoformat(),
            'timezone': self.local_tz_name
        }

    def _get_current_calendar_week_window(self):
        """Get local calendar week window (Mon-Fri), plus UTC-naive boundaries for DB queries."""
        now_local = datetime.now(self.local_tz)
        monday_start_local = (now_local - timedelta(days=now_local.weekday())).replace(
            hour=0,
            minute=0,
            second=0,
            microsecond=0
        )
        friday_end_local = monday_start_local + timedelta(days=4, hours=23, minutes=59, seconds=59)
        effective_end_local = min(now_local, friday_end_local)

        monday_start_utc = monday_start_local.astimezone(dt_timezone.utc).replace(tzinfo=None)
        effective_end_utc = effective_end_local.astimezone(dt_timezone.utc).replace(tzinfo=None)

        return monday_start_utc, effective_end_utc, monday_start_local, effective_end_local

    def _get_local_timezone(self):
        """Resolve local timezone from APP_TIMEZONE or fall back to system timezone."""
        timezone_name = os.getenv('APP_TIMEZONE')
        if timezone_name:
            try:
                return ZoneInfo(timezone_name)
            except Exception:
                pass

        return datetime.now().astimezone().tzinfo
    
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

    def _get_active_users_with_email(self) -> List[User]:
        """Return active users with non-empty email addresses."""
        return User.query.filter(
            User.is_active == True,
            User.email.isnot(None),
            User.email != ''
        ).all()

    def _get_recently_updated_or_added_jobs(self, limit: int = 5) -> List[Job]:
        """Return latest jobs by most recent update/create timestamp."""
        recent_activity_expr = func.coalesce(Job.updated_at, Job.created_at)
        return Job.query.filter(
            Job.status == 'published',
            Job.is_active == True,
            or_(Job.expires_at.is_(None), Job.expires_at > datetime.utcnow())
        ).order_by(recent_activity_expr.desc()).limit(limit).all()

    def _get_recently_updated_or_added_scholarships(self, limit: int = 5) -> List[Scholarship]:
        """Return latest scholarships by most recent update/create timestamp."""
        recent_activity_expr = func.coalesce(Scholarship.updated_at, Scholarship.created_at)
        return Scholarship.query.filter(
            Scholarship.status == 'published',
            Scholarship.is_active == True,
            Scholarship.application_deadline > datetime.utcnow()
        ).order_by(recent_activity_expr.desc()).limit(limit).all()

    def _send_morning_update_email(self, user: User, jobs: List[Job], scholarships: List[Scholarship]) -> bool:
        """Send morning top jobs and scholarships email to a single user."""
        jobs_html = []
        jobs_text = []

        for idx, job in enumerate(jobs, start=1):
            company_name = self._get_job_company_name(job)
            jobs_html.append(
                f"""
                <li style=\"margin-bottom: 14px;\">
                    <a href=\"{self.frontend_url}/jobs/{job.id}\" style=\"color: #0f172a; text-decoration: none;\">
                        <strong>{idx}. {job.title}</strong>
                    </a><br>
                    <span style=\"color: #475569;\">{company_name} • {job.get_location_display() or 'Location not specified'}</span>
                </li>
                """
            )
            jobs_text.append(
                f"{idx}. {job.title} - {company_name} - {self.frontend_url}/jobs/{job.id}"
            )

        scholarships_html = []
        scholarships_text = []
        for idx, scholarship in enumerate(scholarships, start=1):
            organization_name = self._get_scholarship_organization_name(scholarship)
            scholarships_html.append(
                f"""
                <li style=\"margin-bottom: 14px;\">
                    <a href=\"{self.frontend_url}/scholarships/{scholarship.id}\" style=\"color: #0f172a; text-decoration: none;\">
                        <strong>{idx}. {scholarship.title}</strong>
                    </a><br>
                    <span style=\"color: #475569;\">{organization_name}</span>
                </li>
                """
            )
            scholarships_text.append(
                f"{idx}. {scholarship.title} - {organization_name} - {self.frontend_url}/scholarships/{scholarship.id}"
            )

        subject = "Morning Update: Top 5 latest jobs and scholarships"
        html_body = f"""
        <html>
            <body style=\"font-family: Arial, sans-serif; color: #111827;\">
                <h2 style=\"margin-bottom: 8px;\">Good morning {user.get_full_name()},</h2>
                <p>Here are today's top opportunities for you:</p>

                <h3 style=\"margin-bottom: 8px;\">Top Jobs ({len(jobs)})</h3>
                <ol>{''.join(jobs_html) if jobs_html else '<li>No new jobs right now.</li>'}</ol>

                <h3 style=\"margin-bottom: 8px; margin-top: 18px;\">Top Scholarships ({len(scholarships)})</h3>
                <ol>{''.join(scholarships_html) if scholarships_html else '<li>No new scholarships right now.</li>'}</ol>

                <p style=\"margin-top: 20px;\">
                    Explore more opportunities: <a href=\"{self.frontend_url}/jobs\">Browse all jobs</a><br>
                    Explore scholarships: <a href=\"{self.frontend_url}/scholarships\">Browse all scholarships</a>
                </p>
            </body>
        </html>
        """
        text_body = (
            f"Good morning {user.get_full_name()},\n\n"
            "Here are today's top opportunities:\n\n"
            f"Top Jobs ({len(jobs)}):\n"
            f"{('\n'.join(jobs_text)) if jobs_text else 'No new jobs right now.'}\n\n"
            f"Top Scholarships ({len(scholarships)}):\n"
            f"{('\n'.join(scholarships_text)) if scholarships_text else 'No new scholarships right now.'}\n\n"
            f"Browse all jobs: {self.frontend_url}/jobs\n"
            f"Browse all scholarships: {self.frontend_url}/scholarships"
        )

        return email_service._send_brevo_email(
            recipient_email=user.email,
            recipient_name=user.get_full_name(),
            subject=subject,
            html_body=html_body,
            text_body=text_body
        )

    def _send_weekly_digest_email(
        self,
        user: User,
        jobs: List[Job],
        scholarships: List[Scholarship],
        week_start: datetime,
        week_end: datetime
    ) -> bool:
        """Send weekly digest with jobs and scholarships added this week."""
        jobs_html = []
        jobs_text = []
        for idx, job in enumerate(jobs[:10], start=1):
            company_name = self._get_job_company_name(job)
            jobs_html.append(
                f"""
                <li style=\"margin-bottom: 10px;\">
                    <a href=\"{self.frontend_url}/jobs/{job.id}\" style=\"color: #0f172a; text-decoration: none;\">
                        <strong>{idx}. {job.title}</strong>
                    </a>
                    <span style=\"color: #475569;\"> - {company_name}</span>
                </li>
                """
            )
            jobs_text.append(f"{idx}. {job.title} - {company_name} - {self.frontend_url}/jobs/{job.id}")

        scholarships_html = []
        scholarships_text = []
        for idx, scholarship in enumerate(scholarships[:10], start=1):
            organization_name = self._get_scholarship_organization_name(scholarship)
            scholarships_html.append(
                f"""
                <li style=\"margin-bottom: 10px;\">
                    <a href=\"{self.frontend_url}/scholarships/{scholarship.id}\" style=\"color: #0f172a; text-decoration: none;\">
                        <strong>{idx}. {scholarship.title}</strong>
                    </a>
                    <span style=\"color: #475569;\"> - {organization_name}</span>
                </li>
                """
            )
            scholarships_text.append(
                f"{idx}. {scholarship.title} - {organization_name} - {self.frontend_url}/scholarships/{scholarship.id}"
            )

        subject = "Weekly Digest: Jobs and scholarships for your weekend"
        html_body = f"""
        <html>
            <body style=\"font-family: Arial, sans-serif; color: #111827;\">
                <h2 style=\"margin-bottom: 8px;\">Hello {user.get_full_name()},</h2>
                <p>
                    Here is your weekly digest for opportunities added this week
                    ({week_start.strftime('%B %d, %Y')} to {week_end.strftime('%B %d, %Y')})
                    to help you plan weekend applications.
                </p>

                <h3 style=\"margin-bottom: 8px;\">Jobs ({len(jobs)})</h3>
                <ol>{''.join(jobs_html) if jobs_html else '<li>No new jobs this week.</li>'}</ol>

                <h3 style=\"margin-bottom: 8px; margin-top: 18px;\">Scholarships ({len(scholarships)})</h3>
                <ol>{''.join(scholarships_html) if scholarships_html else '<li>No new scholarships this week.</li>'}</ol>

                <p style=\"margin-top: 20px;\">
                    Jobs: <a href=\"{self.frontend_url}/jobs\">Browse all jobs</a><br>
                    Scholarships: <a href=\"{self.frontend_url}/scholarships\">Browse all scholarships</a>
                </p>
            </body>
        </html>
        """
        text_body = (
            f"Hello {user.get_full_name()},\n\n"
            f"Weekly digest ({week_start.strftime('%B %d, %Y')} to {week_end.strftime('%B %d, %Y')})\n\n"
            f"Jobs ({len(jobs)}):\n"
            f"{('\n'.join(jobs_text)) if jobs_text else 'No new jobs this week.'}\n\n"
            f"Scholarships ({len(scholarships)}):\n"
            f"{('\n'.join(scholarships_text)) if scholarships_text else 'No new scholarships this week.'}\n\n"
            f"Jobs: {self.frontend_url}/jobs\n"
            f"Scholarships: {self.frontend_url}/scholarships"
        )

        return email_service._send_brevo_email(
            recipient_email=user.email,
            recipient_name=user.get_full_name(),
            subject=subject,
            html_body=html_body,
            text_body=text_body
        )

    def _get_job_company_name(self, job: Job) -> str:
        """Safely derive a company/organization display name for a job."""
        if getattr(job, 'company', None) and getattr(job.company, 'name', None):
            return job.company.name
        return job.external_company_name or 'Unknown company'

    def _get_scholarship_organization_name(self, scholarship: Scholarship) -> str:
        """Safely derive organization display name for a scholarship."""
        if getattr(scholarship, 'organization', None) and getattr(scholarship.organization, 'name', None):
            return scholarship.organization.name
        return scholarship.external_organization_name or 'Unknown organization'
    
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
