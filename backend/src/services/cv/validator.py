"""
CV Builder Validator
Validates and scores CV content quality
"""
from typing import Dict, List, Optional
from src.services.cv_builder_enhancements import CVBuilderEnhancements


class CVValidator:
    """Validates CV content quality and completeness"""
    
    def validate_content_quality(self, cv_data: Dict) -> Dict:
        """Validate and enhance CV content quality"""
        
        # Validate professional summary
        if 'professional_summary' in cv_data:
            summary = cv_data['professional_summary']
            if isinstance(summary, str):
                word_count = len(summary.split())
                if word_count < 15:
                    print(f"[CV Validator] ⚠️  Summary too short ({word_count} words)")
                elif word_count > 100:
                    print(f"[CV Validator] ⚠️  Summary too long ({word_count} words)")
        
        # Validate work experience has achievements
        if 'professional_experience' in cv_data:
            for i, exp in enumerate(cv_data['professional_experience']):
                if not exp.get('achievements'):
                    print(f"[CV Validator] ⚠️  Experience {i+1} missing achievements")
                    exp['achievements'] = ["Contributed to team success"]
        
        # Validate contact information
        if 'contact_information' in cv_data:
            contact = cv_data['contact_information']
            required_fields = ['full_name', 'email', 'phone']
            for field in required_fields:
                if not contact.get(field):
                    print(f"[CV Validator] ⚠️  Missing contact: {field}")
        
        # Ensure skills are categorized
        if 'technical_skills' in cv_data:
            skills = cv_data['technical_skills']
            if isinstance(skills, list):
                cv_data['technical_skills'] = {
                    'core_skills': skills[:8],
                    'additional_skills': skills[8:] if len(skills) > 8 else []
                }
        
        return cv_data
    
    def calculate_quality_score(self, cv_data: Dict, requested_sections: List[str]) -> int:
        """Calculate overall quality score (0-100)"""
        score = 0
        
        # Section completeness (30 points)
        sections_present = sum(1 for section in requested_sections if self._section_has_content(cv_data, section))
        if requested_sections:
            score += (sections_present / len(requested_sections)) * 30
        
        # Professional summary quality (10 points)
        if 'professional_summary' in cv_data:
            summary = cv_data['professional_summary']
            word_count = len(str(summary).split())
            if 30 <= word_count <= 80:
                score += 10
            elif 20 <= word_count < 30 or 80 < word_count <= 100:
                score += 7
            elif word_count >= 15:
                score += 4
        
        # Work experience quality (15 points)
        experiences = cv_data.get('professional_experience', [])
        if experiences:
            has_achievements = sum(1 for exp in experiences if exp.get('achievements'))
            score += min(15, has_achievements * 5)
        
        # Skills completeness (10 points)
        skills = cv_data.get('technical_skills', {})
        if skills:
            if isinstance(skills, dict):
                skill_count = sum(len(v) for v in skills.values() if isinstance(v, list))
            elif isinstance(skills, list):
                skill_count = len(skills)
            else:
                skill_count = 0
            
            if skill_count >= 10:
                score += 10
            elif skill_count >= 5:
                score += 7
            elif skill_count >= 1:
                score += 4
        
        # Contact information (5 points)
        contact = cv_data.get('contact_information', {})
        if contact.get('email') and contact.get('phone'):
            score += 5
        
        # ATS Score (30 points)
        ats_score = cv_data.get('ats_score', {})
        if ats_score and ats_score.get('estimated_score'):
            score += (ats_score['estimated_score'] / 100) * 30
        
        return min(int(score), 100)
    
    def validate_sections_present(self, cv_data: Dict, requested_sections: List[str]) -> List[str]:
        """Check which requested sections are missing"""
        section_mapping = {
            'summary': 'professional_summary',
            'experience': 'professional_experience',
            'work': 'professional_experience',
            'education': 'education',
            'skills': ['technical_skills', 'core_competencies', 'skills'],
            'certifications': 'certifications',
            'projects': 'projects',
            'awards': 'awards',
            'references': 'references'
        }
        
        missing = []
        for section in requested_sections:
            if section not in section_mapping:
                continue
            
            mapping = section_mapping[section]
            
            if isinstance(mapping, list):
                # Check if ANY key exists with content
                has_content = any(key in cv_data and cv_data[key] for key in mapping)
                if not has_content:
                    missing.append(section)
            else:
                # Single key check
                if mapping not in cv_data or not cv_data[mapping]:
                    missing.append(section)
        
        return missing
    
    def add_missing_section(self, cv_data: Dict, section: str, user_data: Dict) -> Dict:
        """Add minimal content for missing section"""
        defaults = {
            'summary': 'Experienced professional seeking new opportunities',
            'experience': [],
            'education': [],
            'skills': {'core_skills': []},
            'certifications': [],
            'projects': [],
            'awards': [],
            'references': []
        }
        
        section_mapping = {
            'summary': 'professional_summary',
            'experience': 'professional_experience',
            'work': 'professional_experience',
            'education': 'education',
            'skills': 'technical_skills',
            'certifications': 'certifications',
            'projects': 'projects',
            'awards': 'awards',
            'references': 'references'
        }
        
        if section in section_mapping:
            key = section_mapping[section]
            cv_data[key] = defaults.get(section, [])
            print(f"[CV Validator] ⚠️  Added placeholder for: {key}")
        
        return cv_data
    
    def _section_has_content(self, cv_data: Dict, section: str) -> bool:
        """Check if section exists and has content"""
        section_mapping = {
            'summary': 'professional_summary',
            'experience': 'professional_experience',
            'work': 'professional_experience',
            'education': 'education',
            'skills': ['technical_skills', 'core_competencies'],
            'certifications': 'certifications',
            'projects': 'projects',
            'awards': 'awards',
            'references': 'references'
        }
        
        if section not in section_mapping:
            return False
        
        mapping = section_mapping[section]
        
        if isinstance(mapping, list):
            return any(key in cv_data and cv_data[key] for key in mapping)
        else:
            return mapping in cv_data and bool(cv_data[mapping])
