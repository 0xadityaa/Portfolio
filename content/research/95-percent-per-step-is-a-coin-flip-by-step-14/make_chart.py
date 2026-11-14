#!/usr/bin/env python3
"""Draws the p^n chart as SVG. Run: python3 make_chart.py ../../../public/images/blog/success-vs-steps.svg"""
import math
import sys

W, H = 940, 440
X0, X1, Y0, Y1 = 80, 880, 340, 60  # plot box: x from X0 to X1, y from Y0 (0%) to Y1 (100%)
MAX_N = 70
SANS = "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
MONO = "ui-monospace, SFMono-Regular, Menlo, monospace"


def sx(n):
    return X0 + (X1 - X0) * n / MAX_N


def sy(v):
    return Y0 + (Y1 - Y0) * v


def curve(p, color, width):
    d = "M" + "L".join(f"{sx(n):.1f} {sy(p ** n):.1f}" for n in range(0, MAX_N + 1))
    return f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linecap="round"/>'


def text(x, y, s, size, fill, anchor="start", font=SANS):
    return f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}" font-family="{font}" font-size="{size}" fill="{fill}">{s}</text>'


parts = [
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" '
    'aria-label="Chart: chance an agent finishes every step against number of steps. At 95% per step it falls to 49% by step 14. '
    'At 90% it crosses 50% by step 7 and at 99% by step 69.">',
    f'<rect width="{W}" height="{H}" fill="#30302E"/>',
    text(40, 36, "Chance an agent run finishes with no failed step", 16, "#FAF9F5"),
]
for v, label in [(0, "0%"), (0.25, "25%"), (0.5, "50%"), (0.75, "75%"), (1, "100%")]:
    y = sy(v)
    parts.append(f'<path d="M{X0} {y:.1f}H{X1}" stroke="#4A4A45" stroke-width="1"/>')
    parts.append(text(68, y + 4, label, 12, "#B0AEA5", "end", MONO))
for n in (0, 10, 20, 30, 40, 50, 60, 70):
    parts.append(f'<path d="M{sx(n):.1f} {Y0}v6" stroke="#B0AEA5" stroke-width="1"/>')
    parts.append(text(sx(n), 364, str(n), 12, "#B0AEA5", "middle", MONO))
parts.append(text((X0 + X1) / 2, 392, "steps in the run (each step succeeds with probability p, independently)", 13, "#B0AEA5", "middle"))

parts.append(curve(0.99, "#B0AEA5", 2.5))
parts.append(curve(0.90, "#B0AEA5", 2.5))
parts.append(curve(0.95, "#D97757", 3))
parts.append(f'<path d="M{X0} {sy(0.5):.1f}H{X1}" stroke="#FAF9F5" stroke-width="1" stroke-dasharray="3 6"/>')

# labels
parts.append(text(sx(40) + 8, sy(0.99 ** 40) - 8, "p = 0.99", 13, "#FAF9F5"))
parts.append(text(sx(34), sy(0.95 ** 34) - 14, "p = 0.95", 13, "#D97757"))
parts.append(text(sx(9) + 6, sy(0.90 ** 9) - 10, "p = 0.90", 13, "#FAF9F5"))
# the one thing to notice: 0.95^14
cx, cy = sx(14), sy(0.95 ** 14)
parts.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="5" fill="#D97757"/>')
parts.append(text(cx + 12, cy - 14, "step 14: 0.95^14 = 0.49", 13, "#D97757", "start", MONO))
parts.append(text(X1, sy(0.5) - 8, "coin flip", 12, "#FAF9F5", "end", MONO))
parts.append("</svg>")
open(sys.argv[1], "w").write("".join(parts))
