"""Writes the two animated figures for the post:
public/images/blog/cache-cost-vs-traffic.svg (analytic model in cost_model.py;
the simulation matches it within sampling noise, see results/simulation.txt)
and public/images/blog/cache-prompt-order.svg (results/prompt_order.txt).
Standard library only."""
import math
import pathlib

import cost_model as cm

HERE = pathlib.Path(__file__).parent
OUT = HERE.parent.parent.parent / "public" / "images" / "blog"
INK, MUTED, LINE, BG, CLAY = "#FAF9F5", "#B5B3AA", "#474743", "#272725", "#DB8061"
STYLE = ('<style data-standalone>text{font-family:"DM Sans",Helvetica,Arial,sans-serif}'
         '.m{font-family:"DM Mono",Menlo,Consolas,monospace}'
         '.h{font-family:Newsreader,Georgia,serif;font-weight:500}</style>')


def head(h, label):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" data-viz viewBox="0 0 560 {h}" width="560" height="{h}" '
            f'role="img" aria-label="{label}">{STYLE}<rect width="560" height="{h}" fill="{BG}"/>')


def title(t, sub):
    return (f'<g class="a-fade" style="--d:0s;--t:.5s"><text class="h" x="24" y="42" font-size="24" fill="{INK}">{t}</text>'
            f'<text x="24" y="66" font-size="15" fill="{MUTED}">{sub}</text></g>')


# ---------- Figure 1: cost against traffic ----------
s = cm.P["models"]["anthropic-sonnet-5.5"]
STATIC, DYNAMIC = 6000, 500


def cost(rate, write, ttl):
    return (STATIC * cm.expected_prefix_cost(rate, s["base"], write, s["read"], ttl) + DYNAMIC * s["base"]) / 1e6


nocache = (STATIC + DYNAMIC) * s["base"] / 1e6
L, R, T, B = 64, 536, 100, 280
XMIN, XMAX, VMAX, VMIN = 0.25, 600.0, 60.0, -100.0


def X(r):
    return L + (math.log10(r) - math.log10(XMIN)) / (math.log10(XMAX) - math.log10(XMIN)) * (R - L)


def Y(v):
    return T + (VMAX - v) / (VMAX - VMIN) * (B - T)


def curve(write, ttl):
    pts = []
    n = 60
    for i in range(n + 1):
        r = 10 ** (math.log10(XMIN) + i / n * (math.log10(XMAX) - math.log10(XMIN)))
        v = (cost(r, write, ttl) / nocache - 1) * 100
        pts.append(f"{X(r):.1f} {Y(v):.1f}")
    return "M" + "L".join(pts)


x5 = cm.crossover_rate_per_hour(s["base"], s["write_short"], s["read"], 5)
x1 = cm.crossover_rate_per_hour(s["base"], s["write_long"], s["read"], 60)
y0 = Y(0)
f1 = head(336, "Line chart on a log scale of request rate. Against no cache, the 5-minute cache costs more below 2.8 requests an hour and the 1-hour cache below 0.72. Both settle at 87.7 percent cheaper.")
f1 += title("Below 3 requests an hour, it costs more", "Input cost against no cache. Sonnet 5.5, 6,500-token prompt.")
for v in (50, -50, -100):
    f1 += (f'<path class="a-fade" style="--d:.3s;--t:.5s" d="M{L} {Y(v):.1f}H{R}" stroke="{LINE}" stroke-width="1" stroke-dasharray="3 4"/>'
           f'<text class="m a-fade" style="--d:.4s;--t:.5s" x="{L-8}" y="{Y(v)+5:.1f}" text-anchor="end" font-size="13" fill="{MUTED}">{v:+d}%</text>')
f1 += f'<text class="m a-fade" style="--d:.4s;--t:.5s" x="{L-8}" y="{y0+5:.1f}" text-anchor="end" font-size="13" fill="{MUTED}">0</text>'
f1 += f'<path class="a-draw" pathLength="1" style="--d:.15s;--t:.6s" d="M{L} {y0:.1f}H{R}" stroke="{MUTED}" stroke-width="1.5" stroke-linecap="round" fill="none"/>'
f1 += f'<text class="a-fade" style="--d:.4s;--t:.5s" x="{R}" y="{y0-8:.1f}" text-anchor="end" font-size="13" fill="{MUTED}">no cache</text>'
for r in (0.25, 1, 10, 100, 600):
    lab = f"{r:g}"
    f1 += f'<text class="m a-fade" style="--d:.4s;--t:.5s" x="{X(r):.1f}" y="{B+22}" text-anchor="middle" font-size="13" fill="{MUTED}">{lab}</text>'
f1 += f'<text class="a-fade" style="--d:.4s;--t:.5s" x="{R}" y="{B+44}" text-anchor="end" font-size="13" fill="{MUTED}">requests an hour, log scale</text>'
f1 += (f'<path class="a-draw" pathLength="1" style="--d:.7s;--t:1.2s" d="{curve(s["write_short"], 5)}" fill="none" stroke="{MUTED}" '
       f'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>')
f1 += (f'<path class="a-draw" pathLength="1" style="--d:1.0s;--t:1.2s" d="{curve(s["write_long"], 60)}" fill="none" stroke="{INK}" '
       f'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>')
# legend, lower left where nothing is drawn
for i, (lab, col) in enumerate((("1-hour cache", INK), ("5-minute cache", MUTED))):
    ly = Y(-22) + i * 24
    f1 += (f'<g class="a-fade" style="--d:.8s;--t:.4s"><path d="M{L+296} {ly:.1f}H{L+318}" stroke="{col}" stroke-width="2" stroke-linecap="round"/>'
           f'<text x="{L+326}" y="{ly+5:.1f}" font-size="15" fill="{col}">{lab}</text></g>')
f1 += (f'<g class="a-fade" style="--d:2.2s;--t:.4s"><circle cx="{X(x1):.1f}" cy="{y0:.1f}" r="4" fill="{INK}"/>'
       f'<text class="m" x="{X(x1)-9:.1f}" y="{y0+20:.1f}" text-anchor="end" font-size="14" fill="{INK}">{x1:.2f}</text></g>')
f1 += (f'<g class="a-fade" style="--d:2.3s;--t:.4s"><g class="a-pop" style="--d:2.4s;--t:.5s"><circle cx="{X(x5):.1f}" cy="{y0:.1f}" r="5" fill="{CLAY}"/></g>'
       f'<text x="{X(x5)+12:.1f}" y="{y0-12:.1f}" font-size="15" font-weight="500" fill="{CLAY}">5-minute breaks even at {x5:.1f} an hour</text></g>')
f1 += f'<g class="a-fade" style="--d:2.2s;--t:.4s"><text class="m" x="{R}" y="{Y(-87.7)-8:.1f}" text-anchor="end" font-size="14" fill="{INK}">-87.7%</text></g>'
f1 += '</svg>\n'
(OUT / "cache-cost-vs-traffic.svg").write_text(f1)

# ---------- Figure 2: where the timestamp goes ----------
rows = [("Top of system prompt", 35.7, "$1.322"), ("Middle of system prompt", 52.6, "$1.001"),
        ("Bottom of system prompt", 98.4, "$0.131"), ("In the user message", 98.5, "$0.128"),
        ("Tools shuffled each time", 2.7, "$1.991")]
x0, W = 204, 200
f2 = head(300, "Bars of how much of a 1,716-token prompt can be cached by where the timestamp and name sit: 35.7 percent at the top of the system prompt, 52.6 in the middle, 98.4 at the bottom, 98.5 in the user message and 2.7 when tools are shuffled each request.")
f2 += title("Where the timestamp goes sets the price", "Cacheable share of a 1,716-token prompt, with its blended input price.")
f2 += f'<text class="a-fade" style="--d:.3s;--t:.4s" x="{x0}" y="102" font-size="13" fill="{MUTED}">cacheable share</text>'
f2 += f'<text class="a-fade" style="--d:.3s;--t:.4s" x="536" y="102" text-anchor="end" font-size="13" fill="{MUTED}">$ per million tokens</text>'
f2 += f'<path class="a-draw" pathLength="1" style="--d:.15s;--t:.5s" d="M{x0} 110V266" stroke="{MUTED}" stroke-width="1.5" stroke-linecap="round" fill="none"/>'
for i, (lab, pct, price) in enumerate(rows):
    ry = 118 + i * 30
    focal = i == 2
    col = CLAY if focal else MUTED
    d = .5 + .2 * i
    w = W * pct / 100
    f2 += f'<text class="a-fade" style="--d:{d:.2f}s;--t:.4s" x="{x0-12}" y="{ry+17}" text-anchor="end" font-size="15" fill="{INK}">{lab}</text>'
    f2 += f'<rect class="a-growx" style="--d:{d:.2f}s;--t:.6s" x="{x0}" y="{ry}" width="{w:.1f}" height="24" rx="2" fill="{col}"/>'
    f2 += (f'<text class="m a-fade" data-count="{pct}" data-dec="1" data-suf="%" style="--d:{d:.2f}s;--t:.6s" x="{x0+w+8:.1f}" y="{ry+17}" '
           f'font-size="15" fill="{CLAY if focal else INK}">{pct}%</text>')
    f2 += f'<g class="a-fade" style="--d:{d+.4:.2f}s;--t:.4s"><text class="m" x="536" y="{ry+17}" text-anchor="end" font-size="15" fill="{CLAY if focal else MUTED}">{price}</text></g>'
f2 += f'<text class="a-fade" style="--d:1.9s;--t:.5s" x="24" y="288" font-size="15" fill="{MUTED}">One line moved: $1.322 to $0.131, a tenfold gap.</text>'
f2 += '</svg>\n'
(OUT / "cache-prompt-order.svg").write_text(f2)
print("wrote", OUT, f"break-evens {x5:.2f} {x1:.2f}")
