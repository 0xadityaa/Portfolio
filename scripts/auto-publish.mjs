#!/usr/bin/env node
/**
 * Publishes scheduled posts with no human step.
 *
 * A post's pull request is scheduled by one line in its description:
 *
 *   Publish: 2026-11-30 09:00        (Toronto time; also "2026-11-30" or an ISO instant)
 *
 * Every run (see .github/workflows/auto-publish.yml) looks at the open `post/*`
 * pull requests. One whose time is within LEAD_MINUTES gets `publishedAt` set
 * to that exact time, `draft` removed, and is merged. The site shows the post at
 * `publishedAt`, so merging early costs nothing. The Cross-post action then
 * syndicates it.
 *
 * Stops, and leaves the pull request alone, when:
 *   - it has the `hold` label, is a draft pull request, or has a failing check;
 *   - it changes anything outside content/blog, content/research, public/images/blog;
 *   - posts:check fails on its branch.
 *
 *   node scripts/auto-publish.mjs [--dry-run]
 */
import { execFileSync } from "child_process";
import { describe, parseWhen } from "./lib/schedule.mjs";

const DRY = process.argv.includes("--dry-run");
const LEAD_MINUTES = Number(process.env.LEAD_MINUTES ?? 60);
const ALLOWED = [/^content\/blog\//, /^content\/research\//, /^public\/images\/blog\//];

const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"], ...opts }).trim();
const gh = (...args) => run("gh", args);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function comment(number, body) {
  if (!DRY) gh("pr", "comment", String(number), "--body", body);
}

async function merge(number) {
  // Right after a push GitHub has not computed mergeability yet; retry.
  let lastError;
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      gh("pr", "merge", String(number), "--merge");
      return;
    } catch (error) {
      lastError = error;
      await sleep(10000);
    }
  }
  throw lastError;
}

const prs = JSON.parse(
  gh("pr", "list", "--state", "open", "--limit", "100", "--json", "number,title,headRefName,body,labels,isDraft,statusCheckRollup")
);

const now = new Date();
let published = 0;

for (const pr of prs) {
  if (!pr.headRefName.startsWith("post/")) continue;
  const line = (pr.body ?? "").match(/^Publish:[ \t]*(.+)$/im);
  if (!line) continue;
  const tag = `#${pr.number}`;

  if (pr.isDraft || pr.labels.some((label) => label.name === "hold")) {
    console.log(`${tag}: held`);
    continue;
  }

  let when;
  try {
    when = parseWhen(line[1].trim(), now);
  } catch (error) {
    console.log(`${tag}: ${error.message}`);
    comment(pr.number, `Auto-publish could not read the \`Publish:\` line: ${error.message}`);
    continue;
  }
  const minutes = (when.getTime() - now.getTime()) / 60000;
  if (minutes > LEAD_MINUTES) {
    console.log(`${tag}: due ${when.toISOString()}, not yet`);
    continue;
  }

  const failing = (pr.statusCheckRollup ?? []).filter((check) =>
    ["FAILURE", "ERROR", "TIMED_OUT", "CANCELLED"].includes(check.conclusion ?? check.state)
  );
  if (failing.length > 0) {
    console.log(`${tag}: failing checks, skipped`);
    comment(pr.number, `Auto-publish skipped this: a check is failing (${failing.map((c) => c.name ?? c.context).join(", ")}). Fix it and the next run publishes it for ${describe(when)}.`);
    continue;
  }

  const changed = gh("pr", "diff", String(pr.number), "--name-only").split("\n").filter(Boolean);
  const outside = changed.filter((file) => !ALLOWED.some((pattern) => pattern.test(file)));
  if (outside.length > 0) {
    console.log(`${tag}: touches ${outside.join(", ")}, needs a human`);
    comment(pr.number, `Auto-publish skipped this: it changes files outside the post (${outside.join(", ")}). Merge it by hand or comment \`/publish\`.`);
    continue;
  }
  const posts = changed.filter((file) => /^content\/blog\/[a-z0-9-]+\.md$/.test(file));
  if (posts.length === 0) continue;

  console.log(`${tag}: publishing ${posts.join(", ")} for ${describe(when)}`);
  if (DRY) continue;

  try {
    gh("pr", "checkout", String(pr.number));
    run("node", ["scripts/schedule-post.mjs", "--when", when.toISOString(), ...posts]);
    run("node", ["scripts/check-posts.mjs"]);
    if (run("git", ["status", "--porcelain", "content/blog"])) {
      run("git", ["add", "content/blog"]);
      run("git", ["commit", "-m", `chore(post): schedule for ${describe(when)}`]);
      run("git", ["push"]);
    }
    await merge(pr.number);
    comment(pr.number, `Auto-published. Goes live **${describe(when)}**; the Cross-post action syndicates it within the hour after that. To stop a post, label its pull request \`hold\` before the time, or set \`draft: true\` afterwards.`);
    published++;
  } catch (error) {
    const detail = (error.stderr || error.message || "").toString().slice(0, 600);
    console.log(`${tag}: failed: ${detail}`);
    comment(pr.number, `Auto-publish failed on this pull request and left it open:\n\n\`\`\`\n${detail}\n\`\`\``);
  } finally {
    try {
      run("git", ["checkout", "-f", "main"]);
    } catch {}
  }
}

console.log(`${published} published`);
