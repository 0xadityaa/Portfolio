#!/usr/bin/env node
/**
 * Checks every post against the rules in docs/blog/style.md that a machine can
 * judge. Runs in CI on pull requests. `node scripts/check-posts.mjs`
 */
import { loadPosts } from "./lib/posts.mjs";

const SIGN_OFF = "✌️ Stay curious, Keep coding, Peace nerds!";
// Posts from before the style guide keep their original shape.
const STYLE_GUIDE_SINCE = "2026-10-01";

const problems = [];

for (const post of loadPosts()) {
  const { slug, data, content } = post;
  const fail = (message) => problems.push(`content/blog/${slug}.md: ${message}`);

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) fail("file name must be lowercase kebab-case");
  for (const key of ["title", "publishedAt", "summary"]) {
    if (!data[key]) fail(`frontmatter is missing "${key}"`);
  }
  if (data.publishedAt && Number.isNaN(new Date(String(data.publishedAt)).getTime())) {
    fail(`publishedAt "${data.publishedAt}" is not a date`);
  }
  if (!Array.isArray(data.tags) || data.tags.length === 0) fail("needs at least one tag");
  if (/^#\s/m.test(content.replace(/```[\s\S]*?```/g, ""))) {
    fail("body must not contain an H1; the title comes from frontmatter");
  }

  if (String(data.publishedAt) < STYLE_GUIDE_SINCE) continue;

  if (String(data.title).length > 60) fail("title is over 60 characters");
  if (String(data.summary).length > 160) fail("summary is over 160 characters");
  if (data.tags?.length > 5) fail("more than 5 tags");
  if (/[—–]/.test(content) || /[—–]/.test(`${data.title}${data.summary}`)) {
    fail("contains an em or en dash; use a comma, colon, or period");
  }
  if (!/^## TL;DR$/m.test(content)) fail('missing the "## TL;DR" section');
  if (!/^## Final Thoughts$/m.test(content)) fail('missing the "## Final Thoughts" section');
  if (!content.trim().endsWith(SIGN_OFF)) fail(`must end with the sign-off line: ${SIGN_OFF}`);
  const words = content.split(/\s+/).length;
  if (words < 500 || words > 1600) fail(`is ${words} words; aim for 700 to 1,200`);
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("All posts pass.");
