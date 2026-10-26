from .common import build_json_prompt


def build_candidate_matching_prompt(candidate, job):
    return build_json_prompt(
        task="Assess semantic relevance of candidate evidence to job requirements. Only rate provided evidence IDs; do not infer missing facts.",
        payload={"candidate": candidate, "job_analysis": job},
        schema={"relevance": [{"evidence_id": "string", "score": 0.0, "matched_requirements": ["string"], "reason": "string"}], "transferable": [{"evidence_id": "string", "reason": "string"}], "unverified": ["string"]},
    )
