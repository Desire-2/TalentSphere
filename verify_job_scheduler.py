#!/usr/bin/env python3
"""
Verify Job Scheduler Installation
Checks that the job scheduler is properly installed and configured
"""

import os
import sys

def print_header(title):
    """Print formatted header"""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def check_file_exists(filepath, description):
    """Check if a file exists"""
    if os.path.exists(filepath):
        print(f"✅ {description}: {filepath}")
        return True
    else:
        print(f"❌ {description} NOT FOUND: {filepath}")
        return False

def check_env_variable(var_name, default=None):
    """Check if environment variable is set"""
    value = os.getenv(var_name, default)
    if value:
        print(f"✅ {var_name} = {value}")
        return True
    else:
        print(f"⚠️  {var_name} not set (will use default: {default})")
        return False

def check_imports():
    """Check if required modules can be imported"""
    print_header("Checking Python Imports")
    
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
    
    try:
        from src.services.job_scheduler import job_scheduler, JobScheduler
        print("✅ job_scheduler module imported successfully")
        print(f"✅ JobScheduler class available")
        return True
    except ImportError as e:
        print(f"❌ Failed to import job_scheduler: {e}")
        return False

def check_scheduler_instance():
    """Check the global scheduler instance"""
    print_header("Checking Scheduler Instance")
    
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
    
    try:
        from src.services.job_scheduler import job_scheduler
        
        print(f"✅ Scheduler check interval: {job_scheduler.check_interval / 3600} hours")
        print(f"✅ Auto-delete enabled: {job_scheduler.auto_delete_enabled}")
        print(f"✅ Grace period: {job_scheduler.grace_period_days} days")
        print(f"✅ Notify before expiry: {job_scheduler.notify_before_expiry_days} days")
        print(f"✅ Running: {job_scheduler.is_running}")
        
        return True
    except Exception as e:
        print(f"❌ Error checking scheduler: {e}")
        return False

def check_main_integration():
    """Check if main.py imports the scheduler"""
    print_header("Checking Main.py Integration")
    
    main_path = os.path.join(os.path.dirname(__file__), 'backend', 'src', 'main.py')
    
    if not os.path.exists(main_path):
        print(f"❌ main.py not found")
        return False
    
    with open(main_path, 'r') as f:
        content = f.read()
        
        checks = [
            ('job_scheduler import', 'from src.services.job_scheduler import job_scheduler'),
            ('scheduler start call', 'job_scheduler.start()'),
            ('scheduler configuration', 'job_scheduler.configure(')
        ]
        
        all_passed = True
        for check_name, check_string in checks:
            if check_string in content:
                print(f"✅ {check_name} found")
            else:
                print(f"❌ {check_name} NOT found")
                all_passed = False
        
        return all_passed

def check_admin_routes():
    """Check if admin routes are added"""
    print_header("Checking Admin Routes Integration")
    
    admin_path = os.path.join(os.path.dirname(__file__), 'backend', 'src', 'routes', 'admin.py')
    
    if not os.path.exists(admin_path):
        print(f"❌ admin.py not found")
        return False
    
    with open(admin_path, 'r') as f:
        content = f.read()
        
        routes = [
            '/admin/jobs/expiration-stats',
            '/admin/jobs/cleanup',
            '/admin/jobs/scheduler/config',
            '/admin/jobs/<int:job_id>/extend-expiry'
        ]
        
        all_found = True
        for route in routes:
            if route in content:
                print(f"✅ Route found: {route}")
            else:
                print(f"❌ Route NOT found: {route}")
                all_found = False
        
        return all_found

def check_env_configuration():
    """Check environment configuration"""
    print_header("Checking Environment Configuration")
    
    env_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
    
    if not os.path.exists(env_path):
        print(f"⚠️  .env file not found at {env_path}")
        return False
    
    with open(env_path, 'r') as f:
        content = f.read()
        
        configs = [
            'JOB_CLEANUP_INTERVAL_HOURS',
            'JOB_AUTO_DELETE_ENABLED',
            'JOB_GRACE_PERIOD_DAYS',
            'JOB_NOTIFY_BEFORE_EXPIRY_DAYS'
        ]
        
        all_found = True
        for config in configs:
            if config in content:
                # Extract value
                for line in content.split('\n'):
                    if line.startswith(config):
                        print(f"✅ {line}")
                        break
            else:
                print(f"⚠️  {config} not found (will use default)")
                all_found = False
        
        return all_found

def main():
    """Run all verification checks"""
    print("\n" + "=" * 70)
    print("  JOB SCHEDULER INSTALLATION VERIFICATION")
    print("  Verifying job auto-deletion system setup")
    print("=" * 70)
    
    results = {}
    
    # Check files
    print_header("Checking Required Files")
    results['scheduler_file'] = check_file_exists(
        'backend/src/services/job_scheduler.py',
        'Job Scheduler Service'
    )
    results['test_file'] = check_file_exists(
        'test_job_scheduler.py',
        'Test Script'
    )
    results['docs_file'] = check_file_exists(
        'JOB_AUTO_DELETION_SYSTEM.md',
        'Documentation'
    )
    results['quick_ref'] = check_file_exists(
        'JOB_AUTO_DELETION_QUICK_REF.md',
        'Quick Reference'
    )
    
    # Check imports
    results['imports'] = check_imports()
    
    # Check scheduler instance
    results['instance'] = check_scheduler_instance()
    
    # Check integrations
    results['main_integration'] = check_main_integration()
    results['admin_routes'] = check_admin_routes()
    
    # Check configuration
    results['env_config'] = check_env_configuration()
    
    # Summary
    print_header("Verification Summary")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    print(f"\n✅ Passed: {passed}/{total} checks")
    
    if passed == total:
        print("\n🎉 Job Scheduler is properly installed and configured!")
        print("\nNext steps:")
        print("1. Start the backend server: cd backend && python src/main.py")
        print("2. Check logs for: ✅ Job scheduler started")
        print("3. Test with: python3 test_job_scheduler.py (requires database)")
        print("4. Access admin endpoints: /api/admin/jobs/expiration-stats")
    else:
        print("\n⚠️  Some checks failed. Please review the output above.")
        print("\nRefer to JOB_AUTO_DELETION_SYSTEM.md for complete setup instructions.")
    
    print("\n" + "=" * 70)
    
    return passed == total

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
