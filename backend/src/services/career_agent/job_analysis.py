"""Authoritative target-job snapshots and structured requirement analysis."""

from __future__ import annotations

from hashlib import sha256
import json
import re
from typing import Any, Dict, List, Optional

from src.models.career_agent import CareerTargetJob
from src.models.job import Job
from src.models.user import User, db

from .nvidia_client import NvidiaClient, NvidiaResult
from .prompts.job_analysis import build_job_analysis_prompt
from .schemas import clean_list, clean_text, validate_job_analysis


def _json_list(value: Any) -> List[str]:
    if isinstance(value, list):
        return clean_list(value)
    if not value:
        return []
    try:
        parsed = json.loads(value)
    except (TypeError, ValueError):
        parsed = value
    return clean_list(parsed)


def _hash(value: Any) -> str:
    raw = json.dumps(value, ensure_ascii=False, sort_keys=True, default=str, separators=(",", ":"))
    return sha256(raw.encode("utf-8")).hexdigest()


class JobAnalysisAgent:
    def __init__(self, client: NvidiaClient | None = None):
        self.client = client or NvidiaClient()

    def analyze(self, snapshot: Dict[str, Any], focus: Optional[Dict[str, Any]] = None) -> tuple[Dict[str, Any], NvidiaResult]:
        result = self.client.complete_structured(build_job_analysis_prompt(snapshot, focus=focus))
        return validate_job_analysis(result.data), result


class CareerTargetJobService:
    def __init__(self, agent: JobAnalysisAgent | None = None):
        self.agent = agent or JobAnalysisAgent()

    @staticmethod
    def platform_snapshot(job: Job) -> Dict[str, Any]:
        company_name = None
        if job.company_id and getattr(job, "company", None):
            company_name = job.company.name
        elif job.external_company_name:
            company_name = job.external_company_name
        return {
            "source_type": "platform",
            "platform_job_id": job.id,
            "title": job.title,
            "employer": company_name or "",
            "location": job.get_location_display(),
            "employment_type": job.employment_type or "",
            "experience_level": job.experience_level or "",
            "education_requirement": job.education_requirement or "",
            "description": job.description or "",
            "requirements": job.application_instructions or "",
            "required_skills": _json_list(job.required_skills),
            "preferred_skills": _json_list(job.preferred_skills),
            "keywords": _json_list(job.keywords),
            "years_experience_min": job.years_experience_min,
            "years_experience_max": job.years_experience_max,
            "application_requirements": {
                "resume": bool(job.requires_resume),
                "cover_letter": bool(job.requires_cover_letter),
                "portfolio": bool(job.requires_portfolio),
            },
            "company_information": {
                "website": getattr(job.company, "website", None) if getattr(job, "company", None) else job.external_company_website,
                "industry": getattr(job.company, "industry", None) if getattr(job, "company", None) else None,
            },
        }

    @staticmethod
    def custom_snapshot(data: Dict[str, Any]) -> Dict[str, Any]:
        title = clean_text(data.get("title"), maximum=500)
        description = clean_text(data.get("description"), maximum=24000)
        requirements = clean_text(data.get("requirements"), maximum=16000)
        if not title and not description:
            title = "General CV"
        return {
            "source_type": "general" if data.get("general") else "pasted",
            "platform_job_id": None,
            "title": title or "General CV",
            "employer": clean_text(data.get("employer") or data.get("company"), maximum=300),
            "location": clean_text(data.get("location"), maximum=300),
            "employment_type": clean_text(data.get("employment_type"), maximum=100),
            "experience_level": clean_text(data.get("experience_level"), maximum=100),
            "education_requirement": clean_text(data.get("education_requirement"), maximum=300),
            "description": description,
            "requirements": requirements,
            "required_skills": clean_list(data.get("required_skills"), maximum_items=50, item_maximum=100),
            "preferred_skills": clean_list(data.get("preferred_skills"), maximum_items=50, item_maximum=100),
            "keywords": clean_list(data.get("keywords"), maximum_items=80, item_maximum=100),
            "years_experience_min": data.get("years_experience_min"),
            "years_experience_max": data.get("years_experience_max"),
            "application_requirements": data.get("application_requirements") if isinstance(data.get("application_requirements"), dict) else {},
            "company_information": {},
        }

    def build_target(self, user: User, data: Dict[str, Any]) -> CareerTargetJob:
        platform_job_id = data.get("platform_job_id") or data.get("job_id")
        if platform_job_id:
            job = Job.query.filter_by(id=platform_job_id, is_active=True).first()
            if not job:
                raise ValueError("The selected AfriTech opportunity is not available.")
            snapshot = self.platform_snapshot(job)
        else:
            snapshot = self.custom_snapshot(data.get("target_job") if isinstance(data.get("target_job"), dict) else data)
        source_hash = _hash(snapshot)
        # Reuse the exact user-owned target snapshot when it is still current.
        existing = CareerTargetJob.query.filter_by(
            user_id=user.id,
            platform_job_id=snapshot["platform_job_id"],
            source_hash=source_hash,
        ).order_by(CareerTargetJob.id.desc()).first()
        if existing:
            return existing
        target = CareerTargetJob(
            user_id=user.id,
            platform_job_id=snapshot["platform_job_id"],
            source_type=snapshot["source_type"],
            title=snapshot["title"],
            employer_name=snapshot["employer"] or None,
            location=snapshot["location"] or None,
            description=snapshot["description"] or None,
            requirements=snapshot["requirements"] or None,
            source_snapshot_json=json.dumps(snapshot, ensure_ascii=False),
            source_hash=source_hash,
        )
        db.session.add(target)
        db.session.flush()
        return target

    @staticmethod
    def deterministic_analysis(snapshot: Dict[str, Any]) -> Dict[str, Any]:
        """Source-preserving baseline used to ground and check model analysis."""
        requirements = []
        for skill in snapshot.get("required_skills", []):
            requirements.append({"text": skill, "priority": "REQUIRED", "category": "skill", "keywords": [skill]})
        for skill in snapshot.get("preferred_skills", []):
            requirements.append({"text": skill, "priority": "PREFERRED", "category": "skill", "keywords": [skill]})
        if snapshot.get("education_requirement"):
            requirements.append({"text": snapshot["education_requirement"], "priority": "REQUIRED", "category": "education", "keywords": []})
        years = snapshot.get("years_experience_min")
        if years:
            requirements.append({"text": f"{years}+ years of experience", "priority": "REQUIRED", "category": "experience", "keywords": []})
        return {
            "job_title": snapshot.get("title", ""),
            "employer": snapshot.get("employer", ""),
            "location": snapshot.get("location", ""),
            "employment_type": snapshot.get("employment_type", ""),
            "requirements": requirements,
            "top_skills": clean_list(snapshot.get("required_skills"), maximum_items=10),
            "responsibilities": [],
            "ats_keywords": clean_list(snapshot.get("keywords") or snapshot.get("required_skills"), maximum_items=40),
            "recruiter_priorities": [],
            "application_requirements": [key for key, required in (snapshot.get("application_requirements") or {}).items() if required],
            "warnings": [],
        }

    def analyze_target(self, target: CareerTargetJob, focus: Optional[Dict[str, Any]] = None) -> tuple[Dict[str, Any], NvidiaResult]:
        snapshot = target.get_snapshot()
        # A pipeline re-run after a transient failure must not re-bill the AI
        # call for a stage that already completed and persisted its analysis.
        if target.analysis_json:
            cached = target.get_analysis()
            if isinstance(cached, dict) and cached.get("requirements") is not None:
                return cached, NvidiaResult(
                    data=cached, model="cached", latency_ms=0,
                    prompt_tokens=None, completion_tokens=None, total_tokens=None,
                    retry_count=0,
                )
        ai_analysis, result = self.agent.analyze(snapshot, focus=focus)
        grounded = self.deterministic_analysis(snapshot)
        # Preserve authoritative listing fields and force known skills into the analysis.
        ai_analysis["job_title"] = grounded["job_title"] or ai_analysis["job_title"]
        ai_analysis["employer"] = grounded["employer"] or ai_analysis["employer"]
        ai_analysis["location"] = grounded["location"] or ai_analysis["location"]
        ai_analysis["employment_type"] = grounded["employment_type"] or ai_analysis["employment_type"]
        existing = {(item["text"].casefold(), item["priority"]) for item in ai_analysis["requirements"]}
        for item in grounded["requirements"]:
            if (item["text"].casefold(), item["priority"]) not in existing:
                ai_analysis["requirements"].append(item)
        ai_analysis["top_skills"] = clean_list(grounded["top_skills"] + ai_analysis["top_skills"], maximum_items=15)
        ai_analysis["ats_keywords"] = clean_list(grounded["ats_keywords"] + ai_analysis["ats_keywords"], maximum_items=40)
        target.analysis_json = json.dumps(ai_analysis, ensure_ascii=False)
        return ai_analysis, result

    @staticmethod
    def extract_keywords(text: str) -> List[str]:
        tokens = re.findall(r"[A-Za-z][A-Za-z0-9+#./-]{1,}", (text or "").casefold())
        stop_words = {"with", "from", "that", "this", "will", "have", "your", "years", "experience", "work", "role", "team", "and", "the", "for", "are", "our", "you", "job"}
        return sorted({token for token in tokens if token not in stop_words and len(token) > 2})
