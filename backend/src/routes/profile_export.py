"""
Profile export and optimization service
Provides PDF export, text generation, keyword suggestions, and profile tips
"""
from flask import Blueprint, jsonify, request, send_file
from src.models.user import User, db
from src.models.profile_extensions import (
    WorkExperience, Education, Certification, Project,
    Award, Language, VolunteerExperience, ProfessionalMembership
)
from src.routes.auth import token_required, role_required
from datetime import datetime
import json
import io
from collections import Counter
import re

profile_export_bp = Blueprint('profile_export', __name__)


# ==================== KEYWORD OPTIMIZATION ====================

def extract_keywords_from_text(text):
    """Extract potential keywords from text"""
    if not text:
        return []
    
    # Remove common words
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
                  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'were', 'been', 'be',
                  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
                  'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'}
    
    # Extract words (alphanumeric + common tech chars)
    words = re.findall(r'\b[a-zA-Z][a-zA-Z0-9+#\-\.]*\b', text.lower())
    keywords = [word for word in words if word not in stop_words and len(word) > 2]
    
    return keywords


def analyze_profile_keywords(user):
    """Analyze profile and suggest keywords for optimization"""
    try:
        all_text = []
        
        # Collect text from all profile sections
        if user.bio:
            all_text.append(user.bio)
        
        if user.job_seeker_profile:
            profile = user.job_seeker_profile
            if profile.professional_summary:
                all_text.append(profile.professional_summary)
            if profile.skills:
                try:
                    skills = json.loads(profile.skills) if isinstance(profile.skills, str) else profile.skills
                    all_text.extend(skills if isinstance(skills, list) else [])
                except:
                    pass
        
        # Work experience
        for exp in user.work_experiences.all():
            if exp.description:
                all_text.append(exp.description)
            if exp.key_responsibilities:
                try:
                    resp = json.loads(exp.key_responsibilities)
                    all_text.extend(resp)
                except:
                    pass
            if exp.achievements:
                try:
                    ach = json.loads(exp.achievements)
                    all_text.extend(ach)
                except:
                    pass
        
        # Extract and count keywords
        combined_text = ' '.join(all_text)
        keywords = extract_keywords_from_text(combined_text)
        keyword_counts = Counter(keywords)
        
        # Get top keywords
        top_keywords = keyword_counts.most_common(20)
        
        # Industry-specific keyword suggestions based on profile
        industry_keywords = {
            'software': ['agile', 'scrum', 'devops', 'ci/cd', 'microservices', 'api', 'cloud', 'aws', 'docker', 'kubernetes'],
            'marketing': ['seo', 'sem', 'analytics', 'campaign', 'brand', 'content', 'social media', 'conversion', 'roi'],
            'finance': ['analysis', 'budgeting', 'forecasting', 'compliance', 'risk management', 'financial modeling'],
            'design': ['ux', 'ui', 'wireframe', 'prototype', 'figma', 'adobe', 'responsive', 'accessibility'],
            'data': ['sql', 'python', 'machine learning', 'analytics', 'visualization', 'tableau', 'statistics']
        }
        
        # Suggest missing keywords based on user's field
        suggested_keywords = []
        if user.job_seeker_profile and user.job_seeker_profile.desired_position:
            position = user.job_seeker_profile.desired_position.lower()
            for category, keywords in industry_keywords.items():
                if category in position:
                    current_keywords = [k[0] for k in top_keywords]
                    missing = [kw for kw in keywords if kw not in current_keywords]
                    suggested_keywords.extend(missing[:5])
        
        return {
            'current_keywords': [{'keyword': k, 'count': c} for k, c in top_keywords],
            'suggested_keywords': suggested_keywords[:10],
            'keyword_density': len(set(keywords)),
            'total_words': len(combined_text.split())
        }
        
    except Exception as e:
        return {'error': str(e), 'current_keywords': [], 'suggested_keywords': []}


@profile_export_bp.route('/keywords-analysis', methods=['GET'])
@token_required
@role_required('job_seeker')
def get_keywords_analysis(current_user):
    """Get keyword analysis and suggestions for profile optimization"""
    try:
        analysis = analyze_profile_keywords(current_user)
        return jsonify(analysis), 200
    except Exception as e:
        return jsonify({'error': 'Failed to analyze keywords', 'details': str(e)}), 500


# ==================== PROFILE COMPLETENESS ====================

def calculate_comprehensive_completeness(user):
    """Calculate detailed profile completeness"""
    sections = {
        'basic_info': 0,
        'professional_summary': 0,
        'work_experience': 0,
        'education': 0,
        'skills': 0,
        'certifications': 0,
        'projects': 0,
        'professional_links': 0,
        'preferences': 0,
        'additional': 0
    }
    
    weights = {
        'basic_info': 15,
        'professional_summary': 10,
        'work_experience': 20,
        'education': 15,
        'skills': 15,
        'certifications': 5,
        'projects': 5,
        'professional_links': 5,
        'preferences': 5,
        'additional': 5
    }
    
    # Basic info (15%)
    basic_fields = [user.first_name, user.last_name, user.email, user.phone, user.location]
    sections['basic_info'] = sum(1 for f in basic_fields if f) / len(basic_fields)
    
    if user.job_seeker_profile:
        profile = user.job_seeker_profile
        
        # Professional summary (10%)
        if profile.professional_title and profile.professional_summary:
            sections['professional_summary'] = 1.0
        elif profile.professional_title or profile.professional_summary:
            sections['professional_summary'] = 0.5
        
        # Skills (15%)
        if profile.skills:
            try:
                skills_list = json.loads(profile.skills) if isinstance(profile.skills, str) else profile.skills
                if isinstance(skills_list, list) and len(skills_list) >= 5:
                    sections['skills'] = 1.0
                elif skills_list:
                    sections['skills'] = 0.5
            except:
                pass
        
        # Professional links (5%)
        links = [profile.resume_url, profile.linkedin_url, profile.portfolio_url, profile.github_url]
        sections['professional_links'] = sum(1 for l in links if l) / len(links)
        
        # Preferences (5%)
        prefs = [profile.desired_position, profile.preferred_location, profile.job_type_preference, 
                 profile.desired_salary_min, profile.availability]
        sections['preferences'] = sum(1 for p in prefs if p) / len(prefs)
    
    # Work experience (20%)
    exp_count = user.work_experiences.count()
    if exp_count >= 3:
        sections['work_experience'] = 1.0
    elif exp_count >= 1:
        sections['work_experience'] = exp_count / 3
    
    # Education (15%)
    edu_count = user.educations.count()
    if edu_count >= 1:
        sections['education'] = 1.0
    
    # Certifications (5%)
    cert_count = user.certifications.count()
    if cert_count >= 2:
        sections['certifications'] = 1.0
    elif cert_count == 1:
        sections['certifications'] = 0.5
    
    # Projects (5%)
    proj_count = user.projects.count()
    if proj_count >= 2:
        sections['projects'] = 1.0
    elif proj_count == 1:
        sections['projects'] = 0.5
    
    # Additional (5%) - languages, awards, volunteer, memberships
    additional_count = (user.languages.count() + user.awards.count() + 
                       user.volunteer_experiences.count() + user.professional_memberships.count())
    if additional_count >= 3:
        sections['additional'] = 1.0
    elif additional_count > 0:
        sections['additional'] = additional_count / 3
    
    # Calculate weighted total
    total_score = sum(sections[section] * weights[section] for section in sections)
    
    # Recommendations
    recommendations = []
    if sections['work_experience'] < 1.0:
        recommendations.append('Add more work experience entries with detailed achievements')
    if sections['skills'] < 1.0:
        recommendations.append('Add at least 5 relevant skills to your profile')
    if sections['professional_summary'] < 1.0:
        recommendations.append('Write a compelling professional summary (3-4 sentences)')
    if sections['education'] < 1.0:
        recommendations.append('Add your educational background')
    if sections['professional_links'] < 0.5:
        recommendations.append('Add links to your resume, LinkedIn, or portfolio')
    if sections['projects'] == 0:
        recommendations.append('Showcase your projects to stand out')
    
    return {
        'overall_score': round(total_score),
        'sections': {k: round(v * 100) for k, v in sections.items()},
        'section_weights': weights,
        'recommendations': recommendations,
        'strength': 'Excellent' if total_score >= 80 else 'Good' if total_score >= 60 else 'Needs Improvement'
    }


@profile_export_bp.route('/completeness-analysis', methods=['GET'])
@token_required
@role_required('job_seeker')
def get_completeness_analysis(current_user):
    """Get detailed profile completeness analysis"""
    try:
        analysis = calculate_comprehensive_completeness(current_user)
        
        # Update profile completeness in database
        if current_user.job_seeker_profile:
            current_user.job_seeker_profile.profile_completeness = analysis['overall_score']
            db.session.commit()
        
        return jsonify(analysis), 200
    except Exception as e:
        return jsonify({'error': 'Failed to analyze completeness', 'details': str(e)}), 500


# ==================== TEXT EXPORT ====================

def generate_text_profile(user):
    """Generate text version of profile"""
    lines = []
    
    # Header
    lines.append("=" * 80)
    lines.append(f"{user.first_name} {user.last_name}".center(80))
    
    if user.job_seeker_profile and user.job_seeker_profile.professional_title:
        lines.append(user.job_seeker_profile.professional_title.center(80))
    
    lines.append("=" * 80)
    lines.append("")
    
    # Contact Information
    lines.append("CONTACT INFORMATION")
    lines.append("-" * 80)
    lines.append(f"Email: {user.email}")
    if user.phone:
        lines.append(f"Phone: {user.phone}")
    if user.location:
        lines.append(f"Location: {user.location}")
    
    # Professional links
    if user.job_seeker_profile:
        profile = user.job_seeker_profile
        if profile.linkedin_url:
            lines.append(f"LinkedIn: {profile.linkedin_url}")
        if profile.github_url:
            lines.append(f"GitHub: {profile.github_url}")
        if profile.portfolio_url:
            lines.append(f"Portfolio: {profile.portfolio_url}")
        if profile.website_url:
            lines.append(f"Website: {profile.website_url}")
    
    lines.append("")
    
    # Professional Summary
    if user.job_seeker_profile and user.job_seeker_profile.professional_summary:
        lines.append("PROFESSIONAL SUMMARY")
        lines.append("-" * 80)
        lines.append(user.job_seeker_profile.professional_summary)
        lines.append("")
    
    # Work Experience
    work_experiences = user.work_experiences.order_by(WorkExperience.start_date.desc()).all()
    if work_experiences:
        lines.append("WORK EXPERIENCE")
        lines.append("-" * 80)
        for exp in work_experiences:
            lines.append(f"\n{exp.job_title} at {exp.company_name}")
            date_str = exp.start_date.strftime('%b %Y') if exp.start_date else ''
            if exp.is_current:
                date_str += " - Present"
            elif exp.end_date:
                date_str += f" - {exp.end_date.strftime('%b %Y')}"
            lines.append(f"{date_str} | {exp.company_location or ''}")
            
            if exp.description:
                lines.append(f"\n{exp.description}")
            
            if exp.key_responsibilities:
                try:
                    responsibilities = json.loads(exp.key_responsibilities)
                    lines.append("\nKey Responsibilities:")
                    for resp in responsibilities:
                        lines.append(f"  • {resp}")
                except:
                    pass
            
            if exp.achievements:
                try:
                    achievements = json.loads(exp.achievements)
                    lines.append("\nAchievements:")
                    for ach in achievements:
                        lines.append(f"  • {ach}")
                except:
                    pass
        lines.append("")
    
    # Education
    educations = user.educations.order_by(Education.graduation_date.desc()).all()
    if educations:
        lines.append("EDUCATION")
        lines.append("-" * 80)
        for edu in educations:
            lines.append(f"\n{edu.degree_title or edu.degree_type}")
            lines.append(f"{edu.institution_name}")
            if edu.graduation_date:
                lines.append(f"Graduated: {edu.graduation_date.strftime('%b %Y')}")
            if edu.gpa:
                lines.append(f"GPA: {edu.gpa}/{edu.gpa_scale}")
            if edu.honors:
                lines.append(f"Honors: {edu.honors}")
        lines.append("")
    
    # Skills
    if user.job_seeker_profile and user.job_seeker_profile.skills:
        lines.append("SKILLS")
        lines.append("-" * 80)
        try:
            skills = json.loads(user.job_seeker_profile.skills)
            lines.append(", ".join(skills))
        except:
            lines.append(user.job_seeker_profile.skills)
        lines.append("")
    
    # Certifications
    certs = user.certifications.order_by(Certification.issue_date.desc()).all()
    if certs:
        lines.append("CERTIFICATIONS")
        lines.append("-" * 80)
        for cert in certs:
            lines.append(f"\n{cert.name}")
            lines.append(f"Issuing Organization: {cert.issuing_organization}")
            if cert.issue_date:
                lines.append(f"Issue Date: {cert.issue_date.strftime('%b %Y')}")
            if cert.credential_id:
                lines.append(f"Credential ID: {cert.credential_id}")
        lines.append("")
    
    # Projects
    projects = user.projects.filter_by(is_featured=True).order_by(Project.display_order).all()
    if not projects:
        projects = user.projects.order_by(Project.display_order).limit(3).all()
    
    if projects:
        lines.append("FEATURED PROJECTS")
        lines.append("-" * 80)
        for proj in projects:
            lines.append(f"\n{proj.name}")
            if proj.role:
                lines.append(f"Role: {proj.role}")
            lines.append(f"\n{proj.description}")
            if proj.project_url:
                lines.append(f"URL: {proj.project_url}")
        lines.append("")
    
    # Job Preferences
    if user.job_seeker_profile:
        profile = user.job_seeker_profile
        lines.append("JOB PREFERENCES")
        lines.append("-" * 80)
        if profile.desired_position:
            lines.append(f"Desired Role: {profile.desired_position}")
        if profile.job_type_preference:
            lines.append(f"Job Type: {profile.job_type_preference}")
        if profile.preferred_location:
            lines.append(f"Preferred Location: {profile.preferred_location}")
        if profile.desired_salary_min and profile.desired_salary_max:
            lines.append(f"Salary Range: ${profile.desired_salary_min:,} - ${profile.desired_salary_max:,}")
        if profile.availability:
            lines.append(f"Availability: {profile.availability}")
        lines.append("")
    
    lines.append("=" * 80)
    lines.append(f"Generated on {datetime.utcnow().strftime('%B %d, %Y')}")
    lines.append("=" * 80)
    
    return "\n".join(lines)


@profile_export_bp.route('/export-text', methods=['GET'])
@token_required
@role_required('job_seeker')
def export_profile_text(current_user):
    """Export profile as text file"""
    try:
        text_content = generate_text_profile(current_user)
        
        # Create text file in memory
        text_io = io.BytesIO(text_content.encode('utf-8'))
        text_io.seek(0)
        
        filename = f"{current_user.first_name}_{current_user.last_name}_Profile.txt"
        
        return send_file(
            text_io,
            mimetype='text/plain',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        return jsonify({'error': 'Failed to export profile', 'details': str(e)}), 500


@profile_export_bp.route('/export-json', methods=['GET'])
@token_required
@role_required('job_seeker')
def export_profile_json(current_user):
    """Export complete profile as JSON"""
    try:
        profile_data = {
            'personal_info': {
                'first_name': current_user.first_name,
                'last_name': current_user.last_name,
                'email': current_user.email,
                'phone': current_user.phone,
                'location': current_user.location,
                'bio': current_user.bio
            },
            'job_seeker_profile': current_user.job_seeker_profile.to_dict() if current_user.job_seeker_profile else {},
            'work_experiences': [exp.to_dict() for exp in current_user.work_experiences.all()],
            'educations': [edu.to_dict() for edu in current_user.educations.all()],
            'certifications': [cert.to_dict() for cert in current_user.certifications.all()],
            'projects': [proj.to_dict() for proj in current_user.projects.all()],
            'awards': [award.to_dict() for award in current_user.awards.all()],
            'languages': [lang.to_dict() for lang in current_user.languages.all()],
            'volunteer_experiences': [exp.to_dict() for exp in current_user.volunteer_experiences.all()],
            'professional_memberships': [memb.to_dict() for memb in current_user.professional_memberships.all()],
            'exported_at': datetime.utcnow().isoformat(),
            'export_version': '2.0'
        }
        
        return jsonify(profile_data), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to export profile', 'details': str(e)}), 500


# ==================== PROFESSIONAL TIPS ====================

PROFILE_TIPS = {
    'professional_summary': [
        "Keep it concise (3-4 sentences) but impactful",
        "Start with your current role or professional identity",
        "Highlight your unique value proposition",
        "Include your years of experience and key achievements",
        "End with your career goals or what you're looking for"
    ],
    'work_experience': [
        "Use strong action verbs (Led, Developed, Implemented, Achieved)",
        "Quantify achievements with numbers, percentages, or metrics",
        "Focus on results and impact, not just responsibilities",
        "Tailor experiences to match your target roles",
        "List experiences in reverse chronological order"
    ],
    'skills': [
        "Include both technical and soft skills",
        "List skills relevant to your target positions",
        "Group similar skills together",
        "Keep the list updated with current technologies",
        "Be honest about your proficiency levels"
    ],
    'education': [
        "Include GPA if it's above 3.5",
        "Mention relevant coursework for entry-level positions",
        "Highlight academic honors and awards",
        "Include relevant extracurricular activities",
        "List certifications and professional development"
    ],
    'projects': [
        "Showcase projects that demonstrate key skills",
        "Include live links or repositories when possible",
        "Explain your specific role and contributions",
        "Highlight the technologies and tools used",
        "Describe measurable outcomes or impact"
    ],
    'general': [
        "Keep your profile updated regularly",
        "Use keywords from job descriptions you're interested in",
        "Proofread carefully for grammar and spelling errors",
        "Use a professional photo if the platform allows",
        "Get feedback from mentors or peers",
        "Aim for 80%+ profile completion for better visibility"
    ]
}


@profile_export_bp.route('/tips', methods=['GET'])
@token_required
def get_profile_tips(current_user):
    """Get professional tips for profile improvement"""
    section = request.args.get('section', 'general')
    
    if section not in PROFILE_TIPS:
        section = 'general'
    
    return jsonify({
        'section': section,
        'tips': PROFILE_TIPS[section],
        'all_sections': list(PROFILE_TIPS.keys())
    }), 200
