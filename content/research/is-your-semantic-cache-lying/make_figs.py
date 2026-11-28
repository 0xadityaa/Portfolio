"""Draw the two figures from results.json. Standard library only.

python3 make_figs.py ../../../public/images/blog
"""
import json
import sys

R = json.load(open("results.json"))
OUT = sys.argv[1]
M = R["models"]
BG, INK, MUTE, GRID, CLAY = "#272725", "#FAF9F5", "#B5B3AA", "#474743", "#DB8061"
STYLE = ('<style data-standalone="">text{font-family:"DM Sans",Helvetica,Arial,sans-serif}'
         '.m{font-family:"DM Mono",Menlo,Consolas,monospace}'
         '.h{font-family:Newsreader,Georgia,serif;font-weight:500}</style>')


def svg(h, label, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" data-viz="" viewBox="0 0 560 {h}" width="560" '
            f'height="{h}" role="img" aria-label="{label}">{STYLE}<rect width="560" height="{h}" fill="{BG}"/>'
            f'{body}</svg>\n')


# Figure 1: where unrelated pairs land, p1 to p99 range and mean per model
x0, x1 = 120, 536
def X(v):
    return x0 + (v - (-0.2)) / 1.2 * (x1 - x0)

b = ('<g class="a-fade" style="--d:0s;--t:.5s"><text class="h" x="24" y="42" font-size="24" fill="#FAF9F5">'
     'Where unrelated pairs land</text><text x="24" y="66" font-size="15" fill="#B5B3AA">'
     'Cosine of 5,000 random question pairs: middle 98% and mean.</text></g>')
for t in (0.0, 0.5, 1.0):
    b += (f'<path class="a-fade" style="--d:.1s;--t:.4s" d="M{X(t):.1f} 92V232" stroke="{GRID}" '
          f'stroke-width="1" stroke-dasharray="3 4"/>'
          f'<text class="m a-fade" style="--d:.1s;--t:.4s" x="{X(t):.1f}" y="250" text-anchor="middle" '
          f'font-size="13" fill="{MUTE}">{t:.1f}</text>')
b += (f'<path class="a-draw" pathLength="1" style="--d:.3s;--t:.6s" d="M{X(0.8):.1f} 88V236" stroke="{INK}" '
      f'stroke-width="1.5" stroke-linecap="round" fill="none"/>'
      f'<text class="m a-fade" style="--d:.9s;--t:.4s" x="{X(0.8):.1f}" y="82" text-anchor="middle" '
      f'font-size="13" fill="{INK}">0.80</text>')
rows = [("MiniLM-L6", 112), ("bge-small", 164), ("e5-small", 216)]
for i, (name, y) in enumerate(rows):
    r = M[name]["random"]
    col = CLAY if name == "e5-small" else MUTE
    d = 0.5 + i * 0.25
    b += (f'<text class="a-fade" style="--d:{d}s;--t:.4s" x="24" y="{y + 5}" font-size="15" fill="{INK}">{name}</text>'
          f'<rect class="a-growx" style="--d:{d}s;--t:.6s" x="{X(r["p01"]):.1f}" y="{y - 8}" '
          f'width="{X(r["p99"]) - X(r["p01"]):.1f}" height="16" rx="2" fill="{col}"/>'
          f'<g class="a-fade" style="--d:{d + .5}s;--t:.4s"><rect x="{X(r["mean"]) - 1.5:.1f}" y="{y - 14}" '
          f'width="3" height="28" fill="{INK}"/></g>')
b += (f'<text class="m a-fade" style="--d:1.6s;--t:.4s" x="536" y="274" text-anchor="end" font-size="13" '
      f'fill="{MUTE}">white tick = mean: {M["MiniLM-L6"]["random"]["mean"]:.2f}, '
      f'{M["bge-small"]["random"]["mean"]:.2f}, {M["e5-small"]["random"]["mean"]:.2f}</text>')
lab = (f'Cosine similarity of 5,000 random unrelated question pairs: MiniLM mean {M["MiniLM-L6"]["random"]["mean"]:.2f}, '
       f'bge-small {M["bge-small"]["random"]["mean"]:.2f}, e5-small {M["e5-small"]["random"]["mean"]:.2f}; '
       f'e5-small unrelated pairs sit between {M["e5-small"]["random"]["p01"]:.2f} and {M["e5-small"]["random"]["p99"]:.2f}.')
open(f"{OUT}/embedding-cone-random-pairs.svg", "w").write(svg(290, lab, b))

# Figure 2: MiniLM, share of all pairs that hit, split into right and wrong hits
sweep = {s["t"]: s for s in M["MiniLM-L6"]["sweep"]}
ts = [0.70, 0.80, 0.85, 0.90, 0.95]
bx0 = 96
scale = 430  # px per 100% of pairs, so the 58% bar ends near x=345 and its label fits
b = ('<g class="a-fade" style="--d:0s;--t:.5s"><text class="h" x="24" y="42" font-size="24" fill="#FAF9F5">'
     'Raise the threshold, keep the false hits</text><text x="24" y="66" font-size="15" fill="#B5B3AA">'
     'MiniLM cache on 5,000 Quora pairs: hits as a share of all pairs.</text></g>')
b += (f'<path class="a-draw" pathLength="1" style="--d:.2s;--t:.5s" d="M{bx0} 84V{104 + 44 * len(ts)}" '
      f'stroke="{MUTE}" stroke-width="1.5" stroke-linecap="round" fill="none"/>')
for i, t in enumerate(ts):
    s = sweep[t]
    y = 100 + i * 44
    hit = s["hit_rate"]
    wrong = hit * s["false_hit_share"]
    right = hit - wrong
    d = 0.4 + i * 0.25
    b += (f'<text class="m a-fade" style="--d:{d}s;--t:.4s" x="{bx0 - 10}" y="{y + 19}" text-anchor="end" '
          f'font-size="15" fill="{INK}">{t:.2f}</text>'
          f'<rect class="a-growx" style="--d:{d}s;--t:.6s" x="{bx0}" y="{y}" width="{right * scale:.1f}" height="26" rx="2" fill="{MUTE}"/>'
          f'<rect class="a-growx" style="--d:{d + .3}s;--t:.5s" x="{bx0 + right * scale:.1f}" y="{y}" '
          f'width="{wrong * scale:.1f}" height="26" rx="2" fill="{CLAY}"/>'
          f'<text class="m a-fade" style="--d:{d + .6}s;--t:.4s" x="{bx0 + hit * scale + 8:.1f}" y="{y + 19}" '
          f'font-size="14" fill="{INK}">{hit:.0%} hit, {s["false_hit_share"]:.0%} wrong</text>')
yb = 100 + len(ts) * 44 + 14
b += (f'<rect class="a-fade" style="--d:2s;--t:.4s" x="{bx0}" y="{yb}" width="12" height="12" rx="2" fill="{MUTE}"/>'
      f'<text class="a-fade" style="--d:2s;--t:.4s" x="{bx0 + 18}" y="{yb + 11}" font-size="13" fill="{MUTE}">right answer</text>'
      f'<rect class="a-fade" style="--d:2s;--t:.4s" x="{bx0 + 120}" y="{yb}" width="12" height="12" rx="2" fill="{CLAY}"/>'
      f'<text class="a-fade" style="--d:2s;--t:.4s" x="{bx0 + 138}" y="{yb + 11}" font-size="13" fill="{MUTE}">wrong answer (labelled non-duplicate)</text>')
H = yb + 36
lab = ('At a 0.85 threshold a MiniLM semantic cache hits ' + f'{sweep[0.85]["hit_rate"]:.0%}' + ' of Quora question pairs and '
       + f'{sweep[0.85]["false_hit_share"]:.0%}' + ' of those hits return the answer to a different question.')
open(f"{OUT}/semantic-cache-false-hits.svg", "w").write(svg(H, lab, b))
print("ok")
