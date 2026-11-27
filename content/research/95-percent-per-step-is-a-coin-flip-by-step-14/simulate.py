#!/usr/bin/env python3
"""Seeded simulation of a multi-step agent task under different failure-handling strategies.

Standard library only. Run: python3 simulate.py > output.txt

Model (deliberately simple, see the post for where it breaks):
  * A task is n sequential steps. One model call attempts one step.
  * An attempt reports success with probability p, independently of everything else.
  * A failure is detected immediately (a strong assumption).
  * Strategies that retry or resume are capped at 3n model calls, which is the most
    that "retry each step up to 2 times" can ever spend on a task that finishes.
"""
import math
import random
import sys

SEED = 20261114
TRIALS = 20_000
STEPS = [5, 10, 20, 40]
PS = [0.90, 0.95, 0.99]
RETRIES = 2             # retries after the first attempt, so 3 attempts per step
PERSISTENT_SHARE = 0.5  # (c): share of failures that no retry can fix
TIMEOUT_SHARE = 0.5     # (e): share of failures that are timeouts after the effect landed
CHECKPOINT_EVERY = 5    # (d): a checkpoint is saved after every 5th completed step


def run_none(n, p, rng):
    calls = 0
    for _ in range(n):
        calls += 1
        if rng.random() >= p:
            return False, calls, 0
    return True, calls, 0


def run_retry_transient(n, p, rng):
    calls = 0
    for _ in range(n):
        for _attempt in range(RETRIES + 1):
            calls += 1
            if rng.random() < p:
                break
        else:
            return False, calls, 0
    return True, calls, 0


def run_retry_persistent(n, p, rng):
    calls = 0
    for _ in range(n):
        calls += 1
        if rng.random() < p:
            continue
        persistent = rng.random() < PERSISTENT_SHARE
        ok = False
        for _r in range(RETRIES):
            calls += 1
            if not persistent and rng.random() < p:
                ok = True
                break
        if not ok:
            return False, calls, 0
    return True, calls, 0


def run_restart(n, p, rng):
    """Whole-run restart from step 1 on any failure, same 3n call budget."""
    return _resume(n, p, rng, every=None)


def run_checkpoint(n, p, rng):
    return _resume(n, p, rng, every=CHECKPOINT_EVERY)


def _resume(n, p, rng, every):
    budget = 3 * n
    calls = done = saved = 0
    while done < n and calls < budget:
        calls += 1
        if rng.random() < p:
            done += 1
            if every and done % every == 0:
                saved = done
        else:
            done = saved
    return done == n, calls, 0


def make_run_side_effects(idempotent):
    def run(n, p, rng):
        calls = dupes = 0
        for _ in range(n):
            effects = 0
            ok = False
            for _attempt in range(RETRIES + 1):
                calls += 1
                if rng.random() < p:
                    if not idempotent or effects == 0:
                        effects += 1
                    ok = True
                    break
                # failure: a timeout means the effect already landed server-side
                if rng.random() < TIMEOUT_SHARE:
                    if not idempotent or effects == 0:
                        effects += 1
            dupes += max(0, effects - 1)
            if not ok:
                return False, calls, dupes
        return True, calls, dupes
    return run


STRATEGIES = [
    ("a  no retries", run_none),
    ("b  retry x2, all failures transient", run_retry_transient),
    ("c  retry x2, half of failures persistent", run_retry_persistent),
    ("d0 restart from step 1 (cap 3n calls)", run_restart),
    ("d  checkpoint every 5 steps, resume (cap 3n calls)", run_checkpoint),
    ("e  retry x2, non-idempotent, half of failures are timeouts", make_run_side_effects(False)),
    ("e2 same as e, with idempotency keys", make_run_side_effects(True)),
]


def closed_forms(n, p):
    step_retry = 1 - (1 - p) ** (RETRIES + 1)
    step_persist = p + (1 - p) * (1 - PERSISTENT_SHARE) * (1 - (1 - p) ** RETRIES)
    return p ** n, step_retry ** n, step_persist ** n


def main():
    out = sys.stdout.write
    out(f"seed={SEED} trials_per_cell={TRIALS} retries={RETRIES} persistent_share={PERSISTENT_SHARE} "
        f"timeout_share={TIMEOUT_SHARE} checkpoint_every={CHECKPOINT_EVERY}\n\n")

    out("## Closed form: p^n (probability every step succeeds, no retries)\n\n")
    out("| p \\ steps | " + " | ".join(str(n) for n in STEPS) + " | steps until success falls to 50% |\n")
    out("| --- | " + " | ".join("---" for _ in STEPS) + " | --- |\n")
    for p in PS:
        half = math.log(0.5) / math.log(p)
        out(f"| {p:.2f} | " + " | ".join(f"{p**n:.3f}" for n in STEPS) + f" | {half:.1f} |\n")
    out(f"\n0.95^14 = {0.95**14:.4f}\n\n")

    out("## Simulation\n\n")
    out("success = completed tasks / tasks. calls/done = total model calls / completed tasks. "
        "dupes/task = duplicate side effects per task (all tasks). dupe% = share of tasks with at least one duplicate.\n\n")
    for p in PS:
        for n in STEPS:
            cf_none, cf_retry, cf_persist = closed_forms(n, p)
            out(f"### p={p:.2f}, steps={n}  (closed form: a={cf_none:.3f}, b={cf_retry:.3f}, c={cf_persist:.3f})\n\n")
            out("| strategy | success | calls/done | dupes/task | dupe% |\n| --- | --- | --- | --- | --- |\n")
            for si, (name, fn) in enumerate(STRATEGIES):
                rng = random.Random(f"{SEED}-{p}-{n}-{si}")
                wins = calls = dupes = dupe_tasks = 0
                for _ in range(TRIALS):
                    ok, c, d = fn(n, p, rng)
                    calls += c
                    dupes += d
                    dupe_tasks += d > 0
                    wins += ok
                cpd = f"{calls / wins:.1f}" if wins else "n/a"
                out(f"| {name} | {wins / TRIALS:.3f} | {cpd} | {dupes / TRIALS:.3f} | {100 * dupe_tasks / TRIALS:.1f}% |\n")
            out("\n")


if __name__ == "__main__":
    main()
