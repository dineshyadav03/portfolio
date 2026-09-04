"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { clocks, profile } from "@/lib/content";
import { useBootRevealDelay } from "@/lib/bootTiming";
import { onGlitchTrigger } from "@/lib/eventGlitch";
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
  // Pass 34: on request — the titlebar + status line were sitting directly
  // above the hero on first load, pushing its "CORE ONLINE" reveal down
  // far enough to collide with ScrollHint's fixed bottom-of-viewport
  // position on shorter windows, and generally crowding the moment the
  // hero is supposed to land. The homepage's hero already establishes
  // identity itself (CORE ONLINE, the wordmark, `whoami`) — this chrome is
  // real, useful wayfinding on every OTHER route (the literal path, which
  // section you're in), just redundant and heavy directly above THIS one.
  const isHome = pathname === "/";
  // The titlebar itself shows the real, literal path (like an actual shell
  // prompt would: `~/creations/cody`, not just `~/creations`).
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
      data-home={isHome || undefined}
      role="group"
      aria-label={title}
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: delaySec, ease: [0.16, 1, 0.3, 1] }}
    >
      {!isHome && (
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
      )}
      <div className={glitching ? `${styles.body} ${styles.bodyGlitch}` : styles.body}>
        {!isHome && <SysHeaderBar />}
        {children}
      </div>
    </motion.div>
  );
}
