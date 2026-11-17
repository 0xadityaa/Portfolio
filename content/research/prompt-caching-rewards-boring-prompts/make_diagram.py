"""Draws public/images/blog/cache-cost-vs-traffic.svg from the analytic model in
cost_model.py (the simulation matches it to within sampling noise; see
results/simulation.txt). Standard library only."""
import json
import math
import pathlib

import cost_model as cm

HERE = pathlib.Path(__file__).parent
OUT = HERE.parent.parent.parent / "public" / "images" / "blog" / "cache-cost-vs-traffic.svg"

s = cm.P["models"]["anthropic-sonnet-5.5"]
STATIC, DYNAMIC = 6000, 500
nocache = (STATIC + DYNAMIC) * s["base"] / 1e6


def cost(rate, write, ttl):
    return (STATIC * cm.expected_prefix_cost(rate, s["base"], write, s["read"], ttl) + DYNAMIC * s["base"]) / 1e6


W, H = 900, 540
L, R, T, B = 86, 40, 120, 70
XMIN, XMAX, YMAX = 0.1, 600.0, 0.024
BG, INK, ACC = "#30302E", "#FAF9F5", "#D97757"
MUTED = "#A8A59A"


def X(r):
    return L + (math.log10(r) - math.log10(XMIN)) / (math.log10(XMAX) - math.log10(XMIN)) * (W - L - R)


def Y(c):
    return H - B - c / YMAX * (H - T - B)


def path(write, ttl):
    pts = []
    n = 160
    for i in range(n + 1):
        r = 10 ** (math.log10(XMIN) + i / n * (math.log10(XMAX) - math.log10(XMIN)))
        pts.append(f"{X(r):.1f},{Y(cost(r, write, ttl)):.1f}")
    return "M" + " L".join(pts)


x5 = cm.crossover_rate_per_hour(s["base"], s["write_short"], s["read"], 5)
x1 = cm.crossover_rate_per_hour(s["base"], s["write_long"], s["read"], 60)

parts = []
a = parts.append
a(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-labelledby="t d">')
a('<title id="t">Cost per request against traffic, for no cache, a 5-minute cache and a 1-hour cache</title>')
a('<desc id="d">Line chart on a log scale from 0.1 to 600 requests per hour. Without caching a 6,500-token request costs 1.3 cents. '
  'The 5-minute cache costs more than that below 2.8 requests per hour and falls to 0.16 cents at high traffic. '
  'The 1-hour cache costs more than no cache only below 0.72 requests per hour.</desc>')
a(f'<rect width="{W}" height="{H}" fill="{BG}"/>')
a(f'<text x="{L}" y="44" fill="{INK}" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="22" font-weight="600">Under 3 requests an hour, the 5-minute cache costs more than none</text>')
a(f'<text x="{L}" y="72" fill="{MUTED}" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="14">Input cost per request. Sonnet 5.5, 6,000 static + 500 per-request tokens, Poisson arrivals</text>')
# y grid
for c in (0, 0.005, 0.010, 0.015, 0.020):
    y = Y(c)
    a(f'<line x1="{L}" x2="{W - R}" y1="{y:.1f}" y2="{y:.1f}" stroke="{INK}" stroke-opacity="0.14"/>')
    a(f'<text x="{L - 10}" y="{y + 5:.1f}" text-anchor="end" fill="{MUTED}" font-family="system-ui,sans-serif" font-size="14">${c:.3f}</text>')
# x ticks
for r, lab in ((0.1, "0.1"), (1, "1"), (10, "10"), (60, "1/min"), (600, "10/min")):
    x = X(r)
    a(f'<line x1="{x:.1f}" x2="{x:.1f}" y1="{T}" y2="{H - B}" stroke="{INK}" stroke-opacity="0.08"/>')
    a(f'<text x="{x:.1f}" y="{H - B + 24}" text-anchor="middle" fill="{MUTED}" font-family="system-ui,sans-serif" font-size="14">{lab}</text>')
a(f'<text x="{(L + W - R) / 2:.0f}" y="{H - 16}" text-anchor="middle" fill="{MUTED}" font-family="system-ui,sans-serif" font-size="14">requests per hour (log scale)</text>')
# lines
a(f'<line x1="{L}" x2="{W - R}" y1="{Y(nocache):.1f}" y2="{Y(nocache):.1f}" stroke="{MUTED}" stroke-width="2" stroke-dasharray="7 6"/>')
a(f'<path d="{path(s["write_long"], 60)}" fill="none" stroke="{INK}" stroke-width="3"/>')
a(f'<path d="{path(s["write_short"], 5)}" fill="none" stroke="{ACC}" stroke-width="3.5"/>')
# labels
a(f'<text x="{W - R}" y="{Y(nocache) - 10:.1f}" text-anchor="end" fill="{MUTED}" font-family="system-ui,sans-serif" font-size="15">no cache: $0.0130</text>')
a(f'<text x="{X(1.9) + 10:.1f}" y="{Y(cost(1.9, s["write_long"], 60)) + 5:.1f}" fill="{INK}" font-family="system-ui,sans-serif" font-size="15">1-hour cache</text>')
a(f'<text x="{X(14) + 10:.1f}" y="{Y(cost(14, s["write_short"], 5)) - 8:.1f}" fill="{ACC}" font-family="system-ui,sans-serif" font-size="15" font-weight="600">5-minute cache</text>')
# crossovers
for xr, col, lab, dx, dy, anchor in ((x5, ACC, f"{x5:.1f}/hr", 12, -16, "start"), (x1, INK, f"{x1:.2f}/hr", -12, 24, "end")):
    cx, cy = X(xr), Y(nocache)
    a(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="6" fill="{BG}" stroke="{col}" stroke-width="3"/>')
    a(f'<text x="{cx + dx:.1f}" y="{cy + dy:.1f}" text-anchor="{anchor}" fill="{col}" font-family="system-ui,sans-serif" font-size="14" font-weight="600">breaks even at {lab}</text>')
a("</svg>")
OUT.write_text("\n".join(parts) + "\n")
print(f"wrote {OUT}; crossovers {x5:.2f}/hr (5m), {x1:.2f}/hr (1h)")
