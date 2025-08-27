from flask import Blueprint, request, jsonify
from datetime import datetime
import re

from src.models.user import db
from src.models.company import Company, CompanyBenefit, CompanyTeamMember
from src.routes.auth import token_required, role_required

company_bp = Blueprint('company', __name__)

def generate_slug(name):
    """Generate URL-friendly slug from company name"""
    slug = re.sub(r'[^a-zA-Z0-9\s-]', '', name.lower())
    slug = re.sub(r'\s+', '-', slug)
    return slug.strip('-')

@company_bp.route('/companies', methods=['GET'])
def get_companies():
    """Get list of companies with pagination and filtering"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        # Filtering parameters
        industry = request.args.get('industry')
        company_size = request.args.get('company_size')
        location = request.args.get('location')
        search = request.args.get('search')
        featured_only = request.args.get('featured', type=bool)
        
        # Build query
        query = Company.query.filter_by(is_active=True)
        
        if industry:
            query = query.filter(Company.industry.ilike(f'%{industry}%'))
        if company_size:
            query = query.filter_by(company_size=company_size)
        if location:
            query = query.filter(
                db.or_(
                    Company.city.ilike(f'%{location}%'),
                    Company.state.ilike(f'%{location}%'),
                    Company.country.ilike(f'%{location}%')
                )
            )
        if search:
            query = query.filter(
                db.or_(
                    Company.name.ilike(f'%{search}%'),
                    Company.description.ilike(f'%{search}%'),
                    Company.tagline.ilike(f'%{search}%')
                )
            )
        if featured_only:
            query = query.filter_by(is_featured=True)
        
        # Order by featured first, then by name
        query = query.order_by(Company.is_featured.desc(), Company.name)
        
        # Paginate
        companies = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'companies': [company.to_dict(include_stats=True) for company in companies.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': companies.total,
                'pages': companies.pages,
                'has_next': companies.has_next,
                'has_prev': companies.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get companies', 'details': str(e)}), 500

@company_bp.route('/companies/<int:company_id>', methods=['GET'])
def get_company(company_id):
    """Get company details by ID"""
    try:
        company = Company.query.filter_by(id=company_id, is_active=True).first()
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        # Increment profile views
        company.profile_views += 1
        db.session.commit()
        
        company_data = company.to_dict(include_stats=True)
        
        # Add benefits and team members
        benefits = CompanyBenefit.query.filter_by(company_id=company_id).order_by(
            CompanyBenefit.display_order, CompanyBenefit.title
        ).all()
        company_data['benefits'] = [benefit.to_dict() for benefit in benefits]
        
        team_members = CompanyTeamMember.query.filter_by(
            company_id=company_id, is_visible=True
        ).order_by(
            CompanyTeamMember.is_leadership.desc(),
            CompanyTeamMember.display_order,
            CompanyTeamMember.name
        ).all()
        company_data['team_members'] = [member.to_dict() for member in team_members]
        
        return jsonify(company_data), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get company', 'details': str(e)}), 500

@company_bp.route('/companies', methods=['POST'])
@token_required
@role_required('employer', 'admin')
def create_company(current_user):
    """Create a new company"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({'error': 'Company name is required'}), 400
        
        # Check if company name already exists
        existing_company = Company.query.filter_by(name=data['name']).first()
        if existing_company:
            return jsonify({'error': 'Company name already exists'}), 409
        
        # Generate slug
        slug = generate_slug(data['name'])
        counter = 1
        original_slug = slug
        while Company.query.filter_by(slug=slug).first():
            slug = f"{original_slug}-{counter}"
            counter += 1
        
        # Create company
        company = Company(
            name=data['name'],
            slug=slug,
            description=data.get('description'),
            tagline=data.get('tagline'),
            website=data.get('website'),
            email=data.get('email'),
            phone=data.get('phone'),
            address_line1=data.get('address_line1'),
            address_line2=data.get('address_line2'),
            city=data.get('city'),
            state=data.get('state'),
            country=data.get('country'),
            postal_code=data.get('postal_code'),
            industry=data.get('industry'),
            company_size=data.get('company_size'),
            founded_year=data.get('founded_year'),
            company_type=data.get('company_type'),
            logo_url=data.get('logo_url'),
            cover_image_url=data.get('cover_image_url'),
            linkedin_url=data.get('linkedin_url'),
            twitter_url=data.get('twitter_url'),
            facebook_url=data.get('facebook_url'),
            instagram_url=data.get('instagram_url')
        )
        
        db.session.add(company)
        db.session.flush()  # Get company ID
        
        # Update employer profile to link to this company
        if current_user.employer_profile:
            current_user.employer_profile.company_id = company.id
        
        db.session.commit()
        
        return jsonify({
            'message': 'Company created successfully',
            'company': company.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create company', 'details': str(e)}), 500

@company_bp.route('/companies/<int:company_id>', methods=['PUT'])
@token_required
@role_required('employer', 'admin')
def update_company(current_user, company_id):
    """Update company information"""
    try:
        company = Company.query.get(company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        # Check if user has permission to update this company
        if (current_user.role == 'employer' and 
            current_user.employer_profile and 
            current_user.employer_profile.company_id != company_id):
            return jsonify({'error': 'You can only update your own company'}), 403
        
        data = request.get_json()
        
        # Update company fields
        updatable_fields = [
            'name', 'description', 'tagline', 'website', 'email', 'phone',
            'address_line1', 'address_line2', 'city', 'state', 'country', 'postal_code',
            'industry', 'company_size', 'founded_year', 'company_type',
            'logo_url', 'cover_image_url', 'linkedin_url', 'twitter_url',
            'facebook_url', 'instagram_url'
        ]
        
        for field in updatable_fields:
            if field in data:
                setattr(company, field, data[field])
        
        # Update slug if name changed
        if 'name' in data:
            new_slug = generate_slug(data['name'])
            if new_slug != company.slug:
                counter = 1
                original_slug = new_slug
                while Company.query.filter(
                    Company.slug == new_slug,
                    Company.id != company_id
                ).first():
                    new_slug = f"{original_slug}-{counter}"
                    counter += 1
                company.slug = new_slug
        
        company.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Company updated successfully',
            'company': company.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update company', 'details': str(e)}), 500

@company_bp.route('/companies/<int:company_id>/benefits', methods=['GET'])
def get_company_benefits(company_id):
    """Get company benefits"""
    try:
        company = Company.query.filter_by(id=company_id, is_active=True).first()
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        benefits = CompanyBenefit.query.filter_by(company_id=company_id).order_by(
            CompanyBenefit.display_order, CompanyBenefit.title
        ).all()
        
        return jsonify({
            'benefits': [benefit.to_dict() for benefit in benefits]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get benefits', 'details': str(e)}), 500

@company_bp.route('/companies/<int:company_id>/benefits', methods=['POST'])
@token_required
@role_required('employer', 'admin')
def add_company_benefit(current_user, company_id):
    """Add a company benefit"""
    try:
        company = Company.query.get(company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        # Check permission
        if (current_user.role == 'employer' and 
            current_user.employer_profile and 
            current_user.employer_profile.company_id != company_id):
            return jsonify({'error': 'You can only manage your own company'}), 403
        
        data = request.get_json()
        
        if not data.get('title'):
            return jsonify({'error': 'Benefit title is required'}), 400
        
        benefit = CompanyBenefit(
            company_id=company_id,
            title=data['title'],
            description=data.get('description'),
            category=data.get('category'),
            icon=data.get('icon'),
            is_highlighted=data.get('is_highlighted', False),
            display_order=data.get('display_order', 0)
        )
        
        db.session.add(benefit)
        db.session.commit()
        
        return jsonify({
            'message': 'Benefit added successfully',
            'benefit': benefit.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to add benefit', 'details': str(e)}), 500

@company_bp.route('/companies/<int:company_id>/team', methods=['GET'])
def get_company_team(company_id):
    """Get company team members"""
    try:
        company = Company.query.filter_by(id=company_id, is_active=True).first()
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        team_members = CompanyTeamMember.query.filter_by(
            company_id=company_id, is_visible=True
        ).order_by(
            CompanyTeamMember.is_leadership.desc(),
            CompanyTeamMember.display_order,
            CompanyTeamMember.name
        ).all()
        
        return jsonify({
            'team_members': [member.to_dict() for member in team_members]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get team members', 'details': str(e)}), 500

@company_bp.route('/companies/<int:company_id>/team', methods=['POST'])
@token_required
@role_required('employer', 'admin')
def add_team_member(current_user, company_id):
    """Add a team member"""
    try:
        company = Company.query.get(company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        # Check permission
        if (current_user.role == 'employer' and 
            current_user.employer_profile and 
            current_user.employer_profile.company_id != company_id):
            return jsonify({'error': 'You can only manage your own company'}), 403
        
        data = request.get_json()
        
        if not data.get('name'):
            return jsonify({'error': 'Team member name is required'}), 400
        
        team_member = CompanyTeamMember(
            company_id=company_id,
            name=data['name'],
            position=data.get('position'),
            bio=data.get('bio'),
            photo_url=data.get('photo_url'),
            email=data.get('email'),
            linkedin_url=data.get('linkedin_url'),
            is_leadership=data.get('is_leadership', False),
            display_order=data.get('display_order', 0)
        )
        
        db.session.add(team_member)
        db.session.commit()
        
        return jsonify({
            'message': 'Team member added successfully',
            'team_member': team_member.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to add team member', 'details': str(e)}), 500

@company_bp.route('/my-company', methods=['GET'])
@token_required
@role_required('employer')
def get_my_company(current_user):
    """Get current user's company"""
    try:
        if not current_user.employer_profile or not current_user.employer_profile.company_id:
            return jsonify({'error': 'No company associated with your account'}), 404
        
        company = Company.query.get(current_user.employer_profile.company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        company_data = company.to_dict(include_stats=True)
        
        # Add benefits and team members
        benefits = CompanyBenefit.query.filter_by(company_id=company.id).order_by(
            CompanyBenefit.display_order, CompanyBenefit.title
        ).all()
        company_data['benefits'] = [benefit.to_dict() for benefit in benefits]
        
        team_members = CompanyTeamMember.query.filter_by(company_id=company.id).order_by(
            CompanyTeamMember.is_leadership.desc(),
            CompanyTeamMember.display_order,
            CompanyTeamMember.name
        ).all()
        company_data['team_members'] = [member.to_dict() for member in team_members]
        
        return jsonify(company_data), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get company', 'details': str(e)}), 500

# ===== COMPANY SETTINGS ENDPOINTS =====

@company_bp.route('/my-company/settings/account', methods=['GET'])
@token_required
@role_required('employer')
def get_company_account_settings(current_user):
    """Get company account settings"""
    try:
        if not current_user.employer_profile or not current_user.employer_profile.company_id:
            return jsonify({'error': 'No company associated with your account'}), 404
        
        company = Company.query.get(current_user.employer_profile.company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        settings = {
            'company_name': company.name,
            'contact_email': company.email,
            'contact_phone': company.phone,
            'billing_email': company.email,  # Can be separate field
            'timezone': 'UTC',  # Default timezone
            'language': 'en',
            'currency': 'USD'
        }
        
        return jsonify(settings), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get account settings', 'details': str(e)}), 500

@company_bp.route('/my-company/settings/account', methods=['PUT'])
@token_required
@role_required('employer')
def update_company_account_settings(current_user):
    """Update company account settings"""
    try:
        if not current_user.employer_profile or not current_user.employer_profile.company_id:
            return jsonify({'error': 'No company associated with your account'}), 404
        
        company = Company.query.get(current_user.employer_profile.company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        data = request.get_json()
        
        # Update company fields
        if 'company_name' in data:
            company.name = data['company_name']
        if 'contact_email' in data:
            company.email = data['contact_email']
        if 'contact_phone' in data:
            company.phone = data['contact_phone']
        
        company.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Account settings updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update account settings', 'details': str(e)}), 500

@company_bp.route('/my-company/settings/security', methods=['GET'])
@token_required
@role_required('employer')
def get_company_security_settings(current_user):
    """Get company security settings"""
    try:
        # Return default security settings (can be stored in database)
        settings = {
            'two_factor_enabled': False,
            'login_notifications': True,
            'password_expiry': False,
            'session_timeout': 24,
            'ip_whitelist_enabled': False,
            'allowed_ips': []
        }
        
        return jsonify(settings), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get security settings', 'details': str(e)}), 500

@company_bp.route('/my-company/settings/security', methods=['PUT'])
@token_required
@role_required('employer')
def update_company_security_settings(current_user):
    """Update company security settings"""
    try:
        data = request.get_json()
        
        # Here you would update security settings in the database
        # For now, just return success
        
        return jsonify({'message': 'Security settings updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to update security settings', 'details': str(e)}), 500

@company_bp.route('/my-company/settings/notifications', methods=['GET'])
@token_required
@role_required('employer')
def get_company_notification_settings(current_user):
    """Get company notification settings"""
    try:
        settings = {
            'email_notifications': {
                'new_applications': True,
                'application_updates': True,
                'job_expiry_warnings': True,
                'system_updates': True,
                'marketing_emails': False,
                'weekly_reports': True
            },
            'push_notifications': {
                'instant_messages': True,
                'new_applications': True,
                'urgent_updates': True
            },
            'sms_notifications': {
                'urgent_only': False,
                'application_deadlines': False
            }
        }
        
        return jsonify(settings), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get notification settings', 'details': str(e)}), 500

@company_bp.route('/my-company/settings/notifications', methods=['PUT'])
@token_required
@role_required('employer')
def update_company_notification_settings(current_user):
    """Update company notification settings"""
    try:
        data = request.get_json()
        
        # Here you would update notification settings in the database
        # For now, just return success
        
        return jsonify({'message': 'Notification settings updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to update notification settings', 'details': str(e)}), 500

@company_bp.route('/my-company/settings/privacy', methods=['GET'])
@token_required
@role_required('employer')
def get_company_privacy_settings(current_user):
    """Get company privacy settings"""
    try:
        if not current_user.employer_profile or not current_user.employer_profile.company_id:
            return jsonify({'error': 'No company associated with your account'}), 404
        
        company = Company.query.get(current_user.employer_profile.company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        settings = {
            'company_visibility': 'public' if company.is_active else 'private',
            'show_employee_count': True,
            'show_salary_ranges': True,
            'show_company_reviews': True,
            'data_retention_days': 365,
            'allow_job_alerts': True,
            'analytics_tracking': True
        }
        
        return jsonify(settings), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get privacy settings', 'details': str(e)}), 500

@company_bp.route('/my-company/settings/privacy', methods=['PUT'])
@token_required
@role_required('employer')
def update_company_privacy_settings(current_user):
    """Update company privacy settings"""
    try:
        if not current_user.employer_profile or not current_user.employer_profile.company_id:
            return jsonify({'error': 'No company associated with your account'}), 404
        
        company = Company.query.get(current_user.employer_profile.company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        data = request.get_json()
        
        # Update visibility settings
        if 'company_visibility' in data:
            company.is_active = data['company_visibility'] != 'private'
        
        company.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Privacy settings updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update privacy settings', 'details': str(e)}), 500

@company_bp.route('/my-company/settings/billing', methods=['GET'])
@token_required
@role_required('employer')
def get_company_billing_settings(current_user):
    """Get company billing settings"""
    try:
        settings = {
            'subscription_plan': 'basic',
            'billing_cycle': 'monthly',
            'auto_renewal': True,
            'invoice_email': current_user.email,
            'payment_method': None,
            'billing_address': {},
            'usage_alerts': True
        }
        
        return jsonify(settings), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get billing settings', 'details': str(e)}), 500

@company_bp.route('/my-company/settings/billing', methods=['PUT'])
@token_required
@role_required('employer')
def update_company_billing_settings(current_user):
    """Update company billing settings"""
    try:
        data = request.get_json()
        
        # Here you would update billing settings in the database
        # For now, just return success
        
        return jsonify({'message': 'Billing settings updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to update billing settings', 'details': str(e)}), 500

@company_bp.route('/my-company/export-data/<data_type>', methods=['GET'])
@token_required
@role_required('employer')
def export_company_data(current_user, data_type):
    """Export company data"""
    try:
        if not current_user.employer_profile or not current_user.employer_profile.company_id:
            return jsonify({'error': 'No company associated with your account'}), 404
        
        company = Company.query.get(current_user.employer_profile.company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        export_data = {}
        
        if data_type in ['profile', 'all']:
            export_data['profile'] = company.to_dict(include_stats=True)
            
            # Add benefits and team members
            benefits = CompanyBenefit.query.filter_by(company_id=company.id).all()
            export_data['profile']['benefits'] = [benefit.to_dict() for benefit in benefits]
            
            team_members = CompanyTeamMember.query.filter_by(company_id=company.id).all()
            export_data['profile']['team_members'] = [member.to_dict() for member in team_members]
        
        if data_type in ['jobs', 'all']:
            jobs = company.jobs.all()
            export_data['jobs'] = [job.to_dict() for job in jobs]
        
        if data_type in ['applications', 'all']:
            # Get applications for company jobs
            from src.models.application import Application
            from src.models.job import Job
            applications = Application.query.join(Job).filter(Job.company_id == company.id).all()
            export_data['applications'] = [app.to_dict() for app in applications]
        
        export_data['exported_at'] = datetime.utcnow().isoformat()
        export_data['export_type'] = data_type
        
        return jsonify(export_data), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to export data', 'details': str(e)}), 500

@company_bp.route('/my-company/delete', methods=['DELETE'])
@token_required
@role_required('employer')
def delete_company_account(current_user):
    """Delete company account"""
    try:
        if not current_user.employer_profile or not current_user.employer_profile.company_id:
            return jsonify({'error': 'No company associated with your account'}), 404
        
        company = Company.query.get(current_user.employer_profile.company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        # Soft delete by marking as inactive
        company.is_active = False
        company.updated_at = datetime.utcnow()
        
        # Also deactivate the user account
        current_user.is_active = False
        
        db.session.commit()
        
        return jsonify({'message': 'Company account deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete company account', 'details': str(e)}), 500

@company_bp.route('/my-company/benefits/<int:benefit_id>', methods=['DELETE'])
@token_required
@role_required('employer')
def delete_company_benefit(current_user, benefit_id):
    """Delete a company benefit"""
    try:
        if not current_user.employer_profile or not current_user.employer_profile.company_id:
            return jsonify({'error': 'No company associated with your account'}), 404
        
        benefit = CompanyBenefit.query.filter_by(
            id=benefit_id, 
            company_id=current_user.employer_profile.company_id
        ).first()
        
        if not benefit:
            return jsonify({'error': 'Benefit not found'}), 404
        
        db.session.delete(benefit)
        db.session.commit()
        
        return jsonify({'message': 'Benefit deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete benefit', 'details': str(e)}), 500

@company_bp.route('/my-company/team/<int:member_id>', methods=['DELETE'])
@token_required
@role_required('employer')
def delete_company_team_member(current_user, member_id):
    """Delete a team member"""
    try:
        if not current_user.employer_profile or not current_user.employer_profile.company_id:
            return jsonify({'error': 'No company associated with your account'}), 404
        
        member = CompanyTeamMember.query.filter_by(
            id=member_id, 
            company_id=current_user.employer_profile.company_id
        ).first()
        
        if not member:
            return jsonify({'error': 'Team member not found'}), 404
        
        db.session.delete(member)
        db.session.commit()
        
        return jsonify({'message': 'Team member deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete team member', 'details': str(e)}), 500

# Error handlers
@company_bp.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400

@company_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({'error': 'Unauthorized'}), 401

@company_bp.errorhandler(403)
def forbidden(error):
    return jsonify({'error': 'Forbidden'}), 403

@company_bp.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@company_bp.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

