# Design system: warm charcoal and clay

The look, the voice and the rules of 0xadityaa.dev, written so another agent can reproduce them on a different product. It was settled with Aditya over many rounds in October 2026; every rule below is something he asked for or a correction he made. Where a rule says "he rejected", that is a recorded decision, not a preference to re-test.

This file is self-contained. `docs/site.md` holds the portfolio's page structure and performance budget; this file holds everything portable.

**Porting to Hivemind:** read "Applying this to Hivemind" at the end before touching code. Hivemind has its own token generator, font policy and a decision record that this look reverses.

## The look in one paragraph

Dark only. A warm charcoal page, ivory text, one clay accent. Serif headings over a clean sans body, with mono for dates, labels and chips. Soft rounded cards with hairline borders. Artwork is drawn in code as ivory line art on muted tinted panels, never stock imagery or screenshots. Motion is rare, short, and never loops for decoration. It should feel like Claude's own interface: calm, warm, a little editorial.

## Colour tokens

One palette, defined once as CSS variables in HSL, consumed through Tailwind. Never write a raw hex in a component.

| Token | HSL | Hex | Use |
| --- | --- | --- | --- |
| `--background` | `60 3% 15%` | `#272725` | Page |
| `--foreground` | `48 33% 97%` | `#FAF9F5` | Text, ink in artwork, primary button fill |
| `--card` | `60 2% 19%` | `#31312F` | Cards and panels |
| `--muted` | `60 2% 23%` | `#3C3C39` | Inline code background, quiet fills |
| `--muted-foreground` | `49 7% 69%` | `#B5B3AA` | Secondary text, metadata |
| `--border` | `60 3% 27%` | `#474743` | Card borders, chip borders |
| `--brand` | `15 63% 62%` | `#DB8061` | The one accent: clay |
| `--primary-foreground` | `60 3% 12%` | `#20201E` | Text on an ivory button |
| `--code` | `60 3% 11%` | `#1D1D1B` | Code block background |
| `--ring` | `15 63% 62%` | `#DB8061` | Focus ring |

Six tints for artwork backgrounds, all low-saturation so ivory ink reads on each:

| Token | HSL | Hex |
| --- | --- | --- |
| `--tint-0` | `36 14% 30%` | `#574F42` |
| `--tint-1` | `163 12% 28%` | `#3F504B` |
| `--tint-2` | `210 18% 31%` | `#414F5D` |
| `--tint-3` | `84 12% 28%` | `#49503F` |
| `--tint-4` | `16 30% 32%` | `#6A4639` |
| `--tint-5` | `268 14% 33%` | `#534860` |

Rules:

- **Clay is a highlight, never a surface.** Link underlines, the one live item in a list, the single thing to notice in a diagram, the focus ring. A clay-filled shape is allowed only as the focal point of an illustration.
- **Secondary text is `muted-foreground`.** Body prose inside long-form content is `foreground` at 86% opacity.
- **A logo too dark for the page is drawn in white** (CSS `brightness(0) invert(1)`), not placed on a light chip.
- The page carries a faint dot grid at the top only: `radial-gradient(hsl(var(--foreground) / 0.13) 1px, transparent 1px)` at 24px, masked to fade out by about 44rem down.

## Typography

| Role | Family | Details |
| --- | --- | --- |
| Headings | Newsreader (serif) | Weight 500, `tracking-tight`. Page title 48px, card title 30px, section title 24px, post title 36 to 44px |
| Body | DM Sans | 15px, line-height 28px. He asked for this specifically in place of Geist |
| Labels | DM Mono | 12px for dates and metadata, 11px in chips, `tabular-nums` |

- Headings use `text-wrap: balance`; paragraphs use `text-wrap: pretty`.
- Emphasis inside a heading is the same family. Never mix a second typeface in for effect.
- Long-form prose (posts, READMEs) uses line-height 1.75, serif headings, clay bullet markers and a clay quote border.

## Shape, spacing, borders

- **Radius:** cards 16px, buttons and thumbnails 8px, chips 6px, avatar and round icons full. One scale, used everywhere.
- **Borders are for cards only.** A 1px `border` outlines a card and may divide cells inside it. There are no horizontal rules between sections, above footers, or around headers. He removed all of them.
- **Sections are separated by space:** 96px between home sections, 32px under a section title.
- **Page width:** 1024px for overview pages, 672px for reading, 768px for lists. 24px side gutter.
- **Buttons:** primary is an ivory fill with dark text, 8px radius, `active:scale-[0.98]`. Secondary is a 1px border on the page colour. He prefers plain underlined text links to buttons wherever a link will do, and had the hero buttons replaced with links.
- **Links:** ivory text with a 1px clay underline at 60% opacity, offset 4px, full clay on hover.

## Components

Each is small enough to rebuild from its description.

- **Section heading.** A serif title on the left, an optional "All posts →" text link on the right. Nothing above the title and no rule beside it.
- **Card.** `card` background, 1px border, 16px radius, 20 to 32px padding. Hover brightens the border (`foreground` at 25%). A media area on top has a bottom border.
- **Chip.** Mono 11px, 6px radius, 1px border, page-colour fill.
- **Logo tile.** A 36px square, 8px radius, 1px border, holding an 18px logo. Technologies and social links are logos, not words. The name lives in `title` and in screen-reader text. Names that share a logo collapse into one tile.
- **Linked row list.** Rows with no background or border. Hovering one row dims its siblings to 45% opacity (`.rows:has(.row-link:hover) .row-link:not(:hover)`).
- **Timeline.** A 1px vertical line with a 10px dot per entry. The current entry's dot is clay-filled; the rest are hollow. Title first, then a mono line of dates and place, then one sentence.
- **Stat row.** Inside a card, two to four cells divided by 1px lines. A large serif number, then one sentence in small muted text that states the conditions of the measurement.
- **Filter.** Plain text buttons in a wrapping row; the active one is ivory with a thin underline. No pills, no search box unless the list is long.

## Artwork

Every image on the site is drawn in code, so it stays sharp, themed and small. He rejected screenshots as card art and rejected GIFs outright.

Shared hand for all of it: ivory strokes at 2 to 2.5px with round caps and joins, on a `--tint-N` panel, a faded second tone at 25% opacity for depth, and at most one clay element. No gradients, no shadows, no glows.

- **Generated covers.** A Truchet pattern (each cell holds two quarter arcs in one of two orientations) seeded by a hash of the item's slug, so every item gets its own cover with no work. About a sixth of the arcs are drawn brighter, and a few cells get a dot. The tint is picked from the same hash.
- **Per-item line drawings.** One simple drawing that says what the thing does: a cut film strip, a branch graph, a chessboard and rook, braces around a tree. Around 10 to 20 shapes each.
- **Diagrams in articles.** SVG files with their own background rectangle (`#30302E`), ivory boxes and arrows, clay for the single thing to notice, a one-line caption in muted text inside the image. They carry their own background so they read correctly when the article is syndicated elsewhere.
- **A hero object.** One isometric illustration with real behaviour: a Rubik's cube modelled as 27 cubies that scrambles, then solves itself slowly. It has no panel, no border and no ground grid behind it; he asked for "just the cube".
- **A signature.** His handwritten signature under each article, drawn stroke by stroke in pen order the first time it scrolls into view, as SVG paths with `stroke-dashoffset`.

## Motion

- Allowed: a single 0.5s fade-and-rise on page load; the signature drawing once on view; the hero cube, which is slow and is the one sanctioned loop because it is the hero's whole point.
- **He rejected decorative looping animation.** An animated "event bus" diagram with travelling dots was called cringe and removed.
- Everything stops under `prefers-reduced-motion`, and anything driven by `requestAnimationFrame` pauses when off screen.
- CSS first. No animation library.

## Voice and content

- **Casual, first person, a bit cheeky,** like an engineer talking to a friend who codes. He rejected two other registers: terse and factual ("walls of text", "too professional"), and polished marketing ("marketing slop").
- A joke never replaces the fact. Every line still says what the thing is.
- Short sentences, contractions, plain words. Commas, colons and periods where an em dash would go. No emoji in interface text.
- **Prose over bullets** in descriptions. He asked for bullet points to be removed from a product description.
- **No small text above a title.** No kickers, eyebrows, section numbers or category labels. Dates and metadata go under the title.
- Section titles are one or two plain words: "Building", "Writing", "Open source work".
- **Numbers carry their conditions.** A stat is a real measurement with what it was measured on, in the label itself. Do not claim "state of the art" as a bare label; say what was beaten, by how much, on how many samples.
- Do not invent the owner's experiences, opinions or numbers. Take them from the repository or ask.
- Articles: a question or claim as the title, the thesis in the first few paragraphs, a "The short version" section of three or four bullets near the top, one diagram, a "Where I'd stop trusting this post" section, and an ending that gives a rule to act on. A product may be mentioned once, as where the evidence came from. No call to action.

## Structure

- Few pages. The portfolio has three. Fold "about" style content into the first page.
- Navigation is the avatar (links home) and two or three text links. No icon dock, no name beside the avatar.
- No section for hobbies or personal trivia.
- The footer is one quiet line with no rule above it.

## What he rejected, in one list

Check any new screen against this before showing it.

1. A text-only minimal layout: "too simple, walls of text".
2. Light mode, and a light/dark toggle. Dark only.
3. Small labels, numbers or kickers above titles.
4. Horizontal divider lines between sections and around headers.
5. Decorative looping animation.
6. A background panel or grid behind the hero illustration.
7. Screenshots as card artwork, and GIFs anywhere.
8. Buttons where links would do; a contact block with a heading and an email button.
9. Bullet points in a product description.
10. A hobbies section.
11. Formal or marketing-toned copy.
12. Technology names as text chips; he wants logos, with none missing.
13. The body font matching the heading font, and Geist as the body font.

## Done means

A screen is finished when all of these hold:

- Every colour comes from a token above, and clay appears only as a highlight.
- Headings are the serif at weight 500; body is DM Sans 15px; metadata is DM Mono.
- There is no rule between sections, no text above any title, and no card without the 16px radius.
- Every illustration is code-drawn in the shared hand, and nothing loops except a sanctioned hero.
- It reads correctly at 375px wide with no horizontal scroll.
- Focus is visible (2px clay ring), text contrast meets WCAG AA, and reduced motion is honoured.
- The copy sounds like a person and every number states its conditions.

## Applying this to Hivemind

Hivemind (`0xadityaa/hivemind`) is a React and Vite dashboard, a static landing site and docs. Aditya wants its interface to look exactly like the portfolio. Things the porting agent must know that this repository cannot show:

- **It reverses a recorded decision.** Hivemind's ADR 0012 chose one warm *light* palette (ink `#141413` on cream `#faf9f5`) with Inter, Source Serif 4 and JetBrains Mono, and says a dark mode is "future work". Moving to this system means a new ADR that supersedes 0012. Write it first; do not half-convert.
- **Tokens are generated.** Colours live in `design/tokens.ts` and are injected into every surface between `@tokens:start` markers in `apps/web/src/styles.css`. Change the generator, not the output. A test (`design/tokens.test.ts`) checks hex literals; raw `rgba()` slips past it.
- **Fonts must be self-hosted.** The content security policy allows `font-src 'self'` only, and the product promises not to hand activity to third parties. Ship DM Sans, DM Mono and Newsreader as local variable `woff2` files; do not link Google Fonts.
- **Tailwind is v4 there** (`@theme` in CSS), and v3 here (`tailwind.config.ts`). The token names map directly: this file's `--background` becomes `--color-background`, and so on.
- **Same accent, different value.** Hivemind's orange is `#d97757`; the portfolio's clay is `#DB8061`. They are the same idea. Pick one and use it in both the tokens and the logo.
- **Logos already follow the same rule there:** SVGL first, then Simple Icons, then a fallback. Keep that order.
- **Copy rule already shared:** no em dashes on any user-facing surface. Hivemind also has voice rules of its own in its repository; where they conflict with "Voice and content" above, ask Aditya which wins.
- **A dashboard needs things a portfolio does not:** tables, forms, empty states, loading states, error states. This system does not define them. Derive them from the rules here (card radius, token colours, mono for data, no dividers between sections, links over buttons) and show Aditya one screen before converting the rest.
- **Anything posted publicly or sent to a person is approved by Aditya first.** That is Hivemind's own rule and it covers the landing page.

Suggested order: write the superseding ADR; change `design/tokens.ts` and the fonts; convert one dashboard screen and the landing hero; get his sign-off on those two; then convert the rest, checking each screen against "Done means" and the rejected list.
