"""Draw recall at equal token budgets for four pipelines (256-token chunks, pool 20).

Usage: python make_chart.py RESULTS_DIR OUT_SVG
Reads results/ranks.npz, so it does not depend on analyze.py having run.
"""
import sys
from pathlib import Path

import numpy as np

res, out = Path(sys.argv[1]), Path(sys.argv[2])
R = np.load(res / "ranks.npz")
N = int(R["n_done"])

BG, INK, MUTED, GRID, ACCENT = "#30302E", "#FAF9F5", "#B0AEA5", "#4A4A45", "#D97757"
SANS = "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
MONO = "ui-monospace, SFMono-Regular, Menlo, monospace"
PIPES = [("bm25_256", "BM25", ""), ("rrf_256", "RRF", ""), ("bm25_rr20_256", "BM25", "+ rerank"), ("rrf_rr20_256", "RRF", "+ rerank")]
BUDGETS = [(500, 2), (1000, 4), (2000, 8)]
W, H = 940, 500
x0, x1, ytop, ybot = 80, 900, 110, 380
lo_v, hi_v = 0.70, 1.0


def y(v):
    return ybot - (v - lo_v) / (hi_v - lo_v) * (ybot - ytop)


val = {(p, B): float((R[p][:N] <= k).mean()) for p, _, _ in PIPES for B, k in BUDGETS}
alt = (f"Bar chart of recall at equal token budgets, 256-token chunks, {N:,} SQuAD questions. At 2,000 tokens BM25 gets "
       f"{val[('bm25_256', 2000)] * 100:.1f} percent, RRF {val[('rrf_256', 2000)] * 100:.1f}, BM25 with a reranker {val[('bm25_rr20_256', 2000)] * 100:.1f} "
       f"and RRF with a reranker {val[('rrf_rr20_256', 2000)] * 100:.1f}: RRF alone ties BM25 plus reranker. At 500 tokens the reranked "
       f"pipelines reach {val[('bm25_rr20_256', 500)] * 100:.1f} and {val[('rrf_rr20_256', 500)] * 100:.1f}, against {val[('rrf_256', 500)] * 100:.1f} for RRF alone.")
o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-label="{alt}">',
     f'<rect width="{W}" height="{H}" fill="{BG}"/>',
     f'<text x="40" y="34" font-family="{SANS}" font-size="16" fill="{INK}">At 2,000 tokens, RRF alone ties BM25 plus a reranker</text>',
     f'<text x="40" y="54" font-family="{SANS}" font-size="12" fill="{MUTED}">Recall at an equal token budget, 256-token chunks, SQuAD v1.1 dev, {N:,} questions, strict span hit, reranker reads the top 20</text>']
for t in (0.7, 0.8, 0.9, 1.0):
    o.append(f'<path d="M{x0} {y(t):.1f}H{x1}" stroke="{GRID}" stroke-width="1"/>')
    o.append(f'<text x="{x0 - 12}" y="{y(t) + 4:.1f}" text-anchor="end" font-family="{MONO}" font-size="12" fill="{MUTED}">{int(round(t * 100))}%</text>')
gw = (x1 - x0) / len(BUDGETS)
bw = 50
for gi, (B, k) in enumerate(BUDGETS):
    gx = x0 + gi * gw
    inner = len(PIPES) * (bw + 8) - 8
    start = gx + (gw - inner) / 2
    for pi, (p, label, sub) in enumerate(PIPES):
        v = val[(p, B)]
        bx = start + pi * (bw + 8)
        fill = ACCENT if sub else INK
        o.append(f'<rect x="{bx:.1f}" y="{y(v):.1f}" width="{bw}" height="{ybot - y(v):.1f}" fill="{fill}" opacity="{1 if sub else 0.8}"/>')
        o.append(f'<text x="{bx + bw / 2:.1f}" y="{y(v) - 6:.1f}" text-anchor="middle" font-family="{MONO}" font-size="12" fill="{fill}">{v * 100:.1f}</text>')
        o.append(f'<text x="{bx + bw / 2:.1f}" y="{ybot + 16}" text-anchor="middle" font-family="{SANS}" font-size="11" fill="{MUTED}">{label}</text>')
        if sub:
            o.append(f'<text x="{bx + bw / 2:.1f}" y="{ybot + 29}" text-anchor="middle" font-family="{SANS}" font-size="11" fill="{MUTED}">{sub}</text>')
    o.append(f'<text x="{gx + gw / 2:.1f}" y="{ybot + 60}" text-anchor="middle" font-family="{SANS}" font-size="13" fill="{INK}">{B:,} tokens of context (k = {k})</text>')
o.append(f'<text x="{x0}" y="{H - 14}" font-family="{SANS}" font-size="11" fill="{MUTED}">Axis starts at 70%. Orange bars are reranked pipelines. Intervals are in the post and results/analysis.txt.</text>')
o.append("</svg>")
out.write_text("\n".join(o) + "\n")
print("wrote", out)
