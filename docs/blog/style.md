# Blog style

How posts on 0xadityaa.dev are written. The bar is set by engineers whose posts get passed around: each post is built on something the author made or measured, and says so in the first screen. The study behind these rules, with examples to read, is `docs/research/frontier-sites.md`; sections 3 and 5 are the short version.

## What every post has

A reviewer should be able to point at each of these.

1. **A thesis in the first 150 words.** One sentence a competent engineer could disagree with. When the title is a question, one sentence answers it directly.
2. **An artifact.** Something that did not exist before the post: a measurement, runnable code, a cost calculation with its inputs, a table he compiled, a diagram of his system. The post is the write-up of the artifact. A topic with no artifact becomes a note (see Formats) or waits until it has one.
3. **Numbers with their papers.** Every cost, speed, or scale claim carries a number, a unit, a link to its source, and the date it was checked. A post about cost shows the arithmetic at three volumes (small, medium, large) so the reader can find themselves on it.
4. **Links as the evidence trail.** Each named service, pattern, spec, and price links to its primary source at first mention. Expect five or more per 1,000 words.
5. **Where this stops holding.** A short section, two to four lines: the strongest objection in its strongest form (linked to someone who holds it), where the advice stops applying, and what was not covered.
6. **An ending that adds.** The last paragraph gives the decision rule, what would change the conclusion, or what gets measured next.

**Philosophy posts** (tag `philosophy`, usually `syndicate: false`) are the exception: no measurement or artifact is required, and `posts:check` skips the length, link and artifact rules for them. Title, summary, dash and stock-phrase rules still apply. Dashes inside a blockquote are allowed, since quoted text is verbatim. Quote a source in its edition's own translation and link it.

## Voice

Confident, impersonal, no hedging. A sharp engineer talking to a peer who is short on time: direct, a little cheeky, sure. It overrides any older guidance that asks for first person. Never write as Aditya: no "I", "I'm", "I've", "I'd", "my" or "me" in post bodies, headings, summaries, alt text, research READMEs, `social.md`, X posts or Substack Notes. Also no "we", "our" or "us" standing in for the author. A quoted source that says "I" stays as written.

- **Say it with "you", plain fact, or the artifact.** "Ten MCP servers add 23,895 tokens to every request." "The script counts the tokens." "The simulation runs 5,000 trials." Name what was measured and at what size, then move on.
- **Guess, then measure becomes belief, then number.** "The usual guess is 25,000 to 40,000. The real number is 23,895." Never invent who holds the belief. "Most people do X. Measured, it's Y."
- **Open on the claim or the moment.** A real event with a rough date is fine when the post's facts include it, told without "I". A thought experiment is fine when it is called one.
- **Size the claim to the evidence, once.** State the sample size and interval near the result and do not re-hedge the same number later. A threshold is either sourced or labelled a rule of thumb.
- **No shrinking frames.** Cut "this is a test", "just an example", "toy example", "a quick experiment", "a simple demo", "only a simulation, but", "for illustration purposes".
- **No scattered hedges.** "To be fair", "of course", "it's worth noting", "one caveat", "admittedly", "to be clear" stay out of the body. Caveats that change what the reader does go in one short section.
- **No throat-clearing openers or summary closers:** "In this post", "Let's", "In conclusion", "To sum up", "Hopefully this helps".
- **Vary the rhythm.** Not three sentences in a row with the same shape, not "X. Y. Z. That's the point.", and prose where a list reads worse. Short sentences, plain words, contractions, one idea per paragraph.
- **Concrete over grand.** "Twelve Lambda invocations per order" beats "significant fan-out". Strong verbs, concrete nouns, numbers early.
- **Fresh phrasing.** Where a stock phrase comes to mind ("hot take", "the hard way", "nobody talks about", "game changer", "everyone and their dog"), write the specific thing it was standing in for. `npm run posts:check` flags these.
- **Commas, colons, and periods** do the work an em dash would.
- **Define a term in one clause** the first time it appears.
- **Humour is welcome** when it is quick. Visuals earn their place by carrying a point: a diagram, a chart, real output. No GIFs or memes.
- **Sequels say so.** Link the earlier post in the first paragraph with one sentence on what changed.
- **Headings** are plain: "The short version", "Where this stops holding", "Not covered", "The takeaway".
- **Aditya's own product (Hivemind):** third person is fine ("Aditya built...", "Hivemind does..."). Keep it factual, never press-release.

Truth rules do not change: never change, round or invent numbers, and keep comparisons like-for-like.

## Formats

- **Note**, 400 to 900 words. One observation, sharply made. Headings optional. Use this when there is a clear point and a small artifact, or a strong link with his commentary.
- **Essay**, 1,500 to 3,000 words. Only when an artifact justifies the length: an experiment, a cost model, a build log.

Between 900 and 1,500 words is usually an essay missing its artifact or a note that has not been cut yet. Decide which.

## Structure

No fixed template. A shape that works for an essay:

1. Opening: what happened, then the thesis.
2. The artifact: what he built or measured, how, and the result, with the diagram or table.
3. What it means: two to four `##` sections. Headings are questions or plain statements in sentence case.
4. Where this stops holding.
5. The ending.

Every post has a short version near the top, under the heading "The short version": three or four bullets a reader could stop at. Posts end on the real ending: no sign-off line. The site adds his animated signature under every post.

## Format details

- The title is a claim or a question, 60 characters at most. The file name is the title in kebab-case.
- The summary says what the reader walks away with, in 160 characters at most, stated as fact ("Fan-out, payload size, and retry loops are what make event-driven systems expensive"), never as a promise to teach.
- No H1 in the body. Inline code for identifiers, service names, and config keys. Fenced blocks carry a language.
- Diagrams and charts go in `public/images/blog/` with alt text that says what the picture shows. Draw them as SVG with their own background, in the site's colours (`#30302E` background, `#FAF9F5` ink, `#D97757` for the one thing to notice), so they also read correctly on dev.to.
- When a published post changes in substance, set `updated: YYYY-MM-DD` in frontmatter; the page shows it next to the date. No dated note in the body. If a correction came from a reader, thank them by name where the fix is.

## Before the pull request

Read the draft once and rewrite any sentence that slips into first person or hedges. Then check the six things in "What every post has" one by one and write, in the pull request, where each one is.
