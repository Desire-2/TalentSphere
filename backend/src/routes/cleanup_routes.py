"""
Cleanup Routes
Admin-only endpoints for managing cleanup of expired external opportunities
"""

from datetime import datetime
from flask import Blueprint, jsonify, request
from src.routes.auth import token_required, role_required
from src.services.cleanup_service import get_cleanup_service, is_service_started
import logging

cleanup_bp = Blueprint('cleanup', __name__)
logger = logging.getLogger(__name__)


@cleanup_bp.route('/cleanup/stats', methods=['GET'])
@token_required
@role_required('admin')
def get_cleanup_stats(current_user):
    """
    Get statistics about items eligible for cleanup
    Admin only endpoint
    """
    try:
        cleanup_service = get_cleanup_service()
        stats = cleanup_service.get_cleanup_stats()
        
        return jsonify({
            'success': True,
            'data': stats
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting cleanup stats: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get cleanup statistics',
            'details': str(e)
        }), 500


@cleanup_bp.route('/cleanup/run', methods=['POST'])
@token_required
@role_required('admin')
def run_manual_cleanup(current_user):
    """
    Manually trigger cleanup of expired external opportunities
    Admin only endpoint
    """
    try:
        cleanup_service = get_cleanup_service()
        result = cleanup_service.manual_cleanup()
        
        logger.info(
            f"Manual cleanup executed by admin user {current_user.email}: "
            f"{result['jobs_deleted']} jobs, {result['scholarships_deleted']} scholarships deleted"
        )
        
        return jsonify({
            'success': True,
            'message': f"Cleanup complete: {result['total_deleted']} items deleted",
            'data': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error running manual cleanup: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to run cleanup',
            'details': str(e)
        }), 500


@cleanup_bp.route('/cleanup/jobs', methods=['POST'])
@token_required
@role_required('admin')
def cleanup_jobs_only(current_user):
    """
    Cleanup only external jobs
    Admin only endpoint
    """
    try:
        cleanup_service = get_cleanup_service()
        jobs_deleted = cleanup_service.cleanup_external_jobs()
        
        logger.info(
            f"Jobs cleanup executed by admin user {current_user.email}: "
            f"{jobs_deleted} jobs deleted"
        )
        cutoff_date = cleanup_service.get_cutoff_date()
        
        return jsonify({
            'success': True,
            'message': f"Jobs cleanup complete: {jobs_deleted} jobs deleted",
            'data': {
                'deleted_count': jobs_deleted,
                'cutoff_date': cutoff_date.isoformat() if cutoff_date else None
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error cleaning up jobs: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to cleanup jobs',
            'details': str(e)
        }), 500


@cleanup_bp.route('/cleanup/scholarships', methods=['POST'])
@token_required
@role_required('admin')
def cleanup_scholarships_only(current_user):
    """
    Cleanup only external scholarships
    Admin only endpoint
    """
    try:
        cleanup_service = get_cleanup_service()
        scholarships_deleted = cleanup_service.cleanup_external_scholarships()
        
        logger.info(
            f"Scholarships cleanup executed by admin user {current_user.email}: "
            f"{scholarships_deleted} scholarships deleted"
        )
        cutoff_date = cleanup_service.get_cutoff_date()
        
        return jsonify({
            'success': True,
            'message': f"Scholarships cleanup complete: {scholarships_deleted} scholarships deleted",
            'data': {
                'deleted_count': scholarships_deleted,
                'cutoff_date': cutoff_date.isoformat() if cutoff_date else None
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error cleaning up scholarships: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to cleanup scholarships',
            'details': str(e)
        }), 500


@cleanup_bp.route('/cleanup/service/status', methods=['GET'])
@token_required
@role_required('admin')
def get_service_status(current_user):
    """
    Get cleanup service status
    Admin only endpoint
    """
    try:
        cleanup_service = get_cleanup_service()
        
        # Check if service is running (use module-level flag for multi-worker setups)
        is_running = is_service_started()
        
        return jsonify({
            'success': True,
            'data': {
                'is_running': is_running,
                'check_interval_hours': cleanup_service.check_interval / 3600,
                'grace_period_days': cleanup_service.deletion_grace_period_days,
                'last_cleanup': None  # Will be implemented later
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting service status: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get service status',
            'details': str(e)
        }), 500


# Health check endpoint (no auth required for monitoring)
@cleanup_bp.route('/cleanup/health', methods=['GET'])
def cleanup_health_check():
    """Health check endpoint for cleanup service"""
    try:
        cleanup_service = get_cleanup_service()
        stats = cleanup_service.get_cleanup_stats()
        
        return jsonify({
            'status': 'healthy',
            'service': 'cleanup',
            'timestamp': datetime.utcnow().isoformat(),
            'service_running': is_service_started(),
            'pending_deletions': stats.get('total_eligible_for_deletion', 0)
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'service': 'cleanup',
            'timestamp': datetime.utcnow().isoformat(),
            'error': str(e)
        }), 500
