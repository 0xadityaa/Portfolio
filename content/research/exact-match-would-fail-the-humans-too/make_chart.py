"""Draw the diagram from results/analysis.json.

usage: python make_chart.py RESULTS_DIR OUT_SVG
"""
import json
import os
import sys

BG, INK, MUTED, ACCENT, GRID = "#30302E", "#FAF9F5", "#B0AEA5", "#D97757", "#4A4A45"
SANS = "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
MONO = "ui-monospace, SFMono-Regular, Menlo, monospace"
ROWS = ["EM", "F1 >= 0.5", "F1 >= 0.8", "cos >= 0.80", "cos >= 0.85", "cos >= 0.90", "cos >= 0.95"]
NICE = {"EM": "exact match", "F1 >= 0.5": "F1 ≥ 0.5", "F1 >= 0.8": "F1 ≥ 0.8",
        "cos >= 0.80": "cosine ≥ 0.80", "cos >= 0.85": "cosine ≥ 0.85",
        "cos >= 0.90": "cosine ≥ 0.90", "cos >= 0.95": "cosine ≥ 0.95"}


def main(res_dir, out):
    js = json.load(open(os.path.join(res_dir, "analysis.json")))
    human = {r: 100 * js["loo"][r]["fail"] for r in ROWS}
    adv = {r: 100 * js["adv"][r]["pass"] for r in ROWS}
    W, H = 940, 520
    x0, x1 = 190, 880  # bar area; 0..100 %
    top, row_h = 96, 56
    sx = lambda v: x0 + (x1 - x0) * v / 100
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" '
         f'aria-label="Bar chart: for each way of scoring an answer against a reference, the share of correct human answers it fails and the share of hand-written wrong answers it passes. Exact match fails {human["EM"]:.0f}% of correct answers and passes 0% of wrong ones. F1 at 0.5 fails {human["F1 >= 0.5"]:.0f}% and passes {adv["F1 >= 0.5"]:.0f}%. Cosine at 0.90 fails {human["cos >= 0.90"]:.0f}% and passes {adv["cos >= 0.90"]:.0f}%. No setting is low on both.">',
         f'<rect width="{W}" height="{H}" fill="{BG}"/>',
         f'<text x="40" y="36" font-family="{SANS}" font-size="16" fill="{INK}">Every way of scoring is wrong somewhere</text>',
         f'<rect x="40" y="56" width="12" height="12" fill="{MUTED}"/>',
         f'<text x="60" y="67" font-family="{SANS}" font-size="13" fill="{INK}">correct human answers it fails (n = 34,723)</text>',
         f'<rect x="400" y="56" width="12" height="12" fill="{ACCENT}"/>',
         f'<text x="420" y="67" font-family="{SANS}" font-size="13" fill="{ACCENT}">wrong answers it passes (n = 100, hand-written)</text>']
    for g in (0, 25, 50, 75, 100):
        o.append(f'<path d="M{sx(g):.1f} {top - 8}V{top + row_h * len(ROWS) - 6}" stroke="{GRID}" stroke-width="1"/>')
        o.append(f'<text x="{sx(g):.1f}" y="{top + row_h * len(ROWS) + 14}" text-anchor="middle" font-family="{MONO}" font-size="12" fill="{MUTED}">{g}%</text>')
    for i, r in enumerate(ROWS):
        y = top + i * row_h
        o.append(f'<text x="{x0 - 12}" y="{y + 22}" text-anchor="end" font-family="{SANS}" font-size="14" fill="{INK}">{NICE[r]}</text>')
        for k, (val, col, tcol) in enumerate([(human[r], MUTED, INK), (adv[r], ACCENT, ACCENT)]):
            by = y + k * 19
            w = max(sx(val) - x0, 1.5)
            o.append(f'<rect x="{x0}" y="{by}" width="{w:.1f}" height="16" fill="{col}"/>')
            o.append(f'<text x="{x0 + w + 8:.1f}" y="{by + 12.5}" font-family="{MONO}" font-size="12" fill="{tcol}">{val:.0f}%</text>')
    o.append("</svg>")
    open(out, "w").write("".join(o))


if __name__ == "__main__":
    main(*sys.argv[1:3])
