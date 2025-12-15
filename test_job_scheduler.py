#!/usr/bin/env python3
"""
Test script for job auto-deletion scheduler
Tests the job cleanup functionality and scheduler operations
"""

import os
import sys
from datetime import datetime, timedelta

# Set up path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from src.models.user import db
from src.models.job import Job
from src.models.application import Application
from src.models.company import Company
from src.models.user import User
from src.models.featured_ad import FeaturedAd  # Import FeaturedAd to avoid relationship errors
from src.services.job_scheduler import JobScheduler
from flask import Flask

# Create Flask app for testing
app = Flask(__name__)

# Use DATABASE_URL from environment (production) or fallback to SQLite
database_url = os.getenv('DATABASE_URL')
if database_url:
    # Production: Use PostgreSQL
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    print(f"✅ Using PostgreSQL database")
else:
    # Development: Use SQLite
    db_path = os.path.join(os.path.dirname(__file__), 'backend', 'database', 'app.db')
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"
    print(f"✅ Using SQLite database at {db_path}")

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)


def print_section(title):
    """Print a formatted section header"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)


def test_job_expiration_detection():
    """Test detection of expired jobs"""
    print_section("Testing Job Expiration Detection")
    
    with app.app_context():
        current_time = datetime.utcnow()
        
        # Count jobs by status
        total_jobs = Job.query.count()
        published_jobs = Job.query.filter_by(status='published').count()
        expired_jobs = Job.query.filter_by(status='expired').count()
        
        # Find jobs that should be expired but aren't marked
        should_be_expired = Job.query.filter(
            Job.expires_at <= current_time,
            Job.status == 'published',
            Job.is_active == True
        ).all()
        
        print(f"✅ Total jobs in database: {total_jobs}")
        print(f"✅ Published jobs: {published_jobs}")
        print(f"✅ Expired jobs: {expired_jobs}")
        print(f"⚠️  Jobs needing expiry update: {len(should_be_expired)}")
        
        if should_be_expired:
            print("\n📋 Jobs that need to be marked as expired:")
            for job in should_be_expired[:5]:  # Show first 5
                days_overdue = (current_time - job.expires_at).days
                print(f"   - Job #{job.id}: '{job.title}' (overdue by {days_overdue} days)")
        
        return len(should_be_expired)


def test_expiring_soon_jobs():
    """Test detection of jobs expiring soon"""
    print_section("Testing Jobs Expiring Soon")
    
    with app.app_context():
        current_time = datetime.utcnow()
        warning_date = current_time + timedelta(days=3)
        
        expiring_soon = Job.query.filter(
            Job.expires_at <= warning_date,
            Job.expires_at > current_time,
            Job.status == 'published',
            Job.is_active == True
        ).all()
        
        print(f"✅ Jobs expiring in next 3 days: {len(expiring_soon)}")
        
        if expiring_soon:
            print("\n📋 Jobs expiring soon:")
            for job in expiring_soon[:10]:  # Show first 10
                days_left = (job.expires_at - current_time).days
                app_count = Application.query.filter_by(job_id=job.id).count()
                print(f"   - Job #{job.id}: '{job.title}' ({days_left} days left, {app_count} applications)")
        
        return len(expiring_soon)


def test_deletable_expired_jobs():
    """Test detection of jobs eligible for deletion"""
    print_section("Testing Deletable Expired Jobs")
    
    with app.app_context():
        current_time = datetime.utcnow()
        grace_period_date = current_time - timedelta(days=7)
        
        # Find old expired jobs
        old_expired_jobs = Job.query.filter(
            Job.expires_at <= grace_period_date,
            Job.status == 'expired'
        ).all()
        
        # Check which ones have no applications
        deletable = []
        preserved = []
        
        for job in old_expired_jobs:
            app_count = Application.query.filter_by(job_id=job.id).count()
            if app_count == 0:
                deletable.append((job, app_count))
            else:
                preserved.append((job, app_count))
        
        print(f"✅ Old expired jobs (past grace period): {len(old_expired_jobs)}")
        print(f"✅ Deletable (no applications): {len(deletable)}")
        print(f"✅ Preserved (has applications): {len(preserved)}")
        
        if deletable:
            print("\n📋 Jobs eligible for deletion:")
            for job, _ in deletable[:5]:  # Show first 5
                days_since_expiry = (current_time - job.expires_at).days
                print(f"   - Job #{job.id}: '{job.title}' (expired {days_since_expiry} days ago)")
        
        if preserved:
            print("\n📋 Sample preserved jobs (has applications):")
            for job, app_count in preserved[:5]:  # Show first 5
                days_since_expiry = (current_time - job.expires_at).days
                print(f"   - Job #{job.id}: '{job.title}' ({app_count} applications, expired {days_since_expiry} days ago)")
        
        return len(deletable), len(preserved)


def test_scheduler_configuration():
    """Test scheduler configuration"""
    print_section("Testing Scheduler Configuration")
    
    scheduler = JobScheduler()
    
    print(f"✅ Check interval: {scheduler.check_interval / 3600} hours")
    print(f"✅ Auto-delete enabled: {scheduler.auto_delete_enabled}")
    print(f"✅ Grace period: {scheduler.grace_period_days} days")
    print(f"✅ Notify before expiry: {scheduler.notify_before_expiry_days} days")
    print(f"✅ Scheduler running: {scheduler.is_running}")
    
    # Test configuration change
    print("\n🔧 Testing configuration update...")
    scheduler.configure(
        check_interval_hours=12,
        grace_period_days=14
    )
    
    print(f"✅ New check interval: {scheduler.check_interval / 3600} hours")
    print(f"✅ New grace period: {scheduler.grace_period_days} days")
    
    return True


def test_manual_cleanup_dry_run():
    """Simulate manual cleanup without actually deleting"""
    print_section("Testing Manual Cleanup (Dry Run)")
    
    with app.app_context():
        current_time = datetime.utcnow()
        
        # Simulate marking expired jobs
        should_be_expired = Job.query.filter(
            Job.expires_at <= current_time,
            Job.status == 'published',
            Job.is_active == True
        ).all()
        
        print(f"📊 Would mark {len(should_be_expired)} jobs as expired")
        
        # Simulate deletion
        grace_period_date = current_time - timedelta(days=7)
        old_expired_jobs = Job.query.filter(
            Job.expires_at <= grace_period_date,
            Job.status == 'expired'
        ).all()
        
        deletable_count = 0
        for job in old_expired_jobs:
            app_count = Application.query.filter_by(job_id=job.id).count()
            if app_count == 0:
                deletable_count += 1
        
        print(f"📊 Would delete {deletable_count} old expired jobs")
        print(f"📊 Would preserve {len(old_expired_jobs) - deletable_count} jobs with applications")
        
        return True


def create_test_jobs():
    """Create test jobs with various expiration states"""
    print_section("Creating Test Jobs")
    
    with app.app_context():
        current_time = datetime.utcnow()
        
        # Get or create a test user and company
        test_user = User.query.filter_by(email='test@example.com').first()
        if not test_user:
            print("⚠️  No test user found. Cannot create test jobs.")
            return False
        
        test_company = Company.query.first()
        if not test_company:
            print("⚠️  No company found. Cannot create test jobs.")
            return False
        
        # Get a job category
        from src.models.job import JobCategory
        category = JobCategory.query.first()
        if not category:
            print("⚠️  No job category found. Cannot create test jobs.")
            return False
        
        test_jobs = []
        
        # Job expiring today
        job1 = Job(
            company_id=test_company.id,
            category_id=category.id,
            posted_by=test_user.id,
            title="Test Job - Expiring Today",
            slug="test-job-expiring-today",
            description="This job expires today",
            employment_type="full-time",
            status="published",
            is_active=True,
            expires_at=current_time,
            published_at=current_time - timedelta(days=30)
        )
        test_jobs.append(job1)
        
        # Job expiring in 2 days
        job2 = Job(
            company_id=test_company.id,
            category_id=category.id,
            posted_by=test_user.id,
            title="Test Job - Expiring in 2 Days",
            slug="test-job-expiring-in-2-days",
            description="This job expires in 2 days",
            employment_type="full-time",
            status="published",
            is_active=True,
            expires_at=current_time + timedelta(days=2),
            published_at=current_time - timedelta(days=28)
        )
        test_jobs.append(job2)
        
        # Job expired 10 days ago (should be marked expired)
        job3 = Job(
            company_id=test_company.id,
            category_id=category.id,
            posted_by=test_user.id,
            title="Test Job - Expired 10 Days Ago",
            slug="test-job-expired-10-days",
            description="This job expired 10 days ago",
            employment_type="full-time",
            status="published",  # Should be expired
            is_active=True,
            expires_at=current_time - timedelta(days=10),
            published_at=current_time - timedelta(days=40)
        )
        test_jobs.append(job3)
        
        try:
            for job in test_jobs:
                db.session.add(job)
            db.session.commit()
            
            print(f"✅ Created {len(test_jobs)} test jobs")
            for job in test_jobs:
                print(f"   - Job #{job.id}: '{job.title}'")
            
            return True
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error creating test jobs: {str(e)}")
            return False


def run_all_tests():
    """Run all test functions"""
    print("\n" + "=" * 80)
    print("  JOB AUTO-DELETION SCHEDULER TEST SUITE")
    print("  Testing job expiration and cleanup functionality")
    print("=" * 80)
    
    results = {}
    
    try:
        # Test 1: Expiration detection
        results['needs_expiry'] = test_job_expiration_detection()
        
        # Test 2: Expiring soon
        results['expiring_soon'] = test_expiring_soon_jobs()
        
        # Test 3: Deletable jobs
        deletable, preserved = test_deletable_expired_jobs()
        results['deletable'] = deletable
        results['preserved'] = preserved
        
        # Test 4: Scheduler config
        results['config_ok'] = test_scheduler_configuration()
        
        # Test 5: Dry run
        results['dry_run_ok'] = test_manual_cleanup_dry_run()
        
        # Summary
        print_section("Test Summary")
        print(f"✅ Jobs needing expiry update: {results['needs_expiry']}")
        print(f"✅ Jobs expiring soon (3 days): {results['expiring_soon']}")
        print(f"✅ Jobs eligible for deletion: {results['deletable']}")
        print(f"✅ Jobs preserved (has apps): {results['preserved']}")
        print(f"✅ Scheduler configuration: {'OK' if results['config_ok'] else 'FAILED'}")
        print(f"✅ Dry run simulation: {'OK' if results['dry_run_ok'] else 'FAILED'}")
        
        print("\n" + "=" * 80)
        print("  ALL TESTS COMPLETED")
        print("=" * 80)
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test suite failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Test job auto-deletion scheduler')
    parser.add_argument('--create-test-jobs', action='store_true',
                       help='Create test jobs with various expiration states')
    
    args = parser.parse_args()
    
    if args.create_test_jobs:
        create_test_jobs()
    else:
        run_all_tests()
