"""
Job Template Routes
API endpoints for managing job templates in the external admin system
"""

from flask import Blueprint, request, jsonify
from src.models.user import db, User
from src.models.job import Job, JobCategory
from src.models.notification import Notification
from src.models.job_template import JobTemplate
from src.routes.auth import token_required, role_required
from datetime import datetime
import json

template_bp = Blueprint('templates', __name__)

@template_bp.route('/job-templates', methods=['GET'])
@token_required
@role_required('external_admin', 'admin')
def get_job_templates(current_user):
    """Get job templates for the current user"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        search = request.args.get('search', '')
        category_id = request.args.get('category_id', type=int)
        include_public = request.args.get('include_public', 'true').lower() == 'true'
        tags = request.args.getlist('tags')
        
        # Base query - user's own templates
        query = JobTemplate.query.filter_by(created_by=current_user.id, is_active=True)
        
        # Include public templates if requested
        if include_public:
            public_query = JobTemplate.query.filter_by(is_public=True, is_active=True)
            query = query.union(public_query)
        
        # Apply filters
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                db.or_(
                    JobTemplate.name.ilike(search_pattern),
                    JobTemplate.description.ilike(search_pattern),
                    JobTemplate.title.ilike(search_pattern)
                )
            )
        
        if category_id:
            query = query.filter_by(category_id=category_id)
        
        if tags:
            for tag in tags:
                query = query.filter(JobTemplate.tags.ilike(f"%{tag}%"))
        
        # Order by usage count and last updated
        query = query.order_by(JobTemplate.usage_count.desc(), JobTemplate.updated_at.desc())
        
        # Paginate
        templates = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        # Convert to dict
        template_list = []
        for template in templates.items:
            template_data = template.to_dict(include_usage_stats=True)
            template_list.append(template_data)
        
        return jsonify({
            'templates': template_list,
            'total': templates.total,
            'page': page,
            'per_page': per_page,
            'pages': templates.pages,
            'has_next': templates.has_next,
            'has_prev': templates.has_prev
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch templates', 'details': str(e)}), 500

@template_bp.route('/job-templates/<int:template_id>', methods=['GET'])
@token_required
@role_required('external_admin', 'admin')
def get_job_template(current_user, template_id):
    """Get a specific job template by ID"""
    try:
        template = JobTemplate.query.get(template_id)
        if not template:
            return jsonify({'error': 'Template not found'}), 404
        
        # Check permissions - user can access their own templates or public templates
        if template.created_by != current_user.id and not template.is_public:
            return jsonify({'error': 'Access denied'}), 403
        
        # Increment usage count when template is accessed for use
        if request.args.get('increment_usage', 'false').lower() == 'true':
            template.increment_usage()
            db.session.commit()
        
        return jsonify({
            'template': template.to_dict(include_usage_stats=True)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch template', 'details': str(e)}), 500

@template_bp.route('/job-templates', methods=['POST'])
@token_required
@role_required('external_admin', 'admin')
def create_job_template(current_user):
    """Create a new job template"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'title', 'job_description', 'employment_type']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                'error': 'Missing required fields',
                'missing_fields': missing_fields
            }), 400
        
        # Validate category if provided
        if data.get('category_id'):
            category = JobCategory.query.get(data['category_id'])
            if not category:
                return jsonify({'error': 'Invalid category ID'}), 400
        
        # Create template
        template = JobTemplate(
            created_by=current_user.id,
            name=data['name'].strip(),
            description=data.get('description', '').strip(),
            category_id=data.get('category_id'),
            title=data['title'].strip(),
            summary=data.get('summary', '').strip(),
            job_description=data['job_description'].strip(),
            requirements=data.get('requirements', '').strip(),
            preferred_skills=data.get('preferred_skills', '').strip(),
            employment_type=data['employment_type'],
            experience_level=data.get('experience_level', 'mid'),
            education_requirement=data.get('education_requirement', '').strip(),
            location_type=data.get('location_type', 'on-site'),
            location_city=data.get('location_city', '').strip(),
            location_state=data.get('location_state', '').strip(),
            location_country=data.get('location_country', '').strip(),
            salary_min=data.get('salary_min'),
            salary_max=data.get('salary_max'),
            salary_currency=data.get('salary_currency', 'USD'),
            salary_period=data.get('salary_period', 'yearly'),
            salary_negotiable=data.get('salary_negotiable', False),
            show_salary=data.get('show_salary', True),
            application_type=data.get('application_type', 'external'),
            application_email=data.get('application_email', '').strip() if data.get('application_email') else None,
            application_url=data.get('application_url', '').strip() if data.get('application_url') else None,
            application_instructions=data.get('application_instructions', '').strip(),
            requires_resume=data.get('requires_resume', True),
            requires_cover_letter=data.get('requires_cover_letter', False),
            requires_portfolio=data.get('requires_portfolio', False),
            is_public=data.get('is_public', False),
            is_active=data.get('is_active', True)
        )
        
        # Set tags
        if data.get('tags'):
            template.set_tags_list(data['tags'])
        
        db.session.add(template)
        db.session.commit()
        
        return jsonify({
            'message': 'Template created successfully',
            'template': template.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create template', 'details': str(e)}), 500

@template_bp.route('/job-templates/<int:template_id>', methods=['PUT'])
@token_required
@role_required('external_admin', 'admin')
def update_job_template(current_user, template_id):
    """Update a job template"""
    try:
        template = JobTemplate.query.get(template_id)
        if not template:
            return jsonify({'error': 'Template not found'}), 404
        
        # Check permissions - only creator or admin can update
        if template.created_by != current_user.id and current_user.role != 'admin':
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        
        # Validate category if provided
        if data.get('category_id'):
            category = JobCategory.query.get(data['category_id'])
            if not category:
                return jsonify({'error': 'Invalid category ID'}), 400
        
        # Update fields
        if 'name' in data:
            template.name = data['name'].strip()
        if 'description' in data:
            template.description = data['description'].strip()
        if 'category_id' in data:
            template.category_id = data['category_id']
        if 'title' in data:
            template.title = data['title'].strip()
        if 'summary' in data:
            template.summary = data['summary'].strip()
        if 'job_description' in data:
            template.job_description = data['job_description'].strip()
        if 'requirements' in data:
            template.requirements = data['requirements'].strip()
        if 'preferred_skills' in data:
            template.preferred_skills = data['preferred_skills'].strip()
        if 'employment_type' in data:
            template.employment_type = data['employment_type']
        if 'experience_level' in data:
            template.experience_level = data['experience_level']
        if 'education_requirement' in data:
            template.education_requirement = data['education_requirement'].strip()
        if 'location_type' in data:
            template.location_type = data['location_type']
        if 'location_city' in data:
            template.location_city = data['location_city'].strip()
        if 'location_state' in data:
            template.location_state = data['location_state'].strip()
        if 'location_country' in data:
            template.location_country = data['location_country'].strip()
        if 'salary_min' in data:
            template.salary_min = data['salary_min']
        if 'salary_max' in data:
            template.salary_max = data['salary_max']
        if 'salary_currency' in data:
            template.salary_currency = data['salary_currency']
        if 'salary_period' in data:
            template.salary_period = data['salary_period']
        if 'salary_negotiable' in data:
            template.salary_negotiable = data['salary_negotiable']
        if 'show_salary' in data:
            template.show_salary = data['show_salary']
        if 'application_type' in data:
            template.application_type = data['application_type']
        if 'application_email' in data:
            template.application_email = data['application_email'].strip() if data['application_email'] else None
        if 'application_url' in data:
            template.application_url = data['application_url'].strip() if data['application_url'] else None
        if 'application_instructions' in data:
            template.application_instructions = data['application_instructions'].strip()
        if 'requires_resume' in data:
            template.requires_resume = data['requires_resume']
        if 'requires_cover_letter' in data:
            template.requires_cover_letter = data['requires_cover_letter']
        if 'requires_portfolio' in data:
            template.requires_portfolio = data['requires_portfolio']
        if 'is_public' in data:
            template.is_public = data['is_public']
        if 'is_active' in data:
            template.is_active = data['is_active']
        
        # Update tags
        if 'tags' in data:
            template.set_tags_list(data['tags'])
        
        template.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Template updated successfully',
            'template': template.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update template', 'details': str(e)}), 500

@template_bp.route('/job-templates/<int:template_id>', methods=['DELETE'])
@token_required
@role_required('external_admin', 'admin')
def delete_job_template(current_user, template_id):
    """Delete a job template"""
    try:
        template = JobTemplate.query.get(template_id)
        if not template:
            return jsonify({'error': 'Template not found'}), 404
        
        # Check permissions - only creator or admin can delete
        if template.created_by != current_user.id and current_user.role != 'admin':
            return jsonify({'error': 'Access denied'}), 403
        
        # Soft delete by setting is_active to False
        template.is_active = False
        template.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Template deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete template', 'details': str(e)}), 500

@template_bp.route('/job-templates/<int:template_id>/duplicate', methods=['POST'])
@token_required
@role_required('external_admin', 'admin')
def duplicate_job_template(current_user, template_id):
    """Duplicate a job template"""
    try:
        original_template = JobTemplate.query.get(template_id)
        if not original_template:
            return jsonify({'error': 'Template not found'}), 404
        
        # Check permissions - user can duplicate their own templates or public templates
        if original_template.created_by != current_user.id and not original_template.is_public:
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json() or {}
        
        # Create duplicate template
        duplicate_template = JobTemplate(
            created_by=current_user.id,
            name=data.get('name', f"{original_template.name} (Copy)"),
            description=data.get('description', original_template.description),
            category_id=original_template.category_id,
            title=original_template.title,
            summary=original_template.summary,
            job_description=original_template.job_description,
            requirements=original_template.requirements,
            preferred_skills=original_template.preferred_skills,
            employment_type=original_template.employment_type,
            experience_level=original_template.experience_level,
            education_requirement=original_template.education_requirement,
            location_type=original_template.location_type,
            location_city=original_template.location_city,
            location_state=original_template.location_state,
            location_country=original_template.location_country,
            salary_min=original_template.salary_min,
            salary_max=original_template.salary_max,
            salary_currency=original_template.salary_currency,
            salary_period=original_template.salary_period,
            salary_negotiable=original_template.salary_negotiable,
            show_salary=original_template.show_salary,
            application_type=original_template.application_type,
            application_email=original_template.application_email,
            application_url=original_template.application_url,
            application_instructions=original_template.application_instructions,
            requires_resume=original_template.requires_resume,
            requires_cover_letter=original_template.requires_cover_letter,
            requires_portfolio=original_template.requires_portfolio,
            is_public=False,  # New template is private by default
            is_active=True,
            tags=original_template.tags
        )
        
        db.session.add(duplicate_template)
        db.session.commit()
        
        return jsonify({
            'message': 'Template duplicated successfully',
            'template': duplicate_template.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to duplicate template', 'details': str(e)}), 500

@template_bp.route('/job-templates/create-from-job/<int:job_id>', methods=['POST'])
@token_required
@role_required('external_admin', 'admin')
def create_template_from_job(current_user, job_id):
    """Create a template from an existing job"""
    try:
        job = Job.query.get(job_id)
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        # Check permissions - user can create templates from their own jobs or if admin
        if job.posted_by != current_user.id and current_user.role != 'admin':
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json() or {}
        template_name = data.get('name', f"Template from {job.title}")
        description = data.get('description', f"Template created from job: {job.title}")
        
        # Create template from job
        template = JobTemplate(
            created_by=current_user.id,
            name=template_name,
            description=description,
            category_id=job.category_id,
            title=job.title,
            summary=job.summary,
            job_description=job.description,
            requirements=job.required_skills,
            preferred_skills=job.preferred_skills,
            employment_type=job.employment_type,
            experience_level=job.experience_level,
            education_requirement=job.education_requirement,
            location_type=job.location_type,
            location_city=job.city,
            location_state=job.state,
            location_country=job.country,
            salary_min=job.salary_min,
            salary_max=job.salary_max,
            salary_currency=job.salary_currency,
            salary_period=job.salary_period,
            salary_negotiable=job.salary_negotiable,
            show_salary=job.show_salary,
            application_type=job.application_type,
            application_email=job.application_email,
            application_url=job.application_url,
            application_instructions=job.application_instructions,
            is_public=data.get('is_public', False),
            is_active=True
        )
        
        # Set tags if provided
        if data.get('tags'):
            template.set_tags_list(data['tags'])
        
        db.session.add(template)
        db.session.commit()
        
        return jsonify({
            'message': 'Template created successfully from job',
            'template': template.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create template from job', 'details': str(e)}), 500

@template_bp.route('/job-templates/bulk-import', methods=['POST'])
@token_required
@role_required('external_admin', 'admin')
def bulk_import_templates(current_user):
    """Bulk import job templates"""
    try:
        data = request.get_json()
        templates_data = data.get('templates', [])
        
        if not templates_data:
            return jsonify({'error': 'No templates data provided'}), 400
        
        imported_templates = []
        failed_imports = []
        
        for template_info in templates_data:
            try:
                # Validate required fields
                required_fields = ['name', 'title', 'job_description', 'employment_type']
                missing_fields = [field for field in required_fields if not template_info.get(field)]
                
                if missing_fields:
                    failed_imports.append({
                        'template_name': template_info.get('name', 'Unknown'),
                        'error': f'Missing required fields: {", ".join(missing_fields)}'
                    })
                    continue
                
                # Validate category if provided
                if template_info.get('category_id'):
                    category = JobCategory.query.get(template_info['category_id'])
                    if not category:
                        failed_imports.append({
                            'template_name': template_info['name'],
                            'error': 'Invalid category ID'
                        })
                        continue
                
                # Create template
                template = JobTemplate(
                    created_by=current_user.id,
                    name=template_info['name'].strip(),
                    description=template_info.get('description', '').strip(),
                    category_id=template_info.get('category_id'),
                    title=template_info['title'].strip(),
                    summary=template_info.get('summary', '').strip(),
                    job_description=template_info['job_description'].strip(),
                    requirements=template_info.get('requirements', '').strip(),
                    preferred_skills=template_info.get('preferred_skills', '').strip(),
                    employment_type=template_info['employment_type'],
                    experience_level=template_info.get('experience_level', 'mid'),
                    education_requirement=template_info.get('education_requirement', '').strip(),
                    location_type=template_info.get('location_type', 'on-site'),
                    location_city=template_info.get('location_city', '').strip(),
                    location_state=template_info.get('location_state', '').strip(),
                    location_country=template_info.get('location_country', '').strip(),
                    salary_min=template_info.get('salary_min'),
                    salary_max=template_info.get('salary_max'),
                    salary_currency=template_info.get('salary_currency', 'USD'),
                    salary_period=template_info.get('salary_period', 'yearly'),
                    salary_negotiable=template_info.get('salary_negotiable', False),
                    show_salary=template_info.get('show_salary', True),
                    application_type=template_info.get('application_type', 'external'),
                    application_email=template_info.get('application_email'),
                    application_url=template_info.get('application_url'),
                    application_instructions=template_info.get('application_instructions', '').strip(),
                    requires_resume=template_info.get('requires_resume', True),
                    requires_cover_letter=template_info.get('requires_cover_letter', False),
                    requires_portfolio=template_info.get('requires_portfolio', False),
                    is_public=template_info.get('is_public', False),
                    is_active=template_info.get('is_active', True)
                )
                
                # Set tags
                if template_info.get('tags'):
                    template.set_tags_list(template_info['tags'])
                
                db.session.add(template)
                imported_templates.append(template.name)
                
            except Exception as e:
                failed_imports.append({
                    'template_name': template_info.get('name', 'Unknown'),
                    'error': str(e)
                })
        
        db.session.commit()
        
        return jsonify({
            'message': f'Bulk import completed: {len(imported_templates)} templates imported, {len(failed_imports)} failed',
            'imported_templates': imported_templates,
            'failed_imports': failed_imports,
            'total_imported': len(imported_templates),
            'total_failed': len(failed_imports)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to bulk import templates', 'details': str(e)}), 500

@template_bp.route('/job-templates/export', methods=['GET'])
@token_required
@role_required('external_admin', 'admin')
def export_job_templates(current_user):
    """Export job templates"""
    try:
        include_public = request.args.get('include_public', 'false').lower() == 'true'
        
        # Get user's templates
        query = JobTemplate.query.filter_by(created_by=current_user.id, is_active=True)
        
        # Include public templates if requested
        if include_public:
            public_query = JobTemplate.query.filter_by(is_public=True, is_active=True)
            query = query.union(public_query)
        
        templates = query.order_by(JobTemplate.updated_at.desc()).all()
        
        # Convert to export format
        templates_data = []
        for template in templates:
            template_dict = template.to_dict()
            # Remove system fields for export
            export_dict = {k: v for k, v in template_dict.items() 
                          if k not in ['id', 'created_by', 'created_at', 'updated_at', 'last_used', 'usage_count', 'creator']}
            templates_data.append(export_dict)
        
        return jsonify({
            'templates': templates_data,
            'exported_at': datetime.utcnow().isoformat(),
            'exported_by': current_user.get_full_name(),
            'total_templates': len(templates_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to export templates', 'details': str(e)}), 500

@template_bp.route('/job-templates/search', methods=['GET'])
@token_required
@role_required('external_admin', 'admin')
def search_job_templates(current_user):
    """Search job templates"""
    try:
        query = request.args.get('q', '')
        category_id = request.args.get('category_id', type=int)
        tags = request.args.getlist('tags')
        include_public = request.args.get('include_public', 'true').lower() == 'true'
        
        templates = JobTemplate.search(
            query=query,
            user_id=current_user.id if not include_public else None,
            category_id=category_id,
            tags=tags
        )
        
        # If include_public is False, filter to only user's templates
        if not include_public:
            templates = [t for t in templates if t.created_by == current_user.id]
        
        template_list = []
        for template in templates:
            template_data = template.to_dict(include_usage_stats=True)
            template_list.append(template_data)
        
        return jsonify({
            'templates': template_list,
            'total': len(template_list),
            'query': query
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to search templates', 'details': str(e)}), 500