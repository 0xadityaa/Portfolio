import fs from "fs";
import matter from "gray-matter";
import path from "path";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { calculateReadingTime } from "@/lib/blog-utils";

type Metadata = {
  title: string;
  publishedAt: string;
  summary: string;
  image?: string;
  tags?: string[];
  readingTime?: number;
};

function getMDXFiles(dir: string) {
  return fs.readdirSync(dir).filter((file) => path.extname(file) === ".mdx");
}

export async function markdownToHTML(markdown: string) {
  const p = await unified()
    .use(remarkParse)
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

  // Add copy buttons to code blocks
  let html = p.toString();
  html = html.replace(
    /<pre([^>]*)><code([^>]*)>([\s\S]*?)<\/code><\/pre>/g,
    (match, preAttrs, codeAttrs, content) => {
      const id = Math.random().toString(36).substr(2, 9);
      return `
        <div class="relative group code-block-wrapper">
          <button 
            class="copy-btn absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background/90 rounded-md p-2 text-xs font-medium"
            data-copy-target="${id}"
          >
            <svg class="copy-icon w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
            </svg>
            <svg class="check-icon w-4 h-4 hidden text-green-600" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
          </button>
          <pre${preAttrs} id="${id}"><code${codeAttrs}>${content}</code></pre>
        </div>
      `;
    }
  );

  return html;
}

export async function getPost(slug: string): Promise<{ source: string; metadata: Metadata; slug: string }> {
  const filePath = path.join("content", `${slug}.mdx`);
  let source = fs.readFileSync(filePath, "utf-8");
  const { content: rawContent, data: metadata } = matter(source);
  const content = await markdownToHTML(rawContent);
  const readingTime = calculateReadingTime(rawContent);
  return {
    source: content,
    metadata: {
      ...metadata,
      readingTime,
    } as Metadata,
    slug,
  };
}

export function getPostMetadata(slug: string): { metadata: Metadata; slug: string } {
  const filePath = path.join("content", `${slug}.mdx`);
  let source = fs.readFileSync(filePath, "utf-8");
  const { content: rawContent, data: metadata } = matter(source);
  const readingTime = calculateReadingTime(rawContent);
  return {
    metadata: {
      ...metadata,
      readingTime,
    } as Metadata,
    slug,
  };
}

async function getAllPosts(dir: string, page: number = 1, perPage: number = 4) {
  let mdxFiles = getMDXFiles(dir);

  // Add this sort before pagination
  mdxFiles.sort((a, b) => {
    const aDate = matter(fs.readFileSync(path.join(dir, a), "utf-8")).data
      .publishedAt;
    const bDate = matter(fs.readFileSync(path.join(dir, b), "utf-8")).data
      .publishedAt;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;

  const paginatedFiles = mdxFiles.slice(startIndex, endIndex);

  const posts = paginatedFiles.map((file) => {
    let slug = path.basename(file, path.extname(file));
    let { metadata } = getPostMetadata(slug);
    return {
      metadata,
      slug,
      source: "", // Providing empty source to maintain structural compatibility if needed, though not used in listing
    };
  });

  return {
    posts,
    pagination: {
      total: mdxFiles.length,
      pages: Math.ceil(mdxFiles.length / perPage),
      current: page,
      perPage,
    },
  };
}

export async function getBlogPosts(page: number = 1) {
  return getAllPosts(path.join(process.cwd(), "content"), page);
}
