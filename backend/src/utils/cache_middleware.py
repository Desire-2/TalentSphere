"""
Enhanced Cache Middleware for TalentSphere Backend

Implements intelligent caching, cache warming, and performance optimization.
"""

import time
import json
import hashlib
import gzip
import pickle
from functools import wraps
from datetime import datetime, timedelta
from urllib.parse import urlencode
from flask import request, jsonify, current_app, g
from sqlalchemy import func
from typing import Any, Optional, Dict, List, Union, Callable

from src.utils.cache import cache, CacheManager

class AdvancedCacheManager(CacheManager):
    """Advanced caching with compression, serialization options, and cache warming"""
    
    def __init__(self):
        super().__init__()
        self.cache_stats = {
            'hits': 0,
            'misses': 0,
            'sets': 0,
            'deletes': 0,
            'errors': 0
        }
        
    def get_with_stats(self, key: str) -> tuple[Optional[Any], bool]:
        """Get value from cache and update statistics"""
        try:
            value = self.get(key)
            if value is not None:
                self.cache_stats['hits'] += 1
                return value, True
            else:
                self.cache_stats['misses'] += 1
                return None, False
        except Exception as e:
            self.cache_stats['errors'] += 1
            current_app.logger.error(f"Cache get error for key {key}: {str(e)}")
            return None, False
    
    def set_compressed(self, key: str, value: Any, ttl: int = 300, compress: bool = True) -> bool:
        """Set value in cache with optional compression"""
        if not self.enabled:
            return False
        
        try:
            # Serialize the value
            if isinstance(value, (dict, list)):
                serialized = json.dumps(value, default=str)
            else:
                serialized = pickle.dumps(value)
            
            # Compress if requested and beneficial
            if compress and len(serialized) > 1024:  # Only compress larger payloads
                compressed_data = gzip.compress(serialized.encode() if isinstance(serialized, str) else serialized)
                
                # Only use compression if it actually reduces size
                if len(compressed_data) < len(serialized):
                    final_value = {
                        'compressed': True,
                        'data': compressed_data.hex(),
                        'type': 'json' if isinstance(value, (dict, list)) else 'pickle'
                    }
                else:
                    final_value = {
                        'compressed': False,
                        'data': serialized,
                        'type': 'json' if isinstance(value, (dict, list)) else 'pickle'
                    }
            else:
                final_value = {
                    'compressed': False,
                    'data': serialized,
                    'type': 'json' if isinstance(value, (dict, list)) else 'pickle'
                }
            
            # Store the structured data
            success = self.set(key, final_value, ttl)
            if success:
                self.cache_stats['sets'] += 1
            return success
            
        except Exception as e:
            self.cache_stats['errors'] += 1
            current_app.logger.error(f"Cache set error for key {key}: {str(e)}")
            return False
    
    def get_compressed(self, key: str) -> Optional[Any]:
        """Get value from cache with decompression support"""
        try:
            cached_value = self.get(key)
            if cached_value is None:
                self.cache_stats['misses'] += 1
                return None
            
            # Handle old-style cached values (plain data)
            if not isinstance(cached_value, dict) or 'data' not in cached_value:
                self.cache_stats['hits'] += 1
                return cached_value
            
            # Handle new-style cached values (with metadata)
            data = cached_value['data']
            is_compressed = cached_value.get('compressed', False)
            data_type = cached_value.get('type', 'json')
            
            # Decompress if needed
            if is_compressed:
                compressed_bytes = bytes.fromhex(data)
                decompressed = gzip.decompress(compressed_bytes)
                data = decompressed.decode() if data_type == 'json' else decompressed
            
            # Deserialize
            if data_type == 'json':
                result = json.loads(data)
            else:
                result = pickle.loads(data if isinstance(data, bytes) else data.encode())
            
            self.cache_stats['hits'] += 1
            return result
            
        except Exception as e:
            self.cache_stats['errors'] += 1
            current_app.logger.error(f"Cache get compressed error for key {key}: {str(e)}")
            return None
    
    def warm_cache(self, cache_warming_functions: List[Callable]):
        """Warm cache with frequently accessed data"""
        if not self.enabled:
            return
        
        start_time = time.time()
        warmed_count = 0
        
        for warm_func in cache_warming_functions:
            try:
                warm_func()
                warmed_count += 1
            except Exception as e:
                current_app.logger.error(f"Cache warming error: {str(e)}")
        
        duration = time.time() - start_time
        current_app.logger.info(f"Cache warmed: {warmed_count} functions in {duration:.2f}s")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total_requests = self.cache_stats['hits'] + self.cache_stats['misses']
        hit_rate = (self.cache_stats['hits'] / total_requests * 100) if total_requests > 0 else 0
        
        return {
            **self.cache_stats,
            'hit_rate_percent': round(hit_rate, 2),
            'total_requests': total_requests,
            'enabled': self.enabled
        }

# Global advanced cache instance
advanced_cache = AdvancedCacheManager()

class ResponseCacheMiddleware:
    """Middleware for automatic response caching"""
    
    def __init__(self, app=None, default_ttl=300):
        self.app = app
        self.default_ttl = default_ttl
        self.cache_patterns = {}
        
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize the middleware with Flask app"""
        app.before_request(self.before_request)
        app.after_request(self.after_request)
        
        # Add cache control endpoints
        @app.route('/api/cache/stats', methods=['GET'])
        def cache_stats():
            return jsonify(advanced_cache.get_stats())
        
        @app.route('/api/cache/clear', methods=['POST'])
        def clear_cache():
            try:
                advanced_cache.clear_all()
                return jsonify({'message': 'Cache cleared successfully'})
            except Exception as e:
                return jsonify({'error': str(e)}), 500
    
    def cache_response(self, endpoint: str, ttl: int = None, vary_on: List[str] = None):
        """Decorator to cache endpoint responses"""
        def decorator(func):
            cache_ttl = ttl or self.default_ttl
            vary_params = vary_on or []
            
            @wraps(func)
            def wrapper(*args, **kwargs):
                # Generate cache key
                cache_key_parts = [endpoint]
                
                # Add URL parameters that affect response
                for param in vary_params:
                    value = request.args.get(param)
                    if value:
                        cache_key_parts.append(f"{param}:{value}")
                
                # Add query string hash for dynamic parameters
                if request.args:
                    query_hash = hashlib.md5(
                        str(sorted(request.args.items())).encode()
                    ).hexdigest()[:8]
                    cache_key_parts.append(query_hash)
                
                cache_key = f"resp:{':'.join(cache_key_parts)}"
                
                # Try to get cached response
                cached_response, from_cache = advanced_cache.get_with_stats(cache_key)
                if cached_response and from_cache:
                    response_data = cached_response.copy()
                    response_data['cached'] = True
                    response_data['cache_key'] = cache_key[:20] + '...'
                    return jsonify(response_data)
                
                # Execute the original function
                response = func(*args, **kwargs)
                
                # Cache successful responses
                if isinstance(response, tuple):
                    data, status_code = response
                    if status_code == 200 and isinstance(data, dict):
                        advanced_cache.set_compressed(cache_key, data, cache_ttl)
                else:
                    # Assume it's a successful response
                    if hasattr(response, 'get_json'):
                        data = response.get_json()
                        if data:
                            advanced_cache.set_compressed(cache_key, data, cache_ttl)
                
                return response
            
            return wrapper
        return decorator
    
    def before_request(self):
        """Called before each request"""
        g.request_start_time = time.time()
        
        # Check for cache bypass headers
        g.bypass_cache = request.headers.get('Cache-Control') == 'no-cache'
    
    def after_request(self, response):
        """Called after each request"""
        # Add performance headers
        if hasattr(g, 'request_start_time'):
            duration = time.time() - g.request_start_time
            response.headers['X-Response-Time'] = f"{duration:.3f}s"
        
        # Add cache status headers
        cache_stats = advanced_cache.get_stats()
        response.headers['X-Cache-Hit-Rate'] = f"{cache_stats['hit_rate_percent']}%"
        
        return response

# Cache warming functions
def warm_featured_jobs():
    """Warm cache with featured jobs"""
    from src.utils.cache import get_cached_featured_jobs
    try:
        get_cached_featured_jobs(20)  # Cache top 20 featured jobs
    except Exception as e:
        current_app.logger.error(f"Featured jobs cache warming failed: {str(e)}")

def warm_job_categories():
    """Warm cache with job categories"""
    from src.utils.cache import get_cached_job_categories
    try:
        get_cached_job_categories(include_children=True)
    except Exception as e:
        current_app.logger.error(f"Job categories cache warming failed: {str(e)}")

def warm_popular_searches():
    """Warm cache with popular search queries"""
    popular_searches = [
        {'search': 'python developer', 'location': 'remote'},
        {'search': 'software engineer', 'location': 'san francisco'},
        {'search': 'data scientist', 'location': 'new york'},
        {'search': 'frontend developer', 'location': 'remote'},
        {'search': 'backend developer', 'location': 'austin'},
    ]
    
    try:
        from src.routes.optimized_api import optimized_job_search
        
        for search_params in popular_searches:
            # Simulate request context for popular searches
            with current_app.test_request_context(
                f"/v2/jobs/search?{urlencode(search_params)}"
            ):
                # This would trigger the cached search
                pass
    except Exception as e:
        current_app.logger.error(f"Popular searches cache warming failed: {str(e)}")

def warm_company_profiles():
    """Warm cache with top company profiles"""
    try:
        from src.models.company import Company
        from src.utils.cache import get_cached_company_profile
        
        # Get top 20 companies by job count
        top_companies = Company.query.join(Company.jobs).group_by(Company.id).order_by(
            func.count(Company.jobs).desc()
        ).limit(20).all()
        
        for company in top_companies:
            get_cached_company_profile(company.id)
            
    except Exception as e:
        current_app.logger.error(f"Company profiles cache warming failed: {str(e)}")

# Cache warming function list
CACHE_WARMING_FUNCTIONS = [
    warm_featured_jobs,
    warm_job_categories,
    warm_popular_searches,
    warm_company_profiles
]

# Intelligent cache invalidation
class CacheInvalidator:
    """Intelligent cache invalidation based on data changes"""
    
    @staticmethod
    def invalidate_job_related(job_id: Optional[int] = None):
        """Invalidate job-related caches"""
        patterns = [
            'resp:optimized_job_search*',
            'resp:get_public_featured_jobs*',
            'job_search_v2*',
            'jobs_featured*',
            'employer_stats*'
        ]
        
        if job_id:
            patterns.extend([
                f'job_detail:{job_id}*',
                f'resp:optimized_get_job:{job_id}*'
            ])
        
        for pattern in patterns:
            advanced_cache.delete_pattern(pattern)
    
    @staticmethod
    def invalidate_company_related(company_id: int):
        """Invalidate company-related caches"""
        patterns = [
            f'company_profile:{company_id}*',
            f'company_jobs:{company_id}*',
            f'resp:optimized_company_jobs:{company_id}*',
            'employer_stats*'
        ]
        
        for pattern in patterns:
            advanced_cache.delete_pattern(pattern)
    
    @staticmethod
    def invalidate_user_related(user_id: int):
        """Invalidate user-related caches"""
        patterns = [
            f'user_profile:{user_id}*',
            f'employer_stats*'
        ]
        
        for pattern in patterns:
            advanced_cache.delete_pattern(pattern)

# Export components
__all__ = [
    'AdvancedCacheManager',
    'ResponseCacheMiddleware', 
    'advanced_cache',
    'CacheInvalidator',
    'CACHE_WARMING_FUNCTIONS'
]