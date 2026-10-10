"use client";

import { DATA } from "@/data/resume";
import { SIGNATURE } from "@/lib/signature-strokes";
import { useEffect, useRef, useState } from "react";

/**
 * Aditya's signature at the end of a post, written stroke by stroke, in pen
 * order, the first time it scrolls into view (see .signature in globals.css).
 * Without JavaScript or with reduced motion it is simply there.
 */
export function Signature() {
  const ref = useRef<SVGSVGElement>(null);
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
    <svg
      ref={ref}
      role="img"
      aria-label={`Signed, ${DATA.name}`}
      viewBox={`0 0 ${SIGNATURE.width} ${SIGNATURE.height}`}
      data-state={state}
      className="signature mt-12"
      fill="none"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {SIGNATURE.strokes.map((stroke) => (
        <path
          key={stroke.d}
          d={stroke.d}
          pathLength={1}
          style={{ animationDelay: `${stroke.delay}s`, animationDuration: `${stroke.duration}s` }}
        />
      ))}
    </svg>
  );
}
