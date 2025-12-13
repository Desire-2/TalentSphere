"""
API routes for extended job seeker profile management
Handles work experience, education, certifications, projects, awards, languages, volunteer work, and memberships
"""
from flask import Blueprint, jsonify, request
from src.models.user import User, db
from src.models.profile_extensions import (
    WorkExperience, Education, Certification, Project, 
    Award, Language, VolunteerExperience, ProfessionalMembership
)
from src.routes.auth import token_required, role_required
from datetime import datetime
import json

profile_extensions_bp = Blueprint('profile_extensions', __name__)


# ==================== WORK EXPERIENCE ROUTES ====================

@profile_extensions_bp.route('/work-experience', methods=['GET'])
@token_required
def get_work_experiences(current_user):
    """Get all work experiences for current user"""
    try:
        experiences = WorkExperience.query.filter_by(user_id=current_user.id)\
            .order_by(WorkExperience.display_order, WorkExperience.start_date.desc()).all()
        return jsonify([exp.to_dict() for exp in experiences]), 200
    except Exception as e:
        return jsonify({'error': 'Failed to get work experiences', 'details': str(e)}), 500


@profile_extensions_bp.route('/work-experience', methods=['POST'])
@token_required
@role_required('job_seeker')
def add_work_experience(current_user):
    """Add a new work experience"""
    try:
        data = request.get_json()
        
        # Parse dates
        start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date() if data.get('start_date') else None
        end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date() if data.get('end_date') else None
        
        experience = WorkExperience(
            user_id=current_user.id,
            job_title=data['job_title'],
            company_name=data['company_name'],
            company_location=data.get('company_location'),
            employment_type=data.get('employment_type'),
            start_date=start_date,
            end_date=end_date,
            is_current=data.get('is_current', False),
            description=data.get('description'),
            key_responsibilities=json.dumps(data.get('key_responsibilities', [])),
            achievements=json.dumps(data.get('achievements', [])),
            technologies_used=json.dumps(data.get('technologies_used', [])),
            display_order=data.get('display_order', 0)
        )
        
        db.session.add(experience)
        db.session.commit()
        
        return jsonify({
            'message': 'Work experience added successfully',
            'experience': experience.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to add work experience', 'details': str(e)}), 500


@profile_extensions_bp.route('/work-experience/<int:experience_id>', methods=['PUT'])
@token_required
def update_work_experience(current_user, experience_id):
    """Update a work experience"""
    try:
        experience = WorkExperience.query.filter_by(
            id=experience_id, user_id=current_user.id
        ).first_or_404()
        
        data = request.get_json()
        
        # Update fields
        if 'job_title' in data:
            experience.job_title = data['job_title']
        if 'company_name' in data:
            experience.company_name = data['company_name']
        if 'company_location' in data:
            experience.company_location = data['company_location']
        if 'employment_type' in data:
            experience.employment_type = data['employment_type']
        if 'start_date' in data:
            experience.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        if 'end_date' in data:
            experience.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date() if data['end_date'] else None
        if 'is_current' in data:
            experience.is_current = data['is_current']
        if 'description' in data:
            experience.description = data['description']
        if 'key_responsibilities' in data:
            experience.key_responsibilities = json.dumps(data['key_responsibilities'])
        if 'achievements' in data:
            experience.achievements = json.dumps(data['achievements'])
        if 'technologies_used' in data:
            experience.technologies_used = json.dumps(data['technologies_used'])
        if 'display_order' in data:
            experience.display_order = data['display_order']
        
        experience.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Work experience updated successfully',
            'experience': experience.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update work experience', 'details': str(e)}), 500


@profile_extensions_bp.route('/work-experience/<int:experience_id>', methods=['DELETE'])
@token_required
def delete_work_experience(current_user, experience_id):
    """Delete a work experience"""
    try:
        experience = WorkExperience.query.filter_by(
            id=experience_id, user_id=current_user.id
        ).first_or_404()
        
        db.session.delete(experience)
        db.session.commit()
        
        return jsonify({'message': 'Work experience deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete work experience', 'details': str(e)}), 500


# ==================== EDUCATION ROUTES ====================

@profile_extensions_bp.route('/education', methods=['GET'])
@token_required
def get_educations(current_user):
    """Get all education records for current user"""
    try:
        educations = Education.query.filter_by(user_id=current_user.id)\
            .order_by(Education.display_order, Education.graduation_date.desc()).all()
        return jsonify([edu.to_dict() for edu in educations]), 200
    except Exception as e:
        return jsonify({'error': 'Failed to get education records', 'details': str(e)}), 500


@profile_extensions_bp.route('/education', methods=['POST'])
@token_required
@role_required('job_seeker')
def add_education(current_user):
    """Add a new education record"""
    try:
        data = request.get_json()
        
        # Parse dates
        start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date() if data.get('start_date') else None
        end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date() if data.get('end_date') else None
        graduation_date = datetime.strptime(data['graduation_date'], '%Y-%m-%d').date() if data.get('graduation_date') else None
        
        education = Education(
            user_id=current_user.id,
            institution_name=data['institution_name'],
            institution_location=data.get('institution_location'),
            degree_type=data.get('degree_type'),
            field_of_study=data.get('field_of_study'),
            degree_title=data.get('degree_title'),
            start_date=start_date,
            end_date=end_date,
            graduation_date=graduation_date,
            is_current=data.get('is_current', False),
            gpa=data.get('gpa'),
            gpa_scale=data.get('gpa_scale', 4.0),
            honors=data.get('honors'),
            relevant_coursework=json.dumps(data.get('relevant_coursework', [])),
            activities=data.get('activities'),
            description=data.get('description'),
            display_order=data.get('display_order', 0)
        )
        
        db.session.add(education)
        db.session.commit()
        
        return jsonify({
            'message': 'Education added successfully',
            'education': education.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to add education', 'details': str(e)}), 500


@profile_extensions_bp.route('/education/<int:education_id>', methods=['PUT'])
@token_required
def update_education(current_user, education_id):
    """Update an education record"""
    try:
        education = Education.query.filter_by(
            id=education_id, user_id=current_user.id
        ).first_or_404()
        
        data = request.get_json()
        
        # Update fields
        for field in ['institution_name', 'institution_location', 'degree_type', 'field_of_study', 
                      'degree_title', 'is_current', 'gpa', 'gpa_scale', 'honors', 'activities', 
                      'description', 'display_order']:
            if field in data:
                setattr(education, field, data[field])
        
        if 'start_date' in data:
            education.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date() if data['start_date'] else None
        if 'end_date' in data:
            education.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date() if data['end_date'] else None
        if 'graduation_date' in data:
            education.graduation_date = datetime.strptime(data['graduation_date'], '%Y-%m-%d').date() if data['graduation_date'] else None
        if 'relevant_coursework' in data:
            education.relevant_coursework = json.dumps(data['relevant_coursework'])
        
        education.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Education updated successfully',
            'education': education.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update education', 'details': str(e)}), 500


@profile_extensions_bp.route('/education/<int:education_id>', methods=['DELETE'])
@token_required
def delete_education(current_user, education_id):
    """Delete an education record"""
    try:
        education = Education.query.filter_by(
            id=education_id, user_id=current_user.id
        ).first_or_404()
        
        db.session.delete(education)
        db.session.commit()
        
        return jsonify({'message': 'Education deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete education', 'details': str(e)}), 500


# ==================== CERTIFICATION ROUTES ====================

@profile_extensions_bp.route('/certifications', methods=['GET'])
@token_required
def get_certifications(current_user):
    """Get all certifications for current user"""
    try:
        certs = Certification.query.filter_by(user_id=current_user.id)\
            .order_by(Certification.display_order, Certification.issue_date.desc()).all()
        return jsonify([cert.to_dict() for cert in certs]), 200
    except Exception as e:
        return jsonify({'error': 'Failed to get certifications', 'details': str(e)}), 500


@profile_extensions_bp.route('/certifications', methods=['POST'])
@token_required
@role_required('job_seeker')
def add_certification(current_user):
    """Add a new certification"""
    try:
        data = request.get_json()
        
        issue_date = datetime.strptime(data['issue_date'], '%Y-%m-%d').date() if data.get('issue_date') else None
        expiry_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date() if data.get('expiry_date') else None
        
        certification = Certification(
            user_id=current_user.id,
            name=data['name'],
            issuing_organization=data['issuing_organization'],
            credential_id=data.get('credential_id'),
            credential_url=data.get('credential_url'),
            issue_date=issue_date,
            expiry_date=expiry_date,
            does_not_expire=data.get('does_not_expire', False),
            description=data.get('description'),
            skills_acquired=json.dumps(data.get('skills_acquired', [])),
            display_order=data.get('display_order', 0)
        )
        
        db.session.add(certification)
        db.session.commit()
        
        return jsonify({
            'message': 'Certification added successfully',
            'certification': certification.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to add certification', 'details': str(e)}), 500


@profile_extensions_bp.route('/certifications/<int:cert_id>', methods=['PUT'])
@token_required
def update_certification(current_user, cert_id):
    """Update a certification"""
    try:
        cert = Certification.query.filter_by(id=cert_id, user_id=current_user.id).first_or_404()
        data = request.get_json()
        
        for field in ['name', 'issuing_organization', 'credential_id', 'credential_url', 
                      'does_not_expire', 'description', 'display_order']:
            if field in data:
                setattr(cert, field, data[field])
        
        if 'issue_date' in data:
            cert.issue_date = datetime.strptime(data['issue_date'], '%Y-%m-%d').date() if data['issue_date'] else None
        if 'expiry_date' in data:
            cert.expiry_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date() if data['expiry_date'] else None
        if 'skills_acquired' in data:
            cert.skills_acquired = json.dumps(data['skills_acquired'])
        
        cert.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Certification updated successfully', 'certification': cert.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update certification', 'details': str(e)}), 500


@profile_extensions_bp.route('/certifications/<int:cert_id>', methods=['DELETE'])
@token_required
def delete_certification(current_user, cert_id):
    """Delete a certification"""
    try:
        cert = Certification.query.filter_by(id=cert_id, user_id=current_user.id).first_or_404()
        db.session.delete(cert)
        db.session.commit()
        return jsonify({'message': 'Certification deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete certification', 'details': str(e)}), 500


# ==================== PROJECT ROUTES ====================

@profile_extensions_bp.route('/projects', methods=['GET'])
@token_required
def get_projects(current_user):
    """Get all projects for current user"""
    try:
        projects = Project.query.filter_by(user_id=current_user.id)\
            .order_by(Project.is_featured.desc(), Project.display_order, Project.start_date.desc()).all()
        return jsonify([proj.to_dict() for proj in projects]), 200
    except Exception as e:
        return jsonify({'error': 'Failed to get projects', 'details': str(e)}), 500


@profile_extensions_bp.route('/projects', methods=['POST'])
@token_required
@role_required('job_seeker')
def add_project(current_user):
    """Add a new project"""
    try:
        data = request.get_json()
        
        start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date() if data.get('start_date') else None
        end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date() if data.get('end_date') else None
        
        project = Project(
            user_id=current_user.id,
            name=data['name'],
            description=data['description'],
            role=data.get('role'),
            project_url=data.get('project_url'),
            github_url=data.get('github_url'),
            demo_url=data.get('demo_url'),
            start_date=start_date,
            end_date=end_date,
            is_ongoing=data.get('is_ongoing', False),
            technologies_used=json.dumps(data.get('technologies_used', [])),
            key_features=json.dumps(data.get('key_features', [])),
            outcomes=data.get('outcomes'),
            team_size=data.get('team_size'),
            images=json.dumps(data.get('images', [])),
            display_order=data.get('display_order', 0),
            is_featured=data.get('is_featured', False)
        )
        
        db.session.add(project)
        db.session.commit()
        
        return jsonify({'message': 'Project added successfully', 'project': project.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to add project', 'details': str(e)}), 500


@profile_extensions_bp.route('/projects/<int:project_id>', methods=['PUT'])
@token_required
def update_project(current_user, project_id):
    """Update a project"""
    try:
        project = Project.query.filter_by(id=project_id, user_id=current_user.id).first_or_404()
        data = request.get_json()
        
        for field in ['name', 'description', 'role', 'project_url', 'github_url', 'demo_url', 
                      'is_ongoing', 'outcomes', 'team_size', 'display_order', 'is_featured']:
            if field in data:
                setattr(project, field, data[field])
        
        if 'start_date' in data:
            project.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date() if data['start_date'] else None
        if 'end_date' in data:
            project.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date() if data['end_date'] else None
        if 'technologies_used' in data:
            project.technologies_used = json.dumps(data['technologies_used'])
        if 'key_features' in data:
            project.key_features = json.dumps(data['key_features'])
        if 'images' in data:
            project.images = json.dumps(data['images'])
        
        project.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Project updated successfully', 'project': project.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update project', 'details': str(e)}), 500


@profile_extensions_bp.route('/projects/<int:project_id>', methods=['DELETE'])
@token_required
def delete_project(current_user, project_id):
    """Delete a project"""
    try:
        project = Project.query.filter_by(id=project_id, user_id=current_user.id).first_or_404()
        db.session.delete(project)
        db.session.commit()
        return jsonify({'message': 'Project deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete project', 'details': str(e)}), 500


# ==================== AWARDS, LANGUAGES, VOLUNTEER, MEMBERSHIPS (Similar pattern) ====================
# Implementing the same CRUD pattern for remaining entities

@profile_extensions_bp.route('/awards', methods=['GET'])
@token_required
def get_awards(current_user):
    try:
        awards = Award.query.filter_by(user_id=current_user.id)\
            .order_by(Award.display_order, Award.date_received.desc()).all()
        return jsonify([award.to_dict() for award in awards]), 200
    except Exception as e:
        return jsonify({'error': 'Failed to get awards', 'details': str(e)}), 500


@profile_extensions_bp.route('/awards', methods=['POST'])
@token_required
@role_required('job_seeker')
def add_award(current_user):
    try:
        data = request.get_json()
        date_received = datetime.strptime(data['date_received'], '%Y-%m-%d').date() if data.get('date_received') else None
        
        award = Award(
            user_id=current_user.id,
            title=data['title'],
            issuer=data['issuer'],
            date_received=date_received,
            description=data.get('description'),
            award_url=data.get('award_url'),
            certificate_url=data.get('certificate_url'),
            display_order=data.get('display_order', 0)
        )
        
        db.session.add(award)
        db.session.commit()
        
        return jsonify({'message': 'Award added successfully', 'award': award.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to add award', 'details': str(e)}), 500


@profile_extensions_bp.route('/awards/<int:award_id>', methods=['PUT'])
@token_required
def update_award(current_user, award_id):
    """Update an award"""
    try:
        award = Award.query.filter_by(id=award_id, user_id=current_user.id).first_or_404()
        data = request.get_json()
        
        for field in ['title', 'issuer', 'description', 'award_url', 'certificate_url', 'display_order']:
            if field in data:
                setattr(award, field, data[field])
        
        if 'date_received' in data:
            award.date_received = datetime.strptime(data['date_received'], '%Y-%m-%d').date() if data['date_received'] else None
        
        award.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Award updated successfully', 'award': award.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update award', 'details': str(e)}), 500


@profile_extensions_bp.route('/awards/<int:award_id>', methods=['DELETE'])
@token_required
def delete_award(current_user, award_id):
    """Delete an award"""
    try:
        award = Award.query.filter_by(id=award_id, user_id=current_user.id).first_or_404()
        db.session.delete(award)
        db.session.commit()
        return jsonify({'message': 'Award deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete award', 'details': str(e)}), 500


@profile_extensions_bp.route('/languages', methods=['GET'])
@token_required
def get_languages(current_user):
    try:
        languages = Language.query.filter_by(user_id=current_user.id)\
            .order_by(Language.display_order).all()
        return jsonify([lang.to_dict() for lang in languages]), 200
    except Exception as e:
        return jsonify({'error': 'Failed to get languages', 'details': str(e)}), 500


@profile_extensions_bp.route('/languages', methods=['POST'])
@token_required
@role_required('job_seeker')
def add_language(current_user):
    try:
        data = request.get_json()
        
        language = Language(
            user_id=current_user.id,
            language=data['language'],
            proficiency_level=data['proficiency_level'],
            certification=data.get('certification'),
            certification_score=data.get('certification_score'),
            display_order=data.get('display_order', 0)
        )
        
        db.session.add(language)
        db.session.commit()
        
        return jsonify({'message': 'Language added successfully', 'language': language.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to add language', 'details': str(e)}), 500


@profile_extensions_bp.route('/languages/<int:language_id>', methods=['PUT'])
@token_required
def update_language(current_user, language_id):
    """Update a language"""
    try:
        language = Language.query.filter_by(id=language_id, user_id=current_user.id).first_or_404()
        data = request.get_json()
        
        for field in ['language', 'proficiency_level', 'certification', 'certification_score', 'display_order']:
            if field in data:
                setattr(language, field, data[field])
        
        language.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Language updated successfully', 'language': language.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update language', 'details': str(e)}), 500


@profile_extensions_bp.route('/languages/<int:language_id>', methods=['DELETE'])
@token_required
def delete_language(current_user, language_id):
    """Delete a language"""
    try:
        language = Language.query.filter_by(id=language_id, user_id=current_user.id).first_or_404()
        db.session.delete(language)
        db.session.commit()
        return jsonify({'message': 'Language deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete language', 'details': str(e)}), 500


@profile_extensions_bp.route('/volunteer-experience', methods=['GET'])
@token_required
def get_volunteer_experiences(current_user):
    try:
        experiences = VolunteerExperience.query.filter_by(user_id=current_user.id)\
            .order_by(VolunteerExperience.display_order, VolunteerExperience.start_date.desc()).all()
        return jsonify([exp.to_dict() for exp in experiences]), 200
    except Exception as e:
        return jsonify({'error': 'Failed to get volunteer experiences', 'details': str(e)}), 500


@profile_extensions_bp.route('/volunteer-experience', methods=['POST'])
@token_required
@role_required('job_seeker')
def add_volunteer_experience(current_user):
    try:
        data = request.get_json()
        
        start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date() if data.get('start_date') else None
        end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date() if data.get('end_date') else None
        
        experience = VolunteerExperience(
            user_id=current_user.id,
            organization=data['organization'],
            role=data['role'],
            cause=data.get('cause'),
            start_date=start_date,
            end_date=end_date,
            is_current=data.get('is_current', False),
            description=data.get('description'),
            responsibilities=json.dumps(data.get('responsibilities', [])),
            impact=data.get('impact'),
            display_order=data.get('display_order', 0)
        )
        
        db.session.add(experience)
        db.session.commit()
        
        return jsonify({'message': 'Volunteer experience added successfully', 'experience': experience.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to add volunteer experience', 'details': str(e)}), 500


@profile_extensions_bp.route('/volunteer-experience/<int:experience_id>', methods=['PUT'])
@token_required
def update_volunteer_experience(current_user, experience_id):
    """Update volunteer experience"""
    try:
        experience = VolunteerExperience.query.filter_by(id=experience_id, user_id=current_user.id).first_or_404()
        data = request.get_json()
        
        for field in ['organization', 'role', 'cause', 'is_current', 'description', 'impact', 'display_order']:
            if field in data:
                setattr(experience, field, data[field])
        
        if 'start_date' in data:
            experience.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date() if data['start_date'] else None
        if 'end_date' in data:
            experience.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date() if data['end_date'] else None
        if 'responsibilities' in data:
            experience.responsibilities = json.dumps(data['responsibilities'])
        
        experience.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Volunteer experience updated successfully', 'experience': experience.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update volunteer experience', 'details': str(e)}), 500


@profile_extensions_bp.route('/volunteer-experience/<int:experience_id>', methods=['DELETE'])
@token_required
def delete_volunteer_experience(current_user, experience_id):
    """Delete volunteer experience"""
    try:
        experience = VolunteerExperience.query.filter_by(id=experience_id, user_id=current_user.id).first_or_404()
        db.session.delete(experience)
        db.session.commit()
        return jsonify({'message': 'Volunteer experience deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete volunteer experience', 'details': str(e)}), 500


@profile_extensions_bp.route('/professional-memberships', methods=['GET'])
@token_required
def get_professional_memberships(current_user):
    try:
        memberships = ProfessionalMembership.query.filter_by(user_id=current_user.id)\
            .order_by(ProfessionalMembership.is_current.desc(), ProfessionalMembership.start_date.desc()).all()
        return jsonify([memb.to_dict() for memb in memberships]), 200
    except Exception as e:
        return jsonify({'error': 'Failed to get memberships', 'details': str(e)}), 500


@profile_extensions_bp.route('/professional-memberships', methods=['POST'])
@token_required
@role_required('job_seeker')
def add_professional_membership(current_user):
    try:
        data = request.get_json()
        
        start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date() if data.get('start_date') else None
        end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date() if data.get('end_date') else None
        
        membership = ProfessionalMembership(
            user_id=current_user.id,
            organization_name=data['organization_name'],
            membership_type=data.get('membership_type'),
            member_id=data.get('member_id'),
            start_date=start_date,
            end_date=end_date,
            is_current=data.get('is_current', True),
            description=data.get('description'),
            organization_url=data.get('organization_url'),
            display_order=data.get('display_order', 0)
        )
        
        db.session.add(membership)
        db.session.commit()
        
        return jsonify({'message': 'Membership added successfully', 'membership': membership.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to add membership', 'details': str(e)}), 500


@profile_extensions_bp.route('/professional-memberships/<int:membership_id>', methods=['PUT'])
@token_required
def update_professional_membership(current_user, membership_id):
    """Update professional membership"""
    try:
        membership = ProfessionalMembership.query.filter_by(id=membership_id, user_id=current_user.id).first_or_404()
        data = request.get_json()
        
        for field in ['organization_name', 'membership_type', 'member_id', 'is_current', 'description', 'organization_url', 'display_order']:
            if field in data:
                setattr(membership, field, data[field])
        
        if 'start_date' in data:
            membership.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date() if data['start_date'] else None
        if 'end_date' in data:
            membership.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date() if data['end_date'] else None
        
        membership.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Membership updated successfully', 'membership': membership.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update membership', 'details': str(e)}), 500


@profile_extensions_bp.route('/professional-memberships/<int:membership_id>', methods=['DELETE'])
@token_required
def delete_professional_membership(current_user, membership_id):
    """Delete professional membership"""
    try:
        membership = ProfessionalMembership.query.filter_by(id=membership_id, user_id=current_user.id).first_or_404()
        db.session.delete(membership)
        db.session.commit()
        return jsonify({'message': 'Membership deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete membership', 'details': str(e)}), 500


# ==================== COMPLETE PROFILE RETRIEVAL ====================

@profile_extensions_bp.route('/complete-profile', methods=['GET'])
@token_required
def get_complete_profile(current_user):
    """Get complete profile with all sections"""
    try:
        profile_data = {
            'user': current_user.to_dict(include_sensitive=True),
            'work_experiences': [exp.to_dict() for exp in current_user.work_experiences.order_by(WorkExperience.display_order, WorkExperience.start_date.desc()).all()],
            'educations': [edu.to_dict() for edu in current_user.educations.order_by(Education.display_order, Education.graduation_date.desc()).all()],
            'certifications': [cert.to_dict() for cert in current_user.certifications.order_by(Certification.display_order, Certification.issue_date.desc()).all()],
            'projects': [proj.to_dict() for proj in current_user.projects.order_by(Project.is_featured.desc(), Project.display_order).all()],
            'awards': [award.to_dict() for award in current_user.awards.order_by(Award.display_order, Award.date_received.desc()).all()],
            'languages': [lang.to_dict() for lang in current_user.languages.order_by(Language.display_order).all()],
            'volunteer_experiences': [exp.to_dict() for exp in current_user.volunteer_experiences.order_by(VolunteerExperience.display_order).all()],
            'professional_memberships': [memb.to_dict() for memb in current_user.professional_memberships.order_by(ProfessionalMembership.is_current.desc()).all()]
        }
        
        if current_user.job_seeker_profile:
            profile_data['job_seeker_profile'] = current_user.job_seeker_profile.to_dict()
        
        return jsonify(profile_data), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get complete profile', 'details': str(e)}), 500


@profile_extensions_bp.route('/complete-profile', methods=['PUT'])
@token_required
@role_required('job_seeker')
def update_complete_profile(current_user):
    """Update job seeker profile fields (professional summary, skills, preferences, etc.)"""
    try:
        from src.models.user import JobSeekerProfile
        
        data = request.get_json()
        
        # Get or create job seeker profile
        profile = current_user.job_seeker_profile
        if not profile:
            profile = JobSeekerProfile(user_id=current_user.id)
            db.session.add(profile)
        
        # Update professional summary fields
        if 'professional_title' in data:
            profile.professional_title = data['professional_title']
        if 'professional_summary' in data:
            profile.professional_summary = data['professional_summary']
        if 'career_level' in data:
            profile.career_level = data['career_level']
        if 'notice_period' in data:
            profile.notice_period = data['notice_period']
        
        # Update skills (stored as JSON arrays)
        if 'skills' in data:
            skills_data = data['skills']
            if isinstance(skills_data, list):
                profile.skills = json.dumps(skills_data)
            elif isinstance(skills_data, str):
                profile.skills = skills_data
        
        if 'technical_skills' in data:
            tech_skills = data['technical_skills']
            if isinstance(tech_skills, list):
                profile.technical_skills = json.dumps(tech_skills)
            elif isinstance(tech_skills, str):
                profile.technical_skills = tech_skills
        
        if 'soft_skills' in data:
            soft_skills_data = data['soft_skills']
            if isinstance(soft_skills_data, list):
                profile.soft_skills = json.dumps(soft_skills_data)
            elif isinstance(soft_skills_data, str):
                profile.soft_skills = soft_skills_data
        
        # Update certifications
        if 'certifications' in data:
            certs = data['certifications']
            if isinstance(certs, list):
                profile.certifications = json.dumps(certs)
            elif isinstance(certs, str):
                profile.certifications = certs
        
        # Update job preferences
        if 'job_types' in data:
            profile.job_types = json.dumps(data['job_types']) if isinstance(data['job_types'], list) else data['job_types']
        if 'expected_salary' in data:
            # Convert to integer, handle empty strings
            salary_value = data['expected_salary']
            if salary_value == '' or salary_value is None:
                profile.expected_salary = None
            else:
                try:
                    profile.expected_salary = int(salary_value)
                except (ValueError, TypeError):
                    profile.expected_salary = None
        if 'salary_currency' in data:
            profile.salary_currency = data['salary_currency']
        if 'willing_to_relocate' in data:
            profile.willing_to_relocate = data['willing_to_relocate']
        if 'willing_to_travel' in data:
            profile.willing_to_travel = data['willing_to_travel']
        if 'preferred_locations' in data:
            profile.preferred_locations = json.dumps(data['preferred_locations']) if isinstance(data['preferred_locations'], list) else data['preferred_locations']
        if 'work_authorization' in data:
            profile.work_authorization = data['work_authorization']
        if 'notice_period' in data:
            profile.notice_period = data['notice_period']
        
        # Update other profile fields
        if 'career_level' in data:
            profile.career_level = data['career_level']
        if 'years_of_experience' in data:
            profile.years_of_experience = data['years_of_experience']
        if 'portfolio_url' in data:
            profile.portfolio_url = data['portfolio_url']
        if 'github_url' in data:
            profile.github_url = data['github_url']
        if 'linkedin_url' in data:
            profile.linkedin_url = data['linkedin_url']
        
        profile.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'profile': profile.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update profile', 'details': str(e)}), 500
