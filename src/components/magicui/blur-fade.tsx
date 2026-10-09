"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";

interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  yOffset?: number;
  /** Wait until the element scrolls into view instead of animating on mount. */
  inView?: boolean;
  inViewMargin?: string;
  blur?: string;
}

const BlurFade = ({
  children,
  className,
  duration = 0.5,
  delay = 0,
  yOffset = 8,
  inView = false,
  inViewMargin = "-40px",
  blur = "4px",
}: BlurFadeProps) => {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const inViewResult = useInView(ref, { once: true, margin: inViewMargin as any });
  const show = !inView || inViewResult;

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ y: yOffset, opacity: 0, filter: `blur(${blur})` }}
      animate={show ? { y: 0, opacity: 1, filter: "blur(0px)" } : undefined}
      transition={{ delay, duration, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default BlurFade;
