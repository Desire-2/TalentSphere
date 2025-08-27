# TalentSphere Job Portal Backend

A comprehensive Flask-based job portal backend with advanced features including job posting, application management, featured ads with payment processing, admin dashboard, AI recommendations, and real-time notifications.

## 🚀 Features

### Core Features
- **User Authentication & Authorization** - JWT-based auth with role-based access control
- **Job Management** - Complete job posting, searching, and filtering system
- **Application System** - Job application workflow with status tracking
- **Company Profiles** - Comprehensive company management with verification
- **User Profiles** - Detailed job seeker and employer profiles

### Advanced Features
- **Featured Ads & Payments** - Promotional job ads with integrated payment processing
- **Admin Dashboard** - Complete admin panel with analytics and user management
- **AI Recommendations** - Intelligent job and candidate matching system
- **Real-time Notifications** - In-app notifications and messaging system
- **Analytics & Reporting** - Comprehensive analytics for jobs, users, and revenue

### Technical Features
- **RESTful API** - Well-structured REST API with comprehensive documentation
- **Database Models** - Robust SQLAlchemy models with relationships
- **Security** - Password hashing, JWT tokens, input validation
- **CORS Support** - Cross-origin resource sharing for frontend integration
- **Error Handling** - Comprehensive error handling and validation

## 📋 Requirements

- Python 3.8+
- Flask 2.0+
- SQLAlchemy
- JWT for authentication
- SQLite (default) or PostgreSQL/MySQL

## 🛠️ Installation & Setup

### 1. Clone and Setup
```bash
# The project is already created using manus-create-flask-app
cd TalentSphere

# Activate virtual environment
source venv/bin/activate

# Install dependencies (already installed)
pip install -r requirements.txt
```

### 2. Database Setup
```bash
# Initialize database with sample data
python init_db.py

# Or just create tables without sample data
python -c "from src.main import app; from src.models.user import db; app.app_context().push(); db.create_all()"
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

### 4. Run the Application
```bash
# Development mode
python src/main.py

# Or using Flask CLI
export FLASK_APP=src/main.py
export FLASK_ENV=development
flask run --host=0.0.0.0 --port=5000
```

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=sqlite:///database/app.db

# Security
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key

# Email (for notifications)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# Payment Gateway (Stripe example)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# File Upload
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216  # 16MB
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Key Endpoints

#### Authentication
```bash
POST /auth/register          # Register new user
POST /auth/login             # User login
POST /auth/logout            # User logout
GET  /auth/profile           # Get user profile
PUT  /auth/profile           # Update user profile
POST /auth/change-password   # Change password
```

#### Jobs
```bash
GET    /jobs                 # Get jobs with filtering
GET    /jobs/{id}            # Get job details
POST   /jobs                 # Create job (employer)
PUT    /jobs/{id}            # Update job (employer)
DELETE /jobs/{id}            # Delete job (employer)
GET    /job-categories       # Get job categories
POST   /jobs/{id}/bookmark   # Bookmark job (job seeker)
```

#### Applications
```bash
POST /jobs/{id}/apply              # Apply for job
GET  /applications/{id}            # Get application details
PUT  /applications/{id}/status     # Update application status
GET  /my-applications              # Get user's applications
GET  /jobs/{id}/applications       # Get job applications (employer)
```

#### Companies
```bash
GET  /companies              # Get companies
GET  /companies/{id}         # Get company details
POST /companies              # Create company (employer)
PUT  /companies/{id}         # Update company (employer)
```

#### Featured Ads & Payments
```bash
GET  /featured-ad-packages         # Get available packages
POST /featured-ads                 # Create featured ad
POST /payments/{id}/process        # Process payment
GET  /featured-ads                 # Get user's featured ads
GET  /featured-ads/{id}/analytics  # Get ad analytics
```

#### Notifications & Messages
```bash
GET  /notifications                # Get notifications
POST /notifications/{id}/read      # Mark notification as read
GET  /messages                     # Get messages
POST /messages                     # Send message
GET  /conversations                # Get conversation list
```

#### Recommendations
```bash
GET /recommendations/jobs          # Get job recommendations (job seeker)
GET /recommendations/candidates    # Get candidate recommendations (employer)
GET /recommendations/similar-jobs  # Get similar jobs
```

#### Admin
```bash
GET  /admin/dashboard              # Admin dashboard
GET  /admin/users                  # Get users with filtering
POST /admin/users/{id}/toggle-status  # Toggle user status
GET  /admin/jobs                   # Get jobs for moderation
POST /admin/jobs/{id}/moderate     # Moderate job posting
GET  /admin/analytics/revenue      # Revenue analytics
GET  /admin/analytics/users        # User analytics
```

### Response Format
```json
{
  "success": true,
  "data": {...},
  "message": "Success message"
}
```

### Error Format
```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

### Pagination
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

## 🗄️ Database Schema

### Core Models
- **User** - User accounts with role-based access
- **JobSeekerProfile** - Job seeker specific information
- **EmployerProfile** - Employer specific information
- **Company** - Company information and verification
- **Job** - Job postings with detailed requirements
- **Application** - Job applications with status tracking

### Advanced Models
- **FeaturedAd** - Promotional job advertisements
- **Payment** - Payment processing and billing
- **Notification** - Real-time notifications
- **Message** - User messaging system
- **Review** - Company and job reviews

## 🔐 Security Features

- **Password Hashing** - Bcrypt password hashing
- **JWT Authentication** - Secure token-based authentication
- **Role-based Access** - Admin, employer, job seeker roles
- **Input Validation** - Comprehensive input validation
- **SQL Injection Protection** - SQLAlchemy ORM protection
- **CORS Configuration** - Secure cross-origin requests

## 📊 Analytics & Reporting

### User Analytics
- User registration trends
- Active user metrics
- Role distribution
- Geographic distribution

### Job Analytics
- Job posting trends
- Application rates
- Popular categories
- Salary insights

### Revenue Analytics
- Payment processing metrics
- Featured ad performance
- Subscription analytics
- Revenue trends

## 🚀 Deployment

### Production Setup
```bash
# Install production dependencies
pip install gunicorn

# Run with Gunicorn
gunicorn --bind 0.0.0.0:5000 --workers 4 src.main:app

# Or use Docker
docker build -t talentsphere .
docker run -p 5000:5000 talentsphere
```

### Environment Variables for Production
```bash
FLASK_ENV=production
DATABASE_URL=postgresql://user:pass@localhost/talentsphere
SECRET_KEY=your-production-secret-key
JWT_SECRET_KEY=your-production-jwt-key
```

## 🧪 Testing

### Sample Login Credentials
After running `init_db.py` with sample data:

```bash
# Admin User
Email: admin@talentsphere.com
Password: admin123

# Employer User
Email: hr@techcorp.com
Password: password123

# Job Seeker User
Email: john.doe@email.com
Password: password123
```

### API Testing
```bash
# Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@talentsphere.com", "password": "admin123"}'

# Test job listing
curl -X GET http://localhost:5000/api/jobs

# Test with authentication
curl -X GET http://localhost:5000/api/admin/dashboard \
  -H "Authorization: Bearer <your_jwt_token>"
```

## 📁 Project Structure

```
TalentSphere/
├── src/
│   ├── main.py                 # Flask application entry point
│   ├── models/                 # Database models
│   │   ├── user.py            # User and profile models
│   │   ├── company.py         # Company models
│   │   ├── job.py             # Job models
│   │   ├── application.py     # Application models
│   │   ├── featured_ad.py     # Featured ad and payment models
│   │   └── notification.py    # Notification and message models
│   ├── routes/                 # API route handlers
│   │   ├── auth.py            # Authentication routes
│   │   ├── user.py            # User management routes
│   │   ├── company.py         # Company routes
│   │   ├── job.py             # Job routes
│   │   ├── application.py     # Application routes
│   │   ├── featured_ad.py     # Featured ad routes
│   │   ├── admin.py           # Admin routes
│   │   ├── notification.py    # Notification routes
│   │   └── recommendations.py # Recommendation routes
│   └── database/              # Database files
├── init_db.py                 # Database initialization script
├── requirements.txt           # Python dependencies
├── .env.example              # Environment variables template
└── README.md                 # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Email: support@talentsphere.com
- Documentation: `/api/api-docs`

## 🔄 Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added featured ads and payment system
- **v1.2.0** - Added AI recommendations and messaging
- **v1.3.0** - Added comprehensive admin dashboard

---

**TalentSphere** - Connecting talent with opportunities through innovative technology.

