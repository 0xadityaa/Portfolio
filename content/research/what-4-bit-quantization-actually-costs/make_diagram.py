"""Draw public/images/blog/weight-memory-vs-cards.svg from memory.json.

    python3 make_diagram.py ../../../public/images/blog/weight-memory-vs-cards.svg
"""
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).parent
data = json.loads((HERE / "memory.json").read_text())
out = pathlib.Path(sys.argv[1])

W, H = 900, 600
X0, X1 = 100, 860  # axis range in px
MAX = 140.0        # GiB at X1
sx = lambda g: X0 + (X1 - X0) * g / MAX
cards = {"24 GB": 24e9 / 2**30, "48 GB": 48e9 / 2**30, "80 GB": 80e9 / 2**30}
FONT = "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
MONO = "ui-monospace, SFMono-Regular, Menlo, monospace"
names = ["Llama-3.1-8B", "Qwen2.5-14B", "Qwen2.5-32B", "Llama-3.1-70B"]
prec = ["fp16", "int8 g128", "int4 g128"]
label = {"fp16": "fp16", "int8 g128": "int8", "int4 g128": "int4"}

s = []
a = s.append
a(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" '
  f'aria-labelledby="t d" font-family="{FONT}">')
a('<title id="t">Weight memory at fp16, int8 and int4 against 24, 48 and 80 GB cards</title>')
a('<desc id="d">Horizontal bars of weight memory in GiB for four models. Llama 3.1 8B is 15.0, 8.6 and 5.3 GiB at fp16, int8 and int4. '
  'Qwen2.5 14B is 27.5, 15.5 and 9.3. Qwen2.5 32B is 61.0, 32.6 and 18.0. Llama 3.1 70B is 131.4, 69.2 and 37.0. '
  'Dashed lines mark the 24, 48 and 80 GB cards. Llama 3.1 70B at int4 is the first 70B bar to fit a 48 GB card.</desc>')
a(f'<rect width="{W}" height="{H}" fill="#30302E"/>')
a(f'<text x="40" y="40" fill="#FAF9F5" font-size="20" font-weight="600">4-bit weights take a 70B model from two 80 GB cards to one</text>')
a(f'<text x="40" y="64" fill="#FAF9F5" fill-opacity="0.7" font-size="13">Weight memory in GiB, group size 128, embeddings and output head kept in fp16. Dashed lines: card memory, before KV cache.</text>')
for lab, g in cards.items():
    x = sx(g)
    a(f'<line x1="{x:.1f}" y1="88" x2="{x:.1f}" y2="{H-50}" stroke="#FAF9F5" stroke-opacity="0.45" stroke-dasharray="4 5"/>')
    a(f'<text x="{x:.1f}" y="82" text-anchor="middle" fill="#FAF9F5" fill-opacity="0.8" font-size="12" font-family="{MONO}">{lab}</text>')
y = 104
for n in names:
    a(f'<text x="40" y="{y+12}" fill="#FAF9F5" font-size="14" font-weight="600">{n}</text>')
    y += 20
    for p in prec:
        g = data[n]["precisions"][p]["weights_gib"]
        hot = (n == "Llama-3.1-70B" and p == "int4 g128")
        fill = "#D97757" if hot else "#FAF9F5"
        op = "1" if (hot or p == "int4 g128") else ("0.55" if p == "int8 g128" else "0.28")
        a(f'<text x="{X0-8}" y="{y+13}" text-anchor="end" fill="#FAF9F5" fill-opacity="0.75" font-size="12" font-family="{MONO}">{label[p]}</text>')
        a(f'<rect x="{X0}" y="{y+2}" width="{sx(g)-X0:.1f}" height="16" rx="2" fill="{fill}" fill-opacity="{op}"/>')
        a(f'<text x="{sx(g)+8:.1f}" y="{y+14}" fill="{"#D97757" if hot else "#FAF9F5"}" font-size="12" font-family="{MONO}" font-weight="{600 if hot else 400}">{g:.1f}</text>')
        y += 22
    y += 10
a(f'<text x="40" y="{H-20}" fill="#FAF9F5" fill-opacity="0.5" font-size="12">source: memory.py, pinned config.json files, NVIDIA spec pages for card sizes</text>')
a('</svg>')
out.write_text("\n".join(s) + "\n")
