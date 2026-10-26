"""Build a normalized, source-traceable candidate representation."""

from __future__ import annotations

from datetime import datetime
from hashlib import sha256
import json
from typing import Any, Dict, Iterable, List, Tuple

from sqlalchemy import tuple_
from sqlalchemy.exc import IntegrityError

from src.models.career_agent import CareerEvidence, CareerProfile, ImportedCareerDocument
from src.models.profile_extensions import (
    Award,
    Certification,
    Education,
    Language,
    ProfessionalMembership,
    Project,
    Reference,
    VolunteerExperience,
    WorkExperience,
)
from src.models.user import JobSeekerProfile, User, db

from .nvidia_client import NvidiaClient, NvidiaResult
from .prompts.profile_intelligence import build_profile_intelligence_prompt
from .schemas import clean_list, clean_text


def _json_value(value: Any, default):
    if value in (None, ""):
        return default
    if isinstance(value, (list, dict)):
        return value
    try:
        return json.loads(value)
    except (TypeError, ValueError):
        return default


def _fingerprint(payload: Any) -> str:
    raw = json.dumps(payload, ensure_ascii=False, sort_keys=True, default=str, separators=(",", ":"))
    return sha256(raw.encode("utf-8")).hexdigest()


class ProfileIntelligenceAgent:
    """Uses the centralized provider only for interpreting already structured evidence."""

    def __init__(self, client: NvidiaClient | None = None):
        self.client = client or NvidiaClient()

    def analyze(self, candidate: Dict[str, Any]) -> NvidiaResult:
        compact = {
            "identity": candidate.get("identity", {}),
            "professional_identity": candidate.get("professional_identity", {}),
            "evidence": candidate.get("evidence_sources", []),
            "missing_information": candidate.get("missing_information", []),
        }
        return self.client.complete_structured(build_profile_intelligence_prompt(compact))


class CareerProfileService:
    """Normalizes platform profile data without making a second profile system."""

    def get_or_create(self, user_id: int, *, lock: bool = False) -> CareerProfile:
        query = CareerProfile.query.filter_by(user_id=user_id)
        if lock:
            query = query.with_for_update()
        profile = query.first()
        if profile:
            return profile
        profile = CareerProfile(user_id=user_id)
        try:
            # Use a savepoint so a concurrent first request cannot roll back
            # an outer generation transaction when the unique user_id row is
            # created by another worker first.
            with db.session.begin_nested():
                db.session.add(profile)
                db.session.flush()
            return profile
        except IntegrityError:
            query = CareerProfile.query.filter_by(user_id=user_id)
            if lock:
                query = query.with_for_update()
            existing = query.first()
            if existing:
                return existing
            raise

    def update_preferences(self, user: User, data: Dict[str, Any]) -> CareerProfile:
        profile = self.get_or_create(user.id)
        if "preferred_professional_title" in data:
            profile.preferred_professional_title = clean_text(data.get("preferred_professional_title"), maximum=180) or None
        if "preferred_language" in data:
            profile.preferred_language = clean_text(data.get("preferred_language"), maximum=20) or "en"
        if "preferred_template_key" in data:
            profile.preferred_template_key = clean_text(data.get("preferred_template_key"), maximum=80) or "modern_professional"
        if "preferred_document_mode" in data:
            mode = clean_text(data.get("preferred_document_mode"), maximum=30)
            profile.preferred_document_mode = mode if mode in {"ats_safe", "visual_professional"} else "ats_safe"
        profile.set_preferences(
            career=data.get("career_preferences") if isinstance(data.get("career_preferences"), dict) else None,
            writing=data.get("writing_preferences") if isinstance(data.get("writing_preferences"), dict) else None,
            document=data.get("document_preferences") if isinstance(data.get("document_preferences"), dict) else None,
        )
        return profile

    @staticmethod
    def _profile_rows(user: User) -> List[Tuple[str, str, str, Dict[str, Any]]]:
        """Return category, source reference, human label, and source payload rows."""
        job_profile = user.job_seeker_profile
        base_identity = {
            "name": user.get_full_name(),
            "email": user.email,
            "phone": user.phone,
            "location": user.location,
            "bio": user.bio,
        }
        rows: List[Tuple[str, str, str, Dict[str, Any]]] = [
            ("identity", f"profile:user:{user.id}", "AfriTech account profile", base_identity),
        ]
        if job_profile:
            profile_payload = {
                "professional_title": job_profile.professional_title,
                "professional_summary": job_profile.professional_summary,
                "desired_position": job_profile.desired_position,
                "years_of_experience": job_profile.years_of_experience,
                "technical_skills": _json_value(job_profile.technical_skills, clean_list(job_profile.technical_skills)),
                "soft_skills": _json_value(job_profile.soft_skills, clean_list(job_profile.soft_skills)),
                "skills": _json_value(job_profile.skills, clean_list(job_profile.skills)),
                "certifications": _json_value(job_profile.certifications, clean_list(job_profile.certifications)),
                "linkedin_url": job_profile.linkedin_url,
                "github_url": job_profile.github_url,
                "portfolio_url": job_profile.portfolio_url,
                "website_url": job_profile.website_url,
                "preferred_industries": _json_value(job_profile.preferred_industries, clean_list(job_profile.preferred_industries)),
                "preferred_location": job_profile.preferred_location,
                "job_types": _json_value(job_profile.job_types, clean_list(job_profile.job_types)),
            }
            rows.append(("professional_identity", f"profile:job_seeker:{job_profile.id}", "AfriTech career profile", profile_payload))

        model_rows: Iterable[Tuple[str, Any, str]] = [
            ("experience", WorkExperience, "Work experience"),
            ("education", Education, "Education"),
            ("certification", Certification, "Certification"),
            ("project", Project, "Project"),
            ("achievement", Award, "Award or achievement"),
            ("language", Language, "Language"),
            ("volunteering", VolunteerExperience, "Volunteer experience"),
            ("membership", ProfessionalMembership, "Professional membership"),
            ("reference", Reference, "Reference"),
        ]
        for category, model, label in model_rows:
            for item in model.query.filter_by(user_id=user.id).all():
                rows.append((category, f"profile:{category}:{item.id}", label, item.to_dict()))
        return rows

    def sync_evidence(self, user: User) -> CareerProfile:
        """Mirror current verified profile facts and retain older evidence as historical."""
        career_profile = self.get_or_create(user.id)
        profile_rows = self._profile_rows(user)
        CareerEvidence.query.filter_by(career_profile_id=career_profile.id, source_type="profile", is_current=True).update(
            {CareerEvidence.is_current: False}, synchronize_session=False
        )
        # The old implementation performed one indexed SELECT for every
        # profile row. That becomes expensive on a remote PostgreSQL database
        # because a normal profile can contain a dozen evidence rows. Resolve
        # all existing fingerprints in one query, then only INSERT missing
        # rows.
        evidence_keys = []
        fingerprinted_rows = []
        for category, source_reference, source_label, payload in profile_rows:
            fingerprint = _fingerprint(payload)
            evidence_keys.append((source_reference, fingerprint))
            fingerprinted_rows.append((category, source_reference, source_label, payload, fingerprint))

        existing = {}
        if evidence_keys:
            existing = {
                (row.source_reference, row.content_fingerprint): row
                for row in CareerEvidence.query.filter(
                    CareerEvidence.user_id == user.id,
                    tuple_(CareerEvidence.source_reference, CareerEvidence.content_fingerprint).in_(evidence_keys),
                ).all()
            }

        for category, source_reference, source_label, payload, fingerprint in fingerprinted_rows:
            evidence = existing.get((source_reference, fingerprint))
            if not evidence:
                evidence = CareerEvidence(
                    career_profile_id=career_profile.id,
                    user_id=user.id,
                    category=category,
                    source_type="profile",
                    source_reference=source_reference,
                    source_label=source_label,
                    payload_json=json.dumps(payload, ensure_ascii=False, default=str),
                    content_fingerprint=fingerprint,
                    confidence=1.0,
                    is_verified=True,
                    is_current=True,
                    verified_at=datetime.utcnow(),
                )
                db.session.add(evidence)
            else:
                evidence.is_current = True
                evidence.is_verified = True
                evidence.verified_at = evidence.verified_at or datetime.utcnow()
        career_profile.last_source_fingerprint = _fingerprint([row[4] for row in fingerprinted_rows])
        return career_profile

    def confirm_import(self, user: User, imported: ImportedCareerDocument, selected_categories: List[str] | None = None) -> int:
        """Promote user-confirmed extraction data into evidence; never overwrite profile data."""
        profile = self.get_or_create(user.id)
        extracted = imported.get_extracted_data()
        selected = set(selected_categories or extracted.keys())
        created = 0
        category_mapping = {
            "experience": "experience",
            "education": "education",
            "skills": "skill",
            "certifications": "certification",
            "projects": "project",
            "achievements": "achievement",
            "languages": "language",
            "contact": "identity",
            "links": "digital_presence",
            "other": "other",
        }
        for raw_category, values in extracted.items():
            if raw_category not in selected or raw_category not in category_mapping:
                continue
            entries = values if isinstance(values, list) else [values]
            for index, value in enumerate(entries):
                if not value:
                    continue
                payload = value if isinstance(value, dict) else {"value": value}
                fingerprint = _fingerprint(payload)
                source_reference = f"import:{imported.id}:{raw_category}:{index}"
                evidence = CareerEvidence.query.filter_by(
                    user_id=user.id,
                    source_reference=source_reference,
                    content_fingerprint=fingerprint,
                ).first()
                if evidence:
                    evidence.is_current = True
                    evidence.is_verified = True
                    evidence.verified_at = datetime.utcnow()
                    continue
                db.session.add(CareerEvidence(
                    career_profile_id=profile.id,
                    user_id=user.id,
                    category=category_mapping[raw_category],
                    source_type="user_confirmation",
                    source_reference=source_reference,
                    source_label=f"Confirmed import: {imported.filename}",
                    payload_json=json.dumps(payload, ensure_ascii=False, default=str),
                    content_fingerprint=fingerprint,
                    confidence=1.0,
                    is_verified=True,
                    is_current=True,
                    verified_at=datetime.utcnow(),
                ))
                created += 1
        imported.review_status = "CONFIRMED"
        return created

    def candidate_profile(self, user: User, *, refresh: bool = True) -> Dict[str, Any]:
        """Return the only candidate input accepted by generation agents."""
        if refresh:
            profile = self.sync_evidence(user)
            db.session.flush()
        else:
            profile = self.get_or_create(user.id)
        evidence = CareerEvidence.query.filter_by(
            career_profile_id=profile.id,
            is_current=True,
            is_verified=True,
        ).order_by(CareerEvidence.category, CareerEvidence.id).all()
        categorized: Dict[str, List[Dict[str, Any]]] = {}
        evidence_sources = []
        for item in evidence:
            record = {
                "evidence_id": f"ev_{item.id}",
                "category": item.category,
                "source": item.source_label,
                "payload": item.get_payload(),
                "confidence": item.confidence,
                # Provenance travels with every fact so a prompt can tell
                # profile-derived truth from AI-derived inference.
                "provenance": {
                    "source": item.source_type,
                    "verified": bool(item.is_verified),
                },
            }
            categorized.setdefault(item.category, []).append(record)
            evidence_sources.append(record)

        identity = {}
        for item in categorized.get("identity", []):
            payload = item.get("payload") or {}
            if not isinstance(payload, dict):
                continue
            for key, value in payload.items():
                if value not in (None, "", [], {}) and identity.get(key) in (None, "", [], {}):
                    identity[key] = value
        professional = {}
        for item in categorized.get("professional_identity", []):
            payload = item.get("payload") or {}
            if not isinstance(payload, dict):
                continue
            for key, value in payload.items():
                if value not in (None, "", [], {}) and professional.get(key) in (None, "", [], {}):
                    professional[key] = value
        missing = self._missing_information(identity, professional, categorized)
        return {
            "candidate_id": user.id,
            "career_profile_id": profile.id,
            "identity": identity,
            "professional_identity": professional,
            "education": categorized.get("education", []),
            "experience": categorized.get("experience", []),
            "skills": categorized.get("skill", []) + categorized.get("professional_identity", []),
            "certifications": categorized.get("certification", []),
            "projects": categorized.get("project", []),
            "achievements": categorized.get("achievement", []),
            "volunteering": categorized.get("volunteering", []),
            "languages": categorized.get("language", []),
            "digital_presence": categorized.get("digital_presence", []),
            "references": categorized.get("reference", []),
            "evidence_sources": evidence_sources,
            "confidence": "verified_profile_and_confirmed_imports_only",
            "missing_information": missing,
            "career_preferences": profile.get_career_preferences(),
            "writing_preferences": profile.get_writing_preferences(),
            "document_preferences": profile.get_document_preferences(),
        }

    @staticmethod
    def _missing_information(identity: Dict[str, Any], professional: Dict[str, Any], categorized: Dict[str, List[Dict[str, Any]]]) -> List[str]:
        missing = []
        if not identity.get("email"):
            missing.append("Email address")
        if not identity.get("phone"):
            missing.append("Phone number")
        if not (professional.get("professional_title") or professional.get("desired_position")):
            missing.append("Professional title")
        if not categorized.get("experience"):
            missing.append("Work experience")
        if not categorized.get("education"):
            missing.append("Education")
        skills = professional.get("skills") or professional.get("technical_skills")
        if not skills:
            missing.append("Skills")
        return missing

    def readiness(self, user: User) -> Dict[str, Any]:
        candidate = self.candidate_profile(user)
        missing = candidate["missing_information"]
        all_checks = [
            ("contact", "Contact details", not any(item in missing for item in ["Email address", "Phone number"])),
            ("experience", "Experience", bool(candidate["experience"])),
            ("education", "Education", bool(candidate["education"])),
            ("skills", "Skills", "Skills" not in missing),
            ("projects", "Projects", bool(candidate["projects"])),
        ]
        complete_count = sum(1 for _, _, completed in all_checks if completed)
        return {
            "readiness_percent": round((complete_count / len(all_checks)) * 100),
            "checks": [{"key": key, "label": label, "complete": complete} for key, label, complete in all_checks],
            "missing_information": missing,
            "recommendations": self._recommendations(candidate),
            "candidate": candidate,
        }

    @staticmethod
    def _recommendations(candidate: Dict[str, Any]) -> List[str]:
        recommendations = []
        if candidate["experience"] and not candidate["projects"]:
            recommendations.append("Add your strongest projects to make technical or portfolio-based applications more concrete.")
        if candidate["experience"] and not candidate["achievements"]:
            recommendations.append("Add verified outcomes or achievements to relevant experience entries when available.")
        if not candidate["languages"]:
            recommendations.append("Add languages and proficiency only where you can confidently support them.")
        return recommendations
