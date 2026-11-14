"""Cost per useful answer: single models and a cheap-first cascade.

Standard library only. Prices come from prices.json (copied from the live
pricing pages on 2026-11-14). Success rates, failure costs and verifier rates
are ASSUMPTIONS that this script sweeps; none of them is a measurement of any
real model.

    python3 cost_model.py > output.txt
"""
import json
import os
import random

HERE = os.path.dirname(os.path.abspath(__file__))
PRICES = json.load(open(os.path.join(HERE, "prices.json")))
IN_TOK, OUT_TOK = 3000, 500          # one request
VER_IN, VER_OUT = 3500, 100          # verifier: reads question + answer, says pass/fail
SEED = 20261114
TRIALS = 200_000
F_GRID = [0, 0.05, 0.10, 0.25, 0.50, 1, 2, 5]


def call_cost(model, tin, tout):
    m = PRICES["models"][model]
    return (tin * m["input"] + tout * m["output"]) / 1e6


def single(c, s, F):
    """Cost per useful answer when every answer is delivered and a wrong one costs F."""
    return (c + (1 - s) * F) / s


def breakeven(c_c, s_c, c_e, s_e):
    """Failure cost F* where single(cheap) == single(expensive). None if no crossover."""
    d = 1 / s_c - 1 / s_e
    if d <= 0:
        return None
    return (c_e / s_e - c_c / s_c) / d


def cascade_parts(c_c, c_e, v, s_c, s_e_esc, t, f):
    """Per task: expected spend, P(useful), P(wrong answer delivered).

    t = P(verifier passes | cheap answer right), f = P(verifier passes | cheap answer wrong).
    A rejected answer is escalated; the expensive answer is delivered unchecked.
    """
    p_rej = s_c * (1 - t) + (1 - s_c) * (1 - f)
    spend = c_c + v + p_rej * c_e
    good = s_c * t + p_rej * s_e_esc
    bad = (1 - s_c) * f + p_rej * (1 - s_e_esc)
    return spend, good, bad


def cascade(c_c, c_e, v, s_c, s_e_esc, t, f, F):
    spend, good, bad = cascade_parts(c_c, c_e, v, s_c, s_e_esc, t, f)
    return (spend + F * bad) / good


def mc_cascade(c_c, c_e, v, s_c, s_e_esc, t, f, seed):
    rng = random.Random(seed)
    spend = good = bad = 0
    for _ in range(TRIALS):
        spend += c_c + v
        right = rng.random() < s_c
        passed = rng.random() < (t if right else f)
        if passed:
            if right:
                good += 1
            else:
                bad += 1
        else:
            spend += c_e
            if rng.random() < s_e_esc:
                good += 1
            else:
                bad += 1
    return spend / TRIALS, good / TRIALS, bad / TRIALS


def money(x):
    if x >= 1:
        return f"${x:,.2f}"
    if x >= 0.01:
        return f"${x:.3f}"
    if x >= 0.001:
        return f"${x:.4f}"
    return f"${x:.5f}"


def fmt_f(F):
    return f"${F:g}"


print("# cost_model.py, seed", SEED, ", prices checked", PRICES["checked"])
print()

# ---------------------------------------------------------------- 1. prices
print("## 1. Prices and cost per request (3,000 input + 500 output tokens)")
print("| model | input $/MTok | output $/MTok | cost per request |")
print("| --- | --- | --- | --- |")
for name, m in PRICES["models"].items():
    print(f"| {name} | {m['input']} | {m['output']} | {money(call_cost(name, IN_TOK, OUT_TOK))} |")
print()
for pair, (cheap, exp) in PRICES["pairs"].items():
    ratio = call_cost(exp, IN_TOK, OUT_TOK) / call_cost(cheap, IN_TOK, OUT_TOK)
    print(f"{pair}: expensive costs {ratio:.1f}x the cheap one per request")
print()

S_C_LIST = [0.60, 0.80, 0.90]
S_E = 0.95

# ---------------------------------------------------- 2. cost per useful answer
print("## 2. Cost per useful answer = (attempt cost + failures x F) / successes")
print(f"ASSUMPTIONS: expensive success = {S_E}; cheap success in {S_C_LIST}; every answer is delivered, a wrong one costs F.")
for pair, (cheap, exp) in PRICES["pairs"].items():
    c_c, c_e = call_cost(cheap, IN_TOK, OUT_TOK), call_cost(exp, IN_TOK, OUT_TOK)
    print()
    print(f"### {pair}")
    hdr = "| F (cost of a wrong answer) | " + " | ".join(f"cheap @{int(s*100)}%" for s in S_C_LIST) + f" | expensive @{int(S_E*100)}% | cheapest |"
    print(hdr)
    print("| --- | " + " | ".join("---" for _ in S_C_LIST) + " | --- | --- |")
    for F in F_GRID:
        cheaps = [single(c_c, s, F) for s in S_C_LIST]
        e = single(c_e, S_E, F)
        win = "expensive" if e < cheaps[1] else "cheap"
        print(f"| {fmt_f(F)} | " + " | ".join(money(x) for x in cheaps) + f" | {money(e)} | {win} (at 80%) |")
print()

# ------------------------------------------------------------ 3. break-even F*
print("## 3. Break-even failure cost F*: above it the expensive model alone is cheaper per useful answer")
print(f"ASSUMPTION: expensive success = {S_E}. Rows sweep the cheap model's success rate.")
print("| cheap success | " + " | ".join(PRICES["pairs"].keys()) + " |")
print("| --- | --- | --- |")
for s in [0.50, 0.60, 0.70, 0.80, 0.85, 0.90, 0.93, 0.94, 0.95]:
    cells = []
    for pair, (cheap, exp) in PRICES["pairs"].items():
        fs = breakeven(call_cost(cheap, IN_TOK, OUT_TOK), s, call_cost(exp, IN_TOK, OUT_TOK), S_E)
        cells.append("never (cheap is as good)" if fs is None else money(fs))
    print(f"| {int(s*100)}% | " + " | ".join(cells) + " |")
print()
print("Same, expensive success = 0.99 (a stronger expensive model):")
print("| cheap success | " + " | ".join(PRICES["pairs"].keys()) + " |")
print("| --- | --- | --- |")
for s in [0.60, 0.80, 0.90, 0.95]:
    cells = []
    for pair, (cheap, exp) in PRICES["pairs"].items():
        fs = breakeven(call_cost(cheap, IN_TOK, OUT_TOK), s, call_cost(exp, IN_TOK, OUT_TOK), 0.99)
        cells.append(money(fs))
    print(f"| {int(s*100)}% | " + " | ".join(cells) + " |")
print()

# ------------------------------------------------- 4. the steelman: F = 0
print("## 4. Steelman: failures are free and visible (the user just asks again)")
print("With F = 0 and a retry until it works, cost per useful answer is c / s, so cheap wins while s_c / s_e > c_cheap / c_exp.")
for pair, (cheap, exp) in PRICES["pairs"].items():
    c_c, c_e = call_cost(cheap, IN_TOK, OUT_TOK), call_cost(exp, IN_TOK, OUT_TOK)
    floor = S_E * c_c / c_e
    print(f"{pair}: cheap wins at F = 0 for any cheap success above {floor*100:.1f}% (expensive at {int(S_E*100)}%)")
print()

# -------------------------------------------------------------- 5. cascade
T_PASS = 0.95
S_C = 0.80
print("## 5. Cascade: cheap answers, a verifier checks, a rejected answer goes to the expensive model")
print(f"ASSUMPTIONS: cheap success {S_C}, expensive success {S_E}, verifier passes {int(T_PASS*100)}% of right answers (true positive).")
print(f"The verifier is one cheap-model call ({VER_IN} in, {VER_OUT} out). Verifier errors are independent of anything else (flatters the cascade).")
print("f = chance the verifier passes a WRONG answer (the leak). Expensive answers are delivered unchecked.")
LEAKS = [0.0, 0.05, 0.10, 0.25, 0.50, 0.75, 1.0]
for pair, (cheap, exp) in PRICES["pairs"].items():
    c_c, c_e = call_cost(cheap, IN_TOK, OUT_TOK), call_cost(exp, IN_TOK, OUT_TOK)
    v = call_cost(cheap, VER_IN, VER_OUT)
    print()
    print(f"### {pair}: verifier costs {money(v)} per check")
    for F in [0.05, 0.25, 1, 5]:
        cheap_alone = single(c_c, S_C, F)
        exp_alone = single(c_e, S_E, F)
        print(f"F = {fmt_f(F)}: cheap alone {money(cheap_alone)}, expensive alone {money(exp_alone)}")
        print("| leak f | cascade | wrong answers delivered | beats expensive? | beats cheap? |")
        print("| --- | --- | --- | --- | --- |")
        for f in LEAKS:
            spend, good, bad = cascade_parts(c_c, c_e, v, S_C, S_E, T_PASS, f)
            cc = cascade(c_c, c_e, v, S_C, S_E, T_PASS, f, F)
            print(f"| {f:.2f} | {money(cc)} | {bad*100:.1f}% | {'yes' if cc < exp_alone else 'no'} | {'yes' if cc < cheap_alone else 'no'} |")
        print()

# ---------------------------------------- 6. where does the cascade win / leak break-even
print("## 6. Where the cascade wins (Anthropic pair unless stated)")
for pair, (cheap, exp) in PRICES["pairs"].items():
    c_c, c_e = call_cost(cheap, IN_TOK, OUT_TOK), call_cost(exp, IN_TOK, OUT_TOK)
    v = call_cost(cheap, VER_IN, VER_OUT)
    print(f"### {pair}")
    # leak at which cascade == expensive alone, per F (bisection)
    print("Leak f* above which the cascade is no cheaper than the expensive model alone:")
    print("| F | f* |")
    print("| --- | --- |")
    for F in [0.05, 0.10, 0.25, 0.50, 1, 2, 5]:
        exp_alone = single(c_e, S_E, F)
        if cascade(c_c, c_e, v, S_C, S_E, T_PASS, 1.0, F) < exp_alone:
            print(f"| {fmt_f(F)} | none (cascade wins even at f = 1.0) |")
            continue
        if cascade(c_c, c_e, v, S_C, S_E, T_PASS, 0.0, F) >= exp_alone:
            print(f"| {fmt_f(F)} | none (cascade loses even at f = 0) |")
            continue
        lo, hi = 0.0, 1.0
        for _ in range(60):
            mid = (lo + hi) / 2
            if cascade(c_c, c_e, v, S_C, S_E, T_PASS, mid, F) < exp_alone:
                lo = mid
            else:
                hi = mid
        print(f"| {fmt_f(F)} | {lo:.3f} |")
    print()
    print("F range where a cascade with leak f = 0.10 is the cheapest of the three (scan $0 to $5, step $0.005):")
    best = []
    for i in range(0, 1001):
        F = i * 0.005
        costs = {
            "cheap": single(c_c, S_C, F),
            "expensive": single(c_e, S_E, F),
            "cascade": cascade(c_c, c_e, v, S_C, S_E, T_PASS, 0.10, F),
        }
        best.append((F, min(costs, key=costs.get)))
    spans, start, cur = [], best[0][0], best[0][1]
    for F, w in best[1:]:
        if w != cur:
            spans.append((cur, start, F))
            start, cur = F, w
    spans.append((cur, start, best[-1][0]))
    for w, a, b in spans:
        print(f"  {w}: from {fmt_f(round(a,3))} up to {fmt_f(round(b,3))}")
    print()

# hard-case sensitivity
print("## 7. Sensitivity: escalated tasks are harder (expensive success on escalated tasks drops)")
cheap, exp = PRICES["pairs"]["Anthropic (Haiku 5.5 vs Opus 5.5)"]
c_c, c_e = call_cost(cheap, IN_TOK, OUT_TOK), call_cost(exp, IN_TOK, OUT_TOK)
v = call_cost(cheap, VER_IN, VER_OUT)
print("Anthropic pair, leak f = 0.10, F = $1. Expensive alone stays at 95%.")
print("| expensive success on escalated tasks | cascade | expensive alone | wrong answers delivered |")
print("| --- | --- | --- | --- |")
for se in [0.95, 0.90, 0.80, 0.70, 0.50]:
    cc = cascade(c_c, c_e, v, S_C, se, T_PASS, 0.10, 1)
    _, _, bad = cascade_parts(c_c, c_e, v, S_C, se, T_PASS, 0.10)
    print(f"| {int(se*100)}% | {money(cc)} | {money(single(c_e, S_E, 1))} | {bad*100:.1f}% |")
print()

# -------------------------------------------------- 8. Monte Carlo check
print(f"## 8. Monte Carlo check ({TRIALS:,} tasks per row, seed {SEED}, Anthropic pair, f varies)")
print("| leak f | closed-form spend/task | MC spend/task | closed-form P(useful) | MC P(useful) | closed-form P(wrong) | MC P(wrong) |")
print("| --- | --- | --- | --- | --- | --- | --- |")
for i, f in enumerate(LEAKS):
    a = cascade_parts(c_c, c_e, v, S_C, S_E, T_PASS, f)
    b = mc_cascade(c_c, c_e, v, S_C, S_E, T_PASS, f, f"{SEED}-{i}")
    print(f"| {f:.2f} | {a[0]:.6f} | {b[0]:.6f} | {a[1]:.4f} | {b[1]:.4f} | {a[2]:.4f} | {b[2]:.4f} |")
print()

# --------------------------------------------------------- 9. three volumes
print("## 9. Spend to get N useful answers (Anthropic pair, F = $0.25, leak f = 0.10)")
print("| useful answers | cheap alone | expensive alone | cascade |")
print("| --- | --- | --- | --- |")
F = 0.25
unit = {
    "cheap": single(c_c, S_C, F),
    "exp": single(c_e, S_E, F),
    "casc": cascade(c_c, c_e, v, S_C, S_E, T_PASS, 0.10, F),
}
for n in [10_000, 1_000_000, 100_000_000]:
    print(f"| {n:,} | {money(unit['cheap']*n)} | {money(unit['exp']*n)} | {money(unit['casc']*n)} |")
print("(This counts failure cost in the total, so it is spend plus cost of wrong answers, not an invoice.)")
print()
print("Spend on tokens only for the same volumes (no failure cost):")
print("| useful answers | cheap alone | expensive alone | cascade |")
print("| --- | --- | --- | --- |")
spend_c = single(c_c, S_C, 0)
spend_e = single(c_e, S_E, 0)
spend_k = cascade(c_c, c_e, v, S_C, S_E, T_PASS, 0.10, 0)
for n in [10_000, 1_000_000, 100_000_000]:
    print(f"| {n:,} | {money(spend_c*n)} | {money(spend_e*n)} | {money(spend_k*n)} |")
