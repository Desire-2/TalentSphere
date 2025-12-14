"""
CV Builder Enhancements Module
Provides ATS scoring, optimization tips, and advanced data processing
"""
from typing import Dict, List, Optional, Any
import re


class CVBuilderEnhancements:
    """Enhanced features for CV Builder including ATS scoring and optimization"""
    
    @staticmethod
    def normalize_cv_data(cv_data: Dict) -> Dict:
        """
        Comprehensive data normalization for CV content
        Handles various data formats (dict, list, string) for skills and other fields
        """
        # Normalize skills - can be dict, list, or string
        if 'technical_skills' in cv_data:
            skills = cv_data['technical_skills']
            
            if isinstance(skills, str):
                # Convert string to dict
                cv_data['technical_skills'] = {
                    'core_skills': [s.strip() for s in skills.split(',') if s.strip()]
                }
            elif isinstance(skills, list):
                # Convert list to dict
                cv_data['technical_skills'] = {
                    'core_skills': skills
                }
            elif isinstance(skills, dict):
                # Normalize dict values to ensure they're lists
                for key, value in skills.items():
                    if isinstance(value, str):
                        skills[key] = [v.strip() for v in value.split(',') if v.strip()]
                    elif not isinstance(value, list):
                        skills[key] = [str(value)]
        
        # Normalize core_competencies
        if 'core_competencies' in cv_data:
            competencies = cv_data['core_competencies']
            if isinstance(competencies, str):
                cv_data['core_competencies'] = [c.strip() for c in competencies.split(',') if c.strip()]
            elif isinstance(competencies, dict):
                # Flatten dict to list
                all_comps = []
                for value in competencies.values():
                    if isinstance(value, list):
                        all_comps.extend(value)
                    elif isinstance(value, str):
                        all_comps.extend([v.strip() for v in value.split(',') if v.strip()])
                cv_data['core_competencies'] = all_comps
        
        # Ensure lists are actually lists
        for key in ['professional_experience', 'education', 'certifications', 'projects', 'awards']:
            if key in cv_data and not isinstance(cv_data[key], list):
                cv_data[key] = [cv_data[key]] if cv_data[key] else []
        
        # Normalize contact information
        if 'contact_information' in cv_data:
            contact = cv_data['contact_information']
            if isinstance(contact, dict):
                # Ensure all contact fields are strings
                for field in ['email', 'phone', 'linkedin', 'portfolio', 'location']:
                    if field in contact and contact[field] and not isinstance(contact[field], str):
                        contact[field] = str(contact[field])
        
        return cv_data
    
    @staticmethod
    def calculate_ats_score(cv_data: Dict, job_data: Optional[Dict] = None) -> Dict:
        """
        Calculate comprehensive ATS (Applicant Tracking System) score
        
        Scoring breakdown (100 points total):
        - Contact Information: 15 points
        - Professional Summary: 15 points
        - Work Experience: 25 points
        - Education: 15 points
        - Skills: 20 points
        - Additional Sections: 10 points
        
        Returns dict with score, strengths, improvements, and analysis
        """
        score = 0
        max_score = 100
        strengths = []
        improvements = []
        
        # 1. Contact Information (15 points)
        contact = cv_data.get('contact_information', {})
        if contact.get('email'):
            score += 5
            strengths.append("Email address present")
        else:
            improvements.append("Add professional email address")
        
        if contact.get('phone'):
            score += 5
            strengths.append("Phone number present")
        else:
            improvements.append("Add contact phone number")
        
        if contact.get('linkedin') or contact.get('portfolio'):
            score += 5
            strengths.append("Professional profile links included")
        else:
            improvements.append("Add LinkedIn or portfolio URL")
        
        # 2. Professional Summary (15 points)
        summary = cv_data.get('professional_summary', '')
        if summary and len(summary) > 50:
            score += 10
            strengths.append("Comprehensive professional summary")
        elif summary:
            score += 5
            improvements.append("Expand professional summary (aim for 2-3 sentences)")
        else:
            improvements.append("Add a compelling professional summary")
        
        if job_data and summary:
            # Check for keyword matching
            job_keywords = CVBuilderEnhancements._extract_keywords(
                job_data.get('description', '') + ' ' + job_data.get('requirements', '')
            )
            summary_keywords = CVBuilderEnhancements._extract_keywords(summary)
            matching = len(set(job_keywords) & set(summary_keywords))
            if matching >= 3:
                score += 5
                strengths.append(f"Summary includes {matching} relevant keywords")
            else:
                improvements.append("Include more job-specific keywords in summary")
        
        # 3. Work Experience (25 points)
        experience = cv_data.get('professional_experience', [])
        if len(experience) >= 3:
            score += 10
            strengths.append(f"Comprehensive work history ({len(experience)} positions)")
        elif len(experience) >= 1:
            score += 5
        else:
            improvements.append("Add work experience details")
        
        # Check for quantifiable achievements
        has_quantified = False
        for exp in experience:
            achievements = exp.get('achievements', [])
            for achievement in achievements:
                if any(char.isdigit() or char in ['%', '$'] for char in str(achievement)):
                    has_quantified = True
                    break
            if has_quantified:
                break
        
        if has_quantified:
            score += 10
            strengths.append("Quantifiable achievements included")
        else:
            improvements.append("Add numbers and metrics to achievements (e.g., 'Increased sales by 25%')")
        
        # Check for action verbs
        action_verbs = ['led', 'developed', 'managed', 'created', 'improved', 'increased', 
                       'decreased', 'achieved', 'implemented', 'designed', 'built', 'launched']
        has_action_verbs = False
        for exp in experience:
            achievements = exp.get('achievements', [])
            for achievement in achievements:
                if any(verb in str(achievement).lower() for verb in action_verbs):
                    has_action_verbs = True
                    break
        
        if has_action_verbs:
            score += 5
            strengths.append("Strong action verbs used")
        else:
            improvements.append("Start bullet points with action verbs (Led, Developed, Managed, etc.)")
        
        # 4. Education (15 points)
        education = cv_data.get('education', [])
        if len(education) >= 1:
            score += 10
            strengths.append("Education history present")
        else:
            improvements.append("Add educational background")
        
        if education and any(edu.get('gpa') for edu in education):
            score += 5
            strengths.append("GPA information included")
        
        # 5. Skills (20 points)
        skills = cv_data.get('technical_skills', {})
        if skills:
            if isinstance(skills, dict):
                skill_count = sum(len(v) for v in skills.values() if isinstance(v, list))
            else:
                skill_count = len(skills) if isinstance(skills, list) else 0
            
            if skill_count >= 10:
                score += 15
                strengths.append(f"Comprehensive skills list ({skill_count} skills)")
            elif skill_count >= 5:
                score += 10
            elif skill_count >= 1:
                score += 5
            else:
                improvements.append("Add more relevant skills")
            
            # Job matching for skills
            if job_data:
                job_skills = CVBuilderEnhancements._extract_keywords(job_data.get('requirements', ''))
                cv_skills_flat = []
                if isinstance(skills, dict):
                    for v in skills.values():
                        if isinstance(v, list):
                            cv_skills_flat.extend([s.lower() for s in v])
                elif isinstance(skills, list):
                    cv_skills_flat = [s.lower() for s in skills]
                
                matching_skills = len(set(job_skills) & set(cv_skills_flat))
                if matching_skills >= 5:
                    score += 5
                    strengths.append(f"{matching_skills} skills match job requirements")
                else:
                    improvements.append("Add more skills from job requirements")
        else:
            improvements.append("Add technical and soft skills section")
        
        # 6. Additional Sections (10 points)
        if cv_data.get('certifications'):
            score += 3
            strengths.append("Certifications listed")
        else:
            improvements.append("Add relevant certifications if available")
        
        if cv_data.get('projects'):
            score += 4
            strengths.append("Projects/portfolio included")
        else:
            improvements.append("Add notable projects to showcase work")
        
        if cv_data.get('awards'):
            score += 3
            strengths.append("Awards and recognition included")
        
        return {
            'estimated_score': min(score, max_score),
            'max_score': max_score,
            'strengths': strengths,
            'improvements': improvements,
            'readability': CVBuilderEnhancements._assess_readability(cv_data),
            'keyword_density': CVBuilderEnhancements._assess_keyword_density(cv_data, job_data) if job_data else None
        }
    
    @staticmethod
    def _extract_keywords(text: str) -> List[str]:
        """Extract keywords from text for matching"""
        if not text:
            return []
        
        # Common stop words to filter out
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
                     'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 
                     'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 
                     'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 
                     'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'}
        
        # Extract words, convert to lowercase, filter stop words
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        keywords = [w for w in words if w not in stop_words]
        
        return keywords[:50]  # Limit to top 50 keywords
    
    @staticmethod
    def _assess_readability(cv_data: Dict) -> str:
        """Assess overall CV readability"""
        experience = cv_data.get('professional_experience', [])
        if not experience:
            return "Good"
        
        total_bullets = 0
        long_bullets = 0
        
        for exp in experience:
            achievements = exp.get('achievements', [])
            total_bullets += len(achievements)
            for achievement in achievements:
                if len(str(achievement).split()) > 20:
                    long_bullets += 1
        
        if total_bullets == 0:
            return "Good"
        
        long_ratio = long_bullets / total_bullets
        if long_ratio > 0.5:
            return "Could be improved - use shorter, punchier bullet points"
        elif long_ratio > 0.3:
            return "Good - consider shortening some bullet points"
        else:
            return "Excellent - concise and scannable"
    
    @staticmethod
    def _assess_keyword_density(cv_data: Dict, job_data: Optional[Dict]) -> Optional[str]:
        """Assess keyword density for job matching"""
        if not job_data:
            return None
        
        job_keywords = set(CVBuilderEnhancements._extract_keywords(
            job_data.get('description', '') + ' ' + job_data.get('requirements', '')
        ))
        if not job_keywords:
            return None
        
        # Extract all text from CV
        cv_text_parts = [
            cv_data.get('professional_summary', ''),
        ]
        
        for exp in cv_data.get('professional_experience', []):
            cv_text_parts.append(exp.get('description', ''))
            cv_text_parts.extend(exp.get('achievements', []))
        
        cv_text = ' '.join(str(part) for part in cv_text_parts)
        cv_keywords = set(CVBuilderEnhancements._extract_keywords(cv_text))
        
        matching = len(job_keywords & cv_keywords)
        percentage = (matching / len(job_keywords)) * 100 if job_keywords else 0
        
        if percentage >= 60:
            return f"Excellent - {matching}/{len(job_keywords)} key terms matched ({percentage:.0f}%)"
        elif percentage >= 40:
            return f"Good - {matching}/{len(job_keywords)} key terms matched ({percentage:.0f}%)"
        else:
            return f"Could improve - only {matching}/{len(job_keywords)} key terms matched ({percentage:.0f}%)"
    
    @staticmethod
    def generate_optimization_tips(cv_data: Dict, job_data: Optional[Dict]) -> List[str]:
        """Generate personalized optimization tips"""
        tips = []
        
        # Tip 1: Professional summary
        summary = cv_data.get('professional_summary', '')
        if not summary or len(summary) < 50:
            tips.append("Add a compelling 2-3 sentence professional summary highlighting your unique value proposition")
        
        # Tip 2: Quantifiable achievements
        experience = cv_data.get('professional_experience', [])
        has_metrics = False
        for exp in experience:
            achievements = exp.get('achievements', [])
            if any(any(char.isdigit() for char in str(ach)) for ach in achievements):
                has_metrics = True
                break
        
        if not has_metrics and experience:
            tips.append("Quantify achievements with specific numbers, percentages, or dollar amounts (e.g., 'Increased revenue by 35%')")
        
        # Tip 3: Skills section
        skills = cv_data.get('technical_skills', {})
        if isinstance(skills, dict):
            skill_count = sum(len(v) for v in skills.values() if isinstance(v, list))
        else:
            skill_count = len(skills) if isinstance(skills, list) else 0
        
        if skill_count < 8:
            tips.append("Add more relevant technical and soft skills (aim for 10-15 key skills)")
        
        # Tip 4: Certifications
        if not cv_data.get('certifications'):
            tips.append("Include professional certifications, licenses, or training programs to boost credibility")
        
        # Tip 5: Projects
        if not cv_data.get('projects') and job_data and 'engineer' in job_data.get('title', '').lower():
            tips.append("Add a projects section showcasing relevant work, especially for technical roles")
        
        # Tip 6: Job-specific keywords
        if job_data:
            job_keywords = set(CVBuilderEnhancements._extract_keywords(job_data.get('requirements', '')))
            cv_text = ' '.join(str(v) for v in cv_data.values() if isinstance(v, (str, list)))
            cv_keywords = set(CVBuilderEnhancements._extract_keywords(cv_text))
            missing_keywords = job_keywords - cv_keywords
            
            if len(missing_keywords) > 10:
                top_missing = list(missing_keywords)[:5]
                tips.append(f"Consider incorporating these job-specific keywords: {', '.join(top_missing)}")
        
        # Tip 7: Contact information
        contact = cv_data.get('contact_information', {})
        if not contact.get('linkedin') and not contact.get('portfolio'):
            tips.append("Add LinkedIn profile or portfolio URL to provide more context about your work")
        
        # Tip 8: Education details
        education = cv_data.get('education', [])
        if education:
            has_details = any(edu.get('gpa') or edu.get('honors') or edu.get('relevant_coursework') 
                            for edu in education)
            if not has_details:
                tips.append("Enhance education section with GPA (if 3.5+), honors, or relevant coursework")
        
        return tips[:8]  # Return top 8 most relevant tips
