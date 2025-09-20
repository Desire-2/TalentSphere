from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta
import re
import os
from sqlalchemy import or_, and_, desc, asc, func
from sqlalchemy.orm import joinedload, selectinload

from src.models.user import db, EmployerProfile
from src.models.job import Job, JobCategory, JobBookmark, JobAlert
from src.models.company import Company
from src.routes.auth import token_required, role_required
from src.utils.cache import cached, get_cached_featured_jobs, get_cached_job_categories, invalidate_job_caches
from src.utils.db_utils import db_transaction, safe_db_operation

job_bp = Blueprint('job', __name__)

@job_bp.route('/public/featured-jobs', methods=['GET'])
def get_public_featured_jobs():
    """Get featured jobs for public display (cached)"""
    try:
        limit = min(request.args.get('limit', 10, type=int), 50)
        
        # Use cached version for better performance
        try:
            jobs_list = get_cached_featured_jobs(limit)
            return jsonify({
                'featured_jobs': jobs_list,
                'total': len(jobs_list),
                'cached': True
            }), 200
        except:
            # Fallback to database query if cache fails
            pass
        
        # Optimized query with proper joins
        featured_jobs = Job.query.options(
            joinedload(Job.company)
        ).filter(
            Job.status == 'published',
            Job.is_active == True,
            Job.is_featured == True,
            Job.expires_at > datetime.utcnow()
        ).order_by(
            Job.created_at.desc()
        ).limit(limit).all()
        
        jobs_list = []
        view_count_updates = []
        
        for job in featured_jobs:
            # Batch view count updates instead of individual updates
            view_count_updates.append((job.id, 1))
            
            job_data = {
                'id': job.id,
                'title': job.title,
                'company': job.company.name if job.company else job.external_company_name,
                'company_logo': job.company.logo_url if job.company else job.external_company_logo,
                'location': f"{job.city}, {job.state}" if job.city and job.state else 'Remote',
                'salary_min': job.salary_min,
                'salary_max': job.salary_max,
                'salary_currency': job.salary_currency or 'USD',
                'employment_type': job.employment_type,
                'type': job.employment_type,
                'posted_at': job.created_at.isoformat() if job.created_at else None,
                'featured': True,
                'is_remote': job.is_remote,
                'summary': job.summary,
                'required_skills': job.required_skills
            }
            jobs_list.append(job_data)
        
        # Bulk update view counts
        if view_count_updates:
            from src.utils.db_optimization import BulkOperations
            BulkOperations.bulk_update_view_counts(view_count_updates)
        
        return jsonify({
            'featured_jobs': jobs_list,
            'total': len(jobs_list),
            'cached': False
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get featured jobs', 'details': str(e)}), 500

def generate_slug(name):
    """Generate URL-friendly slug from name"""
    slug = re.sub(r'[^a-zA-Z0-9\s-]', '', name.lower())
    slug = re.sub(r'\s+', '-', slug)
    return slug.strip('-')

def generate_job_slug(title, company_name):
    """Generate URL-friendly slug for job posting"""
    combined = f"{title}-{company_name}"
    slug = re.sub(r'[^a-zA-Z0-9\s-]', '', combined.lower())
    slug = re.sub(r'\s+', '-', slug)
    return slug.strip('-')

@job_bp.route('/job-categories', methods=['GET'])
def get_job_categories():
    """Get all job categories (cached)"""
    try:
        include_children = request.args.get('include_children', type=bool, default=False)
        parent_only = request.args.get('parent_only', type=bool, default=False)
        
        # Use cached version for better performance
        try:
            categories = get_cached_job_categories(include_children)
            if parent_only:
                categories = [cat for cat in categories if not cat.get('parent_id')]
            return jsonify({
                'categories': categories,
                'cached': True
            }), 200
        except:
            # Fallback to database query
            pass
        
        query = JobCategory.query.filter_by(is_active=True)
        
        if parent_only:
            query = query.filter_by(parent_id=None)
        
        categories = query.order_by(JobCategory.display_order, JobCategory.name).all()
        
        return jsonify({
            'categories': [cat.to_dict(include_children=include_children) for cat in categories],
            'cached': False
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get categories', 'details': str(e)}), 500

@job_bp.route('/jobs', methods=['GET'])
def get_jobs():
    """Get jobs with advanced filtering and search"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        # Search and filter parameters
        search = request.args.get('search')
        category_id = request.args.get('category_id', type=int)
        company_id = request.args.get('company_id', type=int)
        location = request.args.get('location')
        employment_type = request.args.get('employment_type')
        experience_level = request.args.get('experience_level')
        salary_min = request.args.get('salary_min', type=int)
        salary_max = request.args.get('salary_max', type=int)
        is_remote = request.args.get('is_remote', type=bool)
        featured_only = request.args.get('featured', type=bool)
        posted_within = request.args.get('posted_within')  # days
        
        # Sorting
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        # Build optimized query with proper joins
        query = Job.query.options(
            joinedload(Job.company),
            joinedload(Job.category)
        ).filter_by(status='published', is_active=True)
        
        # Apply filters with optimized conditions
        if search:
            # Use full-text search for PostgreSQL, simple LIKE for SQLite
            database_url = os.getenv('DATABASE_URL', '')
            if database_url.startswith(('postgresql://', 'postgres://')):
                # PostgreSQL full-text search
                search_vector = func.to_tsvector('english', 
                    func.coalesce(Job.title, '') + ' ' + 
                    func.coalesce(Job.description, '') + ' ' + 
                    func.coalesce(Job.required_skills, '')
                )
                search_query = func.plainto_tsquery('english', search)
                search_filter = search_vector.match(search_query)
            else:
                # SQLite LIKE search
                search_filter = or_(
                    Job.title.ilike(f'%{search}%'),
                    Job.description.ilike(f'%{search}%'),
                    Job.summary.ilike(f'%{search}%'),
                    Job.required_skills.ilike(f'%{search}%')
                )
            query = query.filter(search_filter)
        
        if category_id:
            query = query.filter_by(category_id=category_id)
        
        if company_id:
            query = query.filter_by(company_id=company_id)
        
        if location:
            location_filter = or_(
                Job.city.ilike(f'%{location}%'),
                Job.state.ilike(f'%{location}%'),
                Job.country.ilike(f'%{location}%')
            )
            query = query.filter(location_filter)
        
        if employment_type:
            query = query.filter_by(employment_type=employment_type)
        
        if experience_level:
            query = query.filter_by(experience_level=experience_level)
        
        if salary_min:
            query = query.filter(
                or_(Job.salary_min >= salary_min, Job.salary_max >= salary_min)
            )
        
        if salary_max:
            query = query.filter(
                or_(Job.salary_max <= salary_max, Job.salary_min <= salary_max)
            )
        
        if is_remote is not None:
            query = query.filter_by(is_remote=is_remote)
        
        if featured_only:
            query = query.filter_by(is_featured=True)
        
        if posted_within:
            cutoff_date = datetime.utcnow() - timedelta(days=int(posted_within))
            query = query.filter(Job.created_at >= cutoff_date)
        
        # Apply sorting
        if sort_by == 'created_at':
            order_col = Job.created_at
        elif sort_by == 'title':
            order_col = Job.title
        elif sort_by == 'company':
            query = query.join(Company)
            order_col = Company.name
        elif sort_by == 'salary':
            order_col = Job.salary_max
        else:
            order_col = Job.created_at
        
        if sort_order == 'desc':
            query = query.order_by(desc(order_col))
        else:
            query = query.order_by(asc(order_col))
        
        # Always prioritize featured jobs
        query = query.order_by(Job.is_featured.desc(), order_col)
        
        # Paginate
        jobs = query.paginate(page=page, per_page=per_page, error_out=False)
        
        # Get job data with company information
        job_list = []
        for job in jobs.items:
            job_data = job.to_dict()
            job_data['company'] = job.company.to_dict() if job.company else None
            job_data['category'] = job.category.to_dict() if job.category else None
            job_list.append(job_data)
        
        return jsonify({
            'jobs': job_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': jobs.total,
                'pages': jobs.pages,
                'has_next': jobs.has_next,
                'has_prev': jobs.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get jobs', 'details': str(e)}), 500

@job_bp.route('/jobs/<int:job_id>', methods=['GET'])
def get_job(job_id):
    """Get job details by ID"""
    try:
        job = Job.query.filter_by(id=job_id, status='published', is_active=True).first()
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        # Increment view count
        job.view_count += 1
        db.session.commit()
        
        # Get detailed job information
        job_data = job.to_dict(include_details=True, include_stats=True)
        job_data['company'] = job.company.to_dict(include_stats=True) if job.company else None
        job_data['category'] = job.category.to_dict() if job.category else None
        job_data['poster'] = job.poster.to_dict() if job.poster else None
        
        return jsonify(job_data), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get job', 'details': str(e)}), 500

@job_bp.route('/jobs', methods=['POST'])
@token_required
@role_required('employer', 'admin', 'external_admin')
@db_transaction
def create_job(current_user):
    """Create a new job posting with comprehensive validation"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'description', 'employment_type', 'experience_level', 'location_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Special handling for category_id - it's required but can be None for external jobs
        if 'category_id' not in data or data['category_id'] is None:
            # Set a default category for external jobs if none provided
            if current_user.role == 'external_admin':
                # Use default "Other" category (ID 1) if no category specified
                data['category_id'] = 1
            else:
                return jsonify({'error': 'category_id is required'}), 400
        
        # Validate field values
        valid_employment_types = ['full-time', 'part-time', 'contract', 'freelance', 'internship']
        if data['employment_type'] not in valid_employment_types:
            return jsonify({'error': 'Invalid employment type'}), 400
        
        valid_experience_levels = ['entry', 'mid', 'senior', 'lead', 'executive']
        if data['experience_level'] not in valid_experience_levels:
            return jsonify({'error': 'Invalid experience level'}), 400
        
        valid_location_types = ['on-site', 'remote', 'hybrid']
        if data['location_type'] not in valid_location_types:
            return jsonify({'error': 'Invalid location type'}), 400
        
        # Validate application type
        valid_application_types = ['internal', 'external', 'email']
        application_type = data.get('application_type', 'internal')
        if application_type not in valid_application_types:
            return jsonify({'error': 'Invalid application type'}), 400
        
        # Validate application method requirements
        if application_type == 'external' and not data.get('application_url'):
            return jsonify({'error': 'External application URL is required for external applications'}), 400
        
        if application_type == 'email' and not data.get('application_email'):
            return jsonify({'error': 'Application email is required for email applications'}), 400
        
        # Validate field lengths to prevent database truncation errors
        field_length_limits = {
            'title': 200,
            'slug': 200,
            'external_company_name': 200,
            'external_company_website': 255,
            'external_company_logo': 255,
            'source_url': 500,
            'employment_type': 50,
            'experience_level': 50,
            'education_requirement': 100,
            'location_type': 50,
            'city': 100,
            'state': 100,
            'country': 100,
            'salary_currency': 3,
            'salary_period': 20,
            'application_type': 50,
            'application_email': 120,
            'application_url': 255,
            'status': 50,
            'meta_title': 255
        }
        
        for field, max_length in field_length_limits.items():
            if field in data and data[field] and len(str(data[field])) > max_length:
                # For critical fields, return error
                if field in ['title', 'employment_type', 'experience_level', 'location_type']:
                    return jsonify({
                        'error': f'{field} exceeds maximum length of {max_length} characters',
                        'current_length': len(str(data[field])),
                        'max_length': max_length
                    }), 400
                else:
                    # For non-critical fields, truncate with warning
                    original_length = len(str(data[field]))
                    data[field] = str(data[field])[:max_length]
                    current_app.logger.warning(f"Truncated {field} from {original_length} to {max_length} characters")
        
        # Special handling for education_requirement - move to description if too long
        if data.get('education_requirement') and len(str(data['education_requirement'])) > 100:
            # Move long education requirement to description
            education_text = data['education_requirement']
            data['education_requirement'] = "See job description for education requirements"
            
            # Append to description
            if data.get('description'):
                data['description'] += f"\n\n<h3>Education Requirements:</h3><p>{education_text}</p>"
            else:
                data['description'] = f"<h3>Education Requirements:</h3><p>{education_text}</p>"
        
        # Handle external admin job creation (jobs from external sources)
        if current_user.role == 'external_admin':
            # For external admin, create external job without company
            job_source = 'external'
            company_id = None
            
            # External company info is required for external jobs
            if not data.get('external_company_name'):
                return jsonify({'error': 'External company name is required for external jobs'}), 400
            
            external_company_name = data['external_company_name'].strip()
            external_company_website = data.get('external_company_website', '').strip() if data.get('external_company_website') else None
            external_company_logo = data.get('external_company_logo', '').strip() if data.get('external_company_logo') else None
            source_url = data.get('source_url', '').strip() if data.get('source_url') else None
            
            # Generate slug using external company name
            slug = generate_job_slug(data['title'], external_company_name)
            
        else:
            # Handle regular employer/admin job creation
            job_source = 'internal'
            external_company_name = None
            external_company_website = None
            external_company_logo = None
            source_url = None
            
            # Get or create company ID
            company_id = data.get('company_id')
            if not company_id and current_user.employer_profile:
                company_id = current_user.employer_profile.company_id
            
            # Auto-create basic company profile if employer doesn't have one
            if not company_id and current_user.role == 'employer':
                # Create a basic company profile for the employer
                basic_company_name = f"{current_user.first_name} {current_user.last_name}'s Company"
                
                # Generate unique company name if needed
                counter = 1
                original_name = basic_company_name
                while Company.query.filter_by(name=basic_company_name).first():
                    basic_company_name = f"{original_name} {counter}"
                    counter += 1
                
                # Generate slug for company
                company_slug = generate_slug(basic_company_name)
                counter = 1
                original_slug = company_slug
                while Company.query.filter_by(slug=company_slug).first():
                    company_slug = f"{original_slug}-{counter}"
                    counter += 1
                
                # Create basic company
                basic_company = Company(
                    name=basic_company_name,
                    slug=company_slug,
                    description=f"Company profile for {current_user.first_name} {current_user.last_name}",
                    email=current_user.email,
                    industry="Other"  # Default industry
                )
                
                db.session.add(basic_company)
                db.session.flush()  # Get company ID
                
                # Link company to employer profile
                if not current_user.employer_profile:
                    # Create employer profile if it doesn't exist
                    employer_profile = EmployerProfile(
                        user_id=current_user.id,
                        company_id=basic_company.id
                    )
                    db.session.add(employer_profile)
                else:
                    # Update existing employer profile
                    current_user.employer_profile.company_id = basic_company.id
                
                company_id = basic_company.id
                
                print(f"✅ Auto-created basic company profile: {basic_company_name} (ID: {company_id})")
            
            # For regular jobs, company_id is required unless it's an admin creating external job
            if not company_id and current_user.role != 'admin':
                return jsonify({'error': 'Company ID is required'}), 400
            
            # Verify company exists and user has permission
            if company_id:
                company = Company.query.get(company_id)
                if not company:
                    return jsonify({'error': 'Company not found'}), 404
                
                if (current_user.role == 'employer' and 
                    current_user.employer_profile and 
                    current_user.employer_profile.company_id != company_id):
                    return jsonify({'error': 'You can only post jobs for your own company'}), 403
                
                # Generate slug using company name
                slug = generate_job_slug(data['title'], company.name)
            else:
                # For admin creating external job without company
                slug = generate_job_slug(data['title'], data.get('external_company_name', 'External'))
        
        # Verify category exists
        category = JobCategory.query.get(data['category_id'])
        if not category:
            return jsonify({'error': 'Invalid category'}), 400
        
        # Generate unique slug
        counter = 1
        original_slug = slug
        while Job.query.filter_by(slug=slug).first():
            slug = f"{original_slug}-{counter}"
            counter += 1
        
        # Set default expiry (30 days from now) if not provided and status is published
        expires_at = None
        if data.get('expires_at'):
            try:
                expires_str = data['expires_at']
                if 'T' in expires_str:
                    expires_at = datetime.fromisoformat(expires_str.replace('Z', '+00:00'))
                else:
                    expires_at = datetime.fromisoformat(expires_str + 'T23:59:59')
            except ValueError:
                return jsonify({'error': 'Invalid expiry date format'}), 400
        elif data.get('status') == 'published':
            expires_at = datetime.utcnow() + timedelta(days=30)
        
        # Parse application deadline
        application_deadline = None
        if data.get('application_deadline'):
            try:
                deadline_str = data['application_deadline']
                if 'T' in deadline_str:
                    application_deadline = datetime.fromisoformat(deadline_str.replace('Z', '+00:00'))
                else:
                    application_deadline = datetime.fromisoformat(deadline_str + 'T23:59:59')
            except ValueError:
                return jsonify({'error': 'Invalid application deadline format'}), 400
        
        # Create job
        job = Job(
            company_id=company_id,
            category_id=data['category_id'],
            posted_by=current_user.id,
            title=data['title'].strip(),
            slug=slug,
            description=data['description'].strip(),
            summary=data.get('summary', '').strip() if data.get('summary') else None,
            employment_type=data['employment_type'],
            experience_level=data['experience_level'],
            education_requirement=data.get('education_requirement', '').strip() if data.get('education_requirement') else None,
            location_type=data['location_type'],
            city=data.get('city', '').strip() if data.get('city') else None,
            state=data.get('state', '').strip() if data.get('state') else None,
            country=data.get('country', '').strip() if data.get('country') else None,
            is_remote=data['location_type'] == 'remote',
            remote_policy=data.get('remote_policy', '').strip() if data.get('remote_policy') else None,
            salary_min=data.get('salary_min'),
            salary_max=data.get('salary_max'),
            salary_currency=data.get('salary_currency', 'USD'),
            salary_period=data.get('salary_period', 'yearly'),
            salary_negotiable=data.get('salary_negotiable', False),
            show_salary=data.get('show_salary', True),
            required_skills=data.get('required_skills', '').strip() if data.get('required_skills') else None,
            preferred_skills=data.get('preferred_skills', '').strip() if data.get('preferred_skills') else None,
            years_experience_min=data.get('years_experience_min', 0),
            years_experience_max=data.get('years_experience_max'),
            application_type=data.get('application_type', 'internal'),
            application_deadline=application_deadline,
            application_email=data.get('application_email'),
            application_url=data.get('application_url'),
            application_instructions=data.get('application_instructions', '').strip() if data.get('application_instructions') else None,
            requires_resume=data.get('requires_resume', True),
            requires_cover_letter=data.get('requires_cover_letter', False),
            requires_portfolio=data.get('requires_portfolio', False),
            status=data.get('status', 'draft'),
            expires_at=expires_at,
            # External job fields
            job_source=job_source,
            external_company_name=external_company_name,
            external_company_website=external_company_website,
            external_company_logo=external_company_logo,
            source_url=source_url
        )
        
        # Set published_at if status is published
        if job.status == 'published':
            job.published_at = datetime.utcnow()
            # Auto-generate meta fields for SEO
            if job.company:
                job.meta_title = f"{job.title} - {job.company.name}"
            elif job.external_company_name:
                job.meta_title = f"{job.title} - {job.external_company_name}"
            else:
                job.meta_title = job.title
            job.meta_description = (job.summary or job.description)[:160] + "..." if len(job.summary or job.description) > 160 else (job.summary or job.description)
        
        db.session.add(job)
        db.session.flush()  # Get job ID
        
        # Update company job count only if it's an internal job
        if company_id:
            company = Company.query.get(company_id)
            if company and hasattr(company, 'total_jobs_posted'):
                company.total_jobs_posted += 1
        
        # Transaction will be committed by the decorator
        job_type = "external" if current_user.role == 'external_admin' else "internal"
        return jsonify({
            'message': f'{job_type.capitalize()} job created successfully',
            'job': job.to_dict(include_details=True)
        }), 201
        
    except Exception as e:
        # Transaction will be rolled back by the decorator
        current_app.logger.error(f"Error creating job: {str(e)}")
        error_details = str(e) if current_app.config.get('DEBUG') or current_app.config.get('FLASK_ENV') == 'development' else 'Internal server error'
        return jsonify({'error': 'Failed to create job', 'details': error_details}), 500

@job_bp.route('/jobs/<int:job_id>', methods=['PUT'])
@token_required
@role_required('employer', 'admin', 'external_admin')
def update_job(current_user, job_id):
    """Update job posting with comprehensive validation"""
    try:
        job = Job.query.get(job_id)
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        # Check permission
        if (current_user.role == 'employer' and 
            job.posted_by != current_user.id):
            return jsonify({'error': 'You can only update your own job postings'}), 403
        
        # External admins can update external jobs (jobs where job_source='external') 
        # and their own jobs, but not internal company jobs posted by employers
        if (current_user.role == 'external_admin' and 
            job.posted_by != current_user.id and 
            job.job_source != 'external'):
            return jsonify({'error': 'You can only update external jobs or your own job postings'}), 403
        
        data = request.get_json()
        
        # Update job fields
        updatable_fields = [
            'title', 'description', 'summary', 'employment_type', 'experience_level',
            'education_requirement', 'location_type', 'city', 'state', 'country',
            'remote_policy', 'salary_min', 'salary_max', 'salary_currency',
            'salary_period', 'salary_negotiable', 'show_salary', 'required_skills',
            'preferred_skills', 'years_experience_min', 'years_experience_max',
            'application_type', 'application_email', 'application_url', 'application_instructions',
            'requires_resume', 'requires_cover_letter', 'requires_portfolio'
        ]
        
        # Add external job fields for external admin
        if current_user.role in ['admin', 'external_admin']:
            updatable_fields.extend([
                'external_company_name', 'external_company_website', 
                'external_company_logo', 'source_url'
            ])
        
        for field in updatable_fields:
            if field in data:
                value = data[field]
                # Strip strings to avoid empty whitespace
                if isinstance(value, str):
                    value = value.strip() if value else None
                setattr(job, field, value)
        
        # Handle location type changes
        if 'location_type' in data:
            job.is_remote = data['location_type'] == 'remote'
        
        # Handle status change
        if 'status' in data:
            old_status = job.status
            job.status = data['status']
            
            # Set published_at when publishing
            if old_status != 'published' and job.status == 'published':
                job.published_at = datetime.utcnow()
                # Set default expiry if not set
                if not job.expires_at:
                    job.expires_at = datetime.utcnow() + timedelta(days=30)
                # Auto-generate meta fields for SEO
                if job.company:
                    job.meta_title = f"{job.title} - {job.company.name}"
                elif job.external_company_name:
                    job.meta_title = f"{job.title} - {job.external_company_name}"
                else:
                    job.meta_title = job.title
                job.meta_description = (job.summary or job.description)[:160] + "..." if len(job.summary or job.description) > 160 else (job.summary or job.description)
        
        # Validate application type if provided
        if 'application_type' in data:
            valid_application_types = ['internal', 'external', 'email']
            if data['application_type'] not in valid_application_types:
                return jsonify({'error': 'Invalid application type'}), 400
            
            # Validate application method requirements
            if data['application_type'] == 'external' and not data.get('application_url'):
                return jsonify({'error': 'External application URL is required for external applications'}), 400
            
            if data['application_type'] == 'email' and not data.get('application_email'):
                return jsonify({'error': 'Application email is required for email applications'}), 400
        
        # Update category if provided
        if 'category_id' in data:
            category = JobCategory.query.get(data['category_id'])
            if category:
                job.category_id = data['category_id']
            else:
                return jsonify({'error': 'Invalid category'}), 400
        
        job.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Job updated successfully',
            'job': job.to_dict(include_details=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update job', 'details': str(e)}), 500

@job_bp.route('/jobs/<int:job_id>', methods=['DELETE'])
@token_required
@role_required('employer', 'admin', 'external_admin')
def delete_job(current_user, job_id):
    """Delete job posting"""
    try:
        job = Job.query.get(job_id)
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        # Check permission
        if (current_user.role == 'employer' and 
            job.posted_by != current_user.id):
            return jsonify({'error': 'You can only delete your own job postings'}), 403
        
        # External admins can delete external jobs (jobs where job_source='external') 
        # and their own jobs, but not internal company jobs posted by employers
        if (current_user.role == 'external_admin' and 
            job.posted_by != current_user.id and 
            job.job_source != 'external'):
            return jsonify({'error': 'You can only delete external jobs or your own job postings'}), 403
        
        # Soft delete by setting is_active to False
        job.is_active = False
        job.status = 'closed'
        job.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({'message': 'Job deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete job', 'details': str(e)}), 500

@job_bp.route('/jobs/bulk-action', methods=['POST'])
@token_required
@role_required('employer', 'admin', 'external_admin')
def bulk_job_action(current_user):
    """Perform bulk actions on jobs"""
    try:
        data = request.get_json()
        
        if not data.get('job_ids') or not data.get('action'):
            return jsonify({'error': 'job_ids and action are required'}), 400
        
        job_ids = data['job_ids']
        action = data['action']
        
        if action not in ['publish', 'pause', 'archive', 'delete']:
            return jsonify({'error': 'Invalid action'}), 400
        
        # Get jobs and verify permissions
        jobs = Job.query.filter(Job.id.in_(job_ids)).all()
        
        if not jobs:
            return jsonify({'error': 'No jobs found'}), 404
        
        # Check permissions for each job
        for job in jobs:
            if (current_user.role in ['employer', 'external_admin'] and 
                job.posted_by != current_user.id):
                return jsonify({'error': f'You can only modify your own job postings (Job ID: {job.id})'}), 403
        
        # Perform bulk action
        updated_count = 0
        
        for job in jobs:
            if action == 'publish':
                if job.status != 'published':
                    job.status = 'published'
                    job.published_at = datetime.utcnow()
                    if not job.expires_at:
                        job.expires_at = datetime.utcnow() + timedelta(days=30)
                    updated_count += 1
            
            elif action == 'pause':
                if job.status == 'published':
                    job.status = 'paused'
                    updated_count += 1
            
            elif action == 'archive':
                if job.status in ['published', 'paused', 'draft']:
                    job.status = 'archived'
                    updated_count += 1
            
            elif action == 'delete':
                job.is_active = False
                job.status = 'closed'
                updated_count += 1
            
            job.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully {action}d {updated_count} jobs',
            'updated_count': updated_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to perform bulk action', 'details': str(e)}), 500

@job_bp.route('/jobs/<int:job_id>/duplicate', methods=['POST'])
@token_required
@role_required('employer', 'admin', 'external_admin')
def duplicate_job(current_user, job_id):
    """Duplicate an existing job"""
    try:
        # Get the original job
        job = Job.query.get(job_id)
        
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        # Check permissions
        if (current_user.role in ['employer', 'external_admin'] and 
            job.posted_by != current_user.id):
            return jsonify({'error': 'You can only duplicate your own job postings'}), 403
        
        # Generate unique slug for the duplicate
        original_title = job.title + " (Copy)"
        company_name = job.company.name if job.company else job.external_company_name
        slug = generate_job_slug(original_title, company_name or "")
        counter = 1
        original_slug = slug
        while Job.query.filter_by(slug=slug).first():
            slug = f"{original_slug}-{counter}"
            counter += 1
        
        # Create duplicate job with modified fields
        duplicate_job = Job(
            company_id=job.company_id,
            category_id=job.category_id,
            posted_by=current_user.id,
            title=original_title,
            slug=slug,
            description=job.description,
            summary=job.summary,
            employment_type=job.employment_type,
            experience_level=job.experience_level,
            education_requirement=job.education_requirement,
            location_type=job.location_type,
            city=job.city,
            state=job.state,
            country=job.country,
            is_remote=job.is_remote,
            salary_min=job.salary_min,
            salary_max=job.salary_max,
            salary_currency=job.salary_currency,
            salary_period=job.salary_period,
            salary_negotiable=job.salary_negotiable,
            show_salary=job.show_salary,
            benefits=job.benefits,
            required_skills=job.required_skills,
            years_experience_min=job.years_experience_min,
            years_experience_max=job.years_experience_max,
            application_type=job.application_type,
            application_url=job.application_url,
            application_email=job.application_email,
            application_instructions=job.application_instructions,
            status='draft',  # Set as draft for review
            expires_at=datetime.utcnow() + timedelta(days=30),  # Set new expiry
            # External job specific fields
            job_source=job.job_source,
            external_company_name=job.external_company_name,
            external_company_website=job.external_company_website,
            external_company_logo=job.external_company_logo,
            source_url=job.source_url
        )
        
        db.session.add(duplicate_job)
        db.session.commit()
        
        # Return the duplicated job with full details
        job_data = duplicate_job.to_dict(include_details=True, include_stats=True)
        job_data['category'] = duplicate_job.category.to_dict() if duplicate_job.category else None
        job_data['company'] = duplicate_job.company.to_dict() if duplicate_job.company else None
        job_data['poster'] = duplicate_job.poster.to_dict() if duplicate_job.poster else None
        
        return jsonify({
            'message': 'Job duplicated successfully',
            'job': job_data
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to duplicate job', 'details': str(e)}), 500

@job_bp.route('/employer/applications', methods=['GET'])
@token_required
@role_required('employer', 'admin', 'external_admin')
def get_employer_applications(current_user):
    """Get all applications for jobs posted by the current employer/external admin"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        status = request.args.get('status')
        job_id = request.args.get('job_id', type=int)
        
        # Base query - get applications for jobs posted by current user
        from src.models.application import Application
        query = db.session.query(Application).join(Job).filter(
            Job.posted_by == current_user.id
        )
        
        # Apply filters
        if status:
            query = query.filter(Application.status == status)
        
        if job_id:
            query = query.filter(Application.job_id == job_id)
        
        # Order by creation date (newest first)
        query = query.order_by(Application.created_at.desc())
        
        # Paginate
        applications = query.paginate(page=page, per_page=per_page, error_out=False)
        
        # Format response
        application_list = []
        for application in applications.items:
            app_data = application.to_dict(for_employer=True)
            app_data['applicant'] = application.applicant.to_dict()
            app_data['job'] = application.job.to_dict()
            
            # Add job seeker profile if available
            if application.applicant.job_seeker_profile:
                app_data['applicant_profile'] = application.applicant.job_seeker_profile.to_dict()
            
            application_list.append(app_data)
        
        # Get summary statistics
        total_applications = db.session.query(Application).join(Job).filter(
            Job.posted_by == current_user.id
        ).count()
        
        new_applications = db.session.query(Application).join(Job).filter(
            Job.posted_by == current_user.id,
            Application.status == 'submitted'
        ).count()
        
        return jsonify({
            'applications': application_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': applications.total,
                'pages': applications.pages,
                'has_next': applications.has_next,
                'has_prev': applications.has_prev
            },
            'summary': {
                'total_applications': total_applications,
                'new_applications': new_applications
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get applications', 'details': str(e)}), 500

@job_bp.route('/my-jobs', methods=['GET'])
@token_required
@role_required('employer', 'admin', 'external_admin')
def get_my_jobs(current_user):
    """Get jobs posted by current user with enhanced filtering"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        status = request.args.get('status')
        company_id = request.args.get('company_id', type=int)
        job_source = request.args.get('job_source')  # internal, external
        
        query = Job.query
        
        if current_user.role in ['employer', 'external_admin']:
            query = query.filter_by(posted_by=current_user.id)
        elif company_id:
            query = query.filter_by(company_id=company_id)
        
        if status:
            query = query.filter_by(status=status)
        
        if job_source:
            query = query.filter_by(job_source=job_source)
        
        jobs = query.order_by(Job.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        job_list = []
        for job in jobs.items:
            job_data = job.to_dict(include_details=True, include_stats=True)
            if job.company:
                job_data['company'] = job.company.to_dict()
            job_data['category'] = job.category.to_dict() if job.category else None
            job_list.append(job_data)
        
        # Get summary statistics
        if current_user.role in ['employer', 'external_admin']:
            total_jobs = Job.query.filter_by(posted_by=current_user.id).count()
            published_jobs = Job.query.filter_by(posted_by=current_user.id, status='published').count()
            draft_jobs = Job.query.filter_by(posted_by=current_user.id, status='draft').count()
            external_jobs = Job.query.filter_by(posted_by=current_user.id, job_source='external').count() if current_user.role == 'external_admin' else 0
        else:
            total_jobs = Job.query.count()
            published_jobs = Job.query.filter_by(status='published').count()
            draft_jobs = Job.query.filter_by(status='draft').count()
            external_jobs = Job.query.filter_by(job_source='external').count()
        
        summary = {
            'total_jobs': total_jobs,
            'published_jobs': published_jobs,
            'draft_jobs': draft_jobs
        }
        
        if current_user.role in ['admin', 'external_admin']:
            summary['external_jobs'] = external_jobs
        
        return jsonify({
            'jobs': job_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': jobs.total,
                'pages': jobs.pages,
                'has_next': jobs.has_next,
                'has_prev': jobs.has_prev
            },
            'summary': summary
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get jobs', 'details': str(e)}), 500

# External Admin specific routes
@job_bp.route('/external-jobs', methods=['GET'])
@token_required
@role_required('external_admin', 'admin')
def get_external_jobs(current_user):
    """Get external jobs for external admin management"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        status = request.args.get('status')
        search = request.args.get('search')
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        query = Job.query.filter_by(job_source='external', is_active=True)
        
        if current_user.role == 'external_admin':
            query = query.filter_by(posted_by=current_user.id)
        
        if status:
            query = query.filter_by(status=status)
        
        if search:
            search_filter = or_(
                Job.title.ilike(f'%{search}%'),
                Job.external_company_name.ilike(f'%{search}%'),
                Job.description.ilike(f'%{search}%')
            )
            query = query.filter(search_filter)
        
        # Apply sorting
        if sort_by == 'title':
            order_col = Job.title
        elif sort_by == 'company':
            order_col = Job.external_company_name
        elif sort_by == 'created_at':
            order_col = Job.created_at
        else:
            order_col = Job.created_at
        
        if sort_order == 'desc':
            query = query.order_by(desc(order_col))
        else:
            query = query.order_by(asc(order_col))
        
        jobs = query.paginate(page=page, per_page=per_page, error_out=False)
        
        job_list = []
        for job in jobs.items:
            job_data = job.to_dict(include_details=True, include_stats=True)
            job_data['category'] = job.category.to_dict() if job.category else None
            job_data['poster'] = job.poster.to_dict() if job.poster else None
            job_list.append(job_data)
        
        # Get summary statistics for external jobs
        if current_user.role == 'external_admin':
            total_external_jobs = Job.query.filter_by(posted_by=current_user.id, job_source='external', is_active=True).count()
            published_external_jobs = Job.query.filter_by(posted_by=current_user.id, job_source='external', status='published', is_active=True).count()
            draft_external_jobs = Job.query.filter_by(posted_by=current_user.id, job_source='external', status='draft', is_active=True).count()
        else:
            total_external_jobs = Job.query.filter_by(job_source='external', is_active=True).count()
            published_external_jobs = Job.query.filter_by(job_source='external', status='published', is_active=True).count()
            draft_external_jobs = Job.query.filter_by(job_source='external', status='draft', is_active=True).count()
        
        return jsonify({
            'external_jobs': job_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': jobs.total,
                'pages': jobs.pages,
                'has_next': jobs.has_next,
                'has_prev': jobs.has_prev
            },
            'summary': {
                'total_external_jobs': total_external_jobs,
                'published_external_jobs': published_external_jobs,
                'draft_external_jobs': draft_external_jobs
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get external jobs', 'details': str(e)}), 500

@job_bp.route('/external-jobs/stats', methods=['GET'])
@token_required
@role_required('external_admin', 'admin')
def get_external_job_stats(current_user):
    """Get statistics for external jobs"""
    try:
        # Get summary statistics for external jobs
        if current_user.role == 'external_admin':
            total_external_jobs = Job.query.filter_by(posted_by=current_user.id, job_source='external', is_active=True).count()
            published_external_jobs = Job.query.filter_by(posted_by=current_user.id, job_source='external', status='published', is_active=True).count()
            draft_external_jobs = Job.query.filter_by(posted_by=current_user.id, job_source='external', status='draft', is_active=True).count()
            
            # Get recent activity (jobs posted in last 30 days)
            from datetime import datetime, timedelta
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            recent_jobs = Job.query.filter(
                Job.posted_by == current_user.id,
                Job.job_source == 'external',
                Job.is_active == True,
                Job.created_at >= thirty_days_ago
            ).count()
            
        else:
            total_external_jobs = Job.query.filter_by(job_source='external', is_active=True).count()
            published_external_jobs = Job.query.filter_by(job_source='external', status='published', is_active=True).count()
            draft_external_jobs = Job.query.filter_by(job_source='external', status='draft', is_active=True).count()
            
            # Get recent activity (jobs posted in last 30 days)
            from datetime import datetime, timedelta
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            recent_jobs = Job.query.filter(
                Job.job_source == 'external',
                Job.is_active == True,
                Job.created_at >= thirty_days_ago
            ).count()
        
        # Get category breakdown for external jobs
        from sqlalchemy import func
        from ..models.job import JobCategory
        
        if current_user.role == 'external_admin':
            category_stats = db.session.query(
                JobCategory.name,
                func.count(Job.id).label('count')
            ).join(Job).filter(
                Job.posted_by == current_user.id,
                Job.job_source == 'external',
                Job.is_active == True
            ).group_by(JobCategory.id).all()
        else:
            category_stats = db.session.query(
                JobCategory.name,
                func.count(Job.id).label('count')
            ).join(Job).filter(
                Job.job_source == 'external',
                Job.is_active == True
            ).group_by(JobCategory.id).all()
        
        categories = [{'name': cat[0], 'count': cat[1]} for cat in category_stats]
        
        return jsonify({
            'total_jobs': total_external_jobs,
            'published_jobs': published_external_jobs,
            'draft_jobs': draft_external_jobs,
            'recent_jobs': recent_jobs,
            'categories': categories,
            'success_rate': round((published_external_jobs / total_external_jobs * 100) if total_external_jobs > 0 else 0, 1)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get external job statistics', 'details': str(e)}), 500

@job_bp.route('/external-jobs/bulk-import', methods=['POST'])
@token_required
@role_required('external_admin', 'admin')
def bulk_import_external_jobs(current_user):
    """Bulk import external jobs from various sources"""
    try:
        data = request.get_json()
        jobs_data = data.get('jobs', [])
        
        if not jobs_data:
            return jsonify({'error': 'No jobs data provided'}), 400
        
        imported_jobs = []
        failed_imports = []
        
        for job_info in jobs_data:
            try:
                # Validate required fields
                required_fields = ['title', 'description', 'external_company_name', 'employment_type', 'category_id']
                missing_fields = [field for field in required_fields if not job_info.get(field)]
                
                if missing_fields:
                    failed_imports.append({
                        'job_title': job_info.get('title', 'Unknown'),
                        'error': f'Missing required fields: {", ".join(missing_fields)}'
                    })
                    continue
                
                # Verify category exists
                category = JobCategory.query.get(job_info['category_id'])
                if not category:
                    failed_imports.append({
                        'job_title': job_info['title'],
                        'error': 'Invalid category ID'
                    })
                    continue
                
                # Generate unique slug
                external_company_name = job_info['external_company_name'].strip()
                slug = generate_job_slug(job_info['title'], external_company_name)
                counter = 1
                original_slug = slug
                while Job.query.filter_by(slug=slug).first():
                    slug = f"{original_slug}-{counter}"
                    counter += 1
                
                # Set default expiry
                expires_at = datetime.utcnow() + timedelta(days=30)
                if job_info.get('expires_at'):
                    try:
                        expires_str = job_info['expires_at']
                        if 'T' in expires_str:
                            expires_at = datetime.fromisoformat(expires_str.replace('Z', '+00:00'))
                        else:
                            expires_at = datetime.fromisoformat(expires_str + 'T23:59:59')
                    except ValueError:
                        pass  # Use default expiry
                
                # Create external job
                job = Job(
                    company_id=None,  # External jobs don't have company profiles
                    category_id=job_info['category_id'],
                    posted_by=current_user.id,
                    title=job_info['title'].strip(),
                    slug=slug,
                    description=job_info['description'].strip(),
                    summary=job_info.get('summary', '').strip() if job_info.get('summary') else None,
                    employment_type=job_info['employment_type'],
                    experience_level=job_info.get('experience_level', 'mid'),
                    education_requirement=job_info.get('education_requirement', '').strip() if job_info.get('education_requirement') else None,
                    location_type=job_info.get('location_type', 'on-site'),
                    city=job_info.get('city', '').strip() if job_info.get('city') else None,
                    state=job_info.get('state', '').strip() if job_info.get('state') else None,
                    country=job_info.get('country', '').strip() if job_info.get('country') else None,
                    is_remote=job_info.get('location_type') == 'remote',
                    salary_min=job_info.get('salary_min'),
                    salary_max=job_info.get('salary_max'),
                    salary_currency=job_info.get('salary_currency', 'USD'),
                    salary_period=job_info.get('salary_period', 'yearly'),
                    salary_negotiable=job_info.get('salary_negotiable', False),
                    show_salary=job_info.get('show_salary', True),
                    required_skills=job_info.get('required_skills', '').strip() if job_info.get('required_skills') else None,
                    years_experience_min=job_info.get('years_experience_min', 0),
                    years_experience_max=job_info.get('years_experience_max'),
                    application_type=job_info.get('application_type', 'external'),
                    application_url=job_info.get('application_url'),
                    application_email=job_info.get('application_email'),
                    application_instructions=job_info.get('application_instructions', '').strip() if job_info.get('application_instructions') else None,
                    status=job_info.get('status', 'published'),
                    expires_at=expires_at,
                    # External job specific fields
                    job_source='external',
                    external_company_name=external_company_name,
                    external_company_website=job_info.get('external_company_website', '').strip() if job_info.get('external_company_website') else None,
                    external_company_logo=job_info.get('external_company_logo', '').strip() if job_info.get('external_company_logo') else None,
                    source_url=job_info.get('source_url', '').strip() if job_info.get('source_url') else None
                )
                
                # Set published_at if status is published
                if job.status == 'published':
                    job.published_at = datetime.utcnow()
                    job.meta_title = f"{job.title} - {job.external_company_name}"
                    job.meta_description = (job.summary or job.description)[:160] + "..." if len(job.summary or job.description) > 160 else (job.summary or job.description)
                
                db.session.add(job)
                imported_jobs.append(job.title)
                
            except Exception as e:
                failed_imports.append({
                    'job_title': job_info.get('title', 'Unknown'),
                    'error': str(e)
                })
        
        db.session.commit()
        
        return jsonify({
            'message': f'Bulk import completed: {len(imported_jobs)} jobs imported, {len(failed_imports)} failed',
            'imported_jobs': imported_jobs,
            'failed_imports': failed_imports,
            'total_imported': len(imported_jobs),
            'total_failed': len(failed_imports)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to bulk import jobs', 'details': str(e)}), 500

# Error handlers
@job_bp.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400

@job_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({'error': 'Unauthorized'}), 401

@job_bp.errorhandler(403)
def forbidden(error):
    return jsonify({'error': 'Forbidden'}), 403

@job_bp.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@job_bp.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500
