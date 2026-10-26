"""
Cleanup Service for External Jobs and Scholarships
Automatically deletes external jobs and scholarships 1 day after their deadline
"""

import logging
import os
import threading
from datetime import datetime, timedelta
from typing import Dict, List

from sqlalchemy import func, and_, or_
from sqlalchemy.exc import OperationalError
from src.models.user import db
from src.models.job import Job
from src.models.scholarship import Scholarship


class CleanupService:
    """Service for automated cleanup of expired external opportunities"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.is_running = False
        self.scheduler_thread = None
        self.app = None
        self._stop_event = threading.Event()
        # Check every 12 hours
        self.check_interval = max(
            60,
            int(os.getenv("CLEANUP_CHECK_INTERVAL_SECONDS", str(12 * 60 * 60))),
        )
        # Delete 1 day after deadline
        self.deletion_grace_period_days = 1
        # Cache for stats (5 minute TTL)
        self._stats_cache = None
        self._stats_cache_time = None
        self._stats_cache_ttl = 300  # 5 minutes
        
    def start(self, app=None):
        """Start the cleanup scheduler"""
        if self.is_running and self.scheduler_thread and self.scheduler_thread.is_alive():
            self.logger.warning("Cleanup service is already running")
            return False

        if app is None:
            self.logger.error(
                "Cleanup service requires a Flask application; refusing to start "
                "without an application context"
            )
            return False
        
        self.app = app
        self._stop_event.clear()
        self.is_running = True
        self.scheduler_thread = threading.Thread(
            target=self._run_scheduler,
            daemon=True,
            name="cleanup-service",
        )
        self.scheduler_thread.start()
        self.logger.info(
            "🧹 Cleanup service started - checking every %s hours",
            self.check_interval / 3600,
        )
        return True
    
    def stop(self):
        """Stop the cleanup scheduler"""
        if not self.is_running and not self.scheduler_thread:
            return
        
        self.is_running = False
        self._stop_event.set()
        if self.scheduler_thread:
            self.scheduler_thread.join(timeout=5)
        self.scheduler_thread = None
        self.logger.info("🛑 Cleanup service stopped")
    
    def _run_scheduler(self):
        """Main scheduler loop"""
        while self.is_running:
            try:
                self.logger.info("🔍 Running cleanup check...")

                if self.app is None:
                    self.logger.error(
                        "Cleanup check skipped because no Flask application is configured"
                    )
                else:
                    with self.app.app_context():
                        try:
                            jobs_deleted = self.cleanup_external_jobs()
                            scholarships_deleted = self.cleanup_external_scholarships()
                        finally:
                            # Explicitly release this thread's scoped session
                            # before the application context is torn down.
                            db.session.remove()

                    total_deleted = jobs_deleted + scholarships_deleted
                    if total_deleted > 0:
                        self.logger.info(
                            "✅ Cleanup complete: Deleted %s jobs and %s scholarships "
                            "(Total: %s)",
                            jobs_deleted,
                            scholarships_deleted,
                            total_deleted,
                        )
                    else:
                        self.logger.info("✅ Cleanup complete: No items to delete")
                
            except OperationalError:
                # The cleanup job is best-effort. A DNS outage or a temporary
                # database disconnect must defer work, not kill the thread.
                self.logger.warning(
                    "Cleanup check deferred because the database is unavailable; "
                    "it will retry on the next scheduled run"
                )
            except Exception:
                self.logger.exception("❌ Error in cleanup scheduler loop")

            if self._stop_event.wait(self.check_interval):
                break
    
    def get_cutoff_date(self) -> datetime:
        """
        Calculate the cutoff date for cleanup
        Items with deadlines before this date are eligible for deletion
        """
        return datetime.utcnow() - timedelta(days=self.deletion_grace_period_days)
    
    def cleanup_external_jobs(self) -> int:
        """
        Delete external jobs that are 1 day past their deadline
        Returns number of jobs deleted
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=self.deletion_grace_period_days)
            
            # Find external jobs past deadline + grace period
            # Check both application_deadline and expires_at
            expired_jobs = Job.query.filter(
                Job.job_source == 'external',
                db.or_(
                    db.and_(
                        Job.application_deadline.isnot(None),
                        Job.application_deadline <= cutoff_date
                    ),
                    db.and_(
                        Job.expires_at.isnot(None),
                        Job.expires_at <= cutoff_date
                    )
                )
            ).all()
            
            if not expired_jobs:
                self.logger.debug("No external jobs to delete")
                return 0
            
            deleted_count = 0
            deleted_jobs_info = []
            
            for job in expired_jobs:
                try:
                    job_info = {
                        'id': job.id,
                        'title': job.title,
                        'company': job.external_company_name or (job.company.name if job.company else 'Unknown'),
                        'deadline': job.application_deadline.isoformat() if job.application_deadline else None,
                        'expires_at': job.expires_at.isoformat() if job.expires_at else None,
                        'source': job.job_source
                    }
                    
                    # Delete the job (cascade will handle related records)
                    db.session.delete(job)
                    deleted_jobs_info.append(job_info)
                    deleted_count += 1
                    
                    self.logger.info(
                        f"🗑️  Deleted external job #{job.id}: '{job.title}' from "
                        f"{job_info['company']} (Deadline: {job_info['deadline'] or job_info['expires_at']})"
                    )
                    
                except Exception as e:
                    self.logger.error(f"Error deleting job #{job.id}: {str(e)}")
                    continue
            
            # Commit all deletions
            db.session.commit()
            
            # Invalidate stats cache
            self._stats_cache = None
            self._stats_cache_time = None
            
            if deleted_count > 0:
                self.logger.info(f"✅ Successfully deleted {deleted_count} external jobs")
                # Log summary
                self._log_deletion_summary('jobs', deleted_jobs_info)
            
            return deleted_count
            
        except OperationalError:
            self._reset_session()
            self.logger.warning(
                "External job cleanup deferred because the database is unavailable"
            )
            return 0
        except Exception:
            self._reset_session()
            self.logger.exception("❌ Error in cleanup_external_jobs")
            return 0
    
    def cleanup_external_scholarships(self) -> int:
        """
        Delete external scholarships that are 1 day past their application deadline
        Returns number of scholarships deleted
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=self.deletion_grace_period_days)
            
            # Find external scholarships past deadline + grace period
            expired_scholarships = Scholarship.query.filter(
                Scholarship.scholarship_source == 'external',
                Scholarship.application_deadline <= cutoff_date
            ).all()
            
            if not expired_scholarships:
                self.logger.debug("No external scholarships to delete")
                return 0
            
            deleted_count = 0
            deleted_scholarships_info = []
            
            for scholarship in expired_scholarships:
                try:
                    scholarship_info = {
                        'id': scholarship.id,
                        'title': scholarship.title,
                        'organization': scholarship.external_organization_name or 'Unknown',
                        'deadline': scholarship.application_deadline.isoformat(),
                        'source': scholarship.scholarship_source
                    }
                    
                    # Delete the scholarship (cascade will handle related records)
                    db.session.delete(scholarship)
                    deleted_scholarships_info.append(scholarship_info)
                    deleted_count += 1
                    
                    self.logger.info(
                        f"🗑️  Deleted external scholarship #{scholarship.id}: '{scholarship.title}' from "
                        f"{scholarship_info['organization']} (Deadline: {scholarship_info['deadline']})"
                    )
                    
                except Exception as e:
                    self.logger.error(f"Error deleting scholarship #{scholarship.id}: {str(e)}")
                    continue
            
            # Commit all deletions
            db.session.commit()
            
            # Invalidate stats cache
            self._stats_cache = None
            self._stats_cache_time = None
            
            if deleted_count > 0:
                self.logger.info(f"✅ Successfully deleted {deleted_count} external scholarships")
                # Log summary
                self._log_deletion_summary('scholarships', deleted_scholarships_info)
            
            return deleted_count
            
        except OperationalError:
            self._reset_session()
            self.logger.warning(
                "External scholarship cleanup deferred because the database is unavailable"
            )
            return 0
        except Exception:
            self._reset_session()
            self.logger.exception("❌ Error in cleanup_external_scholarships")
            return 0

    def _reset_session(self):
        """Rollback a failed operation without masking the original failure."""
        try:
            db.session.rollback()
        except Exception:
            self.logger.debug("Unable to rollback cleanup session", exc_info=True)
    
    def _log_deletion_summary(self, item_type: str, deleted_items: List[Dict]):
        """Log a summary of deleted items"""
        if not deleted_items:
            return
        
        self.logger.info(f"\n{'='*80}")
        self.logger.info(f"DELETION SUMMARY - {item_type.upper()}")
        self.logger.info(f"{'='*80}")
        self.logger.info(f"Total deleted: {len(deleted_items)}")
        self.logger.info(f"Timestamp: {datetime.utcnow().isoformat()}")
        self.logger.info(f"{'-'*80}")
        
        for item in deleted_items[:10]:  # Show first 10
            self.logger.info(
                f"  • ID: {item['id']} | {item['title'][:50]}... | "
                f"{item.get('company') or item.get('organization')}"
            )
        
        if len(deleted_items) > 10:
            self.logger.info(f"  ... and {len(deleted_items) - 10} more")
        
        self.logger.info(f"{'='*80}\n")
    
    def get_cleanup_stats(self) -> Dict:
        """Get statistics about items eligible for cleanup (with caching)"""
        # Check cache first
        now = datetime.utcnow()
        if (self._stats_cache is not None and 
            self._stats_cache_time is not None and 
            (now - self._stats_cache_time).total_seconds() < self._stats_cache_ttl):
            return self._stats_cache
        
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=self.deletion_grace_period_days)
            
            # Use optimized COUNT queries with direct SQL
            # Count external jobs eligible for deletion
            jobs_to_delete = db.session.query(func.count(Job.id)).filter(
                Job.job_source == 'external',
                or_(
                    and_(
                        Job.application_deadline.isnot(None),
                        Job.application_deadline <= cutoff_date
                    ),
                    and_(
                        Job.expires_at.isnot(None),
                        Job.expires_at <= cutoff_date
                    )
                )
            ).scalar() or 0
            
            # Count external scholarships eligible for deletion
            scholarships_to_delete = db.session.query(func.count(Scholarship.id)).filter(
                Scholarship.scholarship_source == 'external',
                Scholarship.application_deadline.isnot(None),
                Scholarship.application_deadline <= cutoff_date
            ).scalar() or 0
            
            # Count total external items
            total_external_jobs = db.session.query(func.count(Job.id)).filter(
                Job.job_source == 'external'
            ).scalar() or 0
            
            total_external_scholarships = db.session.query(func.count(Scholarship.id)).filter(
                Scholarship.scholarship_source == 'external'
            ).scalar() or 0
            
            result = {
                'jobs': {
                    'total_external': total_external_jobs,
                    'eligible_for_deletion': jobs_to_delete,
                    'active': total_external_jobs - jobs_to_delete
                },
                'scholarships': {
                    'total_external': total_external_scholarships,
                    'eligible_for_deletion': scholarships_to_delete,
                    'active': total_external_scholarships - scholarships_to_delete
                },
                'cutoff_date': cutoff_date.isoformat(),
                'grace_period_days': self.deletion_grace_period_days,
                'total_eligible_for_deletion': jobs_to_delete + scholarships_to_delete
            }
            
            # Update cache
            self._stats_cache = result
            self._stats_cache_time = now
            
            return result
            
        except OperationalError:
            self._reset_session()
            self.logger.warning("Cleanup statistics unavailable: database is unavailable")
            return {
                'error': 'database_unavailable',
                'jobs': {'total_external': 0, 'eligible_for_deletion': 0, 'active': 0},
                'scholarships': {'total_external': 0, 'eligible_for_deletion': 0, 'active': 0}
            }
        except Exception:
            self._reset_session()
            self.logger.exception("Error getting cleanup stats")
            return {
                'error': 'cleanup_stats_failed',
                'jobs': {'total_external': 0, 'eligible_for_deletion': 0, 'active': 0},
                'scholarships': {'total_external': 0, 'eligible_for_deletion': 0, 'active': 0}
            }
    
    def manual_cleanup(self) -> Dict:
        """
        Manually trigger cleanup process
        Returns summary of deletions
        """
        self.logger.info("🔧 Manual cleanup triggered")
        
        jobs_deleted = self.cleanup_external_jobs()
        scholarships_deleted = self.cleanup_external_scholarships()
        
        return {
            'success': True,
            'jobs_deleted': jobs_deleted,
            'scholarships_deleted': scholarships_deleted,
            'total_deleted': jobs_deleted + scholarships_deleted,
            'timestamp': datetime.utcnow().isoformat()
        }


# Singleton instance
_cleanup_service = None
_service_started = False  # Module-level flag to track if service was ever started

def get_cleanup_service() -> CleanupService:
    """Get or create the cleanup service singleton"""
    global _cleanup_service
    if _cleanup_service is None:
        _cleanup_service = CleanupService()
    return _cleanup_service

def start_cleanup_service(app=None):
    """Start the cleanup service"""
    global _service_started
    service = get_cleanup_service()
    _service_started = service.start(app=app) or _service_started
    return service

def stop_cleanup_service():
    """Stop the cleanup service"""
    service = get_cleanup_service()
    service.stop()

def is_service_started() -> bool:
    """Check if cleanup service was started (module-level check)"""
    global _service_started
    return _service_started or (get_cleanup_service().is_running if _cleanup_service else False)
