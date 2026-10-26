from flask import Blueprint, request, jsonify
from datetime import datetime
from sqlalchemy import or_, and_, desc

from src.models.user import db
from src.models.job import Job
from src.models.application import Application, ApplicationActivity
from src.models.notification import Notification
from src.routes.auth import token_required, role_required
from src.services.notification_templates import EnhancedNotificationService
from src.services.email_service import email_service
from src.utils.cache import invalidate_cache

application_bp = Blueprint('application', __name__)

# Initialize enhanced notification service
enhanced_notification_service = EnhancedNotificationService(email_service)

def create_application_activity(application_id, user_id, activity_type, description, old_value=None, new_value=None):
    """Create an application activity record"""
    activity = ApplicationActivity(
        application_id=application_id,
        user_id=user_id,
        activity_type=activity_type,
        description=description,
        old_value=old_value,
        new_value=new_value
    )
    db.session.add(activity)
    return activity

def create_notification(user_id, title, message, notification_type, related_application_id=None, related_job_id=None):
    """Create a notification for the user"""
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        related_application_id=related_application_id,
        related_job_id=related_job_id
    )
    db.session.add(notification)
    return notification

@application_bp.route('/jobs/<int:job_id>/apply', methods=['POST'])
@token_required
@role_required('job_seeker')
def apply_for_job(current_user, job_id):
    """Apply for a job"""
    try:
        job = Job.query.filter_by(id=job_id, status='published', is_active=True).first()
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        # Check if application deadline has passed
        if job.application_deadline and datetime.utcnow() > job.application_deadline:
            return jsonify({'error': 'Application deadline has passed'}), 400
        
        # Check if user has already applied
        existing_application = Application.query.filter_by(
            job_id=job_id, applicant_id=current_user.id
        ).first()
        
        if existing_application:
            return jsonify({'error': 'You have already applied for this job'}), 409
        
        data = request.get_json()
        
        # ── Career Agent document attachment ────────────────────────────────
        # A generated CV/cover-letter package can be attached to the
        # application. Ownership is verified here; the cover-letter text and
        # resume reference are derived server-side from the verified documents.
        from src.models.career_agent import CareerApplicationDocument, CareerDocument, CareerDocumentPackage

        cv_document = None
        letter_document = None
        career_document_id = data.get('career_document_id') or data.get('cv_document_id')
        if career_document_id:
            cv_document = CareerDocument.query.filter_by(
                id=int(career_document_id), user_id=current_user.id, document_type='CV'
            ).first()
            if not cv_document:
                return jsonify({'error': 'The selected CV document was not found for your account'}), 404
            if data.get('cover_letter_document_id'):
                letter_document = CareerDocument.query.filter_by(
                    id=int(data.get('cover_letter_document_id')),
                    user_id=current_user.id,
                    document_type='COVER_LETTER',
                    package_id=cv_document.package_id,
                ).first()
                if not letter_document:
                    return jsonify({'error': 'The selected cover letter was not found in the same package'}), 404

        # Derived application fields (server-side, never trusted from client):
        cover_letter_text = data.get('cover_letter')
        resume_reference = data.get('resume_url')
        if cv_document:
            letter_text = ''
            if letter_document:
                paragraphs = (letter_document.get_content() or {}).get('body', {}).get('paragraphs', [])
                letter_text = '\n\n'.join(
                    str(p.get('text', '')).strip() for p in paragraphs if p.get('text')
                )
            elif cv_document.package:
                linked_letter = CareerDocument.query.filter_by(
                    package_id=cv_document.package_id,
                    user_id=current_user.id,
                    document_type='COVER_LETTER',
                ).first()
                if linked_letter:
                    paragraphs = (linked_letter.get_content() or {}).get('body', {}).get('paragraphs', [])
                    letter_text = '\n\n'.join(
                        str(p.get('text', '')).strip() for p in paragraphs if p.get('text')
                    )
                    letter_document = linked_letter
            if letter_text:
                cover_letter_text = letter_text
            # Store a valid API resource path. The UI resolves it through an
            # authenticated download so browser anchors never bypass auth.
            resume_reference = f"/api/career-agent/documents/{cv_document.id}"

        # Validate required fields based on job requirements
        if job.requires_resume and not resume_reference:
            return jsonify({'error': 'Resume is required for this job'}), 400
        
        if job.requires_cover_letter and not cover_letter_text:
            return jsonify({'error': 'Cover letter is required for this job'}), 400
        
        if job.requires_portfolio and not data.get('portfolio_url'):
            return jsonify({'error': 'Portfolio is required for this job'}), 400
        
        # Create application
        application = Application(
            job_id=job_id,
            applicant_id=current_user.id,
            cover_letter=cover_letter_text,
            resume_url=resume_reference,
            portfolio_url=data.get('portfolio_url'),
            additional_documents=data.get('additional_documents'),
            custom_responses=data.get('custom_responses'),
            source=data.get('source', 'direct')
        )
        
        db.session.add(application)
        db.session.flush()  # Get application ID
        
        # Link the generated package to the application for employer access.
        if cv_document:
            db.session.add(CareerApplicationDocument(
                application_id=application.id,
                package_id=cv_document.package_id,
                cv_document_id=cv_document.id,
                cover_letter_document_id=letter_document.id if letter_document else None,
            ))

        # Create activity record
        create_application_activity(
            application.id,
            current_user.id,
            'application_submitted',
            f'{current_user.get_full_name()} submitted application for {job.title}'
        )
        
        # Update job application count
        job.application_count += 1
        
        # Create notification for employer with enhanced email template
        if job.poster:
            create_notification(
                job.poster.id,
                'New Job Application',
                f'{current_user.get_full_name()} applied for {job.title}',
                'application_status',
                related_application_id=application.id,
                related_job_id=job_id
            )
            
            # Send enhanced email notification to employer
            enhanced_notification_service.send_application_status_update(
                application.id, 
                'submitted',
                frontend_url='https://talentsphere.com'
            )
        
        # Send confirmation to applicant
        enhanced_notification_service.send_application_status_update(
            application.id,
            'submitted',
            frontend_url='https://talentsphere.com'
        )
        
        db.session.commit()
        invalidate_cache(['employer_stats'])

        return jsonify({
            'message': 'Application submitted successfully',
            'application': application.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to submit application', 'details': str(e)}), 500

@application_bp.route('/applications/<int:application_id>', methods=['GET'])
@token_required
def get_application(current_user, application_id):
    """Get application details"""
    try:
        application = Application.query.get(application_id)
        if not application:
            return jsonify({'error': 'Application not found'}), 404
        
        # Check permission
        is_applicant = application.applicant_id == current_user.id
        is_employer = (current_user.role in ['employer', 'admin'] and 
                      application.job.posted_by == current_user.id)
        
        if not (is_applicant or is_employer):
            return jsonify({'error': 'Access denied'}), 403
        
        # Get application data
        application_data = application.to_dict(
            include_sensitive=True,
            for_employer=is_employer
        )
        
        # Attach generated Career Agent documents (owner or authorized employer).
        from src.models.career_agent import CareerApplicationDocument

        career_link = CareerApplicationDocument.query.filter_by(application_id=application_id).first()
        if career_link and (is_applicant or is_employer):
            application_data['career_documents'] = {
                'package_id': career_link.package_id,
                'cv_document_id': career_link.cv_document_id,
                'cover_letter_document_id': career_link.cover_letter_document_id,
                'download_base': f"/api/career-agent/applications/{application_id}/documents",
            }

        # Add related data
        application_data['job'] = application.job.to_dict(include_details=True)
        application_data['applicant'] = application.applicant.to_dict()
        
        # Add company information for applicant
        if is_applicant:
            application_data['company'] = application.job.company.to_dict()
        
        # Add activity history
        activities = ApplicationActivity.query.filter_by(
            application_id=application_id
        ).order_by(ApplicationActivity.created_at.desc()).all()
        
        application_data['activities'] = [activity.to_dict() for activity in activities]
        
        return jsonify(application_data), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get application', 'details': str(e)}), 500

@application_bp.route('/applications/<int:application_id>/status', methods=['PUT'])
@token_required
@role_required('employer', 'admin')
def update_application_status(current_user, application_id):
    """Update application status"""
    try:
        application = Application.query.get(application_id)
        if not application:
            return jsonify({'error': 'Application not found'}), 404
        
        # Check permission
        if (current_user.role == 'employer' and 
            application.job.posted_by != current_user.id):
            return jsonify({'error': 'You can only manage applications for your own jobs'}), 403
        
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({'error': 'Status is required'}), 400
        
        valid_statuses = [
            'submitted', 'under_review', 'shortlisted', 'interviewed', 
            'rejected', 'hired', 'withdrawn'
        ]
        
        if new_status not in valid_statuses:
            return jsonify({'error': 'Invalid status'}), 400
        
        old_status = application.status
        application.status = new_status
        application.stage = data.get('stage')
        application.employer_notes = data.get('employer_notes')
        application.feedback = data.get('feedback')
        application.rating = data.get('rating')
        application.reviewed_at = datetime.utcnow()
        application.updated_at = datetime.utcnow()
        
        # Create activity record
        create_application_activity(
            application.id,
            current_user.id,
            'status_change',
            f'Status changed from {old_status} to {new_status}',
            old_value=old_status,
            new_value=new_status
        )
        
        # Create notification for applicant
        status_messages = {
            'under_review': 'Your application is now under review',
            'shortlisted': 'Congratulations! You have been shortlisted',
            'interviewed': 'Your interview has been completed',
            'rejected': 'Thank you for your interest. We have decided to move forward with other candidates',
            'hired': 'Congratulations! You have been selected for the position'
        }
        
        if new_status in status_messages:
            create_notification(
                application.applicant_id,
                f'Application Status Update - {application.job.title}',
                status_messages[new_status],
                'application_status',
                related_application_id=application.id,
                related_job_id=application.job_id
            )
            
            # Send enhanced email notification with beautiful template
            enhanced_notification_service.send_application_status_update(
                application.id,
                new_status,
                frontend_url='https://talentsphere.com'
            )
        
        db.session.commit()
        invalidate_cache(['employer_stats'])

        return jsonify({
            'message': 'Application status updated successfully',
            'application': application.to_dict(for_employer=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update application status', 'details': str(e)}), 500

@application_bp.route('/applications/<int:application_id>/interview', methods=['POST'])
@token_required
@role_required('employer', 'admin')
def schedule_interview(current_user, application_id):
    """Schedule an interview"""
    try:
        application = Application.query.get(application_id)
        if not application:
            return jsonify({'error': 'Application not found'}), 404
        
        # Check permission
        if (current_user.role == 'employer' and 
            application.job.posted_by != current_user.id):
            return jsonify({'error': 'You can only manage applications for your own jobs'}), 403
        
        data = request.get_json()
        
        if not data.get('interview_datetime'):
            return jsonify({'error': 'Interview date and time is required'}), 400
        
        # Update interview information
        application.interview_scheduled = True
        application.interview_datetime = datetime.fromisoformat(data['interview_datetime'])
        application.interview_type = data.get('interview_type', 'video')
        application.interview_location = data.get('interview_location')
        application.interview_notes = data.get('interview_notes')
        application.updated_at = datetime.utcnow()
        
        # Update status if not already interviewed
        if application.status not in ['interviewed', 'hired', 'rejected']:
            application.status = 'shortlisted'
        
        # Create activity record
        create_application_activity(
            application.id,
            current_user.id,
            'interview_scheduled',
            f'Interview scheduled for {application.interview_datetime.strftime("%Y-%m-%d %H:%M")}'
        )
        
        # Create notification for applicant
        create_notification(
            application.applicant_id,
            f'Interview Scheduled - {application.job.title}',
            f'Your interview has been scheduled for {application.interview_datetime.strftime("%B %d, %Y at %I:%M %p")}',
            'application_status',
            related_application_id=application.id,
            related_job_id=application.job_id
        )
        
        db.session.commit()
        invalidate_cache(['employer_stats'])

        return jsonify({
            'message': 'Interview scheduled successfully',
            'application': application.to_dict(for_employer=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to schedule interview', 'details': str(e)}), 500

@application_bp.route('/my-applications', methods=['GET'])
@token_required
@role_required('job_seeker')
def get_my_applications(current_user):
    """Get current user's job applications"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        status = request.args.get('status')
        
        query = Application.query.filter_by(applicant_id=current_user.id)
        
        if status:
            query = query.filter_by(status=status)
        
        applications = query.order_by(Application.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        application_list = []
        for application in applications.items:
            app_data = application.to_dict(include_sensitive=True)
            app_data['job'] = application.job.to_dict()
            app_data['company'] = application.job.company.to_dict()
            application_list.append(app_data)
        
        return jsonify({
            'applications': application_list,
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
        return jsonify({'error': 'Failed to get applications', 'details': str(e)}), 500

@application_bp.route('/jobs/<int:job_id>/applications', methods=['GET'])
@token_required
@role_required('employer', 'admin')
def get_job_applications(current_user, job_id):
    """Get applications for a specific job"""
    try:
        job = Job.query.get(job_id)
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        # Check permission
        if (current_user.role == 'employer' and 
            job.posted_by != current_user.id):
            return jsonify({'error': 'You can only view applications for your own jobs'}), 403
        
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        status = request.args.get('status')
        
        query = Application.query.filter_by(job_id=job_id)
        
        if status:
            query = query.filter_by(status=status)
        
        applications = query.order_by(Application.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        application_list = []
        for application in applications.items:
            app_data = application.to_dict(for_employer=True)
            app_data['applicant'] = application.applicant.to_dict()
            
            # Add job seeker profile if available
            if application.applicant.job_seeker_profile:
                app_data['applicant_profile'] = application.applicant.job_seeker_profile.to_dict()
            
            application_list.append(app_data)
        
        return jsonify({
            'job': job.to_dict(),
            'applications': application_list,
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
        return jsonify({'error': 'Failed to get applications', 'details': str(e)}), 500

@application_bp.route('/applications/<int:application_id>/withdraw', methods=['POST'])
@token_required
@role_required('job_seeker')
def withdraw_application(current_user, application_id):
    """Withdraw job application"""
    try:
        application = Application.query.get(application_id)
        if not application:
            return jsonify({'error': 'Application not found'}), 404
        
        # Check permission
        if application.applicant_id != current_user.id:
            return jsonify({'error': 'You can only withdraw your own applications'}), 403
        
        # Check if application can be withdrawn
        if application.status in ['hired', 'rejected', 'withdrawn']:
            return jsonify({'error': 'Application cannot be withdrawn'}), 400
        
        old_status = application.status
        application.status = 'withdrawn'
        application.updated_at = datetime.utcnow()
        
        # Create activity record
        create_application_activity(
            application.id,
            current_user.id,
            'application_withdrawn',
            f'Application withdrawn by {current_user.get_full_name()}',
            old_value=old_status,
            new_value='withdrawn'
        )
        
        # Create notification for employer
        if application.job.poster:
            create_notification(
                application.job.poster.id,
                f'Application Withdrawn - {application.job.title}',
                f'{current_user.get_full_name()} has withdrawn their application',
                'application_status',
                related_application_id=application.id,
                related_job_id=application.job_id
            )
        
        db.session.commit()
        invalidate_cache(['employer_stats'])

        return jsonify({
            'message': 'Application withdrawn successfully',
            'application': application.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to withdraw application', 'details': str(e)}), 500

@application_bp.route('/application-stats', methods=['GET'])
@token_required
def get_application_stats(current_user):
    """Get application statistics for current user"""
    try:
        if current_user.role == 'job_seeker':
            # Job seeker stats
            total_applications = Application.query.filter_by(applicant_id=current_user.id).count()
            pending_applications = Application.query.filter_by(
                applicant_id=current_user.id, status='submitted'
            ).count()
            interviews_scheduled = Application.query.filter_by(
                applicant_id=current_user.id, interview_scheduled=True
            ).count()
            offers_received = Application.query.filter_by(
                applicant_id=current_user.id, status='hired'
            ).count()
            
            return jsonify({
                'total_applications': total_applications,
                'pending_applications': pending_applications,
                'interviews_scheduled': interviews_scheduled,
                'offers_received': offers_received
            }), 200
            
        elif current_user.role in ['employer', 'admin']:
            # Employer stats
            job_ids = [job.id for job in current_user.posted_jobs]
            
            total_applications = Application.query.filter(
                Application.job_id.in_(job_ids)
            ).count()
            
            new_applications = Application.query.filter(
                Application.job_id.in_(job_ids),
                Application.status == 'submitted'
            ).count()
            
            interviews_scheduled = Application.query.filter(
                Application.job_id.in_(job_ids),
                Application.interview_scheduled == True
            ).count()
            
            hires_made = Application.query.filter(
                Application.job_id.in_(job_ids),
                Application.status == 'hired'
            ).count()
            
            return jsonify({
                'total_applications': total_applications,
                'new_applications': new_applications,
                'interviews_scheduled': interviews_scheduled,
                'hires_made': hires_made
            }), 200
        
        else:
            return jsonify({'error': 'Invalid user role'}), 400
            
    except Exception as e:
        return jsonify({'error': 'Failed to get stats', 'details': str(e)}), 500


# ==================== INTERVIEW ENDPOINTS ====================

@application_bp.route('/my-interviews', methods=['GET'])
@token_required
def get_my_interviews(current_user):
    """Get user's interviews (job seeker)"""
    try:
        if current_user.role != 'job_seeker':
            return jsonify({'error': 'Only job seekers can view interviews'}), 403
        
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        # Get all applications with scheduled interviews for this user
        applications = Application.query.filter(
            Application.applicant_id == current_user.id,
            Application.interview_scheduled == True
        ).order_by(
            Application.interview_datetime.desc()
        ).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        interviews = []
        for app in applications.items:
            job = Job.query.get(app.job_id)
            if job:
                interview_data = {
                    'id': app.id,
                    'application_id': app.id,
                    'job_id': app.job_id,
                    'job_title': job.title,
                    'company': job.company.name if job.company else 'Unknown',
                    'company_logo': job.company.logo_url if job.company else None,
                    'interview_type': app.interview_type or 'scheduled',
                    'date': app.interview_datetime.isoformat() if app.interview_datetime else None,
                    'location': app.interview_location or 'Virtual',
                    'interviewer': app.interview_notes or '',
                    'status': app.status,
                    'application_status': app.status
                }
                interviews.append(interview_data)
        
        return jsonify({
            'interviews': interviews,
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
        return jsonify({'error': 'Failed to get interviews', 'details': str(e)}), 500


@application_bp.route('/interviews', methods=['GET'])
@token_required
def get_interviews_alt(current_user):
    """Alternative endpoint for getting interviews (alias for /my-interviews)"""
    try:
        if current_user.role != 'job_seeker':
            return jsonify({'error': 'Only job seekers can view interviews'}), 403
        
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        # Get all applications with scheduled interviews
        applications = Application.query.filter(
            Application.applicant_id == current_user.id,
            Application.interview_scheduled == True
        ).order_by(
            Application.interview_datetime.desc()
        ).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        interviews = []
        for app in applications.items:
            job = Job.query.get(app.job_id)
            if job:
                interview_data = {
                    'id': app.id,
                    'application_id': app.id,
                    'job_id': app.job_id,
                    'job_title': job.title,
                    'company': job.company.name if job.company else 'Unknown',
                    'company_logo': job.company.logo_url if job.company else None,
                    'interview_type': app.interview_type or 'scheduled',
                    'date': app.interview_datetime.isoformat() if app.interview_datetime else None,
                    'location': app.interview_location or 'Virtual',
                    'interviewer': app.interview_notes or '',
                    'status': app.status,
                    'application_status': app.status
                }
                interviews.append(interview_data)
        
        return jsonify({
            'interviews': interviews,
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
        return jsonify({'error': 'Failed to get interviews', 'details': str(e)}), 500

# Error handlers
@application_bp.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400

@application_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({'error': 'Unauthorized'}), 401

@application_bp.errorhandler(403)
def forbidden(error):
    return jsonify({'error': 'Forbidden'}), 403

@application_bp.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@application_bp.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500
