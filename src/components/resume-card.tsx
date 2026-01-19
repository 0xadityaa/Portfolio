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
      className="block cursor-pointer"
    >
      <Card className="flex" suppressHydrationWarning>
        <div className="flex-none w-[100px] flex justify-center" suppressHydrationWarning>
          <Avatar className="border size-12 m-auto bg-muted-background dark:bg-foreground">
            <AvatarImage
              src={logoUrl}
              alt={altText}
              className="object-contain"
            />
            <AvatarFallback>{altText[0]}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-grow ml-4 items-center flex-col group" suppressHydrationWarning>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-x-2 text-base" suppressHydrationWarning>
              <h3 className="inline-flex items-center justify-center font-semibold leading-none text-xs sm:text-sm">
                {title}
                {badges && (
                  <span className="inline-flex gap-x-1">
                    {badges.map((badge, index) => (
                      <Badge
                        variant="secondary"
                        className="align-middle text-xs"
                        key={index}
                      >
                        {badge}
                      </Badge>
                    ))}
                  </span>
                )}
                <ChevronRightIcon
                  className="size-4 translate-x-0 transform opacity-0 transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:opacity-100"
                />
              </h3>
              <div className="text-xs sm:text-sm tabular-nums text-muted-foreground text-right" suppressHydrationWarning>
                {period}
              </div>
            </div>
            {subtitle && <div className="font-sans text-xs" suppressHydrationWarning>{subtitle}</div>}
            {description && (
              <div className="mt-2 text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
                {description}
              </div>
            )}
          </CardHeader>
        </div>
      </Card>
    </Link>
  );
};
