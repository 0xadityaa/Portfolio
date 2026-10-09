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
