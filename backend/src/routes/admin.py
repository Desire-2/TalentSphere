from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from sqlalchemy import func, desc, asc, and_, or_
from sqlalchemy.orm import joinedload, selectinload
from decimal import Decimal

from src.models.user import db, User, JobSeekerProfile, EmployerProfile
from src.models.company import Company
from src.models.job import Job, JobCategory
from src.models.application import Application
from src.models.featured_ad import FeaturedAd, Payment
from src.models.notification import Review
from src.routes.auth import token_required, role_required
from src.services.job_scheduler import job_scheduler

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/admin/dashboard', methods=['GET'])
@token_required
@role_required('admin')
def get_admin_dashboard(current_user):
    """Get admin dashboard overview"""
    try:
        # Date range for analytics
        days = request.args.get('days', 30, type=int)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # User statistics
        total_users = User.query.count()
        new_users = User.query.filter(User.created_at >= start_date).count()
        active_users = User.query.filter(User.last_login >= start_date).count()
        job_seekers = User.query.filter_by(role='job_seeker').count()
        employers = User.query.filter_by(role='employer').count()
        
        # Job statistics
        total_jobs = Job.query.count()
        active_jobs = Job.query.filter_by(status='published', is_active=True).count()
        new_jobs = Job.query.filter(Job.created_at >= start_date).count()
        featured_jobs = Job.query.filter_by(is_featured=True, is_active=True).count()
        
        # Application statistics
        total_applications = Application.query.count()
        new_applications = Application.query.filter(Application.created_at >= start_date).count()
        pending_applications = Application.query.filter_by(status='submitted').count()
        
        # Company statistics
        total_companies = Company.query.count()
        verified_companies = Company.query.filter_by(is_verified=True).count()
        new_companies = Company.query.filter(Company.created_at >= start_date).count()
        
        # Revenue statistics
        total_revenue = db.session.query(func.sum(Payment.amount)).filter(
            Payment.status == 'completed'
        ).scalar() or 0
        
        period_revenue = db.session.query(func.sum(Payment.amount)).filter(
            and_(Payment.status == 'completed', Payment.created_at >= start_date)
        ).scalar() or 0
        
        # Featured ads statistics
        active_featured_ads = FeaturedAd.query.filter_by(status='active').count()
        total_featured_ads = FeaturedAd.query.count()
        
        # Recent activity
        recent_users = User.query.order_by(desc(User.created_at)).limit(5).all()
        recent_jobs = Job.query.order_by(desc(Job.created_at)).limit(5).all()
        recent_payments = Payment.query.filter_by(status='completed').order_by(
            desc(Payment.created_at)
        ).limit(5).all()
        
        admins = total_users - job_seekers - employers
        external_admins = User.query.filter_by(role='external_admin').count()
        regular_admins = User.query.filter_by(role='admin').count()
        
        dashboard_data = {
            'overview': {
                'total_users': total_users,
                'new_users': new_users,
                'active_users': active_users,
                'total_jobs': total_jobs,
                'active_jobs': active_jobs,
                'total_applications': total_applications,
                'total_companies': total_companies,
                'total_revenue': float(total_revenue),
                'period_revenue': float(period_revenue)
            },
            'user_breakdown': {
                'job_seekers': job_seekers,
                'employers': employers,
                'admins': regular_admins,
                'external_admins': external_admins,
                'total_admin_users': regular_admins + external_admins
            },
            'job_metrics': {
                'total_jobs': total_jobs,
                'active_jobs': active_jobs,
                'new_jobs': new_jobs,
                'featured_jobs': featured_jobs,
                'draft_jobs': Job.query.filter_by(status='draft').count(),
                'closed_jobs': Job.query.filter_by(status='closed').count(),
                'external_jobs': Job.query.filter_by(job_source='external').count(),
                'internal_jobs': Job.query.filter_by(job_source='internal').count()
            },
            'application_metrics': {
                'total_applications': total_applications,
                'new_applications': new_applications,
                'pending_applications': pending_applications,
                'under_review': Application.query.filter_by(status='under_review').count(),
                'hired': Application.query.filter_by(status='hired').count(),
                'rejected': Application.query.filter_by(status='rejected').count()
            },
            'company_metrics': {
                'total_companies': total_companies,
                'verified_companies': verified_companies,
                'new_companies': new_companies,
                'featured_companies': Company.query.filter_by(is_featured=True).count()
            },
            'revenue_metrics': {
                'total_revenue': float(total_revenue),
                'period_revenue': float(period_revenue),
                'active_featured_ads': active_featured_ads,
                'total_featured_ads': total_featured_ads,
                'pending_payments': Payment.query.filter_by(status='pending').count()
            },
            'recent_activity': {
                'users': [user.to_dict() for user in recent_users],
                'jobs': [job.to_dict() for job in recent_jobs],
                'payments': [payment.to_dict() for payment in recent_payments]
            }
        }
        
        return jsonify(dashboard_data), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get dashboard data', 'details': str(e)}), 500

@admin_bp.route('/admin/users', methods=['GET'])
@token_required
@role_required('admin')
def get_users(current_user):
    """Get users with filtering and pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 50, type=int), 100)
        
        # Filtering parameters
        role = request.args.get('role')
        is_active = request.args.get('is_active', type=bool)
        is_verified = request.args.get('is_verified', type=bool)
        search = request.args.get('search')
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        # Build query
        query = User.query
        
        if role:
            query = query.filter_by(role=role)
        if is_active is not None:
            query = query.filter_by(is_active=is_active)
        if is_verified is not None:
            query = query.filter_by(is_verified=is_verified)
        if search:
            search_filter = or_(
                User.first_name.ilike(f'%{search}%'),
                User.last_name.ilike(f'%{search}%'),
                User.email.ilike(f'%{search}%')
            )
            query = query.filter(search_filter)
        
        # Apply sorting
        if sort_by == 'name':
            order_col = User.first_name
        elif sort_by == 'email':
            order_col = User.email
        elif sort_by == 'last_login':
            order_col = User.last_login
        else:
            order_col = User.created_at
        
        if sort_order == 'desc':
            query = query.order_by(desc(order_col))
        else:
            query = query.order_by(asc(order_col))
        
        # Paginate
        users = query.paginate(page=page, per_page=per_page, error_out=False)
        
        user_list = []
        for user in users.items:
            user_data = user.to_dict(include_sensitive=True)
            
            # Add role-specific data
            if user.role == 'job_seeker' and user.job_seeker_profile:
                user_data['profile'] = user.job_seeker_profile.to_dict()
            elif user.role == 'employer' and user.employer_profile:
                user_data['profile'] = user.employer_profile.to_dict()
            
            # Add statistics
            if user.role == 'job_seeker':
                applications_count = 0
                bookmarks_count = 0
                try:
                    if hasattr(user, 'applications'):
                        applications_count = len(user.applications) if user.applications else 0
                    if hasattr(user, 'job_bookmarks'):
                        bookmarks_count = len(user.job_bookmarks) if user.job_bookmarks else 0
                except:
                    pass  # Use default values if there are issues
                
                user_data['stats'] = {
                    'applications_count': applications_count,
                    'bookmarks_count': bookmarks_count
                }
            elif user.role == 'employer':
                jobs_posted = 0
                applications_received = 0
                try:
                    if hasattr(user, 'posted_jobs'):
                        jobs_posted = len(user.posted_jobs) if user.posted_jobs else 0
                        applications_received = sum(getattr(job, 'application_count', 0) for job in user.posted_jobs)
                except:
                    pass  # Use default values if there are issues
                
                user_data['stats'] = {
                    'jobs_posted': jobs_posted,
                    'applications_received': applications_received
                }
            
            user_list.append(user_data)
        
        return jsonify({
            'users': user_list,
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

@admin_bp.route('/admin/users/<int:user_id>/toggle-status', methods=['POST'])
@token_required
@role_required('admin')
def toggle_user_status(current_user, user_id):
    """Toggle user active status"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.role in ['admin', 'external_admin']:
            return jsonify({'error': 'Cannot modify admin users'}), 403
        
        user.is_active = not user.is_active
        user.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': f'User {"activated" if user.is_active else "deactivated"} successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to toggle user status', 'details': str(e)}), 500

@admin_bp.route('/admin/users/<int:user_id>/change-role', methods=['POST'])
@token_required
@role_required('admin')
def change_user_role(current_user, user_id):
    """Change user role"""
    try:
        data = request.get_json()
        new_role = data.get('new_role')
        
        # Validate the new role
        valid_roles = ['job_seeker', 'employer', 'admin', 'external_admin']
        if new_role not in valid_roles:
            return jsonify({'error': 'Invalid role specified'}), 400
        
        # Get the user to be modified
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Prevent changing your own role
        if user.id == current_user.id:
            return jsonify({'error': 'Cannot change your own role'}), 403
        
        # Prevent modifying super admin (if there's a specific super admin)
        if user.role == 'admin' and user.email == 'bikorimanadesire@yahoo.com':
            return jsonify({'error': 'Cannot modify super admin role'}), 403
        
        # Store old role for logging
        old_role = user.role
        
        # Update the user's role
        user.role = new_role
        user.updated_at = datetime.utcnow()
        
        # If changing to/from employer, handle employer profile
        if new_role == 'employer' and old_role != 'employer':
            # Create employer profile if it doesn't exist
            if not user.employer_profile:
                from src.models.user import EmployerProfile
                employer_profile = EmployerProfile(user_id=user.id)
                db.session.add(employer_profile)
        
        # If changing to/from job_seeker, handle job seeker profile
        if new_role == 'job_seeker' and old_role != 'job_seeker':
            # Create job seeker profile if it doesn't exist
            if not user.job_seeker_profile:
                from src.models.user import JobSeekerProfile
                job_seeker_profile = JobSeekerProfile(user_id=user.id)
                db.session.add(job_seeker_profile)
        
        db.session.commit()
        
        # Log the role change (you might want to create an audit log table)
        print(f"Admin {current_user.email} changed user {user.email} role from {old_role} to {new_role}")
        
        return jsonify({
            'message': f'User role changed from {old_role} to {new_role} successfully',
            'user': user.to_dict(),
            'old_role': old_role,
            'new_role': new_role
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to change user role', 'details': str(e)}), 500

@admin_bp.route('/admin/jobs', methods=['GET'])
@token_required
@role_required('admin')
def get_jobs_admin(current_user):
    """Get jobs for admin management"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 50, type=int), 100)
        
        # Filtering parameters
        status = request.args.get('status')
        is_featured = request.args.get('is_featured', type=bool)
        category_id = request.args.get('category_id', type=int)
        search = request.args.get('search')
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        # Build query with eager loading to avoid N+1 queries
        query = Job.query.options(
            joinedload(Job.company),
            joinedload(Job.category),
            joinedload(Job.poster)
        )
        
        if status:
            query = query.filter_by(status=status)
        if is_featured is not None:
            query = query.filter_by(is_featured=is_featured)
        if category_id:
            query = query.filter_by(category_id=category_id)
        if search:
            search_filter = or_(
                Job.title.ilike(f'%{search}%'),
                Job.description.ilike(f'%{search}%')
            )
            query = query.filter(search_filter)
        
        # Apply sorting
        if sort_by == 'title':
            order_col = Job.title
        elif sort_by == 'company':
            query = query.join(Company)
            order_col = Company.name
        elif sort_by == 'applications':
            order_col = Job.application_count
        elif sort_by == 'views':
            order_col = Job.view_count
        else:
            order_col = Job.created_at
        
        if sort_order == 'desc':
            query = query.order_by(desc(order_col))
        else:
            query = query.order_by(asc(order_col))
        
        # Paginate
        jobs = query.paginate(page=page, per_page=per_page, error_out=False)
        
        # Build lightweight response without redundant nested calls
        job_list = []
        for job in jobs.items:
            job_data = job.to_dict(include_details=True, include_stats=True)
            # Use pre-loaded relationships (already loaded via joinedload)
            if job.company:
                job_data['company'] = {'id': job.company.id, 'name': job.company.name, 'is_verified': job.company.is_verified}
            if job.category:
                job_data['category'] = {'id': job.category.id, 'name': job.category.name}
            if job.poster:
                job_data['poster'] = {'id': job.poster.id, 'email': job.poster.email, 'role': job.poster.role}
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

@admin_bp.route('/admin/jobs/<int:job_id>/moderate', methods=['POST'])
@token_required
@role_required('admin')
def moderate_job(current_user, job_id):
    """Moderate a job posting"""
    try:
        job = Job.query.get(job_id)
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        data = request.get_json()
        action = data.get('action')  # approve, reject, feature, unfeature, suspend, reactivate, delete
        reason = data.get('reason', '')
        notes = data.get('notes', '')
        
        old_status = job.status
        old_featured = job.is_featured
        old_active = job.is_active
        
        if action == 'approve':
            job.status = 'published'
            job.published_at = datetime.utcnow()
            job.is_active = True
        elif action == 'reject':
            job.status = 'closed'
            job.is_active = False
        elif action == 'feature':
            job.is_featured = True
        elif action == 'unfeature':
            job.is_featured = False
        elif action == 'suspend':
            job.is_active = False
            job.status = 'suspended'
        elif action == 'reactivate':
            job.is_active = True
            job.status = 'published' if job.status == 'suspended' else job.status
        elif action == 'urgent':
            job.is_urgent = True
        elif action == 'remove_urgent':
            job.is_urgent = False
        elif action == 'delete':
            # Hard delete: remove from database
            deletion_log = {
                'admin_id': current_user.id,
                'admin_email': current_user.email,
                'job_id': job_id,
                'job_title': job.title,
                'action': 'delete',
                'timestamp': datetime.utcnow().isoformat()
            }
            print(f"🗑️ JOB DELETION (via moderate): {deletion_log}")
            
            # Delete the job (cascades will handle related records)
            db.session.delete(job)
            db.session.commit()
            
            return jsonify({
                'message': 'Job deleted successfully',
                'deletion_log': deletion_log
            }), 200
        else:
            return jsonify({'error': 'Invalid action'}), 400
        
        job.updated_at = datetime.utcnow()
        
        # Log the moderation action (in a real app, you'd store this in a moderation_log table)
        moderation_log = {
            'admin_id': current_user.id,
            'admin_email': current_user.email,
            'job_id': job_id,
            'action': action,
            'reason': reason,
            'notes': notes,
            'old_status': old_status,
            'new_status': job.status,
            'old_featured': old_featured,
            'new_featured': job.is_featured,
            'old_active': old_active,
            'new_active': job.is_active,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        print(f"📋 MODERATION LOG: {moderation_log}")
        
        db.session.commit()
        
        return jsonify({
            'message': f'Job {action}d successfully',
            'job': job.to_dict(include_details=True, include_stats=True),
            'moderation_log': moderation_log
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to moderate job', 'details': str(e)}), 500

@admin_bp.route('/admin/jobs/<int:job_id>', methods=['DELETE'])
@token_required
@role_required('admin')
def delete_job_admin(current_user, job_id):
    """Delete a job posting (admin) - Hard delete from database"""
    try:
        job = Job.query.get(job_id)
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        # Log the deletion before removing
        deletion_log = {
            'admin_id': current_user.id,
            'admin_email': current_user.email,
            'job_id': job_id,
            'job_title': job.title,
            'company_id': job.company_id,
            'posted_by': job.posted_by,
            'action': 'delete',
            'timestamp': datetime.utcnow().isoformat()
        }
        
        print(f"🗑️ JOB DELETION LOG (DELETE endpoint): {deletion_log}")
        
        # Hard delete: remove from database (cascades handle related records)
        db.session.delete(job)
        db.session.commit()
        
        return jsonify({
            'message': 'Job deleted successfully',
            'deletion_log': deletion_log
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ JOB DELETION ERROR: {str(e)}")
        return jsonify({'error': 'Failed to delete job', 'details': str(e)}), 500

@admin_bp.route('/admin/jobs/bulk-action', methods=['POST'])
@token_required
@role_required('admin')
def bulk_job_action(current_user):
    """Perform bulk actions on jobs"""
    try:
        job_ids = request.json.get('job_ids', [])
        action = request.json.get('action', '')
        reason = request.json.get('reason', '')
        
        if not job_ids or not action:
            return jsonify({'error': 'Job IDs and action are required'}), 400
        
        jobs = Job.query.filter(Job.id.in_(job_ids)).all()
        if len(jobs) != len(job_ids):
            return jsonify({'error': 'Some jobs not found'}), 404
        
        updated_jobs = []
        deleted_job_ids = []  # Track deleted jobs separately
        
        for job in jobs:
            old_status = job.status
            
            if action == 'approve':
                if job.status == 'pending':
                    job.status = 'published'
                    job.published_at = datetime.utcnow()
                    job.is_active = True
                    updated_jobs.append(job)
            
            elif action == 'reject':
                if job.status in ['pending', 'published']:
                    job.status = 'closed'
                    job.is_active = False
                    updated_jobs.append(job)
            
            elif action == 'feature':
                job.is_featured = True
                updated_jobs.append(job)
            
            elif action == 'unfeature':
                job.is_featured = False
                updated_jobs.append(job)
            
            elif action == 'suspend':
                job.is_active = False
                job.status = 'suspended'
                updated_jobs.append(job)
            
            elif action == 'reactivate':
                job.is_active = True
                job.status = 'published' if job.status == 'suspended' else job.status
                updated_jobs.append(job)
            
            elif action == 'urgent':
                job.is_urgent = True
                updated_jobs.append(job)
            
            elif action == 'remove_urgent':
                job.is_urgent = False
                updated_jobs.append(job)
            
            elif action == 'delete':
                # Hard delete (remove from database)
                deleted_job_ids.append(job.id)
                db.session.delete(job)
                # Don't append to updated_jobs since it's deleted
            
            # Only update timestamp for jobs that weren't deleted
            if job in updated_jobs:
                job.updated_at = datetime.utcnow()
        
        # Check if any jobs were affected
        total_affected = len(updated_jobs) + len(deleted_job_ids)
        if total_affected == 0:
            return jsonify({'error': f'No jobs were updated with action: {action}'}), 400
        
        # Log bulk action
        bulk_log = {
            'admin_id': current_user.id,
            'admin_email': current_user.email,
            'action': action,
            'reason': reason,
            'job_ids': job_ids,
            'affected_count': total_affected,
            'deleted_count': len(deleted_job_ids),
            'updated_count': len(updated_jobs),
            'timestamp': datetime.utcnow().isoformat()
        }
        
        print(f"📋 BULK ACTION LOG: {bulk_log}")
        
        db.session.commit()
        
        # Build response based on action type
        response_data = {
            'message': f'Bulk {action} completed successfully',
            'affected_jobs': total_affected,
            'bulk_log': bulk_log
        }
        
        # Only include job data for non-delete actions
        if action != 'delete':
            response_data['jobs'] = [job.to_dict(include_details=True) for job in updated_jobs]
        else:
            response_data['deleted_job_ids'] = deleted_job_ids
        
        return jsonify(response_data), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to perform bulk action', 'details': str(e)}), 500

@admin_bp.route('/admin/jobs/<int:job_id>/analytics', methods=['GET'])
@token_required
@role_required('admin')
def get_job_analytics(current_user, job_id):
    """Get detailed analytics for a specific job"""
    try:
        job = Job.query.get(job_id)
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        # Get application analytics
        applications = Application.query.filter_by(job_id=job_id).all()
        
        # Application status breakdown
        status_breakdown = {}
        for app in applications:
            status = app.status
            status_breakdown[status] = status_breakdown.get(status, 0) + 1
        
        # Applications over time (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        daily_applications = db.session.query(
            func.date(Application.created_at).label('date'),
            func.count(Application.id).label('count')
        ).filter(
            and_(
                Application.job_id == job_id,
                Application.created_at >= thirty_days_ago
            )
        ).group_by(func.date(Application.created_at)).all()
        
        # Calculate conversion rates
        total_applications = len(applications)
        total_views = job.view_count or 0
        conversion_rate = (total_applications / total_views * 100) if total_views > 0 else 0
        
        # Top applicant sources (if you track referral sources)
        # This would need additional tracking in your application model
        
        analytics = {
            'job': job.to_dict(include_details=True, include_stats=True),
            'application_analytics': {
                'total_applications': total_applications,
                'status_breakdown': status_breakdown,
                'daily_applications': [
                    {'date': str(date), 'count': count}
                    for date, count in daily_applications
                ],
                'conversion_rate': round(conversion_rate, 2)
            },
            'performance_metrics': {
                'views': total_views,
                'applications': total_applications,
                'conversion_rate': round(conversion_rate, 2),
                'days_since_posted': (datetime.utcnow() - job.created_at).days,
                'is_trending': conversion_rate > 5.0,  # Example threshold
                'bookmark_rate': (job.bookmark_count / total_views * 100) if total_views > 0 else 0
            }
        }
        
        return jsonify(analytics), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get job analytics', 'details': str(e)}), 500

@admin_bp.route('/admin/jobs/stats', methods=['GET'])
@token_required
@role_required('admin')
def get_jobs_stats(current_user):
    """Get comprehensive job statistics - optimized with aggregation"""
    try:
        # Get time range
        days = request.args.get('days', 30, type=int)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Use subqueries and optimized aggregations
        # Job status distribution
        status_distribution = db.session.query(
            Job.status,
            func.count(Job.id).label('count')
        ).group_by(Job.status).all()
        
        # Jobs by category - optimized
        jobs_by_category = db.session.query(
            JobCategory.name,
            func.count(Job.id).label('count')
        ).join(Job).group_by(JobCategory.id, JobCategory.name).limit(20).all()
        
        # Jobs over time - limited to requested period
        daily_job_posts = db.session.query(
            func.date(Job.created_at).label('date'),
            func.count(Job.id).label('count')
        ).filter(
            Job.created_at >= start_date
        ).group_by(func.date(Job.created_at)).all()
        
        # Top performing jobs - limited to 5 for faster response
        top_jobs = db.session.query(
            Job.id,
            Job.title,
            Company.name.label('company_name'),
            func.count(Application.id).label('application_count')
        ).select_from(Job).join(Company).outerjoin(Application).group_by(
            Job.id, Job.title, Company.name
        ).order_by(desc(func.count(Application.id))).limit(5).all()
        
        # Quick counts without additional joins
        total_jobs = db.session.query(func.count(Job.id)).scalar() or 0
        active_jobs = db.session.query(func.count(Job.id)).filter(Job.is_active == True).scalar() or 0
        featured_jobs = db.session.query(func.count(Job.id)).filter(Job.is_featured == True).scalar() or 0
        pending_jobs = db.session.query(func.count(Job.id)).filter(Job.status == 'pending').scalar() or 0
        new_jobs_period = db.session.query(func.count(Job.id)).filter(Job.created_at >= start_date).scalar() or 0
        
        stats = {
            'overview': {
                'total_jobs': total_jobs,
                'active_jobs': active_jobs,
                'featured_jobs': featured_jobs,
                'pending_jobs': pending_jobs,
                'new_jobs_period': new_jobs_period
            },
            'distributions': {
                'status': [{'status': status, 'count': count} for status, count in status_distribution],
                'category': [{'category': name, 'count': count} for name, count in jobs_by_category]
            },
            'trends': {
                'daily_posts': [{'date': str(date), 'count': count} for date, count in daily_job_posts]
            },
            'performance': {
                'top_jobs': [
                    {
                        'id': job_id,
                        'title': title,
                        'company': company_name,
                        'applications': application_count
                    }
                    for job_id, title, company_name, application_count in top_jobs
                ]
            }
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get job statistics', 'details': str(e)}), 500

@admin_bp.route('/admin/companies', methods=['GET'])
@token_required
@role_required('admin')
def get_companies_admin(current_user):
    """Get companies for admin management"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 50, type=int), 100)
        
        # Filtering parameters
        is_verified = request.args.get('is_verified')
        is_featured = request.args.get('is_featured')
        is_active = request.args.get('is_active')
        industry = request.args.get('industry')
        company_size = request.args.get('company_size')
        search = request.args.get('search')
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        # Build query
        query = Company.query
        
        # Apply filters (convert string 'true'/'false' to boolean)
        if is_verified and is_verified != 'all':
            query = query.filter_by(is_verified=(is_verified.lower() == 'true'))
        if is_featured and is_featured != 'all':
            query = query.filter_by(is_featured=(is_featured.lower() == 'true'))
        if is_active and is_active != 'all':
            query = query.filter_by(is_active=(is_active.lower() == 'true'))
        if industry and industry != 'all':
            query = query.filter_by(industry=industry)
        if company_size and company_size != 'all':
            query = query.filter_by(company_size=company_size)
        if search:
            search_filter = or_(
                Company.name.ilike(f'%{search}%'),
                Company.description.ilike(f'%{search}%'),
                Company.industry.ilike(f'%{search}%'),
                Company.city.ilike(f'%{search}%'),
                Company.country.ilike(f'%{search}%')
            )
            query = query.filter(search_filter)
        
        # Apply sorting
        if sort_by == 'name':
            order_col = Company.name
        elif sort_by == 'industry':
            order_col = Company.industry
        elif sort_by == 'company_size':
            order_col = Company.company_size
        elif sort_by == 'created_at':
            order_col = Company.created_at
        else:
            order_col = Company.created_at
        
        if sort_order == 'desc':
            query = query.order_by(desc(order_col))
        else:
            query = query.order_by(asc(order_col))
        
        # Paginate
        companies = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        company_list = []
        for company in companies.items:
            company_data = company.to_dict(include_stats=True)
            company_list.append(company_data)
        
        return jsonify({
            'companies': company_list,
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

@admin_bp.route('/admin/companies/<int:company_id>/verify', methods=['POST'])
@token_required
@role_required('admin')
def verify_company(current_user, company_id):
    """Verify a company"""
    try:
        company = Company.query.get(company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        company.is_verified = True
        company.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Company verified successfully',
            'company': company.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to verify company', 'details': str(e)}), 500

@admin_bp.route('/admin/companies/<int:company_id>/reject', methods=['POST'])
@token_required
@role_required('admin')
def reject_company_verification(current_user, company_id):
    """Reject company verification"""
    try:
        company = Company.query.get(company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        notes = request.json.get('notes', '')
        
        company.is_verified = False
        company.updated_at = datetime.utcnow()
        
        # In a real app, you might store rejection reasons/notes
        # For now, we'll just update the verification status
        
        db.session.commit()
        
        return jsonify({
            'message': 'Company verification rejected',
            'company': company.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to reject company verification', 'details': str(e)}), 500

@admin_bp.route('/admin/companies/<int:company_id>/toggle-featured', methods=['POST'])
@token_required
@role_required('admin')
def toggle_company_featured(current_user, company_id):
    """Toggle company featured status"""
    try:
        company = Company.query.get(company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        company.is_featured = not company.is_featured
        company.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': f'Company {"featured" if company.is_featured else "unfeatured"} successfully',
            'company': company.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to toggle featured status', 'details': str(e)}), 500

@admin_bp.route('/admin/companies/<int:company_id>/toggle-status', methods=['POST'])
@token_required
@role_required('admin')
def toggle_company_status(current_user, company_id):
    """Toggle company active status (suspend/activate)"""
    try:
        company = Company.query.get(company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        reason = request.json.get('reason', '')
        
        company.is_active = not company.is_active
        company.updated_at = datetime.utcnow()
        
        # In a real app, you might store suspension reasons
        # For now, we'll just update the active status
        
        db.session.commit()
        
        return jsonify({
            'message': f'Company {"activated" if company.is_active else "suspended"} successfully',
            'company': company.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to toggle company status', 'details': str(e)}), 500

@admin_bp.route('/admin/companies/<int:company_id>/send-email', methods=['POST'])
@token_required
@role_required('admin')
def send_company_email(current_user, company_id):
    """Send email to company"""
    try:
        company = Company.query.get(company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        if not company.email:
            return jsonify({'error': 'Company has no email address'}), 400
        
        subject = request.json.get('subject', '')
        body = request.json.get('body', '')
        
        if not subject or not body:
            return jsonify({'error': 'Subject and body are required'}), 400
        
        # In a real app, you would integrate with an email service like SendGrid, AWS SES, etc.
        # For now, we'll just log the email details
        print(f"📧 ADMIN EMAIL TO COMPANY:")
        print(f"   To: {company.email}")
        print(f"   Subject: {subject}")
        print(f"   Body: {body}")
        print(f"   From Admin: {current_user.email}")
        
        return jsonify({
            'message': 'Email sent successfully to company',
            'recipient': company.email
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to send email', 'details': str(e)}), 500

@admin_bp.route('/admin/companies/bulk-action', methods=['POST'])
@token_required
@role_required('admin')
def bulk_company_action(current_user):
    """Perform bulk actions on companies"""
    try:
        company_ids = request.json.get('company_ids', [])
        action = request.json.get('action', '')
        
        if not company_ids or not action:
            return jsonify({'error': 'Company IDs and action are required'}), 400
        
        companies = Company.query.filter(Company.id.in_(company_ids)).all()
        if len(companies) != len(company_ids):
            return jsonify({'error': 'Some companies not found'}), 404
        
        updated_companies = []
        
        if action == 'verify':
            for company in companies:
                if not company.is_verified:
                    company.is_verified = True
                    company.updated_at = datetime.utcnow()
                    updated_companies.append(company)
        
        elif action == 'unverify':
            for company in companies:
                if company.is_verified:
                    company.is_verified = False
                    company.updated_at = datetime.utcnow()
                    updated_companies.append(company)
        
        elif action == 'feature':
            for company in companies:
                company.is_featured = True
                company.updated_at = datetime.utcnow()
                updated_companies.append(company)
        
        elif action == 'unfeature':
            for company in companies:
                company.is_featured = False
                company.updated_at = datetime.utcnow()
                updated_companies.append(company)
        
        elif action == 'activate':
            for company in companies:
                company.is_active = True
                company.updated_at = datetime.utcnow()
                updated_companies.append(company)
        
        elif action == 'suspend':
            for company in companies:
                company.is_active = False
                company.updated_at = datetime.utcnow()
                updated_companies.append(company)
        
        else:
            return jsonify({'error': 'Invalid action'}), 400
        
        db.session.commit()
        
        return jsonify({
            'message': f'Bulk {action} completed successfully',
            'affected_companies': len(updated_companies),
            'companies': [company.to_dict() for company in updated_companies]
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to perform bulk action', 'details': str(e)}), 500

@admin_bp.route('/admin/companies/<int:company_id>', methods=['DELETE'])
@token_required
@role_required('admin')
def delete_company(current_user, company_id):
    """Delete a company (admin only)"""
    try:
        company = Company.query.get(company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        company_name = company.name
        
        # In a production app, you might want to:
        # 1. Soft delete (set is_deleted=True) instead of hard delete
        # 2. Archive related data
        # 3. Send notifications to affected users
        # 4. Log the deletion for audit purposes
        
        # For now, we'll perform a hard delete
        # Note: This will cascade delete related records if set up properly
        db.session.delete(company)
        db.session.commit()
        
        return jsonify({
            'message': f'Company "{company_name}" deleted successfully',
            'deleted_company_id': company_id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete company', 'details': str(e)}), 500

@admin_bp.route('/admin/analytics/revenue', methods=['GET'])
@token_required
@role_required('admin')
def get_revenue_analytics(current_user):
    """Get revenue analytics"""
    try:
        days = request.args.get('days', 30, type=int)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Daily revenue for the period
        daily_revenue = db.session.query(
            func.date(Payment.created_at).label('date'),
            func.sum(Payment.amount).label('revenue')
        ).filter(
            and_(
                Payment.status == 'completed',
                Payment.created_at >= start_date,
                Payment.created_at <= end_date
            )
        ).group_by(func.date(Payment.created_at)).all()
        
        # Revenue by purpose
        revenue_by_purpose = db.session.query(
            Payment.purpose,
            func.sum(Payment.amount).label('revenue'),
            func.count(Payment.id).label('count')
        ).filter(
            and_(
                Payment.status == 'completed',
                Payment.created_at >= start_date
            )
        ).group_by(Payment.purpose).all()
        
        # Top paying companies
        top_companies = db.session.query(
            Company.name,
            func.sum(Payment.amount).label('total_spent')
        ).join(Payment, Company.id == Payment.company_id).filter(
            and_(
                Payment.status == 'completed',
                Payment.created_at >= start_date
            )
        ).group_by(Company.id, Company.name).order_by(
            desc(func.sum(Payment.amount))
        ).limit(10).all()
        
        # Payment method breakdown
        payment_methods = db.session.query(
            Payment.payment_method,
            func.count(Payment.id).label('count'),
            func.sum(Payment.amount).label('revenue')
        ).filter(
            and_(
                Payment.status == 'completed',
                Payment.created_at >= start_date
            )
        ).group_by(Payment.payment_method).all()
        
        analytics = {
            'daily_revenue': [
                {'date': str(date), 'revenue': float(revenue)}
                for date, revenue in daily_revenue
            ],
            'revenue_by_purpose': [
                {'purpose': purpose, 'revenue': float(revenue), 'count': count}
                for purpose, revenue, count in revenue_by_purpose
            ],
            'top_companies': [
                {'company': name, 'total_spent': float(total)}
                for name, total in top_companies
            ],
            'payment_methods': [
                {'method': method, 'count': count, 'revenue': float(revenue)}
                for method, count, revenue in payment_methods
            ]
        }
        
        return jsonify(analytics), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get revenue analytics', 'details': str(e)}), 500

@admin_bp.route('/admin/analytics/users', methods=['GET'])
@token_required
@role_required('admin')
def get_user_analytics(current_user):
    """Get user analytics"""
    try:
        days = request.args.get('days', 30, type=int)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Daily user registrations
        daily_registrations = db.session.query(
            func.date(User.created_at).label('date'),
            func.count(User.id).label('registrations')
        ).filter(
            and_(
                User.created_at >= start_date,
                User.created_at <= end_date
            )
        ).group_by(func.date(User.created_at)).all()
        
        # User role distribution
        role_distribution = db.session.query(
            User.role,
            func.count(User.id).label('count')
        ).group_by(User.role).all()
        
        # Active users by day
        daily_active_users = db.session.query(
            func.date(User.last_login).label('date'),
            func.count(User.id).label('active_users')
        ).filter(
            and_(
                User.last_login >= start_date,
                User.last_login <= end_date
            )
        ).group_by(func.date(User.last_login)).all()
        
        # User verification status
        verification_stats = db.session.query(
            User.is_verified,
            func.count(User.id).label('count')
        ).group_by(User.is_verified).all()
        
        analytics = {
            'daily_registrations': [
                {'date': str(date), 'registrations': registrations}
                for date, registrations in daily_registrations
            ],
            'role_distribution': [
                {'role': role, 'count': count}
                for role, count in role_distribution
            ],
            'daily_active_users': [
                {'date': str(date), 'active_users': active_users}
                for date, active_users in daily_active_users
            ],
            'verification_stats': [
                {'verified': verified, 'count': count}
                for verified, count in verification_stats
            ]
        }
        
        return jsonify(analytics), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get user analytics', 'details': str(e)}), 500

@admin_bp.route('/admin/system-health', methods=['GET'])
@token_required
@role_required('admin')
def get_system_health(current_user):
    """Get system health metrics"""
    try:
        # Database statistics
        db_stats = {
            'total_records': {
                'users': User.query.count(),
                'companies': Company.query.count(),
                'jobs': Job.query.count(),
                'applications': Application.query.count(),
                'payments': Payment.query.count(),
                'featured_ads': FeaturedAd.query.count()
            },
            'active_records': {
                'active_users': User.query.filter_by(is_active=True).count(),
                'active_companies': Company.query.filter_by(is_active=True).count(),
                'active_jobs': Job.query.filter_by(is_active=True).count(),
                'pending_applications': Application.query.filter_by(status='submitted').count(),
                'active_featured_ads': FeaturedAd.query.filter_by(status='active').count()
            }
        }
        
        # Recent activity (last 24 hours)
        yesterday = datetime.utcnow() - timedelta(days=1)
        recent_activity = {
            'new_users': User.query.filter(User.created_at >= yesterday).count(),
            'new_jobs': Job.query.filter(Job.created_at >= yesterday).count(),
            'new_applications': Application.query.filter(Application.created_at >= yesterday).count(),
            'new_payments': Payment.query.filter(Payment.created_at >= yesterday).count()
        }
        
        # Error indicators
        error_indicators = {
            'failed_payments': Payment.query.filter_by(status='failed').count(),
            'expired_featured_ads': FeaturedAd.query.filter(
                and_(FeaturedAd.end_date < datetime.utcnow(), FeaturedAd.status == 'active')
            ).count(),
            'inactive_users': User.query.filter_by(is_active=False).count()
        }
        
        health_data = {
            'database_stats': db_stats,
            'recent_activity': recent_activity,
            'error_indicators': error_indicators,
            'system_status': 'healthy' if all(v < 100 for v in error_indicators.values()) else 'warning'
        }
        
        return jsonify(health_data), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get system health', 'details': str(e)}), 500

# Error handlers
@admin_bp.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400

@admin_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({'error': 'Unauthorized'}), 401

@admin_bp.errorhandler(403)
def forbidden(error):
    return jsonify({'error': 'Forbidden'}), 403

@admin_bp.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@admin_bp.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# Admin Profile Management
@admin_bp.route('/admin/profile', methods=['GET'])
@token_required
@role_required('admin')
def get_admin_profile(current_user):
    """Get current admin profile"""
    try:
        profile_data = {
            'id': current_user.id,
            'username': current_user.username,
            'email': current_user.email,
            'fullName': current_user.full_name or '',
            'phone': getattr(current_user, 'phone', ''),
            'location': getattr(current_user, 'location', ''),
            'bio': getattr(current_user, 'bio', ''),
            'profilePicture': getattr(current_user, 'profile_picture', ''),
            'role': current_user.role,
            'createdAt': current_user.created_at.isoformat() if current_user.created_at else None,
            'lastLogin': current_user.last_login.isoformat() if current_user.last_login else None,
            'permissions': ['read', 'write', 'delete', 'admin'],  # Default admin permissions
            'settings': {}
        }
        return jsonify(profile_data), 200
    except Exception as e:
        return jsonify({'error': 'Failed to get admin profile', 'details': str(e)}), 500

@admin_bp.route('/admin/profile', methods=['PUT'])
@token_required
@role_required('admin')
def update_admin_profile(current_user):
    """Update admin profile"""
    try:
        data = request.get_json()
        
        # Update basic profile fields
        if 'fullName' in data:
            current_user.full_name = data['fullName']
        if 'email' in data and data['email'] != current_user.email:
            # Check if email is already taken
            if User.query.filter(User.email == data['email'], User.id != current_user.id).first():
                return jsonify({'error': 'Email already in use'}), 400
            current_user.email = data['email']
        if 'username' in data and data['username'] != current_user.username:
            # Check if username is already taken
            if User.query.filter(User.username == data['username'], User.id != current_user.id).first():
                return jsonify({'error': 'Username already in use'}), 400
            current_user.username = data['username']
        
        # Update extended profile fields (these might need to be added to User model)
        for field in ['phone', 'location', 'bio']:
            if field in data:
                setattr(current_user, field, data[field])
        
        db.session.commit()
        return jsonify({'message': 'Profile updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update profile', 'details': str(e)}), 500

@admin_bp.route('/admin/upload-avatar', methods=['POST'])
@token_required
@role_required('admin')
def upload_admin_avatar(current_user):
    """Upload admin avatar"""
    try:
        if 'avatar' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['avatar']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # For now, return a mock URL (implement actual file upload logic)
        avatar_url = f'/api/uploads/avatars/admin_{current_user.id}_{datetime.utcnow().timestamp()}.jpg'
        
        # Update user profile picture
        current_user.profile_picture = avatar_url
        db.session.commit()
        
        return jsonify({'url': avatar_url}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to upload avatar', 'details': str(e)}), 500

@admin_bp.route('/admin/stats', methods=['GET'])
@token_required
@role_required('admin')
def get_admin_stats(current_user):
    """Get admin statistics"""
    try:
        stats = {
            'totalActions': 1247,  # Mock data - implement actual tracking
            'activeUsers': User.query.filter_by(is_active=True).count(),
            'totalLogins': 156,  # Mock data - implement login tracking
            'lastActivity': datetime.utcnow().isoformat(),
            'systemHealth': 'healthy'
        }
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({'error': 'Failed to get admin stats', 'details': str(e)}), 500

@admin_bp.route('/admin/activity-log', methods=['GET'])
@token_required
@role_required('admin')
def get_admin_activity_log(current_user):
    """Get admin activity log"""
    try:
        # Mock activity log - implement actual audit logging
        activities = [
            {
                'id': 1,
                'action': 'User management update',
                'timestamp': (datetime.utcnow() - timedelta(hours=1)).isoformat(),
                'type': 'update'
            },
            {
                'id': 2,
                'action': 'System health check',
                'timestamp': (datetime.utcnow() - timedelta(hours=2)).isoformat(),
                'type': 'system'
            },
            {
                'id': 3,
                'action': 'Job approval',
                'timestamp': (datetime.utcnow() - timedelta(hours=3)).isoformat(),
                'type': 'approval'
            },
            {
                'id': 4,
                'action': 'Company verification',
                'timestamp': (datetime.utcnow() - timedelta(hours=4)).isoformat(),
                'type': 'verification'
            },
            {
                'id': 5,
                'action': 'Revenue analytics review',
                'timestamp': (datetime.utcnow() - timedelta(hours=5)).isoformat(),
                'type': 'analytics'
            }
        ]
        return jsonify(activities), 200
    except Exception as e:
        return jsonify({'error': 'Failed to get activity log', 'details': str(e)}), 500

# Admin Settings Management
@admin_bp.route('/admin/settings/<setting_type>', methods=['GET'])
@token_required
@role_required('admin')
def get_admin_settings(current_user, setting_type):
    """Get admin settings by type"""
    try:
        # Mock settings - implement actual settings storage
        settings_data = {
            'system': {
                'siteName': 'TalentSphere',
                'siteDescription': 'Premier job portal connecting talent with opportunities',
                'maintenanceMode': False,
                'registrationEnabled': True,
                'emailVerificationRequired': True,
                'maxFileUploadSize': 10,
                'sessionTimeout': 30,
                'passwordMinLength': 8,
                'enableTwoFactor': False,
                'apiRateLimit': 1000,
                'enableAnalytics': True,
                'enableNotifications': True
            },
            'email': {
                'smtpHost': '',
                'smtpPort': 587,
                'smtpUsername': '',
                'smtpPassword': '',
                'smtpSecure': True,
                'fromEmail': 'noreply@talentsphere.com',
                'fromName': 'TalentSphere',
                'enableWelcomeEmail': True,
                'enableJobAlerts': True,
                'enableSystemAlerts': True
            },
            'security': {
                'enableBruteForceProtection': True,
                'maxLoginAttempts': 5,
                'lockoutDuration': 15,
                'enableCaptcha': False,
                'enableIPWhitelist': False,
                'ipWhitelist': [],
                'enableSSL': True,
                'enableCSRF': True,
                'enableRateLimit': True,
                'apiKey': 'ts_demo_key_123456789',
                'jwtSecret': '',
                'enableAuditLog': True
            },
            'database': {
                'host': 'localhost',
                'port': 5432,
                'name': 'talentsphere',
                'username': 'admin',
                'password': '',
                'maxConnections': 100,
                'connectionTimeout': 30,
                'enableBackup': True,
                'backupFrequency': 'daily',
                'backupRetention': 30,
                'lastBackup': None
            }
        }
        
        if setting_type in settings_data:
            return jsonify(settings_data[setting_type]), 200
        else:
            return jsonify({'error': 'Invalid settings type'}), 400
            
    except Exception as e:
        return jsonify({'error': f'Failed to get {setting_type} settings', 'details': str(e)}), 500

@admin_bp.route('/admin/settings/<setting_type>', methods=['PUT'])
@token_required
@role_required('admin')
def update_admin_settings(current_user, setting_type):
    """Update admin settings by type"""
    try:
        data = request.get_json()
        
        # Mock settings update - implement actual settings storage
        # In a real implementation, you would store these in a settings table or configuration file
        
        return jsonify({'message': f'{setting_type.capitalize()} settings updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to update {setting_type} settings', 'details': str(e)}), 500

@admin_bp.route('/admin/settings/email/test', methods=['POST'])
@token_required
@role_required('admin')
def test_email_settings(current_user):
    """Test email configuration"""
    try:
        # Mock email test - implement actual email sending test
        return jsonify({'message': 'Email test successful'}), 200
    except Exception as e:
        return jsonify({'error': 'Email test failed', 'details': str(e)}), 500

@admin_bp.route('/admin/database/backup', methods=['POST'])
@token_required
@role_required('admin')
def backup_database(current_user):
    """Perform database backup"""
    try:
        # Mock database backup - implement actual backup logic
        return jsonify({'message': 'Database backup started'}), 200
    except Exception as e:
        return jsonify({'error': 'Database backup failed', 'details': str(e)}), 500

@admin_bp.route('/admin/system/clear-cache', methods=['POST'])
@token_required
@role_required('admin')
def clear_system_cache(current_user):
    """Clear system cache"""
    try:
        # Mock cache clearing - implement actual cache clearing logic
        return jsonify({'message': 'System cache cleared'}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to clear cache', 'details': str(e)}), 500

@admin_bp.route('/admin/system/health', methods=['GET'])
@token_required
@role_required('admin')
def get_detailed_system_health(current_user):
    """Get detailed system health metrics"""
    try:
        health_data = {
            'status': 'healthy',
            'uptime': '99.9%',
            'responseTime': '120ms',
            'databaseStatus': 'connected',
            'memoryUsage': 65,
            'diskUsage': 42,
            'cpuUsage': 23,
            'activeConnections': 45,
            'totalUsers': User.query.count(),
            'activeUsers': User.query.filter_by(is_active=True).count()
        }
        return jsonify(health_data), 200
    except Exception as e:
        return jsonify({'error': 'Failed to get system health', 'details': str(e)}), 500


# ============================================================================
# Job Scheduler Management Routes
# ============================================================================

@admin_bp.route('/admin/jobs/expiration-stats', methods=['GET'])
@token_required
@role_required('admin')
def get_job_expiration_stats(current_user):
    """Get statistics about job expirations"""
    try:
        current_time = datetime.utcnow()
        
        # Count expired jobs
        expired_jobs = Job.query.filter(
            Job.expires_at <= current_time,
            Job.status == 'expired'
        ).count()
        
        # Count jobs expiring soon (next 7 days)
        expiring_soon = Job.query.filter(
            Job.expires_at <= current_time + timedelta(days=7),
            Job.expires_at > current_time,
            Job.status == 'published'
        ).count()
        
        # Count jobs expiring this week
        expiring_this_week = Job.query.filter(
            Job.expires_at <= current_time + timedelta(days=7),
            Job.expires_at > current_time,
            Job.status == 'published',
            Job.is_active == True
        ).all()
        
        # Count jobs expiring this month
        expiring_this_month = Job.query.filter(
            Job.expires_at <= current_time + timedelta(days=30),
            Job.expires_at > current_time,
            Job.status == 'published',
            Job.is_active == True
        ).count()
        
        # Count jobs that need marking as expired
        needs_expiry_update = Job.query.filter(
            Job.expires_at <= current_time,
            Job.status == 'published',
            Job.is_active == True
        ).count()
        
        # Count old expired jobs (beyond grace period)
        grace_period_date = current_time - timedelta(days=job_scheduler.grace_period_days)
        old_expired_jobs = Job.query.filter(
            Job.expires_at <= grace_period_date,
            Job.status == 'expired'
        ).all()
        
        old_expired_no_apps = sum(1 for job in old_expired_jobs 
                                  if Application.query.filter_by(job_id=job.id).count() == 0)
        
        # Build detailed list of expiring jobs
        expiring_details = []
        for job in expiring_this_week[:10]:  # Limit to 10 for performance
            days_left = (job.expires_at - current_time).days
            expiring_details.append({
                'id': job.id,
                'title': job.title,
                'company': job.company.name if job.company else job.external_company_name,
                'expires_at': job.expires_at.isoformat(),
                'days_left': days_left,
                'application_count': Application.query.filter_by(job_id=job.id).count()
            })
        
        # Calculate count for response
        expiring_this_week_count = len(expiring_this_week)
        
        stats = {
            'expired_jobs': expired_jobs,
            'expiring_soon': expiring_soon,
            'expiring_this_week': expiring_this_week_count,
            'expiring_this_month': expiring_this_month,
            'needs_expiry_update': needs_expiry_update,
            'old_expired_jobs': len(old_expired_jobs),
            'old_expired_deletable': old_expired_no_apps,
            'scheduler_config': {
                'auto_delete_enabled': job_scheduler.auto_delete_enabled,
                'check_interval_hours': job_scheduler.check_interval / 3600,
                'grace_period_days': job_scheduler.grace_period_days,
                'notify_before_expiry_days': job_scheduler.notify_before_expiry_days,
                'is_running': job_scheduler.is_running
            },
            'expiring_jobs_details': expiring_details
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get job expiration stats', 'details': str(e)}), 500


@admin_bp.route('/admin/jobs/cleanup', methods=['POST'])
@token_required
@role_required('admin')
def manual_job_cleanup(current_user):
    """Manually trigger job cleanup process"""
    try:
        success = job_scheduler.run_manual_cleanup()
        
        if success:
            return jsonify({
                'message': 'Job cleanup completed successfully',
                'timestamp': datetime.utcnow().isoformat()
            }), 200
        else:
            return jsonify({
                'error': 'Job cleanup failed',
                'message': 'Check server logs for details'
            }), 500
            
    except Exception as e:
        return jsonify({'error': 'Failed to run job cleanup', 'details': str(e)}), 500


@admin_bp.route('/admin/jobs/scheduler/config', methods=['GET', 'PUT'])
@token_required
@role_required('admin')
def manage_scheduler_config(current_user):
    """Get or update job scheduler configuration"""
    try:
        if request.method == 'GET':
            config = {
                'auto_delete_enabled': job_scheduler.auto_delete_enabled,
                'check_interval_hours': job_scheduler.check_interval / 3600,
                'grace_period_days': job_scheduler.grace_period_days,
                'notify_before_expiry_days': job_scheduler.notify_before_expiry_days,
                'is_running': job_scheduler.is_running
            }
            return jsonify(config), 200
        
        elif request.method == 'PUT':
            data = request.get_json()
            
            # Update configuration
            job_scheduler.configure(
                check_interval_hours=data.get('check_interval_hours'),
                auto_delete_enabled=data.get('auto_delete_enabled'),
                grace_period_days=data.get('grace_period_days'),
                notify_before_expiry_days=data.get('notify_before_expiry_days')
            )
            
            return jsonify({
                'message': 'Scheduler configuration updated',
                'config': {
                    'auto_delete_enabled': job_scheduler.auto_delete_enabled,
                    'check_interval_hours': job_scheduler.check_interval / 3600,
                    'grace_period_days': job_scheduler.grace_period_days,
                    'notify_before_expiry_days': job_scheduler.notify_before_expiry_days,
                    'is_running': job_scheduler.is_running
                }
            }), 200
            
    except Exception as e:
        return jsonify({'error': 'Failed to manage scheduler config', 'details': str(e)}), 500


@admin_bp.route('/admin/jobs/<int:job_id>/extend-expiry', methods=['POST'])
@token_required
@role_required('admin')
def extend_job_expiry(current_user, job_id):
    """Extend the expiry date of a specific job"""
    try:
        job = Job.query.get(job_id)
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        data = request.get_json()
        days = data.get('days', 30)  # Default to 30 days
        
        # Calculate new expiry date
        if job.expires_at:
            # Extend from current expiry
            new_expiry = job.expires_at + timedelta(days=days)
        else:
            # Set new expiry from now
            new_expiry = datetime.utcnow() + timedelta(days=days)
        
        job.expires_at = new_expiry
        
        # If job was expired, reactivate it
        if job.status == 'expired':
            job.status = 'published'
            job.is_active = True
        
        db.session.commit()
        
        return jsonify({
            'message': f'Job expiry extended by {days} days',
            'job_id': job.id,
            'new_expiry': new_expiry.isoformat(),
            'status': job.status
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to extend job expiry', 'details': str(e)}), 500


