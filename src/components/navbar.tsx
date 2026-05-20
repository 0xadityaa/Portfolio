"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DATA } from "@/data/resume";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div className="pointer-events-auto rounded-full border border-border bg-background/70 backdrop-blur-lg shadow-sm flex items-center p-1.5 gap-1.5">
        {/* Navigation Routes */}
        <div className="flex items-center gap-1">
          {DATA.navbar.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center justify-center size-10 rounded-full transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon className="size-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent className="bg-foreground text-background border-none rounded-md px-3 py-1.5 text-xs">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        <Separator orientation="vertical" className="h-6 w-[1px] bg-border mx-1" />

        {/* Social Links */}
        <div className="flex items-center gap-1">
          {Object.entries(DATA.contact.social)
            .filter(([_, social]) => social.navbar)
            .map(([name, social]) => (
              <Tooltip key={name}>
                <TooltipTrigger asChild>
                  <Link
                    href={social.url}
                    target="_blank"
                    className="flex items-center justify-center size-10 rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <social.icon className="size-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent className="bg-foreground text-background border-none rounded-md px-3 py-1.5 text-xs">
                  <p>{name}</p>
                </TooltipContent>
              </Tooltip>
            ))}

          <Separator orientation="vertical" className="h-6 w-[1px] bg-border mx-1" />

          {/* Theme Mode Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <ModeToggle />
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-foreground text-background border-none rounded-md px-3 py-1.5 text-xs">
              <p>Theme</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
