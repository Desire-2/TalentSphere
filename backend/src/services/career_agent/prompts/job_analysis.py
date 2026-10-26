from .common import build_json_prompt


def build_job_analysis_prompt(job, focus=None):
    payload = {"job": job}
    if focus:
        payload["candidate_focus"] = focus
    return build_json_prompt(
        task=(
            "Analyze this job source into requirements, recruiter priorities, and ATS terms. "
            "Distinguish REQUIRED, PREFERRED, IMPORTANT, and OPTIONAL. When a candidate focus is "
            "supplied, use it only to read seniority and role context from the listing; never copy "
            "candidate details into the requirements, priorities, or ATS terms."
        ),
        payload=payload,
        schema={"job_title": "string", "employer": "string", "location": "string", "employment_type": "string", "requirements": [{"text": "string", "priority": "REQUIRED", "category": "string", "keywords": ["string"]}], "top_skills": ["string"], "responsibilities": ["string"], "ats_keywords": ["string"], "recruiter_priorities": ["string"], "application_requirements": ["string"], "warnings": ["string"]},
    )

