from flask import Blueprint, request, jsonify
from sqlalchemy import desc, asc, or_, and_
from datetime import datetime, timedelta
from src.models.user import db, User
from src.models.scholarship import (
    Scholarship, ScholarshipCategory, ScholarshipApplication, 
    ScholarshipBookmark, ScholarshipAlert
)
from src.routes.auth import token_required, role_required
import json
import re

scholarship_bp = Blueprint('scholarship', __name__)

def generate_slug(name):
    """Generate URL-friendly slug"""
    slug = re.sub(r'[^a-zA-Z0-9\s-]', '', name.lower())
    slug = re.sub(r'\s+', '-', slug)
    return slug.strip('-')

def generate_scholarship_slug(title, organization_name=""):
    """Generate unique slug for scholarship"""
    base_slug = generate_slug(f"{title} {organization_name}".strip())
    return base_slug

# Public scholarship endpoints
@scholarship_bp.route('/scholarships', methods=['GET'])
def get_scholarships():
    """Get published scholarships for public viewing"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        # Filtering parameters
        category_id = request.args.get('category_id', type=int)
        scholarship_type = request.args.get('scholarship_type')
        study_level = request.args.get('study_level')
        field_of_study = request.args.get('field_of_study')
        country = request.args.get('country')
        funding_type = request.args.get('funding_type')
        min_amount = request.args.get('min_amount', type=int)
        max_amount = request.args.get('max_amount', type=int)
        deadline_within_days = request.args.get('deadline_within_days', type=int)
        search = request.args.get('search')
        sort_by = request.args.get('sort_by', 'deadline')
        sort_order = request.args.get('sort_order', 'asc')
        
        # Build query for published scholarships only
        query = Scholarship.query.filter(
            Scholarship.status == 'published',
            Scholarship.is_active == True,
            Scholarship.application_deadline > datetime.utcnow()
        )
        
        # Apply filters
        if category_id:
            query = query.filter_by(category_id=category_id)
        if scholarship_type:
            query = query.filter_by(scholarship_type=scholarship_type)
        if study_level:
            query = query.filter_by(study_level=study_level)
        if field_of_study:
            query = query.filter(Scholarship.field_of_study.ilike(f'%{field_of_study}%'))
        if country:
            query = query.filter(Scholarship.country.ilike(f'%{country}%'))
        if funding_type:
            query = query.filter_by(funding_type=funding_type)
        if min_amount:
            query = query.filter(
                or_(
                    Scholarship.amount_min >= min_amount,
                    Scholarship.amount_max >= min_amount
                )
            )
        if max_amount:
            query = query.filter(
                or_(
                    Scholarship.amount_min <= max_amount,
                    Scholarship.amount_max <= max_amount
                )
            )
        if deadline_within_days:
            deadline_limit = datetime.utcnow() + timedelta(days=deadline_within_days)
            query = query.filter(Scholarship.application_deadline <= deadline_limit)
        
        if search:
            search_filter = or_(
                Scholarship.title.ilike(f'%{search}%'),
                Scholarship.description.ilike(f'%{search}%'),
                Scholarship.external_organization_name.ilike(f'%{search}%'),
                Scholarship.field_of_study.ilike(f'%{search}%')
            )
            query = query.filter(search_filter)
        
        # Apply sorting
        if sort_by == 'title':
            order_col = Scholarship.title
        elif sort_by == 'amount':
            order_col = Scholarship.amount_max.desc().nullslast()
        elif sort_by == 'deadline':
            order_col = Scholarship.application_deadline
        elif sort_by == 'created_at':
            order_col = Scholarship.created_at
        else:
            order_col = Scholarship.application_deadline
        
        if sort_order == 'desc' and sort_by != 'amount':
            query = query.order_by(desc(order_col))
        else:
            query = query.order_by(asc(order_col))
        
        scholarships = query.paginate(page=page, per_page=per_page, error_out=False)
        
        scholarship_list = []
        for scholarship in scholarships.items:
            scholarship_data = scholarship.to_dict()
            scholarship_data['category'] = scholarship.category.to_dict() if scholarship.category else None
            scholarship_list.append(scholarship_data)
        
        return jsonify({
            'scholarships': scholarship_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': scholarships.total,
                'pages': scholarships.pages,
                'has_next': scholarships.has_next,
                'has_prev': scholarships.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get scholarships', 'details': str(e)}), 500


@scholarship_bp.route('/scholarships/<int:scholarship_id>', methods=['GET'])
def get_scholarship_detail(scholarship_id):
    """Get detailed scholarship information"""
    try:
        scholarship = Scholarship.query.get_or_404(scholarship_id)
        
        if scholarship.status != 'published' or not scholarship.is_active:
            return jsonify({'error': 'Scholarship not found'}), 404
        
        # Increment view count
        scholarship.view_count += 1
        db.session.commit()
        
        scholarship_data = scholarship.to_dict(include_details=True, include_stats=True)
        scholarship_data['category'] = scholarship.category.to_dict() if scholarship.category else None
        
        return jsonify(scholarship_data), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get scholarship details', 'details': str(e)}), 500


# Scholarship categories
@scholarship_bp.route('/scholarship-categories', methods=['GET'])
def get_scholarship_categories():
    """Get all scholarship categories"""
    try:
        include_children = request.args.get('include_children', 'false').lower() == 'true'
        only_active = request.args.get('only_active', 'true').lower() == 'true'
        
        query = ScholarshipCategory.query
        if only_active:
            query = query.filter_by(is_active=True)
        
        categories = query.order_by(ScholarshipCategory.display_order, ScholarshipCategory.name).all()
        
        # Filter parent categories only if include_children is requested
        if include_children:
            parent_categories = [cat for cat in categories if cat.parent_id is None]
            return jsonify([cat.to_dict(include_children=True) for cat in parent_categories]), 200
        else:
            return jsonify([cat.to_dict() for cat in categories]), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get scholarship categories', 'details': str(e)}), 500


# External admin scholarship endpoints
@scholarship_bp.route('/external-scholarships', methods=['GET'])
@token_required
@role_required('external_admin', 'admin')
def get_external_scholarships(current_user):
    """Get external scholarships for external admin management"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        status = request.args.get('status')
        search = request.args.get('search')
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        query = Scholarship.query.filter_by(scholarship_source='external')
        
        if current_user.role == 'external_admin':
            query = query.filter_by(posted_by=current_user.id)
        
        if status:
            query = query.filter_by(status=status)
        
        if search:
            search_filter = or_(
                Scholarship.title.ilike(f'%{search}%'),
                Scholarship.external_organization_name.ilike(f'%{search}%'),
                Scholarship.description.ilike(f'%{search}%')
            )
            query = query.filter(search_filter)
        
        # Apply sorting
        if sort_by == 'title':
            order_col = Scholarship.title
        elif sort_by == 'organization':
            order_col = Scholarship.external_organization_name
        elif sort_by == 'deadline':
            order_col = Scholarship.application_deadline
        elif sort_by == 'created_at':
            order_col = Scholarship.created_at
        else:
            order_col = Scholarship.created_at
        
        if sort_order == 'desc':
            query = query.order_by(desc(order_col))
        else:
            query = query.order_by(asc(order_col))
        
        scholarships = query.paginate(page=page, per_page=per_page, error_out=False)
        
        scholarship_list = []
        for scholarship in scholarships.items:
            scholarship_data = scholarship.to_dict(include_details=True, include_stats=True)
            scholarship_data['category'] = scholarship.category.to_dict() if scholarship.category else None
            scholarship_data['poster'] = scholarship.poster.to_dict() if scholarship.poster else None
            scholarship_list.append(scholarship_data)
        
        # Get summary statistics for external scholarships
        if current_user.role == 'external_admin':
            total_external_scholarships = Scholarship.query.filter_by(posted_by=current_user.id, scholarship_source='external').count()
            published_external_scholarships = Scholarship.query.filter_by(posted_by=current_user.id, scholarship_source='external', status='published').count()
            draft_external_scholarships = Scholarship.query.filter_by(posted_by=current_user.id, scholarship_source='external', status='draft').count()
        else:
            total_external_scholarships = Scholarship.query.filter_by(scholarship_source='external').count()
            published_external_scholarships = Scholarship.query.filter_by(scholarship_source='external', status='published').count()
            draft_external_scholarships = Scholarship.query.filter_by(scholarship_source='external', status='draft').count()
        
        return jsonify({
            'external_scholarships': scholarship_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': scholarships.total,
                'pages': scholarships.pages,
                'has_next': scholarships.has_next,
                'has_prev': scholarships.has_prev
            },
            'summary': {
                'total_external_scholarships': total_external_scholarships,
                'published_external_scholarships': published_external_scholarships,
                'draft_external_scholarships': draft_external_scholarships
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get external scholarships', 'details': str(e)}), 500


@scholarship_bp.route('/external-scholarships/stats', methods=['GET'])
@token_required
@role_required('external_admin', 'admin')
def get_external_scholarship_stats(current_user):
    """Get statistics for external scholarships"""
    try:
        if current_user.role == 'external_admin':
            query_filter = {'posted_by': current_user.id, 'scholarship_source': 'external'}
        else:
            query_filter = {'scholarship_source': 'external'}
        
        total_scholarships = Scholarship.query.filter_by(**query_filter).count()
        published_scholarships = Scholarship.query.filter_by(**query_filter, status='published').count()
        draft_scholarships = Scholarship.query.filter_by(**query_filter, status='draft').count()
        
        # Get application and view counts
        scholarship_ids = [s.id for s in Scholarship.query.filter_by(**query_filter).all()]
        
        total_applications = db.session.query(db.func.sum(Scholarship.application_count)).filter(
            Scholarship.id.in_(scholarship_ids)
        ).scalar() or 0
        
        total_views = db.session.query(db.func.sum(Scholarship.view_count)).filter(
            Scholarship.id.in_(scholarship_ids)
        ).scalar() or 0
        
        # Get recent applications (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_applications = ScholarshipApplication.query.filter(
            ScholarshipApplication.scholarship_id.in_(scholarship_ids),
            ScholarshipApplication.created_at >= thirty_days_ago
        ).count()
        
        return jsonify({
            'total_external_scholarships': total_scholarships,
            'published_external_scholarships': published_scholarships,
            'draft_external_scholarships': draft_scholarships,
            'applications_count': total_applications,
            'views_count': total_views,
            'recent_applications': recent_applications
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get scholarship statistics', 'details': str(e)}), 500


@scholarship_bp.route('/scholarships', methods=['POST'])
@token_required
@role_required('external_admin', 'admin')
def create_scholarship(current_user):
    """Create a new scholarship posting"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'description', 'category_id', 'scholarship_type', 'application_deadline']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # For external admins, external_organization_name is required
        if current_user.role == 'external_admin' and not data.get('external_organization_name'):
            return jsonify({'error': 'external_organization_name is required for external scholarships'}), 400
        
        # Verify category exists
        category = ScholarshipCategory.query.get(data['category_id'])
        if not category:
            return jsonify({'error': 'Invalid category'}), 400
        
        # Parse and validate application deadline
        try:
            deadline_str = data['application_deadline']
            if 'T' in deadline_str:
                application_deadline = datetime.fromisoformat(deadline_str.replace('Z', '+00:00'))
            else:
                application_deadline = datetime.fromisoformat(deadline_str + 'T23:59:59')
        except ValueError:
            return jsonify({'error': 'Invalid application deadline format'}), 400
        
        if application_deadline <= datetime.utcnow():
            return jsonify({'error': 'Application deadline must be in the future'}), 400
        
        # Generate unique slug
        organization_name = data.get('external_organization_name', '')
        slug = generate_scholarship_slug(data['title'], organization_name)
        counter = 1
        original_slug = slug
        while Scholarship.query.filter_by(slug=slug).first():
            slug = f"{original_slug}-{counter}"
            counter += 1
        
        # Create scholarship
        scholarship = Scholarship(
            organization_id=data.get('organization_id'),
            category_id=data['category_id'],
            posted_by=current_user.id,
            title=data['title'].strip(),
            slug=slug,
            description=data['description'].strip(),
            summary=data.get('summary', '').strip() if data.get('summary') else None,
            scholarship_type=data['scholarship_type'],
            study_level=data.get('study_level'),
            field_of_study=data.get('field_of_study', '').strip() if data.get('field_of_study') else None,
            location_type=data.get('location_type', 'any'),
            country=data.get('country', '').strip() if data.get('country') else None,
            city=data.get('city', '').strip() if data.get('city') else None,
            state=data.get('state', '').strip() if data.get('state') else None,
            amount_min=data.get('amount_min'),
            amount_max=data.get('amount_max'),
            currency=data.get('currency', 'USD'),
            funding_type=data.get('funding_type', 'full'),
            renewable=data.get('renewable', False),
            duration_years=data.get('duration_years', 1),
            min_gpa=data.get('min_gpa'),
            max_age=data.get('max_age'),
            nationality_requirements=data.get('nationality_requirements'),
            gender_requirements=data.get('gender_requirements', 'any'),
            other_requirements=data.get('other_requirements', '').strip() if data.get('other_requirements') else None,
            application_deadline=application_deadline,
            application_type=data.get('application_type', 'external'),
            application_email=data.get('application_email'),
            application_url=data.get('application_url'),
            application_instructions=data.get('application_instructions', '').strip() if data.get('application_instructions') else None,
            required_documents=data.get('required_documents'),
            requires_transcript=data.get('requires_transcript', True),
            requires_recommendation_letters=data.get('requires_recommendation_letters', True),
            num_recommendation_letters=data.get('num_recommendation_letters', 2),
            requires_essay=data.get('requires_essay', True),
            essay_topics=data.get('essay_topics'),
            requires_portfolio=data.get('requires_portfolio', False),
            status=data.get('status', 'draft'),
            is_featured=data.get('is_featured', False),
            # External scholarship specific fields
            scholarship_source='external' if current_user.role == 'external_admin' else 'internal',
            external_organization_name=data.get('external_organization_name', '').strip() if data.get('external_organization_name') else None,
            external_organization_website=data.get('external_organization_website', '').strip() if data.get('external_organization_website') else None,
            external_organization_logo=data.get('external_organization_logo', '').strip() if data.get('external_organization_logo') else None,
            source_url=data.get('source_url', '').strip() if data.get('source_url') else None
        )
        
        # Set published_at if status is published
        if scholarship.status == 'published':
            scholarship.published_at = datetime.utcnow()
            scholarship.meta_title = f"{scholarship.title} - {scholarship.external_organization_name or 'Scholarship'}"
            scholarship.meta_description = (scholarship.summary or scholarship.description)[:160] + "..." if len(scholarship.summary or scholarship.description) > 160 else (scholarship.summary or scholarship.description)
        
        db.session.add(scholarship)
        db.session.commit()
        
        return jsonify({
            'message': 'Scholarship created successfully',
            'scholarship': scholarship.to_dict(include_details=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create scholarship', 'details': str(e)}), 500


@scholarship_bp.route('/scholarships/<int:scholarship_id>', methods=['PUT'])
@token_required
@role_required('external_admin', 'admin')
def update_scholarship(current_user, scholarship_id):
    """Update scholarship posting"""
    try:
        scholarship = Scholarship.query.get_or_404(scholarship_id)
        
        # Check permissions
        if current_user.role == 'external_admin' and scholarship.posted_by != current_user.id:
            return jsonify({'error': 'Not authorized to update this scholarship'}), 403
        
        data = request.get_json()
        
        # Update basic fields
        updatable_fields = [
            'title', 'description', 'summary', 'scholarship_type', 'study_level',
            'field_of_study', 'location_type', 'country', 'city', 'state',
            'amount_min', 'amount_max', 'currency', 'funding_type', 'renewable',
            'duration_years', 'min_gpa', 'max_age', 'nationality_requirements',
            'gender_requirements', 'other_requirements', 'application_type',
            'application_email', 'application_url', 'application_instructions',
            'required_documents', 'requires_transcript', 'requires_recommendation_letters',
            'num_recommendation_letters', 'requires_essay', 'essay_topics',
            'requires_portfolio', 'status', 'is_featured', 'external_organization_name',
            'external_organization_website', 'external_organization_logo', 'source_url'
        ]
        
        for field in updatable_fields:
            if field in data:
                setattr(scholarship, field, data[field])
        
        # Handle application deadline
        if 'application_deadline' in data:
            try:
                deadline_str = data['application_deadline']
                if 'T' in deadline_str:
                    application_deadline = datetime.fromisoformat(deadline_str.replace('Z', '+00:00'))
                else:
                    application_deadline = datetime.fromisoformat(deadline_str + 'T23:59:59')
                
                if application_deadline <= datetime.utcnow():
                    return jsonify({'error': 'Application deadline must be in the future'}), 400
                
                scholarship.application_deadline = application_deadline
                
            except ValueError:
                return jsonify({'error': 'Invalid application deadline format'}), 400
        
        # Handle category change
        if 'category_id' in data:
            category = ScholarshipCategory.query.get(data['category_id'])
            if not category:
                return jsonify({'error': 'Invalid category'}), 400
            scholarship.category_id = data['category_id']
        
        # Set published_at if status changed to published
        if 'status' in data and data['status'] == 'published' and scholarship.status != 'published':
            scholarship.published_at = datetime.utcnow()
        
        scholarship.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Scholarship updated successfully',
            'scholarship': scholarship.to_dict(include_details=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update scholarship', 'details': str(e)}), 500


@scholarship_bp.route('/scholarships/<int:scholarship_id>', methods=['DELETE'])
@token_required
@role_required('external_admin', 'admin')
def delete_scholarship(current_user, scholarship_id):
    """Delete scholarship posting"""
    try:
        scholarship = Scholarship.query.get_or_404(scholarship_id)
        
        # Check permissions
        if current_user.role == 'external_admin' and scholarship.posted_by != current_user.id:
            return jsonify({'error': 'Not authorized to delete this scholarship'}), 403
        
        db.session.delete(scholarship)
        db.session.commit()
        
        return jsonify({'message': 'Scholarship deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete scholarship', 'details': str(e)}), 500


@scholarship_bp.route('/external-scholarships/bulk-import', methods=['POST'])
@token_required
@role_required('external_admin', 'admin')
def bulk_import_external_scholarships(current_user):
    """Bulk import external scholarships from various sources"""
    try:
        data = request.get_json()
        scholarships_data = data.get('scholarships', [])
        
        if not scholarships_data:
            return jsonify({'error': 'No scholarships data provided'}), 400
        
        imported_scholarships = []
        failed_imports = []
        
        for scholarship_info in scholarships_data:
            try:
                # Validate required fields
                required_fields = ['title', 'description', 'external_organization_name', 'scholarship_type', 'category_id', 'application_deadline']
                missing_fields = [field for field in required_fields if not scholarship_info.get(field)]
                
                if missing_fields:
                    failed_imports.append({
                        'scholarship_title': scholarship_info.get('title', 'Unknown'),
                        'error': f'Missing required fields: {", ".join(missing_fields)}'
                    })
                    continue
                
                # Verify category exists
                category = ScholarshipCategory.query.get(scholarship_info['category_id'])
                if not category:
                    failed_imports.append({
                        'scholarship_title': scholarship_info['title'],
                        'error': 'Invalid category ID'
                    })
                    continue
                
                # Parse application deadline
                try:
                    deadline_str = scholarship_info['application_deadline']
                    if 'T' in deadline_str:
                        application_deadline = datetime.fromisoformat(deadline_str.replace('Z', '+00:00'))
                    else:
                        application_deadline = datetime.fromisoformat(deadline_str + 'T23:59:59')
                    
                    if application_deadline <= datetime.utcnow():
                        failed_imports.append({
                            'scholarship_title': scholarship_info['title'],
                            'error': 'Application deadline must be in the future'
                        })
                        continue
                        
                except ValueError:
                    failed_imports.append({
                        'scholarship_title': scholarship_info['title'],
                        'error': 'Invalid application deadline format'
                    })
                    continue
                
                # Generate unique slug
                external_organization_name = scholarship_info['external_organization_name'].strip()
                slug = generate_scholarship_slug(scholarship_info['title'], external_organization_name)
                counter = 1
                original_slug = slug
                while Scholarship.query.filter_by(slug=slug).first():
                    slug = f"{original_slug}-{counter}"
                    counter += 1
                
                # Create external scholarship
                scholarship = Scholarship(
                    organization_id=None,  # External scholarships don't have organization profiles
                    category_id=scholarship_info['category_id'],
                    posted_by=current_user.id,
                    title=scholarship_info['title'].strip(),
                    slug=slug,
                    description=scholarship_info['description'].strip(),
                    summary=scholarship_info.get('summary', '').strip() if scholarship_info.get('summary') else None,
                    scholarship_type=scholarship_info['scholarship_type'],
                    study_level=scholarship_info.get('study_level'),
                    field_of_study=scholarship_info.get('field_of_study', '').strip() if scholarship_info.get('field_of_study') else None,
                    location_type=scholarship_info.get('location_type', 'any'),
                    country=scholarship_info.get('country', '').strip() if scholarship_info.get('country') else None,
                    city=scholarship_info.get('city', '').strip() if scholarship_info.get('city') else None,
                    state=scholarship_info.get('state', '').strip() if scholarship_info.get('state') else None,
                    amount_min=scholarship_info.get('amount_min'),
                    amount_max=scholarship_info.get('amount_max'),
                    currency=scholarship_info.get('currency', 'USD'),
                    funding_type=scholarship_info.get('funding_type', 'full'),
                    renewable=scholarship_info.get('renewable', False),
                    duration_years=scholarship_info.get('duration_years', 1),
                    min_gpa=scholarship_info.get('min_gpa'),
                    max_age=scholarship_info.get('max_age'),
                    nationality_requirements=scholarship_info.get('nationality_requirements'),
                    gender_requirements=scholarship_info.get('gender_requirements', 'any'),
                    other_requirements=scholarship_info.get('other_requirements', '').strip() if scholarship_info.get('other_requirements') else None,
                    application_deadline=application_deadline,
                    application_type=scholarship_info.get('application_type', 'external'),
                    application_email=scholarship_info.get('application_email'),
                    application_url=scholarship_info.get('application_url'),
                    application_instructions=scholarship_info.get('application_instructions', '').strip() if scholarship_info.get('application_instructions') else None,
                    required_documents=scholarship_info.get('required_documents'),
                    requires_transcript=scholarship_info.get('requires_transcript', True),
                    requires_recommendation_letters=scholarship_info.get('requires_recommendation_letters', True),
                    num_recommendation_letters=scholarship_info.get('num_recommendation_letters', 2),
                    requires_essay=scholarship_info.get('requires_essay', True),
                    essay_topics=scholarship_info.get('essay_topics'),
                    requires_portfolio=scholarship_info.get('requires_portfolio', False),
                    status=scholarship_info.get('status', 'published'),
                    # External scholarship specific fields
                    scholarship_source='external',
                    external_organization_name=external_organization_name,
                    external_organization_website=scholarship_info.get('external_organization_website', '').strip() if scholarship_info.get('external_organization_website') else None,
                    external_organization_logo=scholarship_info.get('external_organization_logo', '').strip() if scholarship_info.get('external_organization_logo') else None,
                    source_url=scholarship_info.get('source_url', '').strip() if scholarship_info.get('source_url') else None
                )
                
                # Set published_at if status is published
                if scholarship.status == 'published':
                    scholarship.published_at = datetime.utcnow()
                    scholarship.meta_title = f"{scholarship.title} - {scholarship.external_organization_name}"
                    scholarship.meta_description = (scholarship.summary or scholarship.description)[:160] + "..." if len(scholarship.summary or scholarship.description) > 160 else (scholarship.summary or scholarship.description)
                
                db.session.add(scholarship)
                imported_scholarships.append(scholarship.title)
                
            except Exception as e:
                failed_imports.append({
                    'scholarship_title': scholarship_info.get('title', 'Unknown'),
                    'error': str(e)
                })
        
        db.session.commit()
        
        return jsonify({
            'message': f'Bulk import completed: {len(imported_scholarships)} scholarships imported, {len(failed_imports)} failed',
            'imported_scholarships': imported_scholarships,
            'failed_imports': failed_imports,
            'total_imported': len(imported_scholarships),
            'total_failed': len(failed_imports)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to bulk import scholarships', 'details': str(e)}), 500


# Scholarship bookmarks
@scholarship_bp.route('/scholarships/<int:scholarship_id>/bookmark', methods=['POST'])
@token_required
@role_required('job_seeker')
def bookmark_scholarship(current_user, scholarship_id):
    """Bookmark a scholarship"""
    try:
        scholarship = Scholarship.query.get_or_404(scholarship_id)
        
        # Check if already bookmarked
        existing_bookmark = ScholarshipBookmark.query.filter_by(
            user_id=current_user.id,
            scholarship_id=scholarship_id
        ).first()
        
        if existing_bookmark:
            return jsonify({'error': 'Scholarship already bookmarked'}), 400
        
        bookmark = ScholarshipBookmark(
            user_id=current_user.id,
            scholarship_id=scholarship_id
        )
        
        db.session.add(bookmark)
        
        # Update bookmark count
        scholarship.bookmark_count += 1
        
        db.session.commit()
        
        return jsonify({'message': 'Scholarship bookmarked successfully'}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to bookmark scholarship', 'details': str(e)}), 500


@scholarship_bp.route('/scholarships/<int:scholarship_id>/bookmark', methods=['DELETE'])
@token_required
@role_required('job_seeker')
def remove_scholarship_bookmark(current_user, scholarship_id):
    """Remove scholarship bookmark"""
    try:
        bookmark = ScholarshipBookmark.query.filter_by(
            user_id=current_user.id,
            scholarship_id=scholarship_id
        ).first()
        
        if not bookmark:
            return jsonify({'error': 'Bookmark not found'}), 404
        
        scholarship = Scholarship.query.get(scholarship_id)
        if scholarship and scholarship.bookmark_count > 0:
            scholarship.bookmark_count -= 1
        
        db.session.delete(bookmark)
        db.session.commit()
        
        return jsonify({'message': 'Bookmark removed successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to remove bookmark', 'details': str(e)}), 500


# User's bookmarked scholarships
@scholarship_bp.route('/my-bookmarked-scholarships', methods=['GET'])
@token_required
@role_required('job_seeker')
def get_my_bookmarked_scholarships(current_user):
    """Get user's bookmarked scholarships"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        query = db.session.query(Scholarship).join(ScholarshipBookmark).filter(
            ScholarshipBookmark.user_id == current_user.id,
            Scholarship.is_active == True
        ).order_by(ScholarshipBookmark.created_at.desc())
        
        scholarships = query.paginate(page=page, per_page=per_page, error_out=False)
        
        scholarship_list = []
        for scholarship in scholarships.items:
            scholarship_data = scholarship.to_dict()
            scholarship_data['category'] = scholarship.category.to_dict() if scholarship.category else None
            scholarship_list.append(scholarship_data)
        
        return jsonify({
            'bookmarked_scholarships': scholarship_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': scholarships.total,
                'pages': scholarships.pages,
                'has_next': scholarships.has_next,
                'has_prev': scholarships.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get bookmarked scholarships', 'details': str(e)}), 500


# Error handlers
@scholarship_bp.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400

@scholarship_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({'error': 'Unauthorized'}), 401

@scholarship_bp.errorhandler(403)
def forbidden(error):
    return jsonify({'error': 'Forbidden'}), 403

@scholarship_bp.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@scholarship_bp.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500
