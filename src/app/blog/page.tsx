import BlurFade from "@/components/magicui/blur-fade";
import { getAllBlogPosts } from "@/data/blog";
import { BrutalistBlogList } from "@/components/brutalist-blog-list";

export const metadata = {
  title: "Blog",
  description: "My thoughts on software development, systems, and digital gardening.",
};

const BLUR_FADE_DELAY = 0.04;

export default async function BlogPage() {
  const posts = await getAllBlogPosts();

  return (
    <section className="space-y-8 mb-24">
      <BlurFade delay={BLUR_FADE_DELAY}>
        <div className="flex flex-col space-y-4 w-full mb-6">
          <h1 className="font-bold text-3xl sm:text-4xl tracking-tight text-foreground">
            Second Brain
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-[650px] leading-relaxed">
            A digital garden where I document code patterns, systems, frameworks, and architecture.
            No fluff, just raw engineering guides and technical notes.
          </p>
        </div>
      </BlurFade>

      <BrutalistBlogList initialPosts={posts} />
    </section>
  );
}
