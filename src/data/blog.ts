import fs from "fs";
import matter from "gray-matter";
import path from "path";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

type Metadata = {
  title: string;
  publishedAt: string;
  summary: string;
  image?: string;
};

function getMDXFiles(dir: string) {
  return fs.readdirSync(dir).filter((file) => path.extname(file) === ".mdx");
}

export async function markdownToHTML(markdown: string) {
  const p = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypePrettyCode, {
      theme: 'github-dark',  // Use a single theme instead of light/dark
      keepBackground: true,
      onVisitLine(node: any) {
        if (node.children.length === 0) {
          node.children = [{ type: 'text', value: ' ' }];
        }
      },
      onVisitHighlightedLine(node: any) {
        node.properties.className.push('highlighted');
      },
      onVisitHighlightedWord(node: any) {
        node.properties.className = ['word'];
      }
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
    metadata,
    slug,
  };
}

async function getAllPosts(dir: string, page: number = 1, perPage: number = 4) {
  let mdxFiles = getMDXFiles(dir);

  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;

  const paginatedFiles = mdxFiles.slice(startIndex, endIndex);

  const posts = await Promise.all(
    paginatedFiles.map(async (file) => {
      let slug = path.basename(file, path.extname(file));
      let { metadata, source } = await getPost(slug);
      return {
        metadata,
        slug,
        source,
      };
    })
  );

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