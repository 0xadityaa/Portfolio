"""Draw the animated figures for the post from results/analysis.json.

Usage: python make_chart.py RESULTS_DIR OUT_DIR

Writes chunk-size-equal-budget.svg, chunk-size-vs-retriever.svg and
fixed-k-more-text.svg into OUT_DIR (public/images/blog). Standard library only.
"""
import json
import sys
from pathlib import Path

a = json.loads((Path(sys.argv[1]) / "analysis.json").read_text())
OUT = Path(sys.argv[2])
SIZES = [64, 128, 256, 512, 1024]
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


def bud(ret, size):
    return a["budget"][f"{ret}_2000_{size}"]["recall"] * 100


# ---------- Figure 1: recall at an equal budget ----------
L, R, T, B = 64, 440, 100, 290
VMAX, VMIN = 100.0, 40.0
x = lambda i: L + 20 + i * (R - L - 40) / 4
y = lambda v: T + (VMAX - v) / (VMAX - VMIN) * (B - T)
f1 = head(362, "Line chart of recall at a 2,000-token context by chunk size. BM25 stays between 87 and 92 percent at every size from 64 to 1,024 tokens. The embedding model falls from 90.1 percent at 64 tokens to 51.4 percent at 1,024.")
f1 += title("The best chunk size depends on the retriever", "Recall with 2,000 tokens of context. SQuAD v1.1, 10,570 questions.")
for v in (50, 75, 100):
    f1 += (f'<path class="a-fade" style="--d:.3s;--t:.5s" d="M{L} {y(v):.1f}H{R}" stroke="{LINE}" stroke-width="1" stroke-dasharray="3 4"/>'
           f'<text class="m a-fade" style="--d:.4s;--t:.5s" x="{L-8}" y="{y(v)+5:.1f}" text-anchor="end" font-size="13" fill="{MUTED}">{v}%</text>')
f1 += f'<path class="a-draw" pathLength="1" style="--d:.15s;--t:.5s" d="M{L} {B}H{R}" stroke="{MUTED}" stroke-width="1.5" stroke-linecap="round" fill="none"/>'
for i, s in enumerate(SIZES):
    k = int(2000 / s + 0.5)
    f1 += f'<text class="m a-fade" style="--d:.4s;--t:.5s" x="{x(i):.1f}" y="{B+22}" text-anchor="middle" font-size="13" fill="{INK}">{s}</text>'
    f1 += f'<text class="m a-fade" style="--d:.4s;--t:.5s" x="{x(i):.1f}" y="{B+40}" text-anchor="middle" font-size="13" fill="{MUTED}">k={k}</text>'
f1 += f'<text class="a-fade" style="--d:.4s;--t:.5s" x="{R}" y="{B+64}" text-anchor="end" font-size="13" fill="{MUTED}">chunk size in tokens, no overlap</text>'
for ret, col, lab, d in (("bm25", MUTED, "BM25", .6), ("embed", CLAY, "embeddings", 1.2)):
    other = "embed" if ret == "bm25" else "bm25"
    pts = [(x(i), y(bud(ret, s))) for i, s in enumerate(SIZES)]
    f1 += (f'<path class="a-draw" pathLength="1" style="--d:{d}s;--t:1s" d="M{"L".join(f"{px:.1f} {py:.1f}" for px, py in pts)}" '
           f'fill="none" stroke="{col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>')
    pt = ""
    for (px, py), s in zip(pts, SIZES):
        v = bud(ret, s)
        dy = -11 if v >= bud(other, s) else 22
        dx, anc = (px, "middle")
        if ret == "embed" and s == 512:
            dx, anc, dy = px - 10, "end", 4
        pt += (f'<circle cx="{px:.1f}" cy="{py:.1f}" r="4" fill="{col}"/>'
               f'<text class="m" x="{dx:.1f}" y="{py+dy:.1f}" text-anchor="{anc}" font-size="13" fill="{INK if ret == "bm25" else CLAY}">{v:.1f}</text>')
    f1 += f'<g class="a-fade" style="--d:{d+.9:.1f}s;--t:.4s">{pt}<text x="{R+22}" y="{pts[-1][1]+5:.1f}" font-size="15" fill="{col}">{lab}</text></g>'
st = {c["size"]: c["embedder_share_truncated"] for c in (v for k, v in json.loads((Path(sys.argv[1]) / "stats.json").read_text()).items() if k.startswith("cfg_") and k.endswith("_0"))}
f1 += (f'<g class="a-fade" style="--d:2.6s;--t:.5s"><text x="{L+20}" y="222" font-size="14" fill="{MUTED}">bge-small stops reading at 512 tokens.</text>'
       f'<text x="{L+20}" y="242" font-size="14" fill="{MUTED}">Cut off: {st[512]*100:.0f}% at 512, {st[1024]*100:.1f}% at 1,024.</text></g>')
f1 += '</svg>\n'
(OUT / "chunk-size-equal-budget.svg").write_text(f1)

# ---------- Figure 2: chunk size against the retriever ----------
# output: results/analysis.txt, "Spread across chunk sizes vs gap between retrievers", budget 2000
rows = [("BM25, sizes 64 to 1,024", 5.3), ("Embeddings, sizes 64 to 256", 5.9), ("Swapping the retriever", 2.1)]
x0, K = 214, 36
f2 = head(224, "Bars of recall change at a 2,000-token budget in points. Changing chunk size moves BM25 by 5.3 points and the embedding model by 5.9 over the sizes it reads in full. Swapping the retriever, each at its best size, moves it by 2.1.")
f2 += title("Chunk size moves recall more than the retriever", "Recall change in points, 2,000-token budget.")
f2 += f'<path class="a-draw" pathLength="1" style="--d:.15s;--t:.5s" d="M{x0} 90V186" stroke="{MUTED}" stroke-width="1.5" stroke-linecap="round" fill="none"/>'
for i, (lab, v) in enumerate(rows):
    yy = 98 + i * 32
    col = CLAY if i == 1 else (INK if i == 2 else MUTED)
    d = .5 + .35 * i
    f2 += f'<text class="a-fade" style="--d:{d:.2f}s;--t:.4s" x="{x0-10}" y="{yy+17}" text-anchor="end" font-size="15" fill="{INK}">{lab}</text>'
    f2 += f'<rect class="a-growx" style="--d:{d:.2f}s;--t:.6s" x="{x0}" y="{yy}" width="{v*K:.1f}" height="24" rx="2" fill="{col}"/>'
    f2 += (f'<text class="m a-fade" data-count="{v}" data-dec="1" data-suf=" pts" style="--d:{d:.2f}s;--t:.6s" x="{x0+v*K+8:.1f}" y="{yy+17}" '
           f'font-size="14" fill="{CLAY if i == 1 else INK}">{v:.1f} pts</text>')
f2 += f'<text class="a-fade" style="--d:1.6s;--t:.5s" x="24" y="212" font-size="13" fill="{MUTED}">The embedding model reads 512 tokens at most, so 512 and 1,024 are left out.</text>'
f2 += '</svg>\n'
(OUT / "chunk-size-vs-retriever.svg").write_text(f2)

# ---------- Figure 3: fixed k just sends more text ----------
fk = [(s, a["fixed_k"][f"bm25_{s}_5"]) for s in SIZES]
x0, K = 112, 270 / fk[-1][1]["tokens"]
f3 = head(304, "Bars of tokens handed to the model when BM25 retrieves its top 5 chunks, from 319 at 64-token chunks to 4,988 at 1,024-token chunks, with recall at 5 rising from 76.6 to 95.3 percent.")
f3 += title("At a fixed k, bigger chunks send more text", "BM25, top 5 chunks. Tokens handed to the model.")
f3 += f'<text class="a-fade" style="--d:.3s;--t:.4s" x="536" y="100" text-anchor="end" font-size="13" fill="{MUTED}">recall@5</text>'
f3 += f'<path class="a-draw" pathLength="1" style="--d:.15s;--t:.5s" d="M{x0} 108V258" stroke="{MUTED}" stroke-width="1.5" stroke-linecap="round" fill="none"/>'
for i, (s, r) in enumerate(fk):
    yy = 114 + i * 30
    focal = i == 4
    col = CLAY if focal else MUTED
    d = .5 + .25 * i
    w = r["tokens"] * K
    f3 += f'<text class="m a-fade" style="--d:{d:.2f}s;--t:.4s" x="{x0-10}" y="{yy+17}" text-anchor="end" font-size="14" fill="{INK}">{s:,}</text>'
    f3 += f'<rect class="a-growx" style="--d:{d:.2f}s;--t:.6s" x="{x0}" y="{yy}" width="{w:.1f}" height="24" rx="2" fill="{col}"/>'
    tk = round(r["tokens"])
    f3 += (f'<text class="m a-fade" data-count="{tk}" style="--d:{d:.2f}s;--t:.6s" x="{x0+w+8:.1f}" y="{yy+17}" font-size="14" '
           f'fill="{CLAY if focal else INK}">{tk:,}</text>')
    f3 += f'<g class="a-fade" style="--d:{d+.4:.2f}s;--t:.4s"><text class="m" x="536" y="{yy+17}" text-anchor="end" font-size="14" fill="{CLAY if focal else MUTED}">{r["recall"]*100:.1f}%</text></g>'
f3 += f'<text class="a-fade" style="--d:1.9s;--t:.5s" x="24" y="290" font-size="15" fill="{MUTED}">Chunk size in tokens on the left. More text, more hits.</text>'
f3 += '</svg>\n'
(OUT / "fixed-k-more-text.svg").write_text(f3)
print("wrote figures to", OUT)
