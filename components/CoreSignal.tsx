"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EASE } from "@/lib/motion";
import styles from "./CoreSignal.module.css";

// Roughly matches SpatialObject's own construction window (INTRO_MS plus
// the secondary layer's own lag) — long enough that "CORE FORMING" holds
// for the beat the lattice is actually visibly resolving, not an arbitrary
// number picked independently of it.
const FORMING_HOLD_MS = 900;

// A minimal system-boot-log line beneath the hero's core — exactly two
// real states ("forming" then "online"), both driven by the same `ready`
// signal SpatialObject itself gates its construction on (see app/page.tsx)
// — not a second, independent signal source, and deliberately not a live
// telemetry dashboard reflecting pointer/scroll every frame. This is one
// event (construction starting) producing one more coordinated response,
// not a new per-frame data channel.
export default function CoreSignal({
  ready,
  skipEntrance = false,
}: {
  ready: boolean;
  /** Pass 24: true for an instance mounting into an already-`ready` world
   *  (a route remount after the real construction already happened once —
   *  see the long comment in lib/systemStatus.ts). Goes straight to
   *  "online" with no fade, instead of replaying "CORE FORMING" for a
   *  visitor who already saw it settle. Must be frozen at this instance's
   *  own mount, not a live boolean. */
  skipEntrance?: boolean;
}) {
  const reduced = useReducedMotion();
  const [line, setLine] = useState<"idle" | "forming" | "online">(skipEntrance && ready ? "online" : "idle");

  useEffect(() => {
    if (!ready || skipEntrance) return;
    // Syncing local text state to an external event (`ready` flipping
    // true) rather than deriving it from props/state React already
    // tracks — the same legitimate case BootIntro/StatusBar/ThemeToggle
    // already have this exact lint exception for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLine("forming");
    const id = setTimeout(() => setLine("online"), FORMING_HOLD_MS);
    return () => clearTimeout(id);
  }, [ready, skipEntrance]);

  if (reduced) {
    return (
      <p className={styles.signal} aria-hidden="true">
        CORE ONLINE
      </p>
    );
  }

  return (
    <div className={styles.signal} aria-hidden="true">
      <AnimatePresence mode="wait">
        {line !== "idle" && (
          <motion.span
            key={line}
            initial={skipEntrance ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            {line === "forming" ? "CORE FORMING" : "CORE ONLINE"}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
