# Site design and performance

## Design rules

Warm charcoal and clay, in the spirit of Claude's dark interface, with custom-drawn artwork in place of stock imagery. Changes extend this; they do not restyle it.

- Three pages: home, projects, blog. Posts and project write-ups hang off the last two. A new top-level page needs Aditya's say-so.
- Dark only: warm charcoal background, ivory ink. Every colour is a token in `src/app/globals.css`; use them through Tailwind (`bg-card`, `text-muted-foreground`, `text-brand`), never raw hex.
- One accent, clay (`brand`): kickers, the hex section numbers, link underlines, the live parts of diagrams. Not for large fills.
- Headings are Newsreader (`font-serif`, medium weight). Body is 15px Geist. Dates, labels and chips are Geist Mono (`.meta`, `.chip`).
- Radius: cards `rounded-2xl`, buttons and thumbnails `rounded-lg`, chips `rounded-md`.
- Home sections are numbered in hex (`Section` takes an `index`), a nod to the 0xadityaa handle.
- Artwork is code, not image files:
  - `SystemDiagram`: the hero. The site drawn as an event-driven system; topics are links.
  - `PostCover`: a pattern generated from the post slug on a tinted background. Every post gets one automatically.
  - `ProjectArt`: one line drawing per project, keyed by repo name. A new featured project needs a drawing added there (it falls back to a generated pattern).
  - `ProgressionPlayer` and the contour map: the music and outdoors side of the bio.
  Draw in ink (`stroke-foreground`) on a `--tint-N` background, 2.5px round strokes, no gradients.
- Screenshots appear only on a project's own page.
- Copy is plain and specific, with commas and periods where an em dash would go, and no emoji in the interface.

## What goes where

The home page is the whole introduction: hero and bio, experience and education on one timeline beside the stack, selected projects, latest writing, life away from the keyboard, contact. There is no about page; `/about` redirects home.

## Performance budget

Every page is rendered to HTML on the server and served from Vercel's CDN, refreshed every 10 minutes (`revalidate = 600`) so a scheduled post appears on time. Keep it that way:

- A page stays a Server Component. `"use client"` is for a leaf that needs state or a browser API (the filters, the chord player, copy buttons).
- Reading `cookies()`, `headers()`, or `searchParams` in a page makes it render per request and breaks the budget. Filter on the client instead.
- Animation is CSS (`.fade-in`, `.event-dot`) and stops for reduced motion. The site ships no animation library.
- Images go through `next/image` with real `sizes`. Only the first screen gets `priority`.
- Budget: HTML response under 200ms from the CDN, Lighthouse accessibility and SEO at 100. Check with `curl -w '%{time_starttransfer}\n' -o /dev/null -s <url>` after a deploy.

## Markdown mode

Agents can read any page as Markdown: `<url>.md`, `/index.md` for the home page, or the page URL with `Accept: text/markdown`. `/llms.txt` is the index and `/llms-full.txt` is the whole site. The twins are built in `src/lib/markdown-pages.ts` and routed by the rewrites in `next.config.mjs`. A new page type needs a twin, an entry in `markdownPagePaths`, and a line in `/llms.txt`.
