"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import styles from "./DotField.module.css";

const COLS = 7;
const ROWS = 5;
const MAX_SHIFT = 3; // px — a "sensor field," not a particle effect
const REACT_RADIUS = 90; // px — dots beyond this distance from the pointer stay put

// The hero's background "computational field" layer — a small static grid
// of dots that sit behind the ASCII portrait and repel gently away from
// the pointer when it passes nearby, settling back once it moves on.
// Positions are measured once (on mount/resize), not every frame; the
// pointer loop below re-anchors those cached *relative* offsets to the
// container's current rect (one measurement per frame, the same pattern
// AsciiPortrait's own pointer handler already uses) so it keeps working
// correctly across scroll without re-querying every dot's layout.
export default function DotField() {
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<{ el: HTMLSpanElement; relX: number; relY: number }[]>([]);

  useEffect(() => {
    if (reduced) return;
    if (typeof window === "undefined" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    function measure() {
      const containerRect = container!.getBoundingClientRect();
      const spans = Array.from(container!.querySelectorAll<HTMLSpanElement>("span"));
      dotsRef.current = spans.map((el) => {
        const r = el.getBoundingClientRect();
        return {
          el,
          relX: r.left + r.width / 2 - containerRect.left,
          relY: r.top + r.height / 2 - containerRect.top,
        };
      });
    }
    measure();
    window.addEventListener("resize", measure);

    let frame: number | null = null;
    let lastX = -9999;
    let lastY = -9999;

    function onMove(e: MouseEvent) {
      lastX = e.clientX;
      lastY = e.clientY;
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        // Off-screen (scrolled well past the hero) — skip the whole loop.
        if (rect.bottom < -REACT_RADIUS || rect.top > window.innerHeight + REACT_RADIUS) return;
        for (const dot of dotsRef.current) {
          const cx = rect.left + dot.relX;
          const cy = rect.top + dot.relY;
          const dx = cx - lastX;
          const dy = cy - lastY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > REACT_RADIUS || dist === 0) {
            dot.el.style.transform = "translate(0px, 0px)";
            continue;
          }
          const push = (1 - dist / REACT_RADIUS) * MAX_SHIFT;
          dot.el.style.transform = `translate(${(dx / dist) * push}px, ${(dy / dist) * push}px)`;
        }
      });
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", measure);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [reduced]);

  return (
    <div className={styles.field} ref={containerRef} aria-hidden="true">
      <div className={styles.grid}>
        {Array.from({ length: ROWS * COLS }).map((_, i) => (
          <span key={i} className={styles.dot} />
        ))}
      </div>
    </div>
  );
}
