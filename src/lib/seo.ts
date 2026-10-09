import { DATA } from "@/data/resume";
import type { Metadata } from "next";

/** The Markdown twin of a page: "/" -> "/index.md", "/blog/x" -> "/blog/x.md". */
export function markdownPath(pathname: string) {
  return pathname === "/" ? "/index.md" : `${pathname}.md`;
}

/**
 * Canonical URL plus the machine-readable alternates every page advertises.
 * Next replaces `alternates` wholesale per route, so each page calls this.
 */
export function pageAlternates(pathname: string): Metadata["alternates"] {
  return {
    canonical: pathname,
    types: {
      "application/rss+xml": [{ url: "/rss.xml", title: `${DATA.name}'s blog` }],
      "text/markdown": markdownPath(pathname),
    },
  };
}
