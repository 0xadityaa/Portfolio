"""Draw cost per useful answer against failure cost as an SVG (standard library only).

    python3 make_chart.py ../../../public/images/blog/cost-per-useful-answer.svg
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
P = json.load(open(os.path.join(HERE, "prices.json")))["models"]


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


F_MAX, Y_MAX = 0.50, 0.14
X0, X1, Y0, Y1 = 90, 760, 400, 70   # plot box in svg pixels


def px(F):
    return X0 + (X1 - X0) * F / F_MAX


def py(y):
    return Y0 - (Y0 - Y1) * y / Y_MAX


def path(fn):
    pts = [(px(i * F_MAX / 100), py(fn(i * F_MAX / 100))) for i in range(101)]
    return "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts)


F_STAR = (c_e / S_E - c_c / S_C) / (1 / S_C - 1 / S_E)
y_star = single(c_c, S_C, F_STAR)

INK, BG, ACC = "#FAF9F5", "#30302E", "#D97757"
GRID, CHEAP, CASC = "#4A4A47", "#A8A69E", "#8FBF9F"

out = []
out.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 820 500" width="820" height="500" role="img" aria-labelledby="t d">')
out.append('<title id="t">Cost per useful answer against the cost of a wrong answer</title>')
out.append(
    f'<desc id="d">Line chart. A cheap model alone gets expensive fast as the cost of a wrong answer rises, and crosses the expensive model alone at about {F_STAR:.2f} dollars. '
    f'A cascade with a good verifier stays lowest from about 3 cents up; a cascade whose verifier passes half of wrong answers climbs above the expensive model alone.</desc>')
out.append(f'<rect width="820" height="500" fill="{BG}"/>')
out.append(f'<text x="90" y="38" fill="{INK}" font-family="Georgia, serif" font-size="20">Cost per useful answer, as a wrong answer gets costlier</text>')
# grid + axes
for yv in [0, 0.02, 0.04, 0.06, 0.08, 0.10, 0.12, 0.14]:
    out.append(f'<line x1="{X0}" y1="{py(yv):.1f}" x2="{X1}" y2="{py(yv):.1f}" stroke="{GRID}" stroke-width="1"/>')
    out.append(f'<text x="{X0-10}" y="{py(yv)+4:.1f}" fill="{INK}" font-family="Helvetica, Arial, sans-serif" font-size="12" text-anchor="end">${yv:.2f}</text>')
for xv in [0, 0.1, 0.2, 0.3, 0.4, 0.5]:
    out.append(f'<text x="{px(xv):.1f}" y="{Y0+22}" fill="{INK}" font-family="Helvetica, Arial, sans-serif" font-size="12" text-anchor="middle">${xv:.2f}</text>')
out.append(f'<text x="{(X0+X1)//2}" y="{Y0+46}" fill="{INK}" font-family="Helvetica, Arial, sans-serif" font-size="13" text-anchor="middle">Cost of one wrong answer (assumption, swept)</text>')
out.append(f'<text transform="translate(26,{(Y0+Y1)//2}) rotate(-90)" fill="{INK}" font-family="Helvetica, Arial, sans-serif" font-size="13" text-anchor="middle">Cost per useful answer</text>')
# lines
out.append(f'<path d="{path(lambda F: single(c_c, S_C, F))}" fill="none" stroke="{CHEAP}" stroke-width="2.5"/>')
out.append(f'<path d="{path(lambda F: single(c_e, S_E, F))}" fill="none" stroke="{INK}" stroke-width="2.5"/>')
out.append(f'<path d="{path(lambda F: cascade(0.10, F))}" fill="none" stroke="{CASC}" stroke-width="2.5"/>')
out.append(f'<path d="{path(lambda F: cascade(0.50, F))}" fill="none" stroke="{CASC}" stroke-width="2.5" stroke-dasharray="7 5"/>')
# crossover
out.append(f'<circle cx="{px(F_STAR):.1f}" cy="{py(y_star):.1f}" r="7" fill="none" stroke="{ACC}" stroke-width="3"/>')
out.append(f'<text x="{px(F_STAR)-4:.1f}" y="{py(y_star)-48:.1f}" text-anchor="end" fill="{ACC}" font-family="Helvetica, Arial, sans-serif" font-size="14" font-weight="bold">break-even at ${F_STAR:.3f}</text>')
# direct labels
out.append(f'<text x="{px(0.50)-6:.1f}" y="{py(single(c_c, S_C, 0.50))-10:.1f}" fill="{CHEAP}" font-family="Helvetica, Arial, sans-serif" font-size="13" text-anchor="end">cheap alone (80% right)</text>')
out.append(f'<text x="{px(0.0)+8:.1f}" y="{py(single(c_e, S_E, 0.0))-22:.1f}" fill="{INK}" font-family="Helvetica, Arial, sans-serif" font-size="13" text-anchor="start">expensive alone (95%)</text>')
out.append(f'<text x="{px(0.50)-6:.1f}" y="{py(cascade(0.50, 0.50))-10:.1f}" fill="{CASC}" font-family="Helvetica, Arial, sans-serif" font-size="13" text-anchor="end">cascade, leaky check (passes 50% of wrong)</text>')
out.append(f'<text x="{px(0.50)-6:.1f}" y="{py(cascade(0.10, 0.50))+38:.1f}" fill="{CASC}" font-family="Helvetica, Arial, sans-serif" font-size="13" text-anchor="end">cascade, good check (passes 10% of wrong)</text>')
out.append(f'<text x="90" y="{Y0+72}" fill="{CHEAP}" font-family="Helvetica, Arial, sans-serif" font-size="11.5">Claude Haiku 5.5 vs Opus 5.5, 3,000 in / 500 out tokens, prices checked 2026-11-14. Success rates and the failure cost are assumptions.</text>')
out.append("</svg>")
open(sys.argv[1], "w").write("\n".join(out) + "\n")
print(f"wrote {sys.argv[1]}; break-even {F_STAR:.4f}")
