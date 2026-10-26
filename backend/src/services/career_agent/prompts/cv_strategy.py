from .common import build_json_prompt


def build_cv_strategy_prompt(candidate, job, match, preferences):
    return build_json_prompt(
        task="Create a truthful CV plan for this candidate and job. Pick an evidence-backed title, structure, section order, and evidence to prioritize.",
        payload={"candidate": candidate, "job_analysis": job, "match": match, "preferences": preferences},
        schema={"target_professional_title": "string", "value_proposition": "string", "structure": "chronological", "length": "two_pages", "template_key": "modern_professional", "section_order": ["string"], "prioritized_evidence_ids": ["string"], "omitted_evidence_ids": ["string"], "keyword_placement": ["string"], "reasoning": "string"},
    )
