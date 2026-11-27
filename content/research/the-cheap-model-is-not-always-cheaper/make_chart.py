"""Writes the two animated figures for the post into public/images/blog/:
cost-per-useful-answer.svg (from prices.json and the formulas in cost_model.py)
and cascade-leak-limit.svg (the f* table in output.txt, section 6).
Standard library only.

    python3 make_chart.py
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "..", "..", "public", "images", "blog")
P = json.load(open(os.path.join(HERE, "prices.json")))["models"]
INK, MUTED, LINE, BG, CLAY = "#FAF9F5", "#B5B3AA", "#474743", "#272725", "#DB8061"
STYLE = ('<style data-standalone="">text{font-family:"DM Sans",Helvetica,Arial,sans-serif}'
         '.m{font-family:"DM Mono",Menlo,Consolas,monospace}'
         '.h{font-family:Newsreader,Georgia,serif;font-weight:500}</style>')


def head(h, label):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" data-viz="" viewBox="0 0 560 {h}" width="560" height="{h}" '
            f'role="img" aria-label="{label}">{STYLE}<rect width="560" height="{h}" fill="{BG}"/>')


def title(t, sub):
    return (f'<g class="a-fade" style="--d:0s;--t:.5s"><text class="h" x="24" y="42" font-size="24" fill="{INK}">{t}</text>'
            f'<text x="24" y="66" font-size="15" fill="{MUTED}">{sub}</text></g>')


def cost(m, tin, tout):
    return (tin * P[m]["input"] + tout * P[m]["output"]) / 1e6


c_c, c_e = cost("claude-haiku-5.5", 3000, 500), cost("claude-opus-5.5", 3000, 500)
v = cost("claude-haiku-5.5", 3500, 100)
S_C, S_E, T = 0.80, 0.95, 0.95


def single(c, s, F):
    return (c + (1 - s) * F) / s


def cascade(f, F):
    p_rej = S_C * (1 - T) + (1 - S_C) * (1 - f)
    spend = c_c + v + p_rej * c_e
    good = S_C * T + p_rej * S_E
    bad = (1 - S_C) * f + p_rej * (1 - S_E)
    return (spend + F * bad) / good


F_STAR = (c_e / S_E - c_c / S_C) / (1 / S_C - 1 / S_E)
y_star = single(c_c, S_C, F_STAR)

# ---------- Figure 1: cost per useful answer ----------
L, R, T0, B = 72, 400, 100, 290
FMAX, YMAX = 0.50, 0.14
px = lambda F: L + (R - L) * F / FMAX
py = lambda y: B - (B - T0) * y / YMAX


def path(fn):
    pts = [f"{px(i*FMAX/50):.1f} {py(fn(i*FMAX/50)):.1f}" for i in range(51)]
    return "M" + "L".join(pts)


f1 = head(344, f"Line chart of cost per useful answer as the cost of a wrong answer rises from 0 to 50 cents. The cheap model alone crosses the expensive model alone at {F_STAR:.3f} dollars. A cascade with a check that passes 10 percent of wrong answers stays lowest; one that passes 50 percent climbs above the expensive model alone.")
f1 += title("The cheap model loses at 11 cents a failure", "Cost per useful answer. Haiku 5.5 vs Opus 5.5, assumed 80% and 95% right.")
for yv in (0.05, 0.10):
    f1 += (f'<path class="a-fade" style="--d:.3s;--t:.5s" d="M{L} {py(yv):.1f}H{R}" stroke="{LINE}" stroke-width="1" stroke-dasharray="3 4"/>'
           f'<text class="m a-fade" style="--d:.4s;--t:.5s" x="{L-8}" y="{py(yv)+5:.1f}" text-anchor="end" font-size="13" fill="{MUTED}">${yv:.2f}</text>')
f1 += f'<text class="m a-fade" style="--d:.4s;--t:.5s" x="{L-8}" y="{B+5}" text-anchor="end" font-size="13" fill="{MUTED}">$0</text>'
f1 += f'<path class="a-draw" pathLength="1" style="--d:.15s;--t:.5s" d="M{L} {B}H{R}" stroke="{MUTED}" stroke-width="1.5" stroke-linecap="round" fill="none"/>'
for xv in (0, 0.1, 0.2, 0.3, 0.4, 0.5):
    f1 += f'<text class="m a-fade" style="--d:.4s;--t:.5s" x="{px(xv):.1f}" y="{B+22}" text-anchor="middle" font-size="13" fill="{MUTED}">${xv:.1f}</text>'
f1 += f'<text class="a-fade" style="--d:.4s;--t:.5s" x="{R}" y="{B+44}" text-anchor="end" font-size="13" fill="{MUTED}">cost of one wrong answer</text>'
series = [("cheap alone", MUTED, "", lambda F: single(c_c, S_C, F), .6),
          ("Opus alone", INK, "", lambda F: single(c_e, S_E, F), .9),
          ("cascade, 50% leak", MUTED, ' ', lambda F: cascade(.5, F), 1.2),
          ("cascade, 10% leak", INK, ' ', lambda F: cascade(.1, F), 1.5)]
for lab, col, dash, fn, d in series:
    f1 += (f'<path class="a-draw" pathLength="1" style="--d:{d}s;--t:1s" d="{path(fn)}" fill="none" stroke="{col}" stroke-width="2" '
           f'stroke-linecap="round" stroke-linejoin="round"{dash}/>')
    f1 += f'<text class="a-fade" style="--d:{d+.8:.1f}s;--t:.4s" x="{R+10}" y="{py(fn(FMAX))+5:.1f}" font-size="14" fill="{col}">{lab}</text>'
f1 += (f'<g class="a-fade" style="--d:2.4s;--t:.4s"><path d="M{px(F_STAR):.1f} {py(y_star)-9:.1f}V128" stroke="{CLAY}" stroke-width="1" stroke-dasharray="3 4"/>'
       f'<g class="a-pop" style="--d:2.5s;--t:.5s"><circle cx="{px(F_STAR):.1f}" cy="{py(y_star):.1f}" r="5" fill="{CLAY}"/></g>'
       f'<text x="{L+12}" y="120" font-size="15" font-weight="500" fill="{CLAY}">break-even at ${F_STAR:.3f}</text></g>')
f1 += '</svg>\n'
open(os.path.join(OUT, "cost-per-useful-answer.svg"), "w").write(f1)

# ---------- Figure 2: how much leak the cascade survives ----------
# output.txt section 6, Anthropic pair: f* by failure cost
rows = [("$0.05", 100, "wins at any leak"), ("$0.25", 53.3, "53%"), ("$1", 28.3, "28%"), ("$5", 21.7, "22%")]
x0, K = 92, 300 / 100
f2 = head(278, "Bars of the highest share of wrong answers the check can pass before the cascade stops beating Opus alone: it never stops at 5 cents a wrong answer, 53 percent at 25 cents, 28 percent at 1 dollar and 22 percent at 5 dollars.")
f2 += title("A leaky check costs the cascade its win", "Share of wrong answers the check may pass and still beat Opus.")
f2 += f'<text class="a-fade" style="--d:.3s;--t:.4s" x="24" y="100" font-size="13" fill="{MUTED}">cost of a wrong answer</text>'
f2 += f'<path class="a-draw" pathLength="1" style="--d:.15s;--t:.5s" d="M{x0} 108V232" stroke="{MUTED}" stroke-width="1.5" stroke-linecap="round" fill="none"/>'
for i, (lab, val, txt) in enumerate(rows):
    y = 114 + i * 32
    focal = i == 2
    col = CLAY if focal else MUTED
    d = .5 + .25 * i
    w = val * K
    f2 += f'<text class="m a-fade" style="--d:{d:.2f}s;--t:.4s" x="{x0-10}" y="{y+17}" text-anchor="end" font-size="15" fill="{INK}">{lab}</text>'
    f2 += f'<rect class="a-growx" style="--d:{d:.2f}s;--t:.6s" x="{x0}" y="{y}" width="{w:.1f}" height="24" rx="2" fill="{col}"/>'
    f2 += f'<text class="m a-fade" style="--d:{d+.3:.2f}s;--t:.4s" x="{x0+w+8:.1f}" y="{y+17}" font-size="14" fill="{CLAY if focal else INK}">{txt}</text>'
f2 += f'<text class="a-fade" style="--d:1.9s;--t:.5s" x="24" y="266" font-size="15" fill="{MUTED}">The pricier the failure, the less leak you can afford.</text>'
f2 += '</svg>\n'
open(os.path.join(OUT, "cascade-leak-limit.svg"), "w").write(f2)
print(f"wrote figures; break-even {F_STAR:.4f}")
