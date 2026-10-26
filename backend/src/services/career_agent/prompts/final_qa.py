from .common import build_json_prompt


def build_final_qa_prompt(cv, cover_letter, job):
    return build_json_prompt(
        task="Run final factual and consistency QA across the CV and cover letter. Report source-backed concerns only.",
        payload={"cv": cv, "cover_letter": cover_letter, "job_analysis": job},
        schema={"factual_status": "VERIFIED|NEEDS_CONFIRMATION", "consistency_issues": ["string"], "final_recommendations": ["string"]},
    )
