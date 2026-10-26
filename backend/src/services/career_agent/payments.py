"""Provider-neutral, server-verified Career Agent payment bridge.

The existing ad-credit endpoint is intentionally not reused: it is a stub and
cannot establish a verified applicant subscription.
"""

from __future__ import annotations

from datetime import datetime, timedelta
import hashlib
import hmac
import json
import os
from typing import Any, Dict, Optional

import requests

from src.models.career_agent import CareerPaymentTransaction, CareerSubscription, CareerSubscriptionPlan
from src.models.user import User, db

from .entitlements import CareerPlanService


class CareerPaymentError(RuntimeError):
    pass


class CareerPaymentProvider:
    """HTTP adapter configured by deployment, never by frontend request data."""

    def __init__(self):
        self.provider_name = os.getenv("CAREER_PAYMENT_PROVIDER", "configured_http")
        self.create_url = os.getenv("CAREER_PAYMENT_CREATE_URL")
        self.verify_url = os.getenv("CAREER_PAYMENT_VERIFY_URL")
        self.api_key = os.getenv("CAREER_PAYMENT_API_KEY")
        self.webhook_secret = os.getenv("CAREER_PAYMENT_WEBHOOK_SECRET")

    @property
    def configured(self) -> bool:
        return bool(self.create_url and self.verify_url and self.api_key and self.webhook_secret)

    def _headers(self) -> Dict[str, str]:
        return {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json", "Accept": "application/json"}

    def create_checkout(self, transaction: CareerPaymentTransaction, user: User, plan: CareerSubscriptionPlan) -> Dict[str, Any]:
        if not self.configured:
            raise CareerPaymentError("Career Agent checkout is not configured by the payment provider.")
        payload = {
            "reference": transaction.idempotency_key,
            "amount": transaction.amount_rwf,
            "currency": "RWF",
            "description": f"AfriTech AI Career Agent — {plan.name}",
            "return_url": (
                f"{os.getenv('FRONTEND_URL', '').rstrip('/')}/jobseeker/career-agent"
                f"?checkout_reference={transaction.idempotency_key}"
            ),
            "customer": {"id": str(user.id), "email": user.email, "name": user.get_full_name()},
            "metadata": {"career_transaction_id": transaction.id, "subscription_id": transaction.subscription_id, "plan_code": plan.code},
        }
        try:
            response = requests.post(self.create_url, headers=self._headers(), json=payload, timeout=30)
        except requests.RequestException as exc:
            raise CareerPaymentError("Could not start secure checkout.") from exc
        if response.status_code >= 400:
            raise CareerPaymentError("Payment provider rejected checkout setup.")
        try:
            data = response.json()
        except ValueError as exc:
            raise CareerPaymentError("Payment provider returned an invalid checkout response.") from exc
        checkout_url = data.get("checkout_url") or data.get("payment_url")
        provider_reference = data.get("reference") or data.get("provider_reference")
        if not checkout_url or not provider_reference:
            raise CareerPaymentError("Payment provider did not return a secure checkout reference.")
        return {"checkout_url": checkout_url, "provider_reference": str(provider_reference), "provider_payload": {"checkout_created": True}}

    def verify(self, transaction: CareerPaymentTransaction) -> Dict[str, Any]:
        if not self.configured:
            raise CareerPaymentError("Career Agent payment verification is not configured.")
        try:
            response = requests.post(
                self.verify_url,
                headers=self._headers(),
                json={"reference": transaction.provider_reference or transaction.idempotency_key},
                timeout=30,
            )
        except requests.RequestException as exc:
            raise CareerPaymentError("Could not verify payment with the provider.") from exc
        if response.status_code >= 400:
            raise CareerPaymentError("Payment provider could not verify this payment.")
        try:
            data = response.json()
        except ValueError as exc:
            raise CareerPaymentError("Payment provider returned an invalid verification response.") from exc
        status = str(data.get("status") or "").upper()
        amount = data.get("amount")
        currency = str(data.get("currency") or "").upper()
        if status not in {"SUCCESS", "COMPLETED", "PAID"}:
            raise CareerPaymentError("Payment has not been verified as successful.")
        try:
            amount_matches = int(amount) == int(transaction.amount_rwf)
        except (TypeError, ValueError):
            amount_matches = False
        if not amount_matches or currency != "RWF":
            raise CareerPaymentError("Verified payment amount or currency does not match the selected plan.")
        return {"provider_reference": str(data.get("reference") or transaction.provider_reference or ""), "payload": {"status": status, "amount_verified": True, "currency": currency}}

    def verify_webhook_signature(self, raw_body: bytes, signature: str) -> bool:
        if not self.webhook_secret or not signature:
            return False
        expected = hmac.new(self.webhook_secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature.strip())


class CareerPaymentService:
    def __init__(self, provider: CareerPaymentProvider | None = None):
        self.provider = provider or CareerPaymentProvider()

    def start_checkout(self, *, user: User, plan_code: str, idempotency_key: str) -> Dict[str, Any]:
        CareerPlanService.ensure_seeded()
        plan = CareerSubscriptionPlan.query.get(plan_code)
        if not plan or not plan.is_active or plan.is_free:
            raise ValueError("Choose an active paid Career Agent plan.")
        existing = CareerPaymentTransaction.query.filter_by(idempotency_key=idempotency_key).first()
        if existing:
            if existing.user_id != user.id:
                raise PermissionError("This checkout key belongs to another user.")
            return {"transaction": existing, "checkout_url": None, "reused": True}
        subscription = CareerSubscription(user_id=user.id, plan_code=plan.code, status="PENDING")
        db.session.add(subscription)
        db.session.flush()
        transaction = CareerPaymentTransaction(
            user_id=user.id,
            subscription_id=subscription.id,
            plan_code=plan.code,
            amount_rwf=plan.price_rwf,
            currency="RWF",
            provider=self.provider.provider_name,
            status="PENDING",
            idempotency_key=idempotency_key,
        )
        db.session.add(transaction)
        db.session.flush()
        checkout = self.provider.create_checkout(transaction, user, plan)
        transaction.provider_reference = checkout["provider_reference"]
        transaction.provider_payload_json = json.dumps(checkout["provider_payload"])
        return {"transaction": transaction, "checkout_url": checkout["checkout_url"], "reused": False}

    def verify_and_activate(self, *, provider_reference: str) -> CareerPaymentTransaction:
        transaction = CareerPaymentTransaction.query.filter_by(provider_reference=provider_reference).with_for_update().first()
        if not transaction:
            raise CareerPaymentError("Payment reference was not found.")
        if transaction.status == "COMPLETED":
            return transaction
        verification = self.provider.verify(transaction)
        subscription = CareerSubscription.query.filter_by(id=transaction.subscription_id).with_for_update().one()
        plan = CareerSubscriptionPlan.query.get(subscription.plan_code)
        if not plan:
            raise CareerPaymentError("The selected plan is unavailable.")
        now = datetime.utcnow()
        transaction.status = "COMPLETED"
        transaction.provider_reference = verification["provider_reference"] or transaction.provider_reference
        transaction.provider_payload_json = json.dumps(verification["payload"])
        transaction.verified_at = now
        subscription.status = "ACTIVE"
        subscription.starts_at = now
        subscription.ends_at = now + timedelta(days=plan.duration_days or 0)
        return transaction

    @staticmethod
    def suspend_subscription(subscription_id: int, reason: str = "") -> CareerSubscription:
        subscription = CareerSubscription.query.filter_by(id=subscription_id).with_for_update().first()
        if not subscription:
            raise ValueError("Subscription not found.")
        subscription.status = "SUSPENDED"
        subscription.cancellation_reason = reason[:500] or "Suspended by an administrator"
        return subscription
