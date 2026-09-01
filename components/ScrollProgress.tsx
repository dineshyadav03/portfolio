"use client";

import { useEffect, useRef } from "react";
import styles from "./ScrollProgress.module.css";

// A thin, fixed bar at the very top of the viewport that fills with real
// scroll progress (0-100%) — direct, 1:1 with the actual scroll position,
// not a decorative animation layered on top of it. That's also why this
// has no `prefers-reduced-motion` branch: unlike an ambient/gratuitous
// effect, this is a functional readout of where the visitor already is
// on the page, the same role a native scrollbar thumb plays — turning it
// off for reduced-motion users would remove information, not just
// motion. Reads the real, native scroll position directly (rAF-throttled
// `scroll` listener, the same pattern PageToc already uses) rather than
// going through Lenis's own event — Lenis (see SmoothScroll.tsx) still
// drives real native scroll every frame, it doesn't maintain some
// separate virtual position, so this works correctly whether or not
// Lenis is even mounted (e.g. under reduced motion, where it isn't).
export default function ScrollProgress() {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf: number | null = null;
    function update() {
      raf = null;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${pct})`;
    }
    function onScroll() {
      if (raf === null) raf = requestAnimationFrame(update);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className={styles.track} aria-hidden="true">
      <div className={styles.fill} ref={fillRef} />
    </div>
  );
}
