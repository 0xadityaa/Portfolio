"""Paired comparisons on the same 100 articles: how many articles only A gets right, how many only B, and an exact
two-sided sign test per example set.

usage: python paired.py raw-0.5b.jsonl > paired.txt
"""
import json, math, sys
from collections import defaultdict

by = defaultdict(dict)
for line in open(sys.argv[1]):
    r = json.loads(line)
    by[(r["template"], r["k"], r["set"])][r["i"]] = r["pred"] == r["gold"]

PAIRS = [
    ("chat", 0, "chat", 1, "own template 0 shots vs 1 shot"),
    ("chat", 0, "chat", 3, "own template 0 shots vs 3 shots"),
    ("chat", 0, "chat", 8, "own template 0 shots vs 8 shots"),
    ("chat", 0, "raw", 0, "own template vs no template, 0 shots"),
    ("chat", 8, "raw", 8, "own template vs no template, 8 shots"),
    ("chat", 8, "llama", 8, "own template vs Llama-2 template, 8 shots"),
]
print("Articles only A gets right vs only B gets right (of 100), exact two-sided sign test p. 0-shot has one set.")
for ta, ka, tb, kb, label in PAIRS:
    print(label)
    for s in (1, 2, 3):
        a = by.get((ta, ka, s if ka else 1))
        b = by.get((tb, kb, s if kb else 1))
        if not a or not b:
            continue
        x = sum(a[i] and not b[i] for i in a)
        y = sum(b[i] and not a[i] for i in a)
        n, k = x + y, min(x, y)
        p = min(1.0, 2 * sum(math.comb(n, j) for j in range(k + 1)) / 2 ** n) if n else 1.0
        print(f"  set {s}: A only {x:2d}, B only {y:2d}, p = {p:.3f}")
