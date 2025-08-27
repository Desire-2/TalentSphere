from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from sqlalchemy import desc, and_, or_

from src.models.user import db
from src.models.notification import Notification, Message
from src.models.job import Job
from src.models.application import Application
from src.routes.auth import token_required

notification_bp = Blueprint('notification', __name__)

@notification_bp.route('/notifications', methods=['GET'])
@token_required
def get_notifications(current_user):
    """Get notifications for current user"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        unread_only = request.args.get('unread_only', type=bool, default=False)
        notification_type = request.args.get('type')
        
        query = Notification.query.filter_by(user_id=current_user.id)
        
        if unread_only:
            query = query.filter_by(is_read=False)
        
        if notification_type:
            query = query.filter_by(notification_type=notification_type)
        
        notifications = query.order_by(desc(Notification.created_at)).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        notification_list = []
        for notification in notifications.items:
            notif_data = notification.to_dict()
            
            # Add related object data
            if notification.related_job_id:
                job = Job.query.get(notification.related_job_id)
                if job:
                    notif_data['related_job'] = {
                        'id': job.id,
                        'title': job.title,
                        'company_name': job.company.name if job.company else None
                    }
            
            if notification.related_application_id:
                application = Application.query.get(notification.related_application_id)
                if application:
                    notif_data['related_application'] = {
                        'id': application.id,
                        'job_title': application.job.title if application.job else None,
                        'status': application.status
                    }
            
            notification_list.append(notif_data)
        
        return jsonify({
            'notifications': notification_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': notifications.total,
                'pages': notifications.pages,
                'has_next': notifications.has_next,
                'has_prev': notifications.has_prev
            },
            'unread_count': Notification.query.filter_by(
                user_id=current_user.id, is_read=False
            ).count()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get notifications', 'details': str(e)}), 500

@notification_bp.route('/notifications/<int:notification_id>/read', methods=['POST'])
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
        
        return jsonify({
            'message': 'Notification marked as read',
            'notification': notification.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to mark notification as read', 'details': str(e)}), 500

@notification_bp.route('/notifications/mark-all-read', methods=['POST'])
@token_required
def mark_all_notifications_read(current_user):
    """Mark all notifications as read"""
    try:
        notifications = Notification.query.filter_by(
            user_id=current_user.id, is_read=False
        ).all()
        
        for notification in notifications:
            notification.is_read = True
            notification.read_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': f'{len(notifications)} notifications marked as read'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to mark notifications as read', 'details': str(e)}), 500

@notification_bp.route('/messages', methods=['GET'])
@token_required
def get_messages(current_user):
    """Get messages for current user"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        conversation_with = request.args.get('conversation_with', type=int)
        
        if conversation_with:
            # Get conversation with specific user
            query = Message.query.filter(
                or_(
                    and_(Message.sender_id == current_user.id, Message.recipient_id == conversation_with),
                    and_(Message.sender_id == conversation_with, Message.recipient_id == current_user.id)
                )
            ).order_by(desc(Message.created_at))
        else:
            # Get all messages (inbox/outbox)
            query = Message.query.filter(
                or_(Message.sender_id == current_user.id, Message.recipient_id == current_user.id)
            ).order_by(desc(Message.created_at))
        
        messages = query.paginate(page=page, per_page=per_page, error_out=False)
        
        message_list = []
        for message in messages.items:
            msg_data = message.to_dict(for_user_id=current_user.id)
            
            # Add sender and recipient info
            msg_data['sender'] = message.sender.to_dict() if message.sender else None
            msg_data['recipient'] = message.recipient.to_dict() if message.recipient else None
            
            # Add related object data
            if message.related_job_id:
                job = Job.query.get(message.related_job_id)
                if job:
                    msg_data['related_job'] = {
                        'id': job.id,
                        'title': job.title,
                        'company_name': job.company.name if job.company else None
                    }
            
            message_list.append(msg_data)
        
        return jsonify({
            'messages': message_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': messages.total,
                'pages': messages.pages,
                'has_next': messages.has_next,
                'has_prev': messages.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get messages', 'details': str(e)}), 500

@notification_bp.route('/messages', methods=['POST'])
@token_required
def send_message(current_user):
    """Send a message"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('recipient_id') or not data.get('message'):
            return jsonify({'error': 'Recipient and message are required'}), 400
        
        # Verify recipient exists
        from src.models.user import User
        recipient = User.query.get(data['recipient_id'])
        if not recipient:
            return jsonify({'error': 'Recipient not found'}), 404
        
        if recipient.id == current_user.id:
            return jsonify({'error': 'Cannot send message to yourself'}), 400
        
        # Create message
        message = Message(
            sender_id=current_user.id,
            recipient_id=data['recipient_id'],
            subject=data.get('subject'),
            message=data['message'],
            related_job_id=data.get('related_job_id'),
            related_application_id=data.get('related_application_id'),
            message_type=data.get('message_type', 'general'),
            attachments=data.get('attachments')
        )
        
        db.session.add(message)
        db.session.flush()  # Get message ID
        
        # Create notification for recipient
        notification = Notification(
            user_id=recipient.id,
            title='New Message',
            message=f'{current_user.get_full_name()} sent you a message',
            notification_type='message',
            action_url=f'/messages/{message.id}',
            action_text='View Message'
        )
        
        db.session.add(notification)
        db.session.commit()
        
        return jsonify({
            'message': 'Message sent successfully',
            'message_data': message.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to send message', 'details': str(e)}), 500

@notification_bp.route('/messages/<int:message_id>/read', methods=['POST'])
@token_required
def mark_message_read(current_user, message_id):
    """Mark message as read"""
    try:
        message = Message.query.filter_by(
            id=message_id, recipient_id=current_user.id
        ).first()
        
        if not message:
            return jsonify({'error': 'Message not found'}), 404
        
        message.mark_as_read()
        
        return jsonify({
            'message': 'Message marked as read',
            'message_data': message.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to mark message as read', 'details': str(e)}), 500

@notification_bp.route('/conversations', methods=['GET'])
@token_required
def get_conversations(current_user):
    """Get conversation list for current user"""
    try:
        # Get unique conversations (latest message from each conversation)
        subquery = db.session.query(
            Message.id,
            Message.sender_id,
            Message.recipient_id,
            Message.subject,
            Message.message,
            Message.is_read,
            Message.created_at,
            db.case(
                (Message.sender_id == current_user.id, Message.recipient_id),
                else_=Message.sender_id
            ).label('other_user_id')
        ).filter(
            or_(Message.sender_id == current_user.id, Message.recipient_id == current_user.id)
        ).subquery()
        
        # Get latest message for each conversation
        latest_messages = db.session.query(
            subquery.c.other_user_id,
            db.func.max(subquery.c.created_at).label('latest_time')
        ).group_by(subquery.c.other_user_id).subquery()
        
        # Join to get full message details
        conversations = db.session.query(Message).join(
            latest_messages,
            and_(
                or_(
                    and_(Message.sender_id == current_user.id, Message.recipient_id == latest_messages.c.other_user_id),
                    and_(Message.sender_id == latest_messages.c.other_user_id, Message.recipient_id == current_user.id)
                ),
                Message.created_at == latest_messages.c.latest_time
            )
        ).order_by(desc(Message.created_at)).all()
        
        conversation_list = []
        for message in conversations:
            # Determine the other user in the conversation
            other_user = message.sender if message.recipient_id == current_user.id else message.recipient
            
            # Count unread messages in this conversation
            unread_count = Message.query.filter(
                and_(
                    Message.sender_id == other_user.id,
                    Message.recipient_id == current_user.id,
                    Message.is_read == False
                )
            ).count()
            
            conversation_data = {
                'other_user': other_user.to_dict(),
                'latest_message': message.to_dict(for_user_id=current_user.id),
                'unread_count': unread_count
            }
            
            conversation_list.append(conversation_data)
        
        return jsonify({
            'conversations': conversation_list
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get conversations', 'details': str(e)}), 500

@notification_bp.route('/notification-preferences', methods=['GET'])
@token_required
def get_notification_preferences(current_user):
    """Get user notification preferences"""
    try:
        # In a real implementation, you would have a separate table for user preferences
        # For this demo, we'll return default preferences
        
        preferences = {
            'email_notifications': {
                'application_status': True,
                'job_alerts': True,
                'messages': True,
                'promotions': False
            },
            'push_notifications': {
                'application_status': True,
                'job_alerts': True,
                'messages': True,
                'promotions': False
            },
            'sms_notifications': {
                'application_status': False,
                'job_alerts': False,
                'messages': False,
                'promotions': False
            }
        }
        
        return jsonify(preferences), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get preferences', 'details': str(e)}), 500

@notification_bp.route('/notification-preferences', methods=['PUT'])
@token_required
def update_notification_preferences(current_user):
    """Update user notification preferences"""
    try:
        data = request.get_json()
        
        # In a real implementation, you would save these preferences to a database
        # For this demo, we'll just return success
        
        return jsonify({
            'message': 'Notification preferences updated successfully',
            'preferences': data
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to update preferences', 'details': str(e)}), 500

@notification_bp.route('/notifications/stats', methods=['GET'])
@token_required
def get_notification_stats(current_user):
    """Get notification statistics"""
    try:
        total_notifications = Notification.query.filter_by(user_id=current_user.id).count()
        unread_notifications = Notification.query.filter_by(
            user_id=current_user.id, is_read=False
        ).count()
        
        # Notifications by type
        notification_types = db.session.query(
            Notification.notification_type,
            db.func.count(Notification.id).label('count')
        ).filter_by(user_id=current_user.id).group_by(
            Notification.notification_type
        ).all()
        
        # Recent notifications (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_notifications = Notification.query.filter(
            and_(
                Notification.user_id == current_user.id,
                Notification.created_at >= week_ago
            )
        ).count()
        
        # Message statistics
        total_messages = Message.query.filter(
            or_(Message.sender_id == current_user.id, Message.recipient_id == current_user.id)
        ).count()
        
        unread_messages = Message.query.filter(
            and_(Message.recipient_id == current_user.id, Message.is_read == False)
        ).count()
        
        stats = {
            'notifications': {
                'total': total_notifications,
                'unread': unread_notifications,
                'recent': recent_notifications,
                'by_type': [
                    {'type': type_name, 'count': count}
                    for type_name, count in notification_types
                ]
            },
            'messages': {
                'total': total_messages,
                'unread': unread_messages
            }
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get stats', 'details': str(e)}), 500

# Error handlers
@notification_bp.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400

@notification_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({'error': 'Unauthorized'}), 401

@notification_bp.errorhandler(403)
def forbidden(error):
    return jsonify({'error': 'Forbidden'}), 403

@notification_bp.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@notification_bp.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

