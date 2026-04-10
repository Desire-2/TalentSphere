"""
Job Digest Scheduler
Schedules and runs daily/weekly job digest emails
"""

import schedule
import time
import threading
from datetime import datetime
import os
import hashlib
from sqlalchemy import text

from src.services.job_notification_service import job_notification_service
from src.models.user import db


class JobDigestScheduler:
    """Scheduler for running job digest tasks"""
    
    def __init__(self):
        self.running = False
        self.thread = None
        self.app = None
        self.enabled = os.getenv('JOB_DIGEST_ENABLED', 'true').lower() == 'true'
        self.local_timezone = os.getenv('APP_TIMEZONE', '')
        self.daily_digest_time = os.getenv('MORNING_JOB_UPDATE_TIME', '06:00')
        self.weekly_digest_time = os.getenv('WEEKLY_DIGEST_TIME', '18:00')
    
    def start(self, app=None):
        """Start the scheduler in a background thread"""
        if not self.enabled:
            print("⚠️  Job digest scheduler is disabled")
            return
        
        if self.running:
            print("⚠️  Job digest scheduler is already running")
            return
        
        self.app = app
        self.running = True
        self.thread = threading.Thread(target=self._run_scheduler, daemon=True)
        self.thread.start()
        print("✅ Job digest scheduler started")
    
    def stop(self):
        """Stop the scheduler"""
        self.running = False
        schedule.clear('job_digest_scheduler')
        if self.thread:
            self.thread.join(timeout=5)
        print("🛑 Job digest scheduler stopped")
    
    def _run_scheduler(self):
        """Run the scheduler loop"""
        # If APP_TIMEZONE is provided, run schedule checks in that timezone.
        if self.local_timezone:
            try:
                os.environ['TZ'] = self.local_timezone
                if hasattr(time, 'tzset'):
                    time.tzset()
                print(f"🌍 Job digest scheduler timezone set to {self.local_timezone}")
            except Exception as e:
                print(f"⚠️  Failed to apply APP_TIMEZONE '{self.local_timezone}': {e}")

        # Clear stale jobs in case of restart
        schedule.clear('job_digest_scheduler')

        # Schedule daily morning update
        schedule.every().day.at(self.daily_digest_time).do(self._run_daily_digest).tag('job_digest_scheduler')
        
        # Schedule weekly digest every Friday evening
        schedule.every().friday.at(self.weekly_digest_time).do(self._run_weekly_digest).tag('job_digest_scheduler')
        
        print("📅 Scheduled tasks:")
        print(f"   - Morning update: Every day at {self.daily_digest_time}")
        print(f"   - Weekly digest: Every Friday at {self.weekly_digest_time}")
        
        while self.running:
            try:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
            except Exception as e:
                print(f"❌ Error in scheduler: {e}")
                time.sleep(60)
    
    def _run_daily_digest(self):
        """Run daily digest task"""
        try:
            print(f"📧 Running morning top jobs update at {datetime.now()}")
            result = self._execute_with_distributed_lock(
                lock_name='morning_top_jobs_update',
                task=job_notification_service.send_morning_top_jobs_update
            )
            print(f"✅ Morning update complete: {result}")
            return result
        except Exception as e:
            print(f"❌ Morning update failed: {e}")
            return None
    
    def _run_weekly_digest(self):
        """Run weekly digest task"""
        try:
            print(f"📧 Running weekly jobs/scholarships digest at {datetime.now()}")
            result = self._execute_with_distributed_lock(
                lock_name='weekly_jobs_scholarships_digest',
                task=job_notification_service.send_weekly_jobs_scholarships_digest
            )
            print(f"✅ Weekly digest complete: {result}")
            return result
        except Exception as e:
            print(f"❌ Weekly digest failed: {e}")
            return None

    def _execute_with_distributed_lock(self, lock_name: str, task):
        """Execute task with a Postgres advisory lock to prevent multi-worker duplicates."""
        lock_id = int(hashlib.md5(f"talentsphere:{lock_name}".encode('utf-8')).hexdigest()[:8], 16)

        def run_locked():
            backend_name = db.engine.url.get_backend_name()
            if backend_name != 'postgresql':
                # Fallback for non-Postgres environments (e.g. local sqlite).
                return task()

            acquired = db.session.execute(
                text("SELECT pg_try_advisory_lock(:lock_id)"),
                {'lock_id': lock_id}
            ).scalar()

            if not acquired:
                print(f"⏭️  Skipping {lock_name}: lock held by another worker")
                return {'success': True, 'skipped': True, 'reason': 'lock_held'}

            try:
                return task()
            finally:
                db.session.execute(
                    text("SELECT pg_advisory_unlock(:lock_id)"),
                    {'lock_id': lock_id}
                )

        return self._execute_in_app_context(run_locked)

    def _execute_in_app_context(self, task):
        """Execute a scheduled task within Flask app context when available."""
        if self.app is not None:
            with self.app.app_context():
                return task()
        return task()
    
    def run_daily_digest_now(self):
        """Manually trigger daily digest (for testing)"""
        return self._run_daily_digest()
    
    def run_weekly_digest_now(self):
        """Manually trigger weekly digest (for testing)"""
        return self._run_weekly_digest()


# Create singleton instance
job_digest_scheduler = JobDigestScheduler()
