# Animated blog figures

The standard for charts and diagrams inside posts. Quiet, drawn in code, in the 3Blue1Brown manner (things draw on, grow, and arrive in the order the argument goes) but in this site's palette. The look rules in `docs/design-system.md` still apply; this file only adds motion and the figure format. Prototype: `content/blog/every-mcp-server-taxes-every-prompt.md`, three figures.

## How a figure works

A figure is one hand-written SVG in `public/images/blog/` and one Markdown image line:

```md
![One-sentence alt text that says what the figure shows](/images/blog/<name>.svg "Caption: the conditions, the source, and a [`results.md`](https://github.com/...) link.")
```

- The SVG's root has `data-viz=""`. Bare attributes such as `data-viz` are not valid XML, so the file breaks `<img>` rendering in RSS, dev.to and the `.md` twin; always write `=""`. On the site, `src/lib/figures.ts` inlines it in a `<figure class="viz">` (ids prefixed per figure) and the image title becomes the visible caption. Caption text supports `` `code` `` and `[text](https://url)`.
- `src/components/figure-motion.tsx` adds `js-anim`, then `in-view` the first time 35% of the figure is visible. The CSS is at the bottom of `src/app/globals.css`.
- Everything else (the `.md` twin, RSS, dev.to, Medium, Substack, GitHub) gets the plain `<img>`. The file is therefore the **final frame**, fully drawn, readable on its own. Never rely on animation for meaning.
- An SVG without `data-viz` stays a plain image, so the older figures are untouched.

## Look

| Role | Value |
| --- | --- |
| Background | `#272725` (`--background`), a full rect so syndicated copies stay dark. No radial gradient, no glow. The frame is a 1px `border` at `rounded-2xl`, so it sits in the page like a card. |
| Primary data | `#B5B3AA` (`--muted-foreground`) |
| Text, strong numbers | `#FAF9F5` (`--foreground`) |
| Grid, axes | `#474743` (`--border`) dashed `3 4` at 1px; the one axis line `#B5B3AA` 1.5px |
| Focal point | `#DB8061` (`--brand`): the one thing the paragraph is about. At most one clay thing per beat; a post's figures should agree on what clay means. |

The old 3b1b hues (blue, gold, green, red, purple) are retired. If a chart truly needs a second series, use ivory against muted grey, or a muted tint from `--tint-N` lightened; never a bright hue. Dark only, so there is no light variant.

Type: three classes, mapped to the site fonts in CSS (the file carries system fallbacks for standalone use). Title `class="h"` (Newsreader, 24px, no kicker above it). Labels default DM Sans, 15 to 16px. Numbers `class="m"` (DM Mono, tabular), 14 to 15px; axis ticks 13px. Title and subtitle only if the figure needs them; the caption carries the conditions.

Geometry: `viewBox="0 0 560 H"`, margins 24px. 560 wide is deliberate: at a 375px phone it renders at about 0.58x, so 15px text lands near 9px. Never go below 13px, keep it to about six text items per row, and widen nothing past 560. Bars 24 to 52px tall with `rx="2"`. Strokes 1.5px round caps; no shadows, no gradients, no filters.

## Motion vocabulary

Put a class on the element and set timing with `style="--d:<delay>;--t:<duration>"`.

| Class | 3b1b move | Use |
| --- | --- | --- |
| `a-draw` | Write/Create | Stroke draws on. The element needs `pathLength="1"` and no existing dash. Axes, brackets, lines. |
| `a-growx` / `a-growy` | Grow | Bars scale from their left edge or baseline. |
| `a-fade` | Fade and shift | Labels arrive from 6px below. Also the default for any text. |
| `data-count="N"` on a `<text>` (with `a-fade`) | Number tick | Counts up to N over `--t`, starting at `--d`. Optional `data-from`, `data-dec`, `data-pre`, `data-suf`. The text content must already be the final string. |
| `a-morphx` | Transform | A bar starts at `--from` times its width and settles. One per figure at most; it is the "the quantity changes" move. |
| `a-pop` | Indicate | A short 12% swell on the key number. Wrap inside an `a-fade` group: `<g class="a-fade"><g class="a-pop">`. Once per figure. |

Order of arrival is the argument: axes and frame, then data, then the key annotation last. Stagger bars 0.1 to 0.3s. Easing is built in: `--ease` (smooth in-out) for draws and morphs, `--out` (the site's expo out) for everything else.

**Budget: 1.5 to 3 seconds in total per figure**, last animation ends by 3s. It plays once, when it enters view, and rests on the final frame. No loops, no replay, no hover effects (Aditya rejected looping decoration).

## Guarantees

- **Reduced motion:** all animation CSS sits in `@media (prefers-reduced-motion: no-preference)` and the script exits early, so the final frame shows at once.
- **No JavaScript:** `js-anim` is only added by the script. Without it the SVG is simply the final frame.
- **Accessibility:** root `role="img"` and an `aria-label` that states the finding; the figure's real text is the caption. Contrast against `#272725`: ivory 14:1, muted grey 7.8:1, clay 5.5:1.
- **Size:** 4 KB raw and 1.5 KB gzipped per figure is typical; the ceiling is 8 KB raw, 2.5 KB gzipped. No libraries; the shared CSS and script cost about 1 KB gzipped once, for every post.
- **How many:** one per key idea, at most 3 or 4 per post, each doing a job the prose cannot (a ratio, a climb, an unchanged quantity). Do not add a figure to restate a table.

## Numbers and text in figures

Every number comes from the post or `content/research/<slug>/`. An assumed value is labelled assumed, in the figure or its caption ("an assumed 2,000-token prompt"), never "measured". Any file a caption or the post names is linked to its exact GitHub URL (`blob/main/...` for a file, `tree/main/...` for a folder). Figure copy follows `docs/blog/style.md`: plain titles that state the finding, no "aha", no "the visual ...", no line that announces a feeling instead of saying the result. The same goes for headings in the post around the figure ("What the ratio looks like", not "The visual aha moment"). When results are a small table (up to about 12 rows) show them in the post; when bigger, show the key rows and link the full file.

## Authoring template

```xml
<svg xmlns="http://www.w3.org/2000/svg" data-viz="" viewBox="0 0 560 300" width="560" height="300" role="img" aria-label="What the figure shows, in one sentence.">
  <style data-standalone="">text{font-family:"DM Sans",Helvetica,Arial,sans-serif}.m{font-family:"DM Mono",Menlo,Consolas,monospace}.h{font-family:Newsreader,Georgia,serif;font-weight:500}</style>
  <rect width="560" height="300" fill="#272725"/>
  <g class="a-fade" style="--d:0s;--t:.5s">
    <text class="h" x="24" y="42" font-size="24" fill="#FAF9F5">Title that states the point</text>
  </g>
  <!-- axis, then data, then the key annotation -->
  <path class="a-draw" pathLength="1" style="--d:.2s;--t:.5s" d="M104 96V240" stroke="#B5B3AA" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <rect class="a-growx" style="--d:.6s;--t:.6s" x="104" y="110" width="300" height="26" rx="2" fill="#B5B3AA"/>
  <text class="m a-fade" data-count="23895" style="--d:.6s;--t:.6s" x="412" y="129" font-size="15" fill="#FAF9F5">23,895</text>
  <rect class="a-growx" style="--d:.9s;--t:.6s" x="104" y="150" width="20" height="26" rx="2" fill="#DB8061"/>
</svg>
```

Generated figures are fine (the prototype's came from a short Python script), but the committed SVG is the source of truth. Check a figure before shipping: scroll to it once on desktop and at 375px, confirm it rests on the final frame, and with `getAnimations()` paused at 1.5s confirm the middle looks deliberate.

## Formulas

Formulas in a post are math, not code: typeset with `$$...$$` as described in `docs/blog/style.md` ("Formulas"). They render as native MathML, so they add no JavaScript, stylesheet or font to the page. In a figure, a formula is SVG text in the figure's own fonts.
