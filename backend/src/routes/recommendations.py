from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from sqlalchemy import func, desc, and_, or_
import json
import re

from src.models.user import db
from src.models.job import Job, JobCategory, JobBookmark
from src.models.application import Application
from src.models.company import Company
from src.routes.auth import token_required, role_required

recommendations_bp = Blueprint('recommendations', __name__)

def calculate_job_match_score(job, user_profile):
    """Calculate job match score based on user profile"""
    score = 0
    max_score = 100
    
    if not user_profile:
        return 0
    
    # Skills matching (40% weight)
    if user_profile.skills and job.required_skills:
        try:
            user_skills = json.loads(user_profile.skills) if isinstance(user_profile.skills, str) else user_profile.skills
            job_skills = json.loads(job.required_skills) if isinstance(job.required_skills, str) else job.required_skills
            
            if user_skills and job_skills:
                matching_skills = set(skill.lower() for skill in user_skills) & set(skill.lower() for skill in job_skills)
                skill_score = (len(matching_skills) / len(job_skills)) * 40
                score += min(skill_score, 40)
        except:
            pass
    
    # Experience level matching (25% weight)
    if user_profile.years_of_experience and job.years_experience_min:
        exp_diff = abs(user_profile.years_of_experience - job.years_experience_min)
        if exp_diff <= 1:
            score += 25
        elif exp_diff <= 3:
            score += 15
        elif exp_diff <= 5:
            score += 10
    
    # Location matching (20% weight)
    if user_profile.preferred_location and job.city:
        if user_profile.preferred_location.lower() in job.city.lower() or job.city.lower() in user_profile.preferred_location.lower():
            score += 20
        elif job.is_remote:
            score += 15
    elif job.is_remote:
        score += 20
    
    # Job type preference matching (15% weight)
    if user_profile.job_type_preference and job.employment_type:
        if user_profile.job_type_preference.lower() == job.employment_type.lower():
            score += 15
        elif 'remote' in user_profile.job_type_preference.lower() and job.is_remote:
            score += 15
    
    return min(score, max_score)

@recommendations_bp.route('/recommendations/jobs', methods=['GET'])
@token_required
@role_required('job_seeker')
def get_job_recommendations(current_user):
    """Get personalized job recommendations"""
    try:
        limit = min(request.args.get('limit', 20, type=int), 50)
        
        # Get user profile
        profile = current_user.job_seeker_profile
        if not profile:
            return jsonify({'error': 'Job seeker profile not found'}), 404
        
        # Get jobs user hasn't applied to
        applied_job_ids = [app.job_id for app in current_user.applications]
        bookmarked_job_ids = [bookmark.job_id for bookmark in JobBookmark.query.filter_by(user_id=current_user.id).all()]
        
        # Get active jobs
        jobs_query = Job.query.filter(
            and_(
                Job.status == 'published',
                Job.is_active == True,
                ~Job.id.in_(applied_job_ids)
            )
        )
        
        # Apply basic filters based on user preferences
        if profile.preferred_location:
            jobs_query = jobs_query.filter(
                or_(
                    Job.city.ilike(f'%{profile.preferred_location}%'),
                    Job.state.ilike(f'%{profile.preferred_location}%'),
                    Job.is_remote == True
                )
            )
        
        if profile.job_type_preference:
            if 'remote' in profile.job_type_preference.lower():
                jobs_query = jobs_query.filter(Job.is_remote == True)
            else:
                jobs_query = jobs_query.filter(Job.employment_type.ilike(f'%{profile.job_type_preference}%'))
        
        if profile.desired_salary_min:
            jobs_query = jobs_query.filter(
                or_(
                    Job.salary_max >= profile.desired_salary_min,
                    Job.salary_min >= profile.desired_salary_min
                )
            )
        
        # Get jobs and calculate match scores
        jobs = jobs_query.limit(limit * 3).all()  # Get more jobs to score and filter
        
        job_scores = []
        for job in jobs:
            score = calculate_job_match_score(job, profile)
            if score > 20:  # Only include jobs with reasonable match
                job_scores.append((job, score))
        
        # Sort by score and limit results
        job_scores.sort(key=lambda x: x[1], reverse=True)
        top_jobs = job_scores[:limit]
        
        recommendations = []
        for job, score in top_jobs:
            job_data = job.to_dict()
            job_data['company'] = job.company.to_dict() if job.company else None
            job_data['category'] = job.category.to_dict() if job.category else None
            job_data['match_score'] = round(score, 1)
            job_data['is_bookmarked'] = job.id in bookmarked_job_ids
            
            # Add match reasons
            match_reasons = []
            if profile.skills and job.required_skills:
                try:
                    user_skills = json.loads(profile.skills) if isinstance(profile.skills, str) else profile.skills
                    job_skills = json.loads(job.required_skills) if isinstance(job.required_skills, str) else job.required_skills
                    if user_skills and job_skills:
                        matching_skills = set(skill.lower() for skill in user_skills) & set(skill.lower() for skill in job_skills)
                        if matching_skills:
                            match_reasons.append(f"Skills match: {', '.join(list(matching_skills)[:3])}")
                except:
                    pass
            
            if profile.preferred_location and job.city:
                if profile.preferred_location.lower() in job.city.lower():
                    match_reasons.append(f"Location match: {job.city}")
            
            if job.is_remote and ('remote' in (profile.job_type_preference or '').lower()):
                match_reasons.append("Remote work preference")
            
            job_data['match_reasons'] = match_reasons
            recommendations.append(job_data)
        
        return jsonify({
            'recommendations': recommendations,
            'total_analyzed': len(jobs),
            'profile_completeness': calculate_profile_completeness(profile)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get recommendations', 'details': str(e)}), 500

def calculate_profile_completeness(profile):
    """Calculate profile completeness percentage"""
    fields = [
        profile.desired_position,
        profile.skills,
        profile.years_of_experience,
        profile.education_level,
        profile.preferred_location,
        profile.job_type_preference,
        profile.resume_url
    ]
    
    completed_fields = sum(1 for field in fields if field)
    return round((completed_fields / len(fields)) * 100, 1)

@recommendations_bp.route('/recommendations/candidates', methods=['GET'])
@token_required
@role_required('employer', 'admin')
def get_candidate_recommendations(current_user):
    """Get candidate recommendations for a job"""
    try:
        job_id = request.args.get('job_id', type=int)
        limit = min(request.args.get('limit', 20, type=int), 50)
        
        if not job_id:
            return jsonify({'error': 'job_id is required'}), 400
        
        # Verify job exists and user has permission
        job = Job.query.get(job_id)
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        if current_user.role == 'employer' and job.posted_by != current_user.id:
            return jsonify({'error': 'You can only get recommendations for your own jobs'}), 403
        
        # Get candidates who haven't applied to this job
        applied_user_ids = [app.applicant_id for app in job.applications]
        
        # Get job seekers with profiles
        from src.models.user import User, JobSeekerProfile
        candidates_query = db.session.query(User, JobSeekerProfile).join(
            JobSeekerProfile, User.id == JobSeekerProfile.user_id
        ).filter(
            and_(
                User.role == 'job_seeker',
                User.is_active == True,
                JobSeekerProfile.open_to_opportunities == True,
                ~User.id.in_(applied_user_ids)
            )
        )
        
        # Apply basic filters
        if job.years_experience_min:
            candidates_query = candidates_query.filter(
                JobSeekerProfile.years_of_experience >= max(0, job.years_experience_min - 2)
            )
        
        candidates = candidates_query.limit(limit * 2).all()
        
        # Calculate match scores
        candidate_scores = []
        for user, profile in candidates:
            score = calculate_candidate_match_score(user, profile, job)
            if score > 30:  # Only include candidates with reasonable match
                candidate_scores.append((user, profile, score))
        
        # Sort by score and limit results
        candidate_scores.sort(key=lambda x: x[2], reverse=True)
        top_candidates = candidate_scores[:limit]
        
        recommendations = []
        for user, profile, score in top_candidates:
            candidate_data = user.to_dict()
            candidate_data['profile'] = profile.to_dict()
            candidate_data['match_score'] = round(score, 1)
            
            # Add match reasons
            match_reasons = []
            if profile.skills and job.required_skills:
                try:
                    user_skills = json.loads(profile.skills) if isinstance(profile.skills, str) else profile.skills
                    job_skills = json.loads(job.required_skills) if isinstance(job.required_skills, str) else job.required_skills
                    if user_skills and job_skills:
                        matching_skills = set(skill.lower() for skill in user_skills) & set(skill.lower() for skill in job_skills)
                        if matching_skills:
                            match_reasons.append(f"Skills match: {', '.join(list(matching_skills)[:3])}")
                except:
                    pass
            
            if profile.years_of_experience and job.years_experience_min:
                if profile.years_of_experience >= job.years_experience_min:
                    match_reasons.append(f"Experience: {profile.years_of_experience} years")
            
            if profile.preferred_location and job.city:
                if profile.preferred_location.lower() in job.city.lower():
                    match_reasons.append(f"Location preference: {profile.preferred_location}")
            
            candidate_data['match_reasons'] = match_reasons
            recommendations.append(candidate_data)
        
        return jsonify({
            'job': job.to_dict(),
            'recommendations': recommendations,
            'total_analyzed': len(candidates)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get candidate recommendations', 'details': str(e)}), 500

def calculate_candidate_match_score(user, profile, job):
    """Calculate candidate match score for a job"""
    score = 0
    
    # Skills matching (40% weight)
    if profile.skills and job.required_skills:
        try:
            user_skills = json.loads(profile.skills) if isinstance(profile.skills, str) else profile.skills
            job_skills = json.loads(job.required_skills) if isinstance(job.required_skills, str) else job.required_skills
            
            if user_skills and job_skills:
                matching_skills = set(skill.lower() for skill in user_skills) & set(skill.lower() for skill in job_skills)
                skill_score = (len(matching_skills) / len(job_skills)) * 40
                score += min(skill_score, 40)
        except:
            pass
    
    # Experience matching (30% weight)
    if profile.years_of_experience and job.years_experience_min:
        if profile.years_of_experience >= job.years_experience_min:
            score += 30
        elif profile.years_of_experience >= job.years_experience_min - 1:
            score += 20
        elif profile.years_of_experience >= job.years_experience_min - 2:
            score += 10
    
    # Location matching (20% weight)
    if profile.preferred_location and job.city:
        if profile.preferred_location.lower() in job.city.lower():
            score += 20
        elif job.is_remote:
            score += 15
    elif job.is_remote:
        score += 20
    
    # Availability matching (10% weight)
    if profile.availability:
        if 'immediate' in profile.availability.lower():
            score += 10
        elif 'week' in profile.availability.lower():
            score += 8
        elif 'month' in profile.availability.lower():
            score += 5
    
    return min(score, 100)

@recommendations_bp.route('/recommendations/similar-jobs', methods=['GET'])
@token_required
def get_similar_jobs(current_user):
    """Get jobs similar to a given job"""
    try:
        job_id = request.args.get('job_id', type=int)
        limit = min(request.args.get('limit', 10, type=int), 20)
        
        if not job_id:
            return jsonify({'error': 'job_id is required'}), 400
        
        # Get the reference job
        reference_job = Job.query.get(job_id)
        if not reference_job:
            return jsonify({'error': 'Job not found'}), 404
        
        # Find similar jobs
        similar_jobs_query = Job.query.filter(
            and_(
                Job.id != job_id,
                Job.status == 'published',
                Job.is_active == True
            )
        )
        
        # Filter by same category or company
        similar_jobs_query = similar_jobs_query.filter(
            or_(
                Job.category_id == reference_job.category_id,
                Job.company_id == reference_job.company_id
            )
        )
        
        similar_jobs = similar_jobs_query.limit(limit * 2).all()
        
        # Calculate similarity scores
        job_scores = []
        for job in similar_jobs:
            score = calculate_job_similarity_score(reference_job, job)
            job_scores.append((job, score))
        
        # Sort by similarity score
        job_scores.sort(key=lambda x: x[1], reverse=True)
        top_similar_jobs = job_scores[:limit]
        
        recommendations = []
        for job, score in top_similar_jobs:
            job_data = job.to_dict()
            job_data['company'] = job.company.to_dict() if job.company else None
            job_data['category'] = job.category.to_dict() if job.category else None
            job_data['similarity_score'] = round(score, 1)
            recommendations.append(job_data)
        
        return jsonify({
            'reference_job': reference_job.to_dict(),
            'similar_jobs': recommendations
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get similar jobs', 'details': str(e)}), 500

def calculate_job_similarity_score(job1, job2):
    """Calculate similarity score between two jobs"""
    score = 0
    
    # Same category (30% weight)
    if job1.category_id == job2.category_id:
        score += 30
    
    # Same company (20% weight)
    if job1.company_id == job2.company_id:
        score += 20
    
    # Similar employment type (15% weight)
    if job1.employment_type == job2.employment_type:
        score += 15
    
    # Similar experience level (15% weight)
    if job1.experience_level == job2.experience_level:
        score += 15
    
    # Similar location (10% weight)
    if job1.city == job2.city or (job1.is_remote and job2.is_remote):
        score += 10
    
    # Similar salary range (10% weight)
    if job1.salary_min and job1.salary_max and job2.salary_min and job2.salary_max:
        overlap = max(0, min(job1.salary_max, job2.salary_max) - max(job1.salary_min, job2.salary_min))
        range1 = job1.salary_max - job1.salary_min
        range2 = job2.salary_max - job2.salary_min
        if range1 > 0 and range2 > 0:
            similarity = overlap / max(range1, range2)
            score += similarity * 10
    
    return min(score, 100)

@recommendations_bp.route('/api-docs', methods=['GET'])
def get_api_documentation():
    """Get API documentation"""
    try:
        api_docs = {
            "title": "TalentSphere Job Portal API",
            "version": "1.0.0",
            "description": "Comprehensive job portal API with authentication, job management, applications, featured ads, and admin features",
            "base_url": "/api",
            "authentication": {
                "type": "Bearer Token (JWT)",
                "header": "Authorization: Bearer <token>",
                "endpoints": {
                    "register": "POST /auth/register",
                    "login": "POST /auth/login",
                    "refresh": "POST /auth/refresh-token"
                }
            },
            "endpoints": {
                "Authentication": {
                    "POST /auth/register": "Register new user",
                    "POST /auth/login": "User login",
                    "POST /auth/logout": "User logout",
                    "GET /auth/profile": "Get user profile",
                    "PUT /auth/profile": "Update user profile",
                    "POST /auth/change-password": "Change password",
                    "POST /auth/verify-token": "Verify JWT token",
                    "POST /auth/refresh-token": "Refresh JWT token"
                },
                "Jobs": {
                    "GET /jobs": "Get jobs with filtering and search",
                    "GET /jobs/{id}": "Get job details",
                    "POST /jobs": "Create job posting (employer)",
                    "PUT /jobs/{id}": "Update job posting (employer)",
                    "DELETE /jobs/{id}": "Delete job posting (employer)",
                    "GET /job-categories": "Get job categories",
                    "GET /my-jobs": "Get user's posted jobs (employer)",
                    "POST /jobs/{id}/bookmark": "Bookmark job (job seeker)",
                    "DELETE /jobs/{id}/bookmark": "Remove bookmark (job seeker)",
                    "GET /my-bookmarks": "Get bookmarked jobs (job seeker)"
                },
                "Applications": {
                    "POST /jobs/{id}/apply": "Apply for job (job seeker)",
                    "GET /applications/{id}": "Get application details",
                    "PUT /applications/{id}/status": "Update application status (employer)",
                    "POST /applications/{id}/interview": "Schedule interview (employer)",
                    "GET /my-applications": "Get user's applications (job seeker)",
                    "GET /jobs/{id}/applications": "Get job applications (employer)",
                    "POST /applications/{id}/withdraw": "Withdraw application (job seeker)",
                    "GET /application-stats": "Get application statistics"
                },
                "Companies": {
                    "GET /companies": "Get companies with filtering",
                    "GET /companies/{id}": "Get company details",
                    "POST /companies": "Create company (employer)",
                    "PUT /companies/{id}": "Update company (employer)",
                    "GET /companies/{id}/benefits": "Get company benefits",
                    "POST /companies/{id}/benefits": "Add company benefit (employer)",
                    "GET /companies/{id}/team": "Get company team members",
                    "POST /companies/{id}/team": "Add team member (employer)",
                    "GET /my-company": "Get user's company (employer)"
                },
                "Featured Ads": {
                    "GET /featured-ad-packages": "Get available packages",
                    "POST /featured-ad-packages": "Create package (admin)",
                    "POST /featured-ads": "Create featured ad (employer)",
                    "POST /payments/{id}/process": "Process payment",
                    "GET /featured-ads": "Get user's featured ads (employer)",
                    "GET /featured-ads/{id}/analytics": "Get ad analytics (employer)",
                    "GET /subscriptions": "Get subscription plans",
                    "GET /payments": "Get payment history",
                    "POST /featured-ads/{id}/pause": "Pause featured ad (employer)",
                    "POST /featured-ads/{id}/resume": "Resume featured ad (employer)"
                },
                "Notifications": {
                    "GET /notifications": "Get user notifications",
                    "POST /notifications/{id}/read": "Mark notification as read",
                    "POST /notifications/mark-all-read": "Mark all notifications as read",
                    "GET /messages": "Get user messages",
                    "POST /messages": "Send message",
                    "POST /messages/{id}/read": "Mark message as read",
                    "GET /conversations": "Get conversation list",
                    "GET /notification-preferences": "Get notification preferences",
                    "PUT /notification-preferences": "Update notification preferences",
                    "GET /notifications/stats": "Get notification statistics"
                },
                "Recommendations": {
                    "GET /recommendations/jobs": "Get job recommendations (job seeker)",
                    "GET /recommendations/candidates": "Get candidate recommendations (employer)",
                    "GET /recommendations/similar-jobs": "Get similar jobs"
                },
                "Admin": {
                    "GET /admin/dashboard": "Get admin dashboard overview",
                    "GET /admin/users": "Get users with filtering",
                    "POST /admin/users/{id}/toggle-status": "Toggle user status",
                    "GET /admin/jobs": "Get jobs for moderation",
                    "POST /admin/jobs/{id}/moderate": "Moderate job posting",
                    "GET /admin/companies": "Get companies for management",
                    "POST /admin/companies/{id}/verify": "Verify company",
                    "GET /admin/analytics/revenue": "Get revenue analytics",
                    "GET /admin/analytics/users": "Get user analytics",
                    "GET /admin/system-health": "Get system health metrics"
                }
            },
            "response_format": {
                "success": {
                    "status": "200-299",
                    "body": "JSON object with requested data"
                },
                "error": {
                    "status": "400-599",
                    "body": {
                        "error": "Error message",
                        "details": "Detailed error information (optional)"
                    }
                }
            },
            "pagination": {
                "parameters": {
                    "page": "Page number (default: 1)",
                    "per_page": "Items per page (default: 20, max: 100)"
                },
                "response": {
                    "pagination": {
                        "page": "Current page",
                        "per_page": "Items per page",
                        "total": "Total items",
                        "pages": "Total pages",
                        "has_next": "Has next page",
                        "has_prev": "Has previous page"
                    }
                }
            },
            "filtering": {
                "jobs": [
                    "search", "category_id", "company_id", "location", "employment_type",
                    "experience_level", "salary_min", "salary_max", "is_remote", "featured",
                    "posted_within", "sort_by", "sort_order"
                ],
                "companies": [
                    "industry", "company_size", "location", "search", "featured_only"
                ],
                "users": [
                    "role", "is_active", "is_verified", "search", "sort_by", "sort_order"
                ]
            }
        }
        
        return jsonify(api_docs), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get API documentation', 'details': str(e)}), 500

# Error handlers
@recommendations_bp.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400

@recommendations_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({'error': 'Unauthorized'}), 401

@recommendations_bp.errorhandler(403)
def forbidden(error):
    return jsonify({'error': 'Forbidden'}), 403

@recommendations_bp.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@recommendations_bp.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

