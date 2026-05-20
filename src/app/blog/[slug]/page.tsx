import { getPost } from "@/data/blog";
import { DATA } from "@/data/resume";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

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
          className="inline-flex brutalist-button hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
        >
          <ChevronLeftIcon className="size-4 mr-2" />
          <span>Back to Second Brain</span>
        </Link>
      </div>

      {/* Article Specification Box */}
      <div className="border-2 border-black dark:border-white p-6 bg-card text-card-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] font-mono">
        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-3 select-none">
          [ METADATA :: SPECIFICATIONS ]
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-muted-foreground uppercase">Title:</span>{" "}
            <span className="font-bold uppercase tracking-tight">{post.metadata.title}</span>
          </div>
          <div>
            <span className="text-muted-foreground uppercase">Published:</span>{" "}
            <span className="font-bold">
              <Suspense fallback={<span className="opacity-50">...</span>}>
                {formatDate(post.metadata.publishedAt)}
              </Suspense>
            </span>
          </div>
          {post.metadata.tags && post.metadata.tags.length > 0 && (
            <div className="md:col-span-2">
              <span className="text-muted-foreground uppercase">Categories:</span>{" "}
              <div className="inline-flex flex-wrap gap-1.5 ml-2 align-middle">
                {post.metadata.tags.map((tag: string) => (
                  <Badge
                    key={tag}
                    className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded-none border border-black/20 dark:border-white/20 bg-muted text-foreground transition-none"
                    variant="secondary"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Article Title Header */}
      <h1 className="font-extrabold text-3xl sm:text-5xl uppercase tracking-tight leading-none pt-4">
        {post.metadata.title}
      </h1>

      {/* Article Body Content */}
      <article
        className="prose dark:prose-invert text-base sm:text-lg leading-relaxed max-w-none pt-6 pb-12
                   prose-headings:font-extrabold prose-headings:uppercase prose-headings:tracking-tight prose-headings:font-mono
                   prose-h2:text-2xl prose-h2:border-b-2 prose-h2:border-black dark:prose-h2:border-white prose-h2:pb-1.5
                   prose-h3:text-xl
                   prose-p:font-sans prose-p:font-medium prose-p:text-muted-foreground prose-p:leading-relaxed dark:prose-p:text-muted-foreground
                   prose-strong:text-foreground prose-strong:font-extrabold
                   prose-a:underline prose-a:font-extrabold prose-a:text-foreground hover:prose-a:bg-foreground hover:prose-a:text-background prose-a:transition-colors
                   prose-li:font-sans prose-li:font-medium prose-li:text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: post.source }}
      />

      {/* Monochromatic Premium Signature Layout */}
      {DATA.name && (
        <div className="border-t-2 border-dashed border-black/20 dark:border-white/20 pt-8 flex flex-col items-center justify-center space-y-4">
          <div className="border-2 border-black dark:border-white p-3 bg-card shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            <Image
              unoptimized
              src="/signature.gif"
              alt="signature gif"
              width={240}
              height={120}
              className="opacity-95 invert dark:invert-0"
            />
          </div>
          <span className="font-mono text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
            [ END OF FILE :: SIGN-OFF ]
          </span>
        </div>
      )}
    </section>
  );
}
