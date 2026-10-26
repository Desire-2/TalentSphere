"""
Enhanced Notification Routes with Email Integration
Provides comprehensive notification management with email delivery
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from sqlalchemy import desc, and_, or_, func, case
import json
import os

from src.models.user import db
from src.models.notification import Notification, Message
from src.models.notification_preferences import NotificationPreference, NotificationDeliveryLog, NotificationQueue
from src.models.job import Job
from src.models.application import Application
from src.routes.auth import token_required
from src.services.email_service import email_service, EmailNotification, EmailPriority, NotificationType
from src.utils.ttl_cache import TTLCache

enhanced_notification_bp = Blueprint('enhanced_notification', __name__)

# Both endpoints are polled by the frontend. Redis is optional in this
# deployment, so these process-local caches keep a poll from issuing a round
# trip per request. Keys are scoped per user; every mutation handler below
# invalidates its owner's entries, and the TTL bounds staleness for writes
# made in another worker process.
_NOTIFICATION_CACHE_TTL = float(os.getenv('NOTIFICATION_CACHE_TTL', '20'))
_notifications_cache = TTLCache(
    name='enhanced_notifications:list',
    max_entries=256,
    default_ttl=_NOTIFICATION_CACHE_TTL,
)
_stats_cache = TTLCache(
    name='enhanced_notifications:stats',
    max_entries=256,
    default_ttl=_NOTIFICATION_CACHE_TTL,
)


def _invalidate_notification_caches(user_id=None):
    """Drop cached list/stats payloads, or only those of one user."""
    prefix = f"u{user_id}:" if user_id is not None else ''
    _notifications_cache.invalidate(prefix)
    _stats_cache.invalidate(prefix)


@enhanced_notification_bp.route('/notifications', methods=['GET'])
@token_required
def get_notifications(current_user):
    """Get notifications for current user with enhanced filtering"""
    try:
        page = max(request.args.get('page', 1, type=int) or 1, 1)
        per_page = max(min(request.args.get('per_page', 20, type=int) or 20, 100), 1)
        notification_type = request.args.get('type')
        priority = request.args.get('priority')
        is_read = request.args.get('is_read')
        search = request.args.get('search')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')

        cache_key = f"u{current_user.id}:" + request.query_string.decode('utf-8', 'replace')
        cached_payload = _notifications_cache.get(cache_key)
        if cached_payload is not None:
            return jsonify(cached_payload), 200

        # Build the filter list once so the row query and the counts agree on
        # exactly which notifications belong on this page.
        filters = [Notification.user_id == current_user.id]

        if notification_type:
            filters.append(Notification.notification_type == notification_type)

        if priority:
            filters.append(Notification.priority == priority)

        if is_read is not None:
            filters.append(Notification.is_read == (is_read.lower() == 'true'))

        if search:
            search_term = f'%{search}%'
            filters.append(or_(
                Notification.title.ilike(search_term),
                Notification.message.ilike(search_term)
            ))

        if date_from:
            try:
                from_date = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                filters.append(Notification.created_at >= from_date)
            except ValueError:
                pass

        if date_to:
            try:
                to_date = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                filters.append(Notification.created_at <= to_date)
            except ValueError:
                pass

        # paginate() would issue a COUNT for the page plus a second COUNT for
        # the unread badge; when no filter narrows the set both come out of a
        # single aggregate instead. The badge always counts every unread
        # notification, filtered or not, so filtered requests still need the
        # dedicated total.
        if len(filters) == 1:
            total, unread_count = db.session.query(
                func.count(Notification.id),
                func.coalesce(
                    func.sum(case((Notification.is_read.is_(False), 1), else_=0)), 0
                ),
            ).filter(*filters).one()
        else:
            total = db.session.query(func.count(Notification.id)).filter(*filters).scalar()
            unread_count = (
                db.session.query(func.count(Notification.id))
                .filter(
                    Notification.user_id == current_user.id,
                    Notification.is_read.is_(False),
                )
                .scalar()
            )

        notifications = (
            db.session.query(Notification)
            .filter(*filters)
            .order_by(desc(Notification.created_at))
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )

        # One batched lookup for the whole page. The previous per-notification
        # query turned a 50-row page into 50 round trips to the database.
        page_ids = [notification.id for notification in notifications]
        logs_by_notification = {}
        if page_ids:
            delivery_logs = NotificationDeliveryLog.query.filter(
                NotificationDeliveryLog.notification_id.in_(page_ids)
            ).all()
            for log in delivery_logs:
                logs_by_notification.setdefault(log.notification_id, []).append(log)

        notification_list = []
        for notification in notifications:
            notification_dict = notification.to_dict()

            delivery_logs = logs_by_notification.get(notification.id, [])
            notification_dict['delivery_status'] = {
                'email_sent': any(log.delivery_method == 'email' and log.delivery_status == 'sent'
                                for log in delivery_logs),
                'email_opened': any(log.delivery_method == 'email' and log.opened_at
                                  for log in delivery_logs),
                'email_clicked': any(log.delivery_method == 'email' and log.clicked_at
                                   for log in delivery_logs)
            }

            notification_list.append(notification_dict)

        total = int(total or 0)
        unread_count = int(unread_count or 0)
        pages = (total + per_page - 1) // per_page

        payload = {
            'notifications': notification_list,
            'pagination': {
                'page': page,
                'pages': pages,
                'per_page': per_page,
                'total': total,
                'has_next': page < pages,
                'has_prev': page > 1
            },
            'unread_count': unread_count,
            'filters_applied': {
                'type': notification_type,
                'priority': priority,
                'is_read': is_read,
                'search': search,
                'date_range': bool(date_from or date_to)
            }
        }
        _notifications_cache.set(cache_key, payload)
        return jsonify(payload), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get notifications', 'details': str(e)}), 500


@enhanced_notification_bp.route('/notifications', methods=['POST'])
@token_required
def create_notification(current_user):
    """Create a new notification with email delivery"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'message', 'notification_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Extract notification data
        title = data['title']
        message = data['message']
        notification_type = data['notification_type']
        priority = data.get('priority', 'normal')
        send_email = data.get('send_email', True)
        send_immediately = data.get('send_immediately', True)
        scheduled_for = data.get('scheduled_for')
        
        # Additional data
        variables = data.get('variables', {})
        action_url = data.get('action_url')
        action_text = data.get('action_text')
        
        # Convert scheduled_for to datetime if provided
        scheduled_datetime = None
        if scheduled_for:
            try:
                scheduled_datetime = datetime.fromisoformat(scheduled_for.replace('Z', '+00:00'))
            except ValueError:
                return jsonify({'error': 'Invalid scheduled_for format'}), 400
        
        # Get user preferences
        preferences = NotificationPreference.get_or_create_for_user(current_user.id)
        
        # Check if user wants to receive this type of notification
        should_send_email = (send_email and 
                           preferences.should_send_notification(notification_type, 'email', 
                                                              priority == 'urgent'))
        
        # Create notification
        notification = Notification(
            user_id=current_user.id,
            title=title,
            message=message,
            notification_type=notification_type,
            priority=priority,
            send_email=should_send_email,
            action_url=action_url,
            action_text=action_text,
            data=json.dumps(variables) if variables else None,
            scheduled_for=scheduled_datetime
        )
        
        db.session.add(notification)
        db.session.flush()  # Get notification ID
        
        # Send email if requested and allowed
        if should_send_email:
            try:
                # Map notification type to email template
                template_map = {
                    'job_alert': 'job_alert',
                    'application_status': 'application_status',
                    'message': 'message_notification',
                    'interview_reminder': 'interview_reminder',
                    'deadline_reminder': 'deadline_reminder',
                    'company_update': 'company_update',
                    'system': 'system_notification',
                    'promotion': 'system_notification'
                }
                
                template_name = template_map.get(notification_type, 'system_notification')
                
                # Convert priority
                email_priority = EmailPriority.URGENT if priority == 'urgent' else \
                               EmailPriority.HIGH if priority == 'high' else \
                               EmailPriority.NORMAL
                
                # Create email notification
                email_notification = EmailNotification(
                    recipient_email=current_user.email,
                    recipient_name=current_user.get_full_name(),
                    template_name=template_name,
                    subject=title,
                    variables={
                        'user_name': current_user.get_full_name(),
                        'title': title,
                        'message': message,
                        'action_url': action_url or f"{email_service.frontend_url}/notifications",
                        'action_text': action_text or 'View Notification',
                        **variables
                    },
                    priority=email_priority,
                    send_immediately=send_immediately and not scheduled_datetime,
                    scheduled_for=scheduled_datetime,
                    notification_id=notification.id
                )
                
                # Send email or queue it
                if send_immediately and not scheduled_datetime:
                    email_success = email_service.send_notification_email(email_notification)
                    if email_success:
                        notification.mark_as_sent()
                        
                        # Log delivery attempt
                        delivery_log = NotificationDeliveryLog(
                            notification_id=notification.id,
                            user_id=current_user.id,
                            delivery_method='email',
                            delivery_status='sent',
                            recipient_address=current_user.email,
                            delivery_provider='smtp'
                        )
                        db.session.add(delivery_log)
                    else:
                        # Log failed delivery
                        delivery_log = NotificationDeliveryLog(
                            notification_id=notification.id,
                            user_id=current_user.id,
                            delivery_method='email',
                            delivery_status='failed',
                            recipient_address=current_user.email,
                            delivery_provider='smtp',
                            delivery_response='SMTP delivery failed'
                        )
                        db.session.add(delivery_log)
                else:
                    # Queue for later delivery
                    queue_entry = NotificationQueue(
                        notification_id=notification.id,
                        user_id=current_user.id,
                        delivery_method='email',
                        priority=priority,
                        scheduled_for=scheduled_datetime or datetime.utcnow(),
                        delivery_data=json.dumps(email_notification.__dict__, default=str)
                    )
                    db.session.add(queue_entry)
                    
            except Exception as e:
                print(f"Error sending email notification: {str(e)}")
                # Continue without failing the notification creation
        
        db.session.commit()
        _invalidate_notification_caches(current_user.id)
        
        return jsonify({
            'message': 'Notification created successfully',
            'notification': notification.to_dict(),
            'email_sent': should_send_email and send_immediately and not scheduled_datetime
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create notification', 'details': str(e)}), 500


@enhanced_notification_bp.route('/notifications/<int:notification_id>/read', methods=['POST'])
@token_required
def mark_notification_read(current_user, notification_id):
    """Mark notification as read"""
    try:
        notification = Notification.query.filter_by(
            id=notification_id, user_id=current_user.id
        ).first()
        
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404
        
        notification.mark_as_read()
        _invalidate_notification_caches(current_user.id)
        
        return jsonify({
            'message': 'Notification marked as read',
            'notification': notification.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to mark notification as read', 'details': str(e)}), 500


@enhanced_notification_bp.route('/notifications/<int:notification_id>', methods=['DELETE'])
@token_required
def delete_notification(current_user, notification_id):
    """Delete a notification"""
    try:
        notification = Notification.query.filter_by(
            id=notification_id, user_id=current_user.id
        ).first()
        
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404
        
        # Delete related delivery logs and queue entries
        NotificationDeliveryLog.query.filter_by(notification_id=notification_id).delete()
        NotificationQueue.query.filter_by(notification_id=notification_id).delete()
        
        db.session.delete(notification)
        db.session.commit()
        _invalidate_notification_caches(current_user.id)
        
        return jsonify({'message': 'Notification deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete notification', 'details': str(e)}), 500


@enhanced_notification_bp.route('/notifications/mark-all-read', methods=['POST'])
@token_required
def mark_all_notifications_read(current_user):
    """Mark all notifications as read"""
    try:
        updated_count = Notification.query.filter_by(
            user_id=current_user.id, is_read=False
        ).update({
            'is_read': True,
            'read_at': datetime.utcnow()
        })
        
        db.session.commit()
        _invalidate_notification_caches(current_user.id)
        
        return jsonify({
            'message': f'Marked {updated_count} notifications as read'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to mark all notifications as read', 'details': str(e)}), 500


@enhanced_notification_bp.route('/notifications/bulk-delete', methods=['POST'])
@token_required
def bulk_delete_notifications(current_user):
    """Delete multiple notifications"""
    try:
        data = request.get_json()
        notification_ids = data.get('notification_ids', [])
        
        if not notification_ids:
            return jsonify({'error': 'No notification IDs provided'}), 400
        
        # Verify all notifications belong to current user
        notifications = Notification.query.filter(
            Notification.id.in_(notification_ids),
            Notification.user_id == current_user.id
        ).all()
        
        if len(notifications) != len(notification_ids):
            return jsonify({'error': 'Some notifications not found or not owned by user'}), 400
        
        # Delete related records
        NotificationDeliveryLog.query.filter(
            NotificationDeliveryLog.notification_id.in_(notification_ids)
        ).delete(synchronize_session=False)
        
        NotificationQueue.query.filter(
            NotificationQueue.notification_id.in_(notification_ids)
        ).delete(synchronize_session=False)
        
        # Delete notifications
        deleted_count = Notification.query.filter(
            Notification.id.in_(notification_ids),
            Notification.user_id == current_user.id
        ).delete(synchronize_session=False)
        
        db.session.commit()
        _invalidate_notification_caches(current_user.id)
        
        return jsonify({
            'message': f'Deleted {deleted_count} notifications successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete notifications', 'details': str(e)}), 500


@enhanced_notification_bp.route('/notification-preferences', methods=['GET'])
@token_required
def get_notification_preferences(current_user):
    """Get user notification preferences"""
    try:
        preferences = NotificationPreference.get_or_create_for_user(current_user.id)
        return jsonify(preferences.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get preferences', 'details': str(e)}), 500


@enhanced_notification_bp.route('/notification-preferences', methods=['PUT'])
@token_required
def update_notification_preferences(current_user):
    """Update user notification preferences"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No preference data provided'}), 400
        
        preferences = NotificationPreference.get_or_create_for_user(current_user.id)
        preferences.update_from_dict(data)
        
        return jsonify({
            'message': 'Notification preferences updated successfully',
            'preferences': preferences.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update preferences', 'details': str(e)}), 500


@enhanced_notification_bp.route('/notifications/stats', methods=['GET'])
@token_required
def get_notification_stats(current_user):
    """Get notification statistics for current user"""
    try:
        cache_key = f"u{current_user.id}:stats"
        cached_payload = _stats_cache.get(cache_key)
        if cached_payload is not None:
            return jsonify(cached_payload), 200

        # Total, unread and the 7-day window share one conditional aggregate
        # instead of three separate COUNT round trips.
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        total_count, unread_count, recent_count = db.session.query(
            func.count(Notification.id),
            func.coalesce(
                func.sum(case((Notification.is_read.is_(False), 1), else_=0)), 0
            ),
            func.coalesce(
                func.sum(case((Notification.created_at >= seven_days_ago, 1), else_=0)), 0
            ),
        ).filter(Notification.user_id == current_user.id).one()

        # Get counts by type
        type_stats = db.session.query(
            Notification.notification_type,
            func.count(Notification.id).label('count'),
            func.coalesce(
                func.sum(case((Notification.is_read.is_(False), 1), else_=0)), 0
            ).label('unread_count')
        ).filter_by(user_id=current_user.id).group_by(Notification.notification_type).all()
        
        # Get counts by priority
        priority_stats = db.session.query(
            Notification.priority,
            func.count(Notification.id).label('count'),
            func.coalesce(
                func.sum(case((Notification.is_read.is_(False), 1), else_=0)), 0
            ).label('unread_count')
        ).filter_by(user_id=current_user.id).group_by(Notification.priority).all()
        
        # Get email delivery stats
        email_stats = db.session.query(
            NotificationDeliveryLog.delivery_status,
            func.count(NotificationDeliveryLog.id).label('count')
        ).filter(
            NotificationDeliveryLog.user_id == current_user.id,
            NotificationDeliveryLog.delivery_method == 'email'
        ).group_by(NotificationDeliveryLog.delivery_status).all()
        
        payload = {
            'total_notifications': int(total_count or 0),
            'unread_notifications': int(unread_count or 0),
            'read_notifications': int(total_count or 0) - int(unread_count or 0),
            'recent_notifications': int(recent_count or 0),
            'by_type': [
                {
                    'type': stat.notification_type,
                    'total': stat.count,
                    'unread': stat.unread_count or 0
                }
                for stat in type_stats
            ],
            'by_priority': [
                {
                    'priority': stat.priority,
                    'total': stat.count,
                    'unread': stat.unread_count or 0
                }
                for stat in priority_stats
            ],
            'email_delivery': [
                {
                    'status': stat.delivery_status,
                    'count': stat.count
                }
                for stat in email_stats
            ]
        }
        _stats_cache.set(cache_key, payload)
        return jsonify(payload), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get notification stats', 'details': str(e)}), 500


@enhanced_notification_bp.route('/notifications/test', methods=['POST'])
@token_required
def send_test_notification(current_user):
    """Send a test notification to verify email setup"""
    try:
        data = request.get_json()
        notification_type = data.get('type', 'system')
        send_email = data.get('send_email', True)
        
        # Create test notification
        success = email_service.create_and_send_notification(
            user_id=current_user.id,
            notification_type=NotificationType.SYSTEM,
            title="Test Notification",
            message="This is a test notification to verify your email settings are working correctly.",
            variables={
                'action_url': f"{email_service.frontend_url}/notifications",
                'action_text': 'View Notifications'
            },
            send_email=send_email,
            priority=EmailPriority.NORMAL
        )
        _invalidate_notification_caches(current_user.id)
        
        return jsonify({
            'message': 'Test notification sent successfully' if success else 'Test notification created but email failed',
            'success': success
        }), 200 if success else 207
        
    except Exception as e:
        return jsonify({'error': 'Failed to send test notification', 'details': str(e)}), 500


@enhanced_notification_bp.route('/notifications/digest/weekly', methods=['POST'])
@token_required
def send_weekly_digest(current_user):
    """Send weekly digest email"""
    try:
        # Get user preferences
        preferences = NotificationPreference.get_or_create_for_user(current_user.id)
        
        if not preferences.weekly_digest_enabled:
            return jsonify({'error': 'Weekly digest is disabled for this user'}), 400
        
        # Calculate digest data
        week_ago = datetime.utcnow() - timedelta(days=7)
        
        # Get new job alerts count
        new_jobs_count = Notification.query.filter(
            Notification.user_id == current_user.id,
            Notification.notification_type == 'job_alert',
            Notification.created_at >= week_ago
        ).count()
        
        applications_count = Application.query.filter(
            Application.applicant_id == current_user.id,
            Application.created_at >= week_ago
        ).count()
        
        # Get messages count
        messages_count = Message.query.filter(
            Message.recipient_id == current_user.id,
            Message.created_at >= week_ago
        ).count()
        
        digest_data = {
            'new_jobs_count': new_jobs_count,
            'applications_count': applications_count,
            'messages_count': messages_count
        }
        
        # Send digest email
        success = email_service.send_digest_email(current_user.id, digest_data)
        
        return jsonify({
            'message': 'Weekly digest sent successfully' if success else 'Failed to send weekly digest',
            'success': success,
            'digest_data': digest_data
        }), 200 if success else 500
        
    except Exception as e:
        return jsonify({'error': 'Failed to send weekly digest', 'details': str(e)}), 500


@enhanced_notification_bp.route('/notifications/delivery-logs/<int:notification_id>', methods=['GET'])
@token_required
def get_notification_delivery_logs(current_user, notification_id):
    """Get delivery logs for a specific notification"""
    try:
        # Verify notification belongs to user
        notification = Notification.query.filter_by(
            id=notification_id, user_id=current_user.id
        ).first()
        
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404
        
        # Get delivery logs
        logs = NotificationDeliveryLog.query.filter_by(
            notification_id=notification_id
        ).order_by(desc(NotificationDeliveryLog.attempted_at)).all()
        
        return jsonify({
            'notification_id': notification_id,
            'delivery_logs': [log.to_dict() for log in logs]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get delivery logs', 'details': str(e)}), 500


# Error handlers
@enhanced_notification_bp.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400

@enhanced_notification_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({'error': 'Unauthorized'}), 401

@enhanced_notification_bp.errorhandler(403)
def forbidden(error):
    return jsonify({'error': 'Forbidden'}), 403

@enhanced_notification_bp.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@enhanced_notification_bp.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500
