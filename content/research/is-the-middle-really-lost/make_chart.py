"""Draws public/images/blog/middle-of-the-context-dip.svg from results/analysis.json.
Usage: python make_chart.py RESULTS_DIR OUT_DIR"""
import json
import sys
from pathlib import Path

a = json.loads((Path(sys.argv[1]) / "analysis.json").read_text())["contains"]
rows = [("Answer alone", a["gold_only"], False), ("Slot 1 of 7 (start)", a["slot 1 (start)"], False),
        ("Slot 4 of 7 (middle)", a["slot 4 (middle)"], True), ("Slot 7 of 7 (end)", a["slot 7 (end)"], False)]
X0, SC, Y0, H, GAP = 160, 3.4, 112, 26, 18
n = len(rows)
height = Y0 + n * (H + GAP) + 54
o = [f'<svg xmlns="http://www.w3.org/2000/svg" data-viz="" viewBox="0 0 560 {height}" width="560" height="{height}" role="img" '
     f'aria-label="Share of questions answered correctly by Qwen2.5-0.5B on 74 questions: {rows[0][1][0]:.1f} percent with the answer paragraph alone, '
     f'{rows[1][1][0]:.1f} with it first of seven, {rows[2][1][0]:.1f} in the middle, {rows[3][1][0]:.1f} last. The middle is lowest.">',
     '<style data-standalone="">text{font-family:"DM Sans",Helvetica,Arial,sans-serif}.m{font-family:"DM Mono",Menlo,Consolas,monospace}.h{font-family:Newsreader,Georgia,serif;font-weight:500}</style>',
     f'<rect width="560" height="{height}" fill="#272725"/>',
     '<g class="a-fade" style="--d:0s;--t:.5s"><text class="h" x="24" y="42" font-size="24" fill="#FAF9F5">The middle slot scores lowest</text>'
     '<text x="24" y="66" font-size="15" fill="#B5B3AA">Qwen2.5-0.5B, 74 SQuAD questions, 7 paragraphs.</text>'
     '<text x="24" y="86" font-size="15" fill="#B5B3AA">Correct answers, with 95% interval.</text></g>',
     f'<path class="a-draw" pathLength="1" style="--d:.15s;--t:.5s" d="M{X0} {Y0 - 8}V{Y0 + n * (H + GAP) - GAP + 8}" stroke="#B5B3AA" stroke-width="1.5" stroke-linecap="round" fill="none"/>']
for i, (lab, (est, lo, hi), key) in enumerate(rows):
    y = Y0 + i * (H + GAP)
    d = 0.3 + 0.25 * i
    col = "#DB8061" if key else ("#FAF9F5" if i == 0 else "#B5B3AA")
    o.append(f'<text class="a-fade" style="--d:{d:.2f}s;--t:.4s" x="{X0 - 12}" y="{y + 18}" text-anchor="end" font-size="15" fill="#B5B3AA">{lab}</text>')
    o.append(f'<rect class="a-growx" style="--d:{d:.2f}s;--t:.7s" x="{X0}" y="{y}" width="{est * SC:.1f}" height="{H}" rx="2" fill="{col}"/>')
    o.append(f'<text class="m a-fade" style="--d:{d + .3:.2f}s;--t:.5s" x="{X0 + est * SC + 10:.1f}" y="{y + 18}" font-size="15" fill="#FAF9F5">{est:.1f}%</text>')
    o.append(f'<text class="m a-fade" style="--d:{d + .3:.2f}s;--t:.5s" x="{X0 + est * SC + 70:.1f}" y="{y + 18}" font-size="13" fill="#B5B3AA">{lo:.0f} to {hi:.0f}</text>')
o.append(f'<text class="a-fade" style="--d:1.8s;--t:.5s" x="24" y="{height - 20}" font-size="15" fill="#DB8061">Middle minus end: {a["diffs"]["middle minus end"][0]:.1f} points.</text>')
o.append('</svg>')
out = Path(sys.argv[2]) / "middle-of-the-context-dip.svg"
out.write_text("".join(o))
print(out)
