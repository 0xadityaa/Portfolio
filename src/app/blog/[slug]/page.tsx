import { CopyCodeHandler } from "@/components/copy-code-handler";
import { PostCover } from "@/components/post-cover";
import { getAllBlogPosts, getPost } from "@/data/blog";
import { DATA } from "@/data/resume";
import { pageAlternates } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

interface BlogParams {
  params: Promise<{
    slug: string;
  }>;
}

// Scheduled posts are rendered on first request once their publish time passes.
export const revalidate = 600;

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(props: BlogParams): Promise<Metadata | undefined> {
  const params = await props.params;
  const post = await getPost(params.slug);

  if (!post) return undefined;

  const { title, publishedAt: publishedTime, summary: description, image, tags } = post.metadata;

  return {
    title,
    description,
    keywords: tags,
    alternates: pageAlternates(`/blog/${post.slug}`),
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime,
      authors: [DATA.name],
      url: `/blog/${post.slug}`,
      // Falls back to the generated opengraph-image for this route.
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function BlogPost(props: BlogParams) {
  const params = await props.params;
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  // Posts are sorted newest first, so "next" is the more recent one.
  const posts = await getAllBlogPosts();
  const index = posts.findIndex((p) => p.slug === post.slug);
  const newer = index > 0 ? posts[index - 1] : null;
  const older = index >= 0 && index < posts.length - 1 ? posts[index + 1] : null;

  return (
    <main className="mx-auto max-w-2xl">
      <PostCover
        seed={post.slug}
        cols={34}
        rows={7}
        className="mb-10 aspect-[34/7] w-full rounded-2xl border border-border"
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.metadata.title,
            datePublished: post.metadata.publishedAt,
            dateModified: post.metadata.updated ?? post.metadata.publishedAt,
            description: post.metadata.summary,
            image: post.metadata.image
              ? `${DATA.url}${post.metadata.image}`
              : `${DATA.url}/blog/${post.slug}/opengraph-image`,
            url: `${DATA.url}/blog/${post.slug}`,
            author: {
              "@type": "Person",
              name: DATA.name,
              url: DATA.url,
            },
          }),
        }}
      />

      <header className="space-y-4 border-b border-border pb-8">
        <h1 className="font-serif text-4xl font-medium leading-[1.12] tracking-tight text-foreground sm:text-[2.75rem]">
          {post.metadata.title}
        </h1>
        <div className="meta flex flex-wrap items-center gap-x-4 gap-y-1">
          <time dateTime={post.metadata.publishedAt}>
            {formatDate(post.metadata.publishedAt)}
          </time>
          {post.metadata.updated && (
            <span>
              Updated <time dateTime={post.metadata.updated}>{formatDate(post.metadata.updated)}</time>
            </span>
          )}
          {post.metadata.readingTime && <span>{post.metadata.readingTime} min read</span>}
          {post.metadata.tags?.map((tag: string) => <span key={tag}>#{tag}</span>)}
        </div>
      </header>

      <article
        className="prose max-w-none pt-8 leading-[1.75] prose-h2:text-2xl prose-h3:text-xl"
        dangerouslySetInnerHTML={{ __html: post.source }}
      />
      <CopyCodeHandler />

      <footer className="mt-16 space-y-3 border-t border-border pt-8 text-sm leading-relaxed text-muted-foreground">
        <p>
          That&apos;s a wrap. I&apos;m{" "}
          <Link href="/" className="link">
            {DATA.name}
          </Link>
          , a full stack engineer in Toronto. New posts show up in the{" "}
          <Link href="/rss.xml" prefetch={false} className="link">
            RSS feed
          </Link>
          .
        </p>
        <p>
          Caught a mistake?{" "}
          <a
            href={`${DATA.repo}/blob/main/content/blog/${post.slug}.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="link"
          >
            This post is just a Markdown file on GitHub
          </a>
          , so go ahead and call me out.
        </p>
      </footer>

      {(newer || older) && (
        <nav
          aria-label="More posts"
          className="mt-8 grid grid-cols-1 gap-4 border-t border-border pt-8 sm:grid-cols-2"
        >
          {older ? (
            <Link href={`/blog/${older.slug}`} className="group rounded-lg">
              <span className="meta flex items-center gap-1.5">
                <ArrowLeft className="size-3" aria-hidden />
                Older
              </span>
              <span className="mt-1 block font-medium text-foreground underline decoration-transparent decoration-1 underline-offset-4 transition-colors group-hover:decoration-foreground/60">
                {older.metadata.title}
              </span>
            </Link>
          ) : (
            <span className="hidden sm:block" />
          )}
          {newer && (
            <Link href={`/blog/${newer.slug}`} className="group rounded-lg sm:text-right">
              <span className="meta flex items-center gap-1.5 sm:justify-end">
                Newer
                <ArrowRight className="size-3" aria-hidden />
              </span>
              <span className="mt-1 block font-medium text-foreground underline decoration-transparent decoration-1 underline-offset-4 transition-colors group-hover:decoration-foreground/60">
                {newer.metadata.title}
              </span>
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}
