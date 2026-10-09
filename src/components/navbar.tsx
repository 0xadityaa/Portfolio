"use client";

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

const item =
  "flex size-10 items-center justify-center rounded-full transition-colors active:scale-95";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center pb-[env(safe-area-inset-bottom)]">
      <nav
        aria-label="Main"
        className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-background/80 p-1.5 shadow-[0_8px_30px_rgb(0_0_0/0.5),inset_0_1px_0_rgb(255_255_255/0.04)] backdrop-blur-lg"
      >
        {DATA.navbar.map((route) => {
          const isActive =
            pathname === route.href ||
            (route.href !== "/" && pathname.startsWith(route.href));
          return (
            <Tooltip key={route.href}>
              <TooltipTrigger asChild>
                <Link
                  href={route.href}
                  aria-label={route.label}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    item,
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <route.icon className="size-4" aria-hidden />
                </Link>
              </TooltipTrigger>
              <TooltipContent className="rounded-md border-none bg-foreground px-2.5 py-1 text-xs text-background">
                {route.label}
              </TooltipContent>
            </Tooltip>
          );
        })}

        <Separator orientation="vertical" className="mx-1 h-6 w-px bg-border" />

        {Object.entries(DATA.contact.social)
          .filter(([, social]) => social.navbar)
          .map(([name, social]) => (
            <Tooltip key={name}>
              <TooltipTrigger asChild>
                <a
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  className={cn(
                    item,
                    "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <social.icon className="size-4" aria-hidden />
                </a>
              </TooltipTrigger>
              <TooltipContent className="rounded-md border-none bg-foreground px-2.5 py-1 text-xs text-background">
                {name}
              </TooltipContent>
            </Tooltip>
          ))}
      </nav>
    </div>
  );
}
