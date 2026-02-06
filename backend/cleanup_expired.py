#!/usr/bin/env python3
"""
Manual Cleanup Script
Run cleanup of expired external jobs and scholarships manually
"""

import os
import sys
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv()

from flask import Flask
from src.models.user import db
from src.services.cleanup_service import CleanupService

def create_app():
    """Create minimal Flask app for cleanup"""
    app = Flask(__name__)
    
    # Database configuration
    DATABASE_URL = os.getenv('DATABASE_URL')
    if DATABASE_URL:
        if DATABASE_URL.startswith('postgres://'):
            DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
        app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
    else:
        db_path = os.path.join(os.path.dirname(__file__), 'database', 'app.db')
        app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"
    
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    
    return app

def run_cleanup(cleanup_type='all'):
    """Run cleanup process"""
    app = create_app()
    
    with app.app_context():
        print("="*80)
        print("AFRITECH OPPORTUNITIES - CLEANUP SERVICE")
        print("="*80)
        print(f"Started at: {datetime.utcnow().isoformat()}")
        print(f"Cleanup type: {cleanup_type}")
        print("-"*80)
        
        cleanup_service = CleanupService()
        
        # Get stats before cleanup
        print("\n📊 PRE-CLEANUP STATISTICS:")
        stats = cleanup_service.get_cleanup_stats()
        print(f"  External Jobs:")
        print(f"    - Total: {stats['jobs']['total_external']}")
        print(f"    - Eligible for deletion: {stats['jobs']['eligible_for_deletion']}")
        print(f"  External Scholarships:")
        print(f"    - Total: {stats['scholarships']['total_external']}")
        print(f"    - Eligible for deletion: {stats['scholarships']['eligible_for_deletion']}")
        print(f"  Cutoff Date: {stats['cutoff_date']}")
        print(f"  Grace Period: {stats['grace_period_days']} days")
        
        # Run cleanup
        print("\n🧹 RUNNING CLEANUP...")
        print("-"*80)
        
        jobs_deleted = 0
        scholarships_deleted = 0
        
        if cleanup_type in ['all', 'jobs']:
            print("\n🗑️  Cleaning up external jobs...")
            jobs_deleted = cleanup_service.cleanup_external_jobs()
            print(f"   ✅ Deleted {jobs_deleted} external jobs")
        
        if cleanup_type in ['all', 'scholarships']:
            print("\n🗑️  Cleaning up external scholarships...")
            scholarships_deleted = cleanup_service.cleanup_external_scholarships()
            print(f"   ✅ Deleted {scholarships_deleted} external scholarships")
        
        # Summary
        print("\n" + "="*80)
        print("CLEANUP SUMMARY")
        print("="*80)
        print(f"Jobs deleted: {jobs_deleted}")
        print(f"Scholarships deleted: {scholarships_deleted}")
        print(f"Total deleted: {jobs_deleted + scholarships_deleted}")
        print(f"Completed at: {datetime.utcnow().isoformat()}")
        print("="*80)
        
        return jobs_deleted + scholarships_deleted

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Cleanup expired external opportunities')
    parser.add_argument(
        '--type',
        choices=['all', 'jobs', 'scholarships'],
        default='all',
        help='Type of cleanup to perform (default: all)'
    )
    parser.add_argument(
        '--stats-only',
        action='store_true',
        help='Only show statistics without deleting'
    )
    
    args = parser.parse_args()
    
    if args.stats_only:
        # Show stats only
        app = create_app()
        with app.app_context():
            cleanup_service = CleanupService()
            stats = cleanup_service.get_cleanup_stats()
            
            print("="*80)
            print("CLEANUP STATISTICS")
            print("="*80)
            print(f"External Jobs:")
            print(f"  Total: {stats['jobs']['total_external']}")
            print(f"  Eligible for deletion: {stats['jobs']['eligible_for_deletion']}")
            print(f"  Active: {stats['jobs']['active']}")
            print(f"\nExternal Scholarships:")
            print(f"  Total: {stats['scholarships']['total_external']}")
            print(f"  Eligible for deletion: {stats['scholarships']['eligible_for_deletion']}")
            print(f"  Active: {stats['scholarships']['active']}")
            print(f"\nCutoff Date: {stats['cutoff_date']}")
            print(f"Grace Period: {stats['grace_period_days']} days")
            print(f"Total Eligible for Deletion: {stats['total_eligible_for_deletion']}")
            print("="*80)
    else:
        # Run cleanup
        total_deleted = run_cleanup(args.type)
        sys.exit(0 if total_deleted >= 0 else 1)
