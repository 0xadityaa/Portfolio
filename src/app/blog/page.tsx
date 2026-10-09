import { BlogList } from "@/components/blog-list";
import BlurFade from "@/components/magicui/blur-fade";
import { getAllBlogPosts } from "@/data/blog";

export const metadata = {
  title: "Blog",
  description:
    "Notes on building software and the systems behind it: full-stack engineering, architecture, and AI.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const posts = await getAllBlogPosts();

  return (
    <main className="space-y-10">
      <BlurFade>
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Blog
          </h1>
          <p className="max-w-[58ch] text-lg leading-relaxed text-muted-foreground">
            I write about building software and the systems behind it. Full-stack
            engineering, architecture, and anything else that sparks my curiosity.
          </p>
        </header>
      </BlurFade>

      <BlurFade delay={0.08}>
        <BlogList initialPosts={posts} />
      </BlurFade>
    </main>
  );
}
