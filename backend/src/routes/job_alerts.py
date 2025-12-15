"""
Enhanced Job Alert System
API endpoints for sending job alerts with beautiful HTML email templates
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from sqlalchemy import and_, or_

from src.models.user import User, db
from src.models.job import Job, JobAlert
from src.routes.auth import token_required, role_required
from src.services.notification_templates import EnhancedNotificationService
from src.services.email_service import email_service

job_alerts_bp = Blueprint('job_alerts', __name__)

# Initialize enhanced notification service
enhanced_notification_service = EnhancedNotificationService(email_service)


@job_alerts_bp.route('', methods=['GET', 'POST', 'DELETE'])
@token_required
def manage_job_alerts(current_user):
    """
    Manage job alerts for the current user
    GET - Get all job alerts for user
    POST - Create new job alert
    DELETE - Delete job alert (requires alert_id in params)
    """
    try:
        if request.method == 'GET':
            # Get all job alerts for user
            alerts = JobAlert.query.filter_by(user_id=current_user.id).all()
            return jsonify({
                'success': True,
                'alerts': [alert.to_dict() for alert in alerts]
            }), 200
        
        elif request.method == 'POST':
            # Create new job alert
            data = request.get_json()
            
            # Validate required fields
            name = data.get('name', '').strip()
            keywords = data.get('keywords', '').strip()
            
            if not name:
                return jsonify({'error': 'Alert name is required'}), 400
            
            # Create job alert
            job_alert = JobAlert(
                user_id=current_user.id,
                name=name,
                keywords=keywords,
                location=data.get('location', ''),
                employment_type=data.get('employment_type', ''),
                category_id=data.get('category_id'),
                experience_level=data.get('experience_level', ''),
                salary_min=data.get('salary_min'),
                is_remote=data.get('is_remote', False),
                is_active=True,
                frequency=data.get('frequency', 'daily')
            )
            
            db.session.add(job_alert)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Job alert created successfully',
                'alert': job_alert.to_dict()
            }), 201
        
        elif request.method == 'DELETE':
            # Delete job alert
            alert_id = request.args.get('alert_id')
            if not alert_id:
                return jsonify({'error': 'alert_id is required'}), 400
            
            alert = JobAlert.query.filter_by(
                id=alert_id,
                user_id=current_user.id
            ).first()
            
            if not alert:
                return jsonify({'error': 'Job alert not found'}), 404
            
            db.session.delete(alert)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Job alert deleted successfully'
            }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'Failed to manage job alert',
            'details': str(e)
        }), 500


@job_alerts_bp.route('/send', methods=['POST'])
@token_required
@role_required(['admin', 'employer'])
def send_job_alert(current_user):
    """Send job alert to matching users"""
    try:
        data = request.get_json()
        job_id = data.get('job_id')
        
        if not job_id:
            return jsonify({'error': 'job_id is required'}), 400
        
        job = Job.query.get(job_id)
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        # Find users who should receive this job alert
        # Based on job alerts, location, skills, etc.
        matching_users = find_matching_users_for_job(job)
        
        sent_count = 0
        failed_count = 0
        
        for user in matching_users:
            try:
                success = enhanced_notification_service.send_job_alert(
                    user.id,
                    job.id,
                    frontend_url='https://talentsphere.com'
                )
                if success:
                    sent_count += 1
                else:
                    failed_count += 1
            except Exception as e:
                print(f"Failed to send job alert to user {user.id}: {e}")
                failed_count += 1
        
        return jsonify({
            'message': f'Job alerts sent successfully',
            'sent_count': sent_count,
            'failed_count': failed_count,
            'total_users': len(matching_users)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to send job alerts', 'details': str(e)}), 500


@job_alerts_bp.route('/interview/schedule', methods=['POST'])
@token_required
@role_required(['admin', 'employer'])
def schedule_interview(current_user):
    """Schedule interview and send reminder"""
    try:
        data = request.get_json()
        
        required_fields = ['application_id', 'interview_date', 'interview_time', 'interview_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        application_id = data['application_id']
        interview_datetime = f"{data['interview_date']} {data['interview_time']}"
        
        # Parse the datetime
        interview_dt = datetime.strptime(interview_datetime, '%Y-%m-%d %H:%M')
        
        interview_data = {
            'job_title': data.get('job_title', ''),
            'company_name': data.get('company_name', ''),
            'interview_date': interview_dt.isoformat(),
            'interview_type': data['interview_type'],
            'duration': data.get('duration', '1 hour'),
            'meeting_link': data.get('meeting_link', ''),
            'interviewer_name': data.get('interviewer_name', current_user.get_full_name()),
            'interviewer_email': data.get('interviewer_email', current_user.email),
            'location': data.get('location', 'Online'),
            'documents_needed': data.get('documents_needed', []),
            'special_instructions': data.get('special_instructions', '')
        }
        
        # Get the applicant
        from src.models.application import Application
        application = Application.query.get(application_id)
        if not application:
            return jsonify({'error': 'Application not found'}), 404
        
        # Send interview reminder
        success = enhanced_notification_service.send_interview_reminder(
            application.applicant_id,
            interview_data,
            frontend_url='https://talentsphere.com'
        )
        
        if success:
            return jsonify({
                'message': 'Interview scheduled and reminder sent successfully',
                'interview_data': interview_data
            }), 200
        else:
            return jsonify({'error': 'Failed to send interview reminder'}), 500
            
    except Exception as e:
        return jsonify({'error': 'Failed to schedule interview', 'details': str(e)}), 500


@job_alerts_bp.route('/messages/send', methods=['POST'])
@token_required
def send_message_notification(current_user):
    """Send message notification with beautiful email template"""
    try:
        data = request.get_json()
        
        required_fields = ['recipient_id', 'subject', 'content']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create message record (simplified)
        from src.models.notification import Message
        message = Message(
            sender_id=current_user.id,
            recipient_id=data['recipient_id'],
            subject=data['subject'],
            content=data['content'],
            created_at=datetime.utcnow()
        )
        
        db.session.add(message)
        db.session.flush()
        
        # Send notification with beautiful template
        success = enhanced_notification_service.send_new_message_notification(
            data['recipient_id'],
            message.id,
            frontend_url='https://talentsphere.com'
        )
        
        db.session.commit()
        
        if success:
            return jsonify({
                'message': 'Message sent and notification delivered successfully',
                'message_id': message.id
            }), 200
        else:
            return jsonify({'error': 'Message sent but notification failed'}), 500
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to send message', 'details': str(e)}), 500


@job_alerts_bp.route('/welcome/send', methods=['POST'])
@token_required
@role_required(['admin'])
def send_welcome_email(current_user):
    """Send welcome email to new user"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        success = enhanced_notification_service.send_welcome_email(
            user_id,
            frontend_url='https://talentsphere.com'
        )
        
        if success:
            return jsonify({'message': 'Welcome email sent successfully'}), 200
        else:
            return jsonify({'error': 'Failed to send welcome email'}), 500
            
    except Exception as e:
        return jsonify({'error': 'Failed to send welcome email', 'details': str(e)}), 500


@job_alerts_bp.route('/system/send', methods=['POST'])
@token_required
@role_required(['admin'])
def send_system_notification(current_user):
    """Send system notification with beautiful template"""
    try:
        data = request.get_json()
        
        required_fields = ['user_id', 'title', 'message']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        system_data = {
            'title': data['title'],
            'message': data['message'],
            'type': data.get('type', 'general'),
            'profile_completion': data.get('profile_completion', 75),
            'applications_sent': data.get('applications_sent', 0),
            'messages_unread': data.get('messages_unread', 0),
            'jobs_saved': data.get('jobs_saved', 0),
            'recommendations': data.get('recommendations', []),
            'recent_activity': data.get('recent_activity', []),
            'action_url': data.get('action_url'),
            'action_text': data.get('action_text', 'Visit Dashboard')
        }
        
        success = enhanced_notification_service.send_system_notification(
            data['user_id'],
            system_data,
            frontend_url='https://talentsphere.com'
        )
        
        if success:
            return jsonify({'message': 'System notification sent successfully'}), 200
        else:
            return jsonify({'error': 'Failed to send system notification'}), 500
            
    except Exception as e:
        return jsonify({'error': 'Failed to send system notification', 'details': str(e)}), 500


def find_matching_users_for_job(job):
    """Find users who should receive job alerts for a specific job"""
    try:
        # Get users with active job alerts that match this job
        matching_users = []
        
        # Basic matching based on job title, location, and skills
        query = User.query.filter(
            User.is_active == True,
            User.role == 'job_seeker'
        )
        
        # If job has location, try to match users in same location
        if job.location:
            query = query.filter(
                or_(
                    User.location.ilike(f'%{job.location}%'),
                    User.preferred_location.ilike(f'%{job.location}%') if hasattr(User, 'preferred_location') else False
                )
            )
        
        # Get users who have job alerts enabled
        users = query.all()
        
        for user in users:
            # Check if user has email notifications enabled
            if hasattr(user, 'email_notifications') and not user.email_notifications:
                continue
            
            # Additional filtering logic can be added here
            # For now, include all active job seekers
            matching_users.append(user)
        
        return matching_users[:50]  # Limit to 50 users per batch
        
    except Exception as e:
        print(f"Error finding matching users: {e}")
        return []


@job_alerts_bp.route('/test/all-templates', methods=['POST'])
@token_required
@role_required(['admin'])
def test_all_email_templates(current_user):
    """Test all email templates by sending them to the current user"""
    try:
        results = {}
        
        # Test job alert
        try:
            # Get a sample job
            job = Job.query.filter_by(status='published').first()
            if job:
                success = enhanced_notification_service.send_job_alert(
                    current_user.id,
                    job.id,
                    frontend_url='https://talentsphere.com'
                )
                results['job_alert'] = 'success' if success else 'failed'
            else:
                results['job_alert'] = 'no_job_available'
        except Exception as e:
            results['job_alert'] = f'error: {str(e)}'
        
        # Test welcome email
        try:
            success = enhanced_notification_service.send_welcome_email(
                current_user.id,
                frontend_url='https://talentsphere.com'
            )
            results['welcome'] = 'success' if success else 'failed'
        except Exception as e:
            results['welcome'] = f'error: {str(e)}'
        
        # Test system notification
        try:
            system_data = {
                'title': 'Test System Notification',
                'message': 'This is a test system notification with beautiful design.',
                'type': 'general',
                'profile_completion': 85,
                'applications_sent': 5,
                'messages_unread': 2,
                'jobs_saved': 8
            }
            success = enhanced_notification_service.send_system_notification(
                current_user.id,
                system_data,
                frontend_url='https://talentsphere.com'
            )
            results['system'] = 'success' if success else 'failed'
        except Exception as e:
            results['system'] = f'error: {str(e)}'
        
        # Test interview reminder
        try:
            interview_data = {
                'job_title': 'Senior Software Engineer',
                'company_name': 'TechCorp Inc.',
                'interview_date': (datetime.now() + timedelta(days=1)).isoformat(),
                'interview_type': 'Video Call',
                'duration': '1 hour',
                'meeting_link': 'https://zoom.us/j/123456789',
                'interviewer_name': 'John Smith',
                'interviewer_email': 'john@techcorp.com',
                'location': 'Online'
            }
            success = enhanced_notification_service.send_interview_reminder(
                current_user.id,
                interview_data,
                frontend_url='https://talentsphere.com'
            )
            results['interview_reminder'] = 'success' if success else 'failed'
        except Exception as e:
            results['interview_reminder'] = f'error: {str(e)}'
        
        return jsonify({
            'message': 'Template testing completed',
            'results': results
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to test templates', 'details': str(e)}), 500