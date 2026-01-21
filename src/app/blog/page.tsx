import BlurFade from "@/components/magicui/blur-fade";
import { Meteors } from "@/components/ui/meteors";
import { getBlogPosts } from "@/data/blog";
import { formatReadingTime } from "@/lib/blog-utils";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon } from "@radix-ui/react-icons";

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
    <section id="blog">
      <div className="space-y-12 w-full py-12">
        <BlurFade delay={BLUR_FADE_DELAY}>
          <div className="flex flex-col items-center justify-center space-y-4 text-center w-full mb-8">
            <Image
              src="/images/illustrations/book-illustration.png"
              alt="blog-cover"
              width={120}
              height={120}
              className="object-contain hover:rotate-12 transition-transform duration-300"
            />
            <h2 className="font-bold text-3xl sm:text-5xl tracking-tighter">
              My Engineering Insights
            </h2>
            <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed max-w-[600px] mx-auto">
              I write about building software and the systems behind it. Exploring full-stack engineering, architecture, and anything else that sparks my curiosity.
            </p>
          </div>
        </BlurFade>

        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
          {posts.map((post, id) => (
            <BlurFade delay={BLUR_FADE_DELAY * 2 + id * 0.05} key={post.slug}>
              <Link href={`/blog/${post.slug}`}>
                <div className="group relative h-[300px] hover:h-auto min-h-[300px] w-full overflow-hidden rounded-lg border transition-all duration-500 ease-in-out hover:shadow-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                  {/* Meteors Background */}
                  <Meteors number={15} />
                  
                  {/* Dark Overlay for readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-[1]" />

                  {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white transition-all duration-500 ease-in-out group-hover:-translate-y-3 z-10">
                    {/* Title and Date */}
                    <h3 className="font-bold text-2xl mb-1 text-white group-hover:text-blue-400 dark:group-hover:text-blue-300 transition-colors duration-500 ease-in-out">
                      {post.metadata.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-white/70 mb-2">
                      <time>{post.metadata.publishedAt}</time>
                      {post.metadata.readingTime && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <ClockIcon className="size-3.5" />
                            <span>{formatReadingTime(post.metadata.readingTime)}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Summary */}
                    <p className="text-sm text-white/90 mb-3 line-clamp-2 group-hover:line-clamp-none transition-all duration-500 ease-in-out">
                      {post.metadata.summary}
                    </p>

                    {/* Tags - Consistent with Project Cards */}
                    {post.metadata.tags && post.metadata.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.metadata.tags.slice(0, 4).map((tag: string) => (
                          <div
                            key={tag}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/30 bg-white/20 backdrop-blur-md"
                          >
                            <span className="text-xs font-medium text-white">#{tag}</span>
                          </div>
                        ))}
                        {post.metadata.tags.length > 4 && (
                          <div className="flex items-center px-3 py-1.5 rounded-full border border-white/30 bg-white/20 backdrop-blur-md">
                            <span className="text-xs font-medium text-white">+{post.metadata.tags.length - 4}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </BlurFade>
          ))}
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col items-center gap-4 mt-8">
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
      </div>
    </section>
  );
}
