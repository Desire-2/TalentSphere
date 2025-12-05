# TalentSphere AI Coding Agent Instructions

## Project Architecture & Context

**TalentSphere** is a full-stack job portal with AI-powered features, built with Flask (backend) and React/Vite (frontend). The system supports multiple user roles (job_seeker, employer, admin, external_admin) with sophisticated features including AI-powered job/scholarship parsing, analytics, notifications, and payment processing.

### Core Directory Structure

```
TalentSphere/
├── backend/                    # Flask API server
│   ├── src/
│   │   ├── models/            # SQLAlchemy models with relationships
│   │   ├── routes/            # API blueprints organized by feature
│   │   ├── services/          # Business logic (email, notifications, AI)
│   │   └── utils/             # Utilities (DB optimization, caching)
│   ├── requirements.txt       # Python dependencies
│   └── docker-compose.yml     # Container orchestration
└── talentsphere-frontend/     # React SPA
    ├── src/
    │   ├── pages/             # Route components (nested by feature)
    │   ├── components/        # Reusable UI components
    │   ├── services/          # API clients and AI parsers
    │   └── config/            # Environment configuration
    └── package.json
```

## Development Workflows

### Backend Development
- **Start server**: `cd backend && python src/main.py` (development) or `./start_optimized.sh` (production)
- **Database migration**: Run `python init_db.py` for full schema setup with sample data
- **Testing**: Run specific test scripts like `python test_enhanced_notifications.py` or `python test_simple_email_templates.py`
- **Performance monitoring**: `./start_monitoring.sh` launches dashboard at localhost:5002

### Frontend Development
- **Start dev server**: `cd talentsphere-frontend && npm run dev` (Vite dev server on port 5173)
- **API proxy**: Vite proxies `/api/*` to `http://localhost:5001` (backend)
- **Environment**: Copy `.env.example` → `.env` and configure `VITE_GEMINI_API_KEY` for AI features
- **Build**: `npm run build` or `./build-production.sh` for enhanced production builds

### AI Features Integration
The project includes sophisticated AI parsers using Google Gemini:
- **Job Parser**: `aiJobParser.js` extracts 25+ fields from job postings
- **Scholarship Parser**: `aiScholarshipParser.js` extracts 40+ fields from scholarship content
- **Integration**: Both parsers are integrated into admin forms with collapsible UI panels
- **API Key**: Requires `VITE_GEMINI_API_KEY` in frontend `.env`

## Project-Specific Patterns

### Database Models & Relationships
```python
# Models use SQLAlchemy with cascade relationships
class User(db.Model):
    applications = db.relationship('Application', backref='applicant', cascade='all, delete-orphan')
    
# Always use db_transaction decorator for data operations
@db_transaction
def create_user_with_profile(user_data, profile_data):
    # Business logic here
```

### API Route Structure
```python
# Routes organized by feature in src/routes/
from flask import Blueprint, request, jsonify
from src.utils.db_utils import safe_db_operation

feature_bp = Blueprint('feature', __name__)

@feature_bp.route('/endpoint', methods=['POST'])
@token_required  # Authentication decorator
@role_required('employer', 'admin')  # Role-based access
def endpoint_handler(current_user):
    return safe_db_operation(lambda: business_logic())
```

### Frontend Component Patterns
- **Layouts**: Role-specific layouts (`AdminLayout`, `ExternalAdminLayout`) with nested routing
- **Routes**: Organized by feature in `src/pages/` with role-based protection (`ProtectedRoute`, `AdminRoute`)
- **Services**: API clients in `src/services/` return consistent response format: `{success, data, message}`
- **State Management**: Uses React hooks + context, no external state library
- **UI Components**: Shadcn/ui components in `src/components/ui/`

### Configuration Management
- **Backend**: Environment via `.env` with production overrides in deployment scripts
- **Frontend**: `src/config/environment.js` centralizes all `VITE_*` variables with validation
- **Feature Flags**: Environment-controlled features (debug logs, API logging, development mode)

### Performance Optimizations
- **Backend**: Redis caching middleware, connection pooling, query optimization with 38+ strategic indexes
- **Database**: Optimized Gunicorn config in `gunicorn.optimized.conf.py`
- **Monitoring**: Real-time performance dashboard via `monitor_performance.py`

### Testing Strategy
- **Integration Tests**: Scripts like `test_enhanced_notifications.py` test full workflows
- **Email Templates**: `test_simple_email_templates.py` validates HTML email generation
- **Database**: `verify_database_schema.py` checks schema consistency
- **AI Parsers**: Test files with real-world samples validate extraction accuracy

### Deployment Configuration
- **Production**: `deploy-production.sh` handles full deployment preparation
- **Docker**: Optimized containers with `docker-compose.optimized.yml`
- **Render**: `render.yaml` + `verify_deployment.sh` for cloud deployment
- **Environment**: Separate `.env.production` files with security validations

## Critical Integration Points

### Notification System
- **Email Service**: Yahoo SMTP integration via `src/services/email_service.py`
- **Templates**: HTML email templates with dynamic content in `src/services/notification_templates.py`
- **Queue System**: Background processing with notification preferences and delivery logs
- **Frontend**: Real-time notifications via `/api/notifications` endpoints

### Role-Based Access System
- **Backend**: JWT-based auth with role validation decorators
- **Frontend**: Route protection with role-specific layouts and navigation
- **Roles**: `job_seeker`, `employer`, `admin`, `external_admin` with hierarchical permissions

### AI-Powered Content Processing
- **Google Gemini Integration**: Uses `gemini-2.5-flash-lite` model for optimal free-tier performance
- **Content Extraction**: Structured JSON output with field validation and data cleaning
- **Category Matching**: Dynamic category matching based on backend data
- **Error Handling**: Comprehensive quota and rate limiting management

### Payment & Analytics Integration
- **Featured Ads**: Payment processing with analytics tracking
- **Revenue Analytics**: Dashboard with comprehensive reporting
- **Performance Metrics**: Real-time monitoring with custom dashboards

## Quick Start Commands

```bash
# Full development setup
cd backend && python init_db.py  # Database with sample data
python src/main.py &              # Start backend
cd ../talentsphere-frontend
npm install && npm run dev        # Start frontend

# Production deployment verification
cd backend && ./verify_deployment.sh  # Check deployment readiness
./deploy-production.sh                 # Full production setup
```

When working with this codebase, always check existing patterns in similar components, use the role-based access system properly, and test AI features with the provided sample content in documentation files.