"""Document template registry, generation enforcement, and export design lock.

The template registry (``templates.py``) is the single source of truth for
CV and cover-letter designs. These tests pin the guarantees the product
depends on:

- generation refuses to start until a registered template is selected,
- every registered design renders (CV and cover letter alike),
- exports render only the design stored on the document — a request can
  never inject a different design at download time,
- switching the template in the editor re-fills the same content into the
  new design without touching that content.

Run: cd backend && python -m pytest tests/test_document_templates.py -v
"""

from __future__ import annotations

import json
import os
import sys
import unittest
import uuid

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Bind to a dedicated database only when no other suite has claimed the
# engine yet; importing src.main initializes the engine at import time.
if "DATABASE_URL" not in os.environ:
    _TEST_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".document_templates_test.db")
    try:
        os.remove(_TEST_DB_PATH)
    except OSError:
        pass
    os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB_PATH}?timeout=30"
os.environ.setdefault("ENABLE_CLEANUP_SERVICE", "false")

from src.main import app  # noqa: E402
from src.services.career_agent.export import CareerDocumentRenderer  # noqa: E402
from src.services.career_agent.templates import (  # noqa: E402
    DEFAULT_TEMPLATE_KEY,
    TEMPLATE_CATALOG,
    TEMPLATE_KEYS,
    get_template,
    is_valid_template,
    template_catalog_payload,
    template_default_accent,
)

from test_career_agent import CareerAgentTestBase, _cv_content  # noqa: E402


class TemplateRegistryTests(unittest.TestCase):
    def test_catalog_covers_ten_registered_designs(self):
        self.assertEqual(len(TEMPLATE_CATALOG), 10)
        self.assertEqual(TEMPLATE_KEYS, set(TEMPLATE_CATALOG))
        self.assertIn(DEFAULT_TEMPLATE_KEY, TEMPLATE_CATALOG)

    def test_document_generation_reexports_the_same_keys(self):
        from src.services.career_agent.document_generation import TEMPLATE_KEYS as REEXPORTED

        self.assertEqual(REEXPORTED, TEMPLATE_KEYS)

    def test_every_design_has_css_and_a_hex_default_accent(self):
        for key, design in TEMPLATE_CATALOG.items():
            with self.subTest(template=key):
                self.assertTrue(design.css.strip(), f"{key} has no design CSS")
                self.assertTrue(design.label and design.hint and design.description)
                self.assertRegex(design.default_accent, r"^#[0-9A-Fa-f]{3,8}$")

    def test_unknown_template_resolves_to_the_default(self):
        self.assertIs(get_template(None), TEMPLATE_CATALOG[DEFAULT_TEMPLATE_KEY])
        self.assertIs(get_template("not_a_template"), TEMPLATE_CATALOG[DEFAULT_TEMPLATE_KEY])
        self.assertTrue(is_valid_template("executive"))
        self.assertFalse(is_valid_template(""))
        self.assertFalse(is_valid_template("bogus"))
        self.assertEqual(template_default_accent("executive"), "#1E3A5F")

    def test_exactly_the_documented_designs_are_grayscale(self):
        grayscale = {key for key, design in TEMPLATE_CATALOG.items() if design.grayscale}
        self.assertEqual(grayscale, {"ats_safe", "minimal"})

    def test_catalog_payload_exposes_public_metadata(self):
        payload = template_catalog_payload()
        self.assertEqual(len(payload), len(TEMPLATE_CATALOG))
        for entry in payload:
            self.assertIn("key", entry)
            self.assertIn("label", entry)
            self.assertIn("hint", entry)
            self.assertIn("description", entry)
            self.assertIn("default_accent", entry)
            self.assertIn("grayscale", entry)
            # The public payload never ships raw CSS.
            self.assertNotIn("css", entry)


class RendererDesignTests(unittest.TestCase):
    def setUp(self):
        self.renderer = CareerDocumentRenderer()
        self.content = _cv_content()

    def _html(self, settings, document_type="CV", content=None):
        return self.renderer._html(document_type, content if content is not None else self.content, settings)

    def test_html_embeds_the_selected_registered_design(self):
        html = self._html({"template_key": "executive", "accent_color": "#0F766E"})
        self.assertIn("tpl-executive", html)
        self.assertIn("Georgia", html)
        # The design's own palette wins over the document accent request.
        self.assertIn("--doc-accent: #1E3A5F", html)
        self.assertNotIn("tpl-modern_professional", html)

    def test_unknown_template_key_renders_the_default_design(self):
        html = self._html({"template_key": "bogus_key"})
        self.assertIn(f"tpl-{DEFAULT_TEMPLATE_KEY}", html)

    def test_grayscale_designs_neutralize_the_accent(self):
        html = self._html({"template_key": "ats_safe", "accent_color": "#FF0000"})
        self.assertIn("--doc-accent: #1a1a1a", html)
        self.assertNotIn("#FF0000", html)

    def test_accent_must_be_a_hex_literal(self):
        html = self._html({"template_key": "modern_professional", "accent_color": "red; } body { display: none;"})
        self.assertIn("--doc-accent: #0F766E", html)
        self.assertNotIn("display: none", html)

    def test_cover_letter_renders_the_same_design_as_the_cv(self):
        letter = {"header": {"name": "Test Candidate"}, "recipient": {"company": "Acme"}, "body": {"paragraphs": [{"text": "Hello"}]}}
        html = self._html({"template_key": "creative_professional"}, document_type="COVER_LETTER", content=letter)
        self.assertIn("tpl-creative_professional", html)
        self.assertIn("border-left: 5px solid var(--doc-accent)", html)

    def test_every_registered_design_renders_for_cv_and_letter(self):
        letter = {"header": {"name": "Test Candidate"}, "recipient": {}, "body": {"paragraphs": []}}
        for key in TEMPLATE_KEYS:
            with self.subTest(template=key):
                cv_html = self._html({"template_key": key})
                self.assertIn(f"tpl-{key}", cv_html)
                self.assertIn(get_template(key).css.strip().splitlines()[0], cv_html)
                letter_html = self._html({"template_key": key}, document_type="COVER_LETTER", content=letter)
                self.assertIn(f"tpl-{key}", letter_html)


class GenerationTemplateEnforcementTests(CareerAgentTestBase):
    def _payload(self, **overrides):
        payload = {
            "target_job": {"title": "Backend Engineer", "description": "Python role"},
            "idempotency_key": f"tpl-{uuid.uuid4().hex[:12]}",
        }
        payload.update(overrides)
        return payload

    def _post(self, payload):
        return self.client.post(
            "/api/career-agent/generate",
            headers={**self.auth, "Content-Type": "application/json"},
            data=json.dumps(payload),
        )

    def test_generation_requires_a_template_selection(self):
        response = self._post(self._payload())
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["code"], "TEMPLATE_REQUIRED")

    def test_generation_rejects_an_unregistered_template(self):
        response = self._post(self._payload(template_key="rainbow_resume"))
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["code"], "TEMPLATE_INVALID")

    def test_templates_endpoint_lists_the_registered_catalog(self):
        response = self.client.get("/api/career-agent/templates")
        self.assertEqual(response.status_code, 200)
        templates = response.get_json()["templates"]
        self.assertEqual({item["key"] for item in templates}, TEMPLATE_KEYS)
        self.assertEqual(len(templates), len(TEMPLATE_CATALOG))


class ExportDesignLockTests(CareerAgentTestBase):
    def _document_settings(self, document_id):
        with self.app.app_context():
            from src.models.career_agent import CareerDocument

            document = CareerDocument.query.get(document_id)
            return document.get_settings(), document.get_content()

    def test_export_request_cannot_override_the_stored_design(self):
        _package_id, cv_id, _letter_id = self._make_completed_package(self.user_id)
        updated = self.client.put(
            f"/api/career-agent/documents/{cv_id}",
            headers={**self.auth, "Content-Type": "application/json"},
            data=json.dumps({"settings": {"template_key": "executive", "document_mode": "ats_safe", "accent_color": "#1E3A5F"}}),
        )
        self.assertEqual(updated.status_code, 200)

        # Try to smuggle a different design into the download itself.
        response = self.client.post(
            f"/api/career-agent/documents/{cv_id}/export?format=txt&template_key=minimal&accent_color=%23FF0000",
            headers={**self.auth, "Content-Type": "application/json"},
            data=json.dumps({"template_key": "minimal", "settings": {"template_key": "minimal", "accent_color": "#FF0000"}}),
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data)

        settings, _content = self._document_settings(cv_id)
        self.assertEqual(settings.get("template_key"), "executive")
        self.assertEqual(settings.get("accent_color"), "#1E3A5F")

    def test_stored_settings_drive_the_rendered_design_after_export_attempts(self):
        _package_id, cv_id, _letter_id = self._make_completed_package(self.user_id)
        self.client.put(
            f"/api/career-agent/documents/{cv_id}",
            headers={**self.auth, "Content-Type": "application/json"},
            data=json.dumps({"settings": {"template_key": "technical", "document_mode": "ats_safe", "accent_color": "#2563A6"}}),
        )
        self.client.post(
            f"/api/career-agent/documents/{cv_id}/export?format=txt",
            headers={**self.auth, "Content-Type": "application/json"},
            data=json.dumps({"template_key": "minimal"}),
        )
        settings, content = self._document_settings(cv_id)
        html = CareerDocumentRenderer()._html("CV", content, settings)
        self.assertIn("tpl-technical", html)
        self.assertIn("Courier New", html)

    def test_settings_reject_an_unregistered_template(self):
        _package_id, cv_id, _letter_id = self._make_completed_package(self.user_id)
        response = self.client.put(
            f"/api/career-agent/documents/{cv_id}",
            headers={**self.auth, "Content-Type": "application/json"},
            data=json.dumps({"settings": {"template_key": "bogus_design"}}),
        )
        self.assertEqual(response.status_code, 400)
        settings, _content = self._document_settings(cv_id)
        self.assertNotEqual(settings.get("template_key"), "bogus_design")

    def test_switching_template_auto_fills_the_same_content(self):
        _package_id, cv_id, _letter_id = self._make_completed_package(self.user_id)
        before_settings, before_content = self._document_settings(cv_id)

        response = self.client.put(
            f"/api/career-agent/documents/{cv_id}",
            headers={**self.auth, "Content-Type": "application/json"},
            data=json.dumps({"settings": {"template_key": "academic_research", "document_mode": "ats_safe", "accent_color": "#8A3346"}}),
        )
        self.assertEqual(response.status_code, 200)

        fetched = self.client.get(f"/api/career-agent/documents/{cv_id}", headers=self.auth).get_json()
        self.assertEqual(fetched["settings"]["template_key"], "academic_research")
        self.assertEqual(fetched["template_key"], "academic_research")
        # Content is untouched: only the design changes.
        self.assertEqual(fetched["content"], before_content)
        self.assertNotEqual(fetched["settings"].get("template_key"), before_settings.get("template_key"))

        after_settings, after_content = self._document_settings(cv_id)
        self.assertEqual(after_settings.get("template_key"), "academic_research")
        self.assertEqual(after_content, before_content)

        # The next export renders the newly stored design, still from content.
        html = CareerDocumentRenderer()._html("CV", after_content, after_settings)
        self.assertIn("tpl-academic_research", html)
        self.assertIn("Cambria", html)


if __name__ == "__main__":
    unittest.main()
