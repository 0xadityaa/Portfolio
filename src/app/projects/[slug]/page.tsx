import { CopyCodeHandler } from "@/components/copy-code-handler";
import { markdownToHTML } from "@/data/blog";
import { TechList } from "@/components/tech-list";
import { DATA } from "@/data/resume";
import { fetchProjectReadme } from "@/lib/markdown-pages";
import { findProject, projectSlug } from "@/lib/projects";
import { pageAlternates } from "@/lib/seo";
import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

interface ProjectDetailParams {
  params: Promise<{
    slug: string;
  }>;
}

export function generateStaticParams() {
  return DATA.projects.map((project) => ({ slug: projectSlug(project) }));
}

export async function generateMetadata(props: ProjectDetailParams): Promise<Metadata> {
  const { slug } = await props.params;
  const project = findProject(slug);

  return {
    title: project?.title ?? slug,
    description: project?.description ?? `Notes and documentation for ${slug}.`,
    alternates: pageAlternates(`/projects/${slug}`),
    ...(project?.image ? { openGraph: { images: [{ url: project.image }] } } : {}),
  };
}

export default async function ProjectDetailPage(props: ProjectDetailParams) {
  const { slug } = await props.params;
  const project = findProject(slug);
  const rawReadme = await fetchProjectReadme(slug);

  if (!rawReadme && !project) {
    notFound();
  }

  // The page already shows the project title, so drop the README's own,
  // and the emoji READMEs like to put in front of headings.
  const readme = rawReadme
    ?.replace(/^\s*#\s[^\n]*\n/, "")
    .replace(/^(#{1,6}\s+)(?:\p{Extended_Pictographic}\uFE0F?\s*)+/gmu, "$1");
  const compiledContent = readme ? await markdownToHTML(readme) : null;
  const sourceUrl = project?.href ?? `https://github.com/0xadityaa/${slug}`;
  // Lead with the thing a visitor can try, then the code, then the write-up.
  const linkOrder = ["Website", "Source", "Devlog"];
  const links = [...(project?.links ?? [{ type: "Source", href: sourceUrl }])].sort(
    (a, b) => linkOrder.indexOf(a.type) - linkOrder.indexOf(b.type)
  );

  return (
    <main className="mx-auto max-w-2xl">
      <header className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h1 className="font-serif text-4xl font-medium leading-[1.12] tracking-tight text-foreground sm:text-[2.75rem]">
            {project?.title ?? slug}
          </h1>
          {project?.dates && <span className="meta">{project.dates}</span>}
        </div>
        {project?.description && (
          <p className="max-w-[58ch] text-muted-foreground">
            {project.description}
          </p>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          {links.map((link, index) => (
            <a
              key={link.href + link.type}
              href={link.href}
              target={link.href.startsWith("/") ? undefined : "_blank"}
              rel="noopener noreferrer"
              className={
                index === 0
                  ? "inline-flex items-center gap-1 rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 active:scale-[0.97]"
                  : "inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-card active:scale-[0.97]"
              }
            >
              {link.type}
              <ArrowUpRight className="size-3.5" aria-hidden />
            </a>
          ))}
        </div>
      </header>

      {project?.image && (
        <div className="relative mt-8 aspect-[16/10] overflow-hidden rounded-lg border border-border bg-card">
          <Image
            src={project.image}
            alt={`Screenshot of ${project.title}`}
            fill
            priority
            sizes="(min-width: 672px) 624px, 100vw"
            className="object-cover object-top"
          />
        </div>
      )}

      {project && project.technologies.length > 0 && (
        <dl className="mt-8 grid grid-cols-1 gap-y-0.5 border-y border-border py-4 sm:grid-cols-[7rem_1fr] sm:gap-x-6">
          <dt className="meta sm:pt-2.5">Built with</dt>
          <dd>
            <TechList items={project.technologies} />
          </dd>
        </dl>
      )}

      {compiledContent ? (
        <>
          <article
            className="prose max-w-none pt-8 leading-relaxed prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg"
            dangerouslySetInnerHTML={{ __html: compiledContent }}
          />
          <CopyCodeHandler />
        </>
      ) : (
        <p className="pt-8 text-muted-foreground">
          The README for this project is not available right now. The{" "}
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="link">
            repository
          </a>{" "}
          has the full story.
        </p>
      )}
    </main>
  );
}
