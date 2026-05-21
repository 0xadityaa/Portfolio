import { getPost } from "@/data/blog";
import { DATA } from "@/data/resume";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft as ChevronLeftIcon } from "lucide-react";

interface BlogParams {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata(props: BlogParams): Promise<Metadata | undefined> {
  const params = await props.params;
  let post = await getPost(params.slug);

  if (!post) return undefined;

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
    <section id="blog" className="mb-24 space-y-6">
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

      {/* Navigation and Back button */}
      <div>
        <Link
          href="/blog"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ChevronLeftIcon className="size-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          <span>Back to blog</span>
        </Link>
      </div>

      {/* Article Spec: Title + Tags + Date — compact, no extra padding */}
      <div className="border-b border-border pb-6 space-y-2">
        <h1 className="font-bold text-2xl sm:text-4xl tracking-tight leading-tight text-foreground">
          {post.metadata.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <Suspense fallback={<span className="opacity-50">...</span>}>
            <span>{formatDate(post.metadata.publishedAt)}</span>
          </Suspense>
          {post.metadata.tags && post.metadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.metadata.tags.map((tag: string) => (
                <Badge
                  key={tag}
                  className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-muted text-muted-foreground hover:bg-muted"
                  variant="secondary"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Article Body Content — clean markdown prose */}
      <article
        className="prose prose-neutral dark:prose-invert max-w-none
                   prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground
                   prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg
                   prose-p:text-foreground/90 prose-p:leading-7
                   prose-a:text-foreground prose-a:underline prose-a:underline-offset-4 prose-a:decoration-border hover:prose-a:decoration-foreground
                   prose-strong:text-foreground prose-strong:font-semibold
                   prose-code:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                   prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:text-sm
                   prose-blockquote:border-l-border prose-blockquote:text-muted-foreground
                   prose-hr:border-border
                   prose-ul:text-foreground/90 prose-ol:text-foreground/90
                   prose-li:marker:text-muted-foreground
                   prose-img:rounded-lg prose-img:border prose-img:border-border"
        dangerouslySetInnerHTML={{ __html: post.source }}
      />

      {/* Signature */}
      {DATA.name && (
        <div className="border-t border-border pt-8 flex flex-col items-center justify-center">
          <Image
            unoptimized
            src="/signature.gif"
            alt="signature gif"
            width={200}
            height={100}
            className="opacity-80 invert dark:invert-0 hover:opacity-100 transition-opacity"
          />
        </div>
      )}
    </section>
  );
}
