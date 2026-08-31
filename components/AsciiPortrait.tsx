"use client";

import { useEffect, useRef } from "react";
import { type MotionValue, useReducedMotion, useTransform } from "framer-motion";
import { asciiPortrait } from "@/lib/asciiPortrait";
import styles from "./AsciiPortrait.module.css";

const MAX_X = 6;
const MAX_Y = 4;
const MAX_ROTATE_X = 3; // deg — vertical pointer offset tilts the top toward/away from the viewer
const MAX_ROTATE_Y = 4; // deg — horizontal pointer offset

// `heroProgress` (0 while the hero is pinned at the top of the viewport, 1
// once it's fully scrolled past — computed once in app/page.tsx and shared
// with the Stage 3A hero-exit drift) drives how present the depth effect
// is: full intensity at rest, easing toward flat as the hero leaves focus,
// so the portrait reads as "receding" rather than staying rigidly tilted
// while the visitor has moved on to reading the rest of the page.
export default function AsciiPortrait({ heroProgress }: { heroProgress: MotionValue<number> }) {
  const reduced = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const depthIntensity = useTransform(heroProgress, [0, 1], [1, 0.25]);

  useEffect(() => {
    if (reduced) return;
    // Skip on touch devices — there's no ambient pointer position to react
    // to, and a listener that only ever fires on tap would read as a bug
    // rather than a depth cue.
    if (typeof window === "undefined" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }

    // Writes the transform directly to the DOM via a ref, coalesced to one
    // update per animation frame — a purely visual, non-content effect like
    // this doesn't need a React state update (and a re-render) on every raw
    // mousemove tick, which can fire far more often than the screen repaints.
    // `depthIntensity` is read via `.get()` here rather than subscribed to,
    // so scroll progress never triggers a re-render of this component either
    // — it just scales whatever the next pointer-driven frame computes.
    let frame: number | null = null;
    let lastX = 0;
    let lastY = 0;

    function onMove(e: MouseEvent) {
      lastX = e.clientX;
      lastY = e.clientY;
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        const el = wrapRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (lastX - cx) / window.innerWidth;
        const dy = (lastY - cy) / window.innerHeight;
        const nx = Math.max(-1, Math.min(1, dx));
        const ny = Math.max(-1, Math.min(1, dy));
        const intensity = depthIntensity.get();
        const x = nx * MAX_X;
        const y = ny * MAX_Y;
        const rotateY = nx * MAX_ROTATE_Y * intensity;
        const rotateX = -ny * MAX_ROTATE_X * intensity;
        el.style.transform = `translate(${x}px, ${y}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [reduced, depthIntensity]);

  return (
    <div className={styles.scene} data-flat={reduced ? "true" : undefined}>
      <div
        ref={wrapRef}
        className={styles.wrap}
        data-flat={reduced ? "true" : undefined}
        aria-hidden="true"
      >
        <pre className={styles.art}>{asciiPortrait}</pre>
        <pre className={`${styles.art} ${styles.layerRed}`}>{asciiPortrait}</pre>
        <pre className={`${styles.art} ${styles.layerCyan}`}>{asciiPortrait}</pre>
      </div>
    </div>
  );
}
