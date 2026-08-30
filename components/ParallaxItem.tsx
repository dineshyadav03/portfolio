"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

// Wraps any block in a subtle scroll-linked vertical drift — it lags a
// little behind the page as you scroll past it, the classic parallax cue,
// used sparingly (just the portrait) rather than sitewide so it reads as
// a deliberate touch and not a gimmick.
export default function ParallaxItem({
  children,
  strength = 28,
}: {
  children: React.ReactNode;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [strength, -strength]);

  if (reduced) return <>{children}</>;

  return (
    <motion.div ref={ref} style={{ y }}>
      {children}
    </motion.div>
  );
}
