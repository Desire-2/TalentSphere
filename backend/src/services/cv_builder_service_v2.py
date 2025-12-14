"""
Enhanced CV Builder Service with Section-by-Section Generation
Generates CV incrementally to avoid API rate limits and ensure all sections are included
"""
from datetime import datetime
import json
import os
import time
from typing import Dict, List, Optional, Any

try:
    from google import genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    genai = None

from src.services.cv_builder_enhancements import CVBuilderEnhancements


class CVBuilderServiceV2:
    """Enhanced CV Builder with incremental section generation"""
    
    def __init__(self):
        """Initialize the CV builder with Gemini AI client"""
        self.client = None
        self._api_key = os.getenv('GEMINI_API_KEY')
        self._last_request_time = 0
        self._min_request_interval = 2  # Minimum 2 seconds between requests
        self._section_generators = {
            'contact': self._generate_contact_section,
            'summary': self._generate_summary_section,
            'experience': self._generate_experience_section,
            'education': self._generate_education_section,
            'skills': self._generate_skills_section,
            'certifications': self._generate_certifications_section,
            'projects': self._generate_projects_section,
            'awards': self._generate_awards_section
        }
    
    def _get_client(self):
        """Lazy initialization of Gemini client"""
        if not GEMINI_AVAILABLE:
            raise ValueError("Google Gemini package is not installed. Install it with: pip install google-generativeai")
        
        if self.client is None:
            if not self._api_key:
                raise ValueError("GEMINI_API_KEY not found in environment variables.")
            self.client = genai.Client(api_key=self._api_key)
        return self.client
    
    def _rate_limit_wait(self):
        """Ensure we don't exceed rate limits"""
        current_time = time.time()
        time_since_last_request = current_time - self._last_request_time
        
        if time_since_last_request < self._min_request_interval:
            wait_time = self._min_request_interval - time_since_last_request
            time.sleep(wait_time)
        
        self._last_request_time = time.time()
    
    def _make_api_request_with_retry(self, prompt: str, max_retries: int = 3) -> str:
        """Make API request with exponential backoff retry logic"""
        client = self._get_client()
        
        for attempt in range(max_retries):
            try:
                self._rate_limit_wait()
                
                response = client.models.generate_content(
                    model="gemini-2.0-flash-exp",  # Use latest flash model
                    contents=prompt,
                    config={
                        'temperature': 0.7,
                        'max_output_tokens': 1024,  # Reduced for sections
                    }
                )
                
                if not response or not response.text:
                    if attempt < max_retries - 1:
                        time.sleep(2)
                        continue
                    raise Exception("API returned empty response")
                
                return response.text
                
            except Exception as e:
                error_str = str(e)
                
                if '429' in error_str or 'RESOURCE_EXHAUSTED' in error_str:
                    if attempt < max_retries - 1:
                        wait_time = (2 ** attempt) * 2
                        print(f"Rate limit hit. Waiting {wait_time}s before retry {attempt + 1}/{max_retries}...")
                        time.sleep(wait_time)
                        continue
                    else:
                        raise Exception("API rate limit exceeded. Please wait a few minutes and try again.")
                else:
                    raise
        
        raise Exception("Max retries exceeded")
    
    def generate_cv_content(
        self, 
        user_data: Dict[str, Any],
        job_data: Optional[Dict[str, Any]] = None,
        cv_style: str = "professional",
        include_sections: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Generate AI-optimized CV content section by section
        
        Args:
            user_data: Complete user profile
            job_data: Target job information
            cv_style: Style preference
            include_sections: Sections to include
            
        Returns:
            Complete CV content with all sections
        """
        if include_sections is None:
            include_sections = ['summary', 'experience', 'education', 'skills', 'projects', 'certifications']
        
        print(f"[CV Builder V2] Generating CV with {len(include_sections)} sections incrementally")
        print(f"[CV Builder V2] Style: {cv_style}, Job: {job_data.get('title') if job_data else 'General'}")
        
        # Initialize CV structure
        cv_content = {
            'metadata': {
                'generated_at': datetime.utcnow().isoformat(),
                'style': cv_style,
                'tailored_for_job': job_data.get('title') if job_data else None,
                'company': job_data.get('company_name') if job_data else None,
                'sections_included': include_sections,
                'version': '2.0-incremental'
            }
        }
        
        # Extract common profile data once
        profile_data = user_data.get('job_seeker_profile', {})
        
        # Step 1: Generate contact information (no AI needed)
        print("[CV Builder V2] Step 1/8: Generating contact information...")
        cv_content['contact_information'] = self._generate_contact_section(user_data, profile_data)
        
        # Step 2: Generate professional summary (if requested)
        if 'summary' in include_sections:
            print("[CV Builder V2] Step 2/8: Generating professional summary with AI...")
            cv_content['professional_summary'] = self._generate_summary_section(
                user_data, profile_data, job_data, cv_style
            )
            time.sleep(1)  # Small delay between sections
        
        # Step 2.5: Generate core competencies (highlight badges)
        print("[CV Builder V2] Step 2.5/8: Generating core competencies with job matching...")
        cv_content['core_competencies'] = self._generate_core_competencies(
            user_data, profile_data, job_data
        )
        time.sleep(1)
        
        # Step 3: Generate work experience (if requested and data available)
        if 'experience' in include_sections or 'work' in include_sections:
            print("[CV Builder V2] Step 3/8: Generating work experience with AI...")
            cv_content['professional_experience'] = self._generate_experience_section(
                user_data, profile_data, job_data, cv_style
            )
            time.sleep(1)
        
        # Step 4: Generate education (if requested and data available)
        if 'education' in include_sections:
            print("[CV Builder V2] Step 4/8: Generating education with AI...")
            cv_content['education'] = self._generate_education_section(
                user_data, profile_data, job_data
            )
            time.sleep(1)
        
        # Step 5: Generate skills (if requested and data available)
        if 'skills' in include_sections:
            print("[CV Builder V2] Step 5/8: Generating skills with AI...")
            cv_content['technical_skills'] = self._generate_skills_section(
                user_data, profile_data, job_data
            )
            time.sleep(1)
        
        # Step 6: Generate projects (if requested and data available)
        if 'projects' in include_sections:
            print("[CV Builder V2] Step 6/8: Generating projects...")
            cv_content['projects'] = self._generate_projects_section(
                user_data, profile_data, job_data
            )
            time.sleep(1)
        
        # Step 7: Generate certifications (if requested and data available)
        if 'certifications' in include_sections:
            print("[CV Builder V2] Step 7/8: Generating certifications...")
            cv_content['certifications'] = self._generate_certifications_section(
                user_data, profile_data, job_data
            )
        
        # Step 8: Generate awards (if requested and data available)
        if 'awards' in include_sections:
            print("[CV Builder V2] Step 8/8: Generating awards...")
            cv_content['awards'] = self._generate_awards_section(user_data)
        
        # Calculate ATS score
        cv_content['ats_score'] = CVBuilderEnhancements.calculate_ats_score(cv_content, job_data)
        cv_content['optimization_tips'] = CVBuilderEnhancements.generate_optimization_tips(cv_content, job_data)
        
        print(f"[CV Builder V2] ✅ CV generation complete with {len(include_sections)} sections")
        return cv_content
    
    def _generate_contact_section(self, user_data: Dict, profile_data: Dict) -> Dict:
        """Generate contact information section (no AI needed)"""
        return {
            'full_name': f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip(),
            'professional_title': profile_data.get('professional_title') or profile_data.get('desired_position') or 'Professional',
            'email': user_data.get('email', ''),
            'phone': user_data.get('phone', ''),
            'location': user_data.get('location', ''),
            'linkedin': profile_data.get('linkedin_url', ''),
            'github': profile_data.get('github_url', ''),
            'portfolio': profile_data.get('portfolio_url', ''),
            'website': profile_data.get('website_url', '')
        }
    
    def _generate_summary_section(
        self, user_data: Dict, profile_data: Dict, job_data: Optional[Dict], cv_style: str
    ) -> str:
        """Generate professional summary with AI"""
        
        # Build concise prompt
        prompt = f"""Create a compelling 2-3 sentence professional summary (40-60 words) for this candidate.

CANDIDATE INFO:
- Professional Title: {profile_data.get('professional_title', 'Professional')}
- Years of Experience: {profile_data.get('years_of_experience', 0)}
- Desired Position: {profile_data.get('desired_position', 'Open to opportunities')}
- Key Skills: {profile_data.get('skills', 'Various professional skills')}
- Career Goals: {profile_data.get('career_goals', 'Seeking growth opportunities')}
- Professional Summary: {profile_data.get('professional_summary', 'Not provided')}

WORK HISTORY ({len(user_data.get('work_experiences', []))} roles):
{self._format_work_brief(user_data.get('work_experiences', []))}

EDUCATION:
{profile_data.get('education_level', 'Not specified')}

{'TARGET JOB: ' + job_data.get('title', '') + ' at ' + job_data.get('company_name', '') if job_data else 'GENERAL CV'}

REQUIREMENTS:
1. Start with years of experience and professional title
2. Highlight 2-3 key strengths relevant to {"the target job" if job_data else "their field"}
3. Include 1 quantifiable achievement if possible
4. Use active, confident language
5. {"Match keywords from job: " + job_data.get('title', '') if job_data else "Focus on versatility"}
6. Maximum 60 words, 2-3 sentences
7. Return ONLY the summary text, no labels or formatting"""

        try:
            response_text = self._make_api_request_with_retry(prompt)
            return response_text.strip().strip('"').strip("'")
        except Exception as e:
            print(f"[CV Builder V2] Summary generation failed: {e}")
            # Fallback summary
            years = profile_data.get('years_of_experience', 0)
            title = profile_data.get('professional_title', 'Professional')
            return f"{title} with {years}+ years of experience. Strong track record in delivering results and driving innovation. Seeking opportunities to contribute expertise and leadership to dynamic organizations."
    
    def _generate_core_competencies(
        self, user_data: Dict, profile_data: Dict, job_data: Optional[Dict]
    ) -> List[str]:
        """Generate 6-10 core competencies/key skills that match job requirements"""
        
        skills_raw = profile_data.get('skills', '')
        soft_skills = profile_data.get('soft_skills', '')
        
        if job_data:
            job_title = job_data.get('title', '')
            job_requirements = job_data.get('requirements', '')
            job_description = job_data.get('description', '')
            
            prompt = f"""Extract 8-10 most relevant core competencies for this candidate based on job requirements.

CANDIDATE SKILLS:
- Technical: {skills_raw}
- Soft Skills: {soft_skills}
- Current Title: {profile_data.get('professional_title', '')}

TARGET JOB:
Title: {job_title}
Requirements: {job_requirements[:400]}
Description: {job_description[:400]}

TASK:
1. Identify 8-10 key competencies that:
   - Match job requirements (highest priority)
   - Are clearly stated in candidate's profile
   - Mix technical and soft skills
   - Use keywords from job posting
2. Format as short phrases (2-4 words each)
3. Examples: "Full-Stack Development", "Agile Leadership", "Cloud Architecture", "Data Analytics"
4. Return as JSON array: ["competency1", "competency2", ...]

Return ONLY the JSON array, no explanations."""

        else:
            prompt = f"""Extract 8-10 core competencies from this candidate's profile.

CANDIDATE PROFILE:
- Technical Skills: {skills_raw}
- Soft Skills: {soft_skills}
- Professional Title: {profile_data.get('professional_title', '')}
- Years of Experience: {profile_data.get('years_of_experience', 0)}

TASK:
1. Identify 8-10 most impressive competencies
2. Mix technical and soft skills
3. Use professional terminology
4. Format as short phrases (2-4 words each)
5. Return as JSON array: ["competency1", "competency2", ...]

Return ONLY the JSON array."""

        try:
            response_text = self._make_api_request_with_retry(prompt)
            cleaned = response_text.strip()
            if cleaned.startswith('```'):
                cleaned = cleaned.split('```')[1]
                if cleaned.startswith('json'):
                    cleaned = cleaned[4:]
                cleaned = cleaned.strip()
            
            competencies = json.loads(cleaned)
            if isinstance(competencies, list) and len(competencies) >= 6:
                return competencies[:10]
            else:
                raise ValueError("Invalid competencies format")
                
        except Exception as e:
            print(f"[CV Builder V2] Core competencies generation failed: {e}, using fallback")
            # Intelligent fallback
            fallback = []
            if skills_raw:
                skills_list = [s.strip() for s in skills_raw.replace(';', ',').split(',')[:6]]
                fallback.extend(skills_list)
            if soft_skills:
                soft_list = [s.strip() for s in soft_skills.replace(';', ',').split(',')[:4]]
                fallback.extend(soft_list)
            
            if not fallback:
                fallback = ['Problem Solving', 'Team Collaboration', 'Technical Expertise', 'Project Management']
            
            return fallback[:10]
    
    def _generate_experience_section(
        self, user_data: Dict, profile_data: Dict, job_data: Optional[Dict], cv_style: str
    ) -> List[Dict]:
        """Generate work experience section with AI-enhanced achievements"""
        
        work_experiences = user_data.get('work_experiences', [])
        
        if not work_experiences:
            return []
        
        # Limit to top 3-4 most relevant/recent positions
        top_experiences = work_experiences[:4]
        
        enhanced_experiences = []
        
        for idx, exp in enumerate(top_experiences):
            print(f"[CV Builder V2] Enhancing experience {idx + 1}/{len(top_experiences)}...")
            
            # Build focused prompt for this role
            prompt = f"""Enhance this work experience for a CV. Create 3 achievement bullets (one line each, max 15 words per bullet).

ROLE:
- Job Title: {exp.get('job_title', 'Position')}
- Company: {exp.get('company_name', 'Company')}
- Duration: {exp.get('start_date', 'Date')} to {exp.get('end_date', 'Present') if not exp.get('is_current') else 'Present'}
- Description: {exp.get('description', 'No description')}
- Responsibilities: {exp.get('key_responsibilities', 'Various duties')}
- Current Achievements: {exp.get('achievements', 'To be enhanced')}
- Technologies: {exp.get('technologies_used', 'Various tools')}

{'TARGET JOB: ' + job_data.get('title', '') if job_data else ''}

REQUIREMENTS:
1. Create exactly 3 achievement bullets
2. Each bullet: Start with action verb + quantifiable result
3. Maximum 15 words per bullet (one line)
4. Include numbers/metrics where possible
5. {"Match skills from job posting: " + job_data.get('requirements', '')[:100] if job_data else "Highlight impact and results"}
6. Return as JSON array: ["bullet1", "bullet2", "bullet3"]
7. No additional text, only the JSON array"""

            try:
                response_text = self._make_api_request_with_retry(prompt)
                # Parse JSON response
                achievements = json.loads(response_text.strip())
                if not isinstance(achievements, list):
                    raise ValueError("Response is not a list")
            except Exception as e:
                print(f"[CV Builder V2] Achievement generation failed: {e}, using defaults")
                achievements = [
                    f"Contributed to team success in {exp.get('job_title', 'role')} responsibilities",
                    "Collaborated with cross-functional teams to deliver projects",
                    "Applied technical skills and expertise to achieve goals"
                ]
            
            # Build experience entry
            enhanced_exp = {
                'job_title': exp.get('job_title', 'Position'),
                'company': exp.get('company_name', 'Company'),
                'location': exp.get('company_location', ''),
                'duration': f"{exp.get('start_date', 'Date')} - {exp.get('end_date', 'Present') if not exp.get('is_current') else 'Present'}",
                'description': exp.get('description', '')[:200],  # Brief context
                'achievements': achievements[:3],  # Max 3 bullets
                'technologies': exp.get('technologies_used', []) if isinstance(exp.get('technologies_used'), list) else []
            }
            
            enhanced_experiences.append(enhanced_exp)
            
            # Small delay between experience enhancements
            if idx < len(top_experiences) - 1:
                time.sleep(1)
        
        return enhanced_experiences
    
    def _generate_education_section(
        self, user_data: Dict, profile_data: Dict, job_data: Optional[Dict]
    ) -> List[Dict]:
        """Generate education section with AI enhancement for relevant coursework"""
        
        educations = user_data.get('educations', [])
        
        if not educations:
            return []
        
        enhanced_education = []
        
        for edu in educations[:3]:  # Limit to top 3
            edu_entry = {
                'degree': edu.get('degree_title', 'Degree'),
                'institution': edu.get('institution_name', 'Institution'),
                'location': edu.get('institution_location', ''),
                'graduation_date': edu.get('graduation_date', ''),
                'gpa': edu.get('gpa', ''),
                'honors': edu.get('honors', ''),
                'relevant_coursework': edu.get('relevant_coursework', [])
            }
            
            enhanced_education.append(edu_entry)
        
        return enhanced_education
    
    def _generate_skills_section(
        self, user_data: Dict, profile_data: Dict, job_data: Optional[Dict]
    ) -> Dict:
        """Generate skills section with AI-powered matching and prioritization"""
        
        skills_raw = profile_data.get('skills', '')
        soft_skills_raw = profile_data.get('soft_skills', '')
        
        # Extract skills from work experience
        tech_from_work = []
        for exp in user_data.get('work_experiences', []):
            tech_from_work.extend(exp.get('technologies_used', []) if isinstance(exp.get('technologies_used'), list) else [])
        
        # Build comprehensive skill analysis prompt
        if job_data:
            # Job-tailored skills with intelligent matching
            job_title = job_data.get('title', '')
            job_requirements = job_data.get('requirements', '')
            job_description = job_data.get('description', '')
            
            prompt = f"""Analyze candidate skills and match them with job requirements. Return optimized skills as JSON.

CANDIDATE SKILLS INVENTORY:
- Technical Skills: {skills_raw}
- Soft Skills: {soft_skills_raw}
- Technologies from Work History: {', '.join(tech_from_work[:30])}

TARGET JOB:
Title: {job_title}
Requirements: {job_requirements[:500]}
Description: {job_description[:500]}

INTELLIGENT SKILL MATCHING TASK:
1. **Analyze job requirements** and identify key technical skills, tools, platforms, and competencies mentioned
2. **Match candidate skills** to job requirements:
   - MUST INCLUDE: Skills/tools that directly match job requirements (highest priority)
   - SHOULD INCLUDE: Related/transferable skills and tools relevant to the role
   - OPTIONAL: Strong general skills that add value
3. **Categorize matched skills** into:
   - technical_skills: ONLY specific programming languages, frameworks, and technical methodologies (e.g., "Python", "React", "Django", "Machine Learning", "Data Analysis", "Statistical Modeling", "Research Design") - Include both tech and scientific/analytical skills (top 12 most relevant)
   - soft_skills: Leadership, communication, problem-solving, interpersonal skills aligned with job (top 8 most relevant)
   - tools_platforms: Development tools, software, cloud platforms, databases, CI/CD tools, scientific software (e.g., SPSS, R Studio, MATLAB) mentioned in job or candidate profile (top 12 most relevant)
   - languages: Human languages (keep all, max 4)
4. **Prioritization rules for ALL categories**:
   - Skills/tools matching job keywords come first in each category
   - Use skill synonyms (e.g., "JS" = "JavaScript", "React.js" = "React", "AWS" = "Amazon Web Services")
   - For technical_skills: Include specific programming languages, frameworks, AND scientific/research methodologies (e.g., "Statistical Analysis", "Qualitative Research", "Data Visualization", "GIS Mapping")
   - For tools_platforms: Include dev tools AND scientific/research tools (e.g., Docker, AWS, SPSS, R Studio, MATLAB, ArcGIS, Tableau)
   - Remove duplicate or redundant entries
   - Examples of GOOD technical skills: "React", "Python", "Machine Learning", "Statistical Analysis", "Research Design", "Data Science"
   - Examples of BAD technical skills: "General Programming", "Computer Skills", "Technical Knowledge"
5. **Quality control**:
   - Only include skills/tools the candidate actually has
   - Use professional terminology matching the job posting
   - Tools should be industry-standard names (e.g., "Git" not "version control")
   - Skills/tools should be concise (1-3 words each)
6. **Tools/Platforms special attention**:
   - Extract tools from job requirements (e.g., "Experience with Docker" → include "Docker")
   - Match development tools (IDEs, version control, project management)
   - Match cloud platforms (AWS, Azure, GCP)
   - Match databases (PostgreSQL, MongoDB, MySQL)
   - Match DevOps tools (Jenkins, GitLab CI, Terraform)

Return ONLY valid JSON in this exact format:
{{
  "technical_skills": ["skill1", "skill2", ...],
  "soft_skills": ["skill1", "skill2", ...],
  "tools_platforms": ["tool1", "tool2", ...],
  "languages": ["language1", "language2", ...]
}}

No explanations, no additional text, just the JSON object."""

        else:
            # General skills organization (no job targeting)
            prompt = f"""Organize and categorize candidate skills professionally. Return as JSON.

CANDIDATE SKILLS:
- Technical Skills: {skills_raw}
- Soft Skills: {soft_skills_raw}
- Technologies from Experience: {', '.join(tech_from_work[:25])}

TASK:
1. Categorize comprehensively into:
   - technical_skills: Programming, frameworks, scientific methodologies, research skills, analytical techniques (max 15 best skills)
   - soft_skills: Leadership, communication, interpersonal (max 10 best skills)
   - tools_platforms: Development tools, cloud platforms, databases, DevOps tools, scientific software (SPSS, R Studio, MATLAB, ArcGIS, Tableau) (max 15 best)
   - languages: Human languages (all, max 4)
2. Remove duplicates and redundancies
3. Use professional terminology (industry-standard names)
4. Prioritize most impressive/in-demand skills and tools first
5. For tools_platforms: Include dev tools (Git, Docker, Jenkins), cloud (AWS, Azure), databases (PostgreSQL, MongoDB), scientific tools (SPSS, MATLAB, ArcGIS)
6. For technical_skills: Include both tech skills AND scientific/analytical skills (Machine Learning, Statistical Analysis, Research Design, Data Visualization)
7. Skills/tools should be concise (1-4 words each)

Return ONLY valid JSON in this exact format:
{{
  "technical_skills": ["skill1", "skill2", ...],
  "soft_skills": ["skill1", "skill2", ...],
  "tools_platforms": ["tool1", "tool2", ...],
  "languages": ["language1", "language2", ...]
}}

No explanations, just JSON."""

        try:
            response_text = self._make_api_request_with_retry(prompt)
            
            # Clean response and parse JSON
            cleaned_response = response_text.strip()
            if cleaned_response.startswith('```'):
                # Remove markdown code blocks
                cleaned_response = cleaned_response.split('```')[1]
                if cleaned_response.startswith('json'):
                    cleaned_response = cleaned_response[4:]
                cleaned_response = cleaned_response.strip()
            
            skills_data = json.loads(cleaned_response)
            
            # Validate structure
            required_keys = ['technical_skills', 'soft_skills', 'tools_platforms', 'languages']
            for key in required_keys:
                if key not in skills_data or not isinstance(skills_data[key], list):
                    skills_data[key] = []
            
            # Ensure we have some skills (quality check)
            if not any(skills_data.values()):
                raise ValueError("AI returned empty skills data")
            
            print(f"[CV Builder V2] Skills matched: {sum(len(v) for v in skills_data.values())} total skills")
            
        except Exception as e:
            print(f"[CV Builder V2] Skills generation failed: {e}, using intelligent fallback")
            
            # Enhanced fallback with basic matching
            skills_list = []
            if isinstance(skills_raw, str):
                skills_list = [s.strip() for s in skills_raw.replace(';', ',').split(',') if s.strip()]
            
            soft_skills_list = []
            if isinstance(soft_skills_raw, str):
                soft_skills_list = [s.strip() for s in soft_skills_raw.replace(';', ',').split(',') if s.strip()]
            
            # Enhanced tools extraction from work experience
            tools_list = list(set(tech_from_work)) if tech_from_work else []
            
            # Basic job matching in fallback
            if job_data:
                job_text = f"{job_data.get('title', '')} {job_data.get('requirements', '')} {job_data.get('description', '')}".lower()
                
                # Prioritize skills that appear in job posting
                if skills_list:
                    matched_skills = [s for s in skills_list if s.lower() in job_text]
                    unmatched_skills = [s for s in skills_list if s.lower() not in job_text]
                    skills_list = (matched_skills + unmatched_skills)[:15]
                
                # Prioritize tools that appear in job posting
                if tools_list:
                    matched_tools = [t for t in tools_list if t.lower() in job_text]
                    unmatched_tools = [t for t in tools_list if t.lower() not in job_text]
                    tools_list = (matched_tools + unmatched_tools)[:15]
            else:
                skills_list = skills_list[:15]
                tools_list = tools_list[:15]
            
            skills_data = {
                'technical_skills': skills_list[:12] if skills_list else ['Python', 'JavaScript', 'SQL'],
                'soft_skills': soft_skills_list[:8] if soft_skills_list else ['Communication', 'Teamwork', 'Problem Solving', 'Leadership'],
                'tools_platforms': tools_list[:12] if tools_list else ['Git', 'Docker', 'Linux', 'VS Code'],
                'languages': [l.strip() for l in profile_data.get('languages', 'English').split(',')[:4]]
            }
        
        return skills_data
    
    def _generate_projects_section(
        self, user_data: Dict, profile_data: Dict, job_data: Optional[Dict]
    ) -> List[Dict]:
        """Generate projects section"""
        
        projects = user_data.get('projects', [])
        
        if not projects:
            return []
        
        # Limit to top 3 most relevant
        project_list = []
        
        for proj in projects[:3]:
            project_entry = {
                'name': proj.get('title', 'Project'),
                'role': proj.get('role', 'Contributor'),
                'description': proj.get('description', '')[:250],
                'technologies': proj.get('technologies', []) if isinstance(proj.get('technologies'), list) else [],
                'url': proj.get('url', '')
            }
            project_list.append(project_entry)
        
        return project_list
    
    def _generate_certifications_section(
        self, user_data: Dict, profile_data: Dict, job_data: Optional[Dict]
    ) -> List[Dict]:
        """Generate certifications section"""
        
        certifications = user_data.get('certifications', [])
        
        if not certifications:
            return []
        
        cert_list = []
        
        for cert in certifications:
            cert_entry = {
                'name': cert.get('name', 'Certification'),
                'issuer': cert.get('issuer', 'Organization'),
                'date': cert.get('issue_date', ''),
                'credential_id': cert.get('credential_id', ''),
                'url': cert.get('credential_url', '')
            }
            cert_list.append(cert_entry)
        
        return cert_list
    
    def _generate_awards_section(self, user_data: Dict) -> List[Dict]:
        """Generate awards section"""
        
        awards = user_data.get('awards', [])
        
        if not awards:
            return []
        
        award_list = []
        
        for award in awards:
            award_entry = {
                'title': award.get('title', 'Award'),
                'issuer': award.get('issuer', 'Organization'),
                'date': award.get('date_received', ''),
                'description': award.get('description', '')
            }
            award_list.append(award_entry)
        
        return award_list
    
    def _format_work_brief(self, experiences: List[Dict]) -> str:
        """Format work experience briefly for summary context"""
        if not experiences:
            return "No work experience provided"
        
        brief = []
        for exp in experiences[:3]:
            brief.append(f"- {exp.get('job_title', 'Role')} at {exp.get('company_name', 'Company')}")
        
        return '\n'.join(brief)
    
    def get_style_metadata(self) -> List[Dict]:
        """Get metadata about available CV styles"""
        return [
            {'id': 'professional', 'name': 'Professional', 'description': 'Clean, traditional layout'},
            {'id': 'modern', 'name': 'Modern', 'description': 'Sleek minimalist design'},
            {'id': 'creative', 'name': 'Creative', 'description': 'Visually engaging layout'},
            {'id': 'minimal', 'name': 'Minimal', 'description': 'Ultra-clean, content-focused'},
            {'id': 'executive', 'name': 'Executive', 'description': 'Sophisticated leadership-focused'},
            {'id': 'tech', 'name': 'Tech', 'description': 'Code-inspired design'},
            {'id': 'bold', 'name': 'Bold', 'description': 'Strong visual hierarchy'},
            {'id': 'elegant', 'name': 'Elegant', 'description': 'Refined and sophisticated'}
        ]
