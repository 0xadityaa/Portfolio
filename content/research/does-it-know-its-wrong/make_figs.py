"""Write the two animated SVG figures from results/analysis.json (the 1.5B run, hand-corrected grader).

usage: python make_figs.py RESULTS_DIR OUT_DIR
Outputs OUT_DIR/calibration-bands.svg and OUT_DIR/abstain-keeps-right.svg
"""
import json
import sys

import numpy as np

res, out = sys.argv[1], sys.argv[2]
a = json.load(open(f"{res}/analysis.json"))["qwen2.5-1.5b"]
y = np.array(a["_y"], bool)
p = np.array(a["_p_seq"])
n = len(y)

BG, INK, MUTE, GRID, CLAY = "#272725", "#FAF9F5", "#B5B3AA", "#474743", "#DB8061"
STYLE = ('<style data-standalone="">text{font-family:"DM Sans",Helvetica,Arial,sans-serif}'
         '.m{font-family:"DM Mono",Menlo,Consolas,monospace}'
         '.h{font-family:Newsreader,Georgia,serif;font-weight:500}</style>')


def head(h, label):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" data-viz="" viewBox="0 0 560 {h}" width="560" height="{h}" '
            f'role="img" aria-label="{label}">{STYLE}<rect width="560" height="{h}" fill="{BG}"/>')


# ---------- figure 1: right answers by confidence band ----------
bands = [(0, 0.1, "under 0.1"), (0.1, 0.3, "0.1 to 0.3"), (0.3, 0.6, "0.3 to 0.6"), (0.6, 0.9, "0.6 to 0.9"), (0.9, 1.01, "0.9 or more")]
rows = []
for lo, hi, name in bands:
    m = (p >= lo) & (p < hi)
    rows.append((name, int(m.sum()), int(y[m].sum()), float(y[m].mean()), float(p[m].mean())))
H = 330
x0, wmax = 152, 300
label = ("Horizontal bars of how often Qwen2.5-1.5B was right by the probability it gave its own answer: "
         + ", ".join(f"{r[0]} was right {100 * r[3]:.0f} percent" for r in rows) + ".")
s = [head(H, label)]
s.append(f'<g class="a-fade" style="--d:0s;--t:.5s"><text class="h" x="24" y="42" font-size="24" fill="{INK}">Higher confidence, more right answers</text>'
         f'<text x="24" y="66" font-size="15" fill="{MUTE}">Share right, by the probability the model gave its answer.</text></g>')
s.append(f'<path class="a-draw" pathLength="1" style="--d:.15s;--t:.5s" d="M{x0} 88V262" stroke="{MUTE}" stroke-width="1.5" stroke-linecap="round" fill="none"/>')
for t in (0.25, 0.5, 0.75, 1.0):
    gx = x0 + t * wmax
    s.append(f'<path class="a-fade" style="--d:.3s;--t:.5s" d="M{gx:.1f} 88V262" stroke="{GRID}" stroke-width="1" stroke-dasharray="3 4"/>')
    s.append(f'<text class="m a-fade" style="--d:.4s;--t:.5s" x="{gx:.1f}" y="284" text-anchor="middle" font-size="13" fill="{MUTE}">{int(t * 100)}%</text>')
s.append(f'<text class="m a-fade" style="--d:.4s;--t:.5s" x="{x0}" y="284" text-anchor="middle" font-size="13" fill="{MUTE}">0</text>')
for i, (name, cnt, k, acc, conf) in enumerate(rows):
    y0 = 98 + i * 34
    d = 0.55 + i * 0.25
    focal = i == len(rows) - 1
    col = CLAY if focal else MUTE
    s.append(f'<text class="a-fade" style="--d:{d:.2f}s;--t:.4s" x="{x0 - 12}" y="{y0 + 19}" text-anchor="end" font-size="15" fill="{INK}">{name}</text>')
    s.append(f'<rect class="a-growx" style="--d:{d:.2f}s;--t:.6s" x="{x0}" y="{y0}" width="{acc * wmax:.1f}" height="26" rx="2" fill="{col}"/>')
    s.append(f'<path class="a-fade" style="--d:{d + 0.5:.2f}s;--t:.4s" d="M{x0 + conf * wmax:.1f} {y0 - 3}V{y0 + 29}" stroke="{INK}" stroke-width="2" stroke-linecap="round"/>')
    s.append(f'<text class="m a-fade" style="--d:{d + 0.3:.2f}s;--t:.4s" x="{x0 + max(acc, conf) * wmax + 10:.1f}" y="{y0 + 19}" font-size="15" fill="{col if focal else INK}">{100 * acc:.0f}%</text>')
    s.append(f'<text class="m a-fade" style="--d:{d + 0.3:.2f}s;--t:.4s" x="536" y="{y0 + 19}" text-anchor="end" font-size="13" fill="{MUTE}">n={cnt}</text>')
s.append(f'<text class="a-fade" style="--d:2.0s;--t:.4s" x="24" y="312" font-size="13" fill="{MUTE}">Bar: share right. White tick: the average probability the model gave.</text>')
s.append("</svg>")
open(f"{out}/calibration-bands.svg", "w").write("".join(s))

# ---------- figure 2: right kept vs wrong kept as the cutoff moves ----------
order = np.argsort(-p, kind="mergesort")
ps, ys = p[order], y[order]
R, W_ = y.sum(), (~y).sum()
pts = [(0.0, 0.0)]
cr = cw = 0
for i in range(n):
    cr += ys[i]
    cw += (not ys[i])
    if i == n - 1 or ps[i + 1] != ps[i]:
        pts.append((cw / W_, cr / R))
hp = a["halve_wrong_p_seq"]
cut = hp["cutoff"]
m = p >= cut
kx, ky = (~y)[m].sum() / W_, y[m].sum() / R
px, py, pw, ph = 80, 112, 440, 230
H2 = 424


def X(v):
    return px + v * pw


def Y(v):
    return py + ph - v * ph


label = (f"Curve of right answers kept against wrong answers still given as the confidence cutoff moves. "
         f"At a cutoff of {cut:.3f} the model keeps {100 * ky:.0f} percent of its right answers and still gives {100 * kx:.0f} percent of its wrong ones.")
s = [head(H2, label)]
s.append(f'<g class="a-fade" style="--d:0s;--t:.5s"><text class="h" x="24" y="42" font-size="24" fill="{INK}">Abstaining drops wrong answers faster</text>'
         f'<text x="24" y="66" font-size="15" fill="{MUTE}">Each point is one confidence cutoff, 112 questions.</text></g>')
for t in (0.25, 0.5, 0.75, 1.0):
    s.append(f'<path class="a-fade" style="--d:.3s;--t:.5s" d="M{px} {Y(t):.1f}H{px + pw}" stroke="{GRID}" stroke-width="1" stroke-dasharray="3 4"/>')
    s.append(f'<text class="m a-fade" style="--d:.4s;--t:.5s" x="{px - 8}" y="{Y(t) + 4:.1f}" text-anchor="end" font-size="13" fill="{MUTE}">{int(t * 100)}%</text>')
    s.append(f'<text class="m a-fade" style="--d:.4s;--t:.5s" x="{X(t):.1f}" y="{py + ph + 20}" text-anchor="middle" font-size="13" fill="{MUTE}">{int(t * 100)}%</text>')
s.append(f'<path class="a-draw" pathLength="1" style="--d:.15s;--t:.5s" d="M{px} {py}V{py + ph}H{px + pw}" stroke="{MUTE}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>')
s.append(f'<path class="a-draw" pathLength="1" style="--d:.5s;--t:.5s" d="M{X(0)} {Y(0)}L{X(1)} {Y(1)}" stroke="{MUTE}" stroke-width="1" stroke-dasharray="3 4" fill="none" opacity=".8"/>')
s.append(f'<text class="a-fade" style="--d:.9s;--t:.4s" x="{X(0.62):.1f}" y="{Y(0.62) + 22:.1f}" font-size="13" fill="{MUTE}">no signal</text>')
d = "M" + "L".join(f"{X(a_):.1f} {Y(b_):.1f}" for a_, b_ in pts)
s.append(f'<path class="a-draw" pathLength="1" style="--d:.8s;--t:1.2s" d="{d}" stroke="{INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>')
s.append(f'<g class="a-fade" style="--d:2.1s;--t:.4s"><g class="a-pop"><circle cx="{X(kx):.1f}" cy="{Y(ky):.1f}" r="6" fill="{CLAY}"/></g>'
         f'<text x="{X(kx) + 14:.1f}" y="{Y(ky) + 22:.1f}" font-size="15" fill="{CLAY}">keeps {100 * ky:.0f}% of right,</text>'
         f'<text x="{X(kx) + 14:.1f}" y="{Y(ky) + 40:.1f}" font-size="15" fill="{CLAY}">gives {100 * kx:.0f}% of wrong</text></g>')
s.append(f'<text class="a-fade" style="--d:.4s;--t:.5s" x="{px + pw / 2}" y="{py + ph + 44}" text-anchor="middle" font-size="14" fill="{MUTE}">Wrong answers still given</text>')
s.append(f'<text class="a-fade" style="--d:.4s;--t:.5s" x="24" y="{py - 10}" font-size="14" fill="{MUTE}">Right answers kept</text>')
s.append("</svg>")
open(f"{out}/abstain-keeps-right.svg", "w").write("".join(s))
print("figures written;", f"cutoff {cut:.3f} keeps {ky:.3f} right, gives {kx:.3f} wrong")
