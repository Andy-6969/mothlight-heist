"""Lantern Cartography: the Mothlight key-art sheet (README only, never a game screenshot).

Run: python docs/poster/make_poster.py <fonts dir>   writes docs/poster/mothlight-poster.png
"""
import math
import os
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

FONTS = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1600, 1000
S = 2  # draw at twice the size, then downsample for crisp edges

INK = (13, 31, 39)
GRID = (30, 64, 76)
AMBER = (255, 182, 72)
HOT = (255, 86, 61)
VIOLET = (181, 140, 255)
WING = (150, 214, 255)
GOLD = (255, 213, 74)
PAPER = (232, 222, 200)


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size * S)


def fan(layer, cx, cy, angle, half, rng, color, steps=22):
    """A lantern wedge built from stacked translucent slivers, brightest at the source."""
    d = ImageDraw.Draw(layer)
    for i in range(steps, 0, -1):
        r = rng * i / steps
        a = int(10 + 120 * (1 - i / steps) ** 1.6)
        box = [cx - r, cy - r, cx + r, cy + r]
        d.pieslice(box, math.degrees(angle - half), math.degrees(angle + half), fill=color + (a,))


def main():
    img = Image.new("RGB", (W * S, H * S), INK)
    d = ImageDraw.Draw(img)
    # survey grid
    for x in range(0, W * S, 20 * S):
        d.line([(x, 0), (x, H * S)], fill=GRID if x % (100 * S) == 0 else (20, 44, 54), width=1)
    for y in range(0, H * S, 20 * S):
        d.line([(0, y), (W * S, y)], fill=GRID if y % (100 * S) == 0 else (20, 44, 54), width=1)

    light = Image.new("RGBA", img.size, (0, 0, 0, 0))
    wardens = [
        (470, 300, 0.35, AMBER), (1130, 250, 2.55, AMBER), (980, 720, -2.2, HOT), (360, 760, -0.75, AMBER),
    ]
    for x, y, a, c in wardens:
        fan(light, x * S, y * S, a, 0.52, 340 * S, c)
    for x, y, a in [(800, 120, 1.57), (1460, 520, 3.0)]:
        fan(light, x * S, y * S, a, 0.34, 300 * S, VIOLET, steps=14)
    img = Image.alpha_composite(img.convert("RGBA"), light)
    d = ImageDraw.Draw(img)

    # patrol loops: dotted, even
    loops = [[(470, 300), (700, 300), (700, 420), (470, 420)], [(1130, 250), (1300, 250), (1300, 400)], [(980, 720), (760, 720), (760, 600)]]
    for loop in loops:
        pts = loop + [loop[0]]
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            n = int(math.hypot(x1 - x0, y1 - y0) / 9)
            for k in range(n):
                t = k / max(1, n)
                px, py = (x0 + (x1 - x0) * t) * S, (y0 + (y1 - y0) * t) * S
                d.ellipse([px - 2 * S, py - 2 * S, px + 2 * S, py + 2 * S], fill=AMBER + (190,))

    # the moth's route: the dark channel between the fans
    route = [(140, 900), (300, 640), (610, 560), (820, 470), (1000, 470), (1210, 560), (1330, 470)]
    for (x0, y0), (x1, y1) in zip(route, route[1:]):
        d.line([(x0 * S, y0 * S), (x1 * S, y1 * S)], fill=WING + (230,), width=3 * S)
    for x, y in route[1:-1]:
        d.ellipse([(x - 5) * S, (y - 5) * S, (x + 5) * S, (y + 5) * S], outline=WING + (255,), width=2 * S)

    # wardens and cameras as small precise marks
    for x, y, a, c in wardens:
        d.ellipse([(x - 11) * S, (y - 11) * S, (x + 11) * S, (y + 11) * S], fill=(194, 70, 58), outline=PAPER, width=2 * S)
    for x, y, a in [(800, 120, 1.57), (1460, 520, 3.0)]:
        d.rectangle([(x - 9) * S, (y - 7) * S, (x + 9) * S, (y + 7) * S], fill=(216, 210, 232))

    # the target: one small gold point everything leans toward
    tx, ty = 1330, 470
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse([(tx - 70) * S, (ty - 70) * S, (tx + 70) * S, (ty + 70) * S], fill=GOLD + (120,))
    glow = glow.filter(ImageFilter.GaussianBlur(30 * S))
    img = Image.alpha_composite(img, glow)
    d = ImageDraw.Draw(img)
    d.ellipse([(tx - 9) * S, (ty - 13) * S, (tx + 1) * S, (ty + 13) * S], fill=GOLD)
    d.ellipse([(tx - 1) * S, (ty - 13) * S, (tx + 9) * S, (ty + 13) * S], fill=GOLD)

    # the moth itself, at the start of the route
    mx, my = 140, 900
    d.ellipse([(mx - 22) * S, (my - 12) * S, (mx - 2) * S, (my + 12) * S], fill=WING)
    d.ellipse([(mx + 2) * S, (my - 12) * S, (mx + 22) * S, (my + 12) * S], fill=WING)
    d.ellipse([(mx - 3) * S, (my - 10) * S, (mx + 3) * S, (my + 10) * S], fill=(38, 50, 58))

    # margin annotations, engraver-quiet
    title = font("Italiana-Regular.ttf", 120)
    small = font("Jura-Light.ttf", 17)
    d.text((70 * S, 60 * S), "MOTHLIGHT", font=title, fill=PAPER)
    d.text((76 * S, 200 * S), "heists of vellmar   sheet 3 of 3   scale 1 : 32", font=small, fill=(159, 181, 186))
    for i, label in enumerate(["warden", "camera", "route", "target"]):
        y = (840 + i * 30) * S
        x = 1270 * S
        col = [AMBER, VIOLET, WING, GOLD][i]
        d.rectangle([x, y + 4 * S, x + 18 * S, y + 16 * S], fill=col)
        d.text((x + 30 * S, y), label, font=small, fill=(159, 181, 186))
    for k in range(0, W, 100):
        d.text(((k + 4) * S, (H - 26) * S), f"{k // 100:02d}", font=font("Jura-Light.ttf", 12), fill=(70, 110, 122))

    img = img.convert("RGB").resize((W, H), Image.LANCZOS)
    img.save(os.path.join(HERE, "mothlight-poster.png"), optimize=True)


if __name__ == "__main__":
    main()
