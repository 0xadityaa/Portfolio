# Research note: A Folder That Contains Nothing Is a Lie

Written 10 October 2026 from the Hivemind repository (private) and its public docs.

## What this adds

A design-decision story with a concrete failing scenario: why write-time folders made Hivemind's central promise structurally impossible, and what replaced them. The naming argument (a name that promises containment the system cannot deliver) is the part other engineers can reuse.

## Artifact

The four-step failing trace (`acme/payments` in Claude Code, then `chatgpt.com` in the browser) and the `withOrigin` snippet.

## Claims and sources

| Claim | Source |
| --- | --- |
| Every memory had a folder chosen at write time; every retrieval was scoped to one | Hivemind ADR 0001 |
| With silent capture the folder was inferred: repo root for MCP, page origin for the browser | ADR 0001, ADR 0002 |
| The Stripe Checkout migration scenario and that the memory does not surface | ADR 0001 |
| A company-wide convention stated in one repo is not a fact about that repo; page origin carries little folder signal | ADR 0001 |
| Views are saved searches; a memory can be in several, one or none; deleting a view deletes nothing else | https://gethivemind.xyz/docs/concepts/views |
| Origin is kept as ranking metadata, never a partition | ADR 0001; views docs ("Where results come from") |
| `withOrigin` snippet | views docs |
| "Folder" retired for "View"; "Space" not revived; "session" had come to mean two things | ADR 0001; `CONTEXT.md` |
| One account's data is isolated from every other's | `CONTEXT.md` (Tenant) |

## From Aditya

The decision and its reasoning are from ADR 0001, dated 17 September 2026. First-person phrasing ("I made capture silent", "never again") restates the record in his voice.

## Outline

Opening and thesis. The reasonable design. The failing trace. Views and origin as a weight. Why the rename mattered. Limits. Takeaway: decide at read time, keep write-time signals as hints.

## Open questions

- Is he comfortable describing an earlier internal design publicly?
- The title is a line from his own glossary ("A folder that does not contain is a lie in the interface"). Keep it?

## Left out

The scarcity and consolidation consequences (ADR 0004), storage column naming, and the shared full-text statistics issue between accounts, which is internal.
