from .common import build_json_prompt


def build_profile_intelligence_prompt(candidate):
    return build_json_prompt(
        task="Summarize the candidate's evidenced professional identity and missing information. Do not add facts.",
        payload={"candidate": candidate},
        schema={"professional_identity": "string", "strengths": ["string"], "missing_information": ["string"], "evidence_priorities": ["evidence_id"]},
    )
