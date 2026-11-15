// Usage: node scripts/social/load.mjs <slug> <blogDate YYYY-MM-DD> [--dry]
// Playbook v2 cadence (docs/research/x-playbook.md section 7):
//   blog day 09:30 hook (scheduled), 17:30 thread + Substack Note (planned until /publish)
//   then singles (X + Substack Notes, scheduled) and the X Article (planned) across the window.
// Tuesday posts get a 3-day window with extra 12:30 slots; Friday posts a 4-day window.
// Idempotent: drafts are titled "v2 / <slug> / <part>"; existing v2 parts are skipped, older drafts for the slug deleted.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import os from "node:os";

const [slug, day, flag] = process.argv.slice(2);
const dry = flag === "--dry";
const REPO = process.cwd();
const CLI = `${REPO}/.claude/skills/typefully/scripts/typefully.js`;
const SS = process.env.TYPEFULLY_SOCIAL_SET || "364514";
const SITE = "https://www.0xadityaa.dev";
const url = `${SITE}/blog/${slug}`;
const HERE = fs.mkdtempSync(path.join(os.tmpdir(), "social-"));
const PACE = Number(process.env.PACE_MS || 40000);
const SCHEDULE_STANDALONE = process.env.SCHEDULE === "1";
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const show = (p) => execFileSync("git", ["-C", REPO, "show", `origin/post/${slug}:${p}`], { encoding: "utf8", maxBuffer: 1 << 26 });
const postRaw = show(`content/blog/${slug}.md`);
const social = show(`content/research/${slug}/social.md`);
const title = postRaw.match(/^title:\s*(.+)$/m)[1].replace(/^['"]|['"]$/g, "");
const sec = Object.fromEntries(social.split(/^## /m).slice(1).map((s) => {
  const [h, ...rest] = s.split("\n"); return [h.trim().toLowerCase(), rest.join("\n").trim()];
}));
for (const k of ["hook", "thread", "singles", "substack note"]) if (!sec[k]) throw new Error(`${slug}: social.md has no "## ${k}"`);
const posts = (t) => t.split(/\n---\n/).map((p) => p.trim()).filter(Boolean);
let hook = sec["hook"];
const img = (hook.match(/^\[image:\s*(\S+)\]\s*$/m) || [])[1];
hook = hook.replace(/^\[image:[^\]]*\]\s*$/m, "").trim();
const thread = posts(sec["thread"]), singles = posts(sec["singles"]), note = sec["substack note"];
const prompts = sec["reply prompts"] || "", cta = sec["cta"] || "";
if (singles.length !== 5) throw new Error(`${slug}: expected 5 singles, got ${singles.length}`);

function toArticle(md) {
  let body = md.replace(/^---[\s\S]*?\n---\n/, "");
  body = body.replace(/\]\((\/[^)]+)\)/g, `](${SITE}$1)`).replace(/^!\[[^\]]*\]\([^)]*\)\s*$/gm, "").replace(/^###+ /gm, "## ");
  const lines = body.split("\n"), out = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^\|/.test(lines[i]) && /^\|\s*:?-/.test(lines[i + 1] || "")) {
      const cells = (l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const head = cells(lines[i]); i += 2;
      while (i < lines.length && /^\|/.test(lines[i])) {
        const row = cells(lines[i]);
        out.push(`- **${row[0]}**: ` + head.slice(1).map((h, j) => `${h} ${row[j + 1]}`).join("; ")); i++;
      }
      i--; continue;
    }
    out.push(lines[i]);
  }
  return `# ${title}\n\n${out.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n\nOriginally published at [0xadityaa.dev](${url}), with the charts and the code.`;
}

const tmp = fs.mkdtempSync(path.join(HERE, "tmp-"));
const fileOf = (n, t) => { const f = path.join(tmp, n); fs.writeFileSync(f, t); return f; };
function svgToPng(rel) {
  const svg = show(rel.replace(/^\//, "").replace(/^images\//, "public/images/"));
  const vb = svg.match(/viewBox="[\d.\s-]*?\s([\d.]+)\s+([\d.]+)"/);
  const [w, h] = vb ? [Number(vb[1]), Number(vb[2])] : [800, 450];
  const W = 1600, H = Math.round((W * h) / w);
  fs.writeFileSync(path.join(tmp, "c.svg"), svg);
  fs.writeFileSync(path.join(tmp, "c.html"), `<!doctype html><html><body style="margin:0;background:#30302E"><img src="c.svg" style="width:${W}px;display:block"></body></html>`);
  const out = path.join(tmp, "c.png");
  execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--screenshot=${out}`, `--window-size=${W},${H}`, `file://${tmp}/c.html`], { stdio: "ignore" });
  return out;
}

let first = true;
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const tf = (args) => {
  if (dry) { console.error("DRY", args.filter((a) => a.length < 90).join(" ")); return { id: "dry" }; }
  if (!first) sleep(PACE);
  first = false;
  for (let attempt = 0; ; attempt++) {
    try { return JSON.parse(execFileSync("node", [CLI, ...args], { encoding: "utf8" })); }
    catch (e) {
      const out = String(e.stdout || "");
      if (/RATE_LIMITED|429/.test(out) && attempt < 12) { console.error(`rate limited; waiting ${5 * (attempt + 1)} min`); sleep(300000 * (attempt + 1)); continue; }
      throw new Error(`${args[0]} failed: ${out.slice(0, 400)}`);
    }
  }
};

// Toronto offset for a calendar day.
const at = (offsetDays, hhmm) => {
  const d0 = new Date(`${day}T12:00:00Z`); d0.setUTCDate(d0.getUTCDate() + offsetDays);
  const y = d0.getUTCFullYear(), m = d0.getUTCMonth(), dom = d0.getUTCDate();
  const march = new Date(Date.UTC(y, 2, 1)); const secondSun = 8 + ((7 - march.getUTCDay()) % 7);
  const nov = new Date(Date.UTC(y, 10, 1)); const firstSunNov = 1 + ((7 - nov.getUTCDay()) % 7);
  const edt = (m > 2 && m < 10) || (m === 2 && dom >= secondSun) || (m === 10 && dom < firstSunNov);
  return new Date(`${d0.toISOString().slice(0, 10)}T${hhmm}:00${edt ? "-04:00" : "-05:00"}`).toISOString();
};
const dow = new Date(`${day}T12:00:00Z`).getUTCDay(); // 2 = Tue, 5 = Fri
const tue = dow === 2;
// slot plan per playbook section 7
const plan = tue
  ? { hook: [0, "09:30"], s1: [0, "12:30"], thread: [0, "17:30"], s2: [1, "09:30"], s3: [1, "12:30"], s4: [1, "17:30"], article: [2, "09:30"], s5: [2, "17:30"] }
  : { hook: [0, "09:30"], thread: [0, "17:30"], s1: [1, "09:30"], s2: [1, "17:30"], article: [2, "09:30"], s3: [2, "17:30"], s4: [3, "09:30"], s5: [3, "17:30"] };

// Existing drafts (all statuses we manage).
const all = [];
for (const status of ["planned", "scheduled", "draft"]) {
  for (let off = 0; ; off += 50) {
    const r = JSON.parse(execFileSync("node", [CLI, "drafts:list", SS, "--status", status, "--limit", "50", "--offset", String(off)], { encoding: "utf8" }));
    all.push(...r.results); if (!r.next) break;
  }
}
const titleMap = {};
const oldTitles = new Set((titleMap[slug] || []).filter((t) => t !== title));
const v2 = Object.fromEntries(all.filter((d) => d.draft_title?.startsWith(`v2 / ${slug} / `)).map((d) => [d.draft_title.split(" / ")[2], d.id]));
// Typefully renames an X Article draft to its H1, so a draft titled exactly like the post is this run's article.
const v2Article = all.find((d) => d.draft_title === title);
const old = all.filter((d) => d.draft_title?.startsWith(`${slug} / `) || oldTitles.has(d.draft_title));
for (const d of old) tf(["drafts:delete", SS, String(d.id)]);

const made = [];
const base = ["--tags", "needs-review"];
const gate = `Blog: ${url}. Thread and X Article stay planned until /publish merges and the URL returns 200.`;
const ctaNote = cta ? `\n\nCTA keyword: reply to everyone who comments it with the link. ${cta}` : "";
const when = (k) => at(...plan[k]);
const timing = (k, standalone) => (standalone && SCHEDULE_STANDALONE ? ["--schedule", when(k)] : ["--plan", when(k)]);

let media = null;
if (img && !v2.hook) {
  const png = dry ? null : svgToPng(img);
  if (!dry) { const m = tf(["media:upload", SS, png]); media = m.media_id || m.id; }
}
if (!v2.hook) {
  const h = tf(["drafts:create", SS, "--platform", "x", "--text", hook, ...timing("hook", true), "--title", `v2 / ${slug} / hook`, ...base,
    ...(media ? ["--media", String(media)] : []), "--scratchpad", `${gate}${ctaNote}\n\nReply prompts for this window:\n${prompts}`]);
  made.push(["hook", h.id, when("hook")]);
}
if (!v2.thread) {
  const t = tf(["drafts:create", SS, "--platform", "x", "--file", fileOf("thread.txt", thread.join("\n---\n")), ...timing("thread", false),
    "--title", `v2 / ${slug} / thread`, ...base, "--scratchpad", `${gate}${ctaNote}\n\nThis draft carries the X thread and the Substack Note.`]);
  tf(["drafts:update", SS, String(t.id), "--platform", "substack", "--text", note]);
  made.push(["thread + substack note", t.id, when("thread")]);
}
if (!v2.article && !v2Article) {
  const a = tf(["drafts:create", SS, "--platform", "x_article", "--content-markdown", toArticle(postRaw), ...timing("article", false), ...base,
    "--scratchpad", `${gate}\nFull post as an X Article. Tables became lists.`]);
  made.push(["article", a.id, when("article")]);
}
singles.forEach((s, i) => {
  const k = `s${i + 1}`;
  if (v2[`single ${i + 1}`]) return;
  const r = tf(["drafts:create", SS, "--platform", "x,substack", "--text", s, ...timing(k, true), "--title", `v2 / ${slug} / single ${i + 1}`, ...base]);
  made.push([`single ${i + 1} (x+substack)`, r.id, when(k)]);
});
fs.rmSync(tmp, { recursive: true });
console.log(JSON.stringify({ slug, title, day, deleted: old.length, made }));
