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
        "flex flex-col overflow-hidden border-2 border-black dark:border-white rounded-none bg-card text-card-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[5px_5px_0px_0px_rgba(255,255,255,1)] active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:active:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] transition-all duration-100 ease-out h-full",
        className
      )}
    >
      {/* Project Cover Image */}
      {image && (
        <Link href={detailHref} className="block cursor-pointer overflow-hidden border-b-2 border-black dark:border-white relative aspect-video bg-muted shrink-0 group">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover object-center group-hover:scale-105 transition-transform duration-200"
            unoptimized
          />
        </Link>
      )}

      {/* Card Header */}
      <CardHeader className="p-4 flex-grow shrink-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-x-2 font-mono">
            <Link href={detailHref} className="hover:underline">
              <CardTitle className="text-base sm:text-lg font-bold tracking-tight uppercase cursor-pointer">{title}</CardTitle>
            </Link>
            <time className="text-[10px] text-muted-foreground font-semibold">{dates}</time>
          </div>
          
          <p className="prose max-w-full text-pretty font-sans text-xs sm:text-sm leading-relaxed text-muted-foreground dark:prose-invert">
            {description}
          </p>
        </div>
      </CardHeader>

      {/* Card Tags / Tech Badges */}
      <CardContent className="p-4 pt-0 flex-grow">
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge
                className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-none border border-black/20 dark:border-white/20 bg-muted hover:bg-muted text-foreground transition-none select-none"
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
      <CardFooter className="p-4 pt-0 shrink-0 border-t-2 border-neutral-100 dark:border-neutral-900 mt-2 bg-muted/30">
        {links && links.length > 0 && (
          <div className="flex flex-row flex-wrap items-center gap-2 mt-4">
            {links.map((linkItem, idx) => (
              <Link href={linkItem.href} key={idx} target="_blank" className="inline-flex">
                <Badge
                  key={idx}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-extrabold uppercase rounded-none border-2 border-black dark:border-white bg-card hover:bg-foreground hover:text-background text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:active:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] transition-all duration-75 select-none"
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
