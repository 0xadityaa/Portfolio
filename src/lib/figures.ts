import fs from "fs";
import path from "path";

/**
 * Animated blog figures (docs/visuals.md).
 *
 * A post embeds a figure as a normal Markdown image of an SVG in
 * public/images/blog/. If that SVG is marked `data-viz`, the site inlines it
 * (so CSS and the scroll observer can reach it) inside a <figure>, with the
 * image title as the caption. Everything else that reads the post (the .md
 * twin, the RSS feed, dev.to) keeps the plain image, which is the final frame.
 */
const DIR = path.join(process.cwd(), "public", "images", "blog");
const cache = new Map<string, string | null>();

function load(file: string) {
  const hit = cache.get(file);
  if (hit !== undefined && process.env.NODE_ENV === "production") return hit;
  let svg: string | null = null;
  try {
    const raw = fs.readFileSync(path.join(DIR, file), "utf-8");
    if (/^\s*<svg[^>]*\sdata-viz(?:="")?[\s>]/.test(raw)) svg = raw;
  } catch {}
  cache.set(file, svg);
  return svg;
}

const IMAGE = /<p><img src="\/images\/blog\/([a-z0-9-]+\.svg)" alt="([^"]*)"(?: title="([^"]*)")?><\/p>/g;

export function inlineFigures(html: string) {
  let n = 0;
  return html.replace(IMAGE, (match, file: string, _alt: string, caption?: string) => {
    const svg = load(file);
    if (!svg) return match;
    const prefix = `f${n++}-`;
    const body = svg
      .replace(/<\?xml[^>]*\?>/, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<style data-standalone(?:="")?>[\s\S]*?<\/style>/, "") // fallback fonts for the standalone file only
      .replace(/(<svg[^>]*?)\swidth="\d+"\sheight="\d+"/, "$1")
      .replace(/\sid="([^"]+)"/g, ` id="${prefix}$1"`)
      .replace(/url\(#([^)]+)\)/g, `url(#${prefix}$1)`)
      .replace(/href="#([^"]+)"/g, `href="#${prefix}$1"`)
      .trim();
    const figcaption = caption
      ? `<figcaption>${caption
          .replace(/\[(.+?)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>')
          .replace(/(?:`|&#x60;)(.+?)(?:`|&#x60;)/g, "<code>$1</code>")}</figcaption>`
      : "";
    return `<figure class="viz"><div class="viz-frame">${body}</div>${figcaption}</figure>`;
  });
}
