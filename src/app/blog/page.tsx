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
          <h1 className="font-bold text-3xl sm:text-5xl tracking-tight text-foreground">
            My Engineering Insights
          </h1>
          <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed max-w-[600px] leading-relaxed">
            I write about building software and the systems behind it. Exploring full-stack engineering, architecture, and anything else that sparks my curiosity.
          </p>
        </div>
      </BlurFade>

      <BrutalistBlogList initialPosts={posts} />
    </section>
  );
}
