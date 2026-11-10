from .common import BREVITY_RULES, build_json_prompt


def build_cv_content_prompt(candidate, job, strategy):
    return build_json_prompt(
        task=(
            "Write a recruiter-ready CV using only source-backed evidence. Every entry and "
            "bullet must carry evidence_ids. Vary sentence structure naturally.\n"
            f"{BREVITY_RULES}\n"
            "Hard length budget — count the words before you answer:\n"
            "- Fit the strategy's length: one_page = at most 500 body words, two_pages = at "
            "most 750, two_plus_pages = at most 900. Never exceed the ceiling.\n"
            "- Professional summary: at most 2 sentences (about 25 words).\n"
            "- Bullets: at most 4 per entry on the most relevant recent role, at most 3 on "
            "other roles, at most 2 on older or loosely related entries; each bullet at most "
            "25 words.\n"
            "- Entry text: at most 30 words, and leave it empty when the bullets already say it.\n"
            "- At most 6 sections, only ones that serve the target job.\n"
            "Follow the strategy's prioritized_evidence_ids first and never use its "
            "omitted_evidence_ids."
        ),
        payload={"candidate": candidate, "job_analysis": job, "strategy": strategy},
        schema={"header": {"name": "string", "professional_title": "string", "email": "string", "phone": "string", "location": "string", "links": ["string"]}, "sections": [{"id": "string", "type": "string", "title": "string", "entries": [{"id": "string", "heading": "string", "subheading": "string", "dates": "string", "location": "string", "text": "string", "bullets": [{"id": "string", "text": "string", "evidence_ids": ["string"]}], "evidence_ids": ["string"]}]}]},
    )
