from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import re
from sqlalchemy import or_, and_, desc, asc

from src.models.user import db
from src.models.job import Job, JobCategory, JobBookmark, JobAlert
from src.models.company import Company
from src.routes.auth import token_required, role_required

job_bp = Blueprint('job', __name__)

def generate_job_slug(title, company_name):
    """Generate URL-friendly slug for job posting"""
    combined = f"{title}-{company_name}"
    slug = re.sub(r'[^a-zA-Z0-9\s-]', '', combined.lower())
    slug = re.sub(r'\s+', '-', slug)
    return slug.strip('-')

@job_bp.route('/job-categories', methods=['GET'])
def get_job_categories():
    """Get all job categories"""
    try:
        include_children = request.args.get('include_children', type=bool, default=False)
        parent_only = req        return jsonify({'tips': tips}), 200

@job_bp.route('/jobs/bulk-action', methods=['POST'])
@token_required
@role_required('employer', 'admin')
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
            if (current_user.role == 'employer' and 
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

@job_bp.route('/employer/applications', methods=['GET'])
@token_required
@role_required('employer', 'admin')
def get_employer_applications(current_user):
    """Get all applications for jobs posted by the current employer"""
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

@job_bp.route('/my-jobs', methods=['GET'])t.args.get('parent_only', type=bool, default=False)
        
        query = JobCategory.query.filter_by(is_active=True)
        
        if parent_only:
            query = query.filter_by(parent_id=None)
        
        categories = query.order_by(JobCategory.display_order, JobCategory.name).all()
        
        return jsonify({
            'categories': [cat.to_dict(include_children=include_children) for cat in categories]
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
        
        # Build query
        query = Job.query.filter_by(status='published', is_active=True)
        
        # Apply filters
        if search:
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
@role_required('employer', 'admin')
def create_job(current_user):
    """Create a new job posting with comprehensive validation"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'description', 'employment_type', 'experience_level', 'category_id', 'location_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
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
        
        # Validate salary range if provided
        salary_min = data.get('salary_min')
        salary_max = data.get('salary_max')
        if salary_min is not None and salary_min < 0:
            return jsonify({'error': 'Minimum salary must be positive'}), 400
        if salary_max is not None and salary_max < 0:
            return jsonify({'error': 'Maximum salary must be positive'}), 400
        if salary_min and salary_max and salary_min > salary_max:
            return jsonify({'error': 'Minimum salary cannot be greater than maximum salary'}), 400
        
        # Validate experience years
        years_exp_min = data.get('years_experience_min', 0)
        years_exp_max = data.get('years_experience_max')
        if years_exp_min < 0:
            return jsonify({'error': 'Minimum years experience cannot be negative'}), 400
        if years_exp_max is not None and years_exp_max < 0:
            return jsonify({'error': 'Maximum years experience cannot be negative'}), 400
        if years_exp_max and years_exp_min > years_exp_max:
            return jsonify({'error': 'Minimum years experience cannot be greater than maximum'}), 400
        
        # Validate application method
        application_email = data.get('application_email')
        application_url = data.get('application_url')
        
        # For external applications, URL is required
        if not application_email and not application_url:
            # Default to internal application if neither email nor URL provided
            pass
        elif application_url:
            # Validate URL format
            import re
            url_pattern = re.compile(
                r'^https?://'  # http:// or https://
                r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
                r'localhost|'  # localhost...
                r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
                r'(?::\d+)?'  # optional port
                r'(?:/?|[/?]\S+)$', re.IGNORECASE)
            if not url_pattern.match(application_url):
                return jsonify({'error': 'Invalid application URL format'}), 400
        elif application_email:
            # Validate email format
            import re
            email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
            if not email_pattern.match(application_email):
                return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate location requirements for non-remote jobs
        if data['location_type'] != 'remote':
            if not data.get('city') or not data.get('country'):
                return jsonify({'error': 'City and country are required for non-remote positions'}), 400
        
        # Validate application deadline if provided
        application_deadline = None
        if data.get('application_deadline'):
            try:
                deadline_str = data['application_deadline']
                if 'T' in deadline_str:
                    application_deadline = datetime.fromisoformat(deadline_str.replace('Z', '+00:00'))
                else:
                    application_deadline = datetime.fromisoformat(deadline_str + 'T23:59:59')
                
                if application_deadline <= datetime.utcnow():
                    return jsonify({'error': 'Application deadline must be in the future'}), 400
            except ValueError:
                return jsonify({'error': 'Invalid application deadline format'}), 400
        
        # Get company ID
        company_id = data.get('company_id')
        if not company_id and current_user.employer_profile:
            company_id = current_user.employer_profile.company_id
        
        if not company_id:
            return jsonify({'error': 'Company ID is required'}), 400
        
        # Verify company exists and user has permission
        company = Company.query.get(company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        if (current_user.role == 'employer' and 
            current_user.employer_profile and 
            current_user.employer_profile.company_id != company_id):
            return jsonify({'error': 'You can only post jobs for your own company'}), 403
        
        # Verify category exists
        category = JobCategory.query.get(data['category_id'])
        if not category:
            return jsonify({'error': 'Invalid category'}), 400
        
        # Generate slug
        slug = generate_job_slug(data['title'], company.name)
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
            salary_min=salary_min,
            salary_max=salary_max,
            salary_currency=data.get('salary_currency', 'USD'),
            salary_period=data.get('salary_period', 'yearly'),
            salary_negotiable=data.get('salary_negotiable', False),
            show_salary=data.get('show_salary', True),
            required_skills=data.get('required_skills', '').strip() if data.get('required_skills') else None,
            preferred_skills=data.get('preferred_skills', '').strip() if data.get('preferred_skills') else None,
            years_experience_min=years_exp_min,
            years_experience_max=years_exp_max,
            application_deadline=application_deadline,
            application_email=application_email,
            application_url=application_url,
            application_instructions=data.get('application_instructions', '').strip() if data.get('application_instructions') else None,
            requires_resume=data.get('requires_resume', True),
            requires_cover_letter=data.get('requires_cover_letter', False),
            requires_portfolio=data.get('requires_portfolio', False),
            status=data.get('status', 'draft'),
            expires_at=expires_at
        )
        
        # Set published_at if status is published
        if job.status == 'published':
            job.published_at = datetime.utcnow()
            # Auto-generate meta fields for SEO
            job.meta_title = f"{job.title} - {company.name}"
            job.meta_description = (job.summary or job.description)[:160] + "..." if len(job.summary or job.description) > 160 else (job.summary or job.description)
        
        db.session.add(job)
        db.session.flush()  # Get job ID
        
        # Update company job count
        if hasattr(company, 'total_jobs_posted'):
            company.total_jobs_posted += 1
        
        db.session.commit()
        
        return jsonify({
            'message': 'Job created successfully',
            'job': job.to_dict(include_details=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create job', 'details': str(e)}), 500

@job_bp.route('/jobs/<int:job_id>', methods=['PUT'])
@token_required
@role_required('employer', 'admin')
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
        
        data = request.get_json()
        
        # Validate field values if they are being updated
        if 'employment_type' in data:
            valid_employment_types = ['full-time', 'part-time', 'contract', 'freelance', 'internship']
            if data['employment_type'] not in valid_employment_types:
                return jsonify({'error': 'Invalid employment type'}), 400
        
        if 'experience_level' in data:
            valid_experience_levels = ['entry', 'mid', 'senior', 'lead', 'executive']
            if data['experience_level'] not in valid_experience_levels:
                return jsonify({'error': 'Invalid experience level'}), 400
        
        if 'location_type' in data:
            valid_location_types = ['on-site', 'remote', 'hybrid']
            if data['location_type'] not in valid_location_types:
                return jsonify({'error': 'Invalid location type'}), 400
        
        # Validate salary range if provided
        salary_min = data.get('salary_min', job.salary_min)
        salary_max = data.get('salary_max', job.salary_max)
        if 'salary_min' in data and data['salary_min'] is not None and data['salary_min'] < 0:
            return jsonify({'error': 'Minimum salary must be positive'}), 400
        if 'salary_max' in data and data['salary_max'] is not None and data['salary_max'] < 0:
            return jsonify({'error': 'Maximum salary must be positive'}), 400
        if salary_min and salary_max and salary_min > salary_max:
            return jsonify({'error': 'Minimum salary cannot be greater than maximum salary'}), 400
        
        # Validate experience years
        years_exp_min = data.get('years_experience_min', job.years_experience_min)
        years_exp_max = data.get('years_experience_max', job.years_experience_max)
        if 'years_experience_min' in data and data['years_experience_min'] < 0:
            return jsonify({'error': 'Minimum years experience cannot be negative'}), 400
        if 'years_experience_max' in data and data['years_experience_max'] is not None and data['years_experience_max'] < 0:
            return jsonify({'error': 'Maximum years experience cannot be negative'}), 400
        if years_exp_max and years_exp_min > years_exp_max:
            return jsonify({'error': 'Minimum years experience cannot be greater than maximum'}), 400
        
        # Validate application method
        if 'application_url' in data and data['application_url']:
            import re
            url_pattern = re.compile(
                r'^https?://'  # http:// or https://
                r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
                r'localhost|'  # localhost...
                r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
                r'(?::\d+)?'  # optional port
                r'(?:/?|[/?]\S+)$', re.IGNORECASE)
            if not url_pattern.match(data['application_url']):
                return jsonify({'error': 'Invalid application URL format'}), 400
        
        if 'application_email' in data and data['application_email']:
            import re
            email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
            if not email_pattern.match(data['application_email']):
                return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate location requirements for non-remote jobs
        location_type = data.get('location_type', job.location_type)
        if location_type != 'remote':
            city = data.get('city', job.city)
            country = data.get('country', job.country)
            if not city or not country:
                return jsonify({'error': 'City and country are required for non-remote positions'}), 400
        
        # Update job fields
        updatable_fields = [
            'title', 'description', 'summary', 'employment_type', 'experience_level',
            'education_requirement', 'location_type', 'city', 'state', 'country',
            'remote_policy', 'salary_min', 'salary_max', 'salary_currency',
            'salary_period', 'salary_negotiable', 'show_salary', 'required_skills',
            'preferred_skills', 'years_experience_min', 'years_experience_max',
            'application_email', 'application_url', 'application_instructions',
            'requires_resume', 'requires_cover_letter', 'requires_portfolio'
        ]
        
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
        
        # Handle date fields
        if 'application_deadline' in data and data['application_deadline']:
            try:
                deadline_str = data['application_deadline']
                if 'T' in deadline_str:
                    deadline = datetime.fromisoformat(deadline_str.replace('Z', '+00:00'))
                else:
                    deadline = datetime.fromisoformat(deadline_str + 'T23:59:59')
                
                if deadline <= datetime.utcnow():
                    return jsonify({'error': 'Application deadline must be in the future'}), 400
                job.application_deadline = deadline
            except ValueError:
                return jsonify({'error': 'Invalid application deadline format'}), 400
        
        if 'expires_at' in data and data['expires_at']:
            try:
                expires_str = data['expires_at']
                if 'T' in expires_str:
                    expires_at = datetime.fromisoformat(expires_str.replace('Z', '+00:00'))
                else:
                    expires_at = datetime.fromisoformat(expires_str + 'T23:59:59')
                job.expires_at = expires_at
            except ValueError:
                return jsonify({'error': 'Invalid expiry date format'}), 400
        
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
                job.meta_description = (job.summary or job.description)[:160] + "..." if len(job.summary or job.description) > 160 else (job.summary or job.description)
        
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
@role_required('employer', 'admin')
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
        
        # Soft delete by setting is_active to False
        job.is_active = False
        job.status = 'closed'
        job.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({'message': 'Job deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete job', 'details': str(e)}), 500

@job_bp.route('/jobs/<int:job_id>/bookmark', methods=['POST'])
@token_required
@role_required('job_seeker')
def bookmark_job(current_user, job_id):
    """Bookmark a job"""
    try:
        job = Job.query.filter_by(id=job_id, status='published', is_active=True).first()
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        # Check if already bookmarked
        existing_bookmark = JobBookmark.query.filter_by(
            user_id=current_user.id, job_id=job_id
        ).first()
        
        if existing_bookmark:
            return jsonify({'error': 'Job already bookmarked'}), 409
        
        # Create bookmark
        bookmark = JobBookmark(user_id=current_user.id, job_id=job_id)
        db.session.add(bookmark)
        
        # Update job bookmark count
        job.bookmark_count += 1
        
        db.session.commit()
        
        return jsonify({'message': 'Job bookmarked successfully'}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to bookmark job', 'details': str(e)}), 500

@job_bp.route('/jobs/<int:job_id>/bookmark', methods=['DELETE'])
@token_required
@role_required('job_seeker')
def remove_bookmark(current_user, job_id):
    """Remove job bookmark"""
    try:
        bookmark = JobBookmark.query.filter_by(
            user_id=current_user.id, job_id=job_id
        ).first()
        
        if not bookmark:
            return jsonify({'error': 'Bookmark not found'}), 404
        
        # Remove bookmark
        db.session.delete(bookmark)
        
        # Update job bookmark count
        job = Job.query.get(job_id)
        if job and job.bookmark_count > 0:
            job.bookmark_count -= 1
        
        db.session.commit()
        
        return jsonify({'message': 'Bookmark removed successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to remove bookmark', 'details': str(e)}), 500

@job_bp.route('/my-bookmarks', methods=['GET'])
@token_required
@role_required('job_seeker')
def get_my_bookmarks(current_user):
    """Get user's bookmarked jobs"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        # Get bookmarked jobs
        bookmarks = db.session.query(JobBookmark, Job, Company).join(
            Job, JobBookmark.job_id == Job.id
        ).join(
            Company, Job.company_id == Company.id
        ).filter(
            JobBookmark.user_id == current_user.id,
            Job.is_active == True
        ).order_by(
            JobBookmark.created_at.desc()
        ).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        job_list = []
        for bookmark, job, company in bookmarks.items:
            job_data = job.to_dict()
            job_data['company'] = company.to_dict()
            job_data['bookmarked_at'] = bookmark.created_at.isoformat()
            job_list.append(job_data)
        
        return jsonify({
            'bookmarks': job_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': bookmarks.total,
                'pages': bookmarks.pages,
                'has_next': bookmarks.has_next,
                'has_prev': bookmarks.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get bookmarks', 'details': str(e)}), 500

@job_bp.route('/employer/company-info', methods=['GET'])
@token_required
@role_required('employer', 'admin')
def get_employer_company_info(current_user):
    """Get employer's company information for job posting"""
    try:
        if current_user.role == 'admin':
            # Admin can see all companies - return list
            companies = Company.query.filter_by(is_active=True).all()
            return jsonify({
                'companies': [company.to_dict() for company in companies],
                'is_admin': True
            }), 200
        
        # Get employer's company
        if not current_user.employer_profile:
            return jsonify({'error': 'Employer profile not found'}), 404
        
        company = current_user.employer_profile.company
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        return jsonify({
            'company': company.to_dict(include_stats=True),
            'is_admin': False,
            'posting_limits': {
                'monthly_limit': 50,  # Example limits
                'current_month_posts': Job.query.filter(
                    Job.company_id == company.id,
                    Job.created_at >= datetime.utcnow().replace(day=1),
                    Job.status.in_(['published', 'draft'])
                ).count(),
                'can_post': True  # Can add logic for premium features
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get company info', 'details': str(e)}), 500

@job_bp.route('/validate-job-data', methods=['POST'])
@token_required
@role_required('employer', 'admin')
def validate_job_data(current_user):
    """Validate job data without creating the job (for draft validation)"""
    try:
        data = request.get_json()
        errors = []
        
        # Validate required fields for publishing
        if data.get('status') == 'published':
            required_fields = ['title', 'description', 'employment_type', 'experience_level', 'category_id', 'location_type']
            for field in required_fields:
                if not data.get(field):
                    errors.append(f'{field} is required for publishing')
        
        # Validate field values
        if data.get('employment_type'):
            valid_employment_types = ['full-time', 'part-time', 'contract', 'freelance', 'internship']
            if data['employment_type'] not in valid_employment_types:
                errors.append('Invalid employment type')
        
        if data.get('experience_level'):
            valid_experience_levels = ['entry', 'mid', 'senior', 'lead', 'executive']
            if data['experience_level'] not in valid_experience_levels:
                errors.append('Invalid experience level')
        
        if data.get('location_type'):
            valid_location_types = ['on-site', 'remote', 'hybrid']
            if data['location_type'] not in valid_location_types:
                errors.append('Invalid location type')
        
        # Validate salary range
        salary_min = data.get('salary_min')
        salary_max = data.get('salary_max')
        if salary_min is not None and salary_min < 0:
            errors.append('Minimum salary must be positive')
        if salary_max is not None and salary_max < 0:
            errors.append('Maximum salary must be positive')
        if salary_min and salary_max and salary_min > salary_max:
            errors.append('Minimum salary cannot be greater than maximum salary')
        
        # Validate experience years
        years_exp_min = data.get('years_experience_min', 0)
        years_exp_max = data.get('years_experience_max')
        if years_exp_min < 0:
            errors.append('Minimum years experience cannot be negative')
        if years_exp_max is not None and years_exp_max < 0:
            errors.append('Maximum years experience cannot be negative')
        if years_exp_max and years_exp_min > years_exp_max:
            errors.append('Minimum years experience cannot be greater than maximum')
        
        # Validate URLs and emails
        if data.get('application_url'):
            import re
            url_pattern = re.compile(
                r'^https?://'
                r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'
                r'localhost|'
                r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'
                r'(?::\d+)?'
                r'(?:/?|[/?]\S+)$', re.IGNORECASE)
            if not url_pattern.match(data['application_url']):
                errors.append('Invalid application URL format')
        
        if data.get('application_email'):
            import re
            email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
            if not email_pattern.match(data['application_email']):
                errors.append('Invalid email format')
        
        # Validate location requirements
        if data.get('location_type') != 'remote':
            if not data.get('city') or not data.get('country'):
                errors.append('City and country are required for non-remote positions')
        
        # Validate dates
        if data.get('application_deadline'):
            try:
                deadline_str = data['application_deadline']
                if 'T' in deadline_str:
                    deadline = datetime.fromisoformat(deadline_str.replace('Z', '+00:00'))
                else:
                    deadline = datetime.fromisoformat(deadline_str + 'T23:59:59')
                if deadline <= datetime.utcnow():
                    errors.append('Application deadline must be in the future')
            except ValueError:
                errors.append('Invalid application deadline format')
        
        # Validate category
        if data.get('category_id'):
            category = JobCategory.query.get(data['category_id'])
            if not category:
                errors.append('Invalid category')
        
        return jsonify({
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': []  # Can add warnings for best practices
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Validation failed', 'details': str(e)}), 500

@job_bp.route('/job-posting-tips', methods=['GET'])
def get_job_posting_tips():
    """Get tips and best practices for job posting"""
    tips = {
        'title': [
            'Be specific and clear about the role',
            'Include seniority level (Junior, Senior, etc.)',
            'Avoid internal jargon or abbreviations',
            'Keep it under 60 characters for better visibility'
        ],
        'description': [
            'Start with a compelling company overview',
            'Clearly outline key responsibilities',
            'List must-have vs nice-to-have requirements',
            'Include information about growth opportunities',
            'Mention company culture and benefits',
            'Use bullet points for better readability'
        ],
        'salary': [
            'Be transparent about compensation',
            'Include benefits and perks',
            'Consider total compensation package',
            'Research market rates for the position'
        ],
        'location': [
            'Be clear about remote work policies',
            'Specify if travel is required',
            'Mention timezone requirements for remote roles',
            'Include information about office culture'
        ],
        'application': [
            'Make application process simple',
            'Clearly state what documents are needed',
            'Provide realistic timeline for response',
            'Include contact information for questions'
        ]
    }
    
    return jsonify({'tips': tips}), 200

@job_bp.route('/my-jobs', methods=['GET'])
@token_required
@role_required('employer', 'admin')
def get_my_jobs(current_user):
    """Get jobs posted by current user with enhanced filtering"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        status = request.args.get('status')
        company_id = request.args.get('company_id', type=int)
        
        query = Job.query
        
        if current_user.role == 'employer':
            query = query.filter_by(posted_by=current_user.id)
        elif company_id:
            query = query.filter_by(company_id=company_id)
        
        if status:
            query = query.filter_by(status=status)
        
        jobs = query.order_by(Job.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        job_list = []
        for job in jobs.items:
            job_data = job.to_dict(include_details=True, include_stats=True)
            job_data['company'] = job.company.to_dict() if job.company else None
            job_data['category'] = job.category.to_dict() if job.category else None
            job_list.append(job_data)
        
        # Get summary statistics
        total_jobs = Job.query.filter_by(posted_by=current_user.id).count() if current_user.role == 'employer' else Job.query.count()
        published_jobs = Job.query.filter_by(posted_by=current_user.id, status='published').count() if current_user.role == 'employer' else Job.query.filter_by(status='published').count()
        draft_jobs = Job.query.filter_by(posted_by=current_user.id, status='draft').count() if current_user.role == 'employer' else Job.query.filter_by(status='draft').count()
        
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
            'summary': {
                'total_jobs': total_jobs,
                'published_jobs': published_jobs,
                'draft_jobs': draft_jobs
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get jobs', 'details': str(e)}), 500

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

