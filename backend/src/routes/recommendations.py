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
def get_similar_jobs():
    """Get jobs similar to a given job with advanced matching - Public endpoint"""
    try:
        job_id = request.args.get('job_id', type=int)
        limit = min(request.args.get('limit', 10, type=int), 20)
        include_applied = request.args.get('include_applied', 'false').lower() == 'true'
        
        if not job_id:
            return jsonify({'error': 'job_id is required'}), 400
        
        # Get the reference job
        reference_job = Job.query.get(job_id)
        if not reference_job:
            return jsonify({'error': 'Job not found'}), 404
        
        # Try to get current user from token if available (optional)
        current_user = None
        try:
            from flask import current_app
            import jwt
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
                data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
                from src.models.user import User
                current_user = User.query.get(data['user_id'])
        except:
            # No authentication provided or invalid token - continue as anonymous user
            pass
        
        # Get user's applied job IDs if available to exclude them
        applied_job_ids = []
        bookmarked_job_ids = []
        if current_user and current_user.role == 'job_seeker' and not include_applied:
            applied_job_ids = [app.job_id for app in current_user.applications]
            bookmarked_job_ids = [bookmark.job_id for bookmark in JobBookmark.query.filter_by(user_id=current_user.id).all()]
        
        # Build base query for similar jobs with broader criteria
        similar_jobs_query = Job.query.filter(
            and_(
                Job.id != job_id,
                Job.status == 'published',
                Job.is_active == True,
                ~Job.id.in_(applied_job_ids) if applied_job_ids else True
            )
        )
        
        # Get more jobs to score (expanded search)
        all_similar_jobs = similar_jobs_query.limit(limit * 5).all()
        
        # Calculate enhanced similarity scores
        job_scores = []
        for job in all_similar_jobs:
            score = calculate_enhanced_job_similarity_score(reference_job, job)
            if score > 20:  # Only include jobs with reasonable similarity
                match_reasons = get_similarity_match_reasons(reference_job, job)
                job_scores.append((job, score, match_reasons))
        
        # Sort by similarity score and get top matches
        job_scores.sort(key=lambda x: x[1], reverse=True)
        top_similar_jobs = job_scores[:limit]
        
        recommendations = []
        for job, score, match_reasons in top_similar_jobs:
            job_data = job.to_dict()
            job_data['company'] = job.company.to_dict() if job.company else None
            job_data['category'] = job.category.to_dict() if job.category else None
            job_data['similarity_score'] = round(score, 1)
            job_data['match_reasons'] = match_reasons
            job_data['is_bookmarked'] = job.id in bookmarked_job_ids
            job_data['has_applied'] = job.id in applied_job_ids
            
            # Add enhanced fields for better display
            job_data['days_since_posted'] = (datetime.utcnow() - job.created_at).days
            if job.salary_min and job.salary_max:
                job_data['salary_range_formatted'] = f"${job.salary_min:,} - ${job.salary_max:,}"
            
            recommendations.append(job_data)
        
        # Enhanced response with more metadata
        response_data = {
            'success': True,
            'reference_job': {
                **reference_job.to_dict(),
                'company': reference_job.company.to_dict() if reference_job.company else None,
                'category': reference_job.category.to_dict() if reference_job.category else None
            },
            'similar_jobs': recommendations,
            'total_analyzed': len(all_similar_jobs),
            'total_matches': len(job_scores),
            'returned_count': len(recommendations),
            'search_metadata': {
                'excluded_applied': len(applied_job_ids),
                'excluded_bookmarked': len(bookmarked_job_ids),
                'min_similarity_threshold': 20
            }
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to get similar jobs', 
            'details': str(e)
        }), 500

def calculate_enhanced_job_similarity_score(job1, job2):
    """Calculate enhanced similarity score between two jobs using multiple factors"""
    score = 0
    
    # Category matching (25% weight)
    if job1.category_id == job2.category_id:
        score += 25
    elif job1.category and job2.category:
        # Partial category similarity based on category name similarity
        cat1_words = set(job1.category.name.lower().split())
        cat2_words = set(job2.category.name.lower().split())
        if cat1_words & cat2_words:  # If there's any word overlap
            score += 12.5
    
    # Title similarity (20% weight) - Enhanced with keyword matching
    title_score = calculate_title_similarity(job1.title, job2.title)
    score += title_score * 20
    
    # Skills matching (20% weight)
    skills_score = calculate_skills_similarity(job1, job2)
    score += skills_score * 20
    
    # Employment type matching (15% weight)
    if job1.employment_type == job2.employment_type:
        score += 15
    elif are_similar_employment_types(job1.employment_type, job2.employment_type):
        score += 7.5
    
    # Experience level matching (10% weight)
    if job1.experience_level == job2.experience_level:
        score += 10
    elif are_similar_experience_levels(job1.experience_level, job2.experience_level):
        score += 5
    
    # Location similarity (5% weight)
    location_score = calculate_location_similarity(job1, job2)
    score += location_score * 5
    
    # Salary range similarity (5% weight)
    salary_score = calculate_salary_similarity(job1, job2)
    score += salary_score * 5
    
    # Company similarity bonus (can add extra points)
    if job1.company_id == job2.company_id:
        score += 10  # Bonus for same company
    elif job1.company and job2.company and job1.company.industry == job2.company.industry:
        score += 3  # Small bonus for same industry
    
    return min(score, 100)

def calculate_title_similarity(title1, title2):
    """Calculate similarity between job titles using keyword matching"""
    if not title1 or not title2:
        return 0
    
    # Common job-related keywords and their weights
    important_keywords = {
        'senior': 0.8, 'junior': 0.8, 'lead': 0.9, 'principal': 0.9,
        'manager': 0.9, 'director': 0.9, 'head': 0.9, 'architect': 0.8,
        'developer': 0.9, 'engineer': 0.9, 'analyst': 0.8, 'specialist': 0.8,
        'consultant': 0.8, 'coordinator': 0.7, 'assistant': 0.7
    }
    
    title1_words = set(word.lower() for word in title1.split())
    title2_words = set(word.lower() for word in title2.split())
    
    common_words = title1_words & title2_words
    total_words = title1_words | title2_words
    
    if not total_words:
        return 0
    
    # Calculate weighted similarity
    weighted_matches = sum(important_keywords.get(word, 0.5) for word in common_words)
    max_possible_weight = sum(important_keywords.get(word, 0.5) for word in total_words)
    
    if max_possible_weight == 0:
        return len(common_words) / len(total_words)  # Fallback to simple ratio
    
    return weighted_matches / max_possible_weight

def calculate_skills_similarity(job1, job2):
    """Calculate similarity based on required skills"""
    skills1 = set()
    skills2 = set()
    
    # Extract skills from various fields
    if job1.required_skills:
        skills1.update(word.lower().strip() for word in job1.required_skills.replace(',', ' ').split())
    if job1.description:
        # Simple keyword extraction from description
        skills1.update(extract_skills_from_description(job1.description))
    
    if job2.required_skills:
        skills2.update(word.lower().strip() for word in job2.required_skills.replace(',', ' ').split())
    if job2.description:
        skills2.update(extract_skills_from_description(job2.description))
    
    if not skills1 or not skills2:
        return 0
    
    common_skills = skills1 & skills2
    total_unique_skills = skills1 | skills2
    
    return len(common_skills) / len(total_unique_skills) if total_unique_skills else 0

def extract_skills_from_description(description):
    """Extract common technical skills from job description"""
    if not description:
        return set()
    
    # Common technical skills to look for
    common_skills = {
        'python', 'javascript', 'java', 'react', 'node.js', 'sql', 'aws', 'docker',
        'kubernetes', 'git', 'html', 'css', 'typescript', 'mongodb', 'postgresql',
        'redis', 'linux', 'agile', 'scrum', 'rest', 'api', 'microservices',
        'machine learning', 'data analysis', 'excel', 'powerbi', 'tableau',
        'photoshop', 'figma', 'adobe', 'marketing', 'seo', 'google analytics'
    }
    
    description_lower = description.lower()
    found_skills = set()
    
    for skill in common_skills:
        if skill in description_lower:
            found_skills.add(skill)
    
    return found_skills

def are_similar_employment_types(type1, type2):
    """Check if employment types are similar"""
    similar_groups = [
        {'full-time', 'full_time'},
        {'part-time', 'part_time'},
        {'contract', 'freelance', 'temporary'},
        {'internship', 'co-op'}
    ]
    
    if not type1 or not type2:
        return False
    
    type1_lower = type1.lower().replace('-', '_')
    type2_lower = type2.lower().replace('-', '_')
    
    for group in similar_groups:
        if type1_lower in group and type2_lower in group:
            return True
    
    return False

def are_similar_experience_levels(level1, level2):
    """Check if experience levels are similar"""
    level_hierarchy = {
        'entry': 1, 'junior': 1, 'associate': 2, 'mid': 3, 'intermediate': 3,
        'senior': 4, 'lead': 5, 'principal': 5, 'staff': 5, 'manager': 5
    }
    
    if not level1 or not level2:
        return False
    
    level1_num = level_hierarchy.get(level1.lower(), 3)
    level2_num = level_hierarchy.get(level2.lower(), 3)
    
    return abs(level1_num - level2_num) <= 1

def calculate_location_similarity(job1, job2):
    """Calculate location similarity score"""
    # Remote work gets high similarity
    if job1.is_remote and job2.is_remote:
        return 1.0
    
    # One remote, one not - partial similarity
    if job1.is_remote or job2.is_remote:
        return 0.5
    
    # Same city gets full points
    if job1.city and job2.city and job1.city.lower() == job2.city.lower():
        return 1.0
    
    # Same state gets partial points
    if job1.state and job2.state and job1.state.lower() == job2.state.lower():
        return 0.6
    
    # Same country gets minimal points
    if job1.country and job2.country and job1.country.lower() == job2.country.lower():
        return 0.2
    
    return 0

def calculate_salary_similarity(job1, job2):
    """Calculate salary range similarity"""
    if not (job1.salary_min and job1.salary_max and job2.salary_min and job2.salary_max):
        return 0
    
    # Calculate overlap between salary ranges
    overlap_min = max(job1.salary_min, job2.salary_min)
    overlap_max = min(job1.salary_max, job2.salary_max)
    
    if overlap_min > overlap_max:
        return 0  # No overlap
    
    overlap_size = overlap_max - overlap_min
    range1_size = job1.salary_max - job1.salary_min
    range2_size = job2.salary_max - job2.salary_min
    avg_range_size = (range1_size + range2_size) / 2
    
    return overlap_size / avg_range_size if avg_range_size > 0 else 0

def get_similarity_match_reasons(job1, job2):
    """Get human-readable reasons why jobs are similar"""
    reasons = []
    
    if job1.category_id == job2.category_id:
        reasons.append(f"Same category: {job1.category.name if job1.category else 'N/A'}")
    
    if job1.employment_type == job2.employment_type:
        reasons.append(f"Same employment type: {job1.employment_type.replace('_', ' ').title()}")
    
    if job1.experience_level == job2.experience_level:
        reasons.append(f"Same experience level: {job1.experience_level.replace('_', ' ').title()}")
    
    if job1.is_remote and job2.is_remote:
        reasons.append("Both offer remote work")
    elif job1.city and job2.city and job1.city.lower() == job2.city.lower():
        reasons.append(f"Same location: {job1.city}")
    
    if job1.company_id == job2.company_id:
        reasons.append(f"Same company: {job1.company.name if job1.company else 'N/A'}")
    elif job1.company and job2.company and job1.company.industry == job2.company.industry:
        reasons.append(f"Same industry: {job1.company.industry}")
    
    # Add title similarity if significant
    title_sim = calculate_title_similarity(job1.title, job2.title)
    if title_sim > 0.5:
        reasons.append("Similar job titles")
    
    return reasons[:3]  # Return top 3 reasons

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

