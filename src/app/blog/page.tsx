import { BlogList } from "@/components/blog-list";
import { FadeIn } from "@/components/fade-in";
import { getAllBlogPosts } from "@/data/blog";
import { pageAlternates } from "@/lib/seo";

export const metadata = {
  title: "Blog",
  description:
    "Notes on building software and the systems behind it: full-stack engineering, architecture, and AI.",
  alternates: pageAlternates("/blog"),
};

// Re-rendered hourly so scheduled posts appear when their publish time passes.
export const revalidate = 3600;

export default async function BlogPage() {
  // The list is a client component: send it metadata only, not every post body.
  const posts = (await getAllBlogPosts()).map(({ slug, metadata }) => ({ slug, metadata }));

  return (
    <main className="space-y-10">
      <FadeIn>
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Blog
          </h1>
          <p className="max-w-[58ch] text-lg leading-relaxed text-muted-foreground">
            I write about building software and the systems behind it. Full-stack
            engineering, architecture, and anything else that sparks my curiosity.
          </p>
        </header>
      </FadeIn>

      <FadeIn delay={0.08}>
        <BlogList initialPosts={posts} />
      </FadeIn>
    </main>
  );
}
