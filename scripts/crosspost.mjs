#!/usr/bin/env node
/**
 * Syndicates live posts to the platforms in scripts/platforms.
 *
 *   node scripts/crosspost.mjs            publish what is due
 *   node scripts/crosspost.mjs --dry-run  print what would happen
 *
 * A post is due on a platform when it is not a draft, its publish time has
 * passed, it is live on the site, and its frontmatter has no URL for that
 * platform yet. Published URLs are written back to the frontmatter, which is
 * what makes a rerun safe. Platforms without an API (or without a secret) are
 * collected into one GitHub issue per run as a manual checklist.
 */
import { absolutize, loadPosts, publishTime, saveFrontmatter } from "./lib/posts.mjs";
import { platforms } from "./platforms/index.mjs";

const dryRun = process.argv.includes("--dry-run");
// Posts older than this were published before syndication existed. Leave them alone.
const since = new Date(process.env.CROSSPOST_SINCE || "2026-10-01T00:00:00Z");

async function isLive(url) {
  try {
    return (await fetch(url, { method: "HEAD", redirect: "follow" })).ok;
  } catch {
    return false;
  }
}

/** One issue per run, covering every post that has manual platforms left. */
async function openChecklistIssue(entries) {
  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;
  const body = [
    "These posts are live. The platforms below have no publishing API, so they need you:",
    "",
    ...entries.flatMap(({ post, steps }) => [
      `### [${post.data.title}](${post.url})`,
      "",
      ...steps.map((step) => `- [ ] ${step}`),
      "",
      `Markdown source for pasting: ${post.url}.md`,
      "",
    ]),
    "Close this issue when you are done. To record a link, add it to the post's frontmatter.",
  ].join("\n");

  if (!repo || !token) {
    console.log("manual steps (no GITHUB_TOKEN, not opening an issue):\n" + body);
    return null;
  }
  const title =
    entries.length === 1
      ? `Cross-post: ${entries[0].post.data.title}`
      : `Cross-post: ${entries.length} posts`;
  const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, labels: ["crosspost"], body }),
  });
  if (!res.ok) throw new Error(`Could not open checklist issue: ${res.status} ${await res.text()}`);
  return (await res.json()).html_url;
}

// Platforms rate-limit bursts (dev.to allowed two posts, then asked for a
// pause) and a wall of posts reads as spam, so a backlog drains one post per run. Oldest first keeps each platform's feed in order.
const maxPerRun = Number(process.env.CROSSPOST_MAX || 1);
// A platform that fails once is left alone for the rest of the run.
const blocked = new Set();
let published = 0;
const checklist = [];

let failures = 0;

const posts = loadPosts().sort(
  (a, b) => publishTime(a.data.publishedAt) - publishTime(b.data.publishedAt)
);

for (const post of posts) {
  const { data } = post;
  const due =
    !data.draft &&
    publishTime(data.publishedAt) <= new Date() &&
    publishTime(data.publishedAt) >= since;
  if (!due) continue;

  const pending = platforms.filter((platform) => !data[platform.field]);
  const needsIssue = !data.crosspost_issue && pending.some((p) => !p.publish || !process.env[p.secret]);
  if (pending.every((p) => !p.publish || !process.env[p.secret]) && !needsIssue) continue;

  if (!(await isLive(post.url))) {
    console.log(`${post.slug}: not live on the site yet, skipping until the next run`);
    continue;
  }

  console.log(`${post.slug}:`);
  const article = {
    title: data.title,
    summary: data.summary,
    tags: data.tags ?? [],
    url: post.url,
    body: absolutize(post.content.trim()),
  };
  const manualSteps = [];

  for (const platform of pending) {
    const secret = platform.secret && process.env[platform.secret];
    if (!platform.publish || !secret) {
      if (platform.manual) manualSteps.push(`**${platform.name}**: ${platform.manual(post)}`);
      else console.log(`  ${platform.name}: ${platform.secret} is not set, skipping`);
      continue;
    }
    if (published >= maxPerRun || blocked.has(platform.name)) {
      console.log(`  ${platform.name}: waiting for the next run`);
      continue;
    }
    if (dryRun) {
      published++;
      console.log(`  ${platform.name}: would publish`);
      continue;
    }
    try {
      const url = await platform.publish(article, secret);
      published++;
      saveFrontmatter(post, { [platform.field]: url });
      console.log(`  ${platform.name}: ${url}`);
    } catch (error) {
      blocked.add(platform.name);
      // Being asked to slow down is expected with a backlog, not a failure.
      if (!/\b429\b/.test(error.message)) failures++;
      console.error(`  ${platform.name}: not published, will retry next run. ${error.message}`);
    }
  }

  if (manualSteps.length > 0 && !data.crosspost_issue) {
    checklist.push({ post, steps: manualSteps });
  }
}

if (checklist.length > 0) {
  if (dryRun) {
    console.log(`would open one checklist issue covering ${checklist.length} post(s)`);
  } else {
    const issueUrl = await openChecklistIssue(checklist);
    if (issueUrl) {
      for (const { post } of checklist) saveFrontmatter(post, { crosspost_issue: issueUrl });
      console.log(`checklist: ${issueUrl}`);
    }
  }
}

process.exit(failures > 0 ? 1 : 0);
