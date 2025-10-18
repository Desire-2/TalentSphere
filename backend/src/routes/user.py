from flask import Blueprint, jsonify, request
from src.models.user import User, JobSeekerProfile, db
from src.routes.auth import token_required, role_required
from datetime import datetime
import json
import logging

user_bp = Blueprint('user', __name__)

@user_bp.route('/users', methods=['GET'])
@token_required
@role_required('admin')
def get_users(current_user):
    """Get all users (admin only)"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        users = User.query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'users': [user.to_dict() for user in users.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': users.total,
                'pages': users.pages,
                'has_next': users.has_next,
                'has_prev': users.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get users', 'details': str(e)}), 500

@user_bp.route('/users/<int:user_id>', methods=['GET'])
@token_required
def get_user(current_user, user_id):
    """Get user by ID"""
    try:
        # Only allow users to view their own profile unless admin
        if current_user.role != 'admin' and current_user.id != user_id:
            return jsonify({'error': 'Access denied'}), 403
            
        user = User.query.get_or_404(user_id)
        user_data = user.to_dict(include_sensitive=(current_user.id == user_id or current_user.role == 'admin'))
        
        # Add role-specific profile data
        if user.role == 'job_seeker' and user.job_seeker_profile:
            user_data['job_seeker_profile'] = user.job_seeker_profile.to_dict()
        elif user.role == 'employer' and user.employer_profile:
            user_data['employer_profile'] = user.employer_profile.to_dict()
            
        return jsonify(user_data), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get user', 'details': str(e)}), 500

@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
@token_required
@role_required('admin')
def delete_user(current_user, user_id):
    """Hard delete user and all related data (admin only)"""
    logger = logging.getLogger('talentsphere.user.delete')
    try:
        user = User.query.get_or_404(user_id)
        
        # Don't allow deleting the currently logged-in admin
        if user_id == current_user.id:
            return jsonify({'error': 'Cannot delete your own admin account'}), 400
        
        # Log the deletion attempt
        logger.info(f'Admin {current_user.id} ({current_user.email}) is deleting user {user_id} ({user.email})')
        
        # Import all models that might have foreign key constraints
        from src.models.application import Application, ApplicationActivity
        from src.models.notification import Review, ReviewVote, Message
        
        # Clean up or cascade related data
        with db.session.no_autoflush:
            # Set referrer_id to NULL where this user is referenced (nullable foreign key)
            Application.query.filter_by(referrer_id=user_id).update({'referrer_id': None}, synchronize_session=False)
            
            # Handle reviews moderated by this user (nullable foreign key)
            Review.query.filter_by(moderated_by=user_id).update({'moderated_by': None}, synchronize_session=False)
            
            # Handle messages where this user is sender or recipient
            # We can't set sender_id or recipient_id to NULL (since they're non-nullable)
            # so we need to delete these records
            Message.query.filter((Message.sender_id == user_id) | (Message.recipient_id == user_id)).delete(synchronize_session=False)
            
            # We'll let the cascading delete handle other direct relationships like:
            # - JobSeekerProfile (cascade='all, delete-orphan')
            # - EmployerProfile (cascade='all, delete-orphan')
            # - Applications as applicant (cascade='all, delete-orphan')
            # - Notifications (cascade='all, delete-orphan')
            # - Reviews given/received (through cascade)
            # - ReviewVotes (through cascade)
        
        # Delete the user which will trigger cascade deletes for related objects
        db.session.delete(user)
        db.session.commit()
        
        logger.info(f'User {user_id} deleted successfully by admin {current_user.id}')
        return jsonify({'message': f'User {user_id} deleted permanently.'}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f'Failed to delete user {user_id}: {str(e)}')
        return jsonify({'error': 'Failed to delete user', 'details': str(e)}), 500

@user_bp.route('/users/bulk-delete', methods=['POST'])
@token_required
@role_required('admin')
def bulk_delete_users(current_user):
    """Bulk delete multiple users (admin only)"""
    logger = logging.getLogger('talentsphere.user.bulk_delete')
    try:
        data = request.get_json()
        user_ids = data.get('user_ids', [])
        if not isinstance(user_ids, list) or not user_ids:
            return jsonify({'error': 'user_ids must be a non-empty list'}), 400
            
        # Don't allow deleting the currently logged-in admin
        if current_user.id in user_ids:
            user_ids.remove(current_user.id)
            logger.warning(f'Removed current admin (ID: {current_user.id}) from bulk delete list')
            
        # Import all models that might have foreign key constraints
        from src.models.application import Application, ApplicationActivity
        from src.models.notification import Review, ReviewVote, Message
        
        # Clean up references that might cause constraint violations
        with db.session.no_autoflush:
            # Handle referrer_id in Applications (nullable foreign key)
            Application.query.filter(Application.referrer_id.in_(user_ids)).update({'referrer_id': None}, synchronize_session=False)
            
            # Handle reviews moderated by these users (nullable foreign key)
            Review.query.filter(Review.moderated_by.in_(user_ids)).update({'moderated_by': None}, synchronize_session=False)
            
            # Delete messages where these users are senders or recipients (non-nullable foreign keys)
            Message.query.filter((Message.sender_id.in_(user_ids)) | (Message.recipient_id.in_(user_ids))).delete(synchronize_session=False)
        
        deleted = []
        errors = []
        for user_id in user_ids:
            try:
                user = User.query.get(user_id)
                if user:
                    logger.info(f'Admin {current_user.id} ({current_user.email}) is deleting user {user_id} ({user.email})')
                    db.session.delete(user)
                    deleted.append(user_id)
                else:
                    errors.append({'user_id': user_id, 'error': 'User not found'})
            except Exception as e:
                db.session.rollback()  # Rollback on individual user error
                errors.append({'user_id': user_id, 'error': str(e)})
        db.session.commit()
        logger.info(f'Bulk delete completed by admin {current_user.id}. Deleted: {deleted}. Errors: {errors}')
        return jsonify({'deleted': deleted, 'errors': errors}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f'Bulk delete failed: {str(e)}')
        return jsonify({'error': 'Bulk delete failed', 'details': str(e)}), 500

@user_bp.route('/users/<int:user_id>/profile-completion', methods=['GET'])
@token_required
def get_profile_completion(current_user, user_id):
    """Get profile completion percentage for a user"""
    try:
        # Only allow users to view their own profile completion unless admin
        if current_user.role != 'admin' and current_user.id != user_id:
            return jsonify({'error': 'Access denied'}), 403
            
        user = User.query.get_or_404(user_id)
        
        if user.role == 'job_seeker':
            profile = user.job_seeker_profile
            if not profile:
                return jsonify({'completion_percentage': 0, 'missing_fields': []}), 200
            
            # Calculate completion for job seeker profile
            required_fields = [
                ('basic_info', [
                    user.first_name,
                    user.last_name,
                    user.email,
                    user.phone,
                    user.location
                ]),
                ('professional_info', [
                    profile.desired_position,
                    profile.years_of_experience,
                    profile.education_level,
                    profile.skills
                ]),
                ('preferences', [
                    profile.preferred_location,
                    profile.job_type_preference,
                    profile.availability
                ])
            ]
            
            total_fields = 0
            completed_fields = 0
            missing_fields = []
            
            for category, fields in required_fields:
                for field in fields:
                    total_fields += 1
                    if field:
                        completed_fields += 1
                    else:
                        missing_fields.append(category)
            
            completion_percentage = round((completed_fields / total_fields) * 100) if total_fields > 0 else 0
            
            return jsonify({
                'completion_percentage': completion_percentage,
                'completed_fields': completed_fields,
                'total_fields': total_fields,
                'missing_fields': list(set(missing_fields))
            }), 200
            
        else:
            # For other user types, basic completion calculation
            basic_fields = [user.first_name, user.last_name, user.email, user.phone]
            completed = sum(1 for field in basic_fields if field)
            percentage = round((completed / len(basic_fields)) * 100)
            
            return jsonify({
                'completion_percentage': percentage,
                'completed_fields': completed,
                'total_fields': len(basic_fields)
            }), 200
            
    except Exception as e:
        return jsonify({'error': 'Failed to calculate profile completion', 'details': str(e)}), 500

@user_bp.route('/users/<int:user_id>/visibility', methods=['PUT'])
@token_required
def update_profile_visibility(current_user, user_id):
    """Update profile visibility settings"""
    try:
        # Only allow users to update their own visibility
        if current_user.id != user_id:
            return jsonify({'error': 'Access denied'}), 403
            
        data = request.get_json()
        visibility = data.get('profile_visibility')
        
        if visibility not in ['public', 'employers_only', 'private']:
            return jsonify({'error': 'Invalid visibility setting'}), 400
            
        if current_user.role == 'job_seeker':
            profile = current_user.job_seeker_profile
            if not profile:
                profile = JobSeekerProfile(user_id=current_user.id)
                db.session.add(profile)
                
            profile.profile_visibility = visibility
            profile.updated_at = datetime.utcnow()
            
        current_user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Profile visibility updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update profile visibility', 'details': str(e)}), 500

@user_bp.route('/users/<int:user_id>/export', methods=['GET'])
@token_required
def export_user_data(current_user, user_id):
    """Export user data (GDPR compliance)"""
    try:
        # Only allow users to export their own data
        if current_user.id != user_id:
            return jsonify({'error': 'Access denied'}), 403
            
        user = User.query.get_or_404(user_id)
        export_data = {
            'user_profile': user.to_dict(include_sensitive=True),
            'exported_at': datetime.utcnow().isoformat(),
            'export_version': '1.0'
        }
        
        # Add role-specific data
        if user.role == 'job_seeker' and user.job_seeker_profile:
            export_data['job_seeker_profile'] = user.job_seeker_profile.to_dict()
            
            # Add applications data
            from src.models.application import Application
            applications = Application.query.filter_by(applicant_id=user.id).all()
            export_data['applications'] = [app.to_dict() for app in applications]
            
        elif user.role == 'employer' and user.employer_profile:
            export_data['employer_profile'] = user.employer_profile.to_dict()
            
        return jsonify(export_data), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to export user data', 'details': str(e)}), 500

@user_bp.route('/users/<int:user_id>/activity-summary', methods=['GET'])
@token_required
def get_activity_summary(current_user, user_id):
    """Get user activity summary"""
    try:
        # Only allow users to view their own activity unless admin
        if current_user.role != 'admin' and current_user.id != user_id:
            return jsonify({'error': 'Access denied'}), 403
            
        user = User.query.get_or_404(user_id)
        
        if user.role == 'job_seeker':
            from src.models.application import Application
            from src.models.job import JobBookmark
            
            # Get applications stats
            applications = Application.query.filter_by(applicant_id=user.id).all()
            applications_by_status = {}
            for app in applications:
                status = app.status
                applications_by_status[status] = applications_by_status.get(status, 0) + 1
            
            # Get bookmarks count
            bookmarks_count = JobBookmark.query.filter_by(user_id=user.id).count()
            
            # Get recent activity
            recent_applications = Application.query.filter_by(applicant_id=user.id)\
                .order_by(Application.created_at.desc()).limit(5).all()
            
            activity_summary = {
                'total_applications': len(applications),
                'applications_by_status': applications_by_status,
                'bookmarked_jobs': bookmarks_count,
                'profile_views': 0,  # Would need separate tracking
                'recent_applications': [
                    {
                        'job_title': app.job.title if app.job else 'Unknown',
                        'company': app.job.company.name if app.job and app.job.company else 'Unknown',
                        'applied_date': app.created_at.isoformat(),
                        'status': app.status
                    }
                    for app in recent_applications
                ],
                'account_created': user.created_at.isoformat(),
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'profile_updated': user.updated_at.isoformat()
            }
            
            return jsonify(activity_summary), 200
            
        else:
            # Basic activity for other user types
            return jsonify({
                'account_created': user.created_at.isoformat(),
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'profile_updated': user.updated_at.isoformat()
            }), 200
            
    except Exception as e:
        return jsonify({'error': 'Failed to get activity summary', 'details': str(e)}), 500

@user_bp.route('/users/<int:user_id>/skills', methods=['PUT'])
@token_required
def update_user_skills(current_user, user_id):
    """Update user skills (job seeker only)"""
    try:
        # Only allow users to update their own skills
        if current_user.id != user_id:
            return jsonify({'error': 'Access denied'}), 403
            
        if current_user.role != 'job_seeker':
            return jsonify({'error': 'Only job seekers can update skills'}), 400
            
        data = request.get_json()
        skills = data.get('skills', [])
        
        if not isinstance(skills, list):
            return jsonify({'error': 'Skills must be a list'}), 400
            
        profile = current_user.job_seeker_profile
        if not profile:
            profile = JobSeekerProfile(user_id=current_user.id)
            db.session.add(profile)
            
        profile.skills = json.dumps(skills)
        profile.updated_at = datetime.utcnow()
        current_user.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Skills updated successfully',
            'skills': skills
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update skills', 'details': str(e)}), 500

# Error handlers
@user_bp.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400

@user_bp.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'User not found'}), 404

@user_bp.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500
