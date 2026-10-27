#!/usr/bin/env python3
"""Seed researched, real-world external jobs and scholarships from
scripts/researched_content.json.

All listings are published with external application links (application_url)
and future deadlines. Idempotent: re-runs skip entries whose (title, company)
pair (title for scholarships) already exists.

Usage (from backend/):
    python3 scripts/seed_researched_content.py
"""

import json
import os
import re
import secrets
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.main import app  # noqa: E402
from src.models.job import Job, JobCategory  # noqa: E402
from src.models.scholarship import Scholarship, ScholarshipCategory  # noqa: E402
from src.models.user import User, db  # noqa: E402

NOW = datetime.utcnow
DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "researched_content.json")

JOB_CATEGORY_MAP = {
    "tech": "Software Development",
    "data": "Data Science",
    "design": "Design",
    "marketing": "Marketing",
    "sales": "Sales",
    "finance": "Finance",
    "hr": "Human Resources",
    "operations": "Operations",
    "healthcare": "Healthcare",
    "education": "Education",
    "engineering": "Engineering",
    "government": "Government",
    "consulting": "Consulting",
}

SCHOLARSHIP_CATEGORY_MAP = {
    "masters": "Postgraduate Studies",
    "undergraduate": "Undergraduate Studies",
    "online": "Online Programs",
}

STUDY_LEVEL_MAP = {
    "masters": "postgraduate",
    "bachelors": "undergraduate",
    "undergraduate": "undergraduate",
    "any": None,
}

EXPERIENCE_MAP = {
    "entry": "entry",
    "mid": "mid",
    "senior": "senior",
    "manager": "senior",
    "executive": "executive",
}

FUNDING_MAP = {
    "fully funded": "full",
    "full scholarship": "full",
    "partially funded": "partial",
}


def slugify(text, existing):
    base = re.sub(r"[^a-z0-9\s-]", "", text.lower())
    base = re.sub(r"\s+", "-", base).strip("-") or "item"
    slug, n = base, 2
    while slug in existing:
        slug = f"{base}-{n}"
        n += 1
    existing.add(slug)
    return slug


def parse_deadline(value):
    return datetime.strptime(value, "%Y-%m-%d").replace(hour=23, minute=59)


def ensure_categories(data):
    job_names = {JOB_CATEGORY_MAP[j["category"]] for j in data["jobs"]}
    job_names.add(JOB_CATEGORY_MAP["government"])  # explicit: always ensure new cats
    job_names.add(JOB_CATEGORY_MAP["consulting"])
    sch_names = {SCHOLARSHIP_CATEGORY_MAP[s["category"]] for s in data["scholarships"]}

    job_cats = {}
    for name in sorted(job_names):
        cat = JobCategory.query.filter_by(name=name).first()
        if not cat:
            cat = JobCategory(name=name, slug=name.lower().replace(" ", "-"), is_active=True)
            db.session.add(cat)
            db.session.flush()
        job_cats[name] = cat.id

    schol_cats = {}
    for name in sorted(sch_names):
        cat = ScholarshipCategory.query.filter_by(name=name).first()
        if not cat:
            cat = ScholarshipCategory(name=name, slug=name.lower().replace(" ", "-"), is_active=True)
            db.session.add(cat)
            db.session.flush()
        schol_cats[name] = cat.id
    return job_cats, schol_cats


def ensure_poster(email, first_name, last_name):
    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            role="external_admin",
            is_active=True,
            is_verified=True,
            email_verified_at=NOW(),
        )
        user.set_password(secrets.token_urlsafe(24))
        db.session.add(user)
        db.session.flush()
    return user.id


def split_location(job):
    """Return (location_type, city, country, remote_policy)."""
    raw = job["location"] or ""
    country = job.get("country") or None
    if job.get("remote") or raw.lower().startswith("remote"):
        return "remote", None, None, raw
    mode = "hybrid" if "(hybrid)" in raw.lower() else "on-site"
    cleaned = re.sub(r"\s*\((hybrid|on-site|remote)\)\s*", "", raw, flags=re.I).strip() or raw
    if country and cleaned.lower() == country.lower():
        city = None
    else:
        city = cleaned
    if country and country.lower().startswith("remote"):
        country = None
    return mode, city, country, None


def seed_jobs(data, job_cats, existing_slugs, poster_id):
    created = 0
    for entry in data["jobs"]:
        if Job.query.filter_by(
            title=entry["title"], external_company_name=entry["company"]
        ).first():
            continue

        cat_name = JOB_CATEGORY_MAP[entry["category"]]
        loc_type, city, country, remote_policy = split_location(entry)
        deadline = parse_deadline(entry["application_deadline"])

        description = entry["description"]
        if entry.get("benefits"):
            description += "\n\n## Benefits\n" + "\n".join(
                f"- {b}" for b in entry["benefits"]
            )

        job = Job(
            category_id=job_cats[cat_name],
            posted_by=poster_id,
            job_source="external",
            external_company_name=entry["company"],
            external_company_website=entry.get("company_website"),
            source_url=entry["source_url"],
            title=entry["title"],
            slug=slugify(f"{entry['title']}-{entry['company']}", existing_slugs),
            description=description,
            summary=description.split("\n")[0][:280],
            employment_type=entry["employment_type"].replace("_", "-"),
            experience_level=EXPERIENCE_MAP.get(entry["experience_level"], "mid"),
            location_type=loc_type,
            city=city,
            country=country,
            is_remote=loc_type == "remote",
            remote_policy=remote_policy,
            show_salary=False if entry.get("salary_min") is None else True,
            salary_min=entry.get("salary_min"),
            salary_max=entry.get("salary_max"),
            salary_currency="USD",
            salary_period="yearly",
            required_skills=json.dumps(entry.get("required_skills") or []),
            application_type="external",
            application_url=entry["application_url"],
            application_deadline=deadline,
            application_instructions=(
                "Applications are hosted on the employer's website. "
                "Click Apply to continue to the official posting."
            ),
            requires_resume=False,
            requires_cover_letter=False,
            requires_portfolio=False,
            status="published",
            is_active=True,
            published_at=NOW(),
            expires_at=deadline,
        )
        db.session.add(job)
        created += 1
    return created


def seed_scholarships(data, schol_cats, existing_slugs, poster_id):
    created = 0
    for entry in data["scholarships"]:
        if Scholarship.query.filter_by(title=entry["title"]).first():
            continue

        cat_name = SCHOLARSHIP_CATEGORY_MAP[entry["category"]]
        deadline = parse_deadline(entry["application_deadline"])
        host = entry.get("host_country") or ""

        description = entry["description"]
        if entry.get("eligibility"):
            description += "\n\n## Eligibility\n" + entry["eligibility"]
        if entry.get("benefits"):
            description += "\n\n## Benefits\n" + "\n".join(
                f"- {b}" for b in entry["benefits"]
            )

        scholarship = Scholarship(
            category_id=schol_cats[cat_name],
            posted_by=poster_id,
            scholarship_source="external",
            external_organization_name=entry["provider"],
            source_url=entry["source_url"],
            title=entry["title"],
            slug=slugify(entry["title"], existing_slugs),
            description=description,
            summary=entry["description"][:280],
            scholarship_type="academic",
            study_level=STUDY_LEVEL_MAP.get(entry.get("degree_level")),
            field_of_study="Any field",
            location_type="any" if host.lower() == "multiple" else "specific-country",
            country=None if host.lower() == "multiple" else host,
            funding_type=FUNDING_MAP.get((entry.get("funding") or "").lower()),
            renewable=False,
            application_type="external",
            application_url=entry["application_url"],
            application_deadline=deadline,
            application_instructions=(
                "Apply on the official provider website before the deadline. "
                "Requirements vary by programme — read the official page carefully."
            ),
            other_requirements=entry.get("eligibility"),
            requires_transcript=False,
            requires_recommendation_letters=False,
            requires_essay=False,
            requires_portfolio=False,
            status="published",
            is_active=True,
            published_at=NOW(),
        )
        db.session.add(scholarship)
        created += 1
    return created


def main():
    with open(DATA_FILE, encoding="utf-8") as fh:
        data = json.load(fh)

    with app.app_context():
        existing_job_slugs = {j.slug for j in Job.query.with_entities(Job.slug).all()}
        existing_schol_slugs = {s.slug for s in Scholarship.query.with_entities(Scholarship.slug).all()}

        job_cats, schol_cats = ensure_categories(data)
        job_poster = ensure_poster(
            "external-jobs@afritechbridge.online", "External", "Jobs"
        )
        schol_poster = ensure_poster(
            "scholarships@afritechbridge.online", "Scholarships", "Desk"
        )

        jobs_created = seed_jobs(data, job_cats, existing_job_slugs, job_poster)
        scholarships_created = seed_scholarships(
            data, schol_cats, existing_schol_slugs, schol_poster
        )

        db.session.commit()

        external_jobs = Job.query.filter_by(
            job_source="external", status="published", is_active=True
        ).count()
        external_schol = Scholarship.query.filter_by(
            scholarship_source="external", status="published", is_active=True
        ).count()
        total_jobs = Job.query.filter_by(status="published", is_active=True).count()
        total_schol = Scholarship.query.filter_by(status="published", is_active=True).count()
        print(
            f"seeded: {jobs_created} new external jobs, "
            f"{scholarships_created} new external scholarships"
        )
        print(
            f"totals — published jobs: {total_jobs} (external: {external_jobs}), "
            f"scholarships: {total_schol} (external: {external_schol})"
        )


if __name__ == "__main__":
    main()
