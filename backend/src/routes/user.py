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
            # Delete application activities performed by this user (non-nullable FK)
            ApplicationActivity.query.filter_by(user_id=user_id).delete(synchronize_session=False)

            # Set referrer_id to NULL where this user is referenced (nullable foreign key)
            Application.query.filter_by(referrer_id=user_id).update({'referrer_id': None}, synchronize_session=False)
            
            # Handle reviews moderated by this user (nullable foreign key)
            Review.query.filter_by(moderated_by=user_id).update({'moderated_by': None}, synchronize_session=False)

            # Remove review votes created by this user
            ReviewVote.query.filter_by(user_id=user_id).delete(synchronize_session=False)

            # Remove reviews created for/by this user, and votes on those reviews
            review_ids = [
                review_id for (review_id,) in db.session.query(Review.id).filter(
                    (Review.reviewer_id == user_id) | (Review.reviewee_id == user_id)
                ).all()
            ]
            if review_ids:
                ReviewVote.query.filter(ReviewVote.review_id.in_(review_ids)).delete(synchronize_session=False)
                Review.query.filter(Review.id.in_(review_ids)).delete(synchronize_session=False)
            
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
            # Delete application activities performed by these users (non-nullable FK)
            ApplicationActivity.query.filter(ApplicationActivity.user_id.in_(user_ids)).delete(synchronize_session=False)

            # Handle referrer_id in Applications (nullable foreign key)
            Application.query.filter(Application.referrer_id.in_(user_ids)).update({'referrer_id': None}, synchronize_session=False)
            
            # Handle reviews moderated by these users (nullable foreign key)
            Review.query.filter(Review.moderated_by.in_(user_ids)).update({'moderated_by': None}, synchronize_session=False)

            # Remove votes cast by users being deleted
            ReviewVote.query.filter(ReviewVote.user_id.in_(user_ids)).delete(synchronize_session=False)

            # Remove reviews authored for/by these users, and votes attached to those reviews
            review_ids = [
                review_id for (review_id,) in db.session.query(Review.id).filter(
                    (Review.reviewer_id.in_(user_ids)) | (Review.reviewee_id.in_(user_ids))
                ).all()
            ]
            if review_ids:
                ReviewVote.query.filter(ReviewVote.review_id.in_(review_ids)).delete(synchronize_session=False)
                Review.query.filter(Review.id.in_(review_ids)).delete(synchronize_session=False)
            
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


# ==================== USER PROFILE ENDPOINTS (for frontend compatibility) ====================

@user_bp.route('/user/profile', methods=['GET'])
@token_required
def get_user_profile(current_user):
    """Get current user profile (frontend compatibility endpoint)"""
    try:
        profile_data = current_user.to_dict(include_sensitive=True)
        
        # Add role-specific profile data
        if current_user.role == 'job_seeker' and current_user.job_seeker_profile:
            profile_data['job_seeker_profile'] = current_user.job_seeker_profile.to_dict()
        elif current_user.role == 'employer' and current_user.employer_profile:
            employer_profile_data = current_user.employer_profile.to_dict()
            # Add company information if available
            if current_user.employer_profile.company_id:
                from src.models.company import Company
                company = Company.query.get(current_user.employer_profile.company_id)
                if company:
                    employer_profile_data['company_name'] = company.name
                    employer_profile_data['company_website'] = company.website
                    employer_profile_data['company_logo'] = company.logo_url
            profile_data['employer_profile'] = employer_profile_data
        
        return jsonify(profile_data), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get profile', 'details': str(e)}), 500


@user_bp.route('/user/profile', methods=['PUT'])
@token_required
def update_user_profile(current_user):
    """Update current user profile (frontend compatibility endpoint)"""
    try:
        data = request.get_json()
        
        # Update basic user information
        if 'first_name' in data:
            current_user.first_name = data['first_name']
        if 'last_name' in data:
            current_user.last_name = data['last_name']
        if 'phone' in data:
            current_user.phone = data['phone']
        if 'location' in data:
            current_user.location = data['location']
        if 'bio' in data:
            current_user.bio = data['bio']
        if 'profile_picture' in data:
            current_user.profile_picture = data['profile_picture']
        
        # Update role-specific profile
        if current_user.role == 'job_seeker':
            profile = current_user.job_seeker_profile
            if not profile:
                profile = JobSeekerProfile(user_id=current_user.id)
                db.session.add(profile)
            
            # Update job seeker specific fields
            profile_fields = [
                'professional_title', 'professional_summary', 'career_level', 'notice_period',
                'resume_url', 'portfolio_url', 'linkedin_url', 'github_url', 'website_url',
                'desired_position', 'desired_salary_min', 'desired_salary_max', 'salary_currency',
                'preferred_location', 'job_type_preference', 'availability',
                'willing_to_relocate', 'willing_to_travel',
                'work_authorization', 'visa_sponsorship_required',
                'years_of_experience', 'education_level',
                'preferred_industries', 'preferred_company_size', 'preferred_work_environment',
                'profile_visibility', 'open_to_opportunities'
            ]
            
            for field in profile_fields:
                if field in data:
                    setattr(profile, field, data[field])
            
            # Handle skills separately (can be string or array)
            if 'skills' in data:
                skills_data = data['skills']
                if isinstance(skills_data, list):
                    profile.skills = json.dumps(skills_data)
                elif isinstance(skills_data, str):
                    profile.skills = skills_data
            
            # Handle technical_skills
            if 'technical_skills' in data:
                tech_skills = data['technical_skills']
                if isinstance(tech_skills, list):
                    profile.technical_skills = json.dumps(tech_skills)
                elif isinstance(tech_skills, str):
                    profile.technical_skills = tech_skills
            
            # Handle soft_skills
            if 'soft_skills' in data:
                soft_skills_data = data['soft_skills']
                if isinstance(soft_skills_data, list):
                    profile.soft_skills = json.dumps(soft_skills_data)
                elif isinstance(soft_skills_data, str):
                    profile.soft_skills = soft_skills_data
            
            # Handle certifications
            if 'certifications' in data:
                certs = data['certifications']
                if isinstance(certs, list):
                    profile.certifications = json.dumps(certs)
                elif isinstance(certs, str):
                    profile.certifications = certs
            
            profile.updated_at = datetime.utcnow()
        
        elif current_user.role == 'employer':
            profile = current_user.employer_profile
            if not profile:
                from src.models.user import EmployerProfile
                profile = EmployerProfile(user_id=current_user.id)
                db.session.add(profile)
            
            # Update employer specific fields
            profile_fields = [
                'company_id', 'job_title', 'department', 'hiring_authority',
                'work_phone', 'work_email'
            ]
            for field in profile_fields:
                if field in data:
                    setattr(profile, field, data[field])
            
            profile.updated_at = datetime.utcnow()
        
        current_user.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Return updated profile
        profile_data = current_user.to_dict(include_sensitive=True)
        if current_user.role == 'job_seeker' and current_user.job_seeker_profile:
            profile_data['job_seeker_profile'] = current_user.job_seeker_profile.to_dict()
        elif current_user.role == 'employer' and current_user.employer_profile:
            profile_data['employer_profile'] = current_user.employer_profile.to_dict()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': profile_data
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update profile', 'details': str(e)}), 500


# ==================== PROFILE ANALYTICS ENDPOINTS ====================

@user_bp.route('/user/profile-views', methods=['GET'])
@token_required
def get_profile_views(current_user):
    """Get user's profile view count (job seeker only)"""
    try:
        if current_user.role != 'job_seeker':
            return jsonify({'error': 'Only job seekers have profile views'}), 403
        
        profile = current_user.job_seeker_profile
        if not profile:
            return jsonify({
                'total_views': 0,
                'profile_views': []
            }), 200
        
        # Get total views (stored in profile if available, otherwise 0)
        total_views = getattr(profile, 'profile_views', 0) or 0
        
        return jsonify({
            'total_views': total_views,
            'profile_views': [],
            'message': 'Profile view tracking initialized'
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get profile views', 'details': str(e), 'total_views': 0}), 500


# ==================== SKILL ANALYSIS ENDPOINTS ====================

@user_bp.route('/skill-analysis/gaps', methods=['GET'])
@token_required
def get_skill_gaps(current_user):
    """Get user's skill gaps based on job applications and market trends"""
    try:
        if current_user.role != 'job_seeker':
            return jsonify({'error': 'Only job seekers can view skill gaps'}), 403
        
        profile = current_user.job_seeker_profile
        if not profile:
            return jsonify({'skill_gaps': []}), 200
        
        # Parse user's current skills
        import json
        user_skills = []
        if profile.technical_skills:
            try:
                user_skills.extend(json.loads(profile.technical_skills) if isinstance(profile.technical_skills, str) else profile.technical_skills)
            except:
                pass
        
        if profile.skills:
            try:
                user_skills.extend(json.loads(profile.skills) if isinstance(profile.skills, str) else profile.skills)
            except:
                pass
        
        # Analyze skills needed in recent job applications
        from src.models.application import Application
        from src.models.job import Job
        
        user_applications = Application.query.filter_by(applicant_id=current_user.id).limit(10).all()
        
        required_skills_count = {}
        for app in user_applications:
            job = Job.query.get(app.job_id)
            if job and job.required_skills:
                try:
                    job_skills = json.loads(job.required_skills) if isinstance(job.required_skills, str) else job.required_skills
                    for skill in job_skills:
                        skill_name = skill.lower() if isinstance(skill, str) else str(skill).lower()
                        if skill_name not in [s.lower() for s in user_skills]:
                            required_skills_count[skill_name] = required_skills_count.get(skill_name, 0) + 1
                except:
                    pass
        
        # Return top skill gaps
        skill_gaps = []
        for skill, count in sorted(required_skills_count.items(), key=lambda x: x[1], reverse=True)[:10]:
            skill_gaps.append({
                'skill_name': skill.title(),
                'market_demand': 'High' if count >= 3 else 'Medium' if count >= 1 else 'Low',
                'your_level': 0,
                'frequency': count
            })
        
        return jsonify({'skill_gaps': skill_gaps}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get skill gaps', 'details': str(e), 'skill_gaps': []}), 500


# ==================== CAREER INSIGHTS ENDPOINTS ====================

@user_bp.route('/career-insights', methods=['GET'])
@token_required
def get_career_insights(current_user):
    """Get career insights based on user profile and job market"""
    try:
        if current_user.role != 'job_seeker':
            return jsonify({'error': 'Only job seekers can view career insights'}), 403
        
        profile = current_user.job_seeker_profile
        if not profile:
            # Return default insights
            return jsonify({
                'avg_salary_increase': 0,
                'market_demand': 'Medium',
                'top_skills_in_demand': [],
                'career_growth_potential': 0,
                'message': 'Complete your profile for personalized insights'
            }), 200
        
        # Calculate insights based on profile and applications
        from src.models.application import Application
        from src.models.job import Job
        
        # Get user's applications to analyze trends
        applications = Application.query.filter_by(applicant_id=current_user.id).all()
        
        # Calculate average desired salary
        avg_salary = 0
        if profile.desired_salary_min and profile.desired_salary_max:
            avg_salary = (profile.desired_salary_min + profile.desired_salary_max) // 2
        
        # Extract skills in demand
        import json
        skills_in_demand = {}
        for app in applications:
            job = Job.query.get(app.job_id)
            if job and job.required_skills:
                try:
                    job_skills = json.loads(job.required_skills) if isinstance(job.required_skills, str) else job.required_skills
                    for skill in job_skills:
                        skill_name = str(skill).title()
                        skills_in_demand[skill_name] = skills_in_demand.get(skill_name, 0) + 1
                except:
                    pass
        
        # Sort by frequency
        top_skills = [skill for skill, _ in sorted(skills_in_demand.items(), key=lambda x: x[1], reverse=True)[:5]]
        
        # Calculate market demand based on number of applications
        market_demand = 'High'
        if len(applications) < 5:
            market_demand = 'Low'
        elif len(applications) < 15:
            market_demand = 'Medium'
        
        # Career growth potential (based on experience and skills)
        growth_potential = 50  # Base score
        if profile.years_of_experience and profile.years_of_experience >= 5:
            growth_potential += 20
        if len(profile.technical_skills or []) >= 5:
            growth_potential += 15
        growth_potential = min(growth_potential, 100)
        
        return jsonify({
            'avg_salary_increase': avg_salary,
            'market_demand': market_demand,
            'top_skills_in_demand': top_skills,
            'career_growth_potential': growth_potential,
            'applications_count': len(applications),
            'years_experience': profile.years_of_experience or 0
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get career insights', 'details': str(e), 'avg_salary_increase': 0, 'market_demand': 'Medium', 'top_skills_in_demand': [], 'career_growth_potential': 0}), 500

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
