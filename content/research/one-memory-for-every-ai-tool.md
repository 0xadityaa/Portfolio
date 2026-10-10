# Research note: I Got Tired of Re-Explaining Myself to Every AI Tool

Written 10 October 2026 from the Hivemind repository (private) and its public site.

## What this adds

A first-person introduction to Hivemind on Aditya's own blog: the problem, what the product does, how a recall is assembled, and the measured result with its caveats. Nothing like it is published yet; the Show HN draft in the Hivemind repo is unposted.

## Artifact

The LoCoMo retrieval measurement against the live service (330 questions, 78.2% overall, per question type), plus the SDK snippet.

## Claims and sources

| Claim | Source |
| --- | --- |
| One command signs in, finds clients, writes each config | gethivemind.xyz landing; Hivemind README |
| Connects over MCP, a browser extension, and an SDK | gethivemind.xyz landing and docs |
| Old memory is retired when a new one contradicts it; you can see what changed | Hivemind README sequence diagram; handoffs docs ("What changed") |
| Four retrieval steps: fuse two searches, cut, pack to budget, order | https://gethivemind.xyz/docs/concepts/retrieval |
| Recall returns at most 1,500 tokens by default | https://gethivemind.xyz/docs/concepts/context-cost |
| 78.2% overall, interval 73.4 to 82.3, 330 questions, per-type figures, keyword search about 15 points lower | https://gethivemind.xyz/docs/concepts/evidence |
| Models read the middle of long contexts worse | https://arxiv.org/abs/2307.03172 |
| LoCoMo benchmark | https://arxiv.org/abs/2402.17753 |

## From Aditya

- "I kept re-explaining my project to every AI tool I use" is his line, from the unposted Show HN draft in the Hivemind repo. The Monday, Tuesday, Wednesday framing in the opening is a dramatisation of it.
- The deploy-cap example is his, from the Hivemind README.

## Outline

Opening (the amnesia week) and thesis. The short version. What it looks like working. The SDK. Why storing is the easy part (four steps). The measurement. Limits. Takeaway with the one-fact test.

## Open questions

- Is he happy announcing Hivemind on the blog before the launch posts go out?
- Is the opening week true enough to him as written, or should it be reworded?
- Should pricing (Free, Pro at $12 a month) be mentioned? Left out for now.

## Left out

Competitor comparisons, internal launch status, the known-weakness list beyond what the public evidence page states, and unpublished benchmark figures (the earlier 49.4% baseline, MemTrapBench).
