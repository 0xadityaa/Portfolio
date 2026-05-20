import fs from "fs";
import matter from "gray-matter";
import path from "path";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

export type BlogPostMetadata = {
  title: string;
  publishedAt: string;
  summary: string;
  image?: string;
  tags?: string[];
  isObsidian?: boolean;
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

export async function getPost(slug: string) {
  const filePath = path.join("content", `${slug}.mdx`);
  let source = fs.readFileSync(filePath, "utf-8");
  const { content: rawContent, data: metadata } = matter(source);
  const content = await markdownToHTML(rawContent);
  return {
    source: content,
    metadata: metadata as BlogPostMetadata,
    slug,
  };
}

export function getPostMetadata(slug: string) {
  const filePath = path.join("content", `${slug}.mdx`);
  let source = fs.readFileSync(filePath, "utf-8");
  const { data: metadata } = matter(source);
  return {
    metadata: metadata as BlogPostMetadata,
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

export async function getAllBlogPosts() {
  const dir = path.join(process.cwd(), "content");
  if (!fs.existsSync(dir)) return [];
  
  const mdxFiles = fs.readdirSync(dir).filter((file) => path.extname(file) === ".mdx" || path.extname(file) === ".md");

  const posts = mdxFiles.map((file) => {
    const slug = path.basename(file, path.extname(file));
    const { metadata } = getPostMetadata(slug);
    return {
      metadata,
      slug,
    };
  });

  // Sort by date descending
  return posts.sort((a, b) => {
    const dateA = new Date(a.metadata.publishedAt || "").getTime();
    const dateB = new Date(b.metadata.publishedAt || "").getTime();
    return dateB - dateA;
  });
}

