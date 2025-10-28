from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from src.models.user import db
from src.models.scholarship import Scholarship
from src.models.scholarship_share import ScholarshipShare
from datetime import datetime

scholarship_share_bp = Blueprint('scholarship_share', __name__)

@scholarship_share_bp.route('/scholarships/<int:scholarship_id>/share', methods=['POST'])
def record_scholarship_share(scholarship_id):
    """Record a scholarship share action"""
    try:
        # Check if scholarship exists
        scholarship = Scholarship.query.get_or_404(scholarship_id)
        
        data = request.get_json()
        
        # Get user ID if authenticated
        user_id = None
        try:
            claims = get_jwt()
            user_id = get_jwt_identity()
        except:
            pass  # Anonymous share
        
        # Validate required fields
        if not data.get('platform'):
            return jsonify({'error': 'Platform is required'}), 400
        
        # Create share record
        share = ScholarshipShare(
            scholarship_id=scholarship_id,
            user_id=user_id,
            platform=data.get('platform'),
            custom_message=data.get('custom_message'),
            recipient_info=data.get('recipient_info'),
            share_url=data.get('share_url'),
            user_agent=request.headers.get('User-Agent'),
            ip_address=request.remote_addr,
            referrer=request.headers.get('Referer'),
            extra_data=data.get('extra_data')
        )
        
        db.session.add(share)
        
        # Update scholarship share count (if you have this field)
        if hasattr(scholarship, 'share_count'):
            scholarship.share_count = (scholarship.share_count or 0) + 1
        
        db.session.commit()
        
        return jsonify({
            'message': 'Share recorded successfully',
            'share': share.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to record share', 'details': str(e)}), 500


@scholarship_share_bp.route('/scholarships/<int:scholarship_id>/share/stats', methods=['GET'])
def get_scholarship_share_stats(scholarship_id):
    """Get sharing statistics for a scholarship"""
    try:
        scholarship = Scholarship.query.get_or_404(scholarship_id)
        stats = ScholarshipShare.get_scholarship_share_stats(scholarship_id)
        
        return jsonify({
            'scholarship_id': scholarship_id,
            'stats': stats
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get share stats', 'details': str(e)}), 500


@scholarship_share_bp.route('/scholarships/share/click', methods=['POST'])
def record_share_click():
    """Record a click on a shared scholarship link"""
    try:
        data = request.get_json()
        
        share_id = data.get('share_id')
        scholarship_id = data.get('scholarship_id')
        utm_params = data.get('utm_params', {})
        
        if share_id:
            # Update specific share record
            share = ScholarshipShare.query.get(share_id)
            if share:
                share.click_count += 1
                share.last_click_at = datetime.utcnow()
                db.session.commit()
        
        # You could also create a separate click tracking table for more detailed analytics
        
        return jsonify({'message': 'Click recorded'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to record click', 'details': str(e)}), 500


@scholarship_share_bp.route('/scholarships/share/top', methods=['GET'])
def get_top_shared_scholarships():
    """Get most shared scholarships"""
    try:
        limit = request.args.get('limit', 10, type=int)
        limit = min(limit, 100)  # Cap at 100
        
        top_shared = ScholarshipShare.get_top_shared_scholarships(limit)
        
        # Enrich with scholarship data
        result = []
        for item in top_shared:
            scholarship = Scholarship.query.get(item['scholarship_id'])
            if scholarship:
                result.append({
                    **item,
                    'scholarship': scholarship.to_dict()
                })
        
        return jsonify({
            'top_shared': result,
            'count': len(result)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get top shared scholarships', 'details': str(e)}), 500


@scholarship_share_bp.route('/scholarships/share/platform-stats', methods=['GET'])
def get_platform_statistics():
    """Get overall platform sharing statistics"""
    try:
        stats = ScholarshipShare.get_platform_stats()
        
        return jsonify({
            'platform_stats': stats,
            'total_platforms': len(stats)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get platform stats', 'details': str(e)}), 500


@scholarship_share_bp.route('/scholarships/my-shares', methods=['GET'])
@jwt_required()
def get_my_shares():
    """Get current user's sharing history"""
    try:
        user_id = get_jwt_identity()
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        per_page = min(per_page, 100)
        
        shares_query = ScholarshipShare.query.filter_by(user_id=user_id).order_by(
            ScholarshipShare.shared_at.desc()
        )
        
        pagination = shares_query.paginate(page=page, per_page=per_page, error_out=False)
        
        shares = []
        for share in pagination.items:
            share_data = share.to_dict()
            # Include scholarship info
            if share.scholarship:
                share_data['scholarship'] = {
                    'id': share.scholarship.id,
                    'title': share.scholarship.title,
                    'organization': share.scholarship.external_organization_name
                }
            shares.append(share_data)
        
        return jsonify({
            'shares': shares,
            'pagination': {
                'page': pagination.page,
                'per_page': pagination.per_page,
                'total': pagination.total,
                'pages': pagination.pages
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get shares', 'details': str(e)}), 500


@scholarship_share_bp.route('/analytics/shares/summary', methods=['GET'])
@jwt_required()
def get_share_analytics_summary():
    """Get overall sharing analytics summary (for admin/organization users)"""
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()
        user_type = claims.get('user_type')
        
        # Only allow external admins and admins
        if user_type not in ['admin', 'external_admin']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get stats for scholarships posted by this user
        if user_type == 'external_admin':
            scholarships = Scholarship.query.filter_by(posted_by=user_id).all()
            scholarship_ids = [s.id for s in scholarships]
            
            total_shares = ScholarshipShare.query.filter(
                ScholarshipShare.scholarship_id.in_(scholarship_ids)
            ).count()
            
            platform_stats = db.session.query(
                ScholarshipShare.platform,
                db.func.count(ScholarshipShare.id).label('count')
            ).filter(
                ScholarshipShare.scholarship_id.in_(scholarship_ids)
            ).group_by(
                ScholarshipShare.platform
            ).all()
            
        else:
            # Admin sees all stats
            total_shares = ScholarshipShare.query.count()
            platform_stats = ScholarshipShare.get_platform_stats()
        
        return jsonify({
            'total_shares': total_shares,
            'platform_distribution': [{'platform': p[0], 'count': p[1]} for p in platform_stats] if user_type == 'external_admin' else platform_stats
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get analytics', 'details': str(e)}), 500
