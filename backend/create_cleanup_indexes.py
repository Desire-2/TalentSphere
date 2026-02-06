"""
Add database indexes for cleanup service performance optimization
Run this script to create indexes that will speed up cleanup queries
"""

import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv()

from flask import Flask
from src.models.user import db
from src.models.job import Job
from src.models.scholarship import Scholarship

def create_app():
    """Create minimal Flask app"""
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

def create_cleanup_indexes():
    """Create indexes to optimize cleanup queries"""
    app = create_app()
    
    with app.app_context():
        print("="*80)
        print("CREATING CLEANUP OPTIMIZATION INDEXES")
        print("="*80)
        
        try:
            # Detect database type
            db_url = str(db.engine.url)
            is_sqlite = 'sqlite' in db_url
            is_postgres = 'postgres' in db_url
            
            print(f"\nDatabase: {db_url}")
            print(f"Type: {'SQLite' if is_sqlite else 'PostgreSQL' if is_postgres else 'Unknown'}")
            
            # Create indexes for Jobs table
            print("\n📊 Creating indexes for Jobs table...")
            
            # Index on job_source for filtering external jobs
            print("  - Creating index on job_source...")
            db.session.execute(db.text(
                "CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(job_source)"
            ))
            
            # Composite index on job_source and application_deadline
            print("  - Creating composite index on (job_source, application_deadline)...")
            db.session.execute(db.text(
                "CREATE INDEX IF NOT EXISTS idx_jobs_source_deadline ON jobs(job_source, application_deadline)"
            ))
            
            # Composite index on job_source and expires_at
            print("  - Creating composite index on (job_source, expires_at)...")
            db.session.execute(db.text(
                "CREATE INDEX IF NOT EXISTS idx_jobs_source_expires ON jobs(job_source, expires_at)"
            ))
            
            # Create indexes for Scholarships table
            print("\n🎓 Creating indexes for Scholarships table...")
            
            # Index on scholarship_source
            print("  - Creating index on scholarship_source...")
            db.session.execute(db.text(
                "CREATE INDEX IF NOT EXISTS idx_scholarships_source ON scholarships(scholarship_source)"
            ))
            
            # Composite index on scholarship_source and application_deadline
            print("  - Creating composite index on (scholarship_source, application_deadline)...")
            db.session.execute(db.text(
                "CREATE INDEX IF NOT EXISTS idx_scholarships_source_deadline ON scholarships(scholarship_source, application_deadline)"
            ))
            
            # Commit all indexes
            db.session.commit()
            
            print("\n" + "="*80)
            print("✅ INDEXES CREATED SUCCESSFULLY")
            print("="*80)
            print("\nCleanup queries should now be much faster!")
            print("Restart your backend server to see the improvement.")
            print("\n" + "="*80)
            
        except Exception as e:
            db.session.rollback()
            print(f"\n❌ Error creating indexes: {str(e)}")
            print("\nThis might be because:")
            print("  1. Indexes already exist (this is OK)")
            print("  2. Database connection issue")
            print("  3. Permission issue")
            import traceback
            traceback.print_exc()
            return False
        
        return True

if __name__ == '__main__':
    print("\n🚀 Cleanup Service Performance Optimization")
    print("This will create database indexes to speed up cleanup queries\n")
    
    success = create_cleanup_indexes()
    sys.exit(0 if success else 1)
