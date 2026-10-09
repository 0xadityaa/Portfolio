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
 * collected into one GitHub issue per post as a manual checklist.
 */
import { absolutize, loadPosts, publishTime, saveFrontmatter } from "./lib/posts.mjs";
import { platforms } from "./platforms/index.mjs";

const dryRun = process.argv.includes("--dry-run");
// Posts older than this were published before syndication existed. Leave them alone.
const since = new Date(process.env.CROSSPOST_SINCE ?? "2026-10-01T00:00:00Z");

async function isLive(url) {
  try {
    return (await fetch(url, { method: "HEAD", redirect: "follow" })).ok;
  } catch {
    return false;
  }
}

async function openChecklistIssue(post, steps) {
  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;
  if (!repo || !token) {
    console.log(`  manual steps for ${post.slug} (no GITHUB_TOKEN, not opening an issue):`);
    steps.forEach((step) => console.log(`    - ${step}`));
    return null;
  }
  const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: `Cross-post: ${post.data.title}`,
      labels: ["crosspost"],
      body: [
        `[${post.data.title}](${post.url}) is live. These platforms have no API access, so they need you:`,
        "",
        ...steps.map((step) => `- [ ] ${step}`),
        "",
        `Markdown source for pasting: ${post.url}.md`,
        "",
        "Close this issue when you are done. To record a link, add it to the post's frontmatter.",
      ].join("\n"),
    }),
  });
  if (!res.ok) throw new Error(`Could not open checklist issue: ${res.status} ${await res.text()}`);
  return (await res.json()).html_url;
}

let failures = 0;

for (const post of loadPosts()) {
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
    if (dryRun) {
      console.log(`  ${platform.name}: would publish`);
      continue;
    }
    try {
      const url = await platform.publish(article, secret);
      saveFrontmatter(post, { [platform.field]: url });
      console.log(`  ${platform.name}: ${url}`);
    } catch (error) {
      failures++;
      console.error(`  ${platform.name}: failed, will retry next run. ${error.message}`);
    }
  }

  if (manualSteps.length > 0 && !data.crosspost_issue) {
    if (dryRun) {
      console.log(`  would open a checklist issue for: ${manualSteps.length} manual platform(s)`);
    } else {
      const issueUrl = await openChecklistIssue(post, manualSteps);
      if (issueUrl) {
        saveFrontmatter(post, { crosspost_issue: issueUrl });
        console.log(`  checklist: ${issueUrl}`);
      }
    }
  }
}

process.exit(failures > 0 ? 1 : 0);
