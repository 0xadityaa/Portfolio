import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { Queue } from "./queue/Queue.mjs";
import { handleBlogPublish } from "./queue/handlers/blogPublish.mjs";

const queue = new Queue();
queue.registerHandler("blogPublish", handleBlogPublish);

const OBSIDIAN_DIR = path.join(process.cwd(), "obsidian");
const CONTENT_DIR = path.join(process.cwd(), "content");
const PUBLIC_OBSIDIAN_DIR = path.join(process.cwd(), "public", "obsidian");

// Ensure directories exist
if (!fs.existsSync(OBSIDIAN_DIR)) {
  fs.mkdirSync(OBSIDIAN_DIR, { recursive: true });
}
if (!fs.existsSync(CONTENT_DIR)) {
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
}
if (!fs.existsSync(PUBLIC_OBSIDIAN_DIR)) {
  fs.mkdirSync(PUBLIC_OBSIDIAN_DIR, { recursive: true });
}

// Helper to recursively get all files in a directory
function getFilesRecursively(dir, filterFn) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(filePath, filterFn));
    } else if (!filterFn || filterFn(filePath)) {
      results.push(filePath);
    }
  }
  return results;
}

// Clean up previously generated Obsidian files in content directory
function cleanupGeneratedNotes() {
  // On Vercel, the Obsidian vault is not present in the repo.
  // Skipping cleanup prevents deleting committed content files that have no
  // vault source to be regenerated from, which would wipe all blogs in production.
  if (process.env.VERCEL === "1") {
    console.log("⏭️ Vercel build detected. Skipping content cleanup to preserve committed blog files.");
    return;
  }

  console.log("🧼 Cleaning up old generated Obsidian notes from /content...");
  const files = fs.readdirSync(CONTENT_DIR);
  for (const file of files) {
    const ext = path.extname(file);
    if (ext === ".md" || ext === ".mdx") {
      const filePath = path.join(CONTENT_DIR, file);
      try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const { data } = matter(fileContent);
        if (data.isObsidian === true) {
          fs.unlinkSync(filePath);
          console.log(`   Deleted generated note: ${file}`);
        }
      } catch (err) {
        // Skip files that fail parsing or don't exist
      }
    }
  }
}

// Parse Obsidian-style Callouts (> [!NOTE]) into standard HTML Blockquotes
function parseCallouts(content) {
  const lines = content.split("\n");
  let inCallout = false;
  let calloutLines = [];
  let calloutType = "";
  const result = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^\s*>\s*\[!([a-zA-Z]+)\](.*)/);

    if (match) {
      if (inCallout) {
        // Close current callout
        result.push(
          `<blockquote data-callout="${calloutType}" data-callout-type="${calloutType}">\n\n${calloutLines.join(
            "\n"
          )}\n\n</blockquote>`
        );
        calloutLines = [];
      }
      inCallout = true;
      calloutType = match[1].toUpperCase();
      const title = match[2].trim();
      if (title) {
        calloutLines.push(`**${title}**\n`);
      }
    } else if (inCallout && line.match(/^\s*>\s?(.*)/)) {
      // Strip leading whitespace and "> "
      const cleanLine = line.match(/^\s*>\s?(.*)/)[1];
      calloutLines.push(cleanLine);
    } else {
      if (inCallout) {
        result.push(
          `<blockquote data-callout="${calloutType}" data-callout-type="${calloutType}">\n\n${calloutLines.join(
            "\n"
          )}\n\n</blockquote>`
        );
        inCallout = false;
        calloutLines = [];
      }
      result.push(line);
    }
  }

  if (inCallout) {
    result.push(
      `<blockquote data-callout="${calloutType}" data-callout-type="${calloutType}">\n\n${calloutLines.join(
        "\n"
      )}\n\n</blockquote>`
    );
  }

  return result.join("\n");
}

// Main sync function
async function syncObsidianVault() {
  console.log("🔄 Starting Obsidian Vault Synchronization...");
  
  // 1. Clear previous notes to ensure no orphan/deleted notes remain
  cleanupGeneratedNotes();

  // 2. Fetch all md/mdx files in vault recursively
  const obsidianFiles = getFilesRecursively(OBSIDIAN_DIR, (p) => {
    const ext = path.extname(p);
    return ext === ".md" || ext === ".mdx";
  });

  console.log(`🔎 Found ${obsidianFiles.length} note files in vault.`);

  let processedCount = 0;

  for (const filePath of obsidianFiles) {
    try {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const { content, data } = matter(fileContent);

      // Check if note is flagged for publication
      if (data.publish === true || data.publish === "true") {
        console.log(`📄 Processing published note: ${path.basename(filePath)}`);

        // Generate clean slug from filename or frontmatter override
        let slug = data.slug || path.basename(filePath, path.extname(filePath));
        slug = slug
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-");

        let processedContent = content;

        // A. Translate Obsidian images FIRST (to avoid matching inside wiki-links regex)
        // Matches: ![[image.png]] or ![[image.png|width]] -> ![image.png](/obsidian/image.png)
        processedContent = processedContent.replace(
          /!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
          (_, imgName) => {
            const imageName = imgName.trim();
            
            // Search for this image in the Obsidian directory recursively
            const matchingImages = getFilesRecursively(OBSIDIAN_DIR, (p) => {
              return path.basename(p) === imageName;
            });

            if (matchingImages.length > 0) {
              const srcPath = matchingImages[0];
              const destPath = path.join(PUBLIC_OBSIDIAN_DIR, imageName);
              fs.copyFileSync(srcPath, destPath);
              console.log(`   🎨 Copied asset: ${imageName} to public/obsidian/`);
            } else {
              console.warn(`   ⚠️ Warning: Referenced image "${imageName}" not found in vault.`);
            }

            return `![${imageName}](/obsidian/${imageName})`;
          }
        );

        // B. Translate wiki-links: [[Note Title]] -> [Note Title](/blog/slug)
        // Matches: [[Note Title]] or [[Note Title|Custom Label]]
        processedContent = processedContent.replace(
          /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
          (_, noteTitle, customLabel) => {
            const cleanTitle = noteTitle.trim();
            const label = customLabel ? customLabel.trim() : cleanTitle;
            const linkSlug = cleanTitle
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, "")
              .replace(/\s+/g, "-");
            return `[${label}](/blog/${linkSlug})`;
          }
        );

        // C. Process Callouts
        processedContent = parseCallouts(processedContent);

        // D. Construct new frontmatter with isObsidian tag
        const newMetadata = {
          ...data,
          isObsidian: true,
          publishedAt: data.publishedAt || new Date().toISOString().split("T")[0],
          summary: data.summary || "No summary provided.",
          title: data.title || path.basename(filePath, path.extname(filePath)),
        };

        const finalFileContent = matter.stringify(
          `<!-- GENERATED FROM OBSIDIAN VAULT. DO NOT EDIT DIRECTLY. -->\n${processedContent}`,
          newMetadata
        );

        // Write processed file as an .mdx file to the /content folder
        const outFilePath = path.join(CONTENT_DIR, `${slug}.mdx`);
        fs.writeFileSync(outFilePath, finalFileContent, "utf-8");
        processedCount++;
        console.log(`   ✅ Wrote published note to: content/${slug}.mdx`);

        // Queue publishing to Dev.to and Medium if not already done (only in local environments)
        if (process.env.VERCEL !== "1" && (!data.devto_url || !data.medium_url)) {
          queue.addJob("blogPublish", {
            filePath,
            title: newMetadata.title,
            tags: newMetadata.tags || [],
          });
        }
      }
    } catch (err) {
      console.error(`🔴 Error processing note "${filePath}":`, err);
    }
  }

  console.log(`✨ Obsidian Synchronization complete. ${processedCount} published note(s) processed.`);

  // Run the queue worker to process any newly added or pending jobs (only in local environments)
  if (process.env.VERCEL !== "1") {
    try {
      await queue.runWorker();
    } catch (queueErr) {
      console.error("🔴 Error running queue worker:", queueErr);
    }
  } else {
    console.log("⏭️ Vercel build environment detected. Skipping event queue worker execution.");
  }
}

// Check for --watch flag
const args = process.argv.slice(2);
const isWatchMode = args.includes("--watch");

if (isWatchMode) {
  console.log(`👀 Watching /obsidian for changes...`);
  await syncObsidianVault();

  // Watch recursively
  let timeoutId = null;
  fs.watch(OBSIDIAN_DIR, { recursive: true }, (eventType, filename) => {
    if (filename) {
      // Ignore queue file to prevent infinite loops
      if (filename.endsWith('.queue.json')) return;

      // Debounce to avoid double-runs on multiple rapid file modifications
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        console.log(`📝 Change detected in ${filename}. Re-syncing...`);
        await syncObsidianVault();
      }, 300);
    }
  });
} else {
  await syncObsidianVault();
}
