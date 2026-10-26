"""Server-side subscription and generation-entitlement enforcement."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional, Tuple

from flask import g, has_app_context
from sqlalchemy import case, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload

from src.config.career_agent_products import CAREER_AGENT_PRODUCTS
from src.models.career_agent import (
    CareerDocumentPackage,
    CareerGenerationUsage,
    CareerProfile,
    CareerSubscription,
    CareerSubscriptionPlan,
)
from src.models.user import User, db

from .profile_intelligence import CareerProfileService

_MISSING = object()


def _memo_get(key: str):
    """Per-request memo lookup. Reads are repeated within one request only."""
    if not has_app_context():
        return _MISSING
    return getattr(g, key, _MISSING)


def _memo_set(key: str, value: Any) -> None:
    if has_app_context():
        setattr(g, key, value)


class GenerationEntitlementError(PermissionError):
    """Raised when a new document package is not currently entitled."""

    def __init__(self, message: str, *, code: str = "GENERATION_ENTITLEMENT_REQUIRED", usage: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.code = code
        self.usage = usage or {}


class CareerPlanService:
    """Seeds central product definitions once; admin edits remain database-owned."""

    _SEEDED_KEY = "_career_plans_seeded"
    _FREE_PLAN_KEY = "_career_free_plan"

    @staticmethod
    def ensure_seeded() -> None:
        # Plans are reference data. One read per request is enough to know
        # what already exists: the entitlement pre-check, the reservation and
        # the response summary each used to re-read every plan row, which is
        # pure round-trip overhead against a remote database.
        if _memo_get(CareerPlanService._SEEDED_KEY) is not _MISSING:
            return
        # One read serves both questions this used to ask twice: which plans
        # already exist, and what the free tier's limit is.
        loaded = CareerSubscriptionPlan.query.all()
        existing = {plan.code for plan in loaded}
        free_plan = next((plan for plan in loaded if plan.code == "CAREER_AGENT_FREE"), None)
        _memo_set(CareerPlanService._FREE_PLAN_KEY, free_plan)
        for code, definition in CAREER_AGENT_PRODUCTS.items():
            if code in existing:
                continue
            try:
                # Plan seeding runs from multiple request workers. Keep the
                # unique-key race inside a savepoint so a losing worker does
                # not poison the request's outer transaction.
                with db.session.begin_nested():
                    db.session.add(CareerSubscriptionPlan(
                        code=code,
                        name=definition["name"],
                        description=definition["description"],
                        price_rwf=definition["price_rwf"],
                        duration_days=definition["duration_days"],
                        generation_package_limit=definition["generation_package_limit"],
                        is_free=definition["is_free"],
                        is_active=definition["is_active"],
                    ))
                    db.session.flush()
            except IntegrityError:
                # Another worker inserted this plan between the read and the
                # flush. It is safe to continue once that row is visible.
                if not CareerSubscriptionPlan.query.get(code):
                    raise
                existing.add(code)
                continue
            existing.add(code)
            if code == "CAREER_AGENT_FREE" and _memo_get(CareerPlanService._FREE_PLAN_KEY) is None:
                _memo_set(
                    CareerPlanService._FREE_PLAN_KEY,
                    CareerSubscriptionPlan.query.get(code),
                )
        _memo_set(CareerPlanService._SEEDED_KEY, True)

    @staticmethod
    def free_plan() -> Optional[CareerSubscriptionPlan]:
        """The free tier row, read at most once per request."""
        CareerPlanService.ensure_seeded()
        cached = _memo_get(CareerPlanService._FREE_PLAN_KEY)
        if cached is not _MISSING:
            return cached
        plan = CareerSubscriptionPlan.query.get("CAREER_AGENT_FREE")
        _memo_set(CareerPlanService._FREE_PLAN_KEY, plan)
        return plan

    @staticmethod
    def plans() -> list[CareerSubscriptionPlan]:
        CareerPlanService.ensure_seeded()
        return CareerSubscriptionPlan.query.order_by(CareerSubscriptionPlan.price_rwf.asc()).all()

    @staticmethod
    def update_plan(code: str, data: Dict[str, Any]) -> CareerSubscriptionPlan:
        CareerPlanService.ensure_seeded()
        plan = CareerSubscriptionPlan.query.get(code)
        if not plan:
            raise ValueError("Plan not found.")
        for field in ("name", "description", "price_rwf", "duration_days", "generation_package_limit", "is_active"):
            if field in data:
                value = data[field]
                if field in {"price_rwf", "duration_days", "generation_package_limit"} and value is not None:
                    try:
                        value = int(value)
                    except (TypeError, ValueError) as exc:
                        raise ValueError(f"{field} must be a whole number.") from exc
                    if value < 0:
                        raise ValueError(f"{field} cannot be negative.")
                setattr(plan, field, value)
        return plan


class CareerEntitlementService:
    FREE_USAGE_STATES = ("RESERVED", "CONSUMED")

    def __init__(self, profile_service: CareerProfileService | None = None):
        self.profile_service = profile_service or CareerProfileService()

    @staticmethod
    def _active_subscription(user_id: int, *, lock: bool = False) -> Optional[CareerSubscription]:
        # An unlocked lookup is read-only and repeated several times inside
        # one request (pre-check, reservation bookkeeping, response summary);
        # memoizing it saves a round trip without weakening the lock path,
        # which always issues its own FOR UPDATE read.
        memo_key = f"_career_active_sub_{user_id}"
        if not lock:
            cached = _memo_get(memo_key)
            if cached is not _MISSING:
                return cached
        now = datetime.utcnow()
        query = CareerSubscription.query.filter(
            CareerSubscription.user_id == user_id,
            CareerSubscription.status == "ACTIVE",
            CareerSubscription.starts_at <= now,
            CareerSubscription.ends_at > now,
        ).order_by(CareerSubscription.ends_at.desc())
        if lock:
            query = query.with_for_update()
        else:
            # Plan rows are needed by the summary; fetch them with the
            # subscription instead of lazy-loading one request later.
            query = query.options(joinedload(CareerSubscription.plan))
        subscription = query.first()
        if not lock:
            _memo_set(memo_key, subscription)
        return subscription

    @staticmethod
    def _expire_stale_subscriptions(user_id: int) -> None:
        # Hygiene only: _active_subscription already excludes rows whose
        # ends_at has passed, so running the UPDATE more than once per
        # request just spends a round trip re-stating the same fact.
        memo_key = f"_career_stale_expired_{user_id}"
        if _memo_get(memo_key) is not _MISSING:
            return
        now = datetime.utcnow()
        CareerSubscription.query.filter(
            CareerSubscription.user_id == user_id,
            CareerSubscription.status == "ACTIVE",
            CareerSubscription.ends_at <= now,
        ).update({CareerSubscription.status: "EXPIRED"}, synchronize_session=False)
        _memo_set(memo_key, True)

    @staticmethod
    def _read_free_counts(user_id: int) -> Tuple[int, int]:
        """Consumed and reserved FREE rows in one conditional aggregate.

        Both counters cover the same rows for the same user, so two separate
        COUNT round trips would only restate the same table scan.
        """
        used, reserved = db.session.query(
            func.coalesce(
                func.sum(case((CareerGenerationUsage.status == "CONSUMED", 1), else_=0)), 0
            ),
            func.coalesce(
                func.sum(case((CareerGenerationUsage.status == "RESERVED", 1), else_=0)), 0
            ),
        ).filter(
            CareerGenerationUsage.user_id == user_id,
            CareerGenerationUsage.entitlement_source == "FREE",
        ).one()
        return int(used), int(reserved)

    def usage_summary(self, user_id: int) -> Dict[str, Any]:
        CareerPlanService.ensure_seeded()
        self._expire_stale_subscriptions(user_id)
        free_plan = CareerPlanService.free_plan()
        free_limit = free_plan.generation_package_limit if free_plan else 1
        memo = _memo_get(f"_career_free_counts_{user_id}")
        if memo is not _MISSING:
            free_used, free_reserved = memo
        else:
            free_used, free_reserved = self._read_free_counts(user_id)
        subscription = self._active_subscription(user_id)
        subscription_used = 0
        if subscription:
            subscription_used = CareerGenerationUsage.query.filter(
                CareerGenerationUsage.subscription_id == subscription.id,
                CareerGenerationUsage.status.in_(("RESERVED", "CONSUMED")),
            ).count()
        can_generate = bool(subscription) or free_used + free_reserved < (free_limit or 0)
        return {
            "free_package": {
                "included": free_limit,
                "used": free_used,
                "reserved": free_reserved,
                "remaining": max(0, (free_limit or 0) - free_used - free_reserved),
            },
            "active_subscription": subscription.to_dict() if subscription else None,
            "subscription_usage": subscription_used,
            "can_generate_new_package": can_generate,
            "reason": None if can_generate else "Your first application package is already active. Choose a plan to create a document package for another opportunity.",
        }

    def can_generate_document_package(self, user_id: int) -> Tuple[bool, Dict[str, Any]]:
        summary = self.usage_summary(user_id)
        return summary["can_generate_new_package"], summary

    def reserve(
        self,
        *,
        user: User,
        package: CareerDocumentPackage,
        profile: Optional[CareerProfile] = None,
    ) -> CareerGenerationUsage:
        """Reserve entitlement in the caller's transaction with a per-user row lock.

        `CareerProfile` is a durable single-row lock target. This closes the
        free-package race across direct API calls and duplicate browser tabs.
        Pass the profile the caller already read with `lock=True` to avoid
        taking the same row twice in one request.
        """
        CareerPlanService.ensure_seeded()
        self._expire_stale_subscriptions(user.id)
        if profile is None:
            profile = self.profile_service.get_or_create(user.id, lock=True)
        # Accessing the row is intentional: PostgreSQL locks it via FOR UPDATE.
        _ = profile.id
        existing = CareerGenerationUsage.query.filter_by(package_id=package.id).with_for_update().first()
        if existing and existing.status in {"RESERVED", "CONSUMED"}:
            return existing

        subscription = self._active_subscription(user.id, lock=True)
        free_used = free_reserved = 0
        if subscription:
            plan = subscription.plan
            limit = plan.generation_package_limit if plan else None
            active_count = CareerGenerationUsage.query.filter(
                CareerGenerationUsage.subscription_id == subscription.id,
                CareerGenerationUsage.status.in_(self.FREE_USAGE_STATES),
            ).count()
            if limit is not None and active_count >= limit:
                raise GenerationEntitlementError(
                    "This subscription has reached its document-package limit.",
                    code="SUBSCRIPTION_PACKAGE_LIMIT_REACHED",
                    usage=self.usage_summary(user.id),
                )
            source, subscription_id = "SUBSCRIPTION", subscription.id
        else:
            free_plan = CareerPlanService.free_plan()
            free_limit = free_plan.generation_package_limit if free_plan else 1
            free_used, free_reserved = self._read_free_counts(user.id)
            active_count = free_used + free_reserved
            if active_count >= (free_limit or 0):
                raise GenerationEntitlementError(
                    "A paid Career Agent plan is required to create another job-specific package.",
                    usage=self.usage_summary(user.id),
                )
            source, subscription_id = "FREE", None

        usage = existing or CareerGenerationUsage(user_id=user.id, package_id=package.id)
        usage.subscription_id = subscription_id
        usage.entitlement_source = source
        usage.status = "RESERVED"
        usage.reserved_at = datetime.utcnow()
        usage.released_at = None
        usage.release_reason = None
        package.entitlement_source = source
        if not existing:
            db.session.add(usage)
        db.session.flush()
        if source == "FREE" and not existing:
            # The reservation above is the only FREE row added since the counts
            # were read, so the summary built next can reuse them instead of
            # counting the same table a second time.
            _memo_set(f"_career_free_counts_{user.id}", (free_used, free_reserved + 1))
        return usage

    @staticmethod
    def consume(package_id: int) -> None:
        usage = CareerGenerationUsage.query.filter_by(package_id=package_id).with_for_update().first()
        if not usage:
            raise RuntimeError("Generation entitlement reservation is missing.")
        if usage.status == "CONSUMED":
            return
        if usage.status != "RESERVED":
            raise RuntimeError("Generation entitlement is not reservable for consumption.")
        usage.status = "CONSUMED"
        usage.consumed_at = datetime.utcnow()

    @staticmethod
    def release(package_id: int, reason: str) -> None:
        usage = CareerGenerationUsage.query.filter_by(package_id=package_id).with_for_update().first()
        if not usage or usage.status == "CONSUMED":
            return
        usage.status = "RELEASED"
        usage.released_at = datetime.utcnow()
        usage.release_reason = reason[:500]
