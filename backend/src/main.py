import os
import secrets
import sys
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
from src.models.user import db
from src.utils.db_optimization import create_optimized_engine
from src.models.company import Company, CompanyBenefit, CompanyTeamMember
from src.models.job import Job, JobCategory, JobBookmark, JobAlert, JobShare
from src.models.job_template import JobTemplate
#from src.models.application import Application, ApplicationActivity, ApplicationQuestion, ApplicationTemplate
#from src.models.featured_ad import FeaturedAd, FeaturedAdPackage, Payment, Subscription
from src.models.notification import Notification, NotificationTemplate, Review, ReviewVote, Message
from src.models.notification_preferences import NotificationPreference, NotificationDeliveryLog, NotificationQueue
from src.models.ads import (
    AdCampaign, AdCreative, AdPlacement, AdCampaignPlacement,
    AdImpression, AdClick, AdAnalyticsDaily, AdCredit, AdReview, AdReviewAudit
)
from src.models.career_agent import (
    CareerProfile, CareerEvidence, ImportedCareerDocument, CareerTargetJob,
    CareerDocumentPackage, CareerDocument, CareerDocumentVersion,
    CareerGenerationStage, CareerSubscriptionPlan, CareerSubscription,
    CareerPaymentTransaction, CareerGenerationUsage, CareerMatchAnalysis,
    CareerQualityReport, CareerAIUsageLog, CareerExportRecord,
    CareerApplicationDocument,
)
from src.routes.user import user_bp
from src.routes.auth import auth_bp, role_required, token_required
from src.routes.company import company_bp
from src.routes.job import job_bp
from src.routes.job_template import job_template_bp
from src.routes.template import template_bp
from src.routes.application import application_bp
#from src.routes.featured_ad import featured_ad_bp
from src.routes.admin import admin_bp
from src.routes.notification import notification_bp
from src.routes.enhanced_notification import enhanced_notification_bp
from src.routes.job_alerts import job_alerts_bp
from src.routes.recommendations import recommendations_bp
from src.routes.employer import employer_bp
from src.routes.share_routes import share_bp
from src.routes.scholarship_share import scholarship_share_bp
from src.routes.scholarship import scholarship_bp
from src.routes.cleanup_routes import cleanup_bp
from src.routes.ads import ads_bp
from src.routes.upload import upload_bp
from src.routes.career_agent import career_agent_bp
from src.routes.ai import ai_bp

# Import optimized components
from src.routes.optimized_api import optimized_api_bp
from src.utils.performance import performance_metrics
from src.utils.cache_middleware import ResponseCacheMiddleware, advanced_cache, CACHE_WARMING_FUNCTIONS
from src.services.notification_scheduler import notification_scheduler
from src.services.job_scheduler import job_scheduler
from src.services.job_digest_scheduler import job_digest_scheduler
from src.services.cleanup_service import start_cleanup_service, stop_cleanup_service

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# Configuration
app.config['FLASK_ENV'] = os.getenv('FLASK_ENV', 'development')
configured_secret = os.getenv('SECRET_KEY')
if not configured_secret and app.config['FLASK_ENV'] == 'production':
    raise RuntimeError('SECRET_KEY must be configured in production')
app.config['SECRET_KEY'] = configured_secret or secrets.token_urlsafe(32)


def _positive_int_env(name, default, minimum=1):
    try:
        value = int(os.getenv(name, str(default)))
    except (TypeError, ValueError):
        value = default
    return max(minimum, value)


app.config['JWT_ACCESS_TOKEN_EXPIRES'] = _positive_int_env('JWT_ACCESS_TOKEN_EXPIRES', 3600, minimum=300)
app.config['JWT_REFRESH_GRACE_SECONDS'] = _positive_int_env('JWT_REFRESH_GRACE_SECONDS', 900)
app.config['JWT_CLOCK_SKEW_SECONDS'] = _positive_int_env('JWT_CLOCK_SKEW_SECONDS', 5)

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

# Database connection pooling - conservative for Aiven database limits
# Connection budget. The managed instance allows 20 connections and spends
# about 6 of them on its own services (pg_cron, pghoard, TimescaleDB,
# failover slots), leaving ~14 for the app. Gunicorn keeps one pool per
# worker, so that budget is divided by the worker count rather than applied
# per worker: a flat 2 + 1 gave a single usable connection per worker and made
# bursts queue for the whole timeout before failing with "QueuePool limit ...
# reached", while a flat larger value would exceed max_connections as soon as
# more than two workers are started.
_db_pool_budget = max(2, int(os.getenv('DB_POOL_BUDGET', '14')))
_db_pool_workers = max(1, int(os.getenv('WEB_CONCURRENCY', os.getenv('GUNICORN_WORKERS', '2'))))
_db_per_worker = max(1, _db_pool_budget // _db_pool_workers)
_db_pool_size = min(6, max(1, _db_per_worker - 2))
_db_max_overflow = min(2, max(0, _db_per_worker - _db_pool_size))

app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    # A fresh connection to the managed database costs seconds (TLS + network),
    # so a short recycle interval turned every five idle minutes into a
    # multi-second stall on the next checkout. Keep connections for 30 minutes
    # and let pre_ping discard the ones the server has already dropped.
    'pool_recycle': int(os.getenv('DB_POOL_RECYCLE', '1800')),
    'pool_size': max(1, int(os.getenv('DB_POOL_SIZE', str(_db_pool_size)))),
    'max_overflow': max(0, int(os.getenv('DB_MAX_OVERFLOW', str(_db_max_overflow)))),
    'pool_timeout': int(os.getenv('DB_POOL_TIMEOUT', '15')),
    'pool_use_lifo': True,
    'echo': os.getenv('SQL_ECHO', 'false').lower() == 'true',
    'echo_pool': os.getenv('SQL_ECHO_POOL', 'false').lower() == 'true'
}
if DATABASE_URL and DATABASE_URL.startswith(('postgres://', 'postgresql://')):
    app.config['SQLALCHEMY_ENGINE_OPTIONS']['connect_args'] = {
        'connect_timeout': int(os.getenv('DB_CONNECT_TIMEOUT', '10')),
        'application_name': os.getenv('DB_APPLICATION_NAME', 'AfriTech Opportunities'),
    }

# Enable CORS for all routes
# Get allowed origins from environment variable (comma-separated)
cors_origins = os.getenv('CORS_ORIGINS', "http://localhost:5173,http://localhost:5174,http://192.168.0.5:5173")
# Normalize origins into a clean list and remove empty entries
allowed_origins = [origin.strip() for origin in cors_origins.split(',') if origin.strip()]
# Always include localhost dev ports if not present (helps local testing)
fallback_dev_origins = (
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000",
    "http://0.0.0.0:5173",
    "http://0.0.0.0:5174",
)

if app.config['FLASK_ENV'] != 'production':
    # Local dev origins are a convenience only; never whitelist them in prod
    # (an untrusted client could otherwise reach the API with credentials).
    for dev_origin in fallback_dev_origins:
        if dev_origin not in allowed_origins:
            allowed_origins.append(dev_origin)

# Log effective CORS origins at startup for debugging
print(f"🔒 CORS allowed origins: {allowed_origins}")

# Initialize CORS with credentials support and required headers
CORS(
    app,
    origins=allowed_origins,
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    expose_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    max_age=600  # Cache preflight requests for 10 minutes
)

allowed_origins_set = set(allowed_origins)

@app.after_request
def ensure_cors_headers(response):
    """Guarantee CORS headers for whitelisted origins, even on error responses."""
    origin = request.headers.get('Origin')

    if origin and origin in allowed_origins_set:
        response.headers['Access-Control-Allow-Origin'] = origin
        # Ensure caches vary by origin when responses are shared
        vary_header = response.headers.get('Vary')
        if vary_header:
            if 'Origin' not in vary_header:
                response.headers['Vary'] = f"{vary_header}, Origin"
        else:
            response.headers['Vary'] = 'Origin'

        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        response.headers['Access-Control-Max-Age'] = '600'
        response.headers['Access-Control-Expose-Headers'] = 'Content-Type, Authorization'

    # Baseline security headers on every response
    response.headers.setdefault('X-Content-Type-Options', 'nosniff')
    response.headers.setdefault('X-Frame-Options', 'DENY')
    response.headers.setdefault('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.setdefault('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    if app.config.get('FLASK_ENV') == 'production':
        response.headers.setdefault(
            'Strict-Transport-Security', 'max-age=31536000; includeSubDomains'
        )

    return response

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
# app.register_blueprint(featured_ad_bp, url_prefix='/api')
app.register_blueprint(admin_bp, url_prefix='/api')
app.register_blueprint(notification_bp, url_prefix='/api')
app.register_blueprint(enhanced_notification_bp, url_prefix='/api/enhanced-notifications')
app.register_blueprint(job_alerts_bp, url_prefix='/api/job-alerts')
app.register_blueprint(recommendations_bp, url_prefix='/api')
app.register_blueprint(employer_bp, url_prefix='/api')
app.register_blueprint(share_bp, url_prefix='/api')
app.register_blueprint(scholarship_share_bp, url_prefix='/api')
app.register_blueprint(scholarship_bp, url_prefix='/api')
app.register_blueprint(career_agent_bp, url_prefix='/api/career-agent')
app.register_blueprint(ai_bp, url_prefix='/api/ai')
from src.routes.career_agent import limiter as career_limiter
career_limiter.init_app(app)  # Bind per-user Career Agent rate limiter
from src.rate_limit import auth_limiter
auth_limiter.init_app(app)  # Bind login/register/forgot-password rate limiter
app.register_blueprint(cleanup_bp, url_prefix='/api')
app.register_blueprint(ads_bp, url_prefix='/api/ads')
app.register_blueprint(upload_bp, url_prefix='/api/uploads')

# Register optimized API endpoints
app.register_blueprint(optimized_api_bp, url_prefix='/api')

# Register profile extensions blueprint for comprehensive job seeker profiles
from src.routes.profile_extensions import profile_extensions_bp
app.register_blueprint(profile_extensions_bp, url_prefix='/api/profile')

# Register profile export and optimization blueprint
from src.routes.profile_export import profile_export_bp
app.register_blueprint(profile_export_bp, url_prefix='/api/profile')

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
                    from src.models.career_agent import ensure_career_agent_indexes
                    ensure_career_agent_indexes()
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
            'message': 'AfriTech Opportunities API is running (optimized)',
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
@token_required
@role_required('admin')
def initialize_database():
    """Manually initialize database tables"""
    try:
        with app.app_context():
            db.create_all()
            from src.models.career_agent import ensure_career_agent_indexes
            ensure_career_agent_indexes()
        return {'status': 'success', 'message': 'Database tables created successfully'}, 200
    except Exception as e:
        return {'status': 'error', 'message': f'Database initialization failed: {str(e)}'}, 500

# Cache warming endpoint
@app.route('/api/warm-cache', methods=['POST'])
@token_required
@role_required('admin')
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
            from src.models.career_agent import ensure_career_agent_indexes
            ensure_career_agent_indexes()
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

    # Generation is durable in the database and continues independently of
    # the browser; this worker also recovers jobs after a process restart.
    try:
        from src.services.career_agent.worker import start_career_agent_worker
        start_career_agent_worker(app)
        print("✅ Career Agent background worker started")
    except Exception as e:
        print(f"⚠️  Career Agent background worker failed to start: {e}")
    
    # Start notification scheduler
    try:
        notification_scheduler.start()
        print("✅ Notification scheduler started")
    except Exception as e:
        print(f"⚠️  Notification scheduler failed to start: {e}")
    
    # Start job scheduler
    try:
        # Configure job scheduler from environment
        check_interval = int(os.getenv('JOB_CLEANUP_INTERVAL_HOURS', '6'))
        auto_delete = os.getenv('JOB_AUTO_DELETE_ENABLED', 'true').lower() == 'true'
        grace_period = int(os.getenv('JOB_GRACE_PERIOD_DAYS', '7'))
        notify_before = int(os.getenv('JOB_NOTIFY_BEFORE_EXPIRY_DAYS', '3'))
        
        job_scheduler.configure(
            check_interval_hours=check_interval,
            auto_delete_enabled=auto_delete,
            grace_period_days=grace_period,
            notify_before_expiry_days=notify_before
        )
        job_scheduler.start()
        print("✅ Job scheduler started")
    except Exception as e:
        print(f"⚠️  Job scheduler failed to start: {e}")    
    # Start job digest scheduler
    try:
        job_digest_scheduler.start(app)
        print("✅ Job digest scheduler started (daily & weekly digests)")
    except Exception as e:
        print(f"⚠️  Job digest scheduler failed to start: {e}")
    
    # Start cleanup service - DISABLED to prevent database connection exhaustion
    # The cleanup service was causing "too many clients" errors on the Aiven database
    # It will be re-enabled once connection pooling is optimized
    cleanup_enabled = os.getenv('ENABLE_CLEANUP_SERVICE', 'false').lower() == 'true'
    if cleanup_enabled:
        try:
            cleanup_service = start_cleanup_service(app)
            if cleanup_service and cleanup_service.is_running:
                print("✅ Cleanup service started (external jobs & scholarships auto-delete)")
            else:
                print("⚠️  Cleanup service initialized but may not be running in all workers")
        except Exception as e:
            print(f"⚠️  Cleanup service failed to start: {e}")
    else:
        print("⚠️  Cleanup service disabled (set ENABLE_CLEANUP_SERVICE=true to enable)")
    
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
