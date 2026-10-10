#!/usr/bin/env node
/**
 * Pushes the current title, summary, tags and body of every post that already
 * has a dev.to copy (a `devto_url` in frontmatter) to that copy. Run it after
 * rewriting published posts: `node scripts/update-devto.mjs [--dry-run]`.
 * Docs: https://developers.forem.com/api/v1#tag/articles/operation/updateArticle
 */
import { absolutize, loadPosts } from "./lib/posts.mjs";

const dryRun = process.argv.includes("--dry-run");
const apiKey = process.env.DEVTO_API_KEY;
if (!apiKey && !dryRun) {
  console.error("DEVTO_API_KEY is not set.");
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const headers = { "Content-Type": "application/json", "api-key": apiKey ?? "" };

const posts = loadPosts().filter((post) => post.data.devto_url);
if (posts.length === 0) {
  console.log("No posts have a devto_url.");
  process.exit(0);
}

// The update endpoint needs the article id, which the list endpoint gives us by URL.
const mine = dryRun
  ? []
  : await fetch("https://dev.to/api/articles/me/all?per_page=1000", { headers }).then((res) => {
      if (!res.ok) throw new Error(`Could not list dev.to articles: ${res.status}`);
      return res.json();
    });

let failed = 0;
for (const post of posts) {
  const { data } = post;
  if (dryRun) {
    console.log(`${post.slug}: would update ${data.devto_url}`);
    continue;
  }
  const article = mine.find((a) => a.url === data.devto_url || a.canonical_url === post.url);
  if (!article) {
    console.error(`${post.slug}: no dev.to article matches ${data.devto_url}`);
    failed++;
    continue;
  }
  const body = JSON.stringify({
    article: {
      title: data.title,
      body_markdown: absolutize(post.content.trim()),
      description: data.summary,
      canonical_url: post.url,
      // dev.to allows at most 4 tags, lowercase alphanumeric only.
      tags: (data.tags ?? [])
        .map((tag) => tag.toLowerCase().replace(/[^a-z0-9]/g, ""))
        .filter(Boolean)
        .slice(0, 4),
    },
  });

  // dev.to rate-limits bursts: wait between updates and retry once after a 429.
  for (let attempt = 1; attempt <= 2; attempt++) {
    const res = await fetch(`https://dev.to/api/articles/${article.id}`, { method: "PUT", headers, body });
    if (res.ok) {
      console.log(`${post.slug}: updated ${data.devto_url}`);
      break;
    }
    if (res.status === 429 && attempt === 1) {
      await sleep(60_000);
      continue;
    }
    console.error(`${post.slug}: dev.to responded ${res.status}: ${(await res.text()).slice(0, 200)}`);
    failed++;
    break;
  }
  await sleep(35_000);
}

process.exit(failed > 0 ? 1 : 0);
