#!/usr/bin/env python3
"""Seed the platform with complete, realistic job and scholarship listings.

Listings are posted through platform-managed employer accounts with on-site
applications (no external links). Idempotent: existing titles are skipped.

Usage (from backend/):
    python3 scripts/seed_real_content.py
"""

import json
import os
import re
import secrets
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.main import app  # noqa: E402
from src.models.company import Company  # noqa: E402
from src.models.job import Job, JobCategory  # noqa: E402
from src.models.scholarship import Scholarship, ScholarshipCategory  # noqa: E402
from src.models.user import EmployerProfile, User, db  # noqa: E402

NOW = datetime.utcnow

JOB_CATEGORIES = [
    "Software Development", "Data Science", "Design", "Marketing", "Sales",
    "Product Management", "Operations", "Finance", "Human Resources", "Customer Support",
    "Healthcare", "Education", "Agriculture", "Engineering",
]

SCHOLARSHIP_CATEGORIES = [
    "Undergraduate Studies", "Postgraduate Studies", "STEM", "Business & Economics",
    "Health Sciences", "Agriculture & Environment", "Arts & Humanities", "Exchange Programs",
]

COMPANIES = [
    ("Kigali Digital Solutions", "Software Development", "Kigali", "A product studio building web and mobile applications for banks, telcos and public institutions across East Africa.", "startup", "11-50"),
    ("Akagera Agro Industries", "Agriculture", "Huye", "Agro-processing company working with smallholder farmers to export specialty coffee, macadamia and horticulture produce.", "corporation", "51-200"),
    ("Ubuntu Financial Group", "Finance", "Kigali", "Fintech and microfinance group providing savings, credit and insurance products to underserved communities.", "corporation", "51-200"),
    ("Lakeview Health Systems", "Healthcare", "Rubavu", "Private hospital network offering outpatient, maternity and diagnostic services with a focus on community health.", "corporation", "201-500"),
    ("Savannah Logistics", "Operations", "Kigali", "Regional freight and warehousing company connecting Rwanda, Uganda, Tanzania and Kenya through road and air cargo.", "corporation", "51-200"),
    ("Kivu Analytics", "Data Science", "Kigali", "Data consultancy helping NGOs, governments and businesses turn survey and operational data into decisions.", "startup", "11-50"),
    ("Horizon Solar Rwanda", "Engineering", "Musanze", "Distributor and installer of rooftop and mini-grid solar systems for homes, schools and health centres.", "startup", "11-50"),
    ("Ingabo HR Services", "Human Resources", "Kigali", "Recruitment and payroll outsourcing firm serving manufacturing, hospitality and tech employers.", "startup", "1-10"),
    ("SafePath Insurance", "Finance", "Kigali", "General insurer offering motor, property, health and micro-insurance through mobile channels.", "corporation", "51-200"),
    ("Mount Kigali Hospitality", "Operations", "Kigali", "Boutique hotel and conference venue group employing chefs, front-office and events teams.", "corporation", "51-200"),
    ("Umusingi Realty", "Operations", "Kigali", "Property management and commercial real-estate agency specialising in affordable housing and office space.", "startup", "11-50"),
    ("TealPath Software", "Software Development", "Remote", "Distributed software company building logistics and payments tools for African SMEs, remote-first across the continent.", "startup", "11-50"),
]

# Each job: (title, category, company_idx, employment_type, experience_level, location_type, city,
#            salary_min, salary_max, description, requirements, benefits)
JOBS = [
    ("Senior Full-Stack Engineer", "Software Development", 0, "full-time", "senior", "hybrid", "Kigali", 1400000, 2200000,
     "Kigali Digital Solutions is hiring a Senior Full-Stack Engineer to lead delivery on a mobile banking platform used by two regional microfinance institutions.\n\nYou will own features end to end across a React/TypeScript frontend and a Python (Flask) backend deployed on managed cloud infrastructure. Day to day work includes designing REST APIs, reviewing pull requests, mentoring two mid-level engineers, and sitting directly with client product owners during discovery workshops.\n\nThe right candidate has shipped production systems that handle real money movement and cares about testing, observability and clean data models.",
     ["4+ years building web applications with React and a Python backend framework", "Strong SQL skills and experience with PostgreSQL in production", "Comfort with CI/CD, code review and automated testing", "Experience with payment or banking integrations is a strong plus", "Clear written and spoken English; Kinyarwanda an advantage"],
     ["Competitive RWF salary reviewed twice a year", "Hybrid working: three days in the Kigali office", "Medical cover for you and one dependent", "Annual professional-development budget", "Visa and conference support for regional travel"]),
    ("Frontend Engineer (React)", "Software Development", 11, "full-time", "mid", "remote", "Remote", 900000, 1400000,
     "TealPath Software is looking for a Frontend Engineer to build merchant-facing dashboards for our logistics and payments products, used daily by SMEs in Rwanda, Kenya and Nigeria.\n\nYou will work in a small product squad: translating Figma designs into accessible React components, wiring them to our REST APIs, and improving page performance on low-bandwidth connections. We pair-program weekly and ship behind feature flags.\n\nExperience building for mobile-first, low-bandwidth users in African markets is highly valued.",
     ["3+ years of professional React/TypeScript experience", "Solid CSS skills and an eye for accessible UI", "Experience with state management (Redux or Zustand) and data fetching libraries", "Familiarity with end-to-end testing (Playwright or Cypress)", "Overlap with 9:00-15:00 CAT working hours"],
     ["Fully remote with a home-office stipend", "Async-first culture, minimal meetings", "Data and internet allowance", "Yearly retreat with the full team", "Equipment budget for laptop upgrades"]),
    ("Backend Engineer (Python/Flask)", "Software Development", 0, "full-time", "mid", "on-site", "Kigali", 1000000, 1600000,
     "Join our backend team building the APIs behind client banking portals: authentication, ledger integrations, reporting exports and audit trails.\n\nYou will design database schemas, write well-tested Flask blueprints, and improve performance of slow reporting queries. We run PostgreSQL with connection pooling, structured logging and nightly backups.",
     ["3+ years with Python and a web framework (Flask or Django)", "Production PostgreSQL experience including indexing strategies", "Understanding of authentication standards (JWT, OAuth2)", "Good unit and integration testing habits"],
     ["Hybrid schedule", "Medical insurance", "Mentorship from a principal engineer", "Certification reimbursement"]),
    ("Mobile Engineer (Flutter)", "Software Development", 2, "contract", "mid", "hybrid", "Kigali", 1100000, 1600000,
     "Ubuntu Financial Group needs a Flutter engineer for a 12-month contract to ship our customer savings app to feature phones and low-end Android devices.\n\nYou will optimise bundle size for 2G networks, integrate USSD fallback flows, and collaborate with our risk team on PIN and biometric authentication.",
     ["3+ years with Flutter/Dart shipped to the Play Store", "Experience with offline-first patterns and local storage", "Understanding of mobile security basics (secure storage, certificate pinning)", "Rwandan applicants strongly encouraged to apply"],
     ["12-month contract with renewal options", "Office laptop and test devices", "Medical cover", "Performance bonus on delivery milestones"]),
    ("QA Engineer", "Software Development", 11, "full-time", "mid", "remote", "Remote", 700000, 1000000,
     "TealPath is hiring a QA Engineer to own our automated regression suite and manual exploratory testing before each release.\n\nYou will write Playwright tests, file precise bug reports, and run pre-release checklists with product managers.",
     ["2+ years in software quality assurance", "Hands-on experience with Playwright or Selenium", "Comfort reading logs and SQL to diagnose bugs", "Excellent written English for bug reports"],
     ["Remote-first", "Flexible hours within CAT overlap", "Annual training budget"]),
    ("Data Analyst", "Data Science", 5, "full-time", "mid", "hybrid", "Kigali", 850000, 1300000,
     "Kivu Analytics is recruiting a Data Analyst to support public-health and education clients with survey analysis, dashboarding and clear written findings.\n\nYou will clean messy survey data in Python or SQL, build Tableau/Power BI dashboards, and present results to non-technical stakeholders.",
     ["2+ years analysing real-world data (SQL required)", "Python (pandas) or R proficiency", "Experience visualising data for non-technical audiences", "Degree in statistics, economics, computer science or related field"],
     ["Hybrid work", "Health insurance", "Conference attendance", "Study support for professional certifications"]),
    ("Junior Data Scientist", "Data Science", 5, "full-time", "entry", "hybrid", "Kigali", 500000, 800000,
     "An entry-level role for a strong quantitative candidate: you will help build demand-forecasting models for agricultural co-operatives under senior mentorship.\n\nExpect heavy time on data cleaning, feature engineering and evaluating model performance, plus writing short reports for client teams.",
     ["Bachelor's degree in a quantitative field", "Solid Python fundamentals and familiarity with scikit-learn", "Understanding of statistics (regression, cross-validation)", "Curiosity about agriculture and last-mile markets"],
     ["Structured mentorship programme", "Hybrid schedule", "Laptop provided", "Clear progression path to Data Scientist"]),
    ("GIS Specialist", "Data Science", 6, "contract", "mid", "on-site", "Musanze", 900000, 1300000,
     "Horizon Solar Rwanda needs a GIS specialist to map mini-grid coverage, site candidate schools and health centres, and maintain our asset registry in QGIS/ArcGIS.\n\nField work across the northern province is roughly 40% of the role; the rest is analysis and map production.",
     ["3+ years with GIS tooling and spatial data", "Experience with field data collection (ODK/KoBoToolbox)", "Valid motorcycle or car licence preferred", "Willingness to travel within Rwanda"],
     ["Field allowance and fuel covered", "Contract renewable annually", "Equipment provided"]),
    ("Product Designer (UI/UX)", "Design", 0, "full-time", "mid", "hybrid", "Kigali", 800000, 1200000,
     "Design end-to-end experiences for microfinance customers, from research interviews in branches to high-fidelity prototypes and design-system components.\n\nYou will run usability sessions with first-time smartphone users and partner closely with two engineering squads.",
     ["3+ years designing digital products", "Strong Figma skills including components and variants", "Portfolio showing research-informed decisions", "Comfort designing for low-literacy users"],
     ["Hybrid work", "Annual UX conference budget", "Medical insurance", "Flexible start times"]),
    ("Graphic Designer", "Design", 10, "full-time", "junior", "on-site", "Kigali", 450000, 700000,
     "Umusingi Realty needs a designer for property brochures, social media, signage and sales-deck templates.\n\nYou will maintain brand consistency across print and digital and occasionally shoot/edit property photos.",
     ["1+ years with Adobe Creative Suite or equivalent", "Portfolio of branding or marketing work", "Basic photo editing skills", "Kinyarwanda and English working proficiency"],
     ["On-site studio environment", "Phone allowance", "Performance bonus on campaigns"]),
    ("Digital Marketing Officer", "Marketing", 3, "full-time", "junior", "on-site", "Rubavu", 500000, 800000,
     "Run Lakeview Health's social channels, newsletter and health-campaign landing pages: content calendar, paid Facebook/Instagram campaigns, and monthly performance reports.",
     ["1+ years in digital marketing", "Hands-on with Meta Business Suite and basic SEO", "Good writing in English; Kinyarwanda fluency required", "Experience in healthcare a plus"],
     ["On-site role by the lake", "Medical insurance for family", "Training in healthcare compliance marketing"]),
    ("Growth Marketing Manager", "Marketing", 11, "full-time", "senior", "remote", "Remote", 1300000, 1800000,
     "Own acquisition and activation for TealPath's merchant product across three markets: plan experiments, manage a small budget of paid channels, and improve onboarding funnels with product and data teammates.",
     ["5+ years in growth or product marketing", "Track record running structured experiments (A/B, cohort analysis)", "Comfort with SQL or strong analytics-tool fluency", "Experience in African fintech or SaaS a plus"],
     ["Remote with quarterly on-sites", "Meaningful equity options", "Home-office and learning budgets"]),
    ("Content Writer", "Marketing", 4, "part-time", "junior", "remote", "Remote", 350000, 500000,
     "Write and edit blog posts, shipment-guide pages and email copy for Savannah Logistics' SME customers, in clear plain English.",
     ["1+ years writing web content", "Portfolio of published articles", "Strong grammar and interviewing skills", "Interest in trade and logistics"],
     ["Flexible part-time hours", "Fully remote", "Option to convert to full-time"]),
    ("Sales Executive", "Sales", 8, "full-time", "mid", "on-site", "Kigali", 600000, 1000000,
     "Sell motor and property insurance products to SMEs and walk-in customers: pipeline management, needs assessment, quotations and follow-up until close.",
     ["2+ years in B2C or SME sales targets", "Comfort with CRM tools and weekly pipeline reviews", "Excellent interpersonal skills in Kinyarwanda and English", "Valid driving licence preferred"],
     ["Base plus commission (uncapped)", "Airtime and transport allowance", "Medical cover", "President's-club trip for top performers"]),
    ("Business Development Representative", "Sales", 4, "full-time", "entry", "hybrid", "Kigali", 450000, 700000,
     "Prospect SME importers/exporters, book discovery calls for account executives, and keep our CRM clean.",
     ["0-2 years in sales, customer service or telesales", "Resilience and excellent phone manner", "Basic computer literacy (Google Workspace/CRM)", "Fluency in English and Kinyarwanda"],
     ["Structured onboarding and script training", "Commission on closed deals", "Hybrid after probation"]),
    ("Account Manager (Enterprise)", "Sales", 2, "full-time", "senior", "on-site", "Kigali", 1200000, 1700000,
     "Manage 8-12 enterprise accounts: quarterly business reviews, renewals, and identifying expansion opportunities in savings and insurance products.",
     ["5+ years in enterprise account management", "Experience with long sales cycles and procurement teams", "Financial-services domain knowledge", "Executive-level presentation skills"],
     ["Annual bonus tied to retention", "Medical and GAP cover", "Leadership coaching"]),
    ("Product Manager", "Product Management", 2, "full-time", "senior", "hybrid", "Kigali", 1500000, 2100000,
     "Lead the savings-product squad: set roadmap, write specs, prioritise with risk and compliance, and measure activation and retention weekly.",
     ["5+ years product management, ideally fintech", "Strong analytical skills (SQL a plus)", "Experience shipping on mobile in African markets", "Comfortable saying no with data"],
     ["Hybrid schedule", "Equity-adjacent bonus scheme", "Annual offsite", "Medical cover for family"]),
    ("Associate Product Manager", "Product Management", 11, "full-time", "entry", "remote", "Remote", 700000, 1000000,
     "Support the senior PM on merchant tools: write user stories, analyse funnels, and coordinate release checklists.",
     ["1-2 years in product, project management or engineering", "Excellent writing and organisation", "Basic SQL or willingness to learn fast", "Overlap with CAT hours"],
     ["Remote", "Mentorship from senior PM", "Learning stipend"]),
    ("Operations Manager", "Operations", 4, "full-time", "senior", "on-site", "Kigali", 1300000, 1800000,
     "Run daily warehouse and line-haul operations: dispatch scheduling, driver performance, inventory accuracy and SLA reporting to clients.",
     ["5+ years in logistics or supply-chain operations", "Experience managing teams of 15+", "WMS/ERP proficiency", "Data-driven reporting habits"],
     ["Company vehicle option", "Medical cover", "Annual bonus", "Leadership training"]),
    ("Supply Chain Officer", "Operations", 1, "full-time", "mid", "on-site", "Huye", 650000, 950000,
     "Coordinate farmer aggregate collection, quality checks and export documentation for coffee and horticulture shipments.",
     ["2+ years in supply chain or agribusiness", "Knowledge of export documentation is a plus", "Willingness to travel to farming sites", "Strong organisation under harvest peaks"],
     ["Transport provided for field days", "Health insurance", "Harvest-season bonus"]),
    ("Warehouse Supervisor", "Operations", 4, "full-time", "mid", "on-site", "Kigali", 550000, 800000,
     "Supervise receiving, put-away and picking teams; enforce safety checks and inventory counts.",
     ["2+ years warehouse supervision", "Forklift licence an advantage", "Comfort with WMS handheld scanners", "Shift-flexibility"],
     ["Shift allowance", "Protective equipment provided", "Medical cover"]),
    ("Chief Accountant", "Finance", 9, "full-time", "senior", "on-site", "Kigali", 1600000, 2300000,
     "Own monthly close, statutory reporting and internal controls for a growing hospitality group with three properties.",
     ["CPA/ACCA or equivalent", "7+ years accounting, hospitality a plus", "Strong IFRS knowledge", "Experience with ERP systems (SAP/Oracle a plus)"],
     ["Annual bonus", "Medical and retirement benefits", "Free stays across group hotels"]),
    ("Financial Analyst", "Finance", 2, "full-time", "mid", "hybrid", "Kigali", 900000, 1300000,
     "Build portfolio performance dashboards, support pricing of new savings products, and prepare board packs.",
     ["3+ years in financial analysis or FP&A", "Advanced Excel; Python or SQL a plus", "CFA progress viewed favourably", "Clear communication of numbers"],
     ["Study support for CFA", "Hybrid work", "Medical cover"]),
    ("Payroll Officer", "Finance", 7, "full-time", "mid", "on-site", "Kigali", 500000, 750000,
     "Process monthly payroll for 40+ client companies: timesheets, statutory deductions (RSSB, medical), payslips and filings.",
     ["2+ years payroll processing in Rwanda", "Knowledge of RSSB and tax (RRA) filings", "High accuracy under deadlines", "Discretion with sensitive data"],
     ["On-site role", "Medical insurance", "Year-end bonus"]),
    ("HR Officer", "Human Resources", 7, "full-time", "junior", "on-site", "Kigali", 450000, 650000,
     "Support recruitment scheduling, onboarding checklists, and employee records for client companies.",
     ["1+ years in HR administration", "Good organisational skills", "Confidentiality and empathy", "Kinyarwanda and English fluency"],
     ["Mentorship from HR manager", "Medical cover", "Clear progression to HR Business Partner"]),
    ("Talent Acquisition Specialist", "Human Resources", 7, "full-time", "mid", "hybrid", "Kigali", 700000, 1000000,
     "Own end-to-end recruiting for tech and manufacturing clients: sourcing, screening, interviewing coordination and offer management.",
     ["2+ years technical recruiting", "Sourcing skills on LinkedIn and local channels", "Structured interviewing knowledge", "Client-management comfort"],
     ["Hybrid", "Commission per hire", "Training in assessment methods"]),
    ("Customer Support Agent (French)", "Customer Support", 2, "full-time", "entry", "on-site", "Kigali", 400000, 550000,
     "Handle inbound calls and in-app chats from francophone customers about savings accounts and transaction issues, escalating to the care team as needed.",
     ["Fluency in French and English", "Patience and clear phone manner", "Typing speed 35+ wpm", "Prior call-centre experience a plus"],
     ["Paid training", "Transport allowance for late shifts", "Medical cover", "Performance bonuses"]),
    ("Customer Success Associate", "Customer Support", 11, "full-time", "mid", "remote", "Remote", 600000, 900000,
     "Onboard new SME merchants, drive feature adoption, and flag churn risks with data from our product analytics.",
     ["2+ years in customer success or account support", "Comfort with SaaS analytics dashboards", "Excellent written English", "Proactive follow-up habits"],
     ["Remote", "Quarterly bonus on retention targets", "Learning budget"]),
    ("Registered Nurse (Maternity)", "Healthcare", 3, "full-time", "mid", "on-site", "Rubavu", 700000, 1000000,
     "Provide antenatal, delivery and postnatal care in a busy maternity unit serving around 30 deliveries monthly.",
     ["Valid Rwandan nursing licence", "2+ years maternity ward experience", "BLS certification", "Compassion under pressure"],
     ["Housing allowance", "Shift and on-call pay", "Medical cover for family", "Study-leave support"]),
    ("Clinical Officer", "Healthcare", 3, "full-time", "mid", "on-site", "Rubavu", 650000, 900000,
     "Run outpatient consultations, diagnostics ordering and follow-ups at our Rubavu clinic.",
     ["Clinical officer diploma and licence", "2+ years outpatient experience", "Comfort with EMR systems", "English and Kinyarwanda fluency"],
     ["On-site housing option", "Medical cover", "CME allowance"]),
    ("Secondary School Teacher (Mathematics)", "Education", 5, "full-time", "mid", "on-site", "Huye", 400000, 600000,
     "Teach O-level and A-level mathematics, prepare students for national exams, and contribute to extracurricular STEM clubs.",
     ["Teaching diploma or degree with PGDE", "2+ years classroom experience", "Strong command of the Rwandan curriculum", "References required"],
     ["On-site housing available", "School fee discount for dependants", "Holiday schedule"]),
    ("Agronomy Field Officer", "Agriculture", 1, "full-time", "mid", "on-site", "Huye", 600000, 850000,
     "Train farmer groups on good agricultural practices, monitor trial plots, and report crop data weekly.",
     ["Degree in agriculture or related field", "2+ years extension or field work", "Motorcycle licence", "Willingness to rural travel"],
     ["Motorbike provided", "Field allowance", "Insurance"]),
    ("Solar Installation Technician", "Engineering", 6, "full-time", "mid", "on-site", "Musanze", 450000, 700000,
     "Install and maintain rooftop PV systems and battery banks; conduct customer training and safety checks.",
     ["Technical diploma in electrical or related field", "1+ years solar installation experience", "Comfort working at height with harnesses", "Troubleshooting mindset"],
     ["Tools and PPE provided", "Field allowance", "Overtime pay", "Path to team-lead role"]),
    ("Electrical Engineer (Solar Mini-Grids)", "Engineering", 6, "full-time", "senior", "hybrid", "Musanze", 1300000, 1900000,
     "Design DC/AC distribution for mini-grid sites, size battery storage, and supervise installation crews and compliance documentation.",
     ["Degree in electrical engineering", "5+ years with PV/diesel hybrid systems", "Knowledge of rural electrification standards", "AutoCAD/Dialux proficiency"],
     ["Hybrid with site visits", "Medical cover", "Annual bonus", "Conference budget"]),
]

# (title, category_idx, scholarship_type, study_level, field, amount_min, amount_max,
#  deadline_days, description, eligibility)
SCHOLARSHIPS = [
    ("Rwanda Excellence Undergraduate Scholarship", 0, "merit-based", "undergraduate", "Any field", 3000, 8000,
     90, "Full and partial tuition awards for high-achieving Rwandan students enrolling in undergraduate programmes at accredited universities.\n\nAwards are renewable each year based on maintained GPA and community-service participation. The selection committee reviews academic records, a personal essay and one recommendation letter.",
     ["Rwandan nationality", "Admission or enrolment in an accredited undergraduate programme", "Minimum 75% average in secondary school or equivalent", "Two recommendation letters", "Personal essay (max 800 words) on educational goals"]),
    ("East Africa Women in STEM Grant", 2, "merit-based", "postgraduate", "STEM fields", 5000, 12000,
     120, "Supporting women from East African Community countries pursuing postgraduate study in science, technology, engineering or mathematics.\n\nThe grant covers tuition plus a monthly stipend for two years and includes a mentor assigned from the partner universities' alumni network.",
     ["Female applicants from EAC member states", "Offer letter for a masters or PhD in a STEM discipline", "Academic transcripts with GPA above 3.2/4.0 or equivalent", "Statement of research interest", "One academic reference"]),
    ("Kigali Business School Merit Award", 3, "merit-based", "postgraduate", "Business & Economics", 4000, 10000,
     60, "Merit awards for candidates admitted to MBA and Masters in Finance programmes, covering 50-100% of tuition.\n\nSelection weighs GMAT/GRE scores (or the school's internal test), professional experience and interview performance.",
     ["Admission to a Kigali Business School postgraduate programme", "2+ years professional experience", "English proficiency", "Interview with the admissions board"]),
    ("Future Health Professionals Bursary", 4, "need-based", "undergraduate", "Health Sciences", 2000, 6000,
     75, "Need-based bursaries for students in nursing, clinical medicine, pharmacy and public-health programmes, funded by a regional hospital network.\n\nRecipients commit to a two-year service placement in a partner facility after graduation.",
     ["Enrolled in an accredited health-sciences programme", "Demonstrated financial need (documents required)", "Rwandan or partner-country nationality", "Willingness to accept post-graduation service placement"]),
    ("Green Futures Agriculture Fellowship", 5, "merit-based", "postgraduate", "Agriculture & Environment", 6000, 15000,
     150, "A fully funded one-year master's fellowship in sustainable agriculture, agri-economics or environmental management for graduates who will return to work in their home countries' agri-food sectors.",
     ["Bachelor's degree in agriculture, environment or related field", "2+ years work experience preferred", "Leadership potential evidenced by community projects", "Return-service commitment letter"]),
    ("Creative Arts Portfolio Scholarship", 6, "merit-based", "undergraduate", "Arts & Humanities", 1500, 5000,
     85, "Awards for visual artists, writers, musicians and filmmakers accepted into undergraduate arts programmes. Selection is portfolio-first.\n\nSubmit 10-15 pieces of work plus a short artist statement.",
     ["Portfolio of creative work", "Acceptance or application to an arts programme", "Artist statement (max 500 words)", "Two references (one may be a practitioner)"]),
    ("Rwanda-Germany Exchange Scholarship", 7, "merit-based", "postgraduate", "Any field", 8000, 18000,
     100, "Semester-exchange and full-degree support for Rwandan students at partner German universities, funded through the bilateral education programme.\n\nCovers round-trip travel, tuition at the partner rate, health insurance and a monthly stipend.",
     ["Rwandan nationality", "Undergraduate degree completed", "German (B1) or English (IELTS 6.5+) proficiency", "University admission from a German partner institution"]),
    ("Agribusiness Entrepreneurs Award", 5, "need-based", "vocational", "Agribusiness", 1000, 3500,
     55, "Seed funding plus a six-month training award for young entrepreneurs launching agribusiness ventures (processing, logistics, digital marketplaces).\n\nAwards are disbursed in two tranches tied to business-plan milestones.",
     ["Age 18-35", "Business plan for an agribusiness venture in Rwanda", "Commitment to the six-month training programme", "At least two team members per application encouraged"]),
    ("Mastercard-Style Access Scholarship (Engineering)", 2, "need-based", "undergraduate", "STEM fields", 4000, 10000,
     130, "Full tuition plus living support for academically strong students with limited means entering engineering programmes.\n\nIncludes laptop provision, tutoring, and internship placement support with partner firms.",
     ["Admission to an engineering undergraduate programme", "Demonstrated financial need", "Strong mathematics and science results", "Community involvement evidence"]),
    ("Public Policy Leadership Scholarship", 3, "merit-based", "postgraduate", "Public Policy", 5000, 12000,
     95, "Funding for mid-career public servants pursuing master's degrees in public policy, governance or development economics.\n\nApplicants must secure study-leave confirmation from their ministry or agency.",
     ["2+ years in public service or NGO sector", "Employer study-leave letter", "Bachelor's degree with good standing", "Policy memo (1,000 words) on a current Rwandan challenge"]),
    ("Sports Women's Scholarship", 0, "merit-based", "undergraduate", "Sports Science", 1500, 4000,
     70, "Support for female athletes (football, athletics, basketball) who have represented their district or national teams and wish to study while training.\n\nRequires coach's endorsement and medical clearance.",
     ["Female athlete aged 18-22", "Proof of competitive participation", "Coach's endorsement letter", "Admission to an accredited institution"]),
    ("Digital Skills Bootcamp Scholarships", 2, "need-based", "vocational", "ICT", 800, 2000,
     40, "Full scholarships for the 12-week Digital Skills Bootcamp covering frontend development, data basics and digital literacy, with job-search support at the end.\n\nNo prior degree required; selection is by aptitude test and motivation interview.",
     ["Age 18-30", "Basic computer literacy", "Pass the aptitude test", "Available full-time for 12 weeks"]),
]


def slugify(text, existing):
    base = re.sub(r"[^a-z0-9\s-]", "", text.lower())
    base = re.sub(r"\s+", "-", base).strip("-") or "item"
    slug, n = base, 2
    while slug in existing:
        slug = f"{base}-{n}"
        n += 1
    existing.add(slug)
    return slug


def ensure_categories():
    job_cats = {}
    for name in JOB_CATEGORIES:
        cat = JobCategory.query.filter_by(name=name).first()
        if not cat:
            cat = JobCategory(name=name, slug=name.lower().replace(" ", "-"), is_active=True)
            db.session.add(cat)
            db.session.flush()
        job_cats[name] = cat.id

    schol_cats = {}
    for name in SCHOLARSHIP_CATEGORIES:
        cat = ScholarshipCategory.query.filter_by(name=name).first()
        if not cat:
            cat = ScholarshipCategory(name=name, slug=name.lower().replace(" ", "-"), is_active=True)
            db.session.add(cat)
            db.session.flush()
        schol_cats[name] = cat.id
    return job_cats, schol_cats


def ensure_companies(existing_slugs):
    companies = []
    for name, industry, city, description, ctype, size in COMPANIES:
        company = Company.query.filter_by(name=name).first()
        if not company:
            company = Company(
                name=name,
                slug=slugify(name, existing_slugs),
                description=description,
                industry=industry,
                city=city,
                country="Rwanda",
                company_type=ctype,
                company_size=size,
                is_verified=False,
                is_featured=False,
                is_active=True,
            )
            db.session.add(company)
            db.session.flush()

            employer = User(
                email=f"hr.{company.slug}@afritechbridge.online",
                first_name=company.name.split()[0],
                last_name="Recruitment",
                role="employer",
                is_active=True,
                is_verified=True,
                email_verified_at=NOW(),
            )
            employer.set_password(secrets.token_urlsafe(24))
            db.session.add(employer)
            db.session.flush()
            db.session.add(
                EmployerProfile(
                    user_id=employer.id,
                    company_id=company.id,
                    job_title="Talent Acquisition",
                    hiring_authority=True,
                    work_email=employer.email,
                )
            )
        companies.append(company)
    return companies


def seed_jobs(job_cats, companies, existing_slugs):
    created = 0
    for (
        title, cat_name, company_idx, emp_type, level, loc_type, city,
        sal_min, sal_max, description, requirements, benefits,
    ) in JOBS:
        company = companies[company_idx]
        if Job.query.filter_by(title=title, company_id=company.id).first():
            continue
        employer_profile = EmployerProfile.query.filter_by(company_id=company.id).first()
        job = Job(
            company_id=company.id,
            category_id=job_cats[cat_name],
            posted_by=employer_profile.user_id if employer_profile else None,
            job_source="internal",
            title=title,
            slug=slugify(f"{title}-{company.name}", existing_slugs),
            description=description,
            summary=description.split("\n\n")[0][:280],
            employment_type=emp_type,
            experience_level=level,
            location_type=loc_type,
            city=city if loc_type != "remote" else None,
            country="Rwanda" if loc_type != "remote" else None,
            is_remote=loc_type == "remote",
            salary_min=sal_min,
            salary_max=sal_max,
            salary_currency="RWF",
            salary_period="monthly",
            show_salary=True,
            required_skills=json.dumps(requirements),
            preferred_skills=json.dumps(benefits),
            application_type="internal",
            application_deadline=NOW() + timedelta(days=30 + (created % 4) * 15),
            requires_resume=True,
            status="published",
            is_active=True,
            published_at=NOW(),
            expires_at=NOW() + timedelta(days=90),
        )
        if job.posted_by is None:
            print(f"  skipping {title!r}: no employer poster for {company.name}")
            continue
        db.session.add(job)
        created += 1
    return created


def seed_scholarships(schol_cats, existing_slugs, poster_user_id):
    created = 0
    for (
        title, cat_name_idx, stype, level, field, amt_min, amt_max,
        deadline_days, description, eligibility,
    ) in SCHOLARSHIPS:
        if Scholarship.query.filter_by(title=title).first():
            continue
        cat_name = SCHOLARSHIP_CATEGORIES[cat_name_idx]
        scholarship = Scholarship(
            category_id=schol_cats[cat_name],
            posted_by=poster_user_id,
            scholarship_source="internal",
            title=title,
            slug=slugify(title, existing_slugs),
            description=(
                description
                + "\n\n## Eligibility\n"
                + "\n".join(f"- {item}" for item in eligibility)
                + "\n\n## How to apply\n"
                "Create a free account on AfriTech Opportunities, complete your profile, "
                "and submit your application before the deadline. Uploaded documents stay "
                "confidential and are shared only with the selection committee."
            ),
            summary=description.split("\n\n")[0][:280],
            scholarship_type=stype,
            study_level=level,
            field_of_study=field,
            location_type="any",
            amount_min=amt_min,
            amount_max=amt_max,
            currency="USD",
            funding_type="partial" if amt_max < 5000 else "full",
            renewable=False,
            application_type="internal",
            application_deadline=NOW() + timedelta(days=deadline_days),
            requires_transcript=True,
            requires_recommendation_letters=True,
            requires_essay=True,
            status="published",
            is_active=True,
            published_at=NOW(),
        )
        db.session.add(scholarship)
        created += 1
    return created


def ensure_platform_poster(existing_slugs):
    """One verified platform account that posts scholarship listings."""
    user = User.query.filter_by(email="scholarships@afritechbridge.online").first()
    if not user:
        user = User(
            email="scholarships@afritechbridge.online",
            first_name="Scholarships",
            last_name="Desk",
            role="external_admin",
            is_active=True,
            is_verified=True,
            email_verified_at=NOW(),
        )
        user.set_password(secrets.token_urlsafe(24))
        db.session.add(user)
        db.session.flush()
    return user.id


def main():
    with app.app_context():
        existing_job_slugs = {j.slug for j in Job.query.with_entities(Job.slug).all()}
        existing_schol_slugs = {s.slug for s in Scholarship.query.with_entities(Scholarship.slug).all()}
        existing_company_slugs = {c.slug for c in Company.query.with_entities(Company.slug).all()}

        job_cats, schol_cats = ensure_categories()
        companies = ensure_companies(existing_company_slugs)
        poster_id = ensure_platform_poster(existing_job_slugs)

        jobs_created = seed_jobs(job_cats, companies, existing_job_slugs)
        scholarships_created = seed_scholarships(schol_cats, existing_schol_slugs, poster_id)

        db.session.commit()

        total_jobs = Job.query.filter_by(status="published", is_active=True).count()
        total_schol = Scholarship.query.filter_by(status="published", is_active=True).count()
        total_companies = Company.query.filter_by(is_active=True).count()
        print(
            f"seeded: {jobs_created} new jobs, {scholarships_created} new scholarships, "
            f"{len(companies)} companies ensured"
        )
        print(
            f"totals — published jobs: {total_jobs}, scholarships: {total_schol}, "
            f"active companies: {total_companies}"
        )


if __name__ == "__main__":
    main()
