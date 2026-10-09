import fs from "fs";
import matter from "gray-matter";
import path from "path";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { calculateReadingTime } from "@/lib/blog-utils";

/** Posts are plain Markdown files: content/blog/<slug>.md. See docs/blog/workflow.md. */
const POSTS_DIR = path.join(process.cwd(), "content", "blog");

export type BlogPostMetadata = {
  title: string;
  /** YYYY-MM-DD (goes live at 12:00 UTC that day) or a full ISO timestamp. */
  publishedAt: string;
  summary: string;
  /** YYYY-MM-DD of the last substantive edit. Shown on the post. */
  updated?: string;
  image?: string;
  tags?: string[];
  /** Merged but not approved for release. Hidden in production. */
  draft?: boolean;
  readingTime?: number;
  devto_url?: string;
  medium_url?: string;
};

export type BlogPost = {
  slug: string;
  metadata: BlogPostMetadata;
  /** Rendered HTML. */
  source: string;
  /** The Markdown body as written, without frontmatter. */
  markdown: string;
};

export function publishTime(publishedAt: string) {
  return new Date(String(publishedAt).includes("T") ? publishedAt : `${publishedAt}T12:00:00Z`);
}

/**
 * Production shows a post once it is approved (not a draft) and its publish
 * time has passed. Local dev and Vercel preview deployments show everything,
 * so a post can be reviewed on its pull request before it is live.
 */
function isVisible(metadata: BlogPostMetadata) {
  if (process.env.VERCEL_ENV !== "production") return true;
  return !metadata.draft && publishTime(metadata.publishedAt).getTime() <= Date.now();
}

function getSlugs() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => path.extname(file) === ".md")
    .map((file) => path.basename(file, ".md"));
}

function readPost(slug: string) {
  // Slugs come from the URL, so keep lookups inside the posts directory.
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const filePath = path.join(POSTS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const { content, data } = matter(fs.readFileSync(filePath, "utf-8"));
  // An unquoted YAML date arrives as a Date. Posts use strings everywhere.
  if (data.publishedAt instanceof Date) data.publishedAt = data.publishedAt.toISOString();
  if (data.updated instanceof Date) data.updated = data.updated.toISOString().slice(0, 10);
  const metadata = {
    ...data,
    readingTime: calculateReadingTime(content),
  } as BlogPostMetadata;

  return isVisible(metadata) ? { slug, metadata, markdown: content.trim() } : null;
}

export async function markdownToHTML(markdown: string) {
  const p = await unified()
    .use(remarkParse)
    // Tables, strikethrough, and autolinks, as on GitHub and dev.to.
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypePrettyCode, {
      theme: "github-dark",
      keepBackground: true,
      onVisitLine(node: any) {
        if (node.children.length === 0) {
          node.children = [{ type: "text", value: " " }];
        }
      },
      onVisitHighlightedLine(node: any) {
        node.properties.className.push("highlighted");
      },
      onVisitHighlightedWord(node: any) {
        node.properties.className = ["word"];
      },
    } as any)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

  // Add copy buttons to code blocks, and keep images from blocking render.
  let index = 0;
  return p
    .toString()
    .replace(/<img /g, '<img loading="lazy" decoding="async" ')
    .replace(
      /<pre([^>]*)><code([^>]*)>([\s\S]*?)<\/code><\/pre>/g,
      (_match, preAttrs, codeAttrs, content) => {
        const id = `code-${index++}`;
        return `
        <div class="relative group code-block-wrapper">
          <button
            type="button" aria-label="Copy code" class="copy-btn absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-200 bg-background/80 backdrop-blur-sm border border-border hover:bg-background rounded-md p-2 text-muted-foreground hover:text-foreground"
            data-copy-target="${id}"
          >
            <svg class="copy-icon w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
            </svg>
            <svg class="check-icon w-4 h-4 hidden" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
          </button>
          <pre${preAttrs} id="${id}"><code${codeAttrs}>${content}</code></pre>
        </div>
      `;
      }
    );
}

export async function getPost(slug: string): Promise<BlogPost | null> {
  const post = readPost(slug);
  if (!post) return null;
  return { ...post, source: await markdownToHTML(post.markdown) };
}

/** Visible posts, newest first. Metadata and Markdown only: nothing is rendered. */
export async function getAllBlogPosts() {
  return getSlugs()
    .map(readPost)
    .filter((post) => post !== null)
    .sort(
      (a, b) =>
        publishTime(b.metadata.publishedAt).getTime() -
        publishTime(a.metadata.publishedAt).getTime()
    );
}
