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

  return p.toString();
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
