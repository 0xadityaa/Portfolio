#!/usr/bin/env node
/**
 * Approves posts for release: sets `publishedAt` and clears `draft`.
 *
 *   node scripts/schedule-post.mjs --when "2026-10-15" content/blog/my-post.md
 *
 * Used by the Publish workflow when Aditya comments `/publish [when]` on a
 * post's pull request. See docs/blog/workflow.md.
 */
import fs from "fs";
import matter from "gray-matter";
import { describe, parseWhen } from "./lib/schedule.mjs";

const args = process.argv.slice(2);
const whenIndex = args.indexOf("--when");
const when = whenIndex >= 0 ? args.splice(whenIndex, 2)[1] : "";
const files = args.filter((file) => /^content\/blog\/[a-z0-9-]+\.md$/.test(file));

if (files.length === 0) {
  console.error("No post files given. Expected paths like content/blog/<slug>.md.");
  process.exit(1);
}

let instant;
try {
  instant = parseWhen(when);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
if (Number.isNaN(instant.getTime())) {
  console.error(`"${when}" is not a real date.`);
  process.exit(1);
}

for (const file of files) {
  const { data, content } = matter(fs.readFileSync(file, "utf-8"));
  delete data.draft;
  data.publishedAt = instant.toISOString().replace(".000Z", "Z");
  fs.writeFileSync(file, matter.stringify(content, data));
}

// The workflow reads this line for its confirmation comment.
console.log(describe(instant));
