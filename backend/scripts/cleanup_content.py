#!/usr/bin/env python3
"""Remove fabricated/test content from the database.

Deletes:
- Scholarships whose description links to example.com (fabricated listicles)
- Test fixture companies ("TechCorp Inc", companies literally named "None")
- Duplicate companies by slug (keeps the oldest)

Marks expired jobs inactive.

Usage (from backend/):
    python3 scripts/cleanup_content.py
"""

import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.main import app  # noqa: E402
from src.models.company import Company  # noqa: E402
from src.models.job import Job  # noqa: E402
from src.models.scholarship import Scholarship  # noqa: E402
from src.models.user import db  # noqa: E402


def cleanup():
    with app.app_context():
        # 1. Fabricated scholarships linking to example.com
        fake_scholarships = Scholarship.query.filter(
            Scholarship.description.like("%example.com%")
        ).all()
        for s in fake_scholarships:
            print(f"deleting fabricated scholarship #{s.id}: {s.title[:60]}")
            db.session.delete(s)

        # 2. Test fixture companies
        bad_names = {"TechCorp Inc", "None"}
        bad_companies = Company.query.filter(Company.name.in_(bad_names)).all()
        for c in bad_companies:
            print(f"deleting test company #{c.id}: {c.name!r}")
            _delete_company_jobs(c)
            db.session.delete(c)

        # 3. Duplicate companies by slug (keep oldest id)
        seen = {}
        for c in Company.query.order_by(Company.id.asc()).all():
            if c.slug in seen:
                print(f"deleting duplicate company #{c.id}: {c.name!r} (slug={c.slug})")
                _delete_company_jobs(c)
                db.session.delete(c)
            else:
                seen[c.slug] = c.id

        # 4. Expire stale jobs
        now = datetime.utcnow()
        expired = Job.query.filter(
            Job.expires_at.isnot(None),
            Job.expires_at < now,
            Job.is_active.is_(True),
        ).all()
        for j in expired:
            print(f"expiring job #{j.id}: {j.title[:60]}")
            j.is_active = False
            j.status = "expired"

        db.session.commit()

        jobs = Job.query.filter_by(status="published", is_active=True).count()
        scholarships = Scholarship.query.filter_by(status="published", is_active=True).count()
        companies = Company.query.filter_by(is_active=True).count()
        print(
            f"\ncleanup complete — published jobs: {jobs}, "
            f"scholarships: {scholarships}, companies: {companies}"
        )


def _delete_company_jobs(company):
    for job in list(company.jobs):
        db.session.delete(job)


if __name__ == "__main__":
    cleanup()
