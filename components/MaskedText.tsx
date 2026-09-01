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
  start = true,
  skipEntrance = false,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  /** Pass 24: gates the reveal on a real event instead of mount time. Stays
   *  false to hold every word masked/hidden (not merely "not yet
   *  scheduled") until the caller flips it — see app/page.tsx, where this
   *  is tied to the real boot-ready handoff rather than a guessed delay. */
  start?: boolean;
  /** Pass 24: for an instance that mounts into an already-`start`-ed world
   *  (a route remount after the real reveal already happened once — see
   *  the long comment in lib/systemStatus.ts) — skips the mask animation
   *  entirely rather than replaying it, matching every other gated hero
   *  element's `initial={false}` treatment in app/page.tsx. Must be a
   *  value frozen at this instance's own mount, not a live boolean. */
  skipEntrance?: boolean;
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
              initial={skipEntrance ? false : { y: "110%" }}
              animate={start ? { y: "0%" } : { y: "110%" }}
              transition={{ duration: 0.62, ease: EASE, delay: start ? delay + i * stagger : 0 }}
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
