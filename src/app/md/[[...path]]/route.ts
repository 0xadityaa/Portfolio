import { DATA } from "@/data/resume";
import { markdownPagePaths, renderMarkdownPage } from "@/lib/markdown-pages";

// Reached through the rewrites in next.config.mjs, never linked directly.
export const revalidate = 600;

export async function generateStaticParams() {
  return (await markdownPagePaths()).map((path) => ({ path }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await params;
  const markdown = await renderMarkdownPage(path);

  if (markdown === null) {
    return new Response("# Not found\n\nSee /llms.txt for every page on this site.\n", {
      status: 404,
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }

  const canonical = `${DATA.url}/${path.filter((s) => s !== "index").join("/")}`;
  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // The HTML page is the one search engines should index.
      Link: `<${canonical.replace(/\/$/, "") || DATA.url}>; rel="canonical"`,
      "X-Robots-Tag": "noindex",
    },
  });
}
