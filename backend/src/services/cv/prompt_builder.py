"""
CV Builder Prompt Builder (v2 — Human-First Rewrite)

Core philosophy changes from v1:
- Removed agent persona theater (ARIA, phases) — causes meta-reasoning, not natural writing
- Moved banned phrases to TOP of all prompts where they have maximum weight
- Replaced "quantify everything" with selective metric guidance
- Removed self-scoring rubric (model just claims 95/100 without real revision)
- Removed contradictory instructions (banned phrases listed as "strong verbs" in same prompt)
- Simplified bullet structure rules to let voice breathe naturally
- Keyword mirroring is now contextual, not mechanical repetition
"""

from typing import Dict, List, Optional, Any
from .data_formatter import CVDataFormatter
from .job_matcher import CVJobMatcher


# ──────────────────────────────────────────────────────────────────────────────
# HUMANIZATION CONFIG
# ──────────────────────────────────────────────────────────────────────────────

# Tier 1: Never use — these are the most AI-detectable
BANNED_HARD = [
    "spearheaded", "leveraged", "orchestrated", "synergy", "synergies",
    "results-driven", "dynamic professional", "passionate about", "detail-oriented",
    "proven track record", "thought leader", "cutting-edge", "seamlessly",
    "transformative", "scalable solutions", "innovative solutions",
    "fast-paced environment", "exceeded expectations", "impactful",
    "actionable insights", "move the needle", "deep dive", "circle back",
    "bandwidth", "deliverables", "cross-functional teams to deliver",
    "wore many hats", "hit the ground running", "go-to person",
    "best-in-class", "robust", "best practices", "pain points",
]

# Backwards-compatible alias — keeps existing imports working
HUMANIZATION_BANNED_PHRASES = BANNED_HARD

# Tier 2: Avoid unless used very sparingly — one per document maximum
BANNED_SOFT = [
    "collaborated", "partnered with", "drove", "championed", "pioneered",
    "streamlined", "optimized", "oversaw", "facilitated", "executed",
]

# Preferred verb palette — concrete, active, varied
PREFERRED_VERBS = [
    "built", "wrote", "shipped", "fixed", "reduced", "grew", "cut",
    "launched", "redesigned", "negotiated", "hired", "trained", "presented",
    "analyzed", "proposed", "secured", "managed", "converted", "tested",
    "deployed", "authored", "migrated", "automated", "documented",
]

def _banned_phrase_block() -> str:
    hard = ", ".join(BANNED_HARD)
    soft = ", ".join(BANNED_SOFT)
    verbs = ", ".join(PREFERRED_VERBS)
    return f"""
LANGUAGE RULES (apply before writing a single word):

NEVER USE — these will be detected as AI-written:
{hard}

USE AT MOST ONCE PER DOCUMENT (then find an alternative):
{soft}

PREFERRED ACTION VERBS — concrete and specific:
{verbs}

WRITING PATTERN TESTS — before finalising any bullet, ask:
1. Could this sentence describe someone who works in a completely different industry? If yes, rewrite with specifics.
2. Does this bullet start with the same verb structure as the one above it? If yes, vary it.
3. Is there a number here? If not, is the qualitative impact still specific enough to be credible?
4. Would a recruiter reading this think "I've seen this exact phrasing on 100 CVs"? If yes, rewrite.
"""


# ──────────────────────────────────────────────────────────────────────────────
# MAIN PROMPT BUILDER
# ──────────────────────────────────────────────────────────────────────────────

class CVPromptBuilder:
    """Builds human-first, job-optimized prompts for AI CV generation"""

    def __init__(self):
        self.formatter = CVDataFormatter()
        self.matcher = CVJobMatcher()

    # ──────────────────────────────────────────────────────────────────────────
    # FULL CV PROMPT
    # ──────────────────────────────────────────────────────────────────────────

    def build_full_cv_prompt(
        self,
        user_data: Dict,
        job_data: Optional[Dict],
        cv_style: str,
        include_sections: List[str],
    ) -> str:
        """
        Build a full CV generation prompt.

        Key design decisions:
        - Banned phrases appear FIRST so the model weights them throughout generation
        - No self-scoring theater — instructions are precise enough that revision isn't needed
        - Job matching context is factual, not prescriptive about exact repetition counts
        - Style affects tone calibration, not just formatting labels
        """
        profile = user_data.get("job_seeker_profile", {})

        personal_info   = self.formatter.format_personal_info(user_data)
        work_exp        = self.formatter.format_work_experience(user_data.get("work_experiences", []))
        education       = self.formatter.format_education(user_data.get("educations", []))
        skills          = self.formatter.format_skills(profile)
        certifications  = self.formatter.format_certifications(user_data.get("certifications", []))
        projects        = self.formatter.format_projects(user_data.get("projects", []))
        awards          = self.formatter.format_awards(user_data.get("awards", []))
        references      = self.formatter.format_references(user_data.get("references", []))
        languages       = self.formatter.format_languages(profile)

        seniority_level  = self._infer_seniority_level(user_data)
        industry_vertical = self._infer_industry_vertical(user_data, job_data)
        tone_guidance    = self._tone_guidance(cv_style, seniority_level)
        job_context      = (
            self._build_job_context(user_data, job_data)
            if job_data
            else self._build_general_context(profile)
        )
        section_reqs = self._build_section_requirements(include_sections, user_data)

        prompt = f"""You are an expert CV writer. Your task is to write a CV that reads as if the candidate wrote it themselves — carefully, specifically, and without any corporate filler.

{_banned_phrase_block()}

──────────────────────────────────────────────────────────────────
CANDIDATE DATA
──────────────────────────────────────────────────────────────────

{personal_info}

Professional title: {profile.get("professional_title", "Professional")}
Years of experience: {profile.get("years_of_experience", 0)}
Career level: {profile.get("career_level", "Not specified")}
Seniority (inferred): {seniority_level}
Industry vertical (inferred): {industry_vertical}
Existing summary (reference only — do not copy): {profile.get("professional_summary", "Not provided")}
Desired position: {profile.get("desired_position", "Open to opportunities")}

WORK EXPERIENCE:
{work_exp}

EDUCATION:
{education}

SKILLS:
{skills}
Soft skills: {profile.get("soft_skills", "Not specified")}

CERTIFICATIONS:
{certifications}

PROJECTS:
{projects}

AWARDS:
{awards}

REFERENCES:
{references}

LANGUAGES:
{languages}

──────────────────────────────────────────────────────────────────
{job_context}
──────────────────────────────────────────────────────────────────
TONE & STYLE: {cv_style.upper()}
──────────────────────────────────────────────────────────────────
{tone_guidance}

──────────────────────────────────────────────────────────────────
SECTIONS TO GENERATE
──────────────────────────────────────────────────────────────────
{section_reqs}

──────────────────────────────────────────────────────────────────
WRITING RULES
──────────────────────────────────────────────────────────────────

PROFESSIONAL SUMMARY
- 3 to 5 sentences, 50–90 words.
- Sentence 1: Position the candidate by domain, specialisation, or problem area. Be specific.
  BAD:  "Results-driven software engineer with 8 years of experience."
  GOOD: "Eight years building data pipelines for financial services firms, most recently at the intersection of real-time fraud detection and ML infrastructure."
- Include one detail that is unique to this person — a niche, an unusual skill combination, a notable pivot.
- Mention 1–2 concrete outcomes only where the data supports them. Do not force numbers.
- Do not open with: "Passionate", "Results-driven", "Dynamic", "Dedicated", "I am", "With X years of".
- Do not name any company or organisation in the summary.
- Do not use "at [Company]" or "for [Organisation]".

WORK EXPERIENCE BULLETS
Depth by relevance:
- Highly relevant role (≥70% match): 5–6 bullets
- Relevant role (50–69%): 4–5 bullets
- Moderately relevant (30–49%): 3–4 bullets
- Transferable only (<30%): 2–3 bullets

Every role MUST be included. Do not skip any position.

Bullet construction — each bullet must:
- Be written in plain English, not corporate speak.
- Vary its opening: not every bullet should start with a verb. Mix:
    → Verb openers:   "Reduced deployment time by 40% by switching from Jenkins to GitHub Actions."
    → Context openers: "During a team of three's migration to AWS, handled infrastructure design and cost modelling."
    → Result openers:  "Three-month backlog cleared after redesigning the ticket triage process."
- Vary length: some punchy (under 10 words), some detailed (20–30 words). Do not make every bullet the same length.
- Use metrics only where the candidate data implies them. A bullet with no number is better than a fabricated one.
- Include at least one bullet per role that names a specific tool, technology, or methodology.
- Include at least one bullet per role that shows collaboration or cross-team work — but do not use "collaborated with cross-functional teams."

SKILLS SECTION
- Only list skills evidenced by the work history or projects — no aspirational padding.
- Group into meaningful categories (e.g., Languages, Frameworks, Cloud & Infrastructure, Analytics, Design Tools).
- List job-relevant skills first within each category.
- Use the exact name format from the job posting (e.g., "React.js" not "React" if the posting says "React.js").

KEYWORDS & JOB LANGUAGE
- Use terminology from the job posting naturally throughout the CV.
- Integrate keywords where they fit the candidate's real experience. Do not repeat any phrase more than twice.
- If the job uses a specific term the candidate hasn't used yet, introduce it where it is genuinely applicable.
- Do not stuff keywords — one well-placed match is worth more than five forced ones.

THINGS THAT WILL GET THIS CV REJECTED AS AI-GENERATED:
- Any phrase from the NEVER USE list above.
- Three or more bullets in the same role starting with the same verb.
- Metrics that seem invented (e.g., "improved efficiency by 47%") with no supporting data.
- Summary that could be swapped onto any other CV without changing.
- Bullet points that describe responsibilities instead of outcomes.

──────────────────────────────────────────────────────────────────
OUTPUT FORMAT
──────────────────────────────────────────────────────────────────

Return ONLY valid JSON. No markdown, no code blocks, no preamble.

{{
  "generation_notes": {{
    "narrative_angle": "One sentence: the angle taken — e.g., 'Domain Expert in fintech payments, leading with 6 years of Python and SQL depth'",
    "key_decisions": [
      "e.g., Ordered roles by relevance to target job, not date — placed ML Engineer role first despite being 2 jobs ago",
      "e.g., Used no metrics in the customer support role because no data was available — qualitative specifics used instead",
      "e.g., Bridged gap in Kubernetes experience by highlighting Docker containerisation work in 3 bullets"
    ],
    "match_level": "HIGH | MEDIUM | LOW",
    "match_score": 0
  }},
  "contact_information": {{
    "full_name": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "github": "",
    "portfolio": ""
  }},
  "professional_summary": "",
  "professional_experience": [
    {{
      "company": "",
      "position": "",
      "location": "",
      "start_date": "",
      "end_date": "",
      "achievements": []
    }}
  ],
  "education": [
    {{
      "institution": "",
      "degree": "",
      "field": "",
      "graduation_date": "",
      "gpa": "",
      "honors": "",
      "relevant_coursework": []
    }}
  ],
  "technical_skills": {{
    "programming_languages": [],
    "frameworks_tools": [],
    "databases": [],
    "cloud_devops": [],
    "methodologies": []
  }},
  "core_competencies": [],
  "certifications": [
    {{
      "name": "",
      "issuer": "",
      "date": "",
      "credential_id": ""
    }}
  ],
  "projects": [
    {{
      "title": "",
      "description": "",
      "technologies": [],
      "url": "",
      "impact": ""
    }}
  ],
  "awards": [
    {{
      "title": "",
      "issuer": "",
      "date": "",
      "description": ""
    }}
  ],
  "references": [
    {{
      "name": "",
      "position": "",
      "company": "",
      "email": "",
      "phone": "",
      "relationship": ""
    }}
  ]
}}

HARD CONSTRAINTS:
1. NO fabrication — only use data provided above.
2. Include ALL work experiences provided. None may be omitted.
3. Skills must be evidenced by work history or projects.
4. No company or organisation names in professional_summary.
5. Valid JSON only — no trailing commas, proper string escaping.
6. Generate only the sections listed in SECTIONS TO GENERATE.

Generate the CV now."""

        return prompt

    # ──────────────────────────────────────────────────────────────────────────
    # SECTION-LEVEL PROMPTS
    # ──────────────────────────────────────────────────────────────────────────

    def build_section_prompt(
        self,
        section: str,
        user_data: Dict,
        job_data: Optional[Dict],
        cv_style: str,
    ) -> str:
        profile = user_data.get("job_seeker_profile", {})
        job_context = ""
        matching_data = {}

        if job_data:
            matching_data = self.matcher.analyze_match(user_data, job_data)
            strategy = matching_data.get("tailoring_strategy", {})
            job_context = f"""
TARGET ROLE: {job_data.get("title")} at {job_data.get("company_name", "Target Company")}
Job description: {job_data.get("description", "")[:600]}
Requirements: {job_data.get("requirements", "")[:400]}

Matching skills from candidate: {", ".join(matching_data.get("matching_skills", [])[:10])}
Skill gaps (do NOT fabricate): {", ".join(matching_data.get("skill_gaps", [])[:5])}
Strategy: {strategy.get("focus", "Tailor to job requirements")}

Use the job's exact terminology naturally. Do not repeat any key phrase more than twice.
"""

        section_builders = {
            "summary":        self._build_summary_prompt,
            "work":           self._build_work_prompt,
            "education":      self._build_education_prompt,
            "skills":         self._build_skills_prompt,
            "certifications": self._build_certifications_prompt,
            "projects":       self._build_projects_prompt,
            "awards":         self._build_awards_prompt,
            "references":     self._build_references_prompt,
        }

        builder = section_builders.get(section)
        if not builder:
            return f"Generate the {section} section from the provided data. Return valid JSON."

        base_prompt = builder(profile, user_data, job_data, job_context, matching_data) \
            if section in ("summary", "work", "skills") \
            else builder(user_data, job_data, job_context)

        return f"""{_banned_phrase_block()}

{base_prompt}"""

    def _build_summary_prompt(self, profile, user_data, job_data, job_context, matching_data):
        strategy = matching_data.get("tailoring_strategy", {}).get("summary_focus", "")
        return f"""Write a professional summary for a CV.

{job_context}

CANDIDATE:
Title: {profile.get("professional_title", "")}
Experience: {profile.get("years_of_experience", 0)} years
Existing summary (reference only): {profile.get("professional_summary", "")}

All positions (for context):
{self.formatter.format_work_experience(user_data.get("work_experiences", []))}

{"Strategy note: " + strategy if strategy else ""}

REQUIREMENTS:
- 3–5 sentences, 50–90 words.
- Sentence 1: Specific positioning statement. Name the domain or specialisation. No generic openers.
- Include one unique signal: a niche, unusual skill combination, career transition, or specific methodology.
- 1–2 concrete outcomes where candidate data supports them. No invented metrics.
- No company or organisation names.
- No template openers: "passionate", "results-driven", "dynamic", "dedicated professional with X years".
- Natural language — if it sounds like it was written by a robot, rewrite it.

BAD example (do not produce this):
"Results-driven software engineer passionate about leveraging cutting-edge technologies to deliver scalable solutions in fast-paced environments."

GOOD example (this is the quality bar):
"Ten years designing backend systems for e-commerce at scale, with the last four focused on reducing checkout abandonment through A/B testing infrastructure and personalisation pipelines. Comfortable owning a problem from data analysis through to production — have led teams of two to twelve depending on the project."

Return ONLY valid JSON: {{"professional_summary": "..."}}"""

    def _build_work_prompt(self, profile, user_data, job_data, job_context, matching_data):
        strategy   = matching_data.get("tailoring_strategy", {}).get("achievement_focus", "")
        experiences = user_data.get("work_experiences", [])
        total       = len(experiences)

        # Build per-role guidance
        role_guidance = []
        for i, exp in enumerate(experiences):
            score = exp.get("_relevance_score", 50)
            label = exp.get("_relevance_label", "relevant")
            title = exp.get("job_title", "Unknown")
            company = exp.get("company_name", "Unknown")

            if score >= 70:
                depth = "5–6 bullets. Elaborate on impact. Use job posting terminology where it fits naturally."
            elif score >= 50:
                depth = "4–5 bullets. Highlight transferable achievements. Connect to target role."
            elif score >= 30:
                depth = "3–4 bullets. Emphasise transferable skills, leadership, and problem solving."
            else:
                depth = "2–3 bullets. Focus on universal skills: communication, initiative, reliability, problem solving."

            role_guidance.append(f"  [{label.upper()} {score}/100] {title} at {company} → {depth}")

        guidance_block = "\n".join(role_guidance)

        return f"""Write the professional experience section for a CV.

{job_context}

ROLE DEPTH GUIDE ({total} roles — ALL must appear in output):
{guidance_block}

FULL WORK HISTORY:
{self.formatter.format_work_experience(experiences)}

{"Achievement strategy: " + strategy if strategy else ""}

BULLET RULES:
1. Every bullet = something that happened, not a responsibility that existed.
   BAD:  "Responsible for managing the deployment pipeline."
   GOOD: "Cut deployment time from 45 minutes to 8 by rewriting the CI pipeline in GitHub Actions."

2. Vary sentence openings within each role:
   - Verb opener:    "Rebuilt the onboarding flow..."
   - Context opener: "When the team moved to microservices..."
   - Result opener:  "Zero downtime for 14 months after..."

3. Vary bullet length. Mix short punchy lines with longer context-rich ones.

4. Use numbers where the candidate's data implies them. Do not invent percentages.
   If no number is available, use specific qualitative language:
   BAD without data:  "Increased sales by 30%."
   GOOD without data: "Took over an underperforming territory and turned it into the team's top account within two quarters."

5. Each role must include at least:
   - One bullet naming a specific tool, system, or technology.
   - One bullet showing collaboration (without using "collaborated with cross-functional teams").

6. Output order: by relevance to target job (most relevant first), not by date.

Return ONLY valid JSON: {{"professional_experience": [ ... exactly {total} entries ... ]}}"""

    def _build_education_prompt(self, user_data, job_data, job_context):
        return f"""Write the education section for a CV.

{job_context}

CANDIDATE EDUCATION:
{self.formatter.format_education(user_data.get("educations", []))}

REQUIREMENTS:
- Include all entries.
- Highest or most relevant degree listed first.
- Include GPA only if 3.5+/4.0 or local equivalent.
- Include honours, relevant awards, or distinctions if present.
- Add relevant coursework only where it directly matches job requirements.

Return ONLY valid JSON:
{{"education": [{{"institution":"","degree":"","field":"","graduation_date":"","gpa":"","honors":"","relevant_coursework":[]}}]}}"""

    def _build_skills_prompt(self, profile, user_data, job_data, job_context, matching_data):
        matching  = matching_data.get("matching_skills", [])
        gaps      = matching_data.get("skill_gaps", [])
        strategy  = matching_data.get("tailoring_strategy", {}).get("skills_focus", "")

        return f"""Write the skills section for a CV.

{job_context}

CANDIDATE SKILLS:
{self.formatter.format_skills(profile)}
Technical: {profile.get("technical_skills", "")}
Soft: {profile.get("soft_skills", "")}

Skills matching job requirements: {", ".join(matching[:15])}
Job skills NOT in candidate profile (do NOT add these): {", ".join(gaps[:10])}

{"Skills strategy: " + strategy if strategy else ""}

REQUIREMENTS:
- List only skills demonstrated in work history or projects.
- Categories: Programming Languages, Frameworks & Tools, Databases, Cloud & DevOps, Methodologies, Soft Skills.
- Within each category, list skills matching the job posting first.
- 12–20 total technical skills.
- Use the exact format from the job posting (e.g., "React.js" if the posting says "React.js", not "React").
- Core competencies: 8–10 professional strengths grounded in the candidate's actual experience.

Return ONLY valid JSON: {{"technical_skills": {{}}, "core_competencies": []}}"""

    def _build_certifications_prompt(self, user_data, job_data, job_context):
        return f"""Write the certifications section for a CV.

{job_context}

CANDIDATE CERTIFICATIONS:
{self.formatter.format_certifications(user_data.get("certifications", []))}

REQUIREMENTS:
- Include all certifications provided.
- List those matching job requirements first.
- Include name, issuer, date, and credential ID where available.

Return ONLY valid JSON:
{{"certifications": [{{"name":"","issuer":"","date":"","credential_id":""}}]}}"""

    def _build_projects_prompt(self, user_data, job_data, job_context):
        return f"""Write the projects section for a CV.

{job_context}

CANDIDATE PROJECTS:
{self.formatter.format_projects(user_data.get("projects", []))}

REQUIREMENTS:
- Order by relevance to target role.
- Highlight technologies that match job requirements.
- Include quantified impact where the data supports it.
- Make the description specific — name the actual problem solved, not a generic description.
- Include URL if available.

Return ONLY valid JSON:
{{"projects": [{{"title":"","description":"","technologies":[],"url":"","impact":""}}]}}"""

    def _build_awards_prompt(self, user_data, job_data, job_context):
        return f"""Write the awards section for a CV.

{job_context}

CANDIDATE AWARDS:
{self.formatter.format_awards(user_data.get("awards", []))}

REQUIREMENTS:
- Include all entries.
- Add brief context that makes the award meaningful to someone outside the organisation.
- Order by impressiveness or relevance.

Return ONLY valid JSON:
{{"awards": [{{"title":"","issuer":"","date":"","description":""}}]}}"""

    def _build_references_prompt(self, user_data, *args, **kwargs):
        return f"""Generate the references section for a CV.

CANDIDATE REFERENCES:
{self.formatter.format_references(user_data.get("references", []))}

REQUIREMENTS:
- Include all references exactly as provided.
- Do not fabricate or modify any reference information.

Return ONLY valid JSON:
{{"references": [{{"name":"","position":"","company":"","email":"","phone":"","relationship":""}}]}}"""

    # ──────────────────────────────────────────────────────────────────────────
    # JOB CONTEXT BUILDERS
    # ──────────────────────────────────────────────────────────────────────────

    def _build_job_context(self, user_data: Dict, job_data: Dict) -> str:
        matching = self.matcher.analyze_match(user_data, job_data)
        strategy = matching.get("tailoring_strategy", {})
        exp_match = matching.get("experience_match", {})
        kd = matching.get("keyword_density", {})

        top_keywords    = [k["keyword"] for k in kd.get("top_keywords", [])[:15]]
        emphasis_keywords = kd.get("emphasis_keywords", [])

        must_include = strategy.get("must_include_keywords", [])[:10]
        weave_in     = strategy.get("keywords_to_weave_in", [])[:5]

        full_posting_block = ""
        if job_data.get("full_posting"):
            full_posting_block = "FULL POSTING:\n" + job_data["full_posting"]

        return f"""TARGET JOB
Title:       {job_data.get("title")}
Company:     {job_data.get("company_name", "Not specified")}
Location:    {job_data.get("location", "Not specified")}
Level:       {job_data.get("experience_level", "Not specified")}
Type:        {job_data.get("employment_type", "Not specified")}

JOB DESCRIPTION:
{job_data.get("description", "Not specified")}

REQUIREMENTS:
{job_data.get("requirements", "Not specified")}

{full_posting_block}

Required skills:  {", ".join(job_data.get("required_skills", [])) if isinstance(job_data.get("required_skills"), list) else job_data.get("required_skills", "See description")}
Preferred skills: {", ".join(job_data.get("preferred_skills", [])) if isinstance(job_data.get("preferred_skills"), list) else job_data.get("preferred_skills", "See description")}
Education req:    {job_data.get("education_requirement", "Not specified")}
Experience req:   {job_data.get("years_experience_min", "?")}–{job_data.get("years_experience_max", "?")} years

──────────────────────────────────────────────────────────────────
MATCHING ANALYSIS
──────────────────────────────────────────────────────────────────
Relevance score: {matching["relevance_score"]}/100  |  Match: {exp_match.get("level","?").upper()}

Candidate skills that match the job (feature these prominently):
{", ".join(matching["matching_skills"][:15]) or "None identified"}

Skills from job NOT in candidate profile (do NOT fabricate):
{", ".join(matching["skill_gaps"][:10]) or "None"}

Transferable skills to bridge gaps:
{", ".join(matching.get("transferable_skills", [])) or "None identified"}

Experience summary: {exp_match.get("summary", "")}
Candidate total: {exp_match.get("years_total", 0)} yrs | Relevant: {exp_match.get("relevant_years", 0)} yrs | Required: {exp_match.get("required_years", "?")} yrs

HIGH-PRIORITY KEYWORDS — use these naturally throughout (not forced):
{", ".join(top_keywords) if top_keywords else "Extract from description above"}

Most repeated in posting (3+ times — the employer really cares about these):
{", ".join(emphasis_keywords) if emphasis_keywords else "N/A"}

Must include (weave in naturally):        {", ".join(must_include)}
Secondary keywords (include if relevant): {", ".join(weave_in)}

TAILORING APPROACH: {strategy.get("approach", "bridge_skills").upper()}
Focus: {strategy.get("focus", "Tailor to job requirements")}
"""

    def _build_general_context(self, profile: Dict) -> str:
        return f"""NO SPECIFIC JOB TARGET — writing a general-purpose CV.

Optimise for:
- Broad ATS compatibility across the candidate's industry.
- Strongest achievements and clearest career narrative.
- Target position: {profile.get("desired_position", "Not specified")}.
- Industry-standard terminology without over-indexing on any one role type.
"""

    # ──────────────────────────────────────────────────────────────────────────
    # HELPERS
    # ──────────────────────────────────────────────────────────────────────────

    def _tone_guidance(self, style: str, seniority: str) -> str:
        """
        Tone is a combination of style AND seniority.
        This replaces the old generic style_guide which gave formatting labels
        without actually changing how the model writes.
        """
        seniority_voice = {
            "entry-level": "Eager, concrete, and honest about learning. Don't oversell. Be specific about what you actually did.",
            "junior":       "Concrete and direct. Let the work speak. Avoid sounding like you're overselling junior achievements.",
            "mid-level":    "Confident and specific. You've done this before. Own your contributions without hedging.",
            "senior":       "Strategic and precise. You solve problems and make decisions. Let that show in the language.",
            "executive":    "Visionary but grounded. Board-level language. P&L, org design, stakeholder outcomes. No fluff.",
        }

        style_modifiers = {
            "professional": "Formal, measured, corporate-ready. Every word earns its place.",
            "creative":     "Slightly conversational. Show personality in how achievements are described. Still ATS-safe.",
            "modern":       "Contemporary and direct. Approachable but professional. Strong verbs, clean structure.",
            "minimal":      "Ultra-lean. If a word can be cut without losing meaning, cut it.",
            "executive":    "Sophisticated. Leadership and business outcomes dominate. Strategy over tactics.",
        }

        voice   = seniority_voice.get(seniority, seniority_voice["mid-level"])
        modifier = style_modifiers.get(style, style_modifiers["professional"])

        return f"Seniority voice: {voice}\nStyle modifier: {modifier}"

    def _build_section_requirements(self, sections: List[str], user_data: Dict) -> str:
        reqs = []
        for s in sections:
            if s == "summary":
                reqs.append("• Professional Summary (50–90 words, specific positioning, unique candidate signal)")
            elif s in ("work", "experience"):
                n = len(user_data.get("work_experiences", []))
                reqs.append(f"• Professional Experience (ALL {n} positions — ordered by relevance, varied depth)")
            elif s == "education":
                n = len(user_data.get("educations", []))
                reqs.append(f"• Education ({n} entries)")
            elif s == "skills":
                reqs.append("• Technical Skills (12–20, categorised, evidenced) + Core Competencies (8–10)")
            elif s == "certifications":
                n = len(user_data.get("certifications", []))
                reqs.append(f"• Certifications ({n})")
            elif s == "projects":
                n = len(user_data.get("projects", []))
                reqs.append(f"• Projects ({n}, with technologies and specific impact)")
            elif s == "awards":
                n = len(user_data.get("awards", []))
                reqs.append(f"• Awards ({n})")
            elif s == "references":
                n = len(user_data.get("references", []))
                reqs.append(f"• References ({n})")
        return "\n".join(reqs) if reqs else "All standard sections"

    def _infer_seniority_level(self, user_data: Dict) -> str:
        profile = user_data.get("job_seeker_profile", {})
        years   = profile.get("years_of_experience") or 0

        titles = []
        if profile.get("professional_title"):
            titles.append(str(profile["professional_title"]))
        titles.extend(str(e.get("job_title", "")) for e in user_data.get("work_experiences", []))
        blob = " ".join(titles).lower()

        exec_tokens   = ["chief", "c-suite", "vp", "vice president", "director", "head of", "founder"]
        senior_tokens = ["senior", "lead", "principal", "staff", "manager"]

        if years >= 12 or any(t in blob for t in exec_tokens):
            return "executive"
        if years >= 7 or any(t in blob for t in senior_tokens):
            return "senior"
        if years >= 3:
            return "mid-level"
        if years >= 1:
            return "junior"
        return "entry-level"

    def _infer_industry_vertical(self, user_data: Dict, job_data: Optional[Dict]) -> str:
        profile = user_data.get("job_seeker_profile", {})
        preferred = profile.get("preferred_industries")

        if isinstance(preferred, list) and preferred:
            return str(preferred[0])
        if isinstance(preferred, str) and preferred.strip():
            return preferred.strip()

        if job_data:
            for key in ("category", "industry", "company_industry"):
                v = job_data.get(key)
                if isinstance(v, str) and v.strip().lower() not in ("", "not specified"):
                    return v.strip()

        chunks = [
            str(profile.get("professional_title", "")),
            str(profile.get("professional_summary", "")),
            str(profile.get("desired_position", "")),
            " ".join(str(e.get("job_title", "")) for e in user_data.get("work_experiences", [])),
            str((job_data or {}).get("title", "")),
            str((job_data or {}).get("description", "")),
        ]
        haystack = " ".join(chunks).lower()

        verticals = {
            "fintech":              ["fintech", "payments", "banking", "credit", "risk", "ledger"],
            "healthcare":           ["healthcare", "hospital", "clinical", "patient", "ehr", "medtech"],
            "saas":                 ["saas", "b2b software", "subscription", "customer success"],
            "e-commerce":           ["ecommerce", "e-commerce", "marketplace", "shopify"],
            "education":            ["education", "edtech", "curriculum", "teaching"],
            "ngo/nonprofit":        ["ngo", "nonprofit", "humanitarian", "development program", "grant"],
            "marketing":            ["marketing", "brand", "campaign", "seo", "content strategy"],
            "software engineering": ["software", "engineering", "backend", "frontend", "devops", "cloud"],
        }

        for vertical, keywords in verticals.items():
            if any(k in haystack for k in keywords):
                return vertical
        return "general"