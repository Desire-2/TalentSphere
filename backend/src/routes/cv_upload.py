"""
CV upload, OCR extraction, AI parsing, and additive profile autofill routes.
"""
from datetime import date, datetime
import json
import logging
import os
import re
from typing import Any, Dict, List, Optional

import pdfplumber
import pytesseract
from PIL import Image, UnidentifiedImageError
from flask import Blueprint, jsonify, request

from src.models.user import JobSeekerProfile, db
from src.models.profile_extensions import (
    Award,
    Certification,
    Education,
    Language,
    ProfessionalMembership,
    Project,
    VolunteerExperience,
    WorkExperience,
)
from src.routes.auth import role_required, token_required
from src.routes.profile_extensions import _invalidate_complete_profile_cache

try:
    from google import genai
except ImportError:
    genai = None

try:
    from json_repair import repair_json
except ImportError:
    repair_json = None


cv_upload_bp = Blueprint('cv_upload', __name__)
logger = logging.getLogger(__name__)

MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {'.pdf', '.png', '.jpg', '.jpeg', '.tiff'}

GEMINI_SYSTEM_PROMPT = """
You are an expert resume parser for a professional job portal. Extract structured profile information from the provided CV/resume text and return ONLY a valid JSON object with no markdown, no explanation, no preamble.

Map extracted data to this exact JSON structure:

{
  "personal_info": {
    "first_name": "",
    "last_name": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin_url": "",
    "github_url": "",
    "portfolio_url": "",
    "website_url": ""
  },
  "professional_summary": {
    "summary": ""
  },
  "job_preferences": {
    "desired_job_title": "",
    "employment_type": "",
    "preferred_location": "",
    "salary_expectation": "",
    "availability": ""
  },
  "work_experience": [
    {
      "job_title": "",
      "company": "",
      "location": "",
      "start_date": "",
      "end_date": "",
      "is_current": false,
      "description": ""
    }
  ],
  "education": [
    {
      "degree": "",
      "field_of_study": "",
      "institution": "",
      "location": "",
      "start_date": "",
      "end_date": "",
      "gpa": "",
      "description": ""
    }
  ],
  "certifications": [
    {
      "name": "",
      "issuing_organization": "",
      "issue_date": "",
      "expiry_date": "",
      "credential_id": "",
      "credential_url": ""
    }
  ],
  "skills": {
    "technical_skills": [],
    "soft_skills": [],
    "languages_of_work": []
  },
  "projects": [
    {
      "name": "",
      "description": "",
      "technologies_used": "",
      "start_date": "",
      "end_date": "",
      "project_url": "",
      "github_url": ""
    }
  ],
  "awards": [
    {
      "title": "",
      "issuer": "",
      "date": "",
      "description": ""
    }
  ],
  "languages": [
    {
      "language": "",
      "proficiency": ""
    }
  ],
  "volunteer_experience": [
    {
      "role": "",
      "organization": "",
      "start_date": "",
      "end_date": "",
      "description": ""
    }
  ],
  "professional_memberships": [
    {
      "organization": "",
      "role": "",
      "start_date": "",
      "end_date": ""
    }
  ]
}

Rules:
- Return ONLY the JSON object, nothing else
- Use empty string "" for missing text fields
- Use empty array [] for missing list fields
- Use false for missing boolean fields
- Dates should be in YYYY-MM format when possible (e.g., "2022-06"), or YYYY if only year is available
- For is_current work experience: set to true if the role has no end date or says "Present"
- Extract ALL work experiences, education entries, certifications, projects found
- For skills, separate clearly technical (tools, languages, frameworks) from soft skills (communication, leadership)
- proficiency for languages should be one of: "Native", "Fluent", "Advanced", "Intermediate", "Basic"
""".strip()


def _normalize_text(raw_text: str) -> str:
    text = (raw_text or "").replace("\x00", " ")
    text = text.encode('utf-8', errors='ignore').decode('utf-8', errors='ignore')
    text = re.sub(r'\r\n?', '\n', text)
    text = re.sub(r'[\t\f\v]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {2,}', ' ', text)
    return text.strip()


def _extract_json_object(text: str) -> Optional[str]:
    if not text:
        return None

    cleaned = text.strip()
    if cleaned.startswith('{') and cleaned.endswith('}'):
        return cleaned

    code_block_match = re.search(r'```(?:json)?\s*(\{.*\})\s*```', cleaned, flags=re.DOTALL)
    if code_block_match:
        return code_block_match.group(1).strip()

    start = cleaned.find('{')
    end = cleaned.rfind('}')
    if start != -1 and end != -1 and end > start:
        return cleaned[start:end + 1].strip()

    return None


def _parse_model_json(response_text: str) -> Optional[Dict[str, Any]]:
    json_candidate = _extract_json_object(response_text) or response_text

    try:
        return json.loads(json_candidate)
    except json.JSONDecodeError:
        if repair_json is None:
            return None
        try:
            repaired = repair_json(json_candidate)
            return json.loads(repaired)
        except Exception:
            return None


def _response_to_text(response: Any) -> str:
    """Extract response text safely from different Gemini SDK response shapes."""
    try:
        text = getattr(response, 'text', None)
        if text:
            return str(text)
    except Exception:
        pass

    try:
        candidates = getattr(response, 'candidates', None) or []
        parts: List[str] = []
        for candidate in candidates:
            content = getattr(candidate, 'content', None)
            response_parts = getattr(content, 'parts', None) or []
            for part in response_parts:
                part_text = getattr(part, 'text', None)
                if part_text:
                    parts.append(str(part_text))
        if parts:
            return '\n'.join(parts)
    except Exception:
        pass

    return ''


def _truncate_for_parse(text: str, max_chars: int = 28000) -> str:
    """Trim very large OCR text to keep model output stable and JSON-complete."""
    if len(text) <= max_chars:
        return text
    head = text[: max_chars // 2]
    tail = text[-(max_chars // 2):]
    return f"{head}\n\n[...TRUNCATED FOR PARSING...]\n\n{tail}"


def _gemini_generate_json(client: Any, model_name: str, prompt: str) -> Any:
    """Attempt JSON-native generation first, then fallback to plain config."""
    base_config = {
        'temperature': 0.1,
        'max_output_tokens': 4096,
    }
    json_config = {
        **base_config,
        'response_mime_type': 'application/json',
    }

    try:
        return client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=json_config,
        )
    except TypeError:
        # Older SDK/runtime combinations may reject response_mime_type.
        return client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=base_config,
        )


def _parse_date(value: Any) -> Optional[date]:
    if not value:
        return None

    value_str = str(value).strip()
    if not value_str:
        return None

    lowered = value_str.lower()
    if lowered in {'present', 'current', 'now', 'ongoing'}:
        return None

    formats = ('%Y-%m-%d', '%Y-%m', '%Y')
    for fmt in formats:
        try:
            parsed = datetime.strptime(value_str, fmt)
            if fmt == '%Y':
                return date(parsed.year, 1, 1)
            if fmt == '%Y-%m':
                return date(parsed.year, parsed.month, 1)
            return parsed.date()
        except ValueError:
            continue

    return None


def _to_list(value: Any) -> List[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str):
        parts = [part.strip() for part in re.split(r',|\n|;', value)]
        return [part for part in parts if part]
    return []


def _normalize_proficiency(value: Any) -> str:
    mapping = {
        'native': 'Native',
        'fluent': 'Fluent',
        'advanced': 'Advanced',
        'intermediate': 'Intermediate',
        'basic': 'Basic',
    }
    normalized = str(value or '').strip().lower()
    return mapping.get(normalized, 'Intermediate')


def _safe_salary_to_int(value: Any) -> Optional[int]:
    if value is None:
        return None
    value_str = str(value)
    numbers = re.findall(r'\d+', value_str.replace(',', ''))
    if not numbers:
        return None
    try:
        return int(numbers[0])
    except ValueError:
        return None


def _is_blank(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, str):
        return not value.strip()
    return False


def _json_array_or_empty(value: Any) -> List[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str):
        value = value.strip()
        if not value:
            return []
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return [str(item).strip() for item in parsed if str(item).strip()]
        except Exception:
            return _to_list(value)
    return []


def _get_or_create_job_seeker_profile(current_user):
    profile = current_user.job_seeker_profile
    if not profile:
        profile = JobSeekerProfile(user_id=current_user.id)
        db.session.add(profile)
    return profile


def _extract_text_from_pdf(file_storage) -> Dict[str, Any]:
    pages_text: List[str] = []
    page_count = 0

    file_storage.stream.seek(0)
    with pdfplumber.open(file_storage.stream) as pdf:
        page_count = len(pdf.pages)
        for page in pdf.pages:
            page_text = page.extract_text() or ''
            if page_text.strip():
                pages_text.append(page_text)

    merged_text = _normalize_text('\n\n'.join(pages_text))
    return {
        'extracted_text': merged_text,
        'char_count': len(merged_text),
        'pages': page_count,
    }


def _extract_text_from_image(file_storage) -> Dict[str, Any]:
    file_storage.stream.seek(0)
    with Image.open(file_storage.stream) as image:
        extracted_text = pytesseract.image_to_string(image)

    normalized = _normalize_text(extracted_text)
    return {
        'extracted_text': normalized,
        'char_count': len(normalized),
        'pages': 1,
    }


def _parse_with_gemini(extracted_text: str, max_attempts: int = 2) -> Optional[Dict[str, Any]]:
    if genai is None:
        raise RuntimeError('Gemini SDK is not available on the server.')

    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        raise RuntimeError('GEMINI_API_KEY is not configured.')

    client = genai.Client(api_key=api_key)

    safe_text = _truncate_for_parse(extracted_text)
    model_candidates = [
        'gemini-2.5-flash-lite',
        'gemini-2.0-flash-exp',
        'gemini-1.5-flash',
    ]
    last_error = ''

    prompt = f"""{GEMINI_SYSTEM_PROMPT}

CV TEXT:
{safe_text}
"""

    for attempt in range(max_attempts):
        for model_name in model_candidates:
            try:
                response = _gemini_generate_json(client, model_name, prompt)
                response_text = _response_to_text(response)
                parsed_json = _parse_model_json(response_text)
                if parsed_json and isinstance(parsed_json, dict):
                    return parsed_json
                last_error = f"Model {model_name} returned unparsable response"
            except Exception as model_error:
                last_error = f"Model {model_name} failed: {str(model_error)}"
                continue

        # Retry with stricter instruction on the final fallback pass.
        if attempt == 0:
            prompt = (
                f"{GEMINI_SYSTEM_PROMPT}\n\n"
                "IMPORTANT: Return strictly valid JSON only. No markdown, no comments, no trailing commas.\n\n"
                f"CV TEXT:\n{safe_text}"
            )

    if last_error:
        logger.warning("CV parse failed after Gemini retries: %s", last_error)

    return None


@cv_upload_bp.route('/cv-extract', methods=['POST'])
@token_required
@role_required('job_seeker')
def cv_extract(current_user):
    try:
        uploaded = request.files.get('cv_file')
        if not uploaded:
            return jsonify({'error': 'cv_file is required.'}), 400

        if request.content_length and request.content_length > MAX_UPLOAD_SIZE_BYTES:
            return jsonify({'error': 'File size exceeds 10MB limit.'}), 413

        filename = (uploaded.filename or '').strip()
        if not filename:
            return jsonify({'error': 'File name is missing.'}), 400

        extension = os.path.splitext(filename)[1].lower()
        if extension not in ALLOWED_EXTENSIONS:
            return jsonify({'error': 'Unsupported file format. Use PDF, PNG, JPG, JPEG, or TIFF.'}), 400

        if extension == '.pdf':
            payload = _extract_text_from_pdf(uploaded)
        else:
            payload = _extract_text_from_image(uploaded)

        if not payload['extracted_text']:
            return jsonify({'error': 'No readable text found in the uploaded CV.'}), 422

        return jsonify(payload), 200
    except UnidentifiedImageError:
        return jsonify({'error': 'Could not read image file. Please upload a valid image.'}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to extract text from CV.', 'details': str(e)}), 500


@cv_upload_bp.route('/cv-parse', methods=['POST'])
@token_required
@role_required('job_seeker')
def cv_parse(current_user):
    try:
        data = request.get_json() or {}
        extracted_text = _normalize_text(data.get('extracted_text', ''))

        if not extracted_text:
            return jsonify({'error': 'extracted_text is required.'}), 400

        parsed_profile = _parse_with_gemini(extracted_text, max_attempts=2)
        if not parsed_profile:
            return jsonify({'error': 'Could not parse CV into valid profile JSON. Please review extracted text and try again.'}), 422

        return jsonify({
            'parsed_profile': parsed_profile,
            'confidence_note': 'Extracted from CV via Gemini AI',
        }), 200
    except RuntimeError as e:
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        error_text = str(e)
        upper_error = error_text.upper()
        if '429' in error_text or 'RESOURCE_EXHAUSTED' in upper_error:
            return jsonify({'error': 'Gemini rate limit reached. Please wait and try again.'}), 429
        if '401' in error_text or '403' in error_text or 'API_KEY' in upper_error:
            return jsonify({'error': 'Gemini API authentication failed. Please check server GEMINI_API_KEY.'}), 500
        return jsonify({'error': 'Could not parse CV. Please fill manually.', 'details': error_text}), 422


@cv_upload_bp.route('/cv-autofill', methods=['POST'])
@token_required
@role_required('job_seeker')
def cv_autofill(current_user):
    try:
        body = request.get_json() or {}
        parsed_profile = body.get('parsed_profile', body)

        if not isinstance(parsed_profile, dict):
            return jsonify({'error': 'parsed_profile JSON object is required.'}), 400

        filled_sections: List[str] = []
        skipped_sections: List[str] = []

        personal_info = parsed_profile.get('personal_info') or {}
        profile = _get_or_create_job_seeker_profile(current_user)

        personal_changed = False
        for field_name, target in (
            ('first_name', 'first_name'),
            ('last_name', 'last_name'),
            ('email', 'email'),
            ('phone', 'phone'),
            ('location', 'location'),
        ):
            value = (personal_info.get(field_name) or '').strip()
            existing = getattr(current_user, target, None)
            if value and _is_blank(existing):
                setattr(current_user, target, value)
                personal_changed = True

        for field_name, target in (
            ('linkedin_url', 'linkedin_url'),
            ('github_url', 'github_url'),
            ('portfolio_url', 'portfolio_url'),
            ('website_url', 'website_url'),
        ):
            value = (personal_info.get(field_name) or '').strip()
            existing = getattr(profile, target, None)
            if value and _is_blank(existing):
                setattr(profile, target, value)
                personal_changed = True

        if personal_changed:
            filled_sections.append('personal_info')
        else:
            skipped_sections.append('personal_info')

        summary_obj = parsed_profile.get('professional_summary') or {}
        job_pref = parsed_profile.get('job_preferences') or {}
        skills_obj = parsed_profile.get('skills') or {}

        profile_changed = False
        summary_text = (summary_obj.get('summary') or '').strip()
        if summary_text:
            profile.professional_summary = summary_text
            profile_changed = True

        desired_title = (job_pref.get('desired_job_title') or '').strip()
        if desired_title and _is_blank(profile.desired_position):
            profile.desired_position = desired_title
            if _is_blank(profile.professional_title):
                profile.professional_title = desired_title
            profile_changed = True

        employment_type = (job_pref.get('employment_type') or '').strip()
        if employment_type and _is_blank(profile.job_type_preference):
            profile.job_type_preference = employment_type
            existing_job_types = _json_array_or_empty(profile.job_types)
            merged_job_types = sorted(set(existing_job_types + [employment_type]))
            profile.job_types = json.dumps(merged_job_types)
            profile_changed = True

        preferred_location = (job_pref.get('preferred_location') or '').strip()
        if preferred_location and _is_blank(profile.preferred_location):
            profile.preferred_location = preferred_location
            existing_pref_locations = _json_array_or_empty(profile.preferred_locations)
            merged_locations = sorted(set(existing_pref_locations + [preferred_location]))
            profile.preferred_locations = json.dumps(merged_locations)
            profile_changed = True

        availability = (job_pref.get('availability') or '').strip()
        if availability and _is_blank(profile.availability):
            profile.availability = availability
            if _is_blank(profile.notice_period):
                profile.notice_period = availability
            profile_changed = True

        salary_int = _safe_salary_to_int(job_pref.get('salary_expectation'))
        if salary_int is not None and profile.expected_salary is None:
            profile.expected_salary = salary_int
            profile_changed = True

        technical_skills = _to_list(skills_obj.get('technical_skills'))
        soft_skills = _to_list(skills_obj.get('soft_skills'))
        languages_of_work = _to_list(skills_obj.get('languages_of_work'))

        existing_technical = _json_array_or_empty(profile.technical_skills)
        existing_soft = _json_array_or_empty(profile.soft_skills)
        existing_all_skills = _json_array_or_empty(profile.skills)

        merged_technical = sorted(set(existing_technical + technical_skills))
        merged_soft = sorted(set(existing_soft + soft_skills))
        merged_all_skills = sorted(set(existing_all_skills + technical_skills + soft_skills + languages_of_work))

        if merged_technical != existing_technical:
            profile.technical_skills = json.dumps(merged_technical)
            profile_changed = True
        if merged_soft != existing_soft:
            profile.soft_skills = json.dumps(merged_soft)
            profile_changed = True

        if merged_all_skills != existing_all_skills:
            profile.skills = json.dumps(merged_all_skills)
            profile_changed = True

        if profile_changed:
            filled_sections.extend(['professional_summary', 'job_preferences', 'skills'])
        else:
            skipped_sections.extend(['professional_summary', 'job_preferences', 'skills'])

        experiences = parsed_profile.get('work_experience') or []
        created_experience = 0
        for item in experiences:
            if not isinstance(item, dict):
                continue

            job_title = (item.get('job_title') or '').strip()
            company = (item.get('company') or '').strip()
            start = _parse_date(item.get('start_date'))
            if not (job_title and company and start):
                continue

            is_current = bool(item.get('is_current')) or str(item.get('end_date', '')).strip().lower() in {'present', 'current', 'now'}
            work = WorkExperience(
                user_id=current_user.id,
                job_title=job_title,
                company_name=company,
                company_location=(item.get('location') or '').strip() or None,
                start_date=start,
                end_date=None if is_current else _parse_date(item.get('end_date')),
                is_current=is_current,
                description=(item.get('description') or '').strip() or None,
            )
            db.session.add(work)
            created_experience += 1

        if created_experience:
            filled_sections.append('work_experience')
        else:
            skipped_sections.append('work_experience')

        education_entries = parsed_profile.get('education') or []
        created_education = 0
        for item in education_entries:
            if not isinstance(item, dict):
                continue

            institution = (item.get('institution') or '').strip()
            if not institution:
                continue

            gpa_value = None
            gpa_raw = str(item.get('gpa') or '').strip()
            if gpa_raw:
                try:
                    gpa_value = float(gpa_raw)
                except ValueError:
                    gpa_value = None

            edu = Education(
                user_id=current_user.id,
                institution_name=institution,
                institution_location=(item.get('location') or '').strip() or None,
                degree_title=(item.get('degree') or '').strip() or None,
                field_of_study=(item.get('field_of_study') or '').strip() or None,
                start_date=_parse_date(item.get('start_date')),
                end_date=_parse_date(item.get('end_date')),
                graduation_date=_parse_date(item.get('end_date')),
                gpa=gpa_value,
                description=(item.get('description') or '').strip() or None,
            )
            db.session.add(edu)
            created_education += 1

        if created_education:
            filled_sections.append('education')
        else:
            skipped_sections.append('education')

        cert_entries = parsed_profile.get('certifications') or []
        created_certifications = 0
        for item in cert_entries:
            if not isinstance(item, dict):
                continue

            name = (item.get('name') or '').strip()
            org = (item.get('issuing_organization') or '').strip()
            if not (name and org):
                continue

            cert = Certification(
                user_id=current_user.id,
                name=name,
                issuing_organization=org,
                issue_date=_parse_date(item.get('issue_date')),
                expiry_date=_parse_date(item.get('expiry_date')),
                credential_id=(item.get('credential_id') or '').strip() or None,
                credential_url=(item.get('credential_url') or '').strip() or None,
            )
            db.session.add(cert)
            created_certifications += 1

        if created_certifications:
            filled_sections.append('certifications')
        else:
            skipped_sections.append('certifications')

        project_entries = parsed_profile.get('projects') or []
        created_projects = 0
        for item in project_entries:
            if not isinstance(item, dict):
                continue

            name = (item.get('name') or '').strip()
            description = (item.get('description') or '').strip()
            if not (name and description):
                continue

            project = Project(
                user_id=current_user.id,
                name=name,
                description=description,
                project_url=(item.get('project_url') or '').strip() or None,
                github_url=(item.get('github_url') or '').strip() or None,
                start_date=_parse_date(item.get('start_date')),
                end_date=_parse_date(item.get('end_date')),
                technologies_used=json.dumps(_to_list(item.get('technologies_used'))),
            )
            db.session.add(project)
            created_projects += 1

        if created_projects:
            filled_sections.append('projects')
        else:
            skipped_sections.append('projects')

        award_entries = parsed_profile.get('awards') or []
        created_awards = 0
        for item in award_entries:
            if not isinstance(item, dict):
                continue

            title = (item.get('title') or '').strip()
            issuer = (item.get('issuer') or '').strip()
            if not (title and issuer):
                continue

            award = Award(
                user_id=current_user.id,
                title=title,
                issuer=issuer,
                date_received=_parse_date(item.get('date')),
                description=(item.get('description') or '').strip() or None,
            )
            db.session.add(award)
            created_awards += 1

        if created_awards:
            filled_sections.append('awards')
        else:
            skipped_sections.append('awards')

        language_entries = parsed_profile.get('languages') or []
        created_languages = 0
        for item in language_entries:
            if not isinstance(item, dict):
                continue

            language_name = (item.get('language') or '').strip()
            if not language_name:
                continue

            language = Language(
                user_id=current_user.id,
                language=language_name,
                proficiency_level=_normalize_proficiency(item.get('proficiency')),
            )
            db.session.add(language)
            created_languages += 1

        if created_languages:
            filled_sections.append('languages')
        else:
            skipped_sections.append('languages')

        volunteer_entries = parsed_profile.get('volunteer_experience') or []
        created_volunteer = 0
        for item in volunteer_entries:
            if not isinstance(item, dict):
                continue

            organization = (item.get('organization') or '').strip()
            role = (item.get('role') or '').strip()
            if not (organization and role):
                continue

            volunteer = VolunteerExperience(
                user_id=current_user.id,
                organization=organization,
                role=role,
                start_date=_parse_date(item.get('start_date')),
                end_date=_parse_date(item.get('end_date')),
                description=(item.get('description') or '').strip() or None,
                is_current=str(item.get('end_date', '')).strip().lower() in {'present', 'current', 'now'},
            )
            db.session.add(volunteer)
            created_volunteer += 1

        if created_volunteer:
            filled_sections.append('volunteer_experience')
        else:
            skipped_sections.append('volunteer_experience')

        membership_entries = parsed_profile.get('professional_memberships') or []
        created_memberships = 0
        for item in membership_entries:
            if not isinstance(item, dict):
                continue

            organization = (item.get('organization') or '').strip()
            if not organization:
                continue

            membership = ProfessionalMembership(
                user_id=current_user.id,
                organization_name=organization,
                membership_type=(item.get('role') or '').strip() or None,
                start_date=_parse_date(item.get('start_date')),
                end_date=_parse_date(item.get('end_date')),
                is_current=str(item.get('end_date', '')).strip().lower() in {'', 'present', 'current', 'now'},
            )
            db.session.add(membership)
            created_memberships += 1

        if created_memberships:
            filled_sections.append('professional_memberships')
        else:
            skipped_sections.append('professional_memberships')

        current_user.updated_at = datetime.utcnow()
        profile.updated_at = datetime.utcnow()
        db.session.commit()
        _invalidate_complete_profile_cache(current_user.id)

        unique_filled = sorted(set(filled_sections))
        unique_skipped = sorted(set(skipped_sections) - set(unique_filled))

        return jsonify({
            'success': True,
            'filled_sections': unique_filled,
            'skipped_sections': unique_skipped,
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to auto-fill profile from CV.', 'details': str(e)}), 500
