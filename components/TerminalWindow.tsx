"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { clocks, nav, profile } from "@/lib/content";
import { useBootRevealDelay } from "@/lib/bootTiming";
import { onGlitchTrigger } from "@/lib/eventGlitch";
import Nav from "./Nav";
import CommandLine from "./CommandLine";
import SysHeaderBar from "./SysHeaderBar";
import styles from "./TerminalWindow.module.css";

const EVENT_GLITCH_MS = 220;

const FORMATTERS = clocks.map(
  (c) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: c.tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
);

export default function TerminalWindow({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Pass 26: a project's own page (/creations/[slug]) still belongs to
  // "work" for the kicker's sake (matches the same prefix-match fix in
  // Nav.tsx) — but the titlebar itself shows the real, literal path (like
  // an actual shell prompt would: `~/creations/cody`, not just
  // `~/creations`), not the parent section's href.
  const section = nav.find((item) =>
    item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  const title = `visitor@${profile.handle}: ~${pathname !== "/" ? pathname : ""}`;
  const delaySec = useBootRevealDelay();
  const reduced = useReducedMotion();
  const [now, setNow] = useState<Date | null>(null);
  const [glitching, setGlitching] = useState(false);
  const glitchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);

  // Global, on-demand response to `triggerGlitch()` — a brief filter/
  // transform burst on the content area only (titlebar/nav stay stable,
  // matching the rest of the site's "terminal chrome is the predictable
  // frame" principle). Bypassed entirely under reduced motion rather than
  // just shortened. No trigger sites exist yet in this pass — verified by
  // calling `triggerGlitch()` manually.
  useEffect(() => {
    if (reduced) return;
    return onGlitchTrigger(() => {
      if (glitchTimeoutRef.current) clearTimeout(glitchTimeoutRef.current);
      setGlitching(true);
      glitchTimeoutRef.current = setTimeout(() => setGlitching(false), EVENT_GLITCH_MS);
    });
  }, [reduced]);

  useEffect(() => {
    return () => {
      if (glitchTimeoutRef.current) clearTimeout(glitchTimeoutRef.current);
    };
  }, []);

  return (
    <motion.div
      className={styles.window}
      role="group"
      aria-label={title}
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: delaySec, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={styles.titlebar}>
        <div className={styles.title}>{title}</div>
        <div className={styles.clocks} suppressHydrationWarning>
          {clocks.map((c, i) => (
            <span key={c.label}>
              {c.label} {now ? FORMATTERS[i].format(now) : "--:--"}
            </span>
          ))}
        </div>
      </div>
      <div className={glitching ? `${styles.body} ${styles.bodyGlitch}` : styles.body}>
        <SysHeaderBar />
        <div className={styles.kickerRow}>
          {section && (
            <p className={styles.kicker}>
              CODE: {section.code} — {section.label}
            </p>
          )}
          <Nav />
        </div>
        {children}
        <CommandLine />
      </div>
    </motion.div>
  );
}
