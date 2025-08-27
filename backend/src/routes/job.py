from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import re
from sqlalchemy import or_, and_, desc, asc

from src.models.user import db, EmployerProfile
from src.models.job import Job, JobCategory, JobBookmark, JobAlert
from src.models.company import Company
from src.routes.auth import token_required, role_required

job_bp = Blueprint('job', __name__)

@job_bp.route('/public/featured-jobs', methods=['GET'])
def get_public_featured_jobs():
    """Get featured jobs for public display"""
    try:
        limit = min(request.args.get('limit', 10, type=int), 50)
        
        # Get featured jobs with company details
        featured_jobs = Job.query.join(Company).filter(
            Job.status == 'published',
            Job.is_active == True,
            Job.is_featured == True,
            Job.expires_at > datetime.utcnow()
        ).order_by(
            Job.created_at.desc()
        ).limit(limit).all()
        
        jobs_list = []
        for job in featured_jobs:
            # Increment view count
            job.view_count = (job.view_count or 0) + 1
            
            job_data = {
                'id': job.id,
                'title': job.title,
                'company': job.company.name,
                'company_logo': job.company.logo_url,
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
        
        db.session.commit()
        
        return jsonify({
            'featured_jobs': jobs_list,
            'total': len(jobs_list)
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
    """Get all job categories"""
    try:
        include_children = request.args.get('include_children', type=bool, default=False)
        parent_only = request.args.get('parent_only', type=bool, default=False)
        
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
