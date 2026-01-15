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
        <div className="flex flex-col items-center justify-center space-y-4 text-center w-full mb-8">
          <Image
            src="/cool-graphics/book-illustration.png"
            alt="blog-cover"
            width={120}
            height={120}
            className="object-contain hover:rotate-12 transition-transform duration-300"
          />
          <h2 className="font-bold text-3xl sm:text-5xl tracking-tighter">
            Adi&apos;s Second Brain
          </h2>
          <h3 className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed max-w-[600px]">
            I write about building software and the systems behind it. Exploring full-stack engineering, architecture, and anything else that sparks my curiosity.
          </h3>
        </div>
        <h2 className="font-semibold text-3xl mb-4 tracking-tighter">
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
                <p className="tracking-tight text-2xl font-medium">{post.metadata.title}</p>
                <p className="h-6 text-sm text-muted-foreground mt-1">
                  {post.metadata.publishedAt}
                </p>
                {post.metadata.tags && post.metadata.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {post.metadata.tags.map((tag: string) => (
                      <Badge key={tag} className="text-xs font-normal" variant="secondary">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </Link>
            <Separator className="my-6" />
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
