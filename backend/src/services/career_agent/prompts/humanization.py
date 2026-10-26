from .common import build_json_prompt


HUMANIZATION_TASK = (
    "Improve only robotic or repetitive wording while preserving exact evidence "
    "and citations. Never rewrite or echo the whole document: return only the "
    "passages you actually changed, addressed by the id already present on that "
    "entry, bullet, or paragraph, plus a one-line note per change. Passages you "
    "leave alone must be omitted so the untouched wording is kept verbatim. Each "
    "rewrite must keep the same factual meaning and carry only evidence_ids that "
    "already appear on that passage."
)


def build_humanization_prompt(document, candidate, job):
    return build_json_prompt(
        task=HUMANIZATION_TASK,
        payload={"document": document, "candidate": candidate, "job_analysis": job},
        schema={
            "rewrites": [
                {
                    "id": "existing id of the changed entry/bullet/paragraph",
                    "text": "rewritten text for that passage only",
                    "evidence_ids": ["unchanged source-backed citation ids"],
                }
            ],
            "changes": ["short description of one wording change"],
        },
    )
