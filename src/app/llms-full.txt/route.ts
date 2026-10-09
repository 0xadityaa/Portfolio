import { markdownPagePaths, renderMarkdownPage } from "@/lib/markdown-pages";

export const revalidate = 600;

/** The whole site as one Markdown document. */
export async function GET() {
  const pages = await Promise.all(
    (await markdownPagePaths()).map((path) => renderMarkdownPage(path))
  );

  return new Response(pages.filter(Boolean).join("\n\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
