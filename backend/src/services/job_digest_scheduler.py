"""
Job Digest Scheduler
Schedules and runs daily/weekly job digest emails
"""

import schedule
import time
import threading
from datetime import datetime
import os

from src.services.job_notification_service import job_notification_service


class JobDigestScheduler:
    """Scheduler for running job digest tasks"""
    
    def __init__(self):
        self.running = False
        self.thread = None
        self.enabled = os.getenv('JOB_DIGEST_ENABLED', 'true').lower() == 'true'
    
    def start(self):
        """Start the scheduler in a background thread"""
        if not self.enabled:
            print("⚠️  Job digest scheduler is disabled")
            return
        
        if self.running:
            print("⚠️  Job digest scheduler is already running")
            return
        
        self.running = True
        self.thread = threading.Thread(target=self._run_scheduler, daemon=True)
        self.thread.start()
        print("✅ Job digest scheduler started")
    
    def stop(self):
        """Stop the scheduler"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)
        print("🛑 Job digest scheduler stopped")
    
    def _run_scheduler(self):
        """Run the scheduler loop"""
        # Schedule daily digest at 9:00 AM
        schedule.every().day.at("09:00").do(self._run_daily_digest)
        
        # Schedule weekly digest on Monday at 9:00 AM
        schedule.every().monday.at("09:00").do(self._run_weekly_digest)
        
        print("📅 Scheduled tasks:")
        print("   - Daily digest: Every day at 09:00")
        print("   - Weekly digest: Every Monday at 09:00")
        
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
            print(f"📧 Running daily job digest at {datetime.now()}")
            result = job_notification_service.send_daily_digest()
            print(f"✅ Daily digest complete: {result}")
        except Exception as e:
            print(f"❌ Daily digest failed: {e}")
    
    def _run_weekly_digest(self):
        """Run weekly digest task"""
        try:
            print(f"📧 Running weekly job digest at {datetime.now()}")
            result = job_notification_service.send_weekly_digest()
            print(f"✅ Weekly digest complete: {result}")
        except Exception as e:
            print(f"❌ Weekly digest failed: {e}")
    
    def run_daily_digest_now(self):
        """Manually trigger daily digest (for testing)"""
        return self._run_daily_digest()
    
    def run_weekly_digest_now(self):
        """Manually trigger weekly digest (for testing)"""
        return self._run_weekly_digest()


# Create singleton instance
job_digest_scheduler = JobDigestScheduler()
