import { cn } from "@/lib/utils";

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  /** Seconds. Use small steps to stagger the first screen. */
  delay?: number;
}

/**
 * Entry animation in plain CSS (see .fade-in in globals.css), so content is in
 * the server HTML and visible without JavaScript.
 */
export function FadeIn({ children, className, delay = 0 }: FadeInProps) {
  return (
    <div
      className={cn("fade-in", className)}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
