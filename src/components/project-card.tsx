"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

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
  className,
}: Props) {
  const projectSlug = href ? href.split("/").pop() : "";
  const isGitHubUrl = href ? href.startsWith("https://github.com") : false;
  const detailHref = isGitHubUrl ? `/projects/${projectSlug}` : (href || "#");

  return (
    <Card
      className={cn(
        "flex flex-col overflow-hidden border border-transparent hover:border-border rounded-xl bg-transparent hover:bg-muted/30 transition-all duration-300 ease-out h-full group/card",
        className
      )}
    >
      {/* Project Cover Image */}
      {image && (
        <Link href={detailHref} className="block cursor-pointer overflow-hidden border-b border-border relative aspect-video bg-muted shrink-0 group">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />
        </Link>
      )}

      {/* Card Header */}
      <CardHeader className="p-4 flex-grow shrink-0">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-x-2">
            <Link href={detailHref} className="minimal-link font-semibold text-base sm:text-lg text-foreground">
              {title}
            </Link>
            <time className="text-xs text-muted-foreground font-medium shrink-0 mt-1">{dates}</time>
          </div>
          
          <p className="prose prose-sm max-w-full text-pretty leading-relaxed text-muted-foreground dark:prose-invert">
            {description}
          </p>
        </div>
      </CardHeader>

      {/* Card Tags / Tech Badges */}
      <CardContent className="p-4 pt-0 flex-grow">
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
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-none"
                >
                  {linkItem.icon}
                  <span>{linkItem.type}</span>
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
