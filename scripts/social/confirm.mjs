// Schedule a post's X and Substack drafts in Typefully, timed to its approved publish time.
//
//   node scripts/social/confirm.mjs --post <slug> --at <publishedAt ISO>
//
// Run by the Publish action after `/publish` merges a post, so Aditya's one approval releases the
// blog, dev.to, X and Substack Notes together. Every draft that `load.mjs` made for the post
// (Hook, Thread + Substack Note, X Article, Singles) keeps its offset from the blog time and moves
// with it. If a slot would land in the past (a late or "now" approval), it moves to the next
// free quarter hour instead.
//
// Needs TYPEFULLY_API_KEY in the environment (or the CLI's saved config). Writes are paced.
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => (v.startsWith("--") ? [...a, [v.slice(2), all[i + 1]]] : a), []));
const slug = args.post, at = args.at;
if (!slug || !at) { console.error("usage: confirm.mjs --post <slug> --at <ISO time>"); process.exit(2); }

const CLI = `${process.cwd()}/.claude/skills/typefully/scripts/typefully.js`;
const SS = process.env.TYPEFULLY_SOCIAL_SET || "364514";
const PACE = Number(process.env.PACE_MS || 20000);
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const run = (a) => {
  for (let i = 0; ; i++) {
    try { return JSON.parse(execFileSync("node", [CLI, ...a], { encoding: "utf8" })); }
    catch (e) {
      const out = String(e.stdout || e.message);
      if (/RATE_LIMITED|429/.test(out) && i < 6) { sleep(120000); continue; }
      throw new Error(out.slice(0, 300));
    }
  }
};

const md = fs.readFileSync(`content/blog/${slug}.md`, "utf8");
const title = md.match(/^title:\s*(.+)$/m)[1].trim().replace(/^['"]|['"]$/g, "");

const all = [];
for (const status of ["planned", "scheduled"]) {
  for (let off = 0; ; off += 50) {
    const r = run(["drafts:list", SS, "--status", status, "--limit", "50", "--offset", String(off)]);
    all.push(...r.results); if (!r.next) break;
  }
}
const mine = all.filter((d) => d.draft_title?.startsWith(`v2 / ${slug} / `) || d.draft_title === title);
const hook = mine.find((d) => d.draft_title === `v2 / ${slug} / hook`);
if (!hook) { console.log(`No Typefully drafts found for ${slug}. Run scripts/social/load.mjs first.`); process.exit(0); }

// load.mjs puts the hook 30 minutes after the planned blog time.
const plannedBlog = new Date(hook.scheduled_date).getTime() - 30 * 60e3;
const delta = new Date(at).getTime() - plannedBlog;
const now = Date.now();
let nextFree = Math.ceil((now + 10 * 60e3) / (15 * 60e3)) * 15 * 60e3;

const report = [];
for (const d of mine.sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))) {
  let t = new Date(d.scheduled_date).getTime() + delta;
  if (t < now + 5 * 60e3) { t = nextFree; nextFree += 30 * 60e3; }
  const iso = new Date(t).toISOString();
  try {
    run(["drafts:schedule", SS, String(d.id), "--time", iso]);
    report.push(`- scheduled ${d.draft_title?.replace(`v2 / ${slug} / `, "") || "x article"} at ${iso}`);
  } catch (e) {
    report.push(`- FAILED ${d.draft_title}: ${e.message.replace(/\s+/g, " ").slice(0, 160)}`);
  }
  sleep(PACE);
}
const failed = report.filter((l) => l.includes("FAILED")).length;
console.log(`Typefully: ${mine.length - failed} of ${mine.length} drafts scheduled for ${slug}.\n${report.join("\n")}`);
if (failed) process.exitCode = 1;
