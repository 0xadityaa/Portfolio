import { getAllBlogPosts, getPost } from "@/data/blog";
import { ogSize, renderOgImage } from "@/lib/og";
import { formatDate } from "@/lib/utils";

export const alt = "Blog post";
export const size = ogSize;
export const contentType = "image/png";

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  return renderOgImage({
    title: post?.metadata.title ?? "Blog",
    kicker: post ? formatDate(post.metadata.publishedAt) : undefined,
  });
}
