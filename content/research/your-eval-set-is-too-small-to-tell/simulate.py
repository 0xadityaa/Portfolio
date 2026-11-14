"""Eval-size simulation: can a small eval tell a better system from a worse one?

Run:  python simulate.py     (seed 20261114; prints everything, writes results.json)
Needs only NumPy. See README.md.

Model. System A has true accuracy p_a, system B has p_b (A is better).
Each example is scored right/wrong (binary) by each system.
  - "independent": the two systems' outcomes are independent.
  - "paired": the same examples go to both systems and the outcomes are correlated
    (phi = Pearson correlation of the two 0/1 outcomes). Most examples are easy
    or hard for both, so phi > 0.
For paired data the cell probabilities are P(both right) = pa*pb + phi*sd_a*sd_b, etc.

Per simulated eval we record the observed difference (A - B) and a 95% bootstrap CI
(1,000 resamples, percentile method). For binary scores the bootstrap can be drawn
exactly from binomials: the unpaired analysis resamples each system's successes on
its own; the paired analysis resamples the four cells (both right, A only, B only,
both wrong) as one multinomial, which keeps each example's pair together.
"""
import json
import math
import sys
from statistics import NormalDist

import numpy as np

SEED = 20261114
SIMS = 5000          # simulated evals per cell of the table
BOOT = 1000          # bootstrap resamples per simulated eval
SIZES = [25, 50, 100, 200, 500, 1000]
BASE = 0.80
GAPS = [0.03, 0.05, 0.10]
PHI = 0.5            # headline outcome correlation (Miller's worked example also uses 0.5)
PHIS_SWEEP = [0.3, 0.5, 0.7]

rng = np.random.default_rng(SEED)
Z = NormalDist()


def cell_probs(pa, pb, phi):
    """(both right, A only, B only, both wrong) for outcome correlation phi."""
    both = pa * pb + phi * math.sqrt(pa * (1 - pa) * pb * (1 - pb))
    a_only, b_only = pa - both, pb - both
    neither = 1 - both - a_only - b_only
    probs = np.array([both, a_only, b_only, neither])
    assert (probs >= -1e-12).all(), f"phi={phi} impossible for pa={pa}, pb={pb}"
    return np.clip(probs, 0, 1)


def sample_cells(n, probs, sims):
    """sims x 4 counts: multinomial(n, probs)."""
    return rng.multinomial(n, probs, size=sims)


def multinomial_rows(n, probs_rows):
    """Row-wise multinomial for varying probabilities, drawn by sequential binomials."""
    m = probs_rows.shape[0]
    out = np.zeros((m, 4), dtype=np.int64)
    remaining = np.full(m, n, dtype=np.int64)
    rest = np.ones(m)
    for k in range(3):
        p = np.where(rest > 1e-12, probs_rows[:, k] / np.maximum(rest, 1e-12), 0.0)
        out[:, k] = rng.binomial(remaining, np.clip(p, 0, 1))
        remaining = remaining - out[:, k]
        rest = rest - probs_rows[:, k]
    out[:, 3] = remaining
    return out


def ci_independent(n, pa_hat, pb_hat):
    """95% bootstrap CI of A-B when each system is resampled on its own."""
    a = rng.binomial(n, pa_hat[:, None], size=(len(pa_hat), BOOT)) / n
    b = rng.binomial(n, pb_hat[:, None], size=(len(pb_hat), BOOT)) / n
    d = a - b
    return np.percentile(d, 2.5, axis=1), np.percentile(d, 97.5, axis=1)


def ci_paired(n, cells):
    """95% bootstrap CI of A-B resampling whole examples (the pair stays together)."""
    s = cells.shape[0]
    probs = cells / n
    rep = np.repeat(probs, BOOT, axis=0)                  # (S*BOOT, 4)
    draw = multinomial_rows(n, rep).reshape(s, BOOT, 4)
    d = (draw[:, :, 1] - draw[:, :, 2]) / n               # A only minus B only
    return np.percentile(d, 2.5, axis=1), np.percentile(d, 97.5, axis=1)


def mcnemar_chi2(cells):
    b, c = cells[:, 1].astype(float), cells[:, 2].astype(float)
    tot = b + c
    with np.errstate(divide="ignore", invalid="ignore"):
        stat = np.where(tot > 0, (b - c) ** 2 / tot, 0.0)
    return stat


def wtl(diff):
    return float((diff > 0).mean()), float((diff == 0).mean()), float((diff < 0).mean())


def run_cell(n, pa, pb, phi):
    """One table cell. Returns a dict of rates and mean CI widths."""
    res = {"n": n}
    # Independent outcomes, independent analysis.
    ind = sample_cells(n, cell_probs(pa, pb, 0.0), SIMS)
    pa_i = (ind[:, 0] + ind[:, 1]) / n
    pb_i = (ind[:, 0] + ind[:, 2]) / n
    diff_i = pa_i - pb_i
    lo, hi = ci_independent(n, pa_i, pb_i)
    res["ind_win"], res["ind_tie"], res["ind_lose"] = wtl(diff_i)
    res["ind_ci_width"] = float((hi - lo).mean())
    res["ind_sig"] = float((lo > 0).mean())
    # Correlated outcomes (same examples). Analysis 1: ignore the pairing.
    cor = sample_cells(n, cell_probs(pa, pb, phi), SIMS)
    pa_c = (cor[:, 0] + cor[:, 1]) / n
    pb_c = (cor[:, 0] + cor[:, 2]) / n
    diff_c = pa_c - pb_c
    res["cor_win"], res["cor_tie"], res["cor_lose"] = wtl(diff_c)
    lo_u, hi_u = ci_independent(n, pa_c, pb_c)
    res["cor_unpaired_ci_width"] = float((hi_u - lo_u).mean())
    res["cor_unpaired_sig"] = float((lo_u > 0).mean())
    # Analysis 2: paired bootstrap, and McNemar.
    lo_p, hi_p = ci_paired(n, cor)
    res["cor_paired_ci_width"] = float((hi_p - lo_p).mean())
    res["cor_paired_sig"] = float((lo_p > 0).mean())
    chi = mcnemar_chi2(cor)
    res["cor_mcnemar_sig"] = float(((chi > 3.841458820694124) & (diff_c > 0)).mean())
    return res


def power_search(pa, pb, phi, target=0.8, sims=20000):
    """Smallest n (on a fine grid) where each test reaches `target` power.
    Unpaired: two-proportion z test on independent samples of n each.
    Paired: McNemar chi-square (no continuity correction) on n shared examples."""
    grid = sorted(set(int(round(x)) for x in np.geomspace(25, 40000, 160)))
    out = {"unpaired": None, "paired": None}
    for n in grid:
        if out["unpaired"] is None:
            ind = sample_cells(n, cell_probs(pa, pb, 0.0), sims)
            ha, hb = (ind[:, 0] + ind[:, 1]) / n, (ind[:, 0] + ind[:, 2]) / n
            pool = (ha + hb) / 2
            se = np.sqrt(np.maximum(2 * pool * (1 - pool) / n, 1e-18))
            z = (ha - hb) / se
            if (z > 1.959964).mean() >= target:
                out["unpaired"] = n
        if out["paired"] is None:
            cor = sample_cells(n, cell_probs(pa, pb, phi), sims)
            chi = mcnemar_chi2(cor)
            d = cor[:, 1] - cor[:, 2]
            if ((chi > 3.841459) & (d > 0)).mean() >= target:
                out["paired"] = n
        if all(v is not None for v in out.values()):
            break
    return out


def analytic_n(pa, pb, phi, paired):
    """Normal-approximation sample size for 80% power, two-sided 5% (a check on the simulation)."""
    za, zb = Z.inv_cdf(0.975), Z.inv_cdf(0.8)
    var = pa * (1 - pa) + pb * (1 - pb)
    if paired:
        var -= 2 * phi * math.sqrt(pa * (1 - pa) * pb * (1 - pb))
    return math.ceil((za + zb) ** 2 * var / (pa - pb) ** 2)


def pct(x):
    return f"{100 * x:5.1f}%"


def main():
    print(f"python {sys.version.split()[0]}  numpy {np.__version__}  seed {SEED}  sims {SIMS}  boot {BOOT}")
    print(f"base accuracy B = {BASE:.0%}; A = B + gap; headline phi = {PHI}")
    everything = {"meta": {"seed": SEED, "sims": SIMS, "boot": BOOT, "phi": PHI, "numpy": np.__version__},
                  "table1": {}, "sweep": {}, "power": {}}

    for gap in GAPS:
        pa, pb = BASE + gap, BASE
        print(f"\n=== TRUE {pa:.0%} vs {pb:.0%} (gap {gap*100:.0f} points), phi = {PHI} for paired ===")
        print("win/tie/lose = how often the better system A shows a higher / equal / lower score.")
        print("CI w = mean width of the 95% bootstrap CI of A - B, in points. sig = share of evals whose CI is entirely above zero.")
        print(f"{'n':>5} | {'IND win':>8} {'tie':>6} {'lose':>6} {'CI w':>5} {'sig':>6} | {'PAIRED-DATA win':>15} {'tie':>6} {'lose':>6} | {'CIw unp':>7} {'CIw pair':>8} {'narrower':>8} | {'sig unp':>7} {'sig pair':>8} {'sig McN':>7}")
        rows = []
        for n in SIZES:
            r = run_cell(n, pa, pb, PHI)
            rows.append(r)
            shrink = 1 - r["cor_paired_ci_width"] / r["cor_unpaired_ci_width"]
            print(f"{n:>5} | {pct(r['ind_win']):>8} {pct(r['ind_tie']):>6} {pct(r['ind_lose']):>6} {100*r['ind_ci_width']:>5.1f} {pct(r['ind_sig']):>6} | {pct(r['cor_win']):>15} {pct(r['cor_tie']):>6} {pct(r['cor_lose']):>6} | {100*r['cor_unpaired_ci_width']:>7.1f} {100*r['cor_paired_ci_width']:>8.1f} {pct(shrink):>8} | {pct(r['cor_unpaired_sig']):>7} {pct(r['cor_paired_sig']):>8} {pct(r['cor_mcnemar_sig']):>7}")
        everything["table1"][f"gap_{int(round(gap*100))}"] = rows

    print("\n=== SENSITIVITY: pairing benefit as outcome correlation changes. 83% vs 80%, n = 100 ===")
    for phi in PHIS_SWEEP:
        r = run_cell(100, 0.83, 0.80, phi)
        shrink = 1 - r["cor_paired_ci_width"] / r["cor_unpaired_ci_width"]
        print(f"phi {phi}: win {pct(r['cor_win'])} tie {pct(r['cor_tie'])} lose {pct(r['cor_lose'])} | CI width unpaired {100*r['cor_unpaired_ci_width']:.1f} paired {100*r['cor_paired_ci_width']:.1f} ({pct(shrink)} narrower) | sig unpaired {pct(r['cor_unpaired_sig'])} paired {pct(r['cor_paired_sig'])} McNemar {pct(r['cor_mcnemar_sig'])}")
        everything["sweep"][str(phi)] = r

    print("\n=== HOW MANY EXAMPLES: smallest n with 80% power, two-sided 5% test, base 80% ===")
    print("Unpaired: n per system, two-proportion z test. Paired: n shared examples, McNemar. Analytic = normal-approximation formula.")
    print(f"{'true gap':>8} | {'phi':>4} | {'unpaired sim':>12} {'analytic':>9} | {'paired sim':>10} {'analytic':>9} | {'saving':>7}")
    for gap in [0.02, 0.03, 0.05, 0.10]:
        pa, pb = BASE + gap, BASE
        for phi in PHIS_SWEEP:
            try:
                cell_probs(pa, pb, phi)
            except AssertionError:
                # phi above the largest correlation two 0/1 outcomes with these accuracies can have.
                print(f"{gap*100:>6.0f}pt | {phi:>4} | not possible: correlation too high for 90% vs 80%")
                continue
            s = power_search(pa, pb, phi)
            au, ap = analytic_n(pa, pb, 0, False), analytic_n(pa, pb, phi, True)
            sav = 1 - s["paired"] / s["unpaired"]
            print(f"{gap*100:>6.0f}pt | {phi:>4} | {s['unpaired']:>12} {au:>9} | {s['paired']:>10} {ap:>9} | {pct(sav):>7}")
            everything["power"][f"gap{int(round(gap*100))}_phi{phi}"] = {**s, "analytic_unpaired": au, "analytic_paired": ap}

    with open("results.json", "w") as f:
        json.dump(everything, f, indent=1)


if __name__ == "__main__":
    main()
