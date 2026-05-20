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
        <div className="flex flex-col space-y-4 w-full mb-2 font-mono">
          <div className="flex items-center gap-2 select-none text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-widest border border-dashed border-black/20 dark:border-white/20 px-3 py-1 w-max">
            <span>[ CONTEXT: SECOND_BRAIN ]</span>
          </div>
          <h1 className="font-extrabold text-4xl sm:text-6xl tracking-tight uppercase">
            Second Brain
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-[650px] leading-relaxed font-sans font-medium">
            A digital garden where I document code patterns, systems, frameworks, and architecture.
            No fluff, just raw engineering guides and technical notes.
          </p>
        </div>
      </BlurFade>

      <BrutalistBlogList initialPosts={posts} />
    </section>
  );
}
