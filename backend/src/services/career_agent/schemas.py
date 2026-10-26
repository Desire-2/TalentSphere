"""Small, dependency-free validators for untrusted AI and editor payloads."""

from __future__ import annotations

import json
import re
from typing import Any, Dict, Iterable, List, Mapping, Sequence


class SchemaValidationError(ValueError):
    """Raised when an AI or API payload cannot safely enter the pipeline."""


def json_object(value: Any, *, name: str = "payload") -> Dict[str, Any]:
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError as exc:
            raise SchemaValidationError(f"{name} is not valid JSON") from exc
        if isinstance(parsed, dict):
            return parsed
    raise SchemaValidationError(f"{name} must be a JSON object")


def clean_text(value: Any, *, maximum: int = 8000) -> str:
    if value is None:
        return ""
    text = str(value).replace("\x00", " ").strip()
    text = re.sub(r"\s+", " ", text)
    return text[:maximum]


def clean_list(value: Any, *, maximum_items: int = 100, item_maximum: int = 500) -> List[str]:
    if value is None:
        return []
    if isinstance(value, str):
        values = re.split(r"[,;\n]", value)
    elif isinstance(value, Sequence) and not isinstance(value, (bytes, bytearray)):
        values = value
    else:
        return []
    seen = set()
    result = []
    for item in values:
        cleaned = clean_text(item, maximum=item_maximum)
        key = cleaned.casefold()
        if cleaned and key not in seen:
            seen.add(key)
            result.append(cleaned)
        if len(result) >= maximum_items:
            break
    return result


def clean_mapping(value: Any, *, allowed_keys: Iterable[str], maximum_text: int = 8000) -> Dict[str, Any]:
    source = value if isinstance(value, Mapping) else {}
    output: Dict[str, Any] = {}
    for key in allowed_keys:
        entry = source.get(key)
        if isinstance(entry, str):
            output[key] = clean_text(entry, maximum=maximum_text)
        elif isinstance(entry, list):
            output[key] = clean_list(entry)
        elif isinstance(entry, (int, float, bool)) or entry is None:
            output[key] = entry
    return output


def extract_json_from_model_text(text: str) -> Dict[str, Any]:
    """Extract one JSON object without trusting model prose or markdown fences."""
    text = (text or "").strip()
    if not text:
        raise SchemaValidationError("AI returned an empty response")
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)
    try:
        return json_object(text, name="AI response")
    except SchemaValidationError:
        start, end = text.find("{"), text.rfind("}")
        if start == -1 or end <= start:
            raise
        return json_object(text[start : end + 1], name="AI response")


def validate_job_analysis(value: Any) -> Dict[str, Any]:
    raw = json_object(value, name="job analysis")
    requirements = raw.get("requirements") if isinstance(raw.get("requirements"), list) else []
    safe_requirements = []
    for item in requirements[:80]:
        if not isinstance(item, Mapping):
            continue
        text = clean_text(item.get("text"), maximum=600)
        if not text:
            continue
        priority = clean_text(item.get("priority"), maximum=20).upper()
        if priority not in {"REQUIRED", "PREFERRED", "IMPORTANT", "OPTIONAL"}:
            priority = "IMPORTANT"
        safe_requirements.append({
            "text": text,
            "priority": priority,
            "category": clean_text(item.get("category"), maximum=80) or "general",
            "keywords": clean_list(item.get("keywords"), maximum_items=15, item_maximum=80),
        })
    return {
        "job_title": clean_text(raw.get("job_title"), maximum=300),
        "employer": clean_text(raw.get("employer"), maximum=300),
        "location": clean_text(raw.get("location"), maximum=300),
        "employment_type": clean_text(raw.get("employment_type"), maximum=100),
        "requirements": safe_requirements,
        "top_skills": clean_list(raw.get("top_skills"), maximum_items=15, item_maximum=100),
        "responsibilities": clean_list(raw.get("responsibilities"), maximum_items=20, item_maximum=600),
        "ats_keywords": clean_list(raw.get("ats_keywords"), maximum_items=40, item_maximum=100),
        "recruiter_priorities": clean_list(raw.get("recruiter_priorities"), maximum_items=10, item_maximum=300),
        "application_requirements": clean_list(raw.get("application_requirements"), maximum_items=15, item_maximum=300),
        "warnings": clean_list(raw.get("warnings"), maximum_items=20, item_maximum=300),
    }


def validate_strategy(value: Any) -> Dict[str, Any]:
    raw = json_object(value, name="CV strategy")
    structure = clean_text(raw.get("structure"), maximum=50).lower()
    if structure not in {"chronological", "hybrid", "functional"}:
        structure = "chronological"
    length = clean_text(raw.get("length"), maximum=30).lower()
    if length not in {"one_page", "two_pages", "two_plus_pages"}:
        length = "two_pages"
    return {
        "target_professional_title": clean_text(raw.get("target_professional_title"), maximum=180),
        "value_proposition": clean_text(raw.get("value_proposition"), maximum=500),
        "structure": structure,
        "length": length,
        "template_key": clean_text(raw.get("template_key"), maximum=80),
        "section_order": clean_list(raw.get("section_order"), maximum_items=20, item_maximum=60),
        "prioritized_evidence_ids": clean_list(raw.get("prioritized_evidence_ids"), maximum_items=80, item_maximum=30),
        "omitted_evidence_ids": clean_list(raw.get("omitted_evidence_ids"), maximum_items=80, item_maximum=30),
        "keyword_placement": clean_list(raw.get("keyword_placement"), maximum_items=30, item_maximum=250),
        "reasoning": clean_text(raw.get("reasoning"), maximum=1000),
    }


def _validate_evidence_ids(value: Any, allowed_ids: set[str]) -> List[str]:
    return [item for item in clean_list(value, maximum_items=30, item_maximum=30) if item in allowed_ids]


def validate_document_content(value: Any, *, allowed_evidence_ids: Iterable[str], document_type: str) -> Dict[str, Any]:
    """Validate a structured editable document and require source citations."""
    raw = json_object(value, name=f"{document_type} content")
    allowed = set(allowed_evidence_ids)
    header = raw.get("header") if isinstance(raw.get("header"), Mapping) else {}
    safe_header = {
        "name": clean_text(header.get("name"), maximum=180),
        "professional_title": clean_text(header.get("professional_title"), maximum=180),
        "email": clean_text(header.get("email"), maximum=160),
        "phone": clean_text(header.get("phone"), maximum=60),
        "location": clean_text(header.get("location"), maximum=180),
        "links": clean_list(header.get("links"), maximum_items=8, item_maximum=300),
    }
    if document_type == "COVER_LETTER":
        body = raw.get("body") if isinstance(raw.get("body"), Mapping) else {}
        paragraphs = []
        for item in body.get("paragraphs", [])[:8] if isinstance(body.get("paragraphs"), list) else []:
            if not isinstance(item, Mapping):
                continue
            text = clean_text(item.get("text"), maximum=1600)
            citations = _validate_evidence_ids(item.get("evidence_ids"), allowed)
            if text and citations:
                paragraphs.append({"id": clean_text(item.get("id"), maximum=80), "text": text, "evidence_ids": citations})
        return {
            "document_type": "COVER_LETTER",
            "header": safe_header,
            "recipient": clean_mapping(raw.get("recipient"), allowed_keys=["company", "role", "address", "salutation"], maximum_text=300),
            "subject": clean_text(raw.get("subject"), maximum=300),
            "body": {"paragraphs": paragraphs, "closing": clean_text(body.get("closing"), maximum=500)},
        }

    sections = []
    raw_sections = raw.get("sections") if isinstance(raw.get("sections"), list) else []
    for section in raw_sections[:18]:
        if not isinstance(section, Mapping):
            continue
        section_type = clean_text(section.get("type"), maximum=60).lower().replace(" ", "_")
        title = clean_text(section.get("title"), maximum=120)
        if not section_type or not title:
            continue
        entries = []
        for entry in section.get("entries", [])[:30] if isinstance(section.get("entries"), list) else []:
            if not isinstance(entry, Mapping):
                continue
            citations = _validate_evidence_ids(entry.get("evidence_ids"), allowed)
            # Empty citation lists are never allowed for AI-generated entries.
            if not citations:
                continue
            bullets = []
            for bullet in entry.get("bullets", [])[:12] if isinstance(entry.get("bullets"), list) else []:
                if isinstance(bullet, Mapping):
                    bullet_text = clean_text(bullet.get("text"), maximum=800)
                    bullet_ids = _validate_evidence_ids(bullet.get("evidence_ids") or citations, allowed)
                else:
                    bullet_text = clean_text(bullet, maximum=800)
                    bullet_ids = citations
                if bullet_text and bullet_ids:
                    bullets.append({"id": clean_text(getattr(bullet, "get", lambda *_: "")("id"), maximum=80), "text": bullet_text, "evidence_ids": bullet_ids})
            entry_data = {
                "id": clean_text(entry.get("id"), maximum=80),
                "heading": clean_text(entry.get("heading"), maximum=300),
                "subheading": clean_text(entry.get("subheading"), maximum=300),
                "dates": clean_text(entry.get("dates"), maximum=80),
                "location": clean_text(entry.get("location"), maximum=180),
                "text": clean_text(entry.get("text"), maximum=1600),
                "bullets": bullets,
                "evidence_ids": citations,
            }
            if entry_data["heading"] or entry_data["text"] or bullets:
                entries.append(entry_data)
        if entries:
            sections.append({"id": clean_text(section.get("id"), maximum=80), "type": section_type, "title": title, "entries": entries})
    if not sections:
        raise SchemaValidationError("CV content has no source-backed sections")
    return {"document_type": "CV", "header": safe_header, "sections": sections}


def validate_assist_response(value: Any, *, allowed_evidence_ids: Iterable[str]) -> Dict[str, Any]:
    raw = json_object(value, name="AI writing assistance")
    allowed = set(allowed_evidence_ids)
    alternatives = []
    for alternative in raw.get("alternatives", [])[:5] if isinstance(raw.get("alternatives"), list) else []:
        if not isinstance(alternative, Mapping):
            continue
        text = clean_text(alternative.get("text"), maximum=1200)
        citations = _validate_evidence_ids(alternative.get("evidence_ids"), allowed)
        if text and citations:
            alternatives.append({"text": text, "evidence_ids": citations, "note": clean_text(alternative.get("note"), maximum=300)})
    if not alternatives:
        raise SchemaValidationError("AI assistance returned no source-backed alternatives")
    return {"alternatives": alternatives}
