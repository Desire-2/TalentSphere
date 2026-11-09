"""Canonical Career Agent document template registry.

One design definition per template key, shared by every document type
(CV and cover letter), by server-side export rendering, and by the
generation flow. The registry is the only place templates are defined:
frontend option lists mirror these keys, and the export renderer must
never invent a design outside this catalog.

Design constraints (ATS safety, applied to every template):
- single-column semantic HTML, real heading text, no tables or images
- web-safe font stacks only (exports render offline via WeasyPrint)
- grayscale templates force neutral ink regardless of accent color
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List


@dataclass(frozen=True)
class TemplateDesign:
    key: str
    label: str
    hint: str
    description: str
    default_accent: str
    grayscale: bool = False
    css: str = ""


# ---------------------------------------------------------------------------
# Design CSS. Each block is scoped under `.tpl-{key}` and layered after the
# structural base stylesheet, so a template owns its typography, rules, and
# color treatment while the content markup stays identical everywhere.
# ---------------------------------------------------------------------------

_MODERN_CSS = """
.tpl-modern_professional .header { border-bottom: 2px solid var(--doc-accent); }
.tpl-modern_professional .name { color: #102a43; }
.tpl-modern_professional .role { color: var(--doc-accent); }
.tpl-modern_professional .section-title { color: var(--doc-accent); border-bottom: 1px solid #d8e1e7; }
"""

_ATS_CSS = """
.tpl-ats_safe { --doc-accent: #1a1a1a; }
.tpl-ats_safe .header { border-bottom: 2px solid #111111; }
.tpl-ats_safe .name { color: #111111; letter-spacing: -.2pt; }
.tpl-ats_safe .role { color: #333333; font-weight: 600; }
.tpl-ats_safe .contact { color: #444444; }
.tpl-ats_safe .section-title { color: #111111; border-bottom: 1.5px solid #111111; letter-spacing: .5pt; }
.tpl-ats_safe .entry-sub, .tpl-ats_safe .entry-meta { color: #444444; }
"""

_EXECUTIVE_CSS = """
.tpl-executive { font-family: Georgia, 'Times New Roman', Times, serif; --doc-accent: #1E3A5F; }
.tpl-executive .header { border-bottom: 1px solid #1E3A5F; box-shadow: 0 2px 0 -1px #1E3A5F; padding-bottom: 7px; }
.tpl-executive .name { color: #14213d; font-weight: 700; letter-spacing: -.2pt; }
.tpl-executive .role { color: #1E3A5F; font-style: italic; font-weight: 600; }
.tpl-executive .contact { color: #4a5568; font-variant: small-caps; letter-spacing: .3pt; }
.tpl-executive .section-title { color: #1E3A5F; border-bottom: 1px solid #b7c3d4; letter-spacing: .9pt; }
.tpl-executive .entry-sub { color: #2d3748; font-style: italic; }
"""

_GRADUATE_CSS = """
.tpl-graduate .header { border-bottom: 2px solid var(--doc-accent); }
.tpl-graduate .name { color: #16213a; }
.tpl-graduate .role { color: var(--doc-accent); }
.tpl-graduate .section-title { color: var(--doc-accent); background: #f2f6fa; border-bottom: none; padding: 3px 7px; margin-left: -7px; }
.tpl-graduate .entry-meta { color: #5b6b7c; }
"""

_TECHNICAL_CSS = """
.tpl-technical .header { border-bottom: 2px solid var(--doc-accent); }
.tpl-technical .name { color: #0f172a; letter-spacing: -.3pt; }
.tpl-technical .role { color: var(--doc-accent); font-family: 'Courier New', Courier, monospace; font-weight: 700; }
.tpl-technical .section-title { color: var(--doc-accent); border-bottom: none; border-left: 3px solid var(--doc-accent); padding: 0 0 0 7px; letter-spacing: .6pt; }
.tpl-technical .entry-meta { font-family: 'Courier New', Courier, monospace; font-size: 8.4pt; color: #475569; }
.tpl-technical .entry-sub { color: #334155; }
"""

_NGO_CSS = """
.tpl-ngo_development .header { background: #f6faf7; border-left: 4px solid var(--doc-accent); border-bottom: none; padding: 9px 11px; }
.tpl-ngo_development .name { color: #1c2f26; }
.tpl-ngo_development .role { color: var(--doc-accent); }
.tpl-ngo_development .section-title { color: var(--doc-accent); border-bottom: 1px solid #cfe0d6; }
.tpl-ngo_development .entry-sub { color: #37624a; }
"""

_ACADEMIC_CSS = """
.tpl-academic_research { font-family: Cambria, Georgia, 'Times New Roman', Times, serif; --doc-accent: #8A3346; }
.tpl-academic_research .header { border-bottom: 1px solid #8A3346; }
.tpl-academic_research .name { color: #3b1d26; font-weight: 600; }
.tpl-academic_research .role { color: #8A3346; font-style: italic; font-weight: 600; }
.tpl-academic_research .contact { color: #555; }
.tpl-academic_research .section-title { color: #8A3346; border-bottom: 1px solid #d9c2c9; letter-spacing: .8pt; }
.tpl-academic_research .entry-sub { color: #4a3038; font-style: italic; }
"""

_MINIMAL_CSS = """
.tpl-minimal { --doc-accent: #333333; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
.tpl-minimal .header { border-bottom: 1px solid #cccccc; }
.tpl-minimal .name { color: #111111; font-weight: 400; font-size: 17pt; letter-spacing: .16em; text-transform: uppercase; }
.tpl-minimal .role { color: #555555; font-weight: 500; letter-spacing: .08em; }
.tpl-minimal .contact { color: #777777; }
.tpl-minimal .section-title { color: #666666; font-weight: 500; border-bottom: 1px solid #e6e6e6; letter-spacing: .14em; }
.tpl-minimal .entry-sub, .tpl-minimal .entry-meta { color: #777777; font-weight: 500; }
"""

_CREATIVE_CSS = """
.tpl-creative_professional .header { background: #f7fbfa; border-left: 5px solid var(--doc-accent); border-bottom: none; padding: 10px 12px; }
.tpl-creative_professional .name { color: #0f2e2b; }
.tpl-creative_professional .role { color: var(--doc-accent); font-weight: 700; }
.tpl-creative_professional .section-title { color: #0f2e2b; border-bottom: 2px solid var(--doc-accent); }
.tpl-creative_professional .entry-sub { color: var(--doc-accent); }
"""

_INTERNATIONAL_CSS = """
.tpl-international_professional .header { border-bottom: 3px double var(--doc-accent); }
.tpl-international_professional .name { color: #14213d; }
.tpl-international_professional .role { color: var(--doc-accent); }
.tpl-international_professional .section-title { color: #14213d; border-bottom: 1px solid #cbd5e1; letter-spacing: .8pt; }
.tpl-international_professional .contact { color: #4c566a; }
"""


def _design(
    key: str,
    label: str,
    hint: str,
    description: str,
    default_accent: str,
    css: str,
    *,
    grayscale: bool = False,
) -> TemplateDesign:
    return TemplateDesign(
        key=key,
        label=label,
        hint=hint,
        description=description,
        default_accent=default_accent,
        grayscale=grayscale,
        css=css.strip() + "\n",
    )


TEMPLATE_CATALOG: Dict[str, TemplateDesign] = {
    design.key: design
    for design in (
        _design(
            "modern_professional", "Modern", "Balanced, recruiter-friendly",
            "Clean sans-serif with an accent rule and colored section headings. The default all-purpose design.",
            "#0F766E", _MODERN_CSS,
        ),
        _design(
            "ats_safe", "ATS Professional", "Maximum parse safety, neutral ink",
            "Strict grayscale, black rules, zero decoration. Built for conservative applicant tracking systems.",
            "#1A1A1A", _ATS_CSS, grayscale=True,
        ),
        _design(
            "executive", "Executive", "Leadership presence, serif polish",
            "Georgia serif with a navy palette, refined double rule, and small-caps contact line for senior roles.",
            "#1E3A5F", _EXECUTIVE_CSS,
        ),
        _design(
            "graduate", "Graduate", "Education-forward, approachable",
            "Friendly accent headings on pale tint bands — ideal when education and projects lead the story.",
            "#2563A6", _GRADUATE_CSS,
        ),
        _design(
            "technical", "Technical", "Skills and project emphasis",
            "Courier accents for dates and skills with left-bar section headings for engineering profiles.",
            "#2563A6", _TECHNICAL_CSS,
        ),
        _design(
            "ngo_development", "Development", "Program and field impact",
            "Forest-green palette with a soft tinted header block for program, field, and impact work.",
            "#37624A", _NGO_CSS,
        ),
        _design(
            "academic_research", "Academic", "Research and publications first",
            "Cambria serif with burgundy rules and italic roles for publications, teaching, and research CVs.",
            "#8A3346", _ACADEMIC_CSS,
        ),
        _design(
            "minimal", "Minimal", "Quiet, typography-led",
            "Grayscale airy layout with wide-tracked uppercase name and hairline rules. No color at all.",
            "#333333", _MINIMAL_CSS, grayscale=True,
        ),
        _design(
            "creative_professional", "Creative", "Distinctive but print-safe",
            "Tinted header block with a bold accent bar — personality that still exports as selectable text.",
            "#0F766E", _CREATIVE_CSS,
        ),
        _design(
            "international_professional", "International", "Clean, globally neutral",
            "Navy headings with a double accent rule — a neutral, globally legible professional design.",
            "#1E3A5F", _INTERNATIONAL_CSS,
        ),
    )
}

# Keys accepted anywhere a template can be chosen (generation, strategy
# validation, document settings). Kept as a plain set for `in` checks.
TEMPLATE_KEYS = set(TEMPLATE_CATALOG)

DEFAULT_TEMPLATE_KEY = "modern_professional"


def get_template(key: str | None) -> TemplateDesign:
    """Resolve a design from the registry; unknown keys fall back to the default."""
    return TEMPLATE_CATALOG.get((key or "").strip(), TEMPLATE_CATALOG[DEFAULT_TEMPLATE_KEY])


def template_default_accent(key: str | None) -> str:
    return get_template(key).default_accent


def is_valid_template(key: str | None) -> bool:
    return bool(key) and key in TEMPLATE_CATALOG


def template_catalog_payload() -> List[dict]:
    """Public catalog for API consumers (frontend picker, docs tooling)."""
    return [
        {
            "key": design.key,
            "label": design.label,
            "hint": design.hint,
            "description": design.description,
            "default_accent": design.default_accent,
            "grayscale": design.grayscale,
        }
        for design in TEMPLATE_CATALOG.values()
    ]
