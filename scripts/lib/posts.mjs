import fs from "fs";
import path from "path";
import matter from "gray-matter";

export const SITE_URL = "https://www.0xadityaa.dev";
export const POSTS_DIR = path.join(process.cwd(), "content", "blog");

/** Same rule as src/data/blog.ts: a date-only publishedAt goes live at 12:00 UTC. */
export function publishTime(publishedAt) {
  const value = String(publishedAt);
  return new Date(value.includes("T") ? value : `${value}T12:00:00Z`);
}

export function loadPosts() {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const filePath = path.join(POSTS_DIR, file);
      const { data, content } = matter(fs.readFileSync(filePath, "utf-8"));
      // An unquoted YAML date arrives as a Date. Posts use strings everywhere.
      if (data.publishedAt instanceof Date) data.publishedAt = data.publishedAt.toISOString();
      const slug = path.basename(file, ".md");
      return { slug, filePath, data, content, url: `${SITE_URL}/blog/${slug}` };
    });
}

/** Write frontmatter changes back without touching the body. */
export function saveFrontmatter(post, changes) {
  const { data, content } = matter(fs.readFileSync(post.filePath, "utf-8"));
  fs.writeFileSync(post.filePath, matter.stringify(content, { ...data, ...changes }));
}

/** Other sites cannot resolve site-relative links or images. */
export function absolutize(markdown) {
  return markdown.replace(/\]\(\/(?!\/)/g, `](${SITE_URL}/`);
}

/**
 * dev.to has no `$$` syntax: it renders math through KaTeX liquid tags.
 * `$$x$$` inside a line becomes an inline tag, a `$$` fence becomes a block tag.
 * Fenced code is left alone. `{{` is split because liquid would read it as output.
 * Docs: https://dev.to/p/editor_guide (KaTeX section).
 */
export function toDevtoMath(markdown) {
  const safe = (tex) => tex.replace(/\{\{/g, "{ {");
  let inCode = false;
  let inMath = false;
  return markdown
    .split("\n")
    .map((line) => {
      if (!inMath && /^\s*(```|~~~)/.test(line)) inCode = !inCode;
      if (inCode) return line;
      if (/^\$\$\s*$/.test(line)) {
        inMath = !inMath;
        return inMath ? "{% katex %}" : "{% endkatex %}";
      }
      if (inMath) return safe(line);
      return line.replace(/\$\$(.+?)\$\$/g, (_m, tex) => `{% katex inline %}${safe(tex.trim())}{% endkatex %}`);
    })
    .join("\n");
}

/** Medium has no math: show the LaTeX source as code. */
export function toCodeMath(markdown) {
  let inMath = false;
  return markdown
    .split("\n")
    .map((line) => {
      if (/^\$\$\s*$/.test(line)) {
        inMath = !inMath;
        return inMath ? "```latex" : "```";
      }
      return inMath ? line : line.replace(/\$\$(.+?)\$\$/g, (_m, tex) => "`" + tex.trim() + "`");
    })
    .join("\n");
}
