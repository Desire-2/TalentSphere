from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from sqlalchemy import or_, and_, desc, func

from src.models.user import db, User
from src.models.job import Job, JobCategory
from src.models.company import Company
from src.models.application import Application
from src.routes.auth import token_required, role_required

employer_bp = Blueprint('employer', __name__)

@employer_bp.route('/employer/dashboard/stats', methods=['GET'])
@token_required
@role_required('employer', 'admin')
def get_employer_dashboard_stats(current_user):
    """Get comprehensive dashboard statistics for employer (cached)"""
    try:
        # Use cached version for better performance
        from src.utils.cache import get_cached_employer_stats
        
        # Get company_id if user is an employer
        company_id = None
        if hasattr(current_user, 'employer_profile') and current_user.employer_profile:
            company_id = current_user.employer_profile.company_id
        
        try:
            stats = get_cached_employer_stats(current_user.id, company_id)
            return jsonify({'stats': stats, 'cached': True}), 200
        except:
            # Fallback to database query
            pass
        
        # Build optimized query for jobs
        if company_id:
            jobs_query = Job.query.filter_by(company_id=company_id)
            jobs = jobs_query.all()
        else:
            jobs_query = Job.query.filter_by(posted_by=current_user.id)
            jobs = jobs_query.all()
        
        if not jobs:
            empty_stats = {
                'total_jobs': 0,
                'active_jobs': 0,
                'draft_jobs': 0,
                'paused_jobs': 0,
                'total_applications': 0,
                'new_applications': 0,
                'shortlisted_applications': 0,
                'interviews_scheduled': 0,
                'hires_made': 0,
                'profile_views': 0,
                'company_followers': 0,
                'recent_activities': [],
                'trends_data': [],
                'performance_data': []
            }
            return jsonify({'stats': empty_stats, 'cached': False}), 200
        
        job_ids = [job.id for job in jobs]
        
        # Job statistics (using COUNT queries for efficiency)
        total_jobs = len(jobs)
        active_jobs = sum(1 for job in jobs if job.status == 'published')
        draft_jobs = sum(1 for job in jobs if job.status == 'draft')
        paused_jobs = sum(1 for job in jobs if job.status == 'paused')
        
        # Application statistics (optimized with single query)
        from sqlalchemy import func
        app_stats = db.session.query(
            func.count(Application.id).label('total'),
            func.sum(func.case((Application.status == 'submitted', 1), else_=0)).label('new'),
            func.sum(func.case((Application.status == 'shortlisted', 1), else_=0)).label('shortlisted'),
            func.sum(func.case((Application.interview_scheduled == True, 1), else_=0)).label('interviews'),
            func.sum(func.case((Application.status == 'hired', 1), else_=0)).label('hires')
        ).filter(Application.job_id.in_(job_ids)).first()
        
        total_applications = app_stats.total or 0
        new_applications = app_stats.new or 0
        shortlisted_applications = app_stats.shortlisted or 0
        interviews_scheduled = app_stats.interviews or 0
        hires_made = app_stats.hires or 0
        
        # Profile views (from company if available)
        profile_views = 0
        if current_user.employer_profile and current_user.employer_profile.company:
            profile_views = current_user.employer_profile.company.profile_views or 0
        
        # Calculate average time to hire (optimized query)
        hired_apps = Application.query.filter(
            Application.job_id.in_(job_ids),
            Application.status == 'hired',
            Application.updated_at.isnot(None),
            Application.created_at.isnot(None)
        ).all()
        
        avg_time_to_hire = 0
        if hired_apps:
            total_days = sum([
                (app.updated_at - app.created_at).days 
                for app in hired_apps
            ])
            avg_time_to_hire = total_days / len(hired_apps)
        
        # Application trends (last 30 days) - optimized
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        daily_stats = db.session.query(
            func.date(Application.created_at).label('date'),
            func.count(Application.id).label('count')
        ).filter(
            Application.job_id.in_(job_ids),
            Application.created_at >= thirty_days_ago
        ).group_by(func.date(Application.created_at)).all()
        
        # Create trends data with all days
        trends_data = []
        daily_stats_dict = {str(stat.date): stat.count for stat in daily_stats}
        
        for i in range(30):
            date = thirty_days_ago + timedelta(days=i)
            date_str = date.strftime('%Y-%m-%d')
            applications_count = daily_stats_dict.get(date_str, 0)
            
            trends_data.append({
                'date': date_str,
                'applications': applications_count
            })
        
        # Job performance metrics (optimized)
        performance_data = []
        for job in jobs[:10]:  # Limit to 10 jobs for performance
            job_app_count = total_applications  # This would need to be calculated per job
            conversion_rate = 0
            if job.view_count and job.view_count > 0:
                job_apps = Application.query.filter_by(job_id=job.id).count()
                conversion_rate = (job_apps / job.view_count) * 100
            
            performance_data.append({
                'job_id': job.id,
                'job_title': job.title,
                'views': job.view_count or 0,
                'applications': Application.query.filter_by(job_id=job.id).count(),
                'conversion_rate': round(conversion_rate, 2),
                'status': job.status,
                'created_at': job.created_at.isoformat()
            })
        
        stats = {
            'total_jobs': total_jobs,
            'active_jobs': active_jobs,
            'draft_jobs': draft_jobs,
            'paused_jobs': paused_jobs,
            'total_applications': total_applications,
            'new_applications': new_applications,
            'shortlisted_applications': shortlisted_applications,
            'interviews_scheduled': interviews_scheduled,
            'hires_made': hires_made,
            'profile_views': profile_views,
            'avg_time_to_hire': round(avg_time_to_hire, 1),
            'application_trends': trends_data,
            'job_performance': performance_data
        }
        
        return jsonify({'stats': stats, 'cached': False}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get dashboard stats', 'details': str(e)}), 500

@employer_bp.route('/employer/applications', methods=['GET'])
@token_required
@role_required('employer', 'admin')
def get_employer_applications(current_user):
    """Get all applications for jobs posted by the current employer with enhanced filtering"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        status = request.args.get('status')
        job_id = request.args.get('job_id', type=int)
        search = request.args.get('search')
        date_range = request.args.get('date_range')
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        # Base query - get applications for jobs posted by current user
        if current_user.role == 'employer':
            query = db.session.query(Application).join(Job).filter(
                Job.posted_by == current_user.id
            )
        else:
            # Admin can see all applications
            query = db.session.query(Application).join(Job)
        
        # Apply filters
        if status and status != 'all':
            query = query.filter(Application.status == status)
        
        if job_id:
            query = query.filter(Application.job_id == job_id)
        
        if search:
            # Join with user table to search applicant names
            query = query.join(User, Application.applicant_id == User.id).filter(
                or_(
                    User.first_name.ilike(f'%{search}%'),
                    User.last_name.ilike(f'%{search}%'),
                    User.email.ilike(f'%{search}%'),
                    Job.title.ilike(f'%{search}%')
                )
            )
        
        if date_range and date_range != 'all':
            days = {'7': 7, '30': 30, '90': 90}.get(date_range, 30)
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            query = query.filter(Application.created_at >= cutoff_date)
        
        # Apply sorting
        if sort_by == 'created_at':
            order_col = Application.created_at
        elif sort_by == 'status':
            order_col = Application.status
        elif sort_by == 'job_title':
            order_col = Job.title
        elif sort_by == 'applicant_name':
            query = query.join(User, Application.applicant_id == User.id)
            order_col = User.first_name
        else:
            order_col = Application.created_at
        
        if sort_order == 'desc':
            query = query.order_by(desc(order_col))
        else:
            query = query.order_by(order_col)
        
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
        if current_user.role == 'employer':
            total_applications = db.session.query(Application).join(Job).filter(
                Job.posted_by == current_user.id
            ).count()
            
            new_applications = db.session.query(Application).join(Job).filter(
                Job.posted_by == current_user.id,
                Application.status == 'submitted'
            ).count()
        else:
            total_applications = Application.query.count()
            new_applications = Application.query.filter_by(status='submitted').count()
        
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

@employer_bp.route('/employer/applications/bulk-action', methods=['POST'])
@token_required
@role_required('employer', 'admin')
def bulk_application_action(current_user):
    """Perform bulk actions on applications"""
    try:
        data = request.get_json()
        
        if not data.get('application_ids') or not data.get('action'):
            return jsonify({'error': 'application_ids and action are required'}), 400
        
        application_ids = data['application_ids']
        action = data['action']
        
        if action not in ['shortlist', 'reject', 'mark_reviewed', 'schedule_interview']:
            return jsonify({'error': 'Invalid action'}), 400
        
        # Get applications and verify permissions
        applications = Application.query.filter(Application.id.in_(application_ids)).all()
        
        if not applications:
            return jsonify({'error': 'No applications found'}), 404
        
        # Check permissions for each application
        for application in applications:
            if (current_user.role == 'employer' and 
                application.job.posted_by != current_user.id):
                return jsonify({'error': f'You can only modify applications for your own jobs'}), 403
        
        # Perform bulk action
        updated_count = 0
        
        for application in applications:
            if action == 'shortlist':
                if application.status == 'submitted':
                    application.status = 'shortlisted'
                    updated_count += 1
            
            elif action == 'reject':
                if application.status not in ['hired', 'withdrawn']:
                    application.status = 'rejected'
                    updated_count += 1
            
            elif action == 'mark_reviewed':
                if application.status == 'submitted':
                    application.status = 'under_review'
                    updated_count += 1
            
            application.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully {action}ed {updated_count} applications',
            'updated_count': updated_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to perform bulk action', 'details': str(e)}), 500

@employer_bp.route('/employer/top-candidates', methods=['GET'])
@token_required
@role_required('employer', 'admin')
def get_top_candidates(current_user):
    """Get top candidates based on application scores and profiles"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        job_id = request.args.get('job_id', type=int)
        skills = request.args.get('skills')  # comma-separated
        experience_level = request.args.get('experience_level')
        location = request.args.get('location')
        
        # Base query for applications to employer's jobs
        if current_user.role == 'employer':
            query = db.session.query(Application).join(Job).filter(
                Job.posted_by == current_user.id,
                Application.status.in_(['submitted', 'under_review', 'shortlisted'])
            )
        else:
            query = db.session.query(Application).join(Job).filter(
                Application.status.in_(['submitted', 'under_review', 'shortlisted'])
            )
        
        # Apply filters
        if job_id:
            query = query.filter(Application.job_id == job_id)
        
        if skills:
            skill_list = [skill.strip() for skill in skills.split(',')]
            # This would require a more sophisticated search in a real implementation
            # For now, we'll filter by applicants who have job seeker profiles
            query = query.join(User).filter(User.id == Application.applicant_id)
        
        # Order by rating and creation date (temporary fix for missing match_score column)
        query = query.order_by(
            desc(Application.rating),
            desc(Application.created_at)
        )
        
        # Paginate
        applications = query.paginate(page=page, per_page=per_page, error_out=False)
        
        # Format candidates data
        candidates = []
        for application in applications.items:
            candidate_data = {
                'id': application.applicant.id,
                'application_id': application.id,
                'name': application.applicant.get_full_name(),
                'email': application.applicant.email,
                'job_title': application.job.title,
                'job_id': application.job_id,
                'status': application.status,
                'rating': application.rating or 0,
                'match_score': getattr(application, 'match_score', 0) or 0,  # Temporary fallback
                'applied_at': application.created_at.isoformat(),
                'resume_url': application.resume_url,
                'cover_letter': application.cover_letter,
                'profile': None
            }
            
            # Add job seeker profile information
            if application.applicant.job_seeker_profile:
                profile = application.applicant.job_seeker_profile
                candidate_data['profile'] = {
                    'title': profile.desired_position,
                    'experience_level': 'mid' if profile.years_of_experience >= 3 else 'entry' if profile.years_of_experience >= 1 else 'entry',
                    'skills': profile.skills.split(',') if profile.skills else [],
                    'location': profile.preferred_location,
                    'summary': None,  # Not available in current model
                    'years_experience': profile.years_of_experience
                }
            
            candidates.append(candidate_data)
        
        return jsonify({
            'candidates': candidates,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': applications.total,
                'pages': applications.pages,
                'has_next': applications.has_next,
                'has_prev': applications.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get top candidates', 'details': str(e)}), 500

@employer_bp.route('/employer/candidate-search', methods=['GET'])
@token_required
@role_required('employer', 'admin')
def search_candidates(current_user):
    """Search for candidates based on various criteria"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        search = request.args.get('search')
        skills = request.args.get('skills')
        experience_level = request.args.get('experience_level')
        location = request.args.get('location')
        availability = request.args.get('availability')
        
        # Start with users who have job seeker profiles
        from src.models.user import JobSeekerProfile
        query = db.session.query(User).join(JobSeekerProfile).filter(
            User.role == 'job_seeker',
            User.is_active == True,
            JobSeekerProfile.profile_visibility.in_(['public', 'employers_only'])  # Only show public profiles
        )
        
        # Apply search filters
        if search:
            query = query.filter(
                or_(
                    User.first_name.ilike(f'%{search}%'),
                    User.last_name.ilike(f'%{search}%'),
                    JobSeekerProfile.desired_position.ilike(f'%{search}%'),
                    JobSeekerProfile.skills.ilike(f'%{search}%')
                )
            )
        
        if skills:
            skill_terms = [skill.strip() for skill in skills.split(',')]
            skill_filters = [JobSeekerProfile.skills.ilike(f'%{skill}%') for skill in skill_terms]
            query = query.filter(or_(*skill_filters))
        
        if experience_level:
            # Map experience level to years of experience
            if experience_level == 'entry':
                query = query.filter(JobSeekerProfile.years_of_experience <= 2)
            elif experience_level == 'mid':
                query = query.filter(JobSeekerProfile.years_of_experience.between(3, 7))
            elif experience_level == 'senior':
                query = query.filter(JobSeekerProfile.years_of_experience >= 8)
        
        if location:
            query = query.filter(JobSeekerProfile.preferred_location.ilike(f'%{location}%'))
        
        if availability:
            query = query.filter(JobSeekerProfile.availability == availability)
        
        # Order by profile completeness and last activity
        query = query.order_by(
            desc(JobSeekerProfile.updated_at),
            desc(User.last_login)
        )
        
        # Paginate
        candidates = query.paginate(page=page, per_page=per_page, error_out=False)
        
        # Format response
        candidate_list = []
        for user in candidates.items:
            profile = user.job_seeker_profile
            candidate_data = {
                'id': user.id,
                'name': user.get_full_name(),
                'email': user.email,
                'profile_picture': user.profile_picture,
                'title': profile.desired_position,
                'experience_level': 'senior' if profile.years_of_experience >= 8 else 'mid' if profile.years_of_experience >= 3 else 'entry',
                'years_experience': profile.years_of_experience,
                'location': profile.preferred_location,
                'skills': profile.skills.split(',') if profile.skills else [],
                'summary': None,  # Not available in current model
                'availability_status': profile.availability,
                'expected_salary_min': profile.desired_salary_min,
                'expected_salary_max': profile.desired_salary_max,
                'last_active': user.last_login.isoformat() if user.last_login else None,
                'profile_updated': profile.updated_at.isoformat()
            }
            candidate_list.append(candidate_data)
        
        return jsonify({
            'candidates': candidate_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': candidates.total,
                'pages': candidates.pages,
                'has_next': candidates.has_next,
                'has_prev': candidates.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to search candidates', 'details': str(e)}), 500

# Error handlers
@employer_bp.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400

@employer_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({'error': 'Unauthorized'}), 401

@employer_bp.errorhandler(403)
def forbidden(error):
    return jsonify({'error': 'Forbidden'}), 403

@employer_bp.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@employer_bp.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500
