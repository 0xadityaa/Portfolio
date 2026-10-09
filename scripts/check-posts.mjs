#!/usr/bin/env node
/**
 * Checks every post against the rules in docs/blog/style.md that a machine can
 * judge. Runs in CI on pull requests. `node scripts/check-posts.mjs`
 */
import { loadPosts } from "./lib/posts.mjs";

// Posts from before the style guide keep their original shape.
// Set POSTS_CHECK_SINCE=2000-01-01 to hold the whole archive to the guide.
const STYLE_GUIDE_SINCE = process.env.POSTS_CHECK_SINCE ?? "2026-10-01";
// Stock phrases the style guide asks to be replaced with the specific thing meant.
const STOCK_PHRASES = [
  "hot take",
  "the hard way",
  "nobody talks about",
  "nobody blogs about",
  "game changer",
  "game-changer",
  "everyone and their dog",
  "let's dive in",
  "in today's",
];

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

  if (new Date(String(data.publishedAt)).toISOString() < STYLE_GUIDE_SINCE) continue;

  if (String(data.title).length > 60) fail("title is over 60 characters");
  if (String(data.summary).length > 160) fail("summary is over 160 characters");
  if (data.tags?.length > 5) fail("more than 5 tags");
  if (/[—–]/.test(content) || /[—–]/.test(`${data.title}${data.summary}`)) {
    fail("contains an em or en dash; use a comma, colon, or period");
  }
  const prose = content.replace(/```[\s\S]*?```/g, "");
  for (const phrase of STOCK_PHRASES) {
    if (prose.toLowerCase().includes(phrase)) fail(`stock phrase "${phrase}"; write the specific thing instead`);
  }
  const words = prose.split(/\s+/).filter(Boolean).length;
  if (words < 400 || words > 3000) {
    fail(`is ${words} words; a note is 400 to 900 and an essay 1,500 to 3,000`);
  }
  // Links are the evidence trail: five external links per 1,000 words.
  const links = new Set(prose.match(/\]\(https?:\/\/[^)\s]+/g) ?? []).size;
  const expected = Math.max(3, Math.floor((words / 1000) * 5));
  if (links < expected) {
    fail(`has ${links} external links; expected at least ${expected} for ${words} words`);
  }
  if (!/!\[[^\]]+\]\(|```|^\|.*\|$/m.test(content)) {
    fail("has no diagram, code block, or table; where is the artifact?");
  }
  if (data.updated && Number.isNaN(new Date(String(data.updated)).getTime())) {
    fail(`updated "${data.updated}" is not a date`);
  }
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("All posts pass.");
