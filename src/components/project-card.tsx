"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Star, GitFork, GitCommit, CircleDot } from "lucide-react";

interface Props {
  title: string;
  href?: string;
  description: string;
  dates: string;
  tags: readonly string[];
  link?: string;
  image?: string;
  links?: readonly {
    icon: React.ReactNode;
    type: string;
    href: string;
  }[];
  stargazerCount?: number;
  forkCount?: number;
  issuesCount?: number;
  commitsCount?: number;
  className?: string;
}

export function ProjectCard({
  title,
  href,
  description,
  dates,
  tags,
  link,
  image,
  links,
  stargazerCount,
  forkCount,
  issuesCount,
  commitsCount,
  className,
}: Props) {
  const projectSlug = href ? href.split("/").pop() : "";
  const isGitHubUrl = href ? href.startsWith("https://github.com") : false;
  const detailHref = isGitHubUrl ? `/projects/${projectSlug}` : (href || "#");

  return (
    <Card
      className={cn(
        "flex flex-col sm:flex-row overflow-hidden border border-transparent hover:border-border rounded-xl bg-transparent hover:bg-muted/30 transition-all duration-300 ease-out group/card",
        className
      )}
    >
      {/* Content wrapper */}
      <div className="flex flex-col flex-grow min-w-0">
        {/* Card Header */}
        <CardHeader className="p-4 pb-2 flex-grow shrink-0">
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-x-2">
              <div className="flex flex-col gap-1.5">
                <Link href={detailHref} className="minimal-link font-semibold text-base sm:text-lg text-foreground group-hover/card:underline decoration-foreground/30 underline-offset-4 decoration-1">
                  {title}
                </Link>
                {/* GitHub Stats if present */}
                {(stargazerCount !== undefined || forkCount !== undefined || commitsCount !== undefined || issuesCount !== undefined) && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium mt-1">
                    {stargazerCount !== undefined && stargazerCount > 0 && (
                      <span className="flex items-center gap-1.5" title="Stars">
                        <Star className="size-3.5 text-amber-500 fill-amber-500" />
                        <span>{stargazerCount}</span>
                      </span>
                    )}
                    {forkCount !== undefined && forkCount > 0 && (
                      <span className="flex items-center gap-1.5" title="Forks">
                        <GitFork className="size-3.5" />
                        <span>{forkCount}</span>
                      </span>
                    )}
                    {commitsCount !== undefined && commitsCount > 0 && (
                      <span className="flex items-center gap-1.5" title="Commits">
                        <GitCommit className="size-3.5" />
                        <span>{commitsCount}</span>
                      </span>
                    )}
                    {issuesCount !== undefined && issuesCount > 0 && (
                      <span className="flex items-center gap-1.5" title="Open Issues">
                        <CircleDot className="size-3.5 text-green-500" />
                        <span>{issuesCount}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
              <time className="text-xs text-muted-foreground font-medium shrink-0 mt-1">{dates}</time>
            </div>
            
            <p className="prose prose-sm max-w-full text-pretty leading-relaxed text-muted-foreground dark:prose-invert">
              {description}
            </p>
          </div>
        </CardHeader>

        {/* Card Tags / Tech Badges */}
        <CardContent className="p-4 pt-0 pb-2 flex-grow">
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {tags.map((tag) => (
                <Badge
                  className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-muted text-muted-foreground hover:bg-muted"
                  variant="secondary"
                  key={tag}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>

        {/* Card Footer Links */}
        <CardFooter className="p-4 pt-0 shrink-0">
          {links && links.length > 0 && (
            <div className="flex flex-row flex-wrap items-center gap-2 mt-auto">
              {links.map((linkItem, idx) => (
                <Link href={linkItem.href} key={idx} target="_blank" className="inline-flex">
                  <Badge
                    key={idx}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-none cursor-pointer"
                  >
                    {linkItem.icon}
                    <span>{linkItem.type}</span>
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardFooter>
      </div>
    </Card>
  );
}

