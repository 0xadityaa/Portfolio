"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { buttonVariants } from "@/components/ui/button";
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
    <div className="fixed bottom-0 left-0 right-0 z-50 w-full max-w-2xl mx-auto px-6 pb-6 pointer-events-none">
      <div className="pointer-events-auto border-2 border-black dark:border-white bg-background text-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] flex items-center justify-between p-1 select-none font-mono">
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
                      "h-9 px-3 text-xs uppercase font-bold tracking-wider select-none flex items-center gap-1.5 border border-transparent transition-all",
                      isActive
                        ? "border-black dark:border-white bg-foreground text-background"
                        : "hover:border-black/20 dark:hover:border-white/20"
                    )}
                  >
                    <item.icon className="size-3.5" />
                    <span className="hidden xs:inline">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent className="border border-black dark:border-white bg-card text-card-foreground font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-none">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Separator */}
        <Separator orientation="vertical" className="h-6 w-[2px] bg-black dark:bg-white" />

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
                    className="size-9 border border-transparent flex items-center justify-center transition-all hover:border-black/20 dark:hover:border-white/20"
                  >
                    <social.icon className="size-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent className="border border-black dark:border-white bg-card text-card-foreground font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-none">
                  <p>{name}</p>
                </TooltipContent>
              </Tooltip>
            ))}

          <Separator orientation="vertical" className="h-6 w-[2px] bg-black dark:bg-white mx-1" />

          {/* Theme Mode Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="size-9 border border-transparent flex items-center justify-center hover:border-black/20 dark:hover:border-white/20 cursor-pointer">
                <ModeToggle />
              </div>
            </TooltipTrigger>
            <TooltipContent className="border border-black dark:border-white bg-card text-card-foreground font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-none">
              <p>Theme</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
