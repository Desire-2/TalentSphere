"""
CV Builder Prompt Builder (Enhanced)
Constructs deeply job-tailored AI prompts for CV generation
with advanced matching analysis and strategic content guidance
"""
from typing import Dict, List, Optional, Any
from .data_formatter import CVDataFormatter
from .job_matcher import CVJobMatcher


HUMANIZATION_BANNED_PHRASES = [
  "spearheaded", "leveraged", "orchestrated", "synergy", "synergies",
  "cross-functional", "results-driven", "dynamic professional", "passionate",
  "detail-oriented", "proven track record", "thought leader", "go-to",
  "best-in-class", "cutting-edge", "seamlessly", "robust", "transformative",
  "scalable solutions", "innovative solutions", "fast-paced environment",
  "exceeded expectations", "wore many hats", "hit the ground running",
  "move the needle", "deep dive", "circle back", "bandwidth",
  "impactful", "actionable", "deliverables", "stakeholders (when used vaguely)",
  "collaborated with cross-functional teams to deliver",
]


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

        # Voice context for more human and role-appropriate writing
        seniority_level = self._infer_seniority_level(user_data)
        industry_vertical = self._infer_industry_vertical(user_data, job_data)
        tone_preference = self._extract_tone_preference(profile)
        banned_phrase_block = self._humanization_reference_block()
        
        # Build advanced job context with matching analysis
        job_context = self._build_job_context(user_data, job_data) if job_data else self._build_general_context(profile)
        
        # Get style guidelines
        style_guide = self._get_style_guidelines(cv_style)
        
        # Build section requirements
        section_reqs = self._build_section_requirements(include_sections, user_data)
        
        # Build the prompt with AGENTIC strategic instructions
        prompt = f"""You are ARIA (AI Resume Intelligence Agent), an autonomous CV/Resume strategist with 20+ years of experience in career consulting, executive recruiting, and ATS optimization. You are not a simple content generator — you are an intelligent agent that REASONS, ANALYZES, PLANS, DECIDES, and SELF-EVALUATES.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 YOUR AUTONOMOUS AGENT WORKFLOW (FOLLOW THIS EXACTLY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**PHASE 1: ANALYZE THE CANDIDATE** (Think before writing)
- Review their complete career trajectory, progression, and arc
- Identify their 3 strongest achievements across all experience
- Determine their seniority level and career narrative angle
- Assess quantifiable impact patterns (what metrics do they naturally have?)
- List their TRUE core strengths (not buzzwords)

**PHASE 2: DECODE THE JOB POSTING** (Understand what they REALLY want)
- Extract MUST-HAVE vs NICE-TO-HAVE skills (read between the lines)
- Identify exact keywords and phrases to mirror (the recruiter's language)
- Detect cultural tone (startup/corporate/academic/creative)
- Determine what the hiring manager's pain points are
- Score candidate fit: HIGH (70-100) | MEDIUM (40-69) | LOW (0-39)

**PHASE 3: STRATEGIZE THE NARRATIVE** (Plan before generating)
- Choose the narrative angle: "Career Progression", "Career Pivot", "Domain Expert", "Problem Solver", or "Rising Star"
- Decide section ordering based on strengths (do they lead with skills or experience?)
- Plan bullet depth per experience: 6 bullets for highly relevant roles, 2-3 for less relevant
- Identify gaps to bridge with transferable skills
- Choose which achievements to quantify and how

**PHASE 4: GENERATE THE CV** (Execute your plan)
- Use the strategy from Phase 3 to write every section
- Mirror job posting language in high-relevance sections
- Transform responsibilities into achievement statements
- Quantify everything possible in top 2 experiences

**PHASE 5: SELF-EVALUATE AGAINST ATS RUBRIC** (Judge your own work)
Score your generated CV on this rubric (0-100):
- Keyword Match (0-25): Are ALL critical job keywords present naturally?
- Quantification (0-15): Are metrics used credibly and only where evidence exists?
- ATS Formatting (0-15): Clean structure, no tables/graphics, standard headings?
- Achievement Depth (0-15): Concrete actions, context, and outcome quality?
- Completeness (0-10): All candidate experiences included, none skipped?
- Human Writing Score (0-20): Does this read like a real professional wrote it?

During self-review, flag and rewrite any AI-sounding bullet or phrase using the banned phrases list below.
Before finalizing, read the CV aloud in your reasoning. If any sentence sounds like it came from a template, rewrite it.

**IF YOUR SELF-SCORE < 80/100, YOU MUST REVISE INTERNALLY BEFORE OUTPUTTING.**
Do NOT output anything until you achieve 80+/100.

{job_context}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CANDIDATE PROFILE DATA (Your raw materials)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{personal_info}

Professional Title: {profile.get('professional_title', 'Professional')}
Years of Experience: {profile.get('years_of_experience', 0)}
Career Level: {profile.get('career_level', 'Not specified')}
Inferred Seniority Level: {seniority_level}
Inferred Industry Vertical: {industry_vertical}
Tone Preference: {tone_preference}
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
✍️ HUMAN WRITING DIRECTIVES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Voice & Authenticity:
- Write each CV as if the candidate themselves wrote it with care.
- Calibrate voice to seniority: entry-level = eager and concrete; senior = confident and strategic; executive = visionary but grounded.
- Vary sentence openings radically. Do not start every bullet with a verb.
- Intentionally mix bullet lengths: some punchy (<10 words), some rich (20-30 words).

Metric Authenticity:
- Do NOT force metrics into every bullet. Real CVs often have 30-50% bullets without hard numbers.
- Use precise metrics only when supported by candidate data.
- If no metric is available, use specific qualitative impact.

Language Naturalness:
- Avoid the banned phrases list below and any close paraphrase.
- Use concrete language over buzzwords.
- Use domain-appropriate terminology based on the candidate's industry vertical.
- Contractions are acceptable in Creative summaries. Avoid contractions in Professional/Modern summaries.

Summary Section:
- 3-5 sentences maximum.
- First sentence must be a specific positioning statement.
- Include at least one detail unique to this candidate (niche, technology, pivot, or unique skill combination).
- Do NOT use generic openers like "passionate professional with X years".
- Do NOT include company or organization names in the professional summary (e.g., avoid "at Company X").
- Do NOT write the summary as "Job Title at Organization". Keep it person-centric, not employer-centric.

Work Experience Bullets:
- Each role should have 3-6 bullets based on relevance; not every role needs 6.
- Within each role include:
  1) one challenge-focused bullet,
  2) one collaboration/relationship bullet,
  3) one concrete tool/system/methodology bullet.
- Avoid repetitive grammar and rhythm within a role.

Skills Section:
- Include skills evidenced by work history or projects.
- Group skills meaningfully by category (e.g., Languages, Frameworks, Analytics, Design Tools).

You are writing for a human reader who has seen thousands of CVs. Your job is to make this one feel like it was written by a real person who cares about their work, not a machine optimizing for keywords.

{banned_phrase_block}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 OUTPUT FORMAT (STRICT JSON WITH AGENT REASONING)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return ONLY valid JSON with this exact structure (no markdown, no code blocks, just raw JSON):
{{
  "agent_reasoning": {{
    "candidate_analysis": "2-3 sentence analysis of candidate's strongest attributes, career trajectory, and seniority level",
    "job_decoding": "2-3 sentences on what the employer REALLY wants — must-haves vs nice-to-haves, cultural fit indicators",
    "job_match_score": 75,
    "match_level": "HIGH or MEDIUM or LOW",
    "strategy_chosen": "One sentence: what narrative angle and approach you're taking (e.g., 'Career Progression narrative, leading with 8 years Python expertise')",
    "writing_style": "2-3 sentences explaining chosen voice/tone and why it fits this candidate's background and target role",
    "key_decisions": [
      "Decision 1: e.g., Emphasized cloud migration achievements due to 'AWS' appearing 7 times in posting",
      "Decision 2: e.g., Reduced bullets for early retail role to 2, focusing on transferable leadership skills",
      "Decision 3: e.g., Mirrored exact phrase 'stakeholder management' from job requirements 4 times across summary and bullets"
    ],
    "gaps_bridged": [
      "Gap 1: e.g., No direct Kubernetes experience — highlighted Docker containerization as adjacent skill",
      "Gap 2: e.g., Lack of healthcare domain — emphasized transferable data privacy and compliance work"
    ],
    "confidence_score": 85,
    "ats_self_evaluation": {{
      "keyword_match_score": 23,
      "quantification_score": 13,
      "ats_formatting_score": 15,
      "achievement_depth_score": 14,
      "completeness_score": 9,
      "human_writing_score": 18,
      "total_score": 95,
      "passed_quality_gate": true,
      "internal_revisions": 1,
      "revision_notes": "Initial score 78, revised summary to add 'DevOps' keyword and quantified project delivery metric to reach 95"
    }}
  }},
  "contact_information": {{
    "full_name": "First Last",
    "email": "email@example.com",
    "phone": "+1234567890",
    "location": "City, Country",
    "linkedin": "linkedin.com/in/username",
    "github": "github.com/username",
    "portfolio": "portfolio.com"
  }},
  "professional_summary": "3-5 sentence human-sounding summary with a specific opening, one candidate-unique detail, and concrete language tailored to target role. Keep it person-centric and do NOT include company/organization names.",
  "professional_experience": [
    {{
      "company": "Company Name",
      "position": "Job Title",
      "location": "City, Country",
      "start_date": "Jan 2020",
      "end_date": "Present",
      "achievements": [
        "Challenge-focused bullet with concrete context and outcome",
        "Collaboration-focused bullet showing who was involved and why",
        "Tool/method-focused bullet with specific implementation detail"
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
3. **METRIC AUTHENTICITY**: Use numbers where evidence exists. Do not force metrics into every bullet.
4. **STRUCTURAL VARIETY**: Vary sentence openings and cadence. Avoid repeated templates.
5. **INCLUDE ALL EXPERIENCES WITH VARIED DEPTH**: Include every provided role. Use 3-6 bullets by relevance and substance.
6. **NO BANNED PHRASES**: Remove any phrase from the banned list and rewrite in direct language.
7. **NO TEMPLATE SOUND**: If a sentence sounds generic enough to fit anyone, rewrite it with candidate-specific detail.
8. **SKILLS EVIDENCE RULE**: List skills that are demonstrated in work/project history; no aspirational padding.
9. **ATS OPTIMIZATION**: Use standard headings, clean structure, and valid JSON-safe content.
10. **INCLUDE ONLY REQUESTED SECTIONS**: Generate content only for REQUIRED SECTIONS.
11. **VALID JSON**: No trailing commas, proper string escaping, no comments in JSON.
12. **SUMMARY COMPANY RULE**: Never include target company/organization names in professional_summary.

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
        
        section_prompt = section_prompts.get(section, f"Generate the {section} section based on the provided data. Return valid JSON.")
        return f"""{section_prompt}

      HUMAN WRITING GUARDRAILS:
      - Avoid banned/template phrases and rewrite in concrete, candidate-specific language.
      - Vary sentence structure naturally. Do not make bullets read like a repeated formula.
      - Use metrics selectively and credibly.

      {self._humanization_reference_block()}"""
    
    def _build_summary_prompt(self, profile, user_data, job_data, job_context, matching_data):
        strategy = matching_data.get('tailoring_strategy', {})
        summary_strategy = strategy.get('summary_focus', 'Write a compelling professional summary')
        
        return f"""Generate a natural, candidate-specific professional summary for a CV.

{job_context}

CANDIDATE DATA:
- Title: {profile.get('professional_title', 'Professional')}
- Experience: {profile.get('years_of_experience', 0)} years
- Current Summary: {profile.get('professional_summary', '')}

WORK HISTORY (ALL POSITIONS — use for context):
{self.formatter.format_work_experience(user_data.get('work_experiences', []))}

SUMMARY STRATEGY: {summary_strategy}

REQUIREMENTS:
1. 3-5 sentences, approximately 45-85 words.
2. First sentence must position the candidate specifically (domain, specialization, or problem area) without generic filler.
3. Include at least one candidate-unique signal from provided data (specific technology stack, domain niche, career pivot, or uncommon skill combination).
4. Mention impact naturally: use 1-2 metrics only when evidence exists; otherwise use concrete qualitative outcomes.
5. Include job-relevant keywords naturally, but do not keyword-stuff.
6. Do NOT use template openers such as "results-driven", "passionate professional", or "X years of experience as a...".
7. Do NOT mention company/organization names (no "at <company>", "for <organization>").
8. Keep tone aligned to style: Professional/Modern = polished and direct; Creative = slightly conversational.
9. Avoid repetitive sentence structure and avoid sounding like a generic AI summary.

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
{'📄 FULL ORIGINAL JOB POSTING (use this for deeper context):' + chr(10) + job_data['full_posting'] if job_data.get('full_posting') else ''}
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

    def _humanization_reference_block(self) -> str:
        banned = ', '.join(HUMANIZATION_BANNED_PHRASES)
        return f"BANNED PHRASES TO AVOID (verbatim and close variants): {banned}"

    def _extract_tone_preference(self, profile: Dict) -> str:
        for key in ['tone_preference', 'writing_tone', 'custom_tone_preference', 'cv_tone_preference']:
            value = profile.get(key)
            if value:
                return str(value)
        return 'Not specified'

    def _infer_seniority_level(self, user_data: Dict) -> str:
        profile = user_data.get('job_seeker_profile', {})
        years = profile.get('years_of_experience') or 0

        titles = []
        if profile.get('professional_title'):
            titles.append(str(profile.get('professional_title')))
        titles.extend([str(exp.get('job_title', '')) for exp in user_data.get('work_experiences', [])])
        title_blob = ' '.join(titles).lower()

        executive_tokens = ['chief', 'c-suite', 'c level', 'vp', 'vice president', 'director', 'head of', 'founder']
        senior_tokens = ['senior', 'lead', 'principal', 'staff', 'manager']

        if years >= 12 or any(token in title_blob for token in executive_tokens):
            return 'executive'
        if years >= 7 or any(token in title_blob for token in senior_tokens):
            return 'senior'
        if years >= 3:
            return 'mid-level'
        if years >= 1:
            return 'junior'
        return 'entry-level'

    def _infer_industry_vertical(self, user_data: Dict, job_data: Optional[Dict]) -> str:
        profile = user_data.get('job_seeker_profile', {})
        preferred = profile.get('preferred_industries')

        if isinstance(preferred, list) and preferred:
            return str(preferred[0])
        if isinstance(preferred, str) and preferred.strip():
            return preferred.strip()

        if job_data:
            for key in ['category', 'industry', 'company_industry']:
                value = job_data.get(key)
                if isinstance(value, str) and value.strip() and value.strip().lower() != 'not specified':
                    return value.strip()

        text_chunks = [
            str(profile.get('professional_title', '')),
            str(profile.get('professional_summary', '')),
            str(profile.get('desired_position', '')),
            ' '.join(str(exp.get('job_title', '')) for exp in user_data.get('work_experiences', [])),
            str((job_data or {}).get('title', '')),
            str((job_data or {}).get('description', '')),
            str((job_data or {}).get('requirements', '')),
        ]
        haystack = ' '.join(text_chunks).lower()

        vertical_keywords = {
            'fintech': ['fintech', 'payments', 'banking', 'credit', 'risk', 'ledger'],
            'healthcare': ['healthcare', 'hospital', 'clinical', 'patient', 'ehr', 'medtech'],
            'saas': ['saas', 'b2b software', 'subscription', 'customer success', 'product-led'],
            'e-commerce': ['ecommerce', 'e-commerce', 'marketplace', 'merchandising', 'shopify'],
            'education': ['education', 'edtech', 'curriculum', 'teaching', 'instructional'],
            'ngo/nonprofit': ['ngo', 'nonprofit', 'humanitarian', 'development program', 'grant'],
            'marketing': ['marketing', 'brand', 'campaign', 'seo', 'content strategy'],
            'software engineering': ['software', 'engineering', 'backend', 'frontend', 'devops', 'cloud'],
        }

        for vertical, keywords in vertical_keywords.items():
            if any(keyword in haystack for keyword in keywords):
                return vertical

        return 'general'
    
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
