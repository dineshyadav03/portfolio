"use client";

import { Fragment } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "@/lib/motion";

// A staggered, masked word-reveal — each word rises from fully clipped
// beneath its own line into place, rather than the whole line fading in as
// one undifferentiated block. This is deliberately reserved for the hero's
// one "primary system declaration" (see PASS 20 report) — nothing else on
// the site gets this treatment, so it stays a real hierarchy signal instead
// of becoming a generic effect applied to every heading.
//
// Real text, not a canvas/SVG render: a plain space text node sits between
// each word's masked wrapper, so the browser still wraps lines normally at
// narrow widths — each wrapped line just reveals independently.
export default function MaskedText({
  text,
  className,
  delay = 0,
  stagger = 0.055,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const reduced = useReducedMotion();
  const words = text.split(" ");

  if (reduced) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {words.map((word, i) => (
        <Fragment key={i}>
          <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top" }}>
            <motion.span
              style={{ display: "inline-block" }}
              initial={{ y: "110%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 0.62, ease: EASE, delay: delay + i * stagger }}
            >
              {word}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </span>
  );
}
