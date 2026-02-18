"""
CV Builder Prompt Builder (Enhanced)
Constructs deeply job-tailored AI prompts for CV generation
with advanced matching analysis and strategic content guidance
"""
from typing import Dict, List, Optional, Any
from .data_formatter import CVDataFormatter
from .job_matcher import CVJobMatcher


class CVPromptBuilder:
    """Builds comprehensive, job-optimized prompts for AI CV generation"""
    
    def __init__(self):
        self.formatter = CVDataFormatter()
        self.matcher = CVJobMatcher()
    
    def build_full_cv_prompt(
        self,
        user_data: Dict,
        job_data: Optional[Dict],
        cv_style: str,
        include_sections: List[str]
    ) -> str:
        """Build deeply job-tailored prompt for full CV generation"""
        
        # Format all data sections
        personal_info = self.formatter.format_personal_info(user_data)
        profile = user_data.get('job_seeker_profile', {})
        work_exp = self.formatter.format_work_experience(user_data.get('work_experiences', []))
        education = self.formatter.format_education(user_data.get('educations', []))
        skills = self.formatter.format_skills(profile)
        certifications = self.formatter.format_certifications(user_data.get('certifications', []))
        projects = self.formatter.format_projects(user_data.get('projects', []))
        awards = self.formatter.format_awards(user_data.get('awards', []))
        references = self.formatter.format_references(user_data.get('references', []))
        languages = self.formatter.format_languages(profile)
        
        # Build advanced job context with matching analysis
        job_context = self._build_job_context(user_data, job_data) if job_data else self._build_general_context(profile)
        
        # Get style guidelines
        style_guide = self._get_style_guidelines(cv_style)
        
        # Build section requirements
        section_reqs = self._build_section_requirements(include_sections, user_data)
        
        # Build the prompt with strategic instructions
        prompt = f"""You are a world-class CV/Resume strategist with 20+ years of experience in career consulting, executive recruiting, and ATS optimization. You have successfully helped thousands of candidates land interviews at top companies.

Your task: Generate a strategically tailored CV that maximizes this candidate's chances of getting an interview for the target role.

{job_context}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CANDIDATE PROFILE DATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{personal_info}

Professional Title: {profile.get('professional_title', 'Professional')}
Years of Experience: {profile.get('years_of_experience', 0)}
Career Level: {profile.get('career_level', 'Not specified')}
Professional Summary: {profile.get('professional_summary', 'Not provided')}
Desired Position: {profile.get('desired_position', 'Open to opportunities')}

📊 WORK EXPERIENCE:
{work_exp}

🎓 EDUCATION:
{education}

💡 SKILLS:
{skills}
Soft Skills: {profile.get('soft_skills', 'Not specified')}

📜 CERTIFICATIONS:
{certifications}

🔨 PROJECTS:
{projects}

🏆 AWARDS:
{awards}

👤 REFERENCES:
{references}

🌐 LANGUAGES:
{languages}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 CV STYLE: {cv_style.upper()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{style_guide}

📋 REQUIRED SECTIONS TO GENERATE:
{section_reqs}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 OUTPUT FORMAT (STRICT JSON)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return ONLY valid JSON with this exact structure (no markdown, no code blocks, just raw JSON):
{{
  "contact_information": {{
    "full_name": "First Last",
    "email": "email@example.com",
    "phone": "+1234567890",
    "location": "City, Country",
    "linkedin": "linkedin.com/in/username",
    "github": "github.com/username",
    "portfolio": "portfolio.com"
  }},
  "professional_summary": "Strategic 2-4 sentence summary (50-80 words) explicitly using keywords from the job posting. Start with [X] years of experience as [Target Role Title]. Include 2 quantified achievements. End with value proposition aligned to company needs.",
  "professional_experience": [
    {{
      "company": "Company Name",
      "position": "Job Title",
      "location": "City, Country",
      "start_date": "Jan 2020",
      "end_date": "Present",
      "achievements": [
        "ACTION VERB + specific task + QUANTIFIED result + relevance to target role",
        "LED/DEVELOPED/ACHIEVED + concrete outcome with NUMBERS (%, $, team size)",
        "IMPROVED/OPTIMIZED + metric + by X% + impact on business"
      ]
    }}
  ],
  "education": [
    {{
      "institution": "University Name",
      "degree": "Degree Type",
      "field": "Field of Study",
      "graduation_date": "Year",
      "gpa": "3.8/4.0",
      "honors": "Magna Cum Laude",
      "relevant_coursework": ["Course 1", "Course 2"]
    }}
  ],
  "technical_skills": {{
    "programming_languages": ["Python", "JavaScript"],
    "frameworks_tools": ["React", "Django"],
    "databases": ["PostgreSQL", "MongoDB"],
    "cloud_devops": ["AWS", "Docker"],
    "methodologies": ["Agile", "CI/CD"]
  }},
  "core_competencies": ["Leadership", "Communication", "Problem Solving"],
  "certifications": [
    {{
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "Year",
      "credential_id": "ID if available"
    }}
  ],
  "projects": [
    {{
      "title": "Project Name",
      "description": "Brief description highlighting relevant technologies and impact",
      "technologies": ["Tech1", "Tech2"],
      "url": "project-url.com",
      "impact": "Quantified impact statement"
    }}
  ],
  "awards": [
    {{
      "title": "Award Name",
      "issuer": "Organization",
      "date": "Year",
      "description": "Brief context"
    }}
  ],
  "references": [
    {{
      "name": "Reference Name",
      "position": "Their Title",
      "company": "Their Company",
      "email": "email@example.com",
      "phone": "+1234567890",
      "relationship": "Professional relationship"
    }}
  ]
}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ CRITICAL RULES (MUST FOLLOW)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **NO FABRICATION**: Use ONLY the candidate data provided. Do NOT invent companies, degrees, skills, or achievements the candidate doesn't have.
2. **MIRROR JOB LANGUAGE**: Use the exact terminology, keywords, and phrases from the job posting throughout the CV. If the job says "stakeholder management", use that exact phrase, not "managing stakeholders".
3. **QUANTIFY EVERYTHING**: Every achievement bullet MUST include at least one number (%, $, team size, time saved, users served, etc.). Transform descriptions into achievement statements: "Responsible for X" → "Achieved X, resulting in Y% improvement".
4. **KEYWORD SATURATION**: Naturally weave 10-15 keywords from the job posting across ALL sections (summary, experience, skills). Each keyword should appear at least once.
5. **INCLUDE ALL EXPERIENCES WITH VARIED DEPTH**: You MUST include EVERY single work experience the candidate has provided — do NOT skip ANY. Order by relevance to the target job. Highly relevant roles (70+ score) get 5-6 detailed bullets with heavy keyword mirroring. Relevant roles (50-69) get 4-5 bullets. Moderately relevant roles (30-49) get 3-4 bullets bridging transferable skills. Less relevant roles (<30) get 2-3 concise bullets highlighting universal skills. NEVER omit an experience.
6. **ACTION VERBS**: Start EVERY achievement bullet with a strong action verb (Led, Developed, Architected, Implemented, Optimized, Spearheaded, Launched, Streamlined, Mentored, Delivered).
7. **ATS OPTIMIZATION**: Use standard section headings. Avoid tables, graphics references, or special characters. Spell out acronyms at first use.
8. **SKILLS ALIGNMENT**: Categorize skills with job requirements in mind. List matching skills FIRST in each category.
9. **INCLUDE ONLY REQUESTED SECTIONS**: Generate content only for the sections listed in REQUIRED SECTIONS above.
10. **VALID JSON**: No trailing commas, proper string escaping, no comments in JSON.

Generate the CV now:"""
        
        return prompt
    
    def build_section_prompt(
        self,
        section: str,
        user_data: Dict,
        job_data: Optional[Dict],
        cv_style: str
    ) -> str:
        """Build deeply tailored prompt for a single CV section"""
        
        profile = user_data.get('job_seeker_profile', {})
        
        # Build job context for section-level prompts
        job_context = ""
        matching_data = {}
        if job_data:
            matching_data = self.matcher.analyze_match(user_data, job_data)
            strategy = matching_data.get('tailoring_strategy', {})
            
            job_context = f"""
🎯 TARGET ROLE: {job_data.get('title')} at {job_data.get('company_name', 'Target Company')}
📝 Job Description: {job_data.get('description', 'Not provided')[:500]}
📋 Requirements: {job_data.get('requirements', 'Not provided')[:500]}

MATCHING ANALYSIS:
- Your matching skills: {', '.join(matching_data.get('matching_skills', [])[:10])}
- Skill gaps to address: {', '.join(matching_data.get('skill_gaps', [])[:5])}
- Experience match: {matching_data.get('experience_match', {}).get('summary', 'N/A')}
- Relevance score: {matching_data.get('relevance_score', 0)}/100

STRATEGY: {strategy.get('focus', 'Tailor to job requirements')}

CRITICAL: Mirror the exact language and keywords from the job posting. Use the same terminology the employer uses."""
        
        section_prompts = {
            'summary': self._build_summary_prompt(profile, user_data, job_data, job_context, matching_data),
            'work': self._build_work_prompt(user_data, job_data, job_context, matching_data),
            'education': self._build_education_prompt(user_data, job_data, job_context),
            'skills': self._build_skills_prompt(profile, user_data, job_data, job_context, matching_data),
            'certifications': self._build_certifications_prompt(user_data, job_data, job_context),
            'projects': self._build_projects_prompt(user_data, job_data, job_context),
            'awards': self._build_awards_prompt(user_data, job_context),
            'references': self._build_references_prompt(user_data),
        }
        
        return section_prompts.get(section, f"Generate the {section} section based on the provided data. Return valid JSON.")
    
    def _build_summary_prompt(self, profile, user_data, job_data, job_context, matching_data):
        strategy = matching_data.get('tailoring_strategy', {})
        summary_strategy = strategy.get('summary_focus', 'Write a compelling professional summary')
        
        return f"""Generate a powerful professional summary for a CV.

{job_context}

CANDIDATE DATA:
- Title: {profile.get('professional_title', 'Professional')}
- Experience: {profile.get('years_of_experience', 0)} years
- Current Summary: {profile.get('professional_summary', '')}

WORK HISTORY (ALL POSITIONS — use for context):
{self.formatter.format_work_experience(user_data.get('work_experiences', []))}

SUMMARY STRATEGY: {summary_strategy}

REQUIREMENTS:
1. Exactly 50-80 words, 2-4 sentences
2. FIRST SENTENCE: "[X] years of experience as a [Target Job Title/Professional Title]"
3. SECOND SENTENCE: 2 specific quantified achievements that match the job's key requirements
4. FINAL SENTENCE: Value proposition — what unique impact you bring to this specific role
5. Include at least 5 keywords from the job posting naturally
6. Do NOT start with "I" — use third person or omit subject
7. Mention the target industry/domain if relevant

Return ONLY valid JSON: {{"professional_summary": "Your summary text here"}}"""
    
    def _build_work_prompt(self, user_data, job_data, job_context, matching_data):
        strategy = matching_data.get('tailoring_strategy', {})
        achievement_strategy = strategy.get('achievement_focus', 'Quantify all achievements')
        exp_relevance = matching_data.get('experience_relevance', [])
        
        # Build detailed relevance ranking
        experiences = user_data.get('work_experiences', [])
        total_experiences = len(experiences)
        
        # Build per-experience relevance guidance
        relevance_guidance = []
        for i, exp in enumerate(experiences):
            score = exp.get('_relevance_score', 50)
            label = exp.get('_relevance_label', 'relevant')
            title = exp.get('job_title', 'Unknown')
            company = exp.get('company_name', 'Unknown')
            
            if score >= 70:
                detail_level = '5-6 achievement bullets, elaborate on impact, mirror job language heavily'
            elif score >= 50:
                detail_level = '4-5 achievement bullets, highlight transferable skills and related impact'
            elif score >= 30:
                detail_level = '3-4 achievement bullets, emphasize transferable skills, leadership, and soft skills'
            else:
                detail_level = '2-3 concise bullets, focus on universal skills (communication, problem-solving, teamwork, initiative)'
            
            relevance_guidance.append(
                f"  #{i+1} [{label.upper()} - {score}/100] {title} at {company}\n"
                f"      → Strategy: {detail_level}"
            )
        
        relevance_section = "\n".join(relevance_guidance) if relevance_guidance else "Order by recency, 3-4 bullets each"
        
        return f"""Generate the professional experience section for a CV.

{job_context}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 EXPERIENCE RELEVANCE RANKING & STRATEGY ({total_experiences} positions — ALL MUST BE INCLUDED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{relevance_section}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CANDIDATE'S COMPLETE WORK HISTORY (USE ALL OF THEM)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{self.formatter.format_work_experience(experiences)}

ACHIEVEMENT STRATEGY: {achievement_strategy}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ CRITICAL RULES FOR PROFESSIONAL EXPERIENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **INCLUDE EVERY SINGLE POSITION** — You MUST generate entries for ALL {total_experiences} positions listed above. Do NOT skip or omit any experience, regardless of relevance.
2. **ORDER BY RELEVANCE** — The output array must be ordered from MOST relevant to LEAST relevant to the target job (as shown in the ranking above), NOT by date.
3. **VARY BULLET DEPTH BY RELEVANCE**:
   - HIGHLY RELEVANT positions (70+): 5-6 detailed achievement bullets, elaborate descriptions, heavy keyword mirroring
   - RELEVANT positions (50-69): 4-5 bullets, emphasize transferable accomplishments
   - MODERATELY RELEVANT positions (30-49): 3-4 bullets, bridge transferable skills to job requirements
   - TRANSFERABLE VALUE positions (<30): 2-3 concise bullets, highlight soft skills, leadership, initiative, problem-solving
4. **EVERY BULLET = ACTION VERB + TASK + QUANTIFIED RESULT**: "Verb + What you did + How you did it + Measurable impact"
5. **QUANTIFY EVERYTHING**: percentages, dollar amounts, team sizes, time saved, users impacted, projects delivered
6. **MIRROR JOB LANGUAGE** in highly relevant positions — use exact terminology from the job posting
7. **BRIDGE TRANSFERABLE SKILLS** in less relevant positions — connect past work to target role through universal skills
8. **INCLUDE TECHNOLOGIES** mentioned in each experience, especially those matching the job requirements
9. **TRANSFORM RESPONSIBILITIES INTO ACHIEVEMENTS**: "Managed team" → "Led cross-functional team of 8 engineers, delivering 3 products ahead of schedule"
10. **USE STRONG ACTION VERBS**: Led, Developed, Architected, Implemented, Optimized, Spearheaded, Launched, Streamlined, Mentored, Delivered, Orchestrated, Pioneered, Championed

Return ONLY valid JSON: {{"professional_experience": [... EXACTLY {total_experiences} entries ...]}}"""
    
    def _build_education_prompt(self, user_data, job_data, job_context):
        return f"""Generate the education section for a CV.

{job_context}

CANDIDATE EDUCATION:
{self.formatter.format_education(user_data.get('educations', []))}

REQUIREMENTS:
1. Include all education entries
2. Highlight relevant coursework that matches the job requirements
3. Include GPA if 3.5+ or equivalent
4. Include honors, awards, and relevant extracurricular activities
5. If the job requires specific degrees, emphasize matching qualifications
6. List most relevant/highest degree first

Return ONLY valid JSON: {{"education": [{{
  "institution": "Name",
  "degree": "Degree Type", 
  "field": "Field of Study",
  "graduation_date": "Year",
  "gpa": "Score/Scale",
  "honors": "If any",
  "relevant_coursework": ["Course1", "Course2"]
}}]}}"""
    
    def _build_skills_prompt(self, profile, user_data, job_data, job_context, matching_data):
        skills_strategy = matching_data.get('tailoring_strategy', {}).get('skills_focus', 'Organize by relevance')
        matching_skills = matching_data.get('matching_skills', [])
        skill_gaps = matching_data.get('skill_gaps', [])
        
        return f"""Generate the skills section for a CV.

{job_context}

CANDIDATE SKILLS:
{self.formatter.format_skills(profile)}
Technical Skills: {profile.get('technical_skills', '')}
Soft Skills: {profile.get('soft_skills', '')}

MATCHING ANALYSIS:
- Skills that match the job: {', '.join(matching_skills[:15])}
- Skills from job not in profile (DO NOT fabricate these): {', '.join(skill_gaps[:10])}

SKILLS STRATEGY: {skills_strategy}

REQUIREMENTS:
1. Categorize into: Programming Languages, Frameworks & Tools, Databases, Cloud & DevOps, Methodologies, Soft Skills
2. List skills that MATCH the job requirements FIRST in each category
3. Include 12-20 total technical skills
4. DO NOT add skills the candidate doesn't have
5. Use the exact technology names from the job posting (e.g., "React.js" not "React" if the job says "React.js")
6. Include core competencies as a separate list of 8-10 professional strengths
7. Competencies should include soft skills relevant to the role

Return ONLY valid JSON: {{"technical_skills": {{}}, "core_competencies": [...]}}"""
    
    def _build_certifications_prompt(self, user_data, job_data, job_context):
        return f"""Generate the certifications section for a CV.

{job_context}

CANDIDATE CERTIFICATIONS:
{self.formatter.format_certifications(user_data.get('certifications', []))}

REQUIREMENTS:
1. List all certifications
2. Order by relevance to the target job first
3. Include certification name, issuing organization, date, and credential ID if available
4. Highlight certifications that match job requirements

Return ONLY valid JSON: {{"certifications": [{{
  "name": "Cert Name",
  "issuer": "Organization",
  "date": "Year",
  "credential_id": "ID"
}}]}}"""
    
    def _build_projects_prompt(self, user_data, job_data, job_context):
        return f"""Generate the projects section for a CV.

{job_context}

CANDIDATE PROJECTS:
{self.formatter.format_projects(user_data.get('projects', []))}

REQUIREMENTS:
1. Order projects by relevance to the target job
2. Highlight technologies used that match job requirements
3. Include quantified impact for each project
4. Emphasize the candidate's role and contributions
5. Include project URLs if available

Return ONLY valid JSON: {{"projects": [{{
  "title": "Project Name",
  "description": "Brief description with relevant tech + impact",
  "technologies": ["Tech1", "Tech2"],
  "url": "url-if-available",
  "impact": "Quantified impact"
}}]}}"""
    
    def _build_awards_prompt(self, user_data, job_context):
        return f"""Generate the awards section for a CV.

{job_context}

CANDIDATE AWARDS:
{self.formatter.format_awards(user_data.get('awards', []))}

REQUIREMENTS:
1. List all awards and recognitions
2. Include brief context for relevance
3. Order by most impressive/relevant first

Return ONLY valid JSON: {{"awards": [{{
  "title": "Award Name",
  "issuer": "Organization",
  "date": "Year",
  "description": "Brief context"
}}]}}"""
    
    def _build_references_prompt(self, user_data):
        return f"""Generate the references section for a CV.

CANDIDATE REFERENCES:
{self.formatter.format_references(user_data.get('references', []))}

REQUIREMENTS:
1. Include all references as provided
2. Do not fabricate any reference information

Return ONLY valid JSON: {{"references": [{{
  "name": "Name",
  "position": "Title",
  "company": "Company",
  "email": "email",
  "phone": "phone",
  "relationship": "Relationship"
}}]}}"""
    
    def _build_job_context(self, user_data: Dict, job_data: Dict) -> str:
        """Build comprehensive job matching context with deep analysis"""
        matching_analysis = self.matcher.analyze_match(user_data, job_data)
        strategy = matching_analysis.get('tailoring_strategy', {})
        exp_match = matching_analysis.get('experience_match', {})
        keyword_density = matching_analysis.get('keyword_density', {})
        
        # Get top emphasis keywords from the job
        emphasis_keywords = keyword_density.get('emphasis_keywords', [])
        top_keywords = [k['keyword'] for k in keyword_density.get('top_keywords', [])[:15]]
        
        return f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 TARGET JOB — THIS CV MUST BE TAILORED FOR THIS SPECIFIC ROLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

JOB TITLE: {job_data.get('title')}
COMPANY: {job_data.get('company_name', 'Not specified')}
LOCATION: {job_data.get('location', 'Not specified')}
CATEGORY: {job_data.get('category', 'Not specified')}
EXPERIENCE LEVEL: {job_data.get('experience_level', 'Not specified')}
EMPLOYMENT TYPE: {job_data.get('employment_type', 'Not specified')}

📝 JOB DESCRIPTION:
{job_data.get('description', 'Not specified')}

📋 JOB REQUIREMENTS:
{job_data.get('requirements', 'Not specified')}
{f"📄 FULL ORIGINAL JOB POSTING (use this for deeper context):\\n{job_data['full_posting']}" if job_data.get('full_posting') else ''}
🔧 REQUIRED SKILLS:
{', '.join(job_data.get('required_skills', [])) if isinstance(job_data.get('required_skills'), list) else job_data.get('required_skills', job_data.get('skills_required', 'Not specified'))}

⭐ PREFERRED SKILLS:
{', '.join(job_data.get('preferred_skills', [])) if isinstance(job_data.get('preferred_skills'), list) else job_data.get('preferred_skills', 'Not specified')}

📚 EDUCATION REQUIREMENT: {job_data.get('education_requirement', 'Not specified')}
📅 EXPERIENCE REQUIRED: {job_data.get('years_experience_min', 'Not specified')}-{job_data.get('years_experience_max', 'N/A')} years

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 DEEP MATCHING ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RELEVANCE SCORE: {matching_analysis['relevance_score']}/100

✅ MATCHING SKILLS (MUST be prominently featured):
{', '.join(matching_analysis['matching_skills'][:15]) or 'None identified'}

❌ SKILL GAPS (DO NOT fabricate — but emphasize related skills):
{', '.join(matching_analysis['skill_gaps'][:10]) or 'None identified'}

🔄 TRANSFERABLE SKILLS (Leverage these):
{', '.join(matching_analysis.get('transferable_skills', [])) or 'None identified'}

📋 REQUIRED by employer: {', '.join(matching_analysis.get('required_skills', [])) or 'See requirements above'}
⭐ PREFERRED by employer: {', '.join(matching_analysis.get('preferred_skills', [])) or 'See description above'}

👔 EXPERIENCE ASSESSMENT:
- Match Level: {exp_match.get('level', 'N/A').upper()}
- {exp_match.get('summary', 'N/A')}
- Total Experience: {exp_match.get('years_total', 0)} years
- Relevant Experience: {exp_match.get('relevant_years', 0)} years
- Required by Job: {exp_match.get('required_years', 'Not specified')} years

🔑 HIGH-PRIORITY KEYWORDS FROM JOB (use these exact terms throughout the CV):
{', '.join(top_keywords) if top_keywords else 'Extract from job description above'}

📊 MOST EMPHASIZED KEYWORDS (appeared 3+ times in posting):
{', '.join(emphasis_keywords) if emphasis_keywords else 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧭 TAILORING STRATEGY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

APPROACH: {strategy.get('approach', 'bridge_skills').upper()}
FOCUS: {strategy.get('focus', 'Tailor content to job requirements')}

📝 SUMMARY STRATEGY: {strategy.get('summary_focus', 'Write a compelling summary')}
💼 ACHIEVEMENT STRATEGY: {strategy.get('achievement_focus', 'Quantify all achievements')}
🔧 SKILLS STRATEGY: {strategy.get('skills_focus', 'Organize by relevance')}

KEYWORDS THAT MUST APPEAR IN CV:
{', '.join(strategy.get('must_include_keywords', [])[:10])}

ADDITIONAL KEYWORDS TO WEAVE IN (if candidate has related experience):
{', '.join(strategy.get('keywords_to_weave_in', [])[:5])}
"""
    
    def _build_general_context(self, profile: Dict) -> str:
        """Build context for general (non-job-targeted) CV"""
        return f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 GENERAL CV (No specific job target)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is a general-purpose CV. Optimize for:
1. Broad ATS compatibility across the candidate's industry
2. Highlight strongest achievements and skills
3. Target the candidate's desired position: {profile.get('desired_position', 'Not specified')}
4. Emphasize versatility and breadth of experience
5. Use industry-standard terminology
"""
    
    def _get_style_guidelines(self, style: str) -> str:
        """Get detailed style-specific guidelines"""
        styles = {
            "professional": """STYLE GUIDELINES — PROFESSIONAL:
- Clean, traditional, corporate-ready layout
- Conservative and precise language
- Formal tone throughout
- Focus on substance, metrics, and impact
- Standard section ordering (Summary → Experience → Education → Skills)
- Use industry-standard terminology""",
            
            "creative": """STYLE GUIDELINES — CREATIVE:
- Modern, engaging, personality-driven
- Show creative thinking in how achievements are described
- Conversational but professional tone
- Include portfolio/project highlights prominently
- Personality and unique perspective encouraged
- Still maintain ATS compatibility""",
            
            "modern": """STYLE GUIDELINES — MODERN:
- Sleek and contemporary
- Professional yet approachable tone
- Emphasize digital skills and modern methodologies
- Concise, impactful language
- Progressive formatting with clear visual hierarchy
- Balance between creativity and professionalism""",
            
            "minimal": """STYLE GUIDELINES — MINIMAL:
- Ultra-clean, content-focused
- Maximum white space utilization
- Simple typography and clear hierarchy
- Every word must earn its place
- Let achievements speak for themselves
- No filler content whatsoever""",
            
            "executive": """STYLE GUIDELINES — EXECUTIVE:
- Sophisticated and leadership-focused
- Emphasize strategy, vision, and organizational impact
- Highlight P&L responsibility, team sizes, and business outcomes
- Board-level language and gravitas
- Focus on transformation, growth, and stakeholder value
- Include executive competencies prominently"""
        }
        return styles.get(style, styles["professional"])
    
    def _build_section_requirements(self, sections: List[str], user_data: Dict) -> str:
        """Build detailed requirements for each requested section"""
        requirements = []
        for section in sections:
            if section == 'summary':
                requirements.append("✓ Professional Summary (50-80 words, 2 quantified achievements, job keywords)")
            elif section in ['work', 'experience']:
                count = len(user_data.get('work_experiences', []))
                requirements.append(f"✓ Professional Experience (ALL {count} positions MUST be included — vary bullet depth: 5-6 for highly relevant, 4-5 for relevant, 3-4 for moderate, 2-3 for transferable)")
            elif section == 'education':
                count = len(user_data.get('educations', []))
                requirements.append(f"✓ Education ({count} entries, include relevant coursework)")
            elif section == 'skills':
                requirements.append("✓ Technical Skills (categorized, 12-20 skills) + Core Competencies (8-10)")
            elif section == 'certifications':
                count = len(user_data.get('certifications', []))
                requirements.append(f"✓ Certifications ({count} certifications)")
            elif section == 'projects':
                count = len(user_data.get('projects', []))
                requirements.append(f"✓ Projects ({count} projects, include technologies and impact)")
            elif section == 'awards':
                count = len(user_data.get('awards', []))
                requirements.append(f"✓ Awards & Achievements ({count} awards)")
            elif section == 'references':
                count = len(user_data.get('references', []))
                requirements.append(f"✓ References ({count} references)")
        
        return "\n".join(requirements) if requirements else "All standard sections"
