"""Email template registry, mapping and rendering correctness.

The HTML files under ``src/templates`` are Mustache-style, but the three
notification paths each kept their own type→template map, and those maps
drifted: they named templates that were never registered
(``system_notification``, ``message_notification``), so every system/Career
Agent email was dropped with "Template ... not found" and, when a name did
resolve, the renderer left ``{{tag}}`` markup or ``{value}`` strays in the
body.

Run: cd backend && python -m pytest tests/test_email_templates.py -v
"""

from __future__ import annotations

import os
import sys
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.services.email_service import (  # noqa: E402
    EmailNotification,
    EmailPriority,
    EmailService,
    NotificationType,
)

# Every name the type→template maps in email_service, notification_scheduler
# and enhanced_notification are allowed to use. Anything outside this set
# must be registered in EmailService._load_templates first.
ALLOWED_TEMPLATE_NAMES = {
    "job_alert",
    "application_status",
    "message",
    "interview_reminder",
    "deadline_reminder",
    "company_update",
    "system",
    "promotion",
    "welcome",
    "password_reset",
    "weekly_digest",
}


class EmailTemplateRegistryTests(unittest.TestCase):
    def setUp(self):
        self.service = EmailService()

    def test_notification_type_maps_stay_inside_the_registry(self):
        self.assertTrue(ALLOWED_TEMPLATE_NAMES <= set(self.service.templates))
        # Retired names that used to be sent by the maps must not come back.
        self.assertNotIn("system_notification", self.service.templates)
        self.assertNotIn("message_notification", self.service.templates)

    def test_every_registered_template_renders_without_mustache_markup(self):
        # Each template must fully resolve when its declared variables are
        # present: no leftover {{tags}} and no section markers.
        for name, template in self.service.templates.items():
            variables = {key: f"v-{key}" for key in template.variables}
            for body in (template.html_body, template.text_body):
                rendered = self.service._render_template(body, variables)
                self.assertNotIn("{{", rendered, f"{name} left mustache markup")
                self.assertNotIn("}}", rendered, f"{name} left mustache markup")

    def test_career_agent_system_email_renders_for_the_completion_payload(self):
        # Shape mirrors orchestrator._notify_generation_result: title/icon/
        # action all present, no stats or profile blocks.
        notification = EmailNotification(
            recipient_email="seeker@example.com",
            recipient_name="Test Seeker",
            template_name="system",
            subject="Your CV and cover letter are ready",
            variables={
                "notification_title": "Your CV and cover letter are ready",
                "message": "Your Career Agent package is ready to review.",
                "icon": "📄",
                "notification_type": "Career Agent",
                "action_url": "https://example.test/jobseeker/career-agent?package_id=1",
                "action_text": "Review documents",
            },
            priority=EmailPriority.NORMAL,
        )
        with mock.patch.object(self.service, "_send_brevo_email", return_value=True) as send:
            self.assertTrue(self.service.send_notification_email(notification))
        payload = send.call_args.kwargs
        html = payload["html_body"]
        self.assertIn("Your CV and cover letter are ready", html)
        self.assertIn("Your Career Agent package is ready to review.", html)
        self.assertNotIn("{{", html)
        self.assertNotIn("{Your CV", html)
        # Falsy stats/completion sections must be gone, not left as tags.
        self.assertNotIn("#stats", html)
        self.assertNotIn("profile_completion", html)

    def test_unknown_template_name_falls_back_to_system(self):
        # Rows queued before the keys were normalized still carry the old
        # name; the email must render with the system template, not vanish.
        notification = EmailNotification(
            recipient_email="seeker@example.com",
            recipient_name="Test Seeker",
            template_name="system_notification",
            subject="Queued before the fix",
            variables={"title": "Queued before the fix", "message": "Still delivered."},
        )
        with mock.patch.object(self.service, "_send_brevo_email", return_value=True) as send:
            self.assertTrue(self.service.send_notification_email(notification))
        html = send.call_args.kwargs["html_body"]
        self.assertIn("Queued before the fix", html)
        self.assertNotIn("{{", html)

    def test_queue_path_variables_get_title_and_cta_aliases(self):
        # notification_scheduler passes title/message only; the system body
        # addresses {{notification_title}} and the CTA pair.
        notification = EmailNotification(
            recipient_email="seeker@example.com",
            recipient_name="Test Seeker",
            template_name="system",
            subject="Generic system notice",
            variables={"title": "Generic system notice", "message": "Body text."},
        )
        with mock.patch.object(self.service, "_send_brevo_email", return_value=True) as send:
            self.assertTrue(self.service.send_notification_email(notification))
        html = send.call_args.kwargs["html_body"]
        self.assertIn("Generic system notice", html)
        self.assertIn("Body text.", html)
        self.assertNotIn("{{", html)
        # The alias defaults the CTA to the notifications page.
        self.assertIn(self.service.frontend_url + "/notifications", html)


class EmailRenderTemplateTests(unittest.TestCase):
    def setUp(self):
        self.service = EmailService()

    def test_mustache_variables_substitute(self):
        rendered = self.service._render_template(
            "<h1>{{notification_title}}</h1>{{message}}",
            {"notification_title": "Ready", "message": "It compiled."},
        )
        self.assertEqual(rendered, "<h1>Ready</h1>It compiled.")

    def test_falsy_sections_are_removed_including_nested_tags(self):
        rendered = self.service._render_template(
            "<p>keep</p>{{#stats}}<b>{{applications_count}}</b>{{/stats}}",
            {},
        )
        self.assertEqual(rendered, "<p>keep</p>")

    def test_truthy_scalar_section_keeps_inner_content(self):
        rendered = self.service._render_template(
            "{{#profile_completion}}<i>{{percentage}}</i>{{/profile_completion}}",
            {"profile_completion": True, "percentage": 80},
        )
        self.assertEqual(rendered, "<i>80</i>")

    def test_list_sections_repeat_with_dot_substitution(self):
        rendered = self.service._render_template(
            "{{#sections}}<li>{{.}}</li>{{/sections}}",
            {"sections": ["Email address", "Phone number"]},
        )
        self.assertEqual(rendered, "<li>Email address</li><li>Phone number</li>")

    def test_nested_falsy_outer_section_drops_inner_sections(self):
        rendered = self.service._render_template(
            "{{#stats}}{{#weekly_stats}}<i>{{applications_count}}</i>{{/weekly_stats}}{{/stats}}done",
            {},
        )
        self.assertEqual(rendered, "done")

    def test_unknown_mustache_variables_render_empty(self):
        rendered = self.service._render_template("<a href='{{unsubscribe_url}}'>x</a>", {})
        self.assertEqual(rendered, "<a href=''>x</a>")

    def test_legacy_single_brace_placeholders_still_work(self):
        rendered = self.service._render_template(
            "Hello {user_name}, {known} and {unknown}",
            {"user_name": "Ada", "known": "yes"},
        )
        # Unknown single-brace placeholders keep their historical behaviour.
        self.assertEqual(rendered, "Hello Ada, yes and {unknown}")

    def test_css_braces_survive(self):
        rendered = self.service._render_template(
            '<div style="width: 100%; margin: 0 auto;">{{title}}</div>',
            {"title": "T"},
        )
        self.assertEqual(rendered, '<div style="width: 100%; margin: 0 auto;">T</div>')

    def test_dollar_placeholders_still_render(self):
        rendered = self.service._render_template("Hi $user_name", {"user_name": "Ada"})
        self.assertEqual(rendered, "Hi Ada")


if __name__ == "__main__":
    unittest.main()
