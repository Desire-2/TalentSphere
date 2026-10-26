from .common import build_json_prompt


def build_cv_content_prompt(candidate, job, strategy):
    return build_json_prompt(
        task="Write a recruiter-ready CV using only source-backed evidence. Every entry and bullet must carry evidence_ids. Vary sentence structure naturally.",
        payload={"candidate": candidate, "job_analysis": job, "strategy": strategy},
        schema={"header": {"name": "string", "professional_title": "string", "email": "string", "phone": "string", "location": "string", "links": ["string"]}, "sections": [{"id": "string", "type": "string", "title": "string", "entries": [{"id": "string", "heading": "string", "subheading": "string", "dates": "string", "location": "string", "text": "string", "bullets": [{"id": "string", "text": "string", "evidence_ids": ["string"]}], "evidence_ids": ["string"]}]}]},
    )
