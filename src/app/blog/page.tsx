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
          <h1 className="font-serif text-5xl font-medium tracking-tight text-foreground">
            Blog
          </h1>
          <p className="max-w-[58ch] text-muted-foreground">
            Me thinking out loud about building software: full-stack stuff,
            architecture, AI, and whatever rabbit hole I fell into this week.{" "}
            <Link href="/rss.xml" prefetch={false} className="link">
              Grab the RSS feed
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
