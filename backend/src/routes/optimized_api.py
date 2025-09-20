"""
Enhanced API Route Optimizations for TalentSphere

Implements optimized endpoints with better caching, query optimization, and response compression.
"""

from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta
from sqlalchemy import or_, and_, desc, asc, func, text
from sqlalchemy.orm import joinedload, selectinload, contains_eager
import json
import hashlib

from src.models.user import db
from src.models.job import Job, JobCategory
from src.models.company import Company
from src.models.application import Application
from src.utils.cache import cache, cached, invalidate_cache
from src.utils.performance import (
    timed, QueryOptimizer, ResponseOptimizer, 
    optimize_query_with_cache, performance_monitor
)

optimized_api_bp = Blueprint('optimized_api', __name__)

@optimized_api_bp.route('/v2/jobs/search', methods=['GET'])
@timed
def optimized_job_search():
    """Highly optimized job search with caching and query optimization"""
    try:
        # Parse request parameters
        search = request.args.get('search', '').strip()
        category_id = request.args.get('category_id', type=int)
        location = request.args.get('location', '').strip()
        employment_type = request.args.get('employment_type')
        experience_level = request.args.get('experience_level')
        is_remote = request.args.get('is_remote', type=bool)
        is_featured = request.args.get('featured', type=bool)
        salary_min = request.args.get('salary_min', type=int)
        salary_max = request.args.get('salary_max', type=int)
        posted_within = request.args.get('posted_within', type=int)  # days
        
        # Pagination
        page = max(1, request.args.get('page', 1, type=int))
        per_page = min(50, max(1, request.args.get('per_page', 20, type=int)))
        
        # Response format
        minimal = request.args.get('minimal', type=bool, default=False)
        
        # Create cache key from parameters
        cache_params = {
            'search': search, 'category_id': category_id, 'location': location,
            'employment_type': employment_type, 'experience_level': experience_level,
            'is_remote': is_remote, 'is_featured': is_featured,
            'salary_min': salary_min, 'salary_max': salary_max,
            'posted_within': posted_within, 'page': page, 'per_page': per_page,
            'minimal': minimal
        }
        
        cache_key = f"job_search_v2:{hashlib.md5(json.dumps(cache_params, sort_keys=True).encode()).hexdigest()}"
        
        # Try cache first
        def search_query():
            # Build optimized query
            query = Job.query.filter(
                Job.status == 'published',
                Job.is_active == True,
                or_(Job.expires_at.is_(None), Job.expires_at > datetime.utcnow())
            )
            
            # Optimize joins based on what we need
            if search or location or category_id:
                query = query.options(
                    joinedload(Job.company),
                    joinedload(Job.category)
                )
            else:
                query = query.options(
                    selectinload(Job.company),
                    selectinload(Job.category)
                )
            
            # Apply filters with index-optimized conditions
            if search:
                # Use full-text search for PostgreSQL, fallback to LIKE for SQLite
                if 'postgresql' in str(db.engine.url):
                    search_vector = func.to_tsvector('english', 
                        func.coalesce(Job.title, '') + ' ' + 
                        func.coalesce(Job.description, '') + ' ' + 
                        func.coalesce(Job.required_skills, '')
                    )
                    search_query_ts = func.plainto_tsquery('english', search)
                    query = query.filter(search_vector.match(search_query_ts))
                else:
                    search_filter = or_(
                        Job.title.ilike(f'%{search}%'),
                        Job.description.ilike(f'%{search}%'),
                        Job.required_skills.ilike(f'%{search}%')
                    )
                    query = query.filter(search_filter)
            
            if category_id:
                query = query.filter(Job.category_id == category_id)
            
            if location:
                location_filter = or_(
                    Job.city.ilike(f'%{location}%'),
                    Job.state.ilike(f'%{location}%'),
                    Job.country.ilike(f'%{location}%')
                )
                query = query.filter(location_filter)
            
            if employment_type:
                query = query.filter(Job.employment_type == employment_type)
            
            if experience_level:
                query = query.filter(Job.experience_level == experience_level)
            
            if is_remote is not None:
                query = query.filter(Job.is_remote == is_remote)
            
            if is_featured:
                query = query.filter(Job.is_featured == True)
            
            if salary_min:
                query = query.filter(
                    or_(Job.salary_min >= salary_min, Job.salary_max >= salary_min)
                )
            
            if salary_max:
                query = query.filter(
                    or_(Job.salary_max <= salary_max, Job.salary_min <= salary_max)
                )
            
            if posted_within:
                cutoff_date = datetime.utcnow() - timedelta(days=posted_within)
                query = query.filter(Job.created_at >= cutoff_date)
            
            # Optimized ordering with index usage
            query = query.order_by(
                Job.is_featured.desc(),  # Featured first (indexed)
                Job.created_at.desc()     # Then by date (indexed)
            )
            
            # Get total count efficiently
            total_query = query.statement.with_only_columns([func.count()]).order_by(None)
            total = db.session.execute(total_query).scalar()
            
            # Paginate
            offset = (page - 1) * per_page
            jobs = query.offset(offset).limit(per_page).all()
            
            # Format response
            job_list = []
            for job in jobs:
                if minimal:
                    job_data = {
                        'id': job.id,
                        'title': job.title,
                        'company_name': job.company.name if job.company else job.external_company_name,
                        'company_logo': job.company.logo_url if job.company else job.external_company_logo,
                        'location': f"{job.city}, {job.state}" if job.city and job.state else 'Remote',
                        'employment_type': job.employment_type,
                        'is_featured': job.is_featured,
                        'is_remote': job.is_remote,
                        'salary_min': job.salary_min,
                        'salary_max': job.salary_max,
                        'salary_currency': job.salary_currency,
                        'posted_at': job.created_at.isoformat() if job.created_at else None,
                        'summary': job.summary
                    }
                else:
                    job_data = job.to_dict()
                    job_data['company'] = job.company.to_dict() if job.company else {
                        'name': job.external_company_name,
                        'logo_url': job.external_company_logo
                    }
                    job_data['category'] = job.category.to_dict() if job.category else None
                
                job_list.append(job_data)
            
            return {
                'jobs': job_list,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total,
                    'pages': (total + per_page - 1) // per_page,
                    'has_next': page * per_page < total,
                    'has_prev': page > 1
                },
                'filters_applied': {
                    'search': bool(search),
                    'category': bool(category_id),
                    'location': bool(location),
                    'employment_type': bool(employment_type),
                    'experience_level': bool(experience_level),
                    'is_remote': is_remote,
                    'is_featured': is_featured,
                    'salary_range': bool(salary_min or salary_max),
                    'posted_within': bool(posted_within)
                }
            }
        
        # Execute with caching
        result, from_cache = optimize_query_with_cache(
            cache_key, search_query, ttl=300
        )  # 5 minute cache
        
        result['performance'] = {
            'from_cache': from_cache,
            'cache_key': cache_key[:16] + '...',  # Truncated for debugging
            'minimal_response': minimal
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        current_app.logger.error(f"Optimized job search error: {str(e)}")
        return jsonify({
            'error': 'Failed to search jobs',
            'details': str(e)
        }), 500

@optimized_api_bp.route('/v2/jobs/<int:job_id>', methods=['GET'])
@timed
def optimized_get_job(job_id):
    """Optimized job details endpoint with caching"""
    try:
        include_stats = request.args.get('include_stats', type=bool, default=False)
        increment_views = request.args.get('increment_views', type=bool, default=True)
        
        cache_key = f"job_detail:{job_id}:{include_stats}"
        
        def get_job_details():
            # Optimized query with proper joins
            job = Job.query.options(
                joinedload(Job.company),
                joinedload(Job.category),
                joinedload(Job.poster)
            ).filter(
                Job.id == job_id,
                Job.status == 'published',
                Job.is_active == True
            ).first()
            
            if not job:
                return None
            
            # Increment view count asynchronously (don't wait for it)
            if increment_views:
                # Use raw SQL for better performance
                db.session.execute(
                    text("UPDATE jobs SET view_count = view_count + 1 WHERE id = :job_id"),
                    {'job_id': job_id}
                )
                db.session.commit()
            
            # Format response
            job_data = job.to_dict(include_details=True, include_stats=include_stats)
            job_data['company'] = job.company.to_dict(include_stats=True) if job.company else {
                'name': job.external_company_name,
                'logo_url': job.external_company_logo,
                'description': job.external_company_description
            }
            job_data['category'] = job.category.to_dict() if job.category else None
            job_data['poster'] = {
                'id': job.poster.id,
                'first_name': job.poster.first_name,
                'last_name': job.poster.last_name
            } if job.poster else None
            
            return job_data
        
        # Use cache for job details (shorter TTL since view count changes)
        result, from_cache = optimize_query_with_cache(
            cache_key, get_job_details, ttl=120
        )  # 2 minute cache
        
        if result is None:
            return jsonify({'error': 'Job not found'}), 404
        
        result['performance'] = {
            'from_cache': from_cache,
            'include_stats': include_stats
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        current_app.logger.error(f"Optimized get job error: {str(e)}")
        return jsonify({
            'error': 'Failed to get job details',
            'details': str(e)
        }), 500

# Cache invalidation endpoints
@optimized_api_bp.route('/v2/cache/invalidate', methods=['POST'])
def invalidate_api_cache():
    """Invalidate specific cache patterns"""
    try:
        data = request.get_json() or {}
        patterns = data.get('patterns', [])
        
        if not patterns:
            return jsonify({'error': 'No cache patterns specified'}), 400
        
        invalidated_count = 0
        for pattern in patterns:
            count = cache.delete_pattern(f"*{pattern}*")
            invalidated_count += count
        
        return jsonify({
            'message': 'Cache invalidated successfully',
            'patterns': patterns,
            'invalidated_keys': invalidated_count
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to invalidate cache',
            'details': str(e)
        }), 500