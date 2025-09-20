"""
Advanced Performance Optimization Utils for TalentSphere Backend

Implements request timing, memory monitoring, and advanced caching strategies.
"""

import time
import psutil
import os
import functools
from datetime import datetime, timedelta
from flask import request, g, jsonify
from typing import Dict, Any, Optional, List
import logging

# Setup performance logger
perf_logger = logging.getLogger('performance')
perf_logger.setLevel(logging.INFO)

class PerformanceMonitor:
    """Monitor and track API performance metrics"""
    
    def __init__(self):
        self.request_times = []
        self.slow_requests = []
        self.memory_usage = []
        self.slow_threshold = float(os.getenv('SLOW_REQUEST_THRESHOLD', '2.0'))  # 2 seconds
    
    def start_request_timing(self):
        """Start timing a request"""
        g.start_time = time.time()
        g.start_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB
    
    def end_request_timing(self, response):
        """End timing and log performance metrics"""
        if hasattr(g, 'start_time'):
            duration = time.time() - g.start_time
            endpoint = request.endpoint or 'unknown'
            method = request.method
            status_code = response.status_code
            
            # Memory usage
            current_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB
            memory_delta = current_memory - g.start_memory if hasattr(g, 'start_memory') else 0
            
            # Store metrics
            self.request_times.append({
                'endpoint': endpoint,
                'method': method,
                'duration': duration,
                'status_code': status_code,
                'memory_delta': memory_delta,
                'timestamp': datetime.utcnow()
            })
            
            # Track slow requests
            if duration > self.slow_threshold:
                slow_request = {
                    'endpoint': endpoint,
                    'method': method,
                    'duration': duration,
                    'url': request.url,
                    'args': dict(request.args),
                    'timestamp': datetime.utcnow()
                }
                self.slow_requests.append(slow_request)
                
                # Log slow request
                perf_logger.warning(
                    f"Slow request: {method} {endpoint} took {duration:.3f}s"
                )
            
            # Keep only last 1000 entries
            if len(self.request_times) > 1000:
                self.request_times = self.request_times[-1000:]
            
            if len(self.slow_requests) > 100:
                self.slow_requests = self.slow_requests[-100:]
        
        return response
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get performance statistics"""
        if not self.request_times:
            return {'message': 'No performance data available'}
        
        # Calculate statistics
        durations = [r['duration'] for r in self.request_times]
        avg_duration = sum(durations) / len(durations)
        max_duration = max(durations)
        min_duration = min(durations)
        
        # Get endpoint statistics
        endpoint_stats = {}
        for req in self.request_times:
            endpoint = req['endpoint']
            if endpoint not in endpoint_stats:
                endpoint_stats[endpoint] = {
                    'count': 0,
                    'total_duration': 0,
                    'max_duration': 0,
                    'avg_duration': 0
                }
            
            endpoint_stats[endpoint]['count'] += 1
            endpoint_stats[endpoint]['total_duration'] += req['duration']
            endpoint_stats[endpoint]['max_duration'] = max(
                endpoint_stats[endpoint]['max_duration'], 
                req['duration']
            )
        
        # Calculate averages
        for stats in endpoint_stats.values():
            stats['avg_duration'] = stats['total_duration'] / stats['count']
        
        return {
            'overall': {
                'total_requests': len(self.request_times),
                'avg_duration': avg_duration,
                'max_duration': max_duration,
                'min_duration': min_duration,
                'slow_requests_count': len(self.slow_requests)
            },
            'endpoint_stats': endpoint_stats,
            'recent_slow_requests': self.slow_requests[-10:],
            'system_stats': self.get_system_stats()
        }
    
    def get_system_stats(self) -> Dict[str, Any]:
        """Get current system performance stats"""
        try:
            process = psutil.Process()
            return {
                'cpu_percent': psutil.cpu_percent(interval=0.1),
                'memory_mb': process.memory_info().rss / 1024 / 1024,
                'memory_percent': process.memory_percent(),
                'disk_usage_percent': psutil.disk_usage('/').percent,
                'load_average': os.getloadavg() if hasattr(os, 'getloadavg') else None,
                'open_files': len(process.open_files()),
                'connections': len(process.connections())
            }
        except Exception as e:
            return {'error': f'Failed to get system stats: {str(e)}'}

# Global performance monitor
performance_monitor = PerformanceMonitor()

def performance_metrics(app):
    """Add performance monitoring to Flask app"""
    
    @app.before_request
    def before_request():
        performance_monitor.start_request_timing()
    
    @app.after_request
    def after_request(response):
        return performance_monitor.end_request_timing(response)
    
    @app.route('/api/performance', methods=['GET'])
    def get_performance_metrics():
        """Get performance metrics endpoint"""
        try:
            return jsonify(performance_monitor.get_performance_stats())
        except Exception as e:
            return jsonify({'error': f'Failed to get performance stats: {str(e)}'}), 500
    
    return app

def timed(func):
    """Decorator to time function execution"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        duration = time.time() - start_time
        
        # Log slow functions
        if duration > 1.0:  # 1 second threshold
            perf_logger.warning(f"Slow function: {func.__name__} took {duration:.3f}s")
        
        return result
    return wrapper

class QueryOptimizer:
    """Advanced query optimization utilities"""
    
    @staticmethod
    def optimize_job_search_query(query, filters: Dict[str, Any]):
        """Optimize job search queries with better indexing"""
        from src.models.job import Job
        from src.models.company import Company
        from sqlalchemy.orm import joinedload, contains_eager
        
        # Use contains_eager for better performance with joins
        if 'company_name' in filters or 'industry' in filters:
            query = query.join(Company).options(contains_eager(Job.company))
        else:
            # Use joinedload for simpler cases
            query = query.options(joinedload(Job.company))
        
        # Optimize for specific filter combinations
        if filters.get('is_featured'):
            # Featured jobs have better indexes
            query = query.filter(Job.is_featured == True)
        
        if filters.get('location'):
            # Use more efficient location filtering
            location = filters['location'].lower()
            query = query.filter(
                db.func.lower(db.func.concat(
                    db.func.coalesce(Job.city, ''), ' ',
                    db.func.coalesce(Job.state, ''), ' ',
                    db.func.coalesce(Job.country, '')
                )).like(f'%{location}%')
            )
        
        return query
    
    @staticmethod
    def batch_load_job_stats(job_ids: List[int]) -> Dict[int, Dict[str, Any]]:
        """Efficiently load job statistics in batch"""
        from src.models.application import Application
        from src.models.user import db
        from sqlalchemy import func
        
        if not job_ids:
            return {}
        
        # Single query to get application counts by status
        application_stats = db.session.query(
            Application.job_id,
            Application.status,
            func.count(Application.id).label('count')
        ).filter(
            Application.job_id.in_(job_ids)
        ).group_by(
            Application.job_id, Application.status
        ).all()
        
        # Organize stats by job_id
        stats_by_job = {}
        for job_id in job_ids:
            stats_by_job[job_id] = {
                'total_applications': 0,
                'new_applications': 0,
                'shortlisted': 0,
                'interviews': 0,
                'hired': 0
            }
        
        for stat in application_stats:
            job_id = stat.job_id
            status = stat.status
            count = stat.count
            
            stats_by_job[job_id]['total_applications'] += count
            
            if status == 'submitted':
                stats_by_job[job_id]['new_applications'] = count
            elif status == 'shortlisted':
                stats_by_job[job_id]['shortlisted'] = count
            elif status == 'interview':
                stats_by_job[job_id]['interviews'] = count
            elif status == 'hired':
                stats_by_job[job_id]['hired'] = count
        
        return stats_by_job

class ResponseOptimizer:
    """Optimize API response formats and sizes"""
    
    @staticmethod
    def compress_job_list(jobs: List[Dict[str, Any]], minimal: bool = False) -> List[Dict[str, Any]]:
        """Compress job list for better performance"""
        if minimal:
            # Minimal job data for search results
            return [{
                'id': job['id'],
                'title': job['title'],
                'company_name': job.get('company', {}).get('name') if job.get('company') else job.get('external_company_name'),
                'location': f"{job.get('city', '')}, {job.get('state', '')}" if job.get('city') else 'Remote',
                'employment_type': job.get('employment_type'),
                'is_featured': job.get('is_featured', False),
                'is_remote': job.get('is_remote', False),
                'salary_range': f"{job.get('salary_min', 0)}-{job.get('salary_max', 0)}" if job.get('salary_min') else None,
                'posted_at': job.get('created_at'),
                'company_logo': job.get('company', {}).get('logo_url') if job.get('company') else job.get('external_company_logo')
            } for job in jobs]
        
        return jobs
    
    @staticmethod
    def paginate_response(items: List[Any], page: int, per_page: int, total: int) -> Dict[str, Any]:
        """Create standardized pagination response"""
        return {
            'items': items,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page,
                'has_next': page * per_page < total,
                'has_prev': page > 1
            }
        }

def memory_usage():
    """Get current memory usage"""
    process = psutil.Process()
    return {
        'rss_mb': process.memory_info().rss / 1024 / 1024,
        'vms_mb': process.memory_info().vms / 1024 / 1024,
        'percent': process.memory_percent()
    }

def optimize_query_with_cache(cache_key: str, query_func, ttl: int = 300):
    """Optimize query with caching fallback"""
    from src.utils.cache import cache
    
    # Try cache first
    cached_result = cache.get(cache_key)
    if cached_result is not None:
        return cached_result, True
    
    # Execute query
    result = query_func()
    
    # Cache result
    cache.set(cache_key, result, ttl)
    
    return result, False

class ConnectionPoolMonitor:
    """Monitor database connection pool health"""
    
    @staticmethod
    def get_pool_stats():
        """Get connection pool statistics"""
        from src.models.user import db
        
        try:
            pool = db.engine.pool
            return {
                'size': pool.size(),
                'checked_in': pool.checkedin(),
                'checked_out': pool.checkedout(),
                'overflow': pool.overflow(),
                'invalid': pool.invalid(),
                'healthy': pool.checkedout() < pool.size() * 0.8  # Health check
            }
        except Exception as e:
            return {'error': str(e)}
    
    @staticmethod
    def is_pool_healthy():
        """Check if connection pool is healthy"""
        stats = ConnectionPoolMonitor.get_pool_stats()
        return stats.get('healthy', False)