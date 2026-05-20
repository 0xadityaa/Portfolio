import React from "react";
import Link from "next/link";
import { Star, GitFork, ExternalLink } from "lucide-react";
import { GitHubPinnedRepo } from "@/lib/github";
import { Icons } from "@/components/icons";

export function GitHubRepoCard({ repo }: { repo: GitHubPinnedRepo }) {
  return (
    <div className="flex flex-col justify-between h-full p-4 sm:p-5 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <Link
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-base text-foreground hover:underline decoration-primary decoration-2 underline-offset-4"
          >
            {repo.name}
          </Link>
          <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
            {repo.stargazerCount > 0 && (
              <div className="flex items-center gap-1">
                <Star className="size-3" />
                <span>{repo.stargazerCount}</span>
              </div>
            )}
            {repo.forkCount > 0 && (
              <div className="flex items-center gap-1">
                <GitFork className="size-3" />
                <span>{repo.forkCount}</span>
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {repo.description}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {repo.primaryLanguage && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: repo.primaryLanguage.color }}
              />
              {repo.primaryLanguage.name}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {repo.homepageUrl && (
            <Link
              href={repo.homepageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="size-4" />
            </Link>
          )}
          <Link
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icons.github className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
