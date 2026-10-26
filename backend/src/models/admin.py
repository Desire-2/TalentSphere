"""Persistent administrative moderation history."""

import json
from datetime import datetime

from src.models.user import db


class ModerationLog(db.Model):
    __tablename__ = "moderation_logs"

    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    target_type = db.Column(db.String(50), nullable=False, index=True)
    target_id = db.Column(db.Integer, nullable=False, index=True)
    action = db.Column(db.String(50), nullable=False)
    reason = db.Column(db.Text)
    notes = db.Column(db.Text)
    old_state = db.Column(db.Text)
    new_state = db.Column(db.Text)
    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        index=True,
    )

    admin = db.relationship("User", backref="moderation_logs")

    @staticmethod
    def _decode_state(value):
        if not value:
            return {}
        try:
            decoded = json.loads(value)
            return decoded if isinstance(decoded, dict) else {}
        except (TypeError, ValueError):
            return {}

    def to_dict(self):
        return {
            "id": self.id,
            "admin_id": self.admin_id,
            "target_type": self.target_type,
            "target_id": self.target_id,
            "action": self.action,
            "reason": self.reason,
            "notes": self.notes,
            "old_state": self._decode_state(self.old_state),
            "new_state": self._decode_state(self.new_state),
            "created_at": self.created_at.isoformat(),
        }
