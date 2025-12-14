"""
CV Builder Enhancements
Provides utility methods for CV optimization, ATS scoring, and quality checks
"""
from typing import Dict, List, Any, Optional


class CVBuilderEnhancements:
    """Utility class for CV enhancement and optimization"""
    
    @staticmethod
    def normalize_cv_data(cv_content: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize and clean CV data
        
        Args:
            cv_content: Raw CV content dictionary
            
        Returns:
            Normalized CV content
        """
        # Ensure all required sections exist
        if 'contact_information' not in cv_content:
            cv_content['contact_information'] = {}
        
        if 'professional_summary' not in cv_content:
            cv_content['professional_summary'] = ''
        
        if 'professional_experience' not in cv_content:
            cv_content['professional_experience'] = []
        
        if 'education' not in cv_content:
            cv_content['education'] = []
        
        if 'technical_skills' not in cv_content:
            cv_content['technical_skills'] = {}
        
        # Clean up empty values
        if isinstance(cv_content.get('core_competencies'), list):
            cv_content['core_competencies'] = [c for c in cv_content['core_competencies'] if c]
        
        return cv_content
    
    @staticmethod
    def calculate_ats_score(cv_content: Dict[str, Any], job_data: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Calculate ATS (Applicant Tracking System) optimization score
        
        Args:
            cv_content: CV content dictionary
            job_data: Optional job posting data for matching
            
        Returns:
            Dictionary with score and breakdown
        """
        score = 0
        max_score = 100
        breakdown = {}
        
        # Check professional summary (20 points)
        summary = cv_content.get('professional_summary', '')
        if summary:
            word_count = len(summary.split())
            if 40 <= word_count <= 70:
                score += 20
                breakdown['summary'] = {'score': 20, 'status': 'optimal'}
            elif word_count > 0:
                score += 10
                breakdown['summary'] = {'score': 10, 'status': 'needs_improvement'}
        else:
            breakdown['summary'] = {'score': 0, 'status': 'missing'}
        
        # Check experience section (25 points)
        experiences = cv_content.get('professional_experience', [])
        if experiences:
            exp_score = min(25, len(experiences) * 6)
            # Bonus for achievements with metrics
            achievements_count = sum(1 for exp in experiences 
                                   for ach in exp.get('achievements', []) 
                                   if any(char.isdigit() for char in str(ach)))
            exp_score = min(25, exp_score + achievements_count * 2)
            score += exp_score
            breakdown['experience'] = {'score': exp_score, 'status': 'good' if exp_score >= 20 else 'needs_improvement'}
        else:
            breakdown['experience'] = {'score': 0, 'status': 'missing'}
        
        # Check skills (20 points)
        skills = cv_content.get('technical_skills', {})
        if skills:
            total_skills = sum(len(v) for v in skills.values() if isinstance(v, list))
            skills_score = min(20, total_skills * 2)
            score += skills_score
            breakdown['skills'] = {'score': skills_score, 'status': 'good' if skills_score >= 15 else 'needs_improvement'}
        else:
            breakdown['skills'] = {'score': 0, 'status': 'missing'}
        
        # Check education (15 points)
        education = cv_content.get('education', [])
        if education:
            score += 15
            breakdown['education'] = {'score': 15, 'status': 'present'}
        else:
            breakdown['education'] = {'score': 0, 'status': 'missing'}
        
        # Check contact information (10 points)
        contact = cv_content.get('contact_information', {})
        contact_score = 0
        if contact.get('email'):
            contact_score += 3
        if contact.get('phone'):
            contact_score += 3
        if contact.get('location'):
            contact_score += 2
        if contact.get('linkedin') or contact.get('github') or contact.get('portfolio'):
            contact_score += 2
        score += contact_score
        breakdown['contact'] = {'score': contact_score, 'status': 'complete' if contact_score >= 8 else 'incomplete'}
        
        # Check competencies (10 points)
        competencies = cv_content.get('core_competencies', [])
        if competencies and len(competencies) >= 6:
            score += 10
            breakdown['competencies'] = {'score': 10, 'status': 'optimal'}
        elif competencies:
            score += 5
            breakdown['competencies'] = {'score': 5, 'status': 'needs_more'}
        else:
            breakdown['competencies'] = {'score': 0, 'status': 'missing'}
        
        # Job match bonus if job_data provided (additional scoring)
        if job_data:
            job_title = str(job_data.get('title', '')).lower()
            summary_lower = summary.lower()
            
            # Check if job title appears in summary
            if job_title and job_title in summary_lower:
                score = min(100, score + 5)
                breakdown['job_match'] = {'bonus': 5, 'reason': 'job_title_in_summary'}
        
        return {
            'total_score': min(100, score),
            'max_score': max_score,
            'percentage': min(100, (score / max_score) * 100),
            'grade': CVBuilderEnhancements._get_grade(score),
            'breakdown': breakdown
        }
    
    @staticmethod
    def _get_grade(score: int) -> str:
        """Get letter grade from score"""
        if score >= 90:
            return 'A'
        elif score >= 80:
            return 'B'
        elif score >= 70:
            return 'C'
        elif score >= 60:
            return 'D'
        else:
            return 'F'
    
    @staticmethod
    def generate_optimization_tips(cv_content: Dict[str, Any], job_data: Optional[Dict] = None) -> List[str]:
        """
        Generate actionable tips to improve CV
        
        Args:
            cv_content: CV content dictionary
            job_data: Optional job posting data
            
        Returns:
            List of improvement suggestions
        """
        tips = []
        
        # Check summary
        summary = cv_content.get('professional_summary', '')
        if not summary:
            tips.append("Add a professional summary to introduce yourself and highlight key achievements")
        else:
            word_count = len(summary.split())
            if word_count < 40:
                tips.append(f"Expand your professional summary (currently {word_count} words, aim for 50-65 words)")
            elif word_count > 70:
                tips.append(f"Condense your professional summary (currently {word_count} words, aim for 50-65 words)")
            
            # Check for metrics in summary
            if not any(char.isdigit() for char in summary):
                tips.append("Add quantifiable metrics to your professional summary (e.g., percentages, dollar amounts, team sizes)")
        
        # Check experience achievements
        experiences = cv_content.get('professional_experience', [])
        if not experiences:
            tips.append("Add work experience to showcase your professional background")
        else:
            achievements_with_metrics = 0
            total_achievements = 0
            for exp in experiences:
                achievements = exp.get('achievements', [])
                total_achievements += len(achievements)
                achievements_with_metrics += sum(1 for ach in achievements if any(char.isdigit() for char in str(ach)))
            
            if total_achievements == 0:
                tips.append("Add achievement bullets to each work experience")
            elif achievements_with_metrics < total_achievements * 0.5:
                tips.append("Add more quantifiable metrics to your achievements (aim for at least 2 numbers per bullet)")
        
        # Check skills
        skills = cv_content.get('technical_skills', {})
        if not skills or sum(len(v) for v in skills.values() if isinstance(v, list)) < 10:
            tips.append("Add more technical skills to demonstrate your expertise (aim for 15-20 skills)")
        
        # Check competencies
        competencies = cv_content.get('core_competencies', [])
        if not competencies:
            tips.append("Add core competencies section to highlight your key strengths")
        elif len(competencies) < 8:
            tips.append(f"Add more core competencies (currently {len(competencies)}, aim for 10-12)")
        
        # Check contact info
        contact = cv_content.get('contact_information', {})
        if not contact.get('linkedin') and not contact.get('github') and not contact.get('portfolio'):
            tips.append("Add professional online profiles (LinkedIn, GitHub, or portfolio URL)")
        
        # Job-specific tips
        if job_data:
            job_title = str(job_data.get('title', ''))
            if job_title and job_title.lower() not in summary.lower():
                tips.append(f"Include the target job title '{job_title}' in your professional summary for better ATS matching")
            
            requirements = str(job_data.get('requirements', '')).lower()
            if requirements:
                # Check for common keywords
                common_keywords = ['leadership', 'teamwork', 'agile', 'communication', 'problem-solving']
                missing_keywords = [kw for kw in common_keywords if kw in requirements and kw.lower() not in summary.lower()]
                if missing_keywords:
                    tips.append(f"Consider adding these job-relevant keywords: {', '.join(missing_keywords)}")
        
        return tips if tips else ["Your CV looks great! Consider tailoring it further for specific job applications."]
