import os
import sys
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from src.models.user import db
from src.utils.db_optimization import create_optimized_engine
from src.models.company import Company, CompanyBenefit, CompanyTeamMember
from src.models.job import Job, JobCategory, JobBookmark, JobAlert, JobShare
from src.models.job_template import JobTemplate
from src.models.application import Application, ApplicationActivity, ApplicationQuestion, ApplicationTemplate
from src.models.featured_ad import FeaturedAd, FeaturedAdPackage, Payment, Subscription
from src.models.notification import Notification, NotificationTemplate, Review, ReviewVote, Message
from src.models.notification_preferences import NotificationPreference, NotificationDeliveryLog, NotificationQueue
from src.routes.user import user_bp
from src.routes.auth import auth_bp
from src.routes.company import company_bp
from src.routes.job import job_bp
from src.routes.job_template import job_template_bp
from src.routes.template import template_bp
from src.routes.application import application_bp
from src.routes.featured_ad import featured_ad_bp
from src.routes.admin import admin_bp
from src.routes.notification import notification_bp
from src.routes.enhanced_notification import enhanced_notification_bp
from src.routes.job_alerts import job_alerts_bp
from src.routes.recommendations import recommendations_bp
from src.routes.employer import employer_bp
from src.routes.share_routes import share_bp
from src.routes.scholarship import scholarship_bp

# Import optimized components
from src.routes.optimized_api import optimized_api_bp
from src.utils.performance import performance_metrics
from src.utils.cache_middleware import ResponseCacheMiddleware, advanced_cache, CACHE_WARMING_FUNCTIONS
from src.services.notification_scheduler import notification_scheduler

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'asdf#FGSgvasgf$5$WGT')
app.config['FLASK_ENV'] = os.getenv('FLASK_ENV', 'development')

# Database configuration
DATABASE_URL = os.getenv('DATABASE_URL')
if DATABASE_URL:
    # Production: Use PostgreSQL from Render
    # Handle both postgres:// and postgresql:// URLs
    if DATABASE_URL.startswith('postgres://'):
        DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
    print(f"Using PostgreSQL database")
else:
    # Development: Use SQLite
    db_path = os.path.join(os.path.dirname(__file__), 'database', 'app.db')
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"
    print(f"Using SQLite database at {db_path}")

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Ultra-optimized performance settings
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': int(os.getenv('DB_POOL_RECYCLE', '1800')),  # 30 minutes
    'pool_size': int(os.getenv('DB_POOL_SIZE', '15')),  # Increased pool size
    'max_overflow': int(os.getenv('DB_MAX_OVERFLOW', '25')),  # Increased overflow
    'pool_timeout': int(os.getenv('DB_POOL_TIMEOUT', '20')),  # Reduced timeout
    'echo': os.getenv('SQL_ECHO', 'false').lower() == 'true',
    'echo_pool': os.getenv('SQL_ECHO_POOL', 'false').lower() == 'true'
}

# Enable CORS for all routes
# Get allowed origins from environment variable (comma-separated)
cors_origins = os.getenv('CORS_ORIGINS', "http://localhost:5173,http://localhost:5174")
CORS(app, origins=[origin.strip() for origin in cors_origins.split(',')], 
    allow_headers=["Content-Type", "Authorization"])

# Initialize performance monitoring
performance_metrics(app)

# Initialize cache middleware
cache_middleware = ResponseCacheMiddleware(app, default_ttl=300)

# Register blueprints (original)
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(company_bp, url_prefix='/api')
app.register_blueprint(job_bp, url_prefix='/api')
app.register_blueprint(job_template_bp, url_prefix='/api')
app.register_blueprint(template_bp, url_prefix='/api')
app.register_blueprint(application_bp, url_prefix='/api')
app.register_blueprint(featured_ad_bp, url_prefix='/api')
app.register_blueprint(admin_bp, url_prefix='/api')
app.register_blueprint(notification_bp, url_prefix='/api')
app.register_blueprint(enhanced_notification_bp, url_prefix='/api/enhanced-notifications')
app.register_blueprint(job_alerts_bp, url_prefix='/api/job-alerts')
app.register_blueprint(recommendations_bp, url_prefix='/api')
app.register_blueprint(employer_bp, url_prefix='/api')
app.register_blueprint(share_bp, url_prefix='/api')
app.register_blueprint(scholarship_bp, url_prefix='/api')

# Register optimized API endpoints
app.register_blueprint(optimized_api_bp, url_prefix='/api')

# Health check endpoint (optimized)
@app.route('/health', methods=['GET'])
def health_check():
    """Ultra-fast health check endpoint"""
    try:
        # Quick database ping (optimized)
        if not hasattr(health_check, '_db_initialized'):
            try:
                with app.app_context():
                    db.create_all()
                health_check._db_initialized = True
                print("✅ Database tables created successfully (lazy initialization)")
            except Exception as e:
                print(f"⚠️  Database initialization failed during health check: {e}")
        
        # Lightning-fast connection test
        with app.app_context():
            db.session.execute(db.text('SELECT 1'))
            db.session.commit()
        
        # Cache status
        cache_status = 'enabled' if advanced_cache.enabled else 'disabled'
        
        return jsonify({
            'status': 'healthy',
            'message': 'TalentSphere API is running (optimized)',
            'timestamp': datetime.utcnow().isoformat(),
            'database': 'connected',
            'cache': cache_status,
            'version': '2.0-optimized'
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'message': str(e),
            'timestamp': datetime.utcnow().isoformat(),
            'database': 'disconnected',
            'cache': 'unknown'
        }), 503

# Database initialization endpoint
@app.route('/api/init-db', methods=['POST'])
def initialize_database():
    """Manually initialize database tables"""
    try:
        with app.app_context():
            db.create_all()
        return {'status': 'success', 'message': 'Database tables created successfully'}, 200
    except Exception as e:
        return {'status': 'error', 'message': f'Database initialization failed: {str(e)}'}, 500

# Cache warming endpoint
@app.route('/api/warm-cache', methods=['POST'])
def warm_cache():
    """Warm cache with frequently accessed data"""
    try:
        advanced_cache.warm_cache(CACHE_WARMING_FUNCTIONS)
        return jsonify({
            'status': 'success',
            'message': 'Cache warming completed',
            'functions_executed': len(CACHE_WARMING_FUNCTIONS)
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Cache warming failed: {str(e)}'
        }), 500

# Initialize database
db.init_app(app)

def init_database():
    """Initialize database tables with error handling"""
    try:
        with app.app_context():
            db.create_all()
            print("✅ Database tables created successfully")
            return True
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False

def warm_cache_on_startup():
    """Warm cache during application startup"""
    try:
        with app.app_context():
            print("🔥 Warming up cache...")
            advanced_cache.warm_cache(CACHE_WARMING_FUNCTIONS)
            print("✅ Cache warming completed")
    except Exception as e:
        print(f"⚠️  Cache warming failed: {e}")

# Initialize database only in specific cases
if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=5001, help='Port to run the server on')
    parser.add_argument('--no-init-db', action='store_true', help='Skip database initialization')
    parser.add_argument('--warm-cache', action='store_true', help='Warm cache on startup')
    args = parser.parse_args()
    
    # Only initialize database when running directly (development mode) unless skipped
    if not args.no_init_db:
        init_database()
    
    # Start notification scheduler
    try:
        notification_scheduler.start()
        print("✅ Notification scheduler started")
    except Exception as e:
        print(f"⚠️  Notification scheduler failed to start: {e}")
    
    # Warm cache if requested
    if args.warm_cache:
        warm_cache_on_startup()
    
    # Use debug mode only in development
    debug_mode = os.getenv('FLASK_ENV', 'development') == 'development'
    app.run(host='0.0.0.0', port=args.port, debug=debug_mode)
elif os.getenv('INIT_DB_ON_STARTUP', 'false').lower() == 'true':
    # Only initialize database if explicitly requested
    try:
        init_database()
    except Exception as e:
        print(f"⚠️  Database initialization skipped: {e}")
        print("💡 Database will be initialized on first request")
        
    # Warm cache in production
    if os.getenv('WARM_CACHE_ON_STARTUP', 'true').lower() == 'true':
        warm_cache_on_startup()
else:
    print("💡 Database initialization deferred to first API request")
    
    # Still warm cache in production
    if os.getenv('FLASK_ENV', 'development') == 'production':
        warm_cache_on_startup()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # Don't serve static files for API routes
    if path.startswith('api/'):
        return "API route not found", 404
    
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404
