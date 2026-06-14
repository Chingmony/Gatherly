"use client";

import * as React from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

/**
 * Framer Motion entrance wrapper — transform-only fade/slide-up, honoring
 * `prefers-reduced-motion` (docs/05 §4/§10). `delay` staggers sibling reveals.
 * Capture-safe: under reduced motion the element renders fully visible immediately.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  ...rest
}: { children: React.ReactNode; delay?: number } & HTMLMotionProps<"div">) {
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <div className={className} {...(rest as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    );
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.2, 0.7, 0.3, 1], delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
