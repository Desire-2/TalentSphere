"""Transparent hybrid candidate-job matching with an explicit score formula."""

from __future__ import annotations

from datetime import date, datetime
import re
from typing import Any, Dict, Iterable, List, Mapping, Tuple

from .nvidia_client import NvidiaClient, NvidiaResult
from .prompts.candidate_matching import build_candidate_matching_prompt
from .schemas import clean_list, clean_text, json_object


def _tokens(value: Any) -> set[str]:
    if isinstance(value, Mapping):
        chunks = [str(entry) for entry in value.values() if isinstance(entry, (str, int, float))]
    elif isinstance(value, list):
        chunks = [str(entry) for entry in value]
    else:
        chunks = [str(value or "")]
    return {
        token.casefold()
        for chunk in chunks
        for token in re.findall(r"[A-Za-z][A-Za-z0-9+#./-]{1,}", chunk)
        if len(token) > 1
    }


def _evidence_text(record: Dict[str, Any]) -> str:
    payload = record.get("payload", {})
    if isinstance(payload, Mapping):
        return " ".join(str(value) for value in payload.values() if value is not None)
    return str(payload)


def _norm(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").casefold()).strip()


class CandidateJobMatchingAgent:
    def __init__(self, client: NvidiaClient | None = None):
        self.client = client or NvidiaClient()

    def semantic_relevance(self, candidate: Dict[str, Any], job_analysis: Dict[str, Any]) -> tuple[Dict[str, Any], NvidiaResult]:
        compact_evidence = [
            {
                "evidence_id": record["evidence_id"],
                "category": record["category"],
                "text": _evidence_text(record)[:1200],
            }
            for record in candidate.get("evidence_sources", [])
        ]
        compact_candidate = {"evidence": compact_evidence}
        result = self.client.complete_structured(build_candidate_matching_prompt(compact_candidate, job_analysis))
        raw = json_object(result.data, name="candidate matching")
        allowed = {record["evidence_id"] for record in candidate.get("evidence_sources", [])}
        relevance = []
        for item in raw.get("relevance", [])[:100] if isinstance(raw.get("relevance"), list) else []:
            if not isinstance(item, Mapping) or item.get("evidence_id") not in allowed:
                continue
            try:
                score = float(item.get("score", 0))
            except (TypeError, ValueError):
                score = 0.0
            relevance.append({
                "evidence_id": item["evidence_id"],
                "score": max(0.0, min(score, 1.0)),
                "matched_requirements": clean_list(item.get("matched_requirements"), maximum_items=8, item_maximum=300),
                "reason": clean_text(item.get("reason"), maximum=400),
            })
        transferable = []
        for item in raw.get("transferable", [])[:30] if isinstance(raw.get("transferable"), list) else []:
            if isinstance(item, Mapping) and item.get("evidence_id") in allowed:
                transferable.append({"evidence_id": item["evidence_id"], "reason": clean_text(item.get("reason"), maximum=400)})
        return {
            "relevance": relevance,
            "transferable": transferable,
            "unverified": clean_list(raw.get("unverified"), maximum_items=25, item_maximum=300),
        }, result


class CandidateJobMatcher:
    """Calculates every displayed score from traceable inputs."""

    def __init__(self, agent: CandidateJobMatchingAgent | None = None):
        self.agent = agent or CandidateJobMatchingAgent()

    @staticmethod
    def _candidate_tokens(candidate: Dict[str, Any]) -> set[str]:
        tokens = set()
        for evidence in candidate.get("evidence_sources", []):
            tokens.update(_tokens(_evidence_text(evidence)))
        return tokens

    @staticmethod
    def _job_skills(job_analysis: Dict[str, Any]) -> Tuple[List[str], List[str]]:
        required, preferred = [], []
        for requirement in job_analysis.get("requirements", []):
            if requirement.get("category") != "skill":
                continue
            text = clean_text(requirement.get("text"), maximum=120)
            if not text:
                continue
            if requirement.get("priority") == "REQUIRED":
                required.append(text)
            else:
                preferred.append(text)
        return clean_list(required, maximum_items=30), clean_list(preferred, maximum_items=30)

    @staticmethod
    def _skill_present(skill: str, candidate_tokens: set[str], candidate_text: str) -> bool:
        normalized = _norm(skill)
        if not normalized:
            return False
        if " " in normalized or any(char in normalized for char in "+#./"):
            return normalized in candidate_text
        return normalized in candidate_tokens

    @staticmethod
    def _parse_date(value: Any) -> date | None:
        if not value:
            return None
        value = str(value)[:10]
        for format_ in ("%Y-%m-%d", "%Y-%m", "%Y"):
            try:
                parsed = datetime.strptime(value, format_)
                return date(parsed.year, parsed.month if format_ != "%Y" else 1, 1)
            except ValueError:
                continue
        return None

    def _experience_score(self, candidate: Dict[str, Any], job_analysis: Dict[str, Any], semantic: Dict[str, Any]) -> float:
        experience_records = candidate.get("experience", [])
        intervals = []
        now = date.today()
        for record in experience_records:
            payload = record.get("payload", {})
            start = self._parse_date(payload.get("start_date"))
            end = self._parse_date(payload.get("end_date")) or (now if payload.get("is_current") else None)
            if start and end and end >= start:
                intervals.append((start, end))
        intervals.sort()
        merged_years = 0.0
        if intervals:
            merged_start, merged_end = intervals[0]
            for start, end in intervals[1:]:
                if start <= merged_end:
                    merged_end = max(merged_end, end)
                else:
                    merged_years += (merged_end - merged_start).days / 365.25
                    merged_start, merged_end = start, end
            merged_years += (merged_end - merged_start).days / 365.25
        years = merged_years
        required_years = 0.0
        for requirement in job_analysis.get("requirements", []):
            if requirement.get("category") == "experience":
                match = re.search(r"(\d+(?:\.\d+)?)", requirement.get("text", ""))
                if match:
                    required_years = max(required_years, float(match.group(1)))
        tenure_score = 100.0 if required_years == 0 else min(100.0, (years / required_years) * 100)
        semantic_scores = [item["score"] for item in semantic.get("relevance", []) if item["evidence_id"] in {entry.get("evidence_id") for entry in experience_records}]
        semantic_score = (sum(semantic_scores) / len(semantic_scores) * 100) if semantic_scores else 0.0
        # When dates are absent, semantic evidence still carries 60% of the experience signal.
        if required_years == 0 and not semantic_scores:
            return 50.0 if experience_records else 0.0
        return round((tenure_score * 0.55) + (semantic_score * 0.45), 1)

    @staticmethod
    def _education_score(candidate: Dict[str, Any], job_analysis: Dict[str, Any]) -> float:
        education_requirements = [item for item in job_analysis.get("requirements", []) if item.get("category") == "education"]
        if not education_requirements:
            return 100.0
        education_text = " ".join(_evidence_text(item) for item in candidate.get("education", [])).casefold()
        if not education_text:
            return 0.0
        levels = [("phd", 5), ("doctor", 5), ("master", 4), ("mba", 4), ("bachelor", 3), ("degree", 3), ("diploma", 2), ("certificate", 1)]
        candidate_level = max((rank for keyword, rank in levels if keyword in education_text), default=0)
        requirements = " ".join(item.get("text", "") for item in education_requirements).casefold()
        required_level = max((rank for keyword, rank in levels if keyword in requirements), default=1)
        return round(min(100.0, candidate_level / required_level * 100), 1) if candidate_level else 0.0

    @staticmethod
    def _evidence_score(candidate: Dict[str, Any]) -> float:
        categories = {item.get("category") for item in candidate.get("evidence_sources", [])}
        core = {"identity", "professional_identity", "experience", "education", "project", "skill", "certification", "achievement", "language", "volunteering"}
        return round(min(100.0, len(categories & core) / 6 * 100), 1)

    def analyze(self, candidate: Dict[str, Any], job_analysis: Dict[str, Any]) -> tuple[Dict[str, Any], NvidiaResult]:
        semantic, result = self.agent.semantic_relevance(candidate, job_analysis)
        candidate_tokens = self._candidate_tokens(candidate)
        candidate_text = " ".join(_evidence_text(record) for record in candidate.get("evidence_sources", [])).casefold()
        required_skills, preferred_skills = self._job_skills(job_analysis)
        matched_required = [skill for skill in required_skills if self._skill_present(skill, candidate_tokens, candidate_text)]
        missing_required = [skill for skill in required_skills if skill not in matched_required]
        matched_preferred = [skill for skill in preferred_skills if self._skill_present(skill, candidate_tokens, candidate_text)]
        denominator = len(required_skills) + (len(preferred_skills) * 0.5)
        skills_score = 100.0 if denominator == 0 else ((len(matched_required) + len(matched_preferred) * 0.5) / denominator) * 100

        ats_keywords = clean_list(job_analysis.get("ats_keywords"), maximum_items=50)
        matched_keywords = [keyword for keyword in ats_keywords if self._skill_present(keyword, candidate_tokens, candidate_text)]
        keyword_score = 100.0 if not ats_keywords else (len(matched_keywords) / len(ats_keywords)) * 100
        experience_score = self._experience_score(candidate, job_analysis, semantic)
        education_score = self._education_score(candidate, job_analysis)
        evidence_score = self._evidence_score(candidate)
        # Formula: skills 30%, experience (date + validated semantic relevance) 25%, education 15%,
        # exact keyword coverage 15%, and verified evidence completeness 15%.
        overall = (
            skills_score * 0.30
            + experience_score * 0.25
            + education_score * 0.15
            + keyword_score * 0.15
            + evidence_score * 0.15
        )
        evidence_by_id = {item["evidence_id"]: item for item in candidate.get("evidence_sources", [])}
        matched_evidence = [
            {"evidence_id": item["evidence_id"], "category": evidence_by_id[item["evidence_id"]].get("category"), "reason": item["reason"]}
            for item in semantic.get("relevance", [])
            if item["score"] >= 0.55 and item["evidence_id"] in evidence_by_id
        ]
        return {
            "scores": {
                "overall": round(overall, 1),
                "skills": round(skills_score, 1),
                "experience": round(experience_score, 1),
                "education": round(education_score, 1),
                "keyword_coverage": round(keyword_score, 1),
                "evidence_strength": round(evidence_score, 1),
            },
            "calculation": {
                "formula": "overall = skills×30% + experience×25% + education×15% + keyword coverage×15% + evidence strength×15%",
                "skills": {"matched_required": matched_required, "matched_preferred": matched_preferred, "missing": missing_required},
                "keywords": {"matched": matched_keywords, "considered": ats_keywords},
                "semantic_relevance": semantic.get("relevance", []),
            },
            "matched": {"skills": matched_required + matched_preferred, "evidence": matched_evidence},
            "missing": {"skills": missing_required, "requirements": [item["text"] for item in job_analysis.get("requirements", []) if item.get("priority") == "REQUIRED" and item.get("category") != "skill"]},
            "transferable": semantic.get("transferable", []),
            "unverified": semantic.get("unverified", []),
            "note": "Scores are decision aids based on listed evidence and job requirements, not a prediction of hiring outcomes.",
        }, result
