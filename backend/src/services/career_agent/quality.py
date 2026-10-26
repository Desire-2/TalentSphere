"""ATS and final QA agents paired with deterministic factual checks."""

from __future__ import annotations

from typing import Any, Dict, List, Mapping, Tuple

from .document_generation import FactualConsistencyService
from .nvidia_client import NvidiaClient, NvidiaResult
from .prompts.ats_review import build_ats_review_prompt
from .prompts.final_qa import build_final_qa_prompt
from .schemas import clean_list, clean_text, json_object


class ATSQualityService:
    def __init__(self, client: NvidiaClient | None = None):
        self.client = client or NvidiaClient()

    @staticmethod
    def _structural_score(cv: Dict[str, Any]) -> Tuple[float, List[str]]:
        checks = []
        sections = cv.get("sections", [])
        section_types = {section.get("type") for section in sections}
        if "experience" in section_types or "professional_experience" in section_types:
            checks.append("Relevant experience is presented in a standard section.")
        if "education" in section_types:
            checks.append("Education is presented in a standard section.")
        if "skills" in section_types or "core_skills" in section_types:
            checks.append("Skills are presented as real selectable text.")
        score = (len(checks) / 3) * 100.0
        return score, checks

    def review(self, cv: Dict[str, Any], job_analysis: Dict[str, Any], candidate: Dict[str, Any]) -> tuple[Dict[str, Any], NvidiaResult]:
        result = self.client.complete_structured(build_ats_review_prompt(cv, job_analysis))
        raw = json_object(result.data, name="ATS review")
        try:
            ai_score = float(raw.get("ats_readiness", 0))
        except (TypeError, ValueError):
            ai_score = 0.0
        structural_score, structural_checks = self._structural_score(cv)
        factual = FactualConsistencyService().check(cv, document_type="CV", candidate=candidate)
        score = round(max(0.0, min(100.0, structural_score * 0.55 + max(0.0, min(ai_score, 100.0)) * 0.45)), 1)
        return {
            "ats_readiness": score,
            "score_explanation": "ATS readiness combines deterministic structure checks (55%) with a source-grounded job-alignment review (45%). It is a decision aid, not a guarantee.",
            "content_quality": structural_checks + clean_list(raw.get("content_quality"), maximum_items=15, item_maximum=300),
            "warnings": factual["issues"] + clean_list(raw.get("warnings"), maximum_items=20, item_maximum=300),
            "keyword_coverage": clean_list(raw.get("keyword_coverage"), maximum_items=25, item_maximum=120),
            "human_writing": clean_text(raw.get("human_writing"), maximum=80) or "Reviewed",
            "factual_consistency": factual,
        }, result


class FinalQAAgent:
    def __init__(self, client: NvidiaClient | None = None):
        self.client = client or NvidiaClient()

    def review(self, cv: Dict[str, Any], cover_letter: Dict[str, Any], job_analysis: Dict[str, Any], candidate: Dict[str, Any]) -> tuple[Dict[str, Any], NvidiaResult]:
        result = self.client.complete_structured(build_final_qa_prompt(cv, cover_letter, job_analysis))
        raw = json_object(result.data, name="final QA")
        cv_facts = FactualConsistencyService().check(cv, document_type="CV", candidate=candidate)
        letter_facts = FactualConsistencyService().check(cover_letter, document_type="COVER_LETTER", candidate=candidate)
        issues = cv_facts["issues"] + letter_facts["issues"] + clean_list(raw.get("consistency_issues"), maximum_items=20, item_maximum=300)
        factual_status = "VERIFIED" if not issues else "NEEDS_CONFIRMATION"
        return {
            "factual_status": factual_status,
            "human_writing_status": "Reviewed",
            "factual_checks": {"cv": cv_facts, "cover_letter": letter_facts},
            "consistency_issues": issues,
            "final_recommendations": clean_list(raw.get("final_recommendations"), maximum_items=15, item_maximum=300),
        }, result
