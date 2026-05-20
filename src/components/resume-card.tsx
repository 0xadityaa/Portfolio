"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronRightIcon } from "lucide-react";
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
    <Link
      href={href || "#"}
      className="block cursor-pointer group"
    >
      <Card className="flex border-2 border-black dark:border-white rounded-none bg-card text-card-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:active:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all duration-100 ease-out" suppressHydrationWarning>
        <div className="flex-none w-16 sm:w-20 border-r-2 border-black dark:border-white flex items-center justify-center bg-muted p-2" suppressHydrationWarning>
          <Avatar className="size-10 sm:size-12 rounded-none border border-black/10 dark:border-white/10 bg-white">
            <AvatarImage
              src={logoUrl}
              alt={altText}
              className="object-contain p-1"
            />
            <AvatarFallback className="rounded-none font-mono text-xs">{altText[0]}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-grow items-center flex-col" suppressHydrationWarning>
          <CardHeader className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-y-1 text-base font-mono" suppressHydrationWarning>
              <h3 className="inline-flex items-center gap-2 font-bold text-sm sm:text-base leading-none">
                {title}
                {badges && (
                  <span className="inline-flex gap-x-1">
                    {badges.map((badge, index) => (
                      <Badge
                        variant="secondary"
                        className="align-middle border border-black dark:border-white text-[10px] rounded-none px-1.5 py-0"
                        key={index}
                      >
                        {badge}
                      </Badge>
                    ))}
                  </span>
                )}
                <ChevronRightIcon
                  className="size-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-150"
                />
              </h3>
              <div className="text-xs sm:text-sm tabular-nums text-muted-foreground sm:text-right font-medium" suppressHydrationWarning>
                {period}
              </div>
            </div>
            {subtitle && <div className="font-mono text-xs font-semibold mt-0.5 text-muted-foreground" suppressHydrationWarning>{subtitle}</div>}
            {description && (
              <div className="mt-3 text-xs sm:text-sm text-foreground/80 leading-relaxed font-sans" suppressHydrationWarning>
                {description}
              </div>
            )}
          </CardHeader>
        </div>
      </Card>
    </Link>
  );
};

