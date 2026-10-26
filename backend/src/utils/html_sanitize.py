"""HTML sanitization for user-supplied rich content (job descriptions,
summaries, company blurbs).

Prefers nh3 (fast Rust HTML sanitizer); falls back to bleach when nh3 is
not installed. Both strip scripts/event handlers and restrict links to
http(s)/mailto.
"""

from __future__ import annotations

import re

try:
    import nh3

    _BACKEND = "nh3"
    _ALLOWED_TAGS = {
        "a", "abbr", "b", "blockquote", "br", "code", "div", "em",
        "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "li", "ol",
        "p", "pre", "span", "strong", "sub", "sup", "table", "tbody",
        "td", "tfoot", "th", "thead", "tr", "ul",
    }
    _ALLOWED_ATTRS = {
        "a": ["href", "title", "rel", "target"],
        "span": ["class"],
        "code": ["class"],
        "div": ["class"],
        "td": ["colspan", "rowspan"],
        "th": ["colspan", "rowspan"],
    }
except ImportError:  # pragma: no cover - exercised when nh3 is missing
    import bleach

    _BACKEND = "bleach"
    _ALLOWED_TAGS = [
        "a", "abbr", "b", "blockquote", "br", "code", "div", "em",
        "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "li", "ol",
        "p", "pre", "span", "strong", "sub", "sup", "table", "tbody",
        "td", "tfoot", "th", "thead", "tr", "ul",
    ]
    _ALLOWED_ATTRS = {
        "a": ["href", "title", "rel", "target"],
        "span": ["class"],
        "code": ["class"],
        "div": ["class"],
        "td": ["colspan", "rowspan"],
        "th": ["colspan", "rowspan"],
    }
    _ALLOWED_PROTOCOLS = ["http", "https", "mailto"]


def sanitize_html(value: str | None) -> str | None:
    """Return cleaned HTML with scripts/handlers removed, or None/empty as-is."""
    if value is None:
        return None
    if not isinstance(value, str) or not value:
        return value

    if _BACKEND == "nh3":
        cleaned = nh3.clean(
            value,
            tags=_ALLOWED_TAGS,
            attribute_filter=lambda tag, attr, value: value
            if attr in _ALLOWED_ATTRS.get(tag, [])
            else None,
            link_rel="noopener noreferrer",
        )
    else:
        cleaned = bleach.clean(
            value,
            tags=_ALLOWED_TAGS,
            attributes=_ALLOWED_ATTRS,
            protocols=_ALLOWED_PROTOCOLS,
            strip=True,
            strip_comments=True,
        )
        cleaned = bleach.linkify(cleaned, skip_tags=["a"], parse_email=False)

    # Collapse runs of blank lines left after tag stripping
    return re.sub(r"\n{3,}", "\n\n", cleaned).strip()


def sanitize_text(value: str | None) -> str | None:
    """Plain-text field: strip any HTML entirely."""
    if value is None:
        return None
    if not isinstance(value, str) or not value:
        return value
    if _BACKEND == "nh3":
        return nh3.clean(value, tags=set(), attribute_filter=None).strip()
    return bleach.clean(value, tags=[], strip=True).strip()
