"""Draw the chart for the post from results.json: schema-valid vs all-five-fields-right, per arm."""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
R = json.load(open(os.path.join(HERE, "results.json")))
ARMS = [("instr", "A  Instruction only"), ("fewshot", "B  3-shot"), ("instr_o", "C  Constrained"), ("fewshot_o", "D  3-shot + constrained")]
W, H = 760, 400
BG, INK, ACC = "#30302E", "#FAF9F5", "#D97757"
X0, BARW = 230, 440
rows = []
y = 120
for key, label in ARMS:
    a = R[key]
    n = a["n"]
    valid = 100 * a["valid_rep"] / n
    allr = 100 * a["hit_rep"]["all_five"] / n
    rows.append((label, valid, allr, y))
    y += 66
svg = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" font-family="Helvetica, Arial, sans-serif">',
       f'<rect width="{W}" height="{H}" fill="{BG}"/>',
       f'<text x="30" y="40" font-size="20" font-weight="700" fill="{INK}">Valid JSON is not right JSON</text>',
       f'<text x="30" y="64" font-size="13" fill="{INK}" opacity="0.75">Qwen2.5-0.5B-Instruct, 120 invented messages, 5 fields. Code fences stripped before scoring.</text>',
       f'<rect x="30" y="82" width="12" height="12" fill="{INK}" opacity="0.55"/><text x="48" y="93" font-size="13" fill="{INK}">schema-valid</text>',
       f'<rect x="150" y="82" width="12" height="12" fill="{ACC}"/><text x="168" y="93" font-size="13" fill="{INK}">all five fields right</text>']
for label, valid, allr, y in rows:
    svg.append(f'<text x="30" y="{y + 22}" font-size="14" fill="{INK}">{label}</text>')
    svg.append(f'<rect x="{X0}" y="{y}" width="{BARW * valid / 100:.1f}" height="20" fill="{INK}" opacity="0.55"/>')
    svg.append(f'<text x="{X0 + BARW * valid / 100 + 8:.1f}" y="{y + 15}" font-size="13" fill="{INK}">{valid:.1f}%</text>')
    svg.append(f'<rect x="{X0}" y="{y + 24}" width="{BARW * allr / 100:.1f}" height="20" fill="{ACC}"/>')
    svg.append(f'<text x="{X0 + BARW * allr / 100 + 8:.1f}" y="{y + 39}" font-size="13" fill="{INK}">{allr:.1f}%</text>')
svg.append(f'<line x1="{X0}" y1="112" x2="{X0}" y2="{y + 44}" stroke="{INK}" opacity="0.4"/>')
svg.append(f'<text x="30" y="{H - 14}" font-size="12" fill="{INK}" opacity="0.7">Raw output, no stripping: A parses 0 of 120 (all fenced). B, C, D are unchanged.</text>')
svg.append("</svg>")
out = os.path.join(HERE, "..", "..", "..", "public", "images", "blog", "valid-json-vs-right-answers.svg")
open(out, "w").write("\n".join(svg) + "\n")
print(os.path.normpath(out))
