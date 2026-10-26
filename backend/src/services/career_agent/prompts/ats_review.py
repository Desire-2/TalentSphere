from .common import build_json_prompt


def build_ats_review_prompt(document, job):
    return build_json_prompt(
        task="Review ATS readiness and job alignment. Do not rewrite or invent content; report only specific checks and concerns.",
        payload={"document": document, "job_analysis": job},
        schema={"ats_readiness": 0, "content_quality": ["string"], "warnings": ["string"], "keyword_coverage": ["string"], "human_writing": "string"},
    )
