#!/usr/bin/env python3
"""Generates the LevelWorks Facebook/Instagram Stories ad (1080x1920).

Usage:
    python3 generate_ad.py

To make a variation: edit the CONFIG block below (copy text, colors, or the
dashboard screenshot / crop box) and re-run. Everything else auto-fits.

Requires: pillow (pip install pillow)
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = Path(__file__).parent
ASSETS = HERE / "assets"
FONTS = ASSETS / "fonts"
OUTPUT = HERE / "output" / "ad_1080x1920.png"

# ---------------------------------------------------------------------------
# CONFIG — edit these to make a variation
# ---------------------------------------------------------------------------

CANVAS_W, CANVAS_H = 1080, 1920

BG_COLOR = (10, 10, 11)          # #0A0A0B — near-black, not pure black
WHITE = (255, 255, 255)
BLUE = (37, 99, 235)             # #2563EB — LevelWorks blue
MUTED_TEXT = (168, 174, 184)     # soft grey for secondary labels

KICKER_TEXT = "ALL FOR $5/MONTH"
HEADLINE_LINES = ["Run your business.", "Not your paperwork."]
URL_TEXT = "LEVELWORKS.ORG"

FEATURES = [
    "Unlimited estimates & invoices",
    "Client signs from their phone",
    "Card payments straight to your bank",
    "Your logo, not ours",
]

BOTTOM_LINE = "30 days free. No credit card."

# Source screenshot for the phone mockup + the crop box (left, top, right,
# bottom) that isolates the 4 stat tiles + the estimate card below them,
# with the status bar / nav / "Add to Phone" button excluded. Re-derive this
# box with a new screenshot by finding where the near-black page background
# (~10,10,10) gives way to the card background (~25-33 grey) — see the crop
# notes in ad-creative/README.md.
DASHBOARD_SCREENSHOT = ASSETS / "dashboard_screenshot.webp"
CROP_BOX = (0, 976, 924, 1942)

# The source screenshot's estimate card names a real client. These get
# painted over the original text (same position, same card background) so
# no real customer name/job ever appears in the ad. Coordinates are relative
# to CROP_BOX (i.e. already cropped, pre-resize).
CARD_JOB_NAME = "Hall Bathroom"
CARD_CLIENT_NAME = "Mary Josephs"
CARD_BG = (28, 28, 30)
CARD_JOB_NAME_BOX = (60, 762, 600, 808)   # (left, top, right, bottom)
CARD_CLIENT_NAME_BOX = (60, 819, 600, 858)

# Safe margins so Instagram Stories UI (profile chip up top, reply bar/CTA
# strip at the bottom) never overlaps the content.
TOP_SAFE = 190
BOTTOM_SAFE = 190
SIDE_MARGIN = 90

PHONE_FRAME_WIDTH = 640
PHONE_BEZEL = 16
PHONE_CORNER_RADIUS = 56
PHONE_INNER_RADIUS = 40

# ---------------------------------------------------------------------------
# Fonts
# ---------------------------------------------------------------------------


def font(weight, size):
    return ImageFont.truetype(str(FONTS / f"Inter-{weight}.ttf"), size)


# ---------------------------------------------------------------------------
# Text helpers
# ---------------------------------------------------------------------------


def text_width(draw, text, f, tracking=0):
    if tracking == 0:
        return draw.textlength(text, font=f)
    return sum(draw.textlength(ch, font=f) + tracking for ch in text) - tracking


def draw_tracked_text(draw, center_x, y, text, f, fill, tracking=0):
    """Draws text horizontally centered at center_x with letter tracking."""
    w = text_width(draw, text, f, tracking)
    x = center_x - w / 2
    for ch in text:
        draw.text((x, y), ch, font=f, fill=fill)
        x += draw.textlength(ch, font=f) + tracking


def fit_font_size(draw, lines, weight, max_width, start_size, min_size=28):
    """Shrinks font size until every line fits within max_width."""
    size = start_size
    while size > min_size:
        f = font(weight, size)
        if all(draw.textlength(line, font=f) <= max_width for line in lines):
            return f
        size -= 2
    return font(weight, min_size)


def wrap_to_width(draw, text, f, max_width, max_lines=2):
    words = text.split()
    lines, current = [], ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textlength(candidate, font=f) <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
        if len(lines) == max_lines - 1 and word == words[-1]:
            pass
    if current:
        lines.append(current)
    return lines[:max_lines]


def line_height(f):
    ascent, descent = f.getmetrics()
    return ascent + descent


def blend(c1, c2, t):
    return tuple(round(a + (b - a) * t) for a, b in zip(c1, c2))


def draw_kicker_pill(draw, center_x, y, text):
    """Small rounded price badge — the attention-grabbing hook above the headline."""
    f = font("800", 56)
    tracking = 2
    text_w = text_width(draw, text, f, tracking)
    pad_x, pad_y = 44, 26
    th = line_height(f)
    pill_w = text_w + 2 * pad_x
    pill_h = th + 2 * pad_y

    box = [center_x - pill_w / 2, y, center_x + pill_w / 2, y + pill_h]
    draw.rounded_rectangle(box, radius=pill_h / 2, fill=blend(BG_COLOR, BLUE, 0.20))
    draw.rounded_rectangle(box, radius=pill_h / 2, outline=BLUE, width=3)

    draw_tracked_text(draw, center_x, y + pad_y, text, f, BLUE, tracking=tracking)
    return pill_h


# ---------------------------------------------------------------------------
# Phone mockup
# ---------------------------------------------------------------------------


def rounded_mask(size, radius):
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [(0, 0), (size[0] - 1, size[1] - 1)], radius=radius, fill=255
    )
    return mask


def redact_estimate_card(crop):
    """Paints over the real client name/job from the source screenshot."""
    draw = ImageDraw.Draw(crop)
    draw.rectangle(CARD_JOB_NAME_BOX, fill=CARD_BG)
    draw.rectangle(CARD_CLIENT_NAME_BOX, fill=CARD_BG)

    x0, y0 = CARD_JOB_NAME_BOX[0], CARD_JOB_NAME_BOX[1]
    draw.text((x0 + 21, y0 - 8), CARD_JOB_NAME, font=font("700", 32), fill=WHITE)

    x1, y1 = CARD_CLIENT_NAME_BOX[0], CARD_CLIENT_NAME_BOX[1]
    draw.text((x1 + 22, y1 - 4), CARD_CLIENT_NAME, font=font("500", 26), fill=MUTED_TEXT)
    return crop


def build_phone_mockup(frame_width):
    screenshot = Image.open(DASHBOARD_SCREENSHOT).convert("RGB")
    crop = screenshot.crop(CROP_BOX)
    crop = redact_estimate_card(crop)

    inner_w = frame_width - 2 * PHONE_BEZEL
    inner_h = round(inner_w * crop.height / crop.width)
    crop = crop.resize((inner_w, inner_h), Image.LANCZOS)

    frame_h = inner_h + 2 * PHONE_BEZEL
    frame = Image.new("RGBA", (frame_width, frame_h), (0, 0, 0, 0))

    # Bezel
    bezel_mask = rounded_mask((frame_width, frame_h), PHONE_CORNER_RADIUS)
    bezel_layer = Image.new("RGBA", (frame_width, frame_h), (22, 24, 28, 255))
    frame.paste(bezel_layer, (0, 0), bezel_mask)

    # Subtle blue-tinted border ring
    border = Image.new("RGBA", (frame_width, frame_h), (0, 0, 0, 0))
    bd = ImageDraw.Draw(border)
    bd.rounded_rectangle(
        [(0, 0), (frame_width - 1, frame_h - 1)],
        radius=PHONE_CORNER_RADIUS,
        outline=(70, 110, 220, 160),
        width=2,
    )
    frame = Image.alpha_composite(frame, border)

    # Screenshot content, clipped to inner rounded rect
    content_mask = rounded_mask((inner_w, inner_h), PHONE_INNER_RADIUS)
    content_rgba = crop.convert("RGBA")
    content_rgba.putalpha(content_mask)
    frame.paste(content_rgba, (PHONE_BEZEL, PHONE_BEZEL), content_rgba)

    return frame


def build_glow(size, color, blur_radius, alpha=90):
    glow = Image.new("RGBA", size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    w, h = size
    gd.ellipse(
        [w * 0.12, h * 0.12, w * 0.88, h * 0.88],
        fill=(*color, alpha),
    )
    return glow.filter(ImageFilter.GaussianBlur(blur_radius))


# ---------------------------------------------------------------------------
# Main composition
# ---------------------------------------------------------------------------


def main():
    img = Image.new("RGB", (CANVAS_W, CANVAS_H), BG_COLOR)
    draw = ImageDraw.Draw(img)

    max_text_width = CANVAS_W - 2 * SIDE_MARGIN
    center_x = CANVAS_W // 2
    y = TOP_SAFE

    # --- Kicker (price hook) ---------------------------------------------
    pill_h = draw_kicker_pill(draw, center_x, y, KICKER_TEXT)
    y += pill_h + 22

    # --- Headline -----------------------------------------------------
    headline_font = fit_font_size(
        draw, HEADLINE_LINES, "900", max_text_width, start_size=80, min_size=56
    )
    hl_line_height = line_height(headline_font)
    for line in HEADLINE_LINES:
        draw.text((center_x, y), line, font=headline_font, fill=WHITE, anchor="ma")
        y += int(hl_line_height * 1.04)

    y += 20

    # --- URL ------------------------------------------------------------
    url_font = font("700", 34)
    draw_tracked_text(draw, center_x, y, URL_TEXT, url_font, BLUE, tracking=3)
    y += line_height(url_font) + 44

    # --- Feature grid (2x2) ---------------------------------------------
    grid_width = min(920, max_text_width)
    col_gap = 56
    col_width = (grid_width - col_gap) // 2
    grid_left = center_x - grid_width // 2

    feature_font = font("600", 28)
    icon_d = 44
    row_gap = 26
    text_top_gap = 16

    positions = [
        (grid_left, col_width),
        (grid_left + col_width + col_gap, col_width),
    ]

    row_y = y
    for row in range(2):
        row_height = 0
        for col in range(2):
            idx = row * 2 + col
            if idx >= len(FEATURES):
                continue
            col_x, col_w = positions[col]
            cell_center_x = col_x + col_w // 2

            # Icon: filled circle + checkmark
            icon_box = [
                cell_center_x - icon_d // 2,
                row_y,
                cell_center_x + icon_d // 2,
                row_y + icon_d,
            ]
            draw.ellipse(icon_box, fill=BLUE)
            cx, cy = cell_center_x, row_y + icon_d // 2
            draw.line(
                [(cx - 11, cy + 1), (cx - 3, cy + 10), (cx + 13, cy - 10)],
                fill=WHITE,
                width=4,
                joint="curve",
            )

            text_y = row_y + icon_d + text_top_gap
            lines = wrap_to_width(draw, FEATURES[idx], feature_font, col_w - 10)
            fh = line_height(feature_font)
            for line in lines:
                draw.text(
                    (cell_center_x, text_y),
                    line,
                    font=feature_font,
                    fill=MUTED_TEXT,
                    anchor="ma",
                )
                text_y += int(fh * 1.12)

            cell_height = icon_d + text_top_gap + len(lines) * int(fh * 1.12)
            row_height = max(row_height, cell_height)

        row_y += row_height + row_gap

    y = row_y - row_gap + 36

    # --- Phone mockup -----------------------------------------------------
    phone = build_phone_mockup(PHONE_FRAME_WIDTH)
    phone_x = center_x - phone.width // 2
    phone_y = y

    glow = build_glow(
        (phone.width + 240, phone.height + 240), BLUE, blur_radius=90, alpha=70
    )
    glow_pos = (phone_x - 120, phone_y - 120)
    base_rgba = img.convert("RGBA")
    base_rgba.alpha_composite(glow, glow_pos)
    base_rgba.alpha_composite(phone, (phone_x, phone_y))
    img = base_rgba.convert("RGB")
    draw = ImageDraw.Draw(img)

    y = phone_y + phone.height + 32

    # --- Bottom line --------------------------------------------------
    bottom_font = fit_font_size(
        draw, [BOTTOM_LINE], "600", max_text_width, start_size=42, min_size=28
    )
    draw.text((center_x, y), BOTTOM_LINE, font=bottom_font, fill=WHITE, anchor="ma")
    y += line_height(bottom_font)

    bottom_edge = CANVAS_H - BOTTOM_SAFE
    if y > bottom_edge:
        print(f"Warning: content extends {y - bottom_edge}px into the bottom safe zone.")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUTPUT, "PNG")
    print(f"Saved {OUTPUT} ({img.width}x{img.height})")


if __name__ == "__main__":
    main()
