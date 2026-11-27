"""Writes the three animated figures for the post into public/images/blog/:
weight-memory-vs-cards.svg (from memory.json), quant-error-by-scale.svg and
top-channels-error-share.svg (numbers from output-weights.txt and
output-activations.txt, copied here with their source named).

    python3 make_diagram.py
"""
import json
import pathlib

HERE = pathlib.Path(__file__).parent
OUT = HERE.parent.parent.parent / "public" / "images" / "blog"
data = json.loads((HERE / "memory.json").read_text())
INK, MUTED, LINE, BG, CLAY = "#FAF9F5", "#B5B3AA", "#474743", "#272725", "#DB8061"
STYLE = ('<style data-standalone="">text{font-family:"DM Sans",Helvetica,Arial,sans-serif}'
         '.m{font-family:"DM Mono",Menlo,Consolas,monospace}'
         '.h{font-family:Newsreader,Georgia,serif;font-weight:500}</style>')
HALO = f'stroke="{BG}" stroke-width="4" paint-order="stroke"'


def head(h, label):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" data-viz="" viewBox="0 0 560 {h}" width="560" height="{h}" '
            f'role="img" aria-label="{label}">{STYLE}<rect width="560" height="{h}" fill="{BG}"/>')


def title(t, sub):
    return (f'<g class="a-fade" style="--d:0s;--t:.5s"><text class="h" x="24" y="42" font-size="24" fill="{INK}">{t}</text>'
            f'<text x="24" y="66" font-size="15" fill="{MUTED}">{sub}</text></g>')


# ---------- Figure 1: weight memory against cards ----------
names = [("Llama-3.1-8B", "Llama 3.1 8B"), ("Qwen2.5-14B", "Qwen2.5 14B"), ("Qwen2.5-32B", "Qwen2.5 32B"), ("Llama-3.1-70B", "Llama 3.1 70B")]
prec = [("fp16", "fp16"), ("int8 g128", "int8"), ("int4 g128", "int4")]
x0, K = 178, 2.3
BH, IG, GG = 22, 3, 12
y_top = 108
f1 = head(474, "Horizontal bars of weight memory in GiB at fp16, int8 and int4 for four models, with dashed lines for 24, 48 and 80 GB cards. Llama 3.1 70B falls from 131.4 GiB at fp16 to 37.0 at int4, which fits a 48 GB card.")
f1 += title("4-bit moves a 70B from two cards to one", "Weight memory in GiB, groups of 128, embeddings kept in fp16.")
y_end = y_top + 4 * (3 * BH + 2 * IG) + 3 * GG
for lab, gb in (("24 GB", 24), ("48 GB", 48), ("80 GB", 80)):
    gx = x0 + gb * 1e9 / 2**30 * K
    f1 += (f'<path class="a-fade" style="--d:.3s;--t:.5s" d="M{gx:.1f} {y_top-8}V{y_end+4}" stroke="{LINE}" stroke-width="1" stroke-dasharray="3 4"/>'
           f'<text class="m a-fade" style="--d:.4s;--t:.5s" x="{gx:.1f}" y="{y_top-16}" text-anchor="middle" font-size="13" fill="{MUTED}">{lab}</text>')
f1 += f'<path class="a-draw" pathLength="1" style="--d:.15s;--t:.5s" d="M{x0} {y_top-8}V{y_end+4}" stroke="{MUTED}" stroke-width="1.5" stroke-linecap="round" fill="none"/>'
for gi, (key, name) in enumerate(names):
    gy = y_top + gi * (3 * BH + 2 * IG + GG)
    f1 += f'<text class="a-fade" style="--d:{.4+.25*gi:.2f}s;--t:.4s" x="24" y="{gy+3*BH//2+IG+5}" font-size="15" fill="{INK}">{name}</text>'
    for pi, (pk, pl) in enumerate(prec):
        g = data[key]["precisions"][pk]["weights_gib"]
        y = gy + pi * (BH + IG)
        focal = key == "Llama-3.1-70B" and pk == "int4 g128"
        col = CLAY if focal else (INK if pk == "int4 g128" else MUTED)
        d = .5 + .25 * gi + .08 * pi
        w = g * K
        f1 += f'<text class="m a-fade" style="--d:{d:.2f}s;--t:.4s" x="{x0-8}" y="{y+16}" text-anchor="end" font-size="13" fill="{MUTED}">{pl}</text>'
        f1 += f'<rect class="a-growx" style="--d:{d:.2f}s;--t:.5s" x="{x0}" y="{y}" width="{w:.1f}" height="{BH}" rx="2" fill="{col}"/>'
        f1 += (f'<text class="m a-fade" data-count="{g:.1f}" data-dec="1" style="--d:{d:.2f}s;--t:.5s" x="{x0+w+8:.1f}" y="{y+16}" '
               f'font-size="14" fill="{CLAY if focal else INK}" {HALO}>{g:.1f}</text>')
room = data["Llama-3.1-70B"]["precisions"]["int4 g128"]["cards"]["48"]["room_gib"]
f1 += (f'<g class="a-fade" style="--d:2.0s;--t:.5s"><text x="24" y="{y_end+30}" font-size="15" fill="{CLAY}">'
       f'70B at int4 fits a 48 GB card with {room:.1f} GiB left.</text></g>')
f1 += '</svg>\n'
(OUT / "weight-memory-vs-cards.svg").write_text(f1)

# ---------- Figure 2: output error by scale setting ----------
# output-activations.txt, "none" column; perplexity from output-ppl.txt
rows = [("int8 per tensor", 3.51, "17.75"), ("int8 per channel", 0.64, "17.19"), ("int8 groups of 128", 0.49, "17.18"),
        ("int4 per tensor", 50.68, "10,816,108"), ("int4 per channel", 10.79, "31.76"), ("int4 groups of 128", 8.21, "20.49")]
x0, K = 168, 210 / 50.68
f2 = head(334, "Bars of output error for round-to-nearest quantization of Qwen2.5-0.5B. At 8 bits the error is 3.51, 0.64 and 0.49 percent for per tensor, per channel and groups of 128. At 4 bits it is 50.68, 10.79 and 8.21 percent, and perplexity is 10,816,108, 31.76 and 20.49.")
f2 += title("At 4 bits, group size decides the outcome", "Qwen2.5-0.5B, round to nearest. fp32 perplexity is 17.17.")
f2 += f'<text class="a-fade" style="--d:.3s;--t:.4s" x="{x0}" y="100" font-size="13" fill="{MUTED}">output error</text>'
f2 += f'<text class="a-fade" style="--d:.3s;--t:.4s" x="536" y="100" text-anchor="end" font-size="13" fill="{MUTED}">perplexity</text>'
f2 += f'<path class="a-draw" pathLength="1" style="--d:.15s;--t:.5s" d="M{x0} 108V306" stroke="{MUTED}" stroke-width="1.5" stroke-linecap="round" fill="none"/>'
for i, (lab, err, ppl) in enumerate(rows):
    y = 114 + i * 32 + (14 if i >= 3 else 0)
    focal = i == 5
    col = CLAY if focal else MUTED
    d = .5 + .2 * i
    w = err * K
    f2 += f'<text class="a-fade" style="--d:{d:.2f}s;--t:.4s" x="{x0-10}" y="{y+17}" text-anchor="end" font-size="15" fill="{INK}">{lab}</text>'
    f2 += f'<rect class="a-growx" style="--d:{d:.2f}s;--t:.6s" x="{x0}" y="{y}" width="{max(w,1.5):.1f}" height="24" rx="2" fill="{col}"/>'
    f2 += (f'<text class="m a-fade" data-count="{err}" data-dec="2" data-suf="%" style="--d:{d:.2f}s;--t:.6s" x="{x0+max(w,1.5)+8:.1f}" y="{y+17}" '
           f'font-size="14" fill="{CLAY if focal else INK}">{err:.2f}%</text>')
    f2 += f'<g class="a-fade" style="--d:{d+.4:.2f}s;--t:.4s"><text class="m" x="536" y="{y+17}" text-anchor="end" font-size="14" fill="{CLAY if focal else MUTED}">{ppl}</text></g>'
f2 += '</svg>\n'
(OUT / "quant-error-by-scale.svg").write_text(f2)

# ---------- Figure 3: where the error sits ----------
# output-weights.txt (int4 g128, top 1% weights: share of error 2.19%);
# output-activations.txt (int4 g128, 1% of channels by activation: 38.4%)
rows = [("Spread evenly", 1.0), ("Top 1% by weight size", 2.19), ("Top 1% by activation", 38.4)]
x0, K = 192, 270 / 38.4
f3 = head(212, "Bars of the share of int4 rounding error carried by 1 percent of the weights or channels. Spread evenly it would be 1 percent. The largest 1 percent of weights carry 2.19 percent. The 1 percent of input channels with the largest activations carry 38.4 percent.")
f3 += title("1% of channels carry 38% of the error", "Share of int4 g128 rounding error on Qwen2.5-0.5B.")
f3 += f'<path class="a-draw" pathLength="1" style="--d:.15s;--t:.5s" d="M{x0} 90V196" stroke="{MUTED}" stroke-width="1.5" stroke-linecap="round" fill="none"/>'
for i, (lab, v) in enumerate(rows):
    y = 98 + i * 34
    focal = i == 2
    col = CLAY if focal else MUTED
    d = .5 + .35 * i
    w = v * K
    f3 += f'<text class="a-fade" style="--d:{d:.2f}s;--t:.4s" x="{x0-10}" y="{y+17}" text-anchor="end" font-size="15" fill="{INK}">{lab}</text>'
    f3 += f'<rect class="a-growx" style="--d:{d:.2f}s;--t:.6s" x="{x0}" y="{y}" width="{w:.1f}" height="24" rx="2" fill="{col}"/>'
    dec = 2 if v == 2.19 else 1
    f3 += (f'<text class="m a-fade" data-count="{v}" data-dec="{dec}" data-suf="%" style="--d:{d:.2f}s;--t:.6s" x="{x0+w+8:.1f}" y="{y+17}" '
           f'font-size="14" fill="{CLAY if focal else INK}">{v:.{dec}f}%</text>')
f3 += '</svg>\n'
(OUT / "top-channels-error-share.svg").write_text(f3)
print("wrote", OUT)
