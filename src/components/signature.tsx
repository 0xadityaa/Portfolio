"use client";

import { DATA } from "@/data/resume";
import { useEffect, useRef, useState } from "react";

/**
 * Aditya's signature at the end of a post. It writes itself in, once, when it
 * scrolls into view (see .signature in globals.css). Without JavaScript or
 * with reduced motion it is simply there.
 */
export function Signature() {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "waiting" | "signed">("idle");

  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setState("waiting");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setState("signed");
        observer.disconnect();
      },
      { threshold: 0.6 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    // The observer watches the wrapper: the ink itself is clipped away while it waits.
    <div ref={ref} className="mt-12 w-fit">
      <div role="img" aria-label={`Signed, ${DATA.name}`} data-state={state} className="signature" />
    </div>
  );
}
