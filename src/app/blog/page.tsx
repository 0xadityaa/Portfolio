import BlurFade from "@/components/magicui/blur-fade";
import { getBlogPosts } from "@/data/blog";
import Link from "next/link";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Blog",
  description: "My thoughts on software development, life, and more.",
};

const BLUR_FADE_DELAY = 0.04;

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <section>
      <BlurFade delay={BLUR_FADE_DELAY}>
        <h2 className="font-semibold text-4xl mb-8 tracking-tighter">
          🧠 Adi&apos;s Second Brain
        </h2>
        <div className="flex items-center mb-8">
          <h3 className="mr-4 lg:text-lg text-sm text-pretty">
            Welcome to my blog! Peep into my journey as a full-stack developer,
            where I explore scalable systems, elegant software architectures,
            and the cutting-edge technologies that ignite my boundless
            curiosity.
          </h3>
          <Image
            src="/blog-banner.jpeg"
            alt="blog-cover"
            width={150}
            height={250}
          />
        </div>
        <h2 className="font-semibold text-3xl mb-8 tracking-tighter">
        Latest Posts
      </h2>
      </BlurFade>
      {posts
        .sort((a, b) => {
          if (
            new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)
          ) {
            return -1;
          }
          return 1;
        })
        .map((post, id) => (
          <BlurFade delay={BLUR_FADE_DELAY * 2 + id * 0.05} key={post.slug}>
            <Link
              className="flex flex-col space-y-1 mb-4"
              href={`/blog/${post.slug}`}
            >
              <div className="w-full flex flex-col">
                <p className="tracking-tight text-2xl">{post.metadata.title}</p>
                <p className="h-6 text-xs text-muted-foreground">
                  {post.metadata.publishedAt}
                </p>
              </div>
            </Link>
            <Separator className="my-4" />
          </BlurFade>
        ))}
    </section>
  );
}
