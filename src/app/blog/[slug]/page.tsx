import { getPost } from "@/data/blog";
import { DATA } from "@/data/resume";
import { formatDate } from "@/lib/utils";
import { formatReadingTime } from "@/lib/blog-utils";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ClockIcon, ArrowLeftIcon, CalendarIcon } from "@radix-ui/react-icons";
import BlurFade from "@/components/magicui/blur-fade";
import { CopyCodeHandler } from "@/components/copy-code-handler";

interface BlogParams {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata(props: BlogParams): Promise<Metadata | undefined> {
  const params = await props.params;
  let post = await getPost(params.slug);

  let {
    title,
    publishedAt: publishedTime,
    summary: description,
    image,
  } = post.metadata;
  let ogImage = image ? `${DATA.url}${image}` : `${DATA.url}/og?title=${title}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime,
      url: `${DATA.url}/blog/${post.slug}`,
      images: [
        {
          url: ogImage,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function BlogPost(props: BlogParams) {
  const params = await props.params;
  let post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.metadata.title,
            datePublished: post.metadata.publishedAt,
            dateModified: post.metadata.publishedAt,
            description: post.metadata.summary,
            image: post.metadata.image
              ? `${DATA.url}${post.metadata.image}`
              : `${DATA.url}/og?title=${post.metadata.title}`,
            url: `${DATA.url}/blog/${post.slug}`,
            author: {
              "@type": "Person",
              name: DATA.name,
            },
          }),
        }}
      />
      
      {/* Header Section */}
      <section className="relative py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-6">
          <BlurFade delay={0.1}>
            {/* Back Button */}
            <Link href="/blog">
              <Button variant="ghost" className="mb-8 -ml-4 hover:bg-muted/50">
                <ArrowLeftIcon className="mr-2 size-4" />
                Back to Blog
              </Button>
            </Link>

            {/* Title */}
            <h1 className="font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tighter mb-6 leading-tight">
              {post.metadata.title}
            </h1>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 mb-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <CalendarIcon className="size-4" />
                <Suspense fallback={<span className="h-5 w-20 bg-muted animate-pulse rounded" />}>
                  <time className="text-sm font-medium">
                    {formatDate(post.metadata.publishedAt)}
                  </time>
                </Suspense>
              </div>
              
              {post.metadata.readingTime && (
                <>
                  <span className="text-muted-foreground/60">•</span>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="size-4" />
                    <span className="text-sm font-medium">
                      {formatReadingTime(post.metadata.readingTime)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Summary */}
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-3xl">
              {post.metadata.summary}
            </p>

            {/* Tags */}
            {post.metadata.tags && post.metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-12">
                {post.metadata.tags.map((tag: string) => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="px-3 py-1.5 text-xs font-medium hover:bg-secondary/80 transition-colors"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </BlurFade>
        </div>
      </section>

      {/* Article Content */}
      <section className="pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <BlurFade delay={0.2}>
            <article className="prose prose-lg dark:prose-invert max-w-none
              prose-headings:font-bold prose-headings:tracking-tight
              prose-h1:text-4xl prose-h1:mb-8 prose-h1:mt-12
              prose-h2:text-3xl prose-h2:mb-6 prose-h2:mt-10 prose-h2:border-b prose-h2:border-border prose-h2:pb-2
              prose-h3:text-2xl prose-h3:mb-4 prose-h3:mt-8
              prose-h4:text-xl prose-h4:mb-3 prose-h4:mt-6
              prose-p:leading-relaxed prose-p:mb-6
              prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
              prose-strong:font-semibold prose-strong:text-foreground
              prose-code:bg-muted prose-code:px-2 prose-code:py-1 prose-code:rounded-md prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-muted prose-pre:border prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto
              prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-muted/50 prose-blockquote:pl-6 prose-blockquote:py-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
              prose-ul:mb-6 prose-ol:mb-6
              prose-li:mb-2 prose-li:leading-relaxed
              prose-img:rounded-lg prose-img:shadow-lg prose-img:border
              prose-hr:border-border prose-hr:my-12
              prose-table:border prose-table:rounded-lg prose-table:overflow-hidden
              prose-th:bg-muted prose-th:font-semibold prose-th:text-left prose-th:px-4 prose-th:py-3
              prose-td:px-4 prose-td:py-3 prose-td:border-t prose-td:border-border"
              dangerouslySetInnerHTML={{ __html: post.source }}
            />
            
            {/* Copy Code Handler */}
            <CopyCodeHandler />
          </BlurFade>
        </div>
      </section>
    </div>
  );
}
