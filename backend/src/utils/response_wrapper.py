"""
API Response Wrapper Utilities

Provides consistent response formatting for all API endpoints across the application.
"""

from flask import jsonify

def success_response(data=None, message='Success', status_code=200):
    """
    Wrap successful API responses in consistent format
    
    Args:
        data: Response data (dict, list, or None)
        message: Success message
        status_code: HTTP status code (default: 200)
    
    Returns:
        Tuple of (response_dict, status_code)
    """
    response = {
        'success': True,
        'message': message
    }
    if data is not None:
        response['data'] = data
    
    return jsonify(response), status_code


def error_response(error_msg, status_code=400, error_type='error', details=None):
    """
    Wrap error API responses in consistent format
    
    Args:
        error_msg: Error message or Exception
        status_code: HTTP status code (default: 400)
        error_type: Type of error (default: 'error')
        details: Additional error details (dict)
    
    Returns:
        Tuple of (response_dict, status_code)
    """
    response = {
        'success': False,
        'error': str(error_msg),
        'message': str(error_msg),
        'type': error_type
    }
    
    if details:
        response['details'] = details
    
    return jsonify(response), status_code


def get_response(data_or_message, status_code=200, is_error=False):
    """
    Intelligent response wrapper that detects error vs success
    
    Args:
        data_or_message: Response data (dict/list/str) or error message
        status_code: HTTP status code
        is_error: Force treat as error if True
    
    Returns:
        Tuple of (response_dict, status_code)
    """
    if is_error or status_code >= 400:
        return error_response(data_or_message, status_code)
    
    if isinstance(data_or_message, (dict, list)):
        return success_response(data=data_or_message, status_code=status_code)
    
    return success_response(message=str(data_or_message), status_code=status_code)


# Backward compatibility - these methods can be used as JSON directly
def json_success(**kwargs):
    """
    Direct JSON response for success (no status tuple required in some cases)
    Usage: return json_success(data=company_data, message='Company loaded')
    """
    response = {'success': True}
    response.update(kwargs)
    return jsonify(response)


def json_error(error_msg, **kwargs):
    """
    Direct JSON response for errors (no status tuple required in some cases)
    Usage: return json_error('Company not found', error_type='not_found'), 404
    """
    response = {'success': False, 'error': str(error_msg), 'message': str(error_msg)}
    response.update(kwargs)
    return jsonify(response)
