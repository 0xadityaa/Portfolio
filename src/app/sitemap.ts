import { getAllBlogPosts } from "@/data/blog";
import { DATA } from "@/data/resume";
import { projectSlug } from "@/lib/projects";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllBlogPosts();

  return [
    { url: DATA.url, changeFrequency: "monthly", priority: 1 },
    { url: `${DATA.url}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${DATA.url}/projects`, changeFrequency: "monthly", priority: 0.8 },
    ...posts.map((post) => ({
      url: `${DATA.url}/blog/${post.slug}`,
      lastModified: new Date(post.metadata.publishedAt),
      priority: 0.7,
    })),
    ...DATA.projects.map((project) => ({
      url: `${DATA.url}/projects/${projectSlug(project)}`,
      priority: 0.5,
    })),
  ];
}
