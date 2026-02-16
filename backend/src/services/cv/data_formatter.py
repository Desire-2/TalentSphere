"""
CV Builder Data Formatter
Formats user profile data for AI prompts
"""
from typing import Dict, List, Any


class CVDataFormatter:
    """Formats user profile data into prompt-ready strings"""
    
    @staticmethod
    def format_personal_info(user_data: Dict) -> str:
        """Format personal information"""
        return f"""
Full Name: {user_data.get('first_name', '')} {user_data.get('last_name', '')}
Email: {user_data.get('email', 'Not provided')}
Phone: {user_data.get('phone', 'Not provided')}
Location: {user_data.get('location', 'Not specified')}
"""
    
    @staticmethod
    def format_work_experience(experiences: List[Dict]) -> str:
        """Format work experiences for prompt with ALL available fields and relevance annotations"""
        if not experiences:
            return "No work experience provided."
        
        formatted = []
        for i, exp in enumerate(experiences):
            # Include relevance score if annotated by job_matcher
            relevance_info = ''
            if exp.get('_relevance_score') is not None:
                relevance_info = f"\nRelevance to Target Job: {exp['_relevance_label'].upper()} (score: {exp['_relevance_score']}/100)"
            
            # Extract all available fields with smart fallbacks
            job_title = exp.get('job_title') or exp.get('position') or exp.get('title', 'Not specified')
            company = exp.get('company_name') or exp.get('company', 'Not specified')
            location = exp.get('company_location') or exp.get('location', '')
            emp_type = exp.get('employment_type') or exp.get('type', '')
            start = exp.get('start_date', 'Unknown')
            end = 'Present (Current Role)' if exp.get('is_current') else (exp.get('end_date', 'Unknown') or 'Unknown')
            description = exp.get('description', '')
            
            # Responsibilities — handle string or list
            responsibilities = exp.get('key_responsibilities') or exp.get('responsibilities', [])
            if isinstance(responsibilities, str):
                resp_text = responsibilities
            elif isinstance(responsibilities, list) and responsibilities:
                resp_text = '\n  - '.join(responsibilities)
            else:
                resp_text = 'None listed'
            
            # Achievements — handle string or list
            achievements = exp.get('achievements') or []
            if isinstance(achievements, str):
                ach_text = achievements
            elif isinstance(achievements, list) and achievements:
                ach_text = '\n  - '.join(achievements)
            else:
                ach_text = 'None listed'
            
            # Technologies — handle string or list
            technologies = exp.get('technologies_used') or exp.get('technologies') or exp.get('skills_used') or []
            if isinstance(technologies, str):
                tech_text = technologies
            elif isinstance(technologies, list) and technologies:
                tech_text = ', '.join(technologies)
            else:
                tech_text = 'None listed'
            
            # Build comprehensive entry
            entry = f"""
Position #{i + 1}: {job_title}
Company: {company}"""
            
            if location:
                entry += f"\nLocation: {location}"
            if emp_type:
                entry += f"\nEmployment Type: {emp_type}"
            
            entry += f"\nDuration: {start} to {end}{relevance_info}"
            
            if description:
                entry += f"\nDescription: {description}"
            
            entry += f"""
Key Responsibilities:
  - {resp_text}
Achievements:
  - {ach_text}
Technologies Used: {tech_text}"""
            
            formatted.append(entry)
        
        return "\n---\n".join(formatted)
    
    @staticmethod
    def format_education(educations: List[Dict]) -> str:
        """Format education for prompt"""
        if not educations:
            return "No education provided."
        
        formatted = []
        for edu in educations:
            entry = f"""
Degree: {edu.get('degree_title', 'Not specified')}
Institution: {edu.get('institution_name', 'Not specified')}
Location: {edu.get('institution_location', 'Not specified')}
Field: {edu.get('field_of_study', 'Not specified')}
Duration: {edu.get('start_date', 'Unknown')} to {edu.get('graduation_date', 'Unknown')}
GPA: {edu.get('gpa', 'Not provided')} / {edu.get('gpa_scale', 4.0)}
Honors: {edu.get('honors', 'None')}
Relevant Coursework: {', '.join(edu.get('relevant_coursework', [])) if isinstance(edu.get('relevant_coursework'), list) else edu.get('relevant_coursework', 'None')}
"""
            formatted.append(entry)
        
        return "\n---\n".join(formatted)
    
    @staticmethod
    def format_skills(profile: Dict) -> str:
        """Format skills from job seeker profile"""
        skills_data = profile.get('skills', [])
        if isinstance(skills_data, str):
            return f"Skills: {skills_data}"
        elif isinstance(skills_data, list):
            return f"Skills: {', '.join(skills_data)}"
        return "No skills information provided."
    
    @staticmethod
    def format_certifications(certifications: List[Dict]) -> str:
        """Format certifications for prompt"""
        if not certifications:
            return "No certifications provided."
        
        formatted = []
        for cert in certifications:
            entry = f"{cert.get('name', 'Unnamed')} - {cert.get('issuer', 'Unknown issuer')} ({cert.get('issue_date', 'Date unknown')})"
            formatted.append(entry)
        
        return "\n".join(formatted)
    
    @staticmethod
    def format_projects(projects: List[Dict]) -> str:
        """Format projects for prompt"""
        if not projects:
            return "No projects provided."
        
        formatted = []
        for proj in projects:
            entry = f"""
Project: {proj.get('title', 'Unnamed')}
Description: {proj.get('description', 'No description')}
Role: {proj.get('role', 'Not specified')}
Technologies: {', '.join(proj.get('technologies', [])) if isinstance(proj.get('technologies'), list) else proj.get('technologies', 'None')}
URL: {proj.get('url', 'Not provided')}
"""
            formatted.append(entry)
        
        return "\n---\n".join(formatted)
    
    @staticmethod
    def format_awards(awards: List[Dict]) -> str:
        """Format awards for prompt"""
        if not awards:
            return "No awards provided."
        
        formatted = []
        for award in awards:
            entry = f"{award.get('title', 'Unnamed')} - {award.get('issuer', 'Unknown issuer')} ({award.get('date', 'Date unknown')})"
            formatted.append(entry)
        
        return "\n".join(formatted)
    
    @staticmethod
    def format_references(references: List[Dict]) -> str:
        """Format references for prompt"""
        if not references:
            return "No references provided. Return empty array []."
        
        formatted = []
        for ref in references:
            entry = f"""
Reference: {ref.get('name', 'Name not provided')}
Position: {ref.get('position', 'Not specified')}
Company: {ref.get('company', 'Not specified')}
Email: {ref.get('email', 'Not provided')}
Phone: {ref.get('phone', 'Not provided')}
Relationship: {ref.get('relationship', 'Professional contact')}
"""
            formatted.append(entry)
        
        return "\n---\n".join(formatted)
    
    @staticmethod
    def format_languages(profile: Dict) -> str:
        """Format languages from job seeker profile"""
        languages = profile.get('languages')
        if not languages:
            return "Not specified"
        if isinstance(languages, list):
            return ', '.join(languages)
        elif isinstance(languages, str):
            return languages
        return "Not specified"
    
    @staticmethod
    def extract_contact_info(user_data: Dict) -> Dict[str, str]:
        """Extract contact information including professional URLs"""
        profile = user_data.get('job_seeker_profile', {})
        return {
            'full_name': f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip(),
            'email': user_data.get('email', ''),
            'phone': user_data.get('phone', ''),
            'location': user_data.get('location', ''),
            'linkedin': profile.get('linkedin_url', '') or user_data.get('linkedin_url', ''),
            'github': profile.get('github_url', '') or user_data.get('github_url', ''),
            'portfolio': profile.get('portfolio_url', '') or profile.get('website_url', '') or user_data.get('portfolio_url', '')
        }
