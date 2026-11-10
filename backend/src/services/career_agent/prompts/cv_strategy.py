from .common import build_json_prompt


def build_cv_strategy_prompt(candidate, job, match, preferences):
    return build_json_prompt(
        task=(
            "Create a truthful CV plan for this candidate and job. Pick an evidence-backed "
            "title, structure, section order, and evidence to prioritize. Default to length "
            "one_page; choose two_pages only when the prioritized evidence genuinely cannot "
            "fit one page; never two_plus_pages. Keep value_proposition to one sentence of at "
            "most 25 words. Put off-target or low-value evidence into omitted_evidence_ids "
            "so the writer leaves it out."
        ),
        payload={"candidate": candidate, "job_analysis": job, "match": match, "preferences": preferences},
        schema={"target_professional_title": "string", "value_proposition": "string", "structure": "chronological", "length": "one_page", "template_key": "modern_professional", "section_order": ["string"], "prioritized_evidence_ids": ["string"], "omitted_evidence_ids": ["string"], "keyword_placement": ["string"], "reasoning": "string"},
    )
