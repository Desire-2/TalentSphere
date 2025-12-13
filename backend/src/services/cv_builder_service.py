"""
AI-Powered CV Builder Service
Uses Google Gemini AI to create tailored, creative CV content based on user profile and target job
Frontend handles all styling, templates, and PDF generation for maximum flexibility
"""
from datetime import datetime
import json
import os
import time
from typing import Dict, List, Optional, Any

# Conditional import for Google Gemini - only needed for AI content generation
try:
    from google import genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    genai = None


class CVBuilderService:
    """Service for generating AI-powered, job-tailored CV content (frontend handles rendering)"""
    
    def __init__(self):
        """Initialize the CV builder with Gemini AI client"""
        self.client = None
        self._api_key = os.getenv('GEMINI_API_KEY')
        self._last_request_time = 0
        self._min_request_interval = 2  # Minimum 2 seconds between requests
    
    def _get_client(self):
        """Lazy initialization of Gemini client"""
        if not GEMINI_AVAILABLE:
            raise ValueError(
                "Google Gemini package is not installed. "
                "Install it with: pip install google-generativeai"
            )
        
        if self.client is None:
            if not self._api_key:
                raise ValueError(
                    "GEMINI_API_KEY not found in environment variables. "
                    "Please add it to your .env file to use the CV Builder."
                )
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
                # Wait to respect rate limits
                self._rate_limit_wait()
                
                # Make the API call
                response = client.models.generate_content(
                    model="gemini-flash-latest",  # Use stable flash model
                    contents=prompt,
                    config={
                        'temperature': 0.7,
                        'max_output_tokens': 2048,
                    }
                )
                
                # Check if response has valid text
                if not response:
                    print(f"[CV Builder] Attempt {attempt + 1}: No response object received")
                    if attempt < max_retries - 1:
                        time.sleep(2)
                        continue
                    raise Exception("API returned no response object")
                
                # Check for blocked content
                if hasattr(response, 'prompt_feedback'):
                    feedback = response.prompt_feedback
                    if hasattr(feedback, 'block_reason') and feedback.block_reason:
                        print(f"[CV Builder] Content blocked: {feedback.block_reason}")
                        raise Exception(f"Content was blocked by safety filters: {feedback.block_reason}")
                
                # Get the text from response
                if not hasattr(response, 'text') or not response.text:
                    # Try to get candidates
                    if hasattr(response, 'candidates') and response.candidates:
                        candidate = response.candidates[0]
                        if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                            text = ''.join(part.text for part in candidate.content.parts if hasattr(part, 'text'))
                            if text:
                                return text
                    
                    print(f"[CV Builder] Attempt {attempt + 1}: Response has no text")
                    print(f"[CV Builder] Response object: {dir(response)}")
                    if attempt < max_retries - 1:
                        time.sleep(2)
                        continue
                    raise Exception("API returned empty response - no text content found")
                
                return response.text
                
            except Exception as e:
                error_str = str(e)
                
                # Check if it's a rate limit error
                if '429' in error_str or 'RESOURCE_EXHAUSTED' in error_str:
                    if attempt < max_retries - 1:
                        # Extract retry delay from error message if available
                        wait_time = (2 ** attempt) * 2  # Exponential backoff: 2s, 4s, 8s
                        
                        # Try to parse the suggested retry delay from error
                        if 'retry in' in error_str.lower():
                            try:
                                # Extract milliseconds and convert to seconds
                                import re
                                match = re.search(r'retry in ([\d.]+)ms', error_str)
                                if match:
                                    suggested_wait = float(match.group(1)) / 1000
                                    wait_time = max(wait_time, suggested_wait + 1)
                            except:
                                pass
                        
                        print(f"Rate limit hit. Waiting {wait_time}s before retry {attempt + 1}/{max_retries}...")
                        time.sleep(wait_time)
                        continue
                    else:
                        raise Exception(
                            "API rate limit exceeded. Please wait a few minutes and try again. "
                            "Free tier limits: 15 requests per minute, 1500 requests per day."
                        )
                else:
                    # Not a rate limit error, raise it
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
        Generate AI-optimized CV content tailored to specific job
        
        Args:
            user_data: Complete user profile including work experience, education, skills
            job_data: Target job information (title, description, requirements)
            cv_style: Style preference (professional, creative, modern, minimal, executive)
            include_sections: Sections to include (work, education, skills, projects, etc.)
            
        Returns:
            Dictionary with structured CV content and metadata
        """
        if include_sections is None:
            include_sections = ['work', 'education', 'skills', 'summary', 'projects', 'certifications']
        
        # Debug logging
        print(f"[CV Builder Service] Generating CV with job_data: {job_data}")
        print(f"[CV Builder Service] Style: {cv_style}, Sections: {include_sections}")
        
        try:
            # Build comprehensive prompt for CV generation
            prompt = self._build_cv_generation_prompt(user_data, job_data, cv_style, include_sections)
            
            print(f"[CV Builder Service] Prompt length: {len(prompt)} characters")
        except Exception as prompt_err:
            print(f"[CV Builder Service] Error building prompt: {str(prompt_err)}")
            raise Exception(f"Failed to build CV prompt: {str(prompt_err)}")
        
        try:
            # Generate CV content using Gemini with retry logic
            response_text = self._make_api_request_with_retry(prompt)
            
            # Log the raw response for debugging
            print(f"[CV Builder] Received response length: {len(response_text)} characters")
            
            # Parse the AI response
            cv_content = self._parse_cv_response(response_text)
            
            # Validate that all selected sections are present
            cv_content = self._validate_and_fill_sections(cv_content, include_sections)
            
            # Add metadata
            cv_content['metadata'] = {
                'generated_at': datetime.utcnow().isoformat(),
                'style': cv_style,
                'tailored_for_job': job_data.get('title') if job_data else None,
                'sections_included': include_sections,
                'user_id': user_data.get('id')
            }
            
            return cv_content
            
        except Exception as e:
            # Save problematic response for debugging
            if 'response_text' in locals():
                try:
                    import os
                    debug_dir = os.path.join(os.path.dirname(__file__), '../../debug_responses')
                    os.makedirs(debug_dir, exist_ok=True)
                    debug_file = os.path.join(debug_dir, f'failed_cv_response_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}.txt')
                    with open(debug_file, 'w') as f:
                        f.write(f"Error: {str(e)}\n\n")
                        f.write("=" * 80 + "\n")
                        f.write("RAW RESPONSE:\n")
                        f.write("=" * 80 + "\n")
                        f.write(response_text)
                    print(f"[CV Builder] Saved problematic response to {debug_file}")
                except Exception as save_err:
                    print(f"[CV Builder] Could not save debug response: {save_err}")
            
            raise Exception(f"CV generation failed: {str(e)}")
    
    def _build_cv_generation_prompt(
        self, 
        user_data: Dict, 
        job_data: Optional[Dict],
        cv_style: str,
        include_sections: List[str]
    ) -> str:
        """Build comprehensive prompt for AI CV generation"""
        
        # Extract user information
        personal_info = self._format_personal_info(user_data)
        profile_data = user_data.get('job_seeker_profile', {})
        work_experience = self._format_work_experience(user_data.get('work_experiences', []))
        education = self._format_education(user_data.get('educations', []))
        skills = self._format_skills(profile_data)
        certifications = self._format_certifications(user_data.get('certifications', []))
        projects = self._format_projects(user_data.get('projects', []))
        awards = self._format_awards(user_data.get('awards', []))
        
        # Determine which sections have actual data
        has_work = bool(user_data.get('work_experiences'))
        has_education = bool(user_data.get('educations'))
        has_skills = bool(profile_data.get('skills'))
        has_certifications = bool(user_data.get('certifications'))
        has_projects = bool(user_data.get('projects'))
        has_awards = bool(user_data.get('awards'))
        
        # Build job matching analysis if job data provided
        job_context = ""
        if job_data:
            job_context = f"""

TARGET JOB CONTEXT:
The CV should be specifically optimized for this position:
- Job Title: {job_data.get('title', 'Not specified')}
- Company: {job_data.get('company_name', 'Not specified')}
- Industry: {job_data.get('category', 'Not specified')}
- Job Description: {job_data.get('description', 'Not specified')}
- Required Skills: {job_data.get('requirements', 'Not specified')}
- Experience Level: {job_data.get('experience_level', 'Not specified')}

CRITICAL JOB MATCHING INSTRUCTIONS:
1. **Analyze & Match**: Carefully analyze the job requirements and match them with the candidate's profile
2. **Prioritize Relevance**: Highlight work experiences that closely match the job requirements
3. **Keyword Optimization**: Use keywords from the job description naturally throughout the CV
4. **Skills Alignment**: Emphasize skills that directly match job requirements at the top
5. **Achievement Quantification**: Quantify achievements that demonstrate relevant capabilities for this role
6. **Experience Relevance**: If multiple work experiences exist, prioritize and expand those most relevant to this position
7. **Transferable Skills**: If changing industries/roles, emphasize transferable skills and adaptability
8. **Professional Summary**: Tailor the summary to position the candidate as ideal for THIS specific role
9. **Technical Match**: Highlight technologies/tools mentioned in job description that candidate has used
10. **Industry Keywords**: Include industry-specific terminology from the job posting
"""
        else:
            job_context = """

NO SPECIFIC JOB TARGET:
Create a versatile, comprehensive CV that showcases the candidate's full profile.
Use ALL available profile information to create the most complete picture.
Focus on creating a strong general impression with broad appeal across multiple opportunities.
"""
        
        # Build section-specific instructions
        section_requirements = self._build_section_requirements(include_sections, {
            'work': has_work,
            'education': has_education,
            'skills': has_skills,
            'certifications': has_certifications,
            'projects': has_projects,
            'awards': has_awards
        })
        
        prompt = f"""You are TalentSphere's Elite CV Architect, an AI specialist with deep expertise in:
- Resume writing and applicant tracking system (ATS) optimization
- Industry-specific hiring trends and employer expectations
- Professional branding and career positioning
- Achievement-based storytelling and quantifiable impact presentation
- Modern CV design principles and readability optimization

YOUR MISSION:
Create a {cv_style} CV that FITS ON 2 PAGES MAXIMUM and is strategically optimized for success.
This CV must be compelling, ATS-friendly, extremely concise, and showcase the candidate as the ideal match for their target role.

LENGTH CONSTRAINT: The final CV MUST fit on exactly 2 pages when rendered. Be ruthlessly selective:
- Include only the most relevant and impactful information
- Limit work experience to 3-4 most recent/relevant positions
- Maximum 3 bullet points per job (one line each)
- Limit projects to 2-3 most impressive
- Keep skills list to top 12 items
- Professional summary must be 2-3 sentences maximum (50 words)
- All content must be concise and impactful

COMPLETE CANDIDATE PROFILE:
{personal_info}

PROFESSIONAL PROFILE:
- Professional Title: {profile_data.get('professional_title', 'Not specified')}
- Professional Summary: {profile_data.get('professional_summary', 'Not provided')}
- Desired Position: {profile_data.get('desired_position', 'Not specified')}
- Years of Experience: {profile_data.get('years_of_experience', 0)}
- Education Level: {profile_data.get('education_level', 'Not specified')}
- LinkedIn: {profile_data.get('linkedin_url', 'Not provided')}
- GitHub: {profile_data.get('github_url', 'Not provided')}
- Portfolio: {profile_data.get('portfolio_url', 'Not provided')}
- Website: {profile_data.get('website_url', 'Not provided')}

WORK EXPERIENCE:
{work_experience}

EDUCATION:
{education}

SKILLS & EXPERTISE:
{skills}

CERTIFICATIONS & LICENSES:
{certifications}

PROJECTS & PORTFOLIO:
{projects}

AWARDS & ACHIEVEMENTS:
{awards}
{job_context}

CV STYLE GUIDE - {cv_style.upper()}:
{self._get_style_guidelines(cv_style)}

CRITICAL: REQUIRED SECTIONS TO INCLUDE:
{section_requirements}

OUTPUT REQUIREMENTS:

Return a JSON object with the following structure:

{{
  "professional_summary": "A compelling 2-3 sentence summary (MAXIMUM 50 words) that positions the candidate uniquely and highlights their value proposition. Use strong action words and quantifiable achievements.",
  
  "contact_information": {{
    "full_name": "Candidate's full name",
    "professional_title": "Current or target professional title",
    "email": "Contact email",
    "phone": "Phone number",
    "location": "City, State/Country",
    "linkedin": "LinkedIn profile URL if available",
    "portfolio": "Portfolio/website URL if available",
    "github": "GitHub profile if relevant"
  }},
  
  "core_competencies": [
    "5-8 key skills organized by relevance to target job",
    "Mix of technical and soft skills",
    "Use industry-standard terminology"
  ],
  
  "professional_experience": [
    {{
      "job_title": "Role title",
      "company": "Company name",
      "location": "City, State",
      "duration": "Month Year - Month Year (or Present)",
      "description": "Brief 1-sentence role context",
      "achievements": [
        "Bullet point starting with action verb, including quantifiable results (X% improvement, $Y saved, Z% growth)",
        "MAXIMUM 3 achievements per role - select only the most impactful",
        "Each bullet must be ONE line maximum (10-15 words)"
      ],
      "technologies": ["Relevant tools", "platforms", "methodologies"]
    }}
  ],
  
  "education": [
    {{
      "degree": "Degree type and field",
      "institution": "University/School name",
      "location": "City, State",
      "graduation_date": "Month Year",
      "gpa": "GPA if 3.5+ or as appropriate",
      "honors": "Academic honors if any",
      "relevant_coursework": ["Key courses if early career or highly relevant"]
    }}
  ],
  
  "certifications": [
    {{
      "name": "Certification name",
      "issuer": "Issuing organization",
      "date": "Month Year",
      "credential_id": "ID if applicable"
    }}
  ],
  
  "projects": [
    {{
      "name": "Project name",
      "role": "Your role",
      "description": "1-2 sentence description of project and your contribution",
      "impact": "Quantifiable outcome or achievement",
      "technologies": ["Tech stack used"]
    }}
  ],
  
  "technical_skills": {{
    "programming_languages": ["Languages if applicable"],
    "frameworks_tools": ["Frameworks, platforms, tools"],
    "methodologies": ["Agile, Scrum, etc."],
    "soft_skills": ["Communication", "Leadership", etc.]
  }},
  
  "awards": [
    {{
      "title": "Award name",
      "issuer": "Issuing organization",
      "date": "Month Year",
      "description": "Brief context if needed"
    }}
  ],
  
  "optimization_tips": [
    "Specific suggestions for further improvement",
    "Keywords to potentially add",
    "Gaps to address"
  ],
  
  "ats_score": {{
    "estimated_score": 85,
    "strengths": ["What makes this CV ATS-friendly"],
    "improvements": ["Suggestions for better ATS performance"]
  }}
}}

CRITICAL GUIDELINES:
1. **MANDATORY SECTION INCLUSION**: Every section listed in "REQUIRED SECTIONS TO INCLUDE" MUST be present in the output JSON, even if data is limited. Generate appropriate content based on available information.
2. **2-PAGE MAXIMUM**: The final CV MUST fit on 2 pages maximum when printed. Be extremely concise.
3. **Quantify Everything**: Every achievement should include numbers, percentages, or measurable outcomes
4. **Action-Oriented Language**: Start every bullet with strong action verbs (Led, Developed, Increased, Reduced, etc.)
5. **Extreme Conciseness**: Each bullet point must be ONE line only (10-15 words maximum)
6. **Relevance First**: Prioritize information most relevant to the target job - exclude less relevant items
7. **ATS Optimization**: Use standard section headers, avoid tables/graphics in text, include relevant keywords
8. **Truth & Accuracy**: Base all content on provided data - enhance presentation, not facts
9. **Professional Tone**: Maintain appropriate formality for {cv_style} style
10. **Modern Best Practices**: Follow current CV trends (no "References available upon request", etc.)
11. **Personal Branding**: Create a cohesive narrative that positions the candidate strategically
12. **Maximum Entries**: Work Experience: Top 3-4 roles only | Projects: Top 2-3 only | Skills: Top 12 only
13. **Job Matching**: If target job provided, explicitly match profile to job requirements in summary and prioritize relevant experience/skills
14. **Profile Utilization**: Use ALL 19 job_seeker_profile fields where applicable (professional_title, years_of_experience, desired_position, education_level, skills, soft_skills, salary preferences, job_type_preference, availability, LinkedIn, GitHub, portfolio, website URLs, etc.)

SECTION VALIDATION CHECKLIST (MUST VERIFY BEFORE RETURNING):
- If "summary" in required sections → professional_summary field MUST have content
- If "experience" in required sections → professional_experience array MUST exist (can be empty [] if no data)
- If "education" in required sections → education array MUST exist (can be empty [] if no data)
- If "skills" in required sections → technical_skills or core_competencies MUST have content
- If "certifications" in required sections → certifications array MUST exist (can be empty [] if no data)
- If "projects" in required sections → projects array MUST exist (can be empty [] if no data)
- If "awards" in required sections → awards array MUST exist (can be empty [] if no data)

JSON FORMATTING REQUIREMENTS (CRITICAL):
- Return ONLY the JSON object, no additional text before or after
- ALL property names MUST be enclosed in double quotes (e.g., "property_name": value)
- Use double quotes for all string values (NEVER single quotes)
- NO trailing commas after the last item in arrays or objects
- Properly escape special characters in strings (quotes, backslashes, newlines)
- Arrays of strings must have each element in double quotes: ["item1", "item2"]
- Empty arrays should be [] not empty
- The response must be valid, parseable JSON that passes strict JSON validation

Example of correct formatting:
{{
  "property": "value",
  "array": ["item1", "item2"],
  "nested": {{
    "key": "value"
  }}
}}
"""
        
        return prompt
    
    def _format_personal_info(self, user_data: Dict) -> str:
        """Format personal information for prompt"""
        return f"""
Name: {user_data.get('first_name', '')} {user_data.get('last_name', '')}
Email: {user_data.get('email', '')}
Phone: {user_data.get('phone', 'Not provided')}
Location: {user_data.get('location', 'Not specified')}
Bio: {user_data.get('bio', 'Not provided')}
"""
    
    def _format_work_experience(self, experiences: List[Dict]) -> str:
        """Format work experience for prompt"""
        if not experiences:
            return "No work experience provided."
        
        formatted = []
        for exp in experiences:
            entry = f"""
Position: {exp.get('job_title', 'Not specified')}
Company: {exp.get('company_name', 'Not specified')}
Location: {exp.get('company_location', 'Not specified')}
Type: {exp.get('employment_type', 'Not specified')}
Duration: {exp.get('start_date', 'Unknown')} to {exp.get('end_date', 'Present') if not exp.get('is_current') else 'Present'}
Description: {exp.get('description', 'No description')}
Key Responsibilities: {', '.join(exp.get('key_responsibilities', [])) if isinstance(exp.get('key_responsibilities'), list) else exp.get('key_responsibilities', 'None listed')}
Achievements: {', '.join(exp.get('achievements', [])) if isinstance(exp.get('achievements'), list) else exp.get('achievements', 'None listed')}
Technologies: {', '.join(exp.get('technologies_used', [])) if isinstance(exp.get('technologies_used'), list) else exp.get('technologies_used', 'None listed')}
"""
            formatted.append(entry)
        
        return "\n---\n".join(formatted)
    
    def _format_education(self, educations: List[Dict]) -> str:
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
Relevant Coursework: {', '.join(edu.get('relevant_coursework', [])) if isinstance(edu.get('relevant_coursework'), list) else edu.get('relevant_coursework', 'None listed')}
"""
            formatted.append(entry)
        
        return "\n---\n".join(formatted)
    
    def _format_skills(self, profile: Dict) -> str:
        """Format skills from job seeker profile"""
        skills_data = profile.get('skills', [])
        if isinstance(skills_data, str):
            return f"Skills: {skills_data}"
        elif isinstance(skills_data, list):
            return f"Skills: {', '.join(skills_data)}"
        return "No skills information provided."
    
    def _format_certifications(self, certifications: List[Dict]) -> str:
        """Format certifications for prompt"""
        if not certifications:
            return "No certifications provided."
        
        formatted = []
        for cert in certifications:
            entry = f"{cert.get('name', 'Unnamed')} - {cert.get('issuer', 'Unknown issuer')} ({cert.get('issue_date', 'Date unknown')})"
            formatted.append(entry)
        
        return "\n".join(formatted)
    
    def _format_projects(self, projects: List[Dict]) -> str:
        """Format projects for prompt"""
        if not projects:
            return "No projects provided."
        
        formatted = []
        for proj in projects:
            entry = f"""
Project: {proj.get('title', 'Unnamed')}
Description: {proj.get('description', 'No description')}
Role: {proj.get('role', 'Not specified')}
Technologies: {', '.join(proj.get('technologies', [])) if isinstance(proj.get('technologies'), list) else proj.get('technologies', 'None listed')}
URL: {proj.get('url', 'Not provided')}
"""
            formatted.append(entry)
        
        return "\n---\n".join(formatted)
    
    def _format_awards(self, awards: List[Dict]) -> str:
        """Format awards for prompt"""
        if not awards:
            return "No awards provided."
        
        formatted = []
        for award in awards:
            entry = f"{award.get('title', 'Unnamed')} - {award.get('issuer', 'Unknown issuer')} ({award.get('date', 'Date unknown')})"
            formatted.append(entry)
        
        return "\n".join(formatted)
    
    def _build_section_requirements(self, include_sections: List[str], has_data: Dict[str, bool]) -> str:
        """Build detailed section requirements based on what user selected and what data exists"""
        requirements = []
        
        section_instructions = {
            'summary': {
                'required': True,
                'instruction': "**Professional Summary**: REQUIRED. 2-3 sentences (50 words max) highlighting key strengths, experience, and career focus. Must be present even if no data available - synthesize from available information."
            },
            'experience': {
                'required': has_data.get('work', False),
                'instruction': "**Work Experience**: Include ALL relevant work experiences with company, role, dates, and 2-3 achievement bullets each. If user selected this section, it MUST appear even if empty."
            },
            'education': {
                'required': has_data.get('education', False),
                'instruction': "**Education**: Include ALL educational qualifications with institution, degree, field, and dates. If user selected this section, it MUST appear even if empty."
            },
            'skills': {
                'required': has_data.get('skills', False),
                'instruction': "**Skills**: Top 12 most relevant skills organized by category (Technical, Soft Skills, Tools/Technologies, Languages). If user selected this section, it MUST appear even if empty."
            },
            'certifications': {
                'required': has_data.get('certifications', False),
                'instruction': "**Certifications**: All certifications with issuer and date. If user selected this section, it MUST appear even if empty."
            },
            'projects': {
                'required': has_data.get('projects', False),
                'instruction': "**Projects**: 2-3 most impressive/relevant projects with description, role, and technologies. If user selected this section, it MUST appear even if empty."
            },
            'awards': {
                'required': has_data.get('awards', False),
                'instruction': "**Awards & Achievements**: All awards with issuer and date. If user selected this section, it MUST appear even if empty."
            }
        }
        
        for section in include_sections:
            if section in section_instructions:
                requirements.append(section_instructions[section]['instruction'])
        
        if not requirements:
            return "Include ALL standard CV sections: Summary, Experience, Education, Skills"
        
        return "\n".join([f"{i+1}. {req}" for i, req in enumerate(requirements)])
    
    def _get_style_guidelines(self, style: str) -> str:
        """Get style-specific guidelines"""
        styles = {
            "professional": """
- Clean, traditional layout with clear section hierarchies
- Conservative color scheme (navy, dark gray, black)
- Focus on substance over style
- Chronological organization
- Formal tone throughout
- Suitable for corporate, finance, legal, consulting roles
""",
            "creative": """
- Modern, visually engaging layout with creative elements
- Use of color and design elements (while maintaining ATS compatibility)
- Personality and uniqueness encouraged
- Portfolio/project highlights prominent
- Conversational yet professional tone
- Suitable for design, marketing, media, creative industries
""",
            "modern": """
- Clean, minimalist design with subtle modern touches
- Strategic use of color and white space
- Icons and visual elements for quick scanning
- Skills and achievements prominently featured
- Professional but approachable tone
- Suitable for tech, startups, digital industries
""",
            "minimal": """
- Ultra-clean, no-frills layout
- Maximum white space, minimal visual elements
- Focus entirely on content and achievements
- Simple typography and structure
- Direct, concise tone
- Suitable for senior executive, academic, research roles
""",
            "executive": """
- Sophisticated, leadership-focused presentation
- Strategic achievements and business impact emphasized
- Board-level language and metrics
- Leadership competencies highlighted
- Authoritative, confident tone
- Suitable for C-suite, VP, director-level positions
"""
        }
        
        return styles.get(style, styles["professional"])
    
    def _parse_cv_response(self, response_text: str) -> Dict:
        """Parse AI response into structured CV data"""
        import re
        
        try:
            # Validate input
            if not response_text or not isinstance(response_text, str):
                raise Exception("Invalid or empty response from AI")
            
            # Remove markdown code blocks if present
            cleaned = response_text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            
            cleaned = cleaned.strip()
            
            # First attempt: Try with json-repair library (most robust)
            try:
                from json_repair import repair_json
                repaired = repair_json(cleaned)
                cv_data = json.loads(repaired)
                print("[CV Builder] Successfully parsed with json-repair")
                return cv_data
            except ImportError:
                print("[CV Builder] json-repair not available, using fallback methods")
            except Exception as repair_err:
                print(f"[CV Builder] json-repair failed: {repair_err}, trying manual fixes")
            
            # Second attempt: Apply manual fixes
            cleaned = self._fix_json_formatting(cleaned)
            cv_data = json.loads(cleaned)
            print("[CV Builder] Successfully parsed with manual fixes")
            return cv_data
            
        except json.JSONDecodeError as e:
            # Try alternative parsing strategies
            print(f"[CV Builder] Initial JSON parse failed: {str(e)}")
            
            # Strategy 1: Extract JSON and try repair library
            if response_text:
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    try:
                        from json_repair import repair_json
                        json_str = json_match.group()
                        repaired = repair_json(json_str)
                        result = json.loads(repaired)
                        print("[CV Builder] Fallback 1 (extract + repair) succeeded")
                        return result
                    except ImportError:
                        pass
                    except Exception as inner_e:
                        print(f"[CV Builder] Fallback 1 failed: {inner_e}")
                        
                    # Try with manual fixes if repair library didn't work
                    try:
                        json_str = json_match.group()
                        json_str = self._fix_json_formatting(json_str)
                        result = json.loads(json_str)
                        print("[CV Builder] Fallback 1b (extract + manual fix) succeeded")
                        return result
                    except Exception as e1b:
                        print(f"[CV Builder] Fallback 1b failed: {e1b}")
            
            # Strategy 2: Try ast.literal_eval for Python-like dicts
            try:
                import ast
                cleaned_for_ast = response_text.strip()
                if cleaned_for_ast.startswith("```"):
                    cleaned_for_ast = re.sub(r'```json\s*', '', cleaned_for_ast)
                    cleaned_for_ast = re.sub(r'```\s*$', '', cleaned_for_ast)
                result = ast.literal_eval(cleaned_for_ast.strip())
                if isinstance(result, dict):
                    print("[CV Builder] Fallback 2 (ast.literal_eval) succeeded")
                    return result
            except Exception as ast_err:
                print(f"[CV Builder] Fallback 2 (ast.literal_eval) failed: {ast_err}")
            
            # Strategy 3: Try json5 if available
            try:
                import json5
                result = json5.loads(response_text)
                print("[CV Builder] Fallback 3 (json5) succeeded")
                return result
            except ImportError:
                print("[CV Builder] json5 not available for fallback parsing")
            except Exception as json5_err:
                print(f"[CV Builder] Fallback 3 (json5) failed: {json5_err}")
            
            # If all else fails, provide detailed error with character analysis
            error_position = e.pos if hasattr(e, 'pos') else 'unknown'
            context_start = max(0, int(error_position) - 100) if isinstance(error_position, (int, float)) else 0
            context_end = min(len(response_text), int(error_position) + 100) if isinstance(error_position, (int, float)) else 200
            error_context = response_text[context_start:context_end] if response_text else 'N/A'
            
            # Show the exact character causing the issue
            error_char = ''
            if isinstance(error_position, (int, float)) and 0 <= error_position < len(response_text):
                error_char = response_text[int(error_position)]
                error_char_repr = repr(error_char)
                print(f"[CV Builder] Character at error position {error_position}: {error_char_repr} (ord: {ord(error_char)})")
            
            raise Exception(
                f"Failed to parse CV response after multiple attempts. JSON error: {str(e)}. "
                f"Error near: ...{error_context}..."
            )
    
    def _validate_and_fill_sections(self, cv_data: Dict, include_sections: List[str]) -> Dict:
        """
        Validate that all selected sections are present in CV data.
        Fill missing sections with empty arrays or default content.
        
        Args:
            cv_data: Parsed CV data from AI
            include_sections: List of sections user selected
            
        Returns:
            CV data with all required sections present
        """
        section_mapping = {
            'summary': 'professional_summary',
            'experience': 'professional_experience',
            'education': 'education',
            'skills': ['technical_skills', 'core_competencies'],  # Multiple possible keys
            'certifications': 'certifications',
            'projects': 'projects',
            'awards': 'awards'
        }
        
        for section in include_sections:
            if section not in section_mapping:
                continue
                
            mapping = section_mapping[section]
            
            # Handle sections that can have multiple keys
            if isinstance(mapping, list):
                has_any = any(key in cv_data for key in mapping)
                if not has_any:
                    # Add the first key as default
                    cv_data[mapping[0]] = self._get_default_section_content(section)
                    print(f"[CV Builder] Added missing section: {mapping[0]}")
            else:
                # Single key mapping
                if mapping not in cv_data:
                    cv_data[mapping] = self._get_default_section_content(section)
                    print(f"[CV Builder] Added missing section: {mapping}")
        
        return cv_data
    
    def _get_default_section_content(self, section: str):
        """Get default content for a missing section"""
        defaults = {
            'summary': 'Experienced professional seeking new opportunities to contribute skills and expertise.',
            'experience': [],
            'education': [],
            'skills': {
                'programming_languages': [],
                'frameworks_tools': [],
                'methodologies': [],
                'soft_skills': []
            },
            'certifications': [],
            'projects': [],
            'awards': []
        }
        return defaults.get(section, [])
    
    def _fix_json_formatting(self, json_str: str) -> str:
        """
        Apply comprehensive fixes to malformed JSON from AI responses
        
        Args:
            json_str: Potentially malformed JSON string
            
        Returns:
            Fixed JSON string ready for parsing
        """
        import re
        
        # Strategy: Parse line by line and fix issues contextually
        lines = json_str.split('\n')
        fixed_lines = []
        in_string = False
        current_line = ""
        
        for line in lines:
            # Count unescaped quotes to track if we're inside a string value
            quote_count = 0
            i = 0
            while i < len(line):
                if line[i] == '"' and (i == 0 or line[i-1] != '\\'):
                    quote_count += 1
                i += 1
            
            # If we have an odd number of quotes, we're starting or ending a multi-line string
            # This is actually invalid JSON - strings shouldn't span lines
            if quote_count % 2 == 1:
                # If this line has an opening quote for a property value, it's likely malformed
                # Try to join it with the next line
                current_line += line
                in_string = not in_string
                if not in_string:
                    # String is complete, add it
                    fixed_lines.append(current_line)
                    current_line = ""
                continue
            
            if in_string:
                # We're in the middle of a multi-line string, append to current
                current_line += " " + line.strip()
            else:
                # Normal line processing
                if current_line:
                    fixed_lines.append(current_line)
                    current_line = ""
                fixed_lines.append(line)
        
        if current_line:
            fixed_lines.append(current_line)
        
        json_str = '\n'.join(fixed_lines)
        
        # Now apply simpler fixes
        # 1. Remove trailing commas
        json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
        
        # 2. Remove comments
        json_str = re.sub(r'//.*?$', '', json_str, flags=re.MULTILINE)
        json_str = re.sub(r'/\*.*?\*/', '', json_str, flags=re.DOTALL)
        
        # 3. Fix multiple consecutive commas
        json_str = re.sub(r',\s*,+', ',', json_str)
        
        return json_str
    
    def get_style_metadata(self) -> List[Dict]:
        """
        Get metadata about available CV styles for frontend rendering
        
        Returns:
            List of style definitions with IDs and descriptions
        """
        return [
            {
                'id': 'professional',
                'name': 'Professional',
                'description': 'Clean, traditional layout ideal for corporate roles',
                'colorScheme': 'Blue & Gray',
                'bestFor': ['Corporate', 'Finance', 'Consulting', 'Legal']
            },
            {
                'id': 'creative',
                'name': 'Creative',
                'description': 'Modern, visually engaging with gradient accents',
                'colorScheme': 'Purple Gradient',
                'bestFor': ['Design', 'Marketing', 'Media', 'Creative Industries']
            },
            {
                'id': 'modern',
                'name': 'Modern',
                'description': 'Sleek minimalist design with contemporary elements',
                'colorScheme': 'Teal & White',
                'bestFor': ['Tech', 'Startups', 'Digital', 'Product']
            },
            {
                'id': 'minimal',
                'name': 'Minimal',
                'description': 'Ultra-clean, content-focused with maximum white space',
                'colorScheme': 'Black & White',
                'bestFor': ['Executive', 'Academic', 'Research', 'Senior Roles']
            },
            {
                'id': 'executive',
                'name': 'Executive',
                'description': 'Sophisticated leadership-focused presentation',
                'colorScheme': 'Navy & Gold',
                'bestFor': ['C-Suite', 'VP', 'Director', 'Senior Management']
            },
            {
                'id': 'tech',
                'name': 'Tech',
                'description': 'Code-inspired with monospace accents',
                'colorScheme': 'Green & Dark',
                'bestFor': ['Software Engineering', 'DevOps', 'Data Science']
            },
            {
                'id': 'bold',
                'name': 'Bold',
                'description': 'High-impact design with strong contrasts',
                'colorScheme': 'Red & Black',
                'bestFor': ['Sales', 'Business Development', 'Leadership']
            },
            {
                'id': 'elegant',
                'name': 'Elegant',
                'description': 'Sophisticated with serif typography',
                'colorScheme': 'Rose Gold & Cream',
                'bestFor': ['Luxury', 'Fashion', 'Hospitality']
            }
        ]
