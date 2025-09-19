from flask import Blueprint, request, jsonify
from datetime import datetime
import json
from sqlalchemy import or_, desc, asc

from src.models.user import db
from src.models.job import JobCategory
from src.models.job_template import JobTemplate
from src.routes.auth import token_required, role_required

job_template_bp = Blueprint('job_template', __name__)

@job_template_bp.route('/job-templates', methods=['GET'])
@token_required
@role_required('employer', 'admin', 'external_admin')
def get_job_templates(current_user):
    """Get job templates with filtering and search"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        # Search and filter parameters
        search = request.args.get('search')
        category_id = request.args.get('category_id', type=int)
        is_public = request.args.get('is_public', type=bool)
        created_by_me = request.args.get('created_by_me', type=bool)
        
        # Sorting
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        # Build query
        query = JobTemplate.query.filter_by(is_active=True)
        
        # Filter by user's own templates or public templates
        if created_by_me:
            query = query.filter_by(created_by=current_user.id)
        else:
            # Show user's own templates and public templates
            query = query.filter(
                or_(
                    JobTemplate.created_by == current_user.id,
                    JobTemplate.is_public == True
                )
            )
        
        # Apply additional filters
        if search:
            search_filter = or_(
                JobTemplate.name.ilike(f'%{search}%'),
                JobTemplate.title.ilike(f'%{search}%'),
                JobTemplate.description.ilike(f'%{search}%')
            )
            query = query.filter(search_filter)
        
        if category_id:
            query = query.filter_by(category_id=category_id)
        
        if is_public is not None:
            query = query.filter_by(is_public=is_public)
        
        # Apply sorting
        if sort_by == 'name':
            order_col = JobTemplate.name
        elif sort_by == 'title':
            order_col = JobTemplate.title
        elif sort_by == 'usage_count':
            order_col = JobTemplate.usage_count
        elif sort_by == 'last_used':
            order_col = JobTemplate.last_used
        elif sort_by == 'created_at':
            order_col = JobTemplate.created_at
        else:
            order_col = JobTemplate.created_at
        
        if sort_order == 'desc':
            query = query.order_by(desc(order_col))
        else:
            query = query.order_by(asc(order_col))
        
        # Paginate
        templates = query.paginate(page=page, per_page=per_page, error_out=False)
        
        # Format response
        template_list = []
        for template in templates.items:
            template_data = template.to_dict(include_usage_stats=True)
            template_list.append(template_data)
        
        return jsonify({
            'templates': template_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': templates.total,
                'pages': templates.pages,
                'has_next': templates.has_next,
                'has_prev': templates.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get job templates', 'details': str(e)}), 500

@job_template_bp.route('/job-templates/<int:template_id>', methods=['GET'])
@token_required
@role_required('employer', 'admin', 'external_admin')
def get_job_template(current_user, template_id):
    """Get a specific job template by ID"""
    try:
        template = JobTemplate.query.filter_by(id=template_id, is_active=True).first()
        
        if not template:
            return jsonify({'error': 'Template not found'}), 404
        
        # Check permissions - user can access their own templates or public templates
        if (template.created_by != current_user.id and 
            not template.is_public and 
            current_user.role != 'admin'):
            return jsonify({'error': 'Access denied'}), 403
        
        template_data = template.to_dict(include_usage_stats=True)
        return jsonify(template_data), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get job template', 'details': str(e)}), 500

@job_template_bp.route('/job-templates', methods=['POST'])
@token_required
@role_required('employer', 'admin', 'external_admin')
def create_job_template(current_user):
    """Create a new job template"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'title', 'job_description', 'employment_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate field values
        valid_employment_types = ['full-time', 'part-time', 'contract', 'freelance', 'internship']
        if data['employment_type'] not in valid_employment_types:
            return jsonify({'error': 'Invalid employment type'}), 400
        
        valid_experience_levels = ['entry', 'mid', 'senior', 'lead', 'executive']
        experience_level = data.get('experience_level', 'mid')
        if experience_level and experience_level not in valid_experience_levels:
            return jsonify({'error': 'Invalid experience level'}), 400
        
        valid_location_types = ['on-site', 'remote', 'hybrid']
        location_type = data.get('location_type', 'on-site')
        if location_type not in valid_location_types:
            return jsonify({'error': 'Invalid location type'}), 400
        
        valid_application_types = ['internal', 'external', 'email']
        application_type = data.get('application_type', 'external')
        if application_type not in valid_application_types:
            return jsonify({'error': 'Invalid application type'}), 400
        
        # Verify category if provided
        category_id = data.get('category_id')
        if category_id:
            category = JobCategory.query.get(category_id)
            if not category:
                return jsonify({'error': 'Invalid category'}), 400
        
        # Process tags
        tags = data.get('tags', [])
        if isinstance(tags, list):
            tags_json = json.dumps(tags)
        else:
            tags_json = json.dumps([])
        
        # Create template
        template = JobTemplate(
            created_by=current_user.id,
            category_id=category_id,
            name=data['name'].strip(),
            description=data.get('description', '').strip() if data.get('description') else None,
            title=data['title'].strip(),
            summary=data.get('summary', '').strip() if data.get('summary') else None,
            job_description=data['job_description'].strip(),
            requirements=data.get('requirements', '').strip() if data.get('requirements') else None,
            preferred_skills=data.get('preferred_skills', '').strip() if data.get('preferred_skills') else None,
            employment_type=data['employment_type'],
            experience_level=experience_level,
            education_requirement=data.get('education_requirement', '').strip() if data.get('education_requirement') else None,
            location_type=location_type,
            location_city=data.get('location_city', '').strip() if data.get('location_city') else None,
            location_state=data.get('location_state', '').strip() if data.get('location_state') else None,
            location_country=data.get('location_country', '').strip() if data.get('location_country') else None,
            salary_min=data.get('salary_min'),
            salary_max=data.get('salary_max'),
            salary_currency=data.get('salary_currency', 'USD'),
            salary_period=data.get('salary_period', 'yearly'),
            salary_negotiable=data.get('salary_negotiable', False),
            show_salary=data.get('show_salary', True),
            application_type=application_type,
            application_email=data.get('application_email', '').strip() if data.get('application_email') else None,
            application_url=data.get('application_url', '').strip() if data.get('application_url') else None,
            application_instructions=data.get('application_instructions', '').strip() if data.get('application_instructions') else None,
            requires_resume=data.get('requires_resume', True),
            requires_cover_letter=data.get('requires_cover_letter', False),
            requires_portfolio=data.get('requires_portfolio', False),
            is_active=data.get('is_active', True),
            is_public=data.get('is_public', False),
            tags=tags_json
        )
        
        db.session.add(template)
        db.session.commit()
        
        return jsonify({
            'message': 'Job template created successfully',
            'template': template.to_dict(include_usage_stats=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create job template', 'details': str(e)}), 500

@job_template_bp.route('/job-templates/<int:template_id>', methods=['PUT'])
@token_required
@role_required('employer', 'admin', 'external_admin')
def update_job_template(current_user, template_id):
    """Update a job template"""
    try:
        template = JobTemplate.query.filter_by(id=template_id, is_active=True).first()
        
        if not template:
            return jsonify({'error': 'Template not found'}), 404
        
        # Check permissions - user can only update their own templates (or admin can update any)
        if template.created_by != current_user.id and current_user.role != 'admin':
            return jsonify({'error': 'You can only update your own templates'}), 403
        
        data = request.get_json()
        
        # Update template fields
        updatable_fields = [
            'name', 'description', 'title', 'summary', 'job_description',
            'requirements', 'preferred_skills', 'employment_type', 'experience_level',
            'education_requirement', 'location_type', 'location_city', 'location_state',
            'location_country', 'salary_min', 'salary_max', 'salary_currency',
            'salary_period', 'salary_negotiable', 'show_salary', 'application_type',
            'application_email', 'application_url', 'application_instructions',
            'requires_resume', 'requires_cover_letter', 'requires_portfolio',
            'is_active', 'is_public'
        ]
        
        for field in updatable_fields:
            if field in data:
                value = data[field]
                # Strip strings to avoid empty whitespace
                if isinstance(value, str) and value is not None:
                    value = value.strip() if value else None
                setattr(template, field, value)
        
        # Update category if provided
        if 'category_id' in data:
            category_id = data['category_id']
            if category_id:
                category = JobCategory.query.get(category_id)
                if not category:
                    return jsonify({'error': 'Invalid category'}), 400
                template.category_id = category_id
            else:
                template.category_id = None
        
        # Update tags if provided
        if 'tags' in data:
            tags = data['tags']
            if isinstance(tags, list):
                template.tags = json.dumps(tags)
            else:
                template.tags = json.dumps([])
        
        # Validate field values if they're being updated
        if 'employment_type' in data:
            valid_employment_types = ['full-time', 'part-time', 'contract', 'freelance', 'internship']
            if data['employment_type'] not in valid_employment_types:
                return jsonify({'error': 'Invalid employment type'}), 400
        
        if 'experience_level' in data and data['experience_level']:
            valid_experience_levels = ['entry', 'mid', 'senior', 'lead', 'executive']
            if data['experience_level'] not in valid_experience_levels:
                return jsonify({'error': 'Invalid experience level'}), 400
        
        if 'location_type' in data:
            valid_location_types = ['on-site', 'remote', 'hybrid']
            if data['location_type'] not in valid_location_types:
                return jsonify({'error': 'Invalid location type'}), 400
        
        if 'application_type' in data:
            valid_application_types = ['internal', 'external', 'email']
            if data['application_type'] not in valid_application_types:
                return jsonify({'error': 'Invalid application type'}), 400
        
        template.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Job template updated successfully',
            'template': template.to_dict(include_usage_stats=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update job template', 'details': str(e)}), 500

@job_template_bp.route('/job-templates/<int:template_id>', methods=['DELETE'])
@token_required
@role_required('employer', 'admin', 'external_admin')
def delete_job_template(current_user, template_id):
    """Delete a job template (soft delete)"""
    try:
        template = JobTemplate.query.filter_by(id=template_id, is_active=True).first()
        
        if not template:
            return jsonify({'error': 'Template not found'}), 404
        
        # Check permissions - user can only delete their own templates (or admin can delete any)
        if template.created_by != current_user.id and current_user.role != 'admin':
            return jsonify({'error': 'You can only delete your own templates'}), 403
        
        # Soft delete by setting is_active to False
        template.is_active = False
        template.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({'message': 'Job template deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete job template', 'details': str(e)}), 500

@job_template_bp.route('/job-templates/<int:template_id>/duplicate', methods=['POST'])
@token_required
@role_required('employer', 'admin', 'external_admin')
def duplicate_job_template(current_user, template_id):
    """Duplicate an existing job template"""
    try:
        template = JobTemplate.query.filter_by(id=template_id, is_active=True).first()
        
        if not template:
            return jsonify({'error': 'Template not found'}), 404
        
        # Check permissions - user can duplicate their own templates or public templates
        if (template.created_by != current_user.id and 
            not template.is_public and 
            current_user.role != 'admin'):
            return jsonify({'error': 'Access denied'}), 403
        
        # Create duplicate template
        duplicate_template = JobTemplate(
            created_by=current_user.id,  # Set current user as creator of the duplicate
            category_id=template.category_id,
            name=f"{template.name} (Copy)",
            description=template.description,
            title=template.title,
            summary=template.summary,
            job_description=template.job_description,
            requirements=template.requirements,
            preferred_skills=template.preferred_skills,
            employment_type=template.employment_type,
            experience_level=template.experience_level,
            education_requirement=template.education_requirement,
            location_type=template.location_type,
            location_city=template.location_city,
            location_state=template.location_state,
            location_country=template.location_country,
            salary_min=template.salary_min,
            salary_max=template.salary_max,
            salary_currency=template.salary_currency,
            salary_period=template.salary_period,
            salary_negotiable=template.salary_negotiable,
            show_salary=template.show_salary,
            application_type=template.application_type,
            application_email=template.application_email,
            application_url=template.application_url,
            application_instructions=template.application_instructions,
            requires_resume=template.requires_resume,
            requires_cover_letter=template.requires_cover_letter,
            requires_portfolio=template.requires_portfolio,
            is_active=True,
            is_public=False,  # Duplicated templates are private by default
            tags=template.tags
        )
        
        db.session.add(duplicate_template)
        db.session.commit()
        
        return jsonify({
            'message': 'Job template duplicated successfully',
            'template': duplicate_template.to_dict(include_usage_stats=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to duplicate job template', 'details': str(e)}), 500

@job_template_bp.route('/job-templates/<int:template_id>/use', methods=['POST'])
@token_required
@role_required('employer', 'admin', 'external_admin')
def use_job_template(current_user, template_id):
    """Use a template to create a new job (increments usage count)"""
    try:
        template = JobTemplate.query.filter_by(id=template_id, is_active=True).first()
        
        if not template:
            return jsonify({'error': 'Template not found'}), 404
        
        # Check permissions - user can use their own templates or public templates
        if (template.created_by != current_user.id and 
            not template.is_public and 
            current_user.role != 'admin'):
            return jsonify({'error': 'Access denied'}), 403
        
        # Increment usage count
        template.increment_usage()
        db.session.commit()
        
        # Return template data for job creation
        return jsonify({
            'message': 'Template usage recorded',
            'template': template.to_dict(include_usage_stats=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to record template usage', 'details': str(e)}), 500

@job_template_bp.route('/job-templates/export', methods=['GET'])
@token_required
@role_required('employer', 'admin', 'external_admin')
def export_job_templates(current_user):
    """Export user's job templates"""
    try:
        # Get user's own templates or all templates for admin
        if current_user.role == 'admin':
            templates = JobTemplate.query.filter_by(is_active=True).all()
        else:
            templates = JobTemplate.query.filter_by(
                created_by=current_user.id,
                is_active=True
            ).all()
        
        # Convert templates to export format
        export_data = []
        for template in templates:
            template_data = template.to_dict(include_usage_stats=True)
            export_data.append(template_data)
        
        return jsonify({
            'templates': export_data,
            'total_count': len(export_data),
            'exported_at': datetime.utcnow().isoformat(),
            'exported_by': {
                'id': current_user.id,
                'name': f"{current_user.first_name} {current_user.last_name}",
                'email': current_user.email
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to export job templates', 'details': str(e)}), 500

@job_template_bp.route('/job-templates/import', methods=['POST'])
@token_required
@role_required('employer', 'admin', 'external_admin')
def import_job_templates(current_user):
    """Import job templates from uploaded data"""
    try:
        data = request.get_json()
        
        if not data or not data.get('templates'):
            return jsonify({'error': 'No templates data provided'}), 400
        
        templates_data = data['templates']
        if not isinstance(templates_data, list):
            return jsonify({'error': 'Templates data must be an array'}), 400
        
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
                category_id = template_info.get('category_id')
                if category_id:
                    category = JobCategory.query.get(category_id)
                    if not category:
                        failed_imports.append({
                            'template_name': template_info['name'],
                            'error': 'Invalid category ID'
                        })
                        continue
                
                # Process tags
                tags = template_info.get('tags', [])
                if isinstance(tags, list):
                    tags_json = json.dumps(tags)
                else:
                    tags_json = json.dumps([])
                
                # Create template (with import prefix)
                template = JobTemplate(
                    created_by=current_user.id,
                    category_id=category_id,
                    name=f"{template_info['name']} (Imported)",
                    description=template_info.get('description'),
                    title=template_info['title'],
                    summary=template_info.get('summary'),
                    job_description=template_info['job_description'],
                    requirements=template_info.get('requirements'),
                    preferred_skills=template_info.get('preferred_skills'),
                    employment_type=template_info['employment_type'],
                    experience_level=template_info.get('experience_level', 'mid'),
                    education_requirement=template_info.get('education_requirement'),
                    location_type=template_info.get('location_type', 'on-site'),
                    location_city=template_info.get('location_city'),
                    location_state=template_info.get('location_state'),
                    location_country=template_info.get('location_country'),
                    salary_min=template_info.get('salary_min'),
                    salary_max=template_info.get('salary_max'),
                    salary_currency=template_info.get('salary_currency', 'USD'),
                    salary_period=template_info.get('salary_period', 'yearly'),
                    salary_negotiable=template_info.get('salary_negotiable', False),
                    show_salary=template_info.get('show_salary', True),
                    application_type=template_info.get('application_type', 'external'),
                    application_email=template_info.get('application_email'),
                    application_url=template_info.get('application_url'),
                    application_instructions=template_info.get('application_instructions'),
                    requires_resume=template_info.get('requires_resume', True),
                    requires_cover_letter=template_info.get('requires_cover_letter', False),
                    requires_portfolio=template_info.get('requires_portfolio', False),
                    is_active=template_info.get('is_active', True),
                    is_public=False,  # Imported templates are private by default
                    tags=tags_json
                )
                
                db.session.add(template)
                imported_templates.append(template.name)
                
            except Exception as e:
                failed_imports.append({
                    'template_name': template_info.get('name', 'Unknown'),
                    'error': str(e)
                })
        
        db.session.commit()
        
        return jsonify({
            'message': f'Import completed: {len(imported_templates)} templates imported, {len(failed_imports)} failed',
            'imported_templates': imported_templates,
            'failed_imports': failed_imports,
            'total_imported': len(imported_templates),
            'total_failed': len(failed_imports)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to import job templates', 'details': str(e)}), 500

@job_template_bp.route('/job-templates/stats', methods=['GET'])
@token_required
@role_required('employer', 'admin', 'external_admin')
def get_job_template_stats(current_user):
    """Get job template statistics"""
    try:
        # Get user's template statistics
        if current_user.role == 'admin':
            total_templates = JobTemplate.query.filter_by(is_active=True).count()
            public_templates = JobTemplate.query.filter_by(is_active=True, is_public=True).count()
            user_templates = JobTemplate.query.filter_by(created_by=current_user.id, is_active=True).count()
        else:
            user_templates = JobTemplate.query.filter_by(created_by=current_user.id, is_active=True).count()
            public_templates = JobTemplate.query.filter_by(is_active=True, is_public=True).count()
            total_templates = user_templates + public_templates
        
        # Get most used templates by current user
        from sqlalchemy import func
        if current_user.role == 'admin':
            popular_templates = db.session.query(
                JobTemplate.name,
                JobTemplate.usage_count
            ).filter_by(is_active=True).order_by(
                desc(JobTemplate.usage_count)
            ).limit(5).all()
        else:
            popular_templates = db.session.query(
                JobTemplate.name,
                JobTemplate.usage_count
            ).filter_by(
                created_by=current_user.id,
                is_active=True
            ).order_by(
                desc(JobTemplate.usage_count)
            ).limit(5).all()
        
        # Get category breakdown
        category_stats = db.session.query(
            JobCategory.name,
            func.count(JobTemplate.id).label('count')
        ).join(JobTemplate).filter(
            JobTemplate.is_active == True
        )
        
        if current_user.role != 'admin':
            category_stats = category_stats.filter(
                JobTemplate.created_by == current_user.id
            )
        
        category_stats = category_stats.group_by(JobCategory.id).all()
        
        return jsonify({
            'user_templates': user_templates,
            'public_templates': public_templates,
            'total_accessible': total_templates,
            'popular_templates': [
                {'name': template[0], 'usage_count': template[1]}
                for template in popular_templates
            ],
            'category_breakdown': [
                {'name': cat[0], 'count': cat[1]}
                for cat in category_stats
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get template statistics', 'details': str(e)}), 500

# Error handlers
@job_template_bp.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400

@job_template_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({'error': 'Unauthorized'}), 401

@job_template_bp.errorhandler(403)
def forbidden(error):
    return jsonify({'error': 'Forbidden'}), 403

@job_template_bp.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@job_template_bp.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500
