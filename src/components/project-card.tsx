"use client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { SkillIcon } from "@/components/skill-icon";

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

  return (
    <div
      className={cn(
        "group relative h-[400px] w-full overflow-hidden rounded-lg border transition-all duration-300 hover:shadow-2xl",
        className
      )}
    >
      {/* Full Background Image */}
      <Image
        src={image!}
        alt={title}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-110"
      />
      
      {/* Gradient Overlay - Always visible at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />

      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white transition-all duration-300 group-hover:-translate-y-3">
        {/* Title and Date */}
        <Link href={href || "#"} className="group/link">
          <h3 className="font-bold text-2xl mb-1 group-hover/link:text-primary transition-colors">
            {title}
          </h3>
        </Link>
        <time className="text-sm text-white/70 mb-2 block">{dates}</time>

        {/* Description */}
        <p className="text-sm text-white/90 mb-3 line-clamp-2">
          {description}
        </p>

        {/* Tech Stack Tags with Icons */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {/* Always show first 4 skills */}
            {tags.slice(0, 4).map((tag) => (
              <div
                key={tag}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-md"
              >
                <SkillIcon skill={tag} className="size-3.5 text-white" />
                <span className="text-xs font-medium text-white">{tag}</span>
              </div>
            ))}
            
            {/* Show +N badge when not hovered, hide on hover */}
            {tags.length > 4 && (
              <div className="flex items-center px-3 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-md group-hover:hidden">
                <span className="text-xs font-medium text-white">+{tags.length - 4}</span>
              </div>
            )}
            
            {/* Show remaining skills only on hover */}
            {tags.length > 4 && tags.slice(4).map((tag) => (
              <div
                key={tag}
                className="hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-md"
              >
                <SkillIcon skill={tag} className="size-3.5 text-white" />
                <span className="text-xs font-medium text-white">{tag}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons - Hidden by default, shown on hover */}
        {links && links.length > 0 && (
          <div className="overflow-hidden max-h-0 group-hover:max-h-20 transition-all duration-300">
            <div className="flex gap-2 mt-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
              {links.map((link, idx) => (
                <Link
                  href={link.href}
                  key={idx}
                  target="_blank"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/30 bg-white/20 backdrop-blur-md text-white text-xs font-medium hover:bg-white/30 transition-all hover:scale-105"
                >
                  <span>{link.icon}</span>
                  <span>{link.type}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
