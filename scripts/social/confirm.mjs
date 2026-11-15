// Turn planned drafts into real schedules at their planned times.
//   node scripts/social/confirm.mjs                 hooks + singles for every post (they stand alone; no blog link)
//   node scripts/social/confirm.mjs --post <slug>   that post's thread (+ Substack Note) and X Article, after its /publish merged
// Writes are paced to stay under Typefully's rate limit.
import { execFileSync } from "node:child_process";

const CLI = `${process.cwd()}/.claude/skills/typefully/scripts/typefully.js`;
const SS = "364514";
const args = process.argv.slice(2);
const post = args[0] === "--post" ? args[1] : null;
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const run = (a) => JSON.parse(execFileSync("node", [CLI, ...a], { encoding: "utf8" }));

const all = [];
for (let off = 0; ; off += 50) {
  const r = run(["drafts:list", SS, "--status", "planned", "--limit", "50", "--offset", String(off)]);
  all.push(...r.results); if (!r.next) break;
}
const pick = all.filter((d) => {
  const t = d.draft_title || "";
  if (post) {
    if (t === `v2 / ${post} / thread`) return true;
    // X Articles carry the post's title; match by the scratchpad-free rule: x_post disabled and same week as the thread.
    return false;
  }
  return /^v2 \/ .+ \/ (hook|single \d)$/.test(t);
});
if (post) {
  const thread = pick[0];
  if (thread) {
    const day = thread.scheduled_date.slice(0, 10);
    const t0 = new Date(day).getTime();
    for (const d of all) if (!d.x_post_enabled && d.scheduled_date && Math.abs(new Date(d.scheduled_date).getTime() - t0) < 4 * 864e5 && !(d.draft_title || "").startsWith("v2 /")) pick.push(d);
  }
}
const quota = run(["social-sets:get", SS]).publishing_quota;
console.log(`confirming ${pick.length} drafts; quota: ${JSON.stringify(quota)}`);
for (const d of pick) {
  for (let i = 0; ; i++) {
    try { run(["drafts:schedule", SS, String(d.id), "--time", d.scheduled_date]); console.log("scheduled", d.id, d.draft_title, d.scheduled_date); break; }
    catch (e) {
      const out = String(e.stdout || "");
      if (/RATE_LIMITED|429/.test(out) && i < 10) { sleep(300000); continue; }
      console.log("FAILED", d.id, d.draft_title, out.slice(0, 200)); break;
    }
  }
  sleep(30000);
}
