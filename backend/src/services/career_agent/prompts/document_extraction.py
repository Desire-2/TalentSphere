from .common import build_json_prompt


def build_document_extraction_prompt(image_instruction):
    return build_json_prompt(
        task=image_instruction,
        payload={},
        schema={"education": [], "experience": [], "skills": [], "certifications": [], "projects": [], "achievements": [], "languages": [], "contact": {}, "links": [], "other": []},
    )
