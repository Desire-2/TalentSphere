"""
Performance Cache System for TalentSphere

Implements Redis-based caching for frequently accessed data to reduce database load.
"""

import os
import json
import hashlib
from datetime import datetime, timedelta
from functools import wraps
from typing import Any, Optional, Dict, List

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    print("⚠️  Redis not installed. Install with: pip install redis")

class CacheManager:
    """Centralized cache management system"""
    
    def __init__(self):
        self.redis_client = None
        self.enabled = False
        self._initialize_redis()
    
    def _initialize_redis(self):
        """Initialize Redis connection"""
        if not REDIS_AVAILABLE:
            return
        
        try:
            redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            
            # Test connection
            self.redis_client.ping()
            self.enabled = True
            print("✅ Redis cache initialized successfully")
            
        except Exception as e:
            print(f"⚠️  Redis cache disabled: {str(e)}")
            self.enabled = False
    
    def _generate_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate cache key from arguments"""
        key_data = f"{prefix}:{args}:{sorted(kwargs.items())}"
        key_hash = hashlib.md5(key_data.encode()).hexdigest()[:12]
        return f"ts:{prefix}:{key_hash}"
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.enabled:
            return None
        
        try:
            value = self.redis_client.get(key)
            return json.loads(value) if value else None
        except Exception as e:
            print(f"Cache get error: {str(e)}")
            return None
    
    def set(self, key: str, value: Any, ttl: int = 300) -> bool:
        """Set value in cache with TTL (seconds)"""
        if not self.enabled:
            return False
        
        try:
            serialized_value = json.dumps(value, default=str)
            self.redis_client.setex(key, ttl, serialized_value)
            return True
        except Exception as e:
            print(f"Cache set error: {str(e)}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        if not self.enabled:
            return False
        
        try:
            self.redis_client.delete(key)
            return True
        except Exception as e:
            print(f"Cache delete error: {str(e)}")
            return False
    
    def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern"""
        if not self.enabled:
            return 0
        
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                return self.redis_client.delete(*keys)
            return 0
        except Exception as e:
            print(f"Cache pattern delete error: {str(e)}")
            return 0
    
    def clear_all(self) -> bool:
        """Clear all cache"""
        if not self.enabled:
            return False
        
        try:
            return self.redis_client.flushdb()
        except Exception as e:
            print(f"Cache clear error: {str(e)}")
            return False

# Global cache instance
cache = CacheManager()

def cached(prefix: str, ttl: int = 300, invalidate_on: Optional[List[str]] = None):
    """
    Decorator for caching function results
    
    Args:
        prefix: Cache key prefix
        ttl: Time to live in seconds
        invalidate_on: List of cache patterns to invalidate when this function is called
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = cache._generate_key(prefix, *args, **kwargs)
            
            # Try to get from cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute function
            result = func(*args, **kwargs)
            
            # Cache the result
            cache.set(cache_key, result, ttl)
            
            # Invalidate related cache patterns
            if invalidate_on:
                for pattern in invalidate_on:
                    cache.delete_pattern(f"ts:{pattern}:*")
            
            return result
        
        return wrapper
    return decorator

def invalidate_cache(patterns: List[str]):
    """Invalidate cache patterns"""
    for pattern in patterns:
        cache.delete_pattern(f"ts:{pattern}:*")

# Specific cache functions for TalentSphere

@cached("jobs_featured", ttl=600)  # 10 minutes
def get_cached_featured_jobs(limit: int = 10) -> List[Dict]:
    """Cache featured jobs"""
    from src.models.job import Job
    from src.models.company import Company
    from src.models.user import db
    from datetime import datetime
    
    featured_jobs = Job.query.join(Company).filter(
        Job.status == 'published',
        Job.is_active == True,
        Job.is_featured == True,
        Job.expires_at > datetime.utcnow()
    ).order_by(Job.created_at.desc()).limit(limit).all()
    
    return [job.to_dict() for job in featured_jobs]

@cached("job_categories", ttl=3600)  # 1 hour
def get_cached_job_categories(include_children: bool = False) -> List[Dict]:
    """Cache job categories"""
    from src.models.job import JobCategory
    
    categories = JobCategory.query.filter_by(is_active=True).order_by(
        JobCategory.display_order, JobCategory.name
    ).all()
    
    return [cat.to_dict(include_children=include_children) for cat in categories]

@cached("company_profile", ttl=1800)  # 30 minutes
def get_cached_company_profile(company_id: int) -> Optional[Dict]:
    """Cache company profile"""
    from src.models.company import Company
    
    company = Company.query.get(company_id)
    return company.to_dict(include_details=True) if company else None

@cached("employer_stats", ttl=900)  # 15 minutes
def get_cached_employer_stats(user_id: int, company_id: Optional[int] = None) -> Dict:
    """Cache employer dashboard statistics"""
    from src.models.job import Job
    from src.models.application import Application
    from src.models.user import db
    from sqlalchemy import func
    
    # Build base query for jobs
    if company_id:
        jobs_query = Job.query.filter_by(company_id=company_id)
    else:
        jobs_query = Job.query.filter_by(posted_by=user_id)
    
    job_ids = [job.id for job in jobs_query.all()]
    
    if not job_ids:
        return {
            'total_jobs': 0,
            'active_jobs': 0,
            'total_applications': 0,
            'new_applications': 0,
            'shortlisted_applications': 0,
            'interviews_scheduled': 0,
            'hires_made': 0
        }
    
    # Job statistics
    total_jobs = len(job_ids)
    active_jobs = jobs_query.filter_by(status='published').count()
    
    # Application statistics
    apps_query = Application.query.filter(Application.job_id.in_(job_ids))
    total_applications = apps_query.count()
    new_applications = apps_query.filter_by(status='submitted').count()
    shortlisted_applications = apps_query.filter_by(status='shortlisted').count()
    interviews_scheduled = apps_query.filter_by(interview_scheduled=True).count()
    hires_made = apps_query.filter_by(status='hired').count()
    
    return {
        'total_jobs': total_jobs,
        'active_jobs': active_jobs,
        'total_applications': total_applications,
        'new_applications': new_applications,
        'shortlisted_applications': shortlisted_applications,
        'interviews_scheduled': interviews_scheduled,
        'hires_made': hires_made
    }

@cached("job_search", ttl=300)  # 5 minutes
def get_cached_job_search(
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    location: Optional[str] = None,
    employment_type: Optional[str] = None,
    is_remote: Optional[bool] = None,
    page: int = 1,
    per_page: int = 20
) -> Dict:
    """Cache job search results"""
    from src.models.job import Job
    from src.models.company import Company
    from sqlalchemy import or_, desc
    
    # Build query
    query = Job.query.filter_by(status='published', is_active=True)
    
    # Apply filters
    if search:
        search_filter = or_(
            Job.title.ilike(f'%{search}%'),
            Job.description.ilike(f'%{search}%'),
            Job.summary.ilike(f'%{search}%'),
            Job.required_skills.ilike(f'%{search}%')
        )
        query = query.filter(search_filter)
    
    if category_id:
        query = query.filter_by(category_id=category_id)
    
    if location:
        location_filter = or_(
            Job.city.ilike(f'%{location}%'),
            Job.state.ilike(f'%{location}%'),
            Job.country.ilike(f'%{location}%')
        )
        query = query.filter(location_filter)
    
    if employment_type:
        query = query.filter_by(employment_type=employment_type)
    
    if is_remote is not None:
        query = query.filter_by(is_remote=is_remote)
    
    # Order and paginate
    query = query.order_by(Job.is_featured.desc(), Job.created_at.desc())
    jobs = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return {
        'jobs': [job.to_dict() for job in jobs.items],
        'total': jobs.total,
        'pages': jobs.pages,
        'current_page': page,
        'per_page': per_page
    }

# Cache invalidation helpers

def invalidate_job_caches(job_id: Optional[int] = None):
    """Invalidate job-related caches"""
    patterns = ['jobs_featured', 'job_search', 'employer_stats']
    if job_id:
        patterns.append(f'job_{job_id}')
    invalidate_cache(patterns)

def invalidate_user_caches(user_id: int):
    """Invalidate user-related caches"""
    patterns = [f'user_{user_id}', 'employer_stats']
    invalidate_cache(patterns)

def invalidate_company_caches(company_id: int):
    """Invalidate company-related caches"""
    patterns = [f'company_profile', 'employer_stats']
    invalidate_cache(patterns)
