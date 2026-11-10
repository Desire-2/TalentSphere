from .common import BREVITY_RULES, build_json_prompt


def build_cover_letter_prompt(candidate, job, strategy):
    return build_json_prompt(
        task=(
            "Write a specific, natural cover letter for this job. Do not use generic opening "
            "boilerplate or unsupported company knowledge. Every paragraph needs evidence_ids.\n"
            f"{BREVITY_RULES}\n"
            "Length budget: 180-260 words in total, at most 3 body paragraphs of 2-3 sentences "
            "each. Do not repeat the CV; add only the motivation and fit the CV cannot show."
        ),
        payload={"candidate": candidate, "job_analysis": job, "strategy": strategy},
        schema={"header": {"name": "string", "professional_title": "string", "email": "string", "phone": "string", "location": "string", "links": ["string"]}, "recipient": {"company": "string", "role": "string", "address": "string", "salutation": "string"}, "subject": "string", "body": {"paragraphs": [{"id": "string", "text": "string", "evidence_ids": ["string"]}], "closing": "string"}},
    )
