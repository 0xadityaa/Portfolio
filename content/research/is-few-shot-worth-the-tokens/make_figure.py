"""Draw public/images/blog/few-shot-vs-template.svg from results.json (final frame; animation classes per docs/visuals.md).

usage: python make_figure.py > ../../../public/images/blog/few-shot-vs-template.svg
"""
import json

R = json.load(open("results.json"))["Qwen2.5-0.5B-Instruct"]
X0, X1, Y0, Y1 = 64, 512, 290, 104  # plot box; tokens 0..520, accuracy 20..80
sx = lambda t: X0 + (X1 - X0) * t / 520
sy = lambda a: Y0 - (Y0 - Y1) * (a - 20) / 60
IVORY, MUTED, CLAY = "#FAF9F5", "#B5B3AA", "#DB8061"
o = []
w = o.append
w('<svg xmlns="http://www.w3.org/2000/svg" data-viz="" viewBox="0 0 560 366" width="560" height="366" role="img" '
  'aria-label="Accuracy against prompt tokens for Qwen2.5-0.5B on 100 AG News articles. With no chat template, 0 shots score 70 percent and 8 shots 77 percent. '
  'With the model\'s own chat template, 0 shots score 66 percent and 8 shots 69 percent. A Llama-2 template scores 31 percent at 0 shots, and a chat template missing its assistant header scores 25 percent; in both, label mass is 0, so the answer position broke and ability is unmeasured.">')
w('<style data-standalone="">text{font-family:"DM Sans",Helvetica,Arial,sans-serif}.m{font-family:"DM Mono",Menlo,Consolas,monospace}.h{font-family:Newsreader,Georgia,serif;font-weight:500}</style>')
w('<rect width="560" height="366" fill="#272725"/>')
w('<g class="a-fade" style="--d:0s;--t:.5s"><text class="h" x="24" y="38" font-size="24" fill="#FAF9F5">A wrong template broke the answer slot</text></g>')
for a in (20, 40, 60, 80):
    y = sy(a)
    w(f'<path d="M{X0} {y:.1f}H{X1}" stroke="#474743" stroke-width="1" stroke-dasharray="3 4" fill="none"/>')
    w(f'<text class="m" x="{X0-8}" y="{y+5:.1f}" text-anchor="end" font-size="13" fill="{MUTED}">{a}%</text>')
w(f'<path class="a-draw" pathLength="1" style="--d:.1s;--t:.5s" d="M{X0} {Y0}H{X1}" stroke="{MUTED}" stroke-width="1.5" stroke-linecap="round" fill="none"/>')
for t in (0, 100, 200, 300, 400, 500):
    w(f'<text class="m" x="{sx(t):.1f}" y="{Y0+20}" text-anchor="middle" font-size="13" fill="{MUTED}">{t}</text>')
w(f'<text x="{(X0+X1)/2:.0f}" y="{Y0+42}" text-anchor="middle" font-size="15" fill="{MUTED}">Prompt tokens per query (Qwen tokenizer)</text>')


def series(key, color, d, dash=False, ks=(0, 8)):
    pts = [(R[f"{key}|{k}"], k) for k in ks if f"{key}|{k}" in R]
    path = "M" + "L".join(f"{sx(c['tokens']):.1f} {sy(100*c['mean']):.1f}" for c, _ in pts)
    da = ' stroke-dasharray="5 4"' if dash else ""
    w(f'<path class="a-draw" pathLength="1" style="--d:{d}s;--t:.6s" d="{path}" stroke="{color}" stroke-width="1.5" stroke-linecap="round" fill="none"{da}/>')
    w(f'<g class="a-fade" style="--d:{d+.3:.1f}s;--t:.5s">')
    for c, k in pts:
        x = sx(c["tokens"])
        if len(c["accs"]) > 1:
            w(f'<path d="M{x:.1f} {sy(100*c["lo"]):.1f}V{sy(100*c["hi"]):.1f}" stroke="{color}" stroke-width="1.5" stroke-linecap="round"/>')
        w(f'<circle cx="{x:.1f}" cy="{sy(100*c["mean"]):.1f}" r="4.5" fill="{color}"/>')
    w('</g>')


series("chat", IVORY, .5, ks=(0, 1, 3, 8))
series("llama", CLAY, .9, dash=True)
series("raw", MUTED, 1.3)
c = R["no_header|0"]
w(f'<g class="a-fade" style="--d:1.7s;--t:.5s"><circle cx="{sx(c["tokens"]):.1f}" cy="{sy(100*c["mean"]):.1f}" r="4.5" fill="{CLAY}"/>'
  f'<text x="{sx(c["tokens"])+12:.1f}" y="{sy(100*c["mean"])+7:.1f}" font-size="14" fill="{CLAY}">header cut: 25%, label mass 0</text></g>')
l0 = R["llama|0"]
w(f'<g class="a-fade" style="--d:1.7s;--t:.5s"><text x="{sx(l0["tokens"])+14:.1f}" y="{sy(100*l0["mean"])+10:.1f}" font-size="14" fill="{CLAY}">Llama-2, 0 shots: 31%, label mass 0</text></g>')
# legend and endpoint numbers
for x, col, txt, dash in ((24, MUTED, "no template", ""), (150, IVORY, "own chat template", ""), (334, CLAY, "Llama-2 template", ' stroke-dasharray="5 4"')):
    w(f'<g class="a-fade" style="--d:.3s;--t:.5s"><path d="M{x} 66H{x+22}" stroke="{col}" stroke-width="1.5" stroke-linecap="round"{dash}/><text x="{x+30}" y="71" font-size="15" fill="{col}">{txt}</text></g>')
for key, col in (("raw", MUTED), ("chat", IVORY), ("llama", CLAY)):
    c = R[f"{key}|8"]
    w(f'<g class="a-fade" style="--d:2.0s;--t:.5s"><text class="m" x="{sx(c["tokens"])+9:.1f}" y="{sy(100*c["mean"])+5:.1f}" font-size="14" font-weight="500" fill="{col}">{100*c["mean"]:.0f}%</text></g>')
w(f'<text class="a-fade" style="--d:2.3s;--t:.5s" x="24" y="352" font-size="15" fill="{MUTED}">Dots: mean of three example sets. Bars: lowest to highest.</text>')
w('</svg>')
print("\n".join(o))
