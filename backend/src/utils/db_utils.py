"""
Database utilities for better connection management and error handling
"""
import functools
from flask import current_app, jsonify
from src.models.user import db

def db_transaction(f):
    """
    Decorator to handle database transactions with proper session management
    Automatically handles commit/rollback and session cleanup
    """
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        try:
            # Execute the function
            result = f(*args, **kwargs)
            
            # Commit if no exception occurred
            db.session.commit()
            return result
            
        except Exception as e:
            # Rollback on any exception
            db.session.rollback()
            
            # Safe logging that handles cases where current_app might not be available
            try:
                current_app.logger.error(f"Database transaction failed in {f.__name__}: {str(e)}")
            except RuntimeError:
                # Fallback logging when no application context
                print(f"Database transaction failed in {f.__name__}: {str(e)}")
            
            # Re-raise the exception to be handled by the route
            raise e
            
        finally:
            # Always close the session to free up connections
            db.session.close()
    
    return wrapper

def safe_db_operation(f):
    """
    Decorator for database operations that provides detailed error logging
    and ensures proper session cleanup without automatic commit
    """
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            try:
                current_app.logger.error(f"Database operation failed in {f.__name__}: {str(e)}")
            except RuntimeError:
                # Fallback logging when no application context
                print(f"Database operation failed in {f.__name__}: {str(e)}")
            
            db.session.rollback()
            
            # Return a proper error response if this is a Flask route
            if hasattr(e, 'code'):
                # It's already a Flask error
                raise e
            else:
                # Convert to a proper Flask error response
                return jsonify({
                    'error': 'Database operation failed',
                    'details': str(e) if current_app.config.get('DEBUG') else 'Internal server error'
                }), 500
        finally:
            db.session.close()
    
    return wrapper

def get_or_create(model, **kwargs):
    """
    Get an existing object or create a new one
    Returns (instance, created) tuple
    """
    instance = model.query.filter_by(**kwargs).first()
    if instance:
        return instance, False
    else:
        instance = model(**kwargs)
        db.session.add(instance)
        return instance, True

def bulk_create(model, data_list):
    """
    Bulk create multiple objects efficiently
    """
    objects = [model(**data) for data in data_list]
    db.session.bulk_save_objects(objects)
    return objects

def safe_delete(instance):
    """
    Safely delete an instance with proper error handling
    """
    try:
        db.session.delete(instance)
        return True
    except Exception as e:
        current_app.logger.error(f"Failed to delete {instance}: {str(e)}")
        db.session.rollback()
        return False