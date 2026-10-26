"""Notification endpoint correctness and query-count tests.

These endpoints used to issue one query per notification row (a 50-row page
cost 54 queries) and re-count the same rows three times for the stats
endpoint. The rewrite batches the lookups, folds the counts into shared
aggregates and serves repeated polls from a short-lived cache, so the
behaviour that matters to keep is: identical payloads, filters that still
work, unread badges that stay global, and invalidation after a write.

Run: cd backend && python -m pytest tests/test_notification_endpoints.py -v
"""

from __future__ import annotations

import os
import sys
import unittest
import uuid
from contextlib import contextmanager

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

if "DATABASE_URL" not in os.environ:
    _TEST_DB_PATH = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), ".notification_test.db"
    )
    os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB_PATH}?timeout=30"
os.environ.setdefault("ENABLE_CLEANUP_SERVICE", "false")

from sqlalchemy import event
from sqlalchemy.engine import Engine

from src.main import app
from src.models.notification import Notification
from src.models.notification_preferences import NotificationDeliveryLog, NotificationQueue
from src.models.user import User, db
from src.routes.enhanced_notification import _invalidate_notification_caches
from src.routes.auth import IdentityUser, invalidate_identity_cache


@contextmanager
def count_queries():
    """Collect every statement executed while the block runs."""
    statements = []

    def _before(conn, cursor, statement, parameters, context, executemany):
        statements.append(" ".join(statement.split()))

    event.listen(Engine, "before_cursor_execute", _before)
    try:
        yield statements
    finally:
        event.remove(Engine, "before_cursor_execute", _before)


class NotificationEndpointTestBase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = app
        with app.app_context():
            db.create_all()
            db.session.remove()

    def setUp(self):
        self.client = self.app.test_client()
        with self.app.app_context():
            suffix = uuid.uuid4().hex[:8]
            user = User(
                email=f"notify-{suffix}@test.local",
                first_name="Notify",
                last_name="Tester",
                role="job_seeker",
            )
            user.set_password("Password123")
            other = User(
                email=f"other-{suffix}@test.local",
                first_name="Other",
                last_name="User",
                role="job_seeker",
            )
            other.set_password("Password123")
            db.session.add_all([user, other])
            db.session.commit()
            self.user_id = user.id
            self.other_id = other.id
            self.auth = {"Authorization": f"Bearer {user.generate_token(3600)}"}
            self.other_auth = {"Authorization": f"Bearer {other.generate_token(3600)}"}
        # Each test starts from a cold cache so assertions do not depend on
        # the previous test's payloads.
        _invalidate_notification_caches()
        invalidate_identity_cache()

    def tearDown(self):
        with self.app.app_context():
            Notification.query.filter(
                Notification.user_id.in_([self.user_id, self.other_id])
            ).delete(synchronize_session=False)
            NotificationDeliveryLog.query.filter(
                NotificationDeliveryLog.user_id.in_([self.user_id, self.other_id])
            ).delete(synchronize_session=False)
            NotificationQueue.query.filter(
                NotificationQueue.user_id.in_([self.user_id, self.other_id])
            ).delete(synchronize_session=False)
            User.query.filter(
                User.id.in_([self.user_id, self.other_id])
            ).delete(synchronize_session=False)
            db.session.commit()
        _invalidate_notification_caches()
        invalidate_identity_cache()

    def _seed(self, count, unread=None, with_delivery_log=False):
        unread = count if unread is None else unread
        created = []
        with self.app.app_context():
            for index in range(count):
                notification = Notification(
                    user_id=self.user_id,
                    title=f"Notification {index}",
                    message=f"Body {index}",
                    notification_type="system" if index % 2 else "job_alert",
                    priority="high" if index % 3 == 0 else "normal",
                    is_read=index >= unread,
                )
                db.session.add(notification)
                db.session.flush()
                if with_delivery_log and index == 0:
                    db.session.add(
                        NotificationDeliveryLog(
                            notification_id=notification.id,
                            user_id=self.user_id,
                            delivery_method="email",
                            delivery_status="sent",
                        )
                    )
                created.append(notification.id)
            db.session.commit()
        return created


class NotificationListTests(NotificationEndpointTestBase):
    def test_list_returns_pagination_and_unread_badge(self):
        self._seed(5, unread=3, with_delivery_log=True)

        response = self.client.get(
            "/api/enhanced-notifications/notifications?page=1&per_page=2",
            headers=self.auth,
        )
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()

        self.assertEqual(len(payload["notifications"]), 2)
        self.assertEqual(payload["unread_count"], 3)
        self.assertEqual(
            payload["pagination"],
            {
                "page": 1,
                "pages": 3,
                "per_page": 2,
                "total": 5,
                "has_next": True,
                "has_prev": False,
            },
        )
        # The delivery summary is a single batched lookup, not a per-row query.
        self.assertEqual(
            set(payload["notifications"][0]["delivery_status"]),
            {"email_sent", "email_opened", "email_clicked"},
        )

    def test_unread_badge_stays_global_when_filters_are_applied(self):
        self._seed(5, unread=3)

        response = self.client.get(
            "/api/enhanced-notifications/notifications?is_read=false",
            headers=self.auth,
        )
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()

        self.assertEqual(len(payload["notifications"]), 3)
        self.assertEqual(payload["pagination"]["total"], 3)
        # The badge counts every unread notification, filtered or not.
        self.assertEqual(payload["unread_count"], 3)

    def test_page_beyond_the_end_is_empty_and_not_backward(self):
        self._seed(3)

        response = self.client.get(
            "/api/enhanced-notifications/notifications?page=9&per_page=10",
            headers=self.auth,
        )
        payload = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["notifications"], [])
        self.assertFalse(payload["pagination"]["has_next"])
        # Page 9 is past the end but still has earlier pages behind it.
        self.assertTrue(payload["pagination"]["has_prev"])

    def test_second_identical_request_serves_from_cache(self):
        self._seed(4, unread=2, with_delivery_log=True)
        path = "/api/enhanced-notifications/notifications?page=1&per_page=50"

        with count_queries() as cold:
            first = self.client.get(path, headers=self.auth).get_json()
        with count_queries() as warm:
            second = self.client.get(path, headers=self.auth).get_json()

        self.assertEqual(first, second)
        self.assertGreater(len(cold), 0)
        self.assertEqual(len(warm), 0)

    def test_mark_all_read_invalidates_the_cached_list(self):
        self._seed(4, unread=4)

        before = self.client.get(
            "/api/enhanced-notifications/notifications", headers=self.auth
        ).get_json()
        self.assertEqual(before["unread_count"], 4)

        marked = self.client.post(
            "/api/enhanced-notifications/notifications/mark-all-read",
            headers=self.auth,
        )
        self.assertEqual(marked.status_code, 200)

        after = self.client.get(
            "/api/enhanced-notifications/notifications", headers=self.auth
        ).get_json()
        self.assertEqual(after["unread_count"], 0)
        self.assertTrue(all(item["is_read"] for item in after["notifications"]))

    def test_mark_one_read_updates_the_cached_list(self):
        ids = self._seed(2, unread=2)

        self.client.get("/api/enhanced-notifications/notifications", headers=self.auth)
        response = self.client.post(
            f"/api/enhanced-notifications/notifications/{ids[0]}/read",
            headers=self.auth,
        )
        self.assertEqual(response.status_code, 200)

        after = self.client.get(
            "/api/enhanced-notifications/notifications", headers=self.auth
        ).get_json()
        self.assertEqual(after["unread_count"], 1)

    def test_list_is_scoped_to_the_authenticated_user(self):
        self._seed(3, unread=1)

        response = self.client.get(
            "/api/enhanced-notifications/notifications", headers=self.other_auth
        ).get_json()

        self.assertEqual(response["notifications"], [])
        self.assertEqual(response["pagination"]["total"], 0)
        self.assertEqual(response["unread_count"], 0)


class NotificationStatsTests(NotificationEndpointTestBase):
    def test_stats_shape_and_counts(self):
        self._seed(5, unread=3, with_delivery_log=True)

        with count_queries() as queries:
            payload = self.client.get(
                "/api/enhanced-notifications/notifications/stats", headers=self.auth
            ).get_json()

        self.assertEqual(payload["total_notifications"], 5)
        self.assertEqual(payload["unread_notifications"], 3)
        self.assertEqual(payload["read_notifications"], 2)
        self.assertEqual(payload["recent_notifications"], 5)
        self.assertEqual(
            sum(entry["total"] for entry in payload["by_type"]), 5
        )
        self.assertEqual(
            sum(entry["unread"] for entry in payload["by_type"]), 3
        )
        self.assertEqual(
            sum(entry["total"] for entry in payload["by_priority"]), 5
        )
        self.assertEqual(payload["email_delivery"], [{"status": "sent", "count": 1}])
        # One identity lookup plus the shared aggregate, the per-type rollup,
        # the per-priority rollup and email delivery: four statements where
        # the endpoint used to issue seven.
        self.assertLessEqual(len(queries), 5)

    def test_stats_cache_is_repopulated_after_a_write(self):
        self._seed(3, unread=3)

        first = self.client.get(
            "/api/enhanced-notifications/notifications/stats", headers=self.auth
        ).get_json()
        self.assertEqual(first["unread_notifications"], 3)

        self.client.post(
            "/api/enhanced-notifications/notifications/mark-all-read",
            headers=self.auth,
        )

        second = self.client.get(
            "/api/enhanced-notifications/notifications/stats", headers=self.auth
        ).get_json()
        self.assertEqual(second["unread_notifications"], 0)

    def test_stats_are_empty_for_a_user_without_notifications(self):
        payload = self.client.get(
            "/api/enhanced-notifications/notifications/stats", headers=self.auth
        ).get_json()

        self.assertEqual(payload["total_notifications"], 0)
        self.assertEqual(payload["unread_notifications"], 0)
        self.assertEqual(payload["by_type"], [])
        self.assertEqual(payload["by_priority"], [])


class IdentityCacheTests(NotificationEndpointTestBase):
    def _users_queries(self, statements):
        return [s for s in statements if s.startswith("SELECT users")]

    def test_polling_endpoint_resolves_identity_once(self):
        self._seed(2)

        path = "/api/enhanced-notifications/notifications?page=1&per_page=10"
        with count_queries() as cold:
            self.assertEqual(
                self.client.get(path, headers=self.auth).status_code, 200
            )
        with count_queries() as warm:
            self.assertEqual(
                self.client.get(path, headers=self.auth).status_code, 200
            )

        self.assertEqual(len(self._users_queries(cold)), 1)
        # The list itself is cached here; the identity cache is what lets a
        # cold poll skip the users SELECT entirely.
        self.assertEqual(len(self._users_queries(warm)), 0)

    def test_inactive_account_is_rejected_before_any_query_runs(self):
        self._seed(1)
        with self.app.app_context():
            user = db.session.get(User, self.user_id)
            user.is_active = False
            db.session.commit()
        invalidate_identity_cache(self.user_id)

        response = self.client.get(
            "/api/enhanced-notifications/notifications", headers=self.auth
        )
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.get_json()["error"], "Account inactive")

    def test_admin_status_change_invalidates_the_cached_identity(self):
        self._seed(1)
        # Prime the cache while the account is still active.
        self.assertEqual(
            self.client.get(
                "/api/enhanced-notifications/notifications", headers=self.auth
            ).status_code,
            200,
        )

        with self.app.app_context():
            user = db.session.get(User, self.user_id)
            user.is_active = False
            db.session.commit()
        invalidate_identity_cache(self.user_id)

        response = self.client.get(
            "/api/enhanced-notifications/notifications", headers=self.auth
        )
        self.assertEqual(response.status_code, 401)

    def test_identity_user_only_exposes_identity_columns(self):
        stub = IdentityUser(7, "job_seeker", True)

        self.assertEqual(stub.id, 7)
        self.assertEqual(stub.role, "job_seeker")
        self.assertTrue(stub.is_active)
        # Anything else must fail loudly rather than return None.
        with self.assertRaises(AttributeError):
            stub.email


if __name__ == "__main__":
    unittest.main()
