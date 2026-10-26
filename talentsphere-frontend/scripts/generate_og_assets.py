#!/usr/bin/env python3
"""Generate favicons, PWA logos and Open Graph images for AfriTech Opportunities.

Usage (from talentsphere-frontend/):
    python3 scripts/generate_og_assets.py

Source artwork: public/logo-192.png (806x677 RGBA logo).
Outputs are written into public/ and are safe to re-run.
"""

from __future__ import annotations

import os

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(HERE, "..", "public")
ASSETS_SRC = os.path.join(HERE, "..", "assets-src", "logo-source.png")
SOURCE = ASSETS_SRC if os.path.exists(ASSETS_SRC) else os.path.join(PUBLIC, "logo-192.png")

NAVY = (10, 40, 71)        # #0A2847
NAVY_DEEP = (0, 31, 63)    # #001F3F
TEAL = (27, 163, 152)      # #1BA398
ORANGE = (255, 107, 53)    # #FF6B35
WHITE = (255, 255, 255)
MUTED = (198, 210, 224)

FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def fit_logo(source: Image.Image, box: int) -> Image.Image:
    """Fit logo into box x box on a transparent square canvas."""
    logo = source.copy()
    logo.thumbnail((box, box), Image.LANCZOS)
    canvas = Image.new("RGBA", (box, box), (0, 0, 0, 0))
    canvas.paste(logo, ((box - logo.width) // 2, (box - logo.height) // 2), logo)
    return canvas


def vertical_gradient(size: tuple[int, int], top: tuple, bottom: tuple) -> Image.Image:
    width, height = size
    img = Image.new("RGB", size, top)
    draw = ImageDraw.Draw(img)
    for y in range(height):
        t = y / max(height - 1, 1)
        color = tuple(round(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        draw.line([(0, y), (width, y)], fill=color)
    return img


def draw_og(path: str, title: str, subtitle: str, logo_source: Image.Image) -> None:
    width, height = 1200, 630
    bg = vertical_gradient((width, height), NAVY, NAVY_DEEP).convert("RGBA")

    draw = ImageDraw.Draw(bg)

    # Accent bars
    draw.rectangle([0, 0, width, 14], fill=TEAL)
    draw.rectangle([0, height - 14, width, height], fill=ORANGE)

    # Logo badge (white rounded card keeps any artwork legible on navy)
    badge = 150
    card = Image.new("RGBA", (badge, badge), (0, 0, 0, 0))
    card_draw = ImageDraw.Draw(card)
    card_draw.rounded_rectangle([0, 0, badge - 1, badge - 1], radius=28, fill=WHITE)
    logo = fit_logo(logo_source, badge - 36)
    card.alpha_composite(logo, ((badge - logo.width) // 2, (badge - logo.height) // 2))
    bg.alpha_composite(card, (90, 150))

    # Title + subtitle
    draw = ImageDraw.Draw(bg)
    title_font = font(FONT_BOLD, 64)
    sub_font = font(FONT_REG, 32)
    domain_font = font(FONT_BOLD, 28)

    text_x = 290
    draw.text((text_x, 158), title, font=title_font, fill=WHITE)
    # wrap subtitle manually at ~44 chars
    words = subtitle.split()
    lines: list[str] = []
    current = ""
    for word in words:
        trial = f"{current} {word}".strip()
        if len(trial) <= 46:
            current = trial
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    y = 250
    for line in lines[:3]:
        draw.text((text_x, y), line, font=sub_font, fill=MUTED)
        y += 46

    # Domain strip
    draw.rounded_rectangle([90, height - 140, 640, height - 58], radius=14, fill=(255, 255, 255, 26))
    draw.text((118, height - 122), "jobs.afritechbridge.online", font=domain_font, fill=TEAL)

    bg.convert("RGB").save(path, "JPEG", quality=88, optimize=True)
    print(f"wrote {os.path.basename(path)}")


def main() -> None:
    logo_source = Image.open(SOURCE).convert("RGBA")

    # PWA logos and touch icons (square, transparent)
    fit_logo(logo_source, 512).save(os.path.join(PUBLIC, "logo-512.png"), "PNG")
    fit_logo(logo_source, 192).save(os.path.join(PUBLIC, "logo-192.png"), "PNG")
    fit_logo(logo_source, 180).save(os.path.join(PUBLIC, "apple-touch-icon.png"), "PNG")
    fit_logo(logo_source, 32).save(os.path.join(PUBLIC, "favicon-32x32.png"), "PNG")
    fit_logo(logo_source, 16).save(os.path.join(PUBLIC, "favicon-16x16.png"), "PNG")

    # Multi-size .ico from the 32px art
    fit_logo(logo_source, 32).save(
        os.path.join(PUBLIC, "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48)]
    )
    print("wrote favicon set (16/32/180/192/512 + favicon.ico)")

    draw_og(
        os.path.join(PUBLIC, "og-image.jpg"),
        "AfriTech Opportunities",
        "Jobs, scholarships & internships in Rwanda and across Africa",
        logo_source,
    )
    draw_og(
        os.path.join(PUBLIC, "home-og-image.jpg"),
        "AfriTech Opportunities",
        "Discover your next career opportunity in Rwanda and Africa",
        logo_source,
    )
    draw_og(
        os.path.join(PUBLIC, "jobs-og-image.jpg"),
        "Find Jobs",
        "Browse job openings from leading employers across Africa",
        logo_source,
    )
    draw_og(
        os.path.join(PUBLIC, "scholarships-og-image.jpg"),
        "Find Scholarships",
        "Scholarships and financial aid for students across Africa",
        logo_source,
    )
    draw_og(
        os.path.join(PUBLIC, "scholarship-og-image.jpg"),
        "Scholarship Details",
        "Eligibility, deadlines and how to apply",
        logo_source,
    )


if __name__ == "__main__":
    main()
