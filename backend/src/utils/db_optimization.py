"""
Database Connection Pool and Query Optimization for TalentSphere

Implements connection pooling, query batching, and database performance monitoring.
"""

from sqlalchemy import event, create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.pool import QueuePool
import time
import logging
import os
from contextlib import contextmanager

# Set up performance logging
performance_logger = logging.getLogger('performance')
performance_logger.setLevel(logging.INFO)

# Track slow queries
slow_queries = []
SLOW_QUERY_THRESHOLD = float(os.getenv('SLOW_QUERY_THRESHOLD', '1.0'))  # 1 second

@event.listens_for(Engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    """Start timing query execution"""
    conn.info.setdefault('query_start_time', []).append(time.time())

@event.listens_for(Engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    """Log slow queries and track performance"""
    total_time = time.time() - conn.info['query_start_time'].pop(-1)
    
    if total_time > SLOW_QUERY_THRESHOLD:
        # Log slow query
        slow_query_info = {
            'query': statement,
            'parameters': parameters,
            'duration': total_time,
            'timestamp': time.time()
        }
        slow_queries.append(slow_query_info)
        
        # Keep only last 100 slow queries
        if len(slow_queries) > 100:
            slow_queries.pop(0)
        
        performance_logger.warning(
            f"Slow query detected: {total_time:.3f}s - {statement[:200]}..."
        )

def create_optimized_engine(database_url: str):
    """Create SQLAlchemy engine with optimized settings"""
    
    # Connection pool settings
    pool_settings = {
        'poolclass': QueuePool,
        'pool_size': int(os.getenv('DB_POOL_SIZE', '10')),
        'max_overflow': int(os.getenv('DB_MAX_OVERFLOW', '20')),
        'pool_timeout': int(os.getenv('DB_POOL_TIMEOUT', '30')),
        'pool_recycle': int(os.getenv('DB_POOL_RECYCLE', '3600')),  # 1 hour
        'pool_pre_ping': True,  # Validate connections before use
    }
    
    # Engine settings
    engine_settings = {
        'echo': os.getenv('SQL_ECHO', 'false').lower() == 'true',
        'echo_pool': os.getenv('SQL_ECHO_POOL', 'false').lower() == 'true',
        'future': True,  # Use SQLAlchemy 2.0 style
    }
    
    # PostgreSQL specific optimizations
    if database_url.startswith(('postgresql://', 'postgres://')):
        connect_args = {
            'connect_timeout': 10,
            'application_name': 'TalentSphere',
            'options': '-c default_transaction_isolation=read_committed'
        }
        engine_settings['connect_args'] = connect_args
    
    # SQLite specific optimizations
    elif database_url.startswith('sqlite:'):
        connect_args = {
            'timeout': 20,
            'check_same_thread': False
        }
        engine_settings['connect_args'] = connect_args
        
        # Reduce pool size for SQLite
        pool_settings['pool_size'] = 5
        pool_settings['max_overflow'] = 10
    
    # Combine all settings
    all_settings = {**pool_settings, **engine_settings}
    
    # Create engine
    engine = create_engine(database_url, **all_settings)
    
    # SQLite pragma settings for performance
    if database_url.startswith('sqlite:'):
        @event.listens_for(engine, 'connect')
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            # Enable WAL mode for better concurrency
            cursor.execute('PRAGMA journal_mode=WAL')
            # Increase cache size (negative value = KB)
            cursor.execute('PRAGMA cache_size=-64000')  # 64MB
            # Disable synchronous writes for better performance (less safe)
            cursor.execute('PRAGMA synchronous=NORMAL')
            # Enable foreign key constraints
            cursor.execute('PRAGMA foreign_keys=ON')
            # Optimize for read-heavy workloads
            cursor.execute('PRAGMA temp_store=MEMORY')
            cursor.close()
    
    return engine

class QueryOptimizer:
    """Helper class for optimizing database queries"""
    
    @staticmethod
    def batch_load_relationships(instances, relationship_attr, batch_size=100):
        """Efficiently load relationships in batches to avoid N+1 queries"""
        from sqlalchemy.orm import sessionmaker
        from src.models.user import db
        
        if not instances:
            return
        
        # Get all unique IDs for the relationship
        relationship_ids = set()
        for instance in instances:
            rel_id = getattr(instance, f"{relationship_attr}_id", None)
            if rel_id:
                relationship_ids.add(rel_id)
        
        if not relationship_ids:
            return
        
        # Load relationships in batches
        relationship_ids_list = list(relationship_ids)
        for i in range(0, len(relationship_ids_list), batch_size):
            batch_ids = relationship_ids_list[i:i + batch_size]
            # This would need to be implemented based on specific relationships
            # Example: Company.query.filter(Company.id.in_(batch_ids)).all()
    
    @staticmethod
    def optimize_job_queries(query):
        """Optimize job queries with proper joins and loading"""
        from src.models.company import Company
        from src.models.job import JobCategory
        from sqlalchemy.orm import joinedload, selectinload
        
        # Use joinedload for many-to-one relationships
        query = query.options(
            joinedload('company'),
            joinedload('category'),
            selectinload('applications')  # Use selectinload for one-to-many
        )
        
        return query
    
    @staticmethod
    def optimize_application_queries(query):
        """Optimize application queries"""
        from sqlalchemy.orm import joinedload
        
        query = query.options(
            joinedload('job').joinedload('company'),
            joinedload('applicant')
        )
        
        return query

# Bulk operations helper
class BulkOperations:
    """Helper for efficient bulk database operations"""
    
    @staticmethod
    def bulk_update_view_counts(job_ids_and_counts):
        """Efficiently update multiple job view counts"""
        from src.models.user import db
        from src.models.job import Job
        from sqlalchemy import case
        
        if not job_ids_and_counts:
            return
        
        # Create a case statement for bulk update
        when_clauses = []
        job_ids = []
        
        for job_id, count in job_ids_and_counts:
            when_clauses.append((Job.id == job_id, Job.view_count + count))
            job_ids.append(job_id)
        
        # Execute bulk update
        db.session.execute(
            db.update(Job).where(Job.id.in_(job_ids)).values(
                view_count=case(*when_clauses, else_=Job.view_count)
            )
        )
        db.session.commit()
    
    @staticmethod
    def bulk_create_notifications(user_notifications):
        """Efficiently create multiple notifications"""
        from src.models.notification import Notification
        from src.models.user import db
        
        if not user_notifications:
            return
        
        # Prepare notification objects
        notifications = []
        for user_id, title, message, notification_type in user_notifications:
            notification = Notification(
                user_id=user_id,
                title=title,
                message=message,
                type=notification_type
            )
            notifications.append(notification)
        
        # Bulk insert
        db.session.bulk_save_objects(notifications)
        db.session.commit()
    
    @staticmethod
    def bulk_update_application_status(application_ids, new_status):
        """Efficiently update multiple application statuses"""
        from src.models.application import Application
        from src.models.user import db
        
        if not application_ids:
            return
        
        db.session.execute(
            db.update(Application)
            .where(Application.id.in_(application_ids))
            .values(status=new_status, updated_at=db.func.now())
        )
        db.session.commit()

# Database monitoring
def get_performance_stats():
    """Get database performance statistics"""
    from src.models.user import db
    
    stats = {
        'slow_queries_count': len(slow_queries),
        'recent_slow_queries': slow_queries[-10:] if slow_queries else [],
        'pool_status': {
            'pool_size': db.engine.pool.size(),
            'checked_in': db.engine.pool.checkedin(),
            'checked_out': db.engine.pool.checkedout(),
            'overflow': db.engine.pool.overflow(),
            'invalid': db.engine.pool.invalid()
        }
    }
    
    return stats

def clear_slow_queries():
    """Clear slow query tracking"""
    global slow_queries
    slow_queries.clear()

@contextmanager
def db_transaction():
    """Context manager for database transactions with automatic rollback on error"""
    from src.models.user import db
    
    try:
        yield db.session
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    finally:
        db.session.close()
