import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.user import db
from src.models.company import Company, CompanyBenefit, CompanyTeamMember
from src.models.job import Job, JobCategory, JobBookmark, JobAlert
from src.models.application import Application, ApplicationActivity, ApplicationQuestion, ApplicationTemplate
from src.models.featured_ad import FeaturedAd, FeaturedAdPackage, Payment, Subscription
from src.models.notification import Notification, NotificationTemplate, Review, ReviewVote, Message
from src.routes.user import user_bp
from src.routes.auth import auth_bp
from src.routes.company import company_bp
from src.routes.job import job_bp
from src.routes.application import application_bp
from src.routes.featured_ad import featured_ad_bp
from src.routes.admin import admin_bp
from src.routes.notification import notification_bp
from src.routes.recommendations import recommendations_bp
from src.routes.employer import employer_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'asdf#FGSgvasgf$5$WGT')
app.config['FLASK_ENV'] = os.getenv('FLASK_ENV', 'development')

# Database configuration
DATABASE_URL = os.getenv('DATABASE_URL')
if DATABASE_URL:
    # Production: Use PostgreSQL from Render
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
else:
    # Development: Use SQLite
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Enable CORS for all routes
CORS(app, origins=["http://localhost:5173", "http://localhost:5174", "https://your-frontend-domain.vercel.app"], 
     allow_headers=["Content-Type", "Authorization"])

# Register blueprints
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(company_bp, url_prefix='/api')
app.register_blueprint(job_bp, url_prefix='/api')
app.register_blueprint(application_bp, url_prefix='/api')
app.register_blueprint(featured_ad_bp, url_prefix='/api')
app.register_blueprint(admin_bp, url_prefix='/api')
app.register_blueprint(notification_bp, url_prefix='/api')
app.register_blueprint(recommendations_bp, url_prefix='/api')
app.register_blueprint(employer_bp, url_prefix='/api')

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return {'status': 'healthy', 'message': 'TalentSphere API is running'}, 200

# uncomment if you need to use database
db.init_app(app)
with app.app_context():
    db.create_all()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
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


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=5001, help='Port to run the server on')
    args = parser.parse_args()
    
    # Use debug mode only in development
    debug_mode = os.getenv('FLASK_ENV', 'development') == 'development'
    app.run(host='0.0.0.0', port=args.port, debug=debug_mode)
