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
  dates?: string;
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
  pushedAt?: string;
  primaryLanguage?: {
    name: string;
    color: string;
  } | null;
  className?: string;
}

function getRelativeTime(dateString?: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Updated just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `Updated ${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Updated ${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `Updated ${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `Updated on ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  
  return `Updated on ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

// Pseudo-random seed generator for sparkline
function mulberry32(a: number) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

export function ProjectCard({
  title,
  href,
  description,
  tags,
  stargazerCount,
  forkCount,
  pushedAt,
  primaryLanguage,
  className,
}: Props) {
  const projectSlug = href ? href.split("/").pop() : "";
  const isGitHubUrl = href ? href.startsWith("https://github.com") : false;
  const linkHref = href || "#";

  // Generate a deterministic sparkline path based on the title length
  const rng = mulberry32(title.length * 100);
  const points = [];
  let currentY = 10;
  for (let i = 0; i < 15; i++) {
    const x = (i / 14) * 100;
    currentY = Math.max(2, Math.min(18, currentY + (rng() - 0.5) * 8));
    points.push(`${x},${currentY}`);
  }
  const sparklinePath = `M ${points.join(" L ")}`;

  return (
    <div className={cn("flex flex-col overflow-hidden py-6 border-b border-border/50 bg-transparent transition-all duration-300 ease-out group/card", className)}>
      <div className="flex items-start justify-between gap-4">
        {/* Left Side: Title, Description, Tags */}
        <div className="flex flex-col flex-grow min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Link href={linkHref} target="_blank" className="text-foreground font-semibold text-xl hover:underline decoration-foreground/30 underline-offset-4">
              {title}
            </Link>
            <span className="border border-[#30363d] text-[#8b949e] text-xs px-2 py-0.5 rounded-full font-medium">
              Public
            </span>
          </div>
          
          <p className="text-[#8b949e] text-sm mb-4 line-clamp-2">
            {description}
          </p>

          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {Array.from(new Set(tags)).map((tag) => (
                <Badge
                  className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground hover:bg-muted/80 border-transparent transition-colors shadow-none"
                  variant="secondary"
                  key={tag}
                >
                  {tag.toLowerCase()}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#8b949e]">
            {primaryLanguage && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: primaryLanguage.color }}></span>
                <span>{primaryLanguage.name}</span>
              </div>
            )}
            
            {stargazerCount !== undefined && stargazerCount > 0 && (
              <a href={`${href}/stargazers`} target="_blank" className="flex items-center gap-1 hover:text-[#c9d1d9] transition-colors">
                <Star className="w-4 h-4" />
                <span>{stargazerCount}</span>
              </a>
            )}
            
            {forkCount !== undefined && forkCount > 0 && (
              <a href={`${href}/network/members`} target="_blank" className="flex items-center gap-1 hover:text-[#c9d1d9] transition-colors">
                <GitFork className="w-4 h-4" />
                <span>{forkCount}</span>
              </a>
            )}

            {pushedAt && (
              <span suppressHydrationWarning>{getRelativeTime(pushedAt)}</span>
            )}
          </div>
        </div>

        {/* Right Side: Activity Graph */}
        <div className="hidden sm:block shrink-0 pt-2">
          <svg width="155" height="30" className="opacity-80">
            <path
              d={sparklinePath}
              fill="none"
              stroke="#238636"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

