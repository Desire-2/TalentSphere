"""Live smoke test: boots the real app and exercises Career Agent + apply endpoints.

Run: cd backend && python3 tests/smoke_career_agent.py
Prints one line per request; anything outside the expected set is a bug.
"""

from __future__ import annotations

import json
import os
import sys
import uuid

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

_DB = "/tmp/career_smoke_live.db"
try:
    os.remove(_DB)
except OSError:
    pass
os.environ["DATABASE_URL"] = f"sqlite:///{_DB}"
os.environ["ENABLE_CLEANUP_SERVICE"] = "false"

from src.main import app  # noqa: E402
from src.models.user import db  # noqa: E402

results = []


def check(name, response, expected):
    status = response.status_code
    ok = status in expected
    results.append((name, status, ok))
    marker = "OK " if ok else "!!!"
    body = ""
    try:
        data = response.get_json()
        if isinstance(data, dict):
            body = data.get("error") or ""
    except Exception:
        pass
    print(f"{marker} {name:55s} -> {status} {body[:90]}")


with app.app_context():
    db.create_all()

client = app.test_client()

# ── Register a job seeker (exercises the register pipeline end-to-end) ────────
suffix = uuid.uuid4().hex[:8]
reg = client.post("/api/auth/register", json={
    "email": f"smoke-{suffix}@test.local", "password": "Password123",
    "first_name": "Smoke", "last_name": "Tester", "role": "job_seeker",
})
check("auth/register", reg, {201})
token = reg.get_json().get("token", "")
H = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# ── Career Agent core ──────────────────────────────────────────────────────────
check("career-agent/profile", client.get("/api/career-agent/profile", headers=H), {200})
check("career-agent/usage", client.get("/api/career-agent/usage", headers=H), {200})
check("career-agent/subscription", client.get("/api/career-agent/subscription", headers=H), {200})
check("career-agent/generations", client.get("/api/career-agent/generations", headers=H), {200})
check("career-agent/documents/imports", client.get("/api/career-agent/documents/imports", headers=H), {200})
check("career-agent/documents/for-job/1", client.get("/api/career-agent/documents/for-job/1", headers=H), {200})
check("career-agent/generate (no key)", client.post("/api/career-agent/generate", headers=H, data="{}"), {400})
check("career-agent/documents/import (no file)", client.post("/api/career-agent/documents/import", headers=H), {400})
check("career-agent/analyze-job (empty)", client.post("/api/career-agent/analyze-job", headers=H, data="{}"), {400, 200, 503})
check("career-agent/doc/999999", client.get("/api/career-agent/documents/999999", headers=H), {404})
check("career-agent/export/999999", client.post("/api/career-agent/documents/999999/export?format=pdf", headers=H), {404})

# ── Application flow (needs a published job) ──────────────────────────────────
with app.app_context():
    from src.models.company import Company
    from src.models.job import Job, JobCategory
    from src.models.career_agent import (
        CareerDocument, CareerDocumentPackage, CareerDocumentVersion,
        CareerGenerationUsage, CareerTargetJob,
    )

    company = Company(name=f"Smoke Co {suffix}", slug=f"smoke-{suffix}")
    db.session.add(company)
    db.session.flush()
    category = JobCategory.query.filter_by(slug="engineering").first()
    if not category:
        category = JobCategory(name="Engineering", slug="engineering")
        db.session.add(category)
        db.session.flush()
    user = None
    from src.models.user import User as UserModel
    user = UserModel.query.filter_by(email=f"smoke-{suffix}@test.local").first()
    job = Job(
        title="Backend Engineer", slug=f"backend-{suffix}", description="Python role",
        employment_type="full-time", category_id=category.id, company_id=company.id,
        posted_by=user.id, status="published", is_active=True,
        requires_resume=True, requires_cover_letter=True,
    )
    db.session.add(job)
    db.session.flush()

    target = CareerTargetJob(
        user_id=user.id, platform_job_id=job.id, source_type="platform",
        title=job.title, source_snapshot_json="{}", analysis_json="{}",
        source_hash=uuid.uuid4().hex,
    )
    db.session.add(target)
    db.session.flush()
    package = CareerDocumentPackage(
        user_id=user.id, target_job_id=target.id,
        idempotency_key=f"smoke-{suffix}", status="COMPLETED", entitlement_source="FREE",
        completed_at=__import__("datetime").datetime.utcnow(),
    )
    db.session.add(package)
    db.session.flush()
    db.session.add(CareerGenerationUsage(
        user_id=user.id, package_id=package.id, entitlement_source="FREE", status="CONSUMED",
    ))
    cv_content = {
        "document_type": "CV",
        "header": {"name": "Smoke Tester", "professional_title": "Engineer", "email": "s@t.local", "phone": "+2500000000", "location": "Kigali", "links": []},
        "sections": [{"id": "s1", "type": "skills", "title": "Skills",
                      "entries": [{"id": "e1", "heading": "", "subheading": "", "dates": "", "location": "",
                                   "text": "Python, Flask", "bullets": [], "evidence_ids": ["ev_1"]}]}],
    }
    letter_content = {
        "document_type": "COVER_LETTER",
        "header": cv_content["header"],
        "recipient": {"company": "Smoke Co", "role": "Engineer", "address": "", "salutation": "Dear Team,"},
        "subject": "Application",
        "body": {"paragraphs": [{"id": "p1", "text": "I bring 3 years of Python experience.", "evidence_ids": ["ev_1"]}], "closing": "Sincerely,"},
    }
    cv = CareerDocument(package_id=package.id, user_id=user.id, document_type="CV",
                        title="Smoke CV", working_content_json=json.dumps(cv_content), current_version_number=1)
    letter = CareerDocument(package_id=package.id, user_id=user.id, document_type="COVER_LETTER",
                            title="Smoke Letter", working_content_json=json.dumps(letter_content), current_version_number=1)
    db.session.add_all([cv, letter])
    db.session.flush()
    db.session.add(CareerDocumentVersion(document_id=cv.id, version_number=1, content_json=json.dumps(cv_content), change_source="GENERATION"))
    db.session.add(CareerDocumentVersion(document_id=letter.id, version_number=1, content_json=json.dumps(letter_content), change_source="GENERATION"))
    db.session.commit()
    JOB_ID, CV_ID, LETTER_ID = job.id, cv.id, letter.id

check("career-agent/documents/for-job/<real>", client.get(f"/api/career-agent/documents/for-job/{JOB_ID}", headers=H), {200})
check("career-agent/doc/<real> (owner)", client.get(f"/api/career-agent/documents/{CV_ID}", headers=H), {200})

# Apply with the generated package attached
apply_res = client.post(f"/api/jobs/{JOB_ID}/apply", headers=H, data=json.dumps({
    "career_document_id": CV_ID,
    "cover_letter_document_id": LETTER_ID,
}))
check("jobs/<id>/apply (attached package)", apply_res, {201})

with app.app_context():
    from src.models.application import Application
    from src.models.career_agent import CareerApplicationDocument

    application = Application.query.filter_by(job_id=JOB_ID).first()
    if not application:
        print("!!! application row missing after 201")
        sys.exit(1)
    APPLICATION_ID = application.id
    print(f"    stored resume_url: {application.resume_url!r}")
    print(f"    cover letter text: {(application.cover_letter or '')[:60]!r}")
    link = CareerApplicationDocument.query.filter_by(application_id=application.id).first()
    print(f"    CareerApplicationDocument: {'present' if link else 'MISSING'}")

check("career-agent/application doc download (owner)",
      client.get(f"/api/career-agent/applications/{APPLICATION_ID}/documents/{CV_ID}/download", headers=H), {200, 503})
detail = client.get(f"/api/applications/{APPLICATION_ID}", headers=H)
check("applications/<id> (applicant view)", detail, {200})
if detail.status_code == 200:
    print(f"    career_documents exposed: {'career_documents' in detail.get_json()}")

# Employer view: register an employer and transfer job ownership inside one context.
with app.app_context():
    from src.models.user import User as UserModel
    from src.models.job import Job as JobModel

    employer = UserModel(email=f"employer-{suffix}@test.local", first_name="Em", last_name="Ployer",
                         role="employer", password_hash="unused")
    db.session.add(employer)
    db.session.flush()
    JobModel.query.filter_by(id=JOB_ID).update({"posted_by": employer.id}, synchronize_session=False)
    db.session.commit()
    EMPLOYER_ID = employer.id

reg2 = client.post("/api/auth/login", json={
    "email": f"employer-{suffix}@test.local", "password": "unused",
})
# The seeded employer row cannot log in without a real hash; mint a token directly.
with app.app_context():
    from src.models.user import User as UserModel
    emp_user = UserModel.query.get(EMPLOYER_ID)
    etoken = emp_user.generate_token(3600)
EH = {"Authorization": f"Bearer {etoken}", "Content-Type": "application/json"}

check("applications/<id> (employer view)", client.get(f"/api/applications/{APPLICATION_ID}", headers=EH), {200})
emp_download = client.get(f"/api/career-agent/applications/{APPLICATION_ID}/documents/{CV_ID}/download", headers=EH)
check("career-agent/application doc download (employer)", emp_download, {200, 503})

print("\n==== SUMMARY ====")
failures = [r for r in results if not r[2]]
print(f"{len(results) - len(failures)}/{len(results)} expected")
for name, status, ok in failures:
    print(f"  UNEXPECTED: {name} -> {status}")
sys.exit(1 if failures else 0)
