import { BlogList } from "@/components/blog-list";
import { FadeIn } from "@/components/fade-in";
import { getAllBlogPosts } from "@/data/blog";
import { pageAlternates } from "@/lib/seo";
import Link from "next/link";

export const metadata = {
  title: "Blog",
  description:
    "Notes on building software and the systems behind it: full-stack engineering, architecture, and AI.",
  alternates: pageAlternates("/blog"),
};

// Re-rendered every 10 minutes so scheduled posts appear when their publish time passes.
export const revalidate = 600;

export default async function BlogPage() {
  // The list is a client component: send it metadata only, not every post body.
  const posts = (await getAllBlogPosts()).map(({ slug, metadata }) => ({ slug, metadata }));

  return (
    <main className="mx-auto max-w-3xl space-y-10">
      <FadeIn>
        <header className="space-y-3">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-brand">Writing</p>
          <h1 className="font-serif text-5xl font-medium tracking-tight text-foreground">
            Blog
          </h1>
          <p className="max-w-[58ch] text-muted-foreground">
            I write about building software and the systems behind it. Full-stack
            engineering, architecture, and anything else that sparks my curiosity.{" "}
            <Link href="/rss.xml" prefetch={false} className="link">
              Subscribe by RSS
            </Link>
            .
          </p>
        </header>
      </FadeIn>

      <FadeIn delay={0.08}>
        <BlogList initialPosts={posts} />
      </FadeIn>
    </main>
  );
}
