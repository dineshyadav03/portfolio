"use client";

import { useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { EASE, revealOnce } from "@/lib/motion";
import { getScrollVelocity } from "@/lib/scrollVelocity";
import styles from "./SectionDivider.module.css";

// Reuses SystemPipeline's own connector-draw timing (duration) and the
// site's one shared entrance curve (`EASE`, see lib/motion.ts) so a divider
// reads as the same "system line initializing" language rather than a
// second, differently-paced reveal effect.
const rule: Variants = {
  hidden: { scaleX: 0 },
  show: { scaleX: 1, transition: { duration: 0.45, ease: EASE } },
};

// Pass 20: a divider previously just separated two sections — a line drawing
// in says "new section" but nothing about the sections actually handing
// anything to each other. This adds one small signal packet that sweeps the
// rule once it's drawn, reusing the exact dot-on-a-line language
// SpatialObject/ProjectVisual's "flow" mode already use elsewhere — the same
// system moving between rooms, not a new visual idea. Its speed is drawn
// from the real scroll velocity at the instant the divider enters view (the
// shared store in lib/scrollVelocity.ts, fed by Lenis) — a fast scroll gets
// a quick handoff, a slow deliberate one gets a slower, more legible sweep.
//
// Pass 22: the rule and the sweep previously each had their own independent
// `whileInView` — two separate IntersectionObserver-driven triggers for
// what is conceptually one event (this divider entering view). They happen
// to be positioned closely enough that they've never visibly desynced, but
// nothing guaranteed that — the sweep could only ever be as trustworthy as
// "these two elements happen to have similar bounds." Now only `.rule`
// carries `whileInView`; the sweep is driven by `entered` state set inside
// that single `onViewportEnter`, so there is exactly one trigger and two
// coordinated responses, not two triggers that happen to agree.
export default function SectionDivider({ label, id }: { label: string; id?: string }) {
  const reduced = useReducedMotion();
  const [entered, setEntered] = useState(false);
  const [sweepDuration, setSweepDuration] = useState(0.6);

  return (
    // `id`, when given, is a real jump target — see components/PageToc.tsx,
    // which links to these same section codes rather than inventing its
    // own labels.
    <div className={styles.divider} id={id}>
      <h2 className={styles.label}>{label}</h2>
      <span className={styles.track}>
        <motion.span
          className={styles.rule}
          aria-hidden="true"
          initial="hidden"
          whileInView="show"
          viewport={revealOnce}
          variants={rule}
          onViewportEnter={() => {
            const v = Math.abs(getScrollVelocity());
            setSweepDuration(Math.max(0.35, 0.9 - v * 0.5));
            setEntered(true);
          }}
        />
        {!reduced && (
          <motion.span
            className={styles.sweep}
            aria-hidden="true"
            initial={{ left: "0%", opacity: 0 }}
            // `animate` always has to be a concrete target, never
            // `undefined` — an undefined `animate` leaves framer-motion
            // without anything to hold the element at `initial` for, so it
            // never actually applies inline left/opacity at all until
            // `animate` first becomes a real object, and by then it has no
            // reliable "current" value to animate from. Before `entered`,
            // the target is just `initial` restated (a defined no-op);
            // after, it's the real sweep.
            animate={entered ? { left: "100%", opacity: [0, 1, 1, 0] } : { left: "0%", opacity: 0 }}
            transition={{ duration: sweepDuration, ease: EASE, delay: 0.15 }}
          />
        )}
      </span>
    </div>
  );
}
