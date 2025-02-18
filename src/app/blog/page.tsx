import BlurFade from "@/components/magicui/blur-fade";
import { getBlogPosts } from "@/data/blog";
import Link from "next/link";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";

export const metadata = {
  title: "Blog",
  description: "My thoughts on software development, life, and more.",
};

const BLUR_FADE_DELAY = 0.04;

export default async function BlogPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const pageParams = await Number(searchParams.page);
  const currentPage = pageParams || 1;
  const { posts, pagination } = await getBlogPosts(currentPage);

  return (
    <section>
      <BlurFade delay={BLUR_FADE_DELAY}>
        <h2 className="font-semibold text-4xl mb-8 tracking-tighter">
          🧠 Adi&apos;s Second Brain
        </h2>
        <div className="flex flex-col-reverse sm:flex-row items-center mb-8 gap-4">
          <h3 className="sm:mr-4 text-base sm:text-lg lg:text-xl text-pretty">
            Welcome to my blog! Peep into my journey as a full-stack developer,
            where I explore scalable systems, elegant software architectures,
            and the cutting-edge technologies that ignite my boundless
            curiosity.
          </h3>
          <Image
            src="/blog-banner.png"
            alt="blog-cover"
            width={200}
            height={250}
            className="w-[150px] h-[200px] sm:w-[200px] sm:h-[250px] rounded-lg object-cover"
          />
        </div>
        <h2 className="font-semibold text-3xl mb-8 tracking-tighter">
          Latest Posts
        </h2>
      </BlurFade>

      {posts
        .sort(
          (a, b) =>
            new Date(b.metadata.publishedAt).getTime() -
            new Date(a.metadata.publishedAt).getTime()
        )
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
                {post.metadata.tags && post.metadata.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {post.metadata.tags.map((tag: string) => (
                      <Badge key={tag} className="text-xs" variant="secondary">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </Link>
            <Separator className="my-4" />
          </BlurFade>
        ))}

      {/* Pagination Controls */}
      <div className="flex flex-col items-center gap-4 mt-8 mb-20">
        <div className="flex justify-center gap-2">
          {pagination.current > 1 && (
            <Link href={`/blog?page=${pagination.current - 1}`}>
              <Button variant="outline" size="default">
                <ChevronLeftIcon className="mr-1" /> Previous
              </Button>
            </Link>
          )}

          {pagination.current < pagination.pages && (
            <Link href={`/blog?page=${pagination.current + 1}`}>
              <Button variant="outline" size="default">
                Next <ChevronRightIcon className="ml-1" />
              </Button>
            </Link>
          )}
        </div>

        {/* Page indicator */}
        <p className="text-sm text-muted-foreground">
          Page {pagination.current} of {pagination.pages}
        </p>
      </div>
    </section>
  );
}
