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
    <section id="blog" className="mb-24 space-y-8">
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
          <span>Back to Blog</span>
        </Link>
      </div>

      {/* Article Specification Box */}
      <div className="p-6 bg-muted/30 rounded-xl border border-border">
        <div className="flex flex-col gap-3 text-sm">
          <div>
            <span className="text-muted-foreground font-medium mr-2">Title:</span>
            <span className="font-semibold text-foreground">{post.metadata.title}</span>
          </div>
          {post.metadata.tags && post.metadata.tags.length > 0 && (
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="text-muted-foreground font-medium mr-1">Categories:</span>
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
          <div>
            <span className="text-muted-foreground font-medium mr-2">Published:</span>
            <span className="font-semibold text-foreground">
              <Suspense fallback={<span className="opacity-50">...</span>}>
                {formatDate(post.metadata.publishedAt)}
              </Suspense>
            </span>
          </div>
        </div>
      </div>

      {/* Article Title Header */}
      <h1 className="font-bold text-3xl sm:text-5xl tracking-tight leading-tight text-foreground">
        {post.metadata.title}
      </h1>

      {/* Article Body Content */}
      <article
        className="prose prose-neutral dark:prose-invert text-base leading-relaxed max-w-none pt-6 pb-12
                   prose-headings:font-semibold prose-headings:tracking-tight
                   prose-h2:text-2xl prose-h3:text-xl
                   prose-a:minimal-link prose-a:font-medium prose-a:no-underline
                   prose-pre:border prose-pre:border-border"
        dangerouslySetInnerHTML={{ __html: post.source }}
      />

      {/* Monochromatic Premium Signature Layout */}
      {DATA.name && (
        <div className="border-t border-border pt-12 flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-transparent">
            <Image
              unoptimized
              src="/signature.gif"
              alt="signature gif"
              width={200}
              height={100}
              className="opacity-80 invert dark:invert-0 hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      )}
    </section>
  );
}
