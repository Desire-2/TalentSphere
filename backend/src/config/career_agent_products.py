"""Single source of truth for AfriTech AI Career Agent products.

Database rows are seeded from these values and may be adjusted by an admin.
Frontend clients always read plans from the authenticated subscription API.
"""

CAREER_AGENT_CURRENCY = "RWF"

CAREER_AGENT_PRODUCTS = {
    "CAREER_AGENT_FREE": {
        "code": "CAREER_AGENT_FREE",
        "name": "First application package",
        "price_rwf": 0,
        "duration_days": None,
        "generation_package_limit": 1,
        "is_free": True,
        "is_active": True,
        "description": "One CV and its matching cover letter for one target opportunity.",
    },
    "CAREER_AGENT_MONTHLY": {
        "code": "CAREER_AGENT_MONTHLY",
        "name": "Monthly",
        "price_rwf": 1000,
        "duration_days": 30,
        # None means active subscribers can create further job-targeted packages.
        # This is intentionally centrally configurable in the database.
        "generation_package_limit": None,
        "is_free": False,
        "is_active": True,
        "description": "Continue creating job-specific CV and cover-letter packages while active.",
    },
    "CAREER_AGENT_6_MONTHS": {
        "code": "CAREER_AGENT_6_MONTHS",
        "name": "6 months",
        "price_rwf": 5000,
        "duration_days": 182,
        "generation_package_limit": None,
        "is_free": False,
        "is_active": True,
        "description": "Continue creating job-specific CV and cover-letter packages while active.",
    },
    "CAREER_AGENT_YEARLY": {
        "code": "CAREER_AGENT_YEARLY",
        "name": "1 year",
        "price_rwf": 8000,
        "duration_days": 365,
        "generation_package_limit": None,
        "is_free": False,
        "is_active": True,
        "description": "Continue creating job-specific CV and cover-letter packages while active.",
    },
}


def get_product(code):
    """Return a configured product without leaking mutable module state."""
    product = CAREER_AGENT_PRODUCTS.get(code)
    return dict(product) if product else None
