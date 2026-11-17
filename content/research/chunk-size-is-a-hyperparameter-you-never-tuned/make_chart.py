"""Draw the equal-budget chart from results/analysis.json.

Usage: python make_chart.py RESULTS_DIR OUT_SVG
"""
import json
import sys
from pathlib import Path

a = json.loads((Path(sys.argv[1]) / "analysis.json").read_text())
SIZES = [64, 128, 256, 512, 1024]
BG, INK, ACC, GRID, MUTE = "#30302E", "#FAF9F5", "#D97757", "#4A4A45", "#B0AEA5"
SANS = "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
MONO = "ui-monospace, SFMono-Regular, Menlo, monospace"
W, H, L, R, T, B = 940, 460, 80, 880, 110, 380


def x(i):
    return L + 60 + i * (R - L - 120) / 4


def y(v):
    return B - v * (B - T)


def get(ret, size):
    return a["budget"][f"{ret}_2000_{size}"]


o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" '
     f'aria-label="Chart: share of questions whose answer reaches the model with a 2,000-token context, by chunk size. BM25 stays between 87 and 92 percent at every size from 64 to 1,024 tokens. The embedding model falls from 90 percent at 64 tokens to 51 percent at 1,024.">',
     f'<rect width="{W}" height="{H}" fill="{BG}"/>',
     f'<text x="40" y="34" font-family="{SANS}" font-size="16" fill="{INK}">Answer reaches the model, 2,000 tokens of context, by chunk size</text>',
     f'<text x="40" y="54" font-family="{SANS}" font-size="12" fill="{MUTE}">SQuAD v1.1 dev, 10,570 questions, top-k chunks, k = 2,000 divided by chunk size, rounded</text>']
for v in (0, 0.25, 0.5, 0.75, 1.0):
    o.append(f'<path d="M{L} {y(v):.1f}H{R}" stroke="{GRID}" stroke-width="1"/>')
    o.append(f'<text x="{L - 12}" y="{y(v) + 4:.1f}" text-anchor="end" font-family="{MONO}" font-size="12" fill="{MUTE}">{int(v * 100)}%</text>')
for i, s in enumerate(SIZES):
    o.append(f'<path d="M{x(i):.1f} {B}v6" stroke="{MUTE}" stroke-width="1"/>')
    k = int(2000 / s + 0.5)
    o.append(f'<text x="{x(i):.1f}" y="{B + 24}" text-anchor="middle" font-family="{MONO}" font-size="12" fill="{MUTE}">{s}</text>')
    o.append(f'<text x="{x(i):.1f}" y="{B + 40}" text-anchor="middle" font-family="{MONO}" font-size="11" fill="{MUTE}">k={k}</text>')
o.append(f'<text x="{(L + R) / 2}" y="{H - 8}" text-anchor="middle" font-family="{SANS}" font-size="12" fill="{MUTE}">chunk size in tokens (o200k_base), no overlap</text>')
for ret, col, label, _ in (("bm25", INK, "BM25", 0), ("embed", ACC, "bge-small embeddings", 0)):
    other = "embed" if ret == "bm25" else "bm25"
    pts = [(x(i), y(get(ret, s)["recall"])) for i, s in enumerate(SIZES)]
    o.append('<path d="M' + "L".join(f"{px:.1f} {py:.1f}" for px, py in pts) + f'" fill="none" stroke="{col}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>')
    for (px, py), s in zip(pts, SIZES):
        v = get(ret, s)["recall"] * 100
        dy = -12 if get(ret, s)["recall"] >= get(other, s)["recall"] else 22
        o.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="4" fill="{col}"/>')
        o.append(f'<text x="{px:.1f}" y="{py + dy:.1f}" text-anchor="middle" font-family="{MONO}" font-size="12" fill="{col}">{v:.0f}</text>')
o.append(f'<circle cx="{L + 8}" cy="86" r="4" fill="{INK}"/><text x="{L + 20}" y="90" font-family="{SANS}" font-size="13" fill="{INK}">BM25</text>')
o.append(f'<circle cx="{L + 90}" cy="86" r="4" fill="{ACC}"/><text x="{L + 102}" y="90" font-family="{SANS}" font-size="13" fill="{ACC}">bge-small embeddings</text>')
o.append("</svg>")
Path(sys.argv[2]).write_text("\n".join(o) + "\n")
