"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronRight as ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

interface ResumeCardProps {
  logoUrl: string;
  altText: string;
  title: string;
  subtitle?: string;
  href?: string;
  badges?: readonly string[];
  period: string;
  description?: string;
}

export const ResumeCard = ({
  logoUrl,
  altText,
  title,
  subtitle,
  href,
  badges,
  period,
  description,
}: ResumeCardProps) => {
  return (
    <Link href={href || "#"} className="block cursor-pointer group">
      <div className="flex gap-4 p-4 -mx-4 rounded-xl transition-colors hover:bg-muted/50" suppressHydrationWarning>
        <div className="flex-none mt-1" suppressHydrationWarning>
          <Avatar className="size-10 sm:size-12 rounded-full border border-border bg-white shadow-sm">
            <AvatarImage src={logoUrl} alt={altText} className="object-contain p-1.5" />
            <AvatarFallback className="rounded-full text-xs bg-muted text-muted-foreground font-medium">{altText[0]}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-grow flex flex-col" suppressHydrationWarning>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-y-1 mb-1 text-sm sm:text-base" suppressHydrationWarning>
            <h3 className="inline-flex items-center gap-2 font-semibold leading-none text-foreground">
              {title}
              {badges && (
                <span className="inline-flex gap-x-1">
                  {badges.map((badge, index) => (
                    <Badge variant="secondary" className="text-[10px] rounded-md px-1.5 py-0.5" key={index}>
                      {badge}
                    </Badge>
                  ))}
                </span>
              )}
              <ChevronRightIcon className="size-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-muted-foreground" />
            </h3>
            <div className="text-xs sm:text-sm tabular-nums text-muted-foreground sm:text-right" suppressHydrationWarning>
              {period}
            </div>
          </div>
          {subtitle && <div className="text-sm font-medium text-muted-foreground" suppressHydrationWarning>{subtitle}</div>}
          {description && (
            <div className="mt-2 text-sm text-foreground/80 leading-relaxed" suppressHydrationWarning>
              {description}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
