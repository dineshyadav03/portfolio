"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { EASE } from "@/lib/motion";
import { setSystemStatus } from "@/lib/systemStatus";

// Each destination gets its own transition character, not just a longer
// timer — the four routes are genuinely different kinds of space (a
// directory of processes, a quiet document archive, a terminal endpoint),
// so arriving at each should feel slightly different. All four still stay
// short and share the same easing curve as the rest of the site's motion
// language (see lib/motion.ts) — the variation is in direction/scale, not
// in inventing a new curve per route.
const TRANSITIONS: Record<
  string,
  { initial: Record<string, number>; animate: Record<string, number>; exit: Record<string, number>; duration: number }
> = {
  "/": {
    initial: { opacity: 0, y: 10, scale: 0.99 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -8, scale: 0.99 },
    duration: 0.3,
  },
  // Entering a directory of live processes — the view moves slightly
  // forward into denser content, instead of just sliding vertically.
  "/creations": {
    initial: { opacity: 0, scale: 0.965 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.015 },
    duration: 0.32,
  },
  // A quieter, slower settle — reflections is an archive/memory state, not
  // an active system view, so it shouldn't arrive with the same energy.
  "/reflections": {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6 },
    duration: 0.38,
  },
  // A gentle collapse toward the terminal/contact endpoint.
  "/contact": {
    initial: { opacity: 0, y: 14, scale: 0.985 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.985 },
    duration: 0.28,
  },
};

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Pass 26: a project's own page (/creations/[slug]) is still part of the
  // same "directory of live processes" space /creations itself is — it
  // gets that same transition character rather than falling through to
  // the generic "/" default, which would read as arriving somewhere
  // unrelated to where the visitor actually came from.
  const transitionKey = pathname.startsWith("/creations/") ? "/creations" : pathname;
  const t = TRANSITIONS[transitionKey] ?? TRANSITIONS["/"];
  // The one place that actually knows a navigation happened, regardless of
  // whether it came from clicking Nav, pressing 1-4, or running `cd` in the
  // terminal (CommandLine.tsx) — all three ultimately go through the same
  // router, which is the only thing this component watches. Skipped on the
  // very first render (the initial page load isn't a "navigation").
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current === pathname) return;
    prevPathnameRef.current = pathname;
    setSystemStatus("navigating");
    const id = setTimeout(() => setSystemStatus("ready"), t.duration * 1000 + 80);
    return () => clearTimeout(id);
  }, [pathname, t.duration]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={t.initial}
        animate={t.animate}
        exit={t.exit}
        transition={{ duration: t.duration, ease: EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
