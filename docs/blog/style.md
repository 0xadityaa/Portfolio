# Blog style

How posts on 0xadityaa.dev are written. The bar is set by engineers whose posts get passed around: each post is built on something the author made or measured, and says so in the first screen. The study behind these rules, with examples to read, is `docs/research/frontier-sites.md`; sections 3 and 5 are the short version.

## What every post has

A reviewer should be able to point at each of these.

1. **A thesis in the first 150 words.** One sentence a competent engineer could disagree with. When the title is a question, one sentence answers it directly.
2. **An artifact.** Something that did not exist before the post: a measurement, runnable code, a cost calculation with its inputs, a table he compiled, a diagram of his system. The post is the write-up of the artifact. A topic with no artifact becomes a note (see Formats) or waits until it has one.
3. **Numbers with their papers.** Every cost, speed, or scale claim carries a number, a unit, a link to its source, and the date it was checked. A post about cost shows the arithmetic at three volumes (small, medium, large) so the reader can find themselves on it.
4. **Links as the evidence trail.** Each named service, pattern, spec, and price links to its primary source at first mention. Expect five or more per 1,000 words.
5. **Limits.** A section that states the strongest objection in its strongest form, linked to someone who holds it; says where the advice stops applying; and names what he did not test.
6. **An ending that adds.** The last paragraph gives the decision rule, what would change his mind, or what he will measure next.

**Philosophy posts** (tag `philosophy`, usually `syndicate: false`) are the exception: no measurement or artifact is required, and `posts:check` skips the length, link and artifact rules for them. Title, summary, dash and stock-phrase rules still apply. Dashes inside a blockquote are allowed, since quoted text is verbatim. Quote a source in its edition's own translation and link it.

## Voice

Aditya's own, from his rewrites of the first eight posts. **First person, technical, blunt, witty, and never weird.** He is a builder telling a friend who codes what he measured and what surprised him.

**Person.** "I" is the experiencer and the measurer: it runs things, counts, guesses, gets it wrong. "I booted up eleven popular MCP servers, asked each for its tool list, and counted the tokens." "You" is the reader inside a scenario or an imperative: "Suppose you rent an 80 GB H100." His own product is first person too: "I've been building a shared memory layer on the side called Hivemind." Say "I" only for things he did or felt. Never invent an anecdote or a tool he did not write.

**Technical.** Precise terms, real numbers and mechanisms. Explain the how, not the vibe. Exact figures stay exact (23,895; 79.5%), then get translated once ("forty times the token cost on every single question").

**Blunt.** State the finding in plain words, no wind-up, no hedging beyond what the evidence needs. "Ten servers add 23,895 tokens to every request." Short sentences are fine. Alternate a long explaining sentence with a short verdict.

**Witty.** Dry and occasional: one well-placed line per section at most, only where it sharpens the point. One homely analogy per section, concrete and domestic (a diner, a binder, a sticky note); the diner binder is about the ceiling.

**Never weird.** No forced enthusiasm, no intensifier pile-ups ("literally", "genuinely", "absolute units", "terrifying", "slams into"), no exclamation marks in the body, no emoji, no reader-feeling stage directions ("look at that little sliver", "glance at the right panel"), and nothing that reads like an AI trying to sound human.

### Shape

- **Open on a moment, a number or a question**, then state the thesis in bold by the third or fourth paragraph. "Have you ever wondered why Gmail doesn't have folders?" "If one user pastes a 128k-token prompt into Llama 3.1 8B, that single request eats 16 GiB of GPU memory."
- **Paragraphs** run four to six sentences, with an occasional one-line punch between them ("Brutal.").
- **Bold** marks the thesis, headline numbers, "First / Second / Third" lead-ins and the lead of each "Where I'd stop trusting this post" item. Five to ten per post. None in an essay on a philosophy topic.
- **Headings** name the idea plainly, ask the reader's real question ("What the ratio looks like", "Wait, doesn't prompt caching solve this?"), or describe his process ("How I actually counted the menu"). The fixed frame headings are **The short version**, **Where I'd stop trusting this post** and **The takeaway**. The short version is four bullets that read like findings said aloud, each with one hard number.
- **Limits** are four or five bold-led items ("**I built one of the rows.**"). Confessions go inline in parentheses where the number appears: "(an illustrative prompt size I picked for scale)". A thought experiment is labelled as one.
- **The close** is a rule of thumb, a quick experiment for the reader, or a dare ("If someone shows me a real workload holding 90%+ cache hits, I'll happily eat my words"). An essay ends on an image.
- **Dashes**: none. Commas, colons and periods do the work an em dash would.
- **Fresh phrasing.** Where a stock phrase comes to mind ("hot take", "the hard way", "nobody talks about", "game changer"), write the specific thing it stood in for. `npm run posts:check` flags these.
- **Define a term in one clause** the first time it appears. **Sequels say so**: link the earlier post in the first paragraph with one sentence on what changed.
- Visuals earn their place by carrying a point. No GIFs or memes: he had them all removed in October 2026.

### Aditya's corrections (2026-11-27)

These override anything above that conflicts with them.

1. **No gimmick labels.** Banned anywhere: "aha moment"; headings that start "The visual ...", "The free lunch", "The quiet hero", "The funniest part"; "here is what hit me" and "what jumped out at me"; and any heading or line that announces how the reader should feel instead of saying the finding.
2. **Link every artifact.** Any mention of a script, results file, dataset or "the repo" links to the exact file: `https://github.com/0xadityaa/Portfolio/blob/main/content/research/<slug>/<file>`, or `/tree/main/...` for a folder. Never a bare `results.md`. Results that fit in a small table (up to about twelve rows) go in the post; bigger ones get the key rows and a link to the full file.
3. **Technical, blunt, witty, never weird**, as above. Edit at the sentence level; keep his first person and structure.
4. **Titles are 3 to 5 words**, short and conversational, often a question ("Do You Really Need Agents?", "What Exactly Is MCP?"). The number and the finding go in the opening and the summary. The slug stays as it is.
5. **Posts take 5 to 7 minutes to read, 8 at most**, by the badge in `calculateReadingTime` (`src/lib/blog-utils.ts`: prose only, no code, tables, image lines or URLs, at 230 words a minute). Above 8, cut the weakest sentences (repetition, restated caveats, filler transitions) and keep every number, figure and link. Under 5 is fine; never pad.
6. **Formulas are math, not code.** Write them as in "Formulas" below. Code blocks and backticks are for real code and identifiers only.

## Formulas

Formulas are typeset, never put in a code block or backticks. The site renders them as native MathML (no stylesheet, no webfonts, no client JavaScript), and the `.md` twin keeps the LaTeX.

- Inline: `$$0.95^{14}$$`, written inside a sentence. A single `$` is never math, so prices such as $1.00 are safe in any post.
- Display: `$$` alone on a line, the formula, then `$$` alone on a line.
- Words inside a formula go in `\text{...}`, with `\ ` for a space: `$$2 \times 40\ \text{layers}$$`. Escape a literal dollar sign inside math as `\$` and a percent sign as `\%`.
- Cross-posting converts them to dev.to's `{% katex %}` tags (`toDevtoMath` in `scripts/lib/posts.mjs`) and to code on Medium.

## Formats

- **Note**, 400 to 900 words. One observation, sharply made. Headings optional. Use this when there is a clear point and a small artifact, or a strong link with his commentary.
- **Essay**, 1,500 to 3,000 words. Only when an artifact justifies the length: an experiment, a cost model, a build log.

Between 900 and 1,500 words is usually an essay missing its artifact or a note that has not been cut yet. Decide which.

## Structure

No fixed template. A shape that works for an essay:

1. Opening: what happened, then the thesis.
2. The artifact: what he built or measured, how, and the result, with the diagram or table.
3. What it means: two to four `##` sections. Headings are questions or plain statements in sentence case.
4. Limits.
5. The ending.

Every post has a short version near the top, under the heading "The short version": three or four bullets a reader could stop at. Posts end on the real ending: no sign-off line. The site adds his animated signature under every post.

## Format details

- The title is 3 to 5 words (see the corrections above). The claim lives in the first 150 words, not the title. The file name stays the slug and does not have to match the title.
- The summary says what the reader walks away with, in 160 characters at most, stated as fact ("Fan-out, payload size, and retry loops are what make event-driven systems expensive"), never as a promise to teach.
- No H1 in the body. Inline code for identifiers, service names, and config keys. Fenced blocks carry a language.
- Diagrams and charts go in `public/images/blog/` with alt text that says what the picture shows. Draw them as SVG with their own background, in the site's colours (`#30302E` background, `#FAF9F5` ink, `#D97757` for the one thing to notice), so they also read correctly on dev.to.
- When a published post changes in substance, set `updated: YYYY-MM-DD` in frontmatter; the page shows it next to the date. No dated note in the body. If a correction came from a reader, thank them by name where the fix is.

## Before the pull request

Read the draft aloud once and rewrite any sentence he would not say. Then check the six things in "What every post has" one by one and write, in the pull request, where each one is.
