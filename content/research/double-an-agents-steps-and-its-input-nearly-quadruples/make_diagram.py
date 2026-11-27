#!/usr/bin/env python3
"""Draw cumulative input tokens against step for each strategy.

Reads results/series.json (written by model.py) and writes
public/images/blog/agent-input-tokens-by-strategy.svg
"""
import json
import pathlib

HERE = pathlib.Path(__file__).parent
OUT = HERE.parents[2] / "public" / "images" / "blog" / "agent-input-tokens-by-strategy.svg"
data = json.loads((HERE / "results" / "series.json").read_text())

W, H = 940, 460
L, R, T, B = 80, 700, 70, 390
XMAX = 100
YMAX = 10.5e6
INK, MUTED, GRID, ACCENT, BG = "#FAF9F5", "#B0AEA5", "#4A4A45", "#D97757", "#30302E"
SANS = "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
MONO = "ui-monospace, SFMono-Regular, Menlo, monospace"


def x(step):
    return L + (R - L) * step / XMAX


def y(v):
    return B - (B - T) * v / YMAX


STYLE = {
    "none": dict(label="no management", color=ACCENT, width=3.2, dash=None),
    "compact at 100k": dict(label="compact at 100k", color=INK, width=2, dash="7 5"),
    "clear-trigger (50k, keep 5)": dict(label="clear results (50k trigger)", color=INK, width=2, dash=None),
    "clear-sliding (keep 10)": dict(label="clear results older than 10", color=MUTED, width=2, dash=None),
    "compact every 25 steps": dict(label="compact every 25 steps", color=MUTED, width=2, dash="7 5"),
}

parts = [
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" '
    f'aria-label="Chart: cumulative input tokens against step for an agent loop. With no management the total reaches 10.1 million tokens by step 100; '
    f'clearing old tool results or compacting keeps it between 3.6 and 5.7 million">',
    f'<rect width="{W}" height="{H}" fill="{BG}"/>',
    f'<text x="40" y="36" font-family="{SANS}" font-size="16" fill="{INK}">Input tokens billed so far, by step (uncached)</text>',
]
for v in range(0, 11, 2):
    yy = y(v * 1e6)
    parts.append(f'<path d="M{L} {yy:.1f}H{R}" stroke="{GRID}" stroke-width="1"/>')
    parts.append(f'<text x="{L-12}" y="{yy+4:.1f}" text-anchor="end" font-family="{MONO}" font-size="12" fill="{MUTED}">{v}M</text>')
for s in (0, 25, 50, 75, 100):
    parts.append(f'<path d="M{x(s):.1f} {B}v6" stroke="{MUTED}" stroke-width="1"/>')
    parts.append(f'<text x="{x(s):.1f}" y="{B+24}" text-anchor="middle" font-family="{MONO}" font-size="12" fill="{MUTED}">{s}</text>')
parts.append(f'<text x="{(L+R)/2:.0f}" y="{B+48}" text-anchor="middle" font-family="{SANS}" font-size="13" fill="{MUTED}">steps taken</text>')

ends = []
for name, st in STYLE.items():
    cum = data[name]["cum"]
    pts = [(0, 0)] + [(i + 1, v) for i, v in enumerate(cum)]
    d = "M" + "L".join(f"{x(a):.1f} {y(b):.1f}" for a, b in pts)
    dash = f' stroke-dasharray="{st["dash"]}"' if st["dash"] else ""
    parts.append(f'<path d="{d}" fill="none" stroke="{st["color"]}" stroke-width="{st["width"]}" stroke-linecap="round"{dash}/>')
    ends.append([name, y(cum[-1]), cum[-1]])

# spread end labels so they do not overlap
ends.sort(key=lambda e: e[1])
GAP = 20
for i in range(1, len(ends)):
    if ends[i][1] - ends[i - 1][1] < GAP:
        ends[i][1] = ends[i - 1][1] + GAP
for name, ly, v in ends:
    st = STYLE[name]
    real_y = y(v)
    parts.append(f'<path d="M{x(100)+4:.1f} {real_y:.1f}L{R+14} {ly:.1f}" stroke="{st["color"]}" stroke-width="1"/>')
    parts.append(
        f'<text x="{R+20}" y="{ly+4:.1f}" font-family="{SANS}" font-size="13" fill="{st["color"]}">{st["label"]} '
        f'<tspan font-family="{MONO}" font-size="12">{v/1e6:.1f}M</tspan></text>'
    )

# annotation on the accent line
n10 = data["none"]["cum"][9]
n100 = data["none"]["cum"][99]
parts.append(
    f'<text x="{L+16}" y="{y(9.7e6):.1f}" font-family="{SANS}" font-size="13" fill="{ACCENT}">10 steps: {n10/1e6:.2f}M. 100 steps: {n100/1e6:.1f}M, {n100/n10:.0f}x for 10x the steps</text>'
)
parts.append("</svg>")
OUT.write_text("\n".join(parts) + "\n")
print("wrote", OUT)
