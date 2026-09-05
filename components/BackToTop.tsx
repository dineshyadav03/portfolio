"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { getLenisInstance } from "@/lib/lenisInstance";
import styles from "./BackToTop.module.css";

// Top-left corner by default (safe at every width and on every route —
// see BackToTop.module.css for what that ruled out), switching to
// left-center — mirroring PageToc's right-center position — only once
// the viewport is wide enough to have real margin there, the same
// 1220px threshold PageToc itself already relies on. Sitewide and not
// route-gated (unlike PageToc, which is homepage-only) — every route can
// get long enough to want this, mobile included.
const SHOW_AFTER_VH = 1;

export default function BackToTop() {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let raf: number | null = null;
    function check() {
      raf = null;
      setVisible(window.scrollY > window.innerHeight * SHOW_AFTER_VH);
    }
    function onScroll() {
      if (raf === null) raf = requestAnimationFrame(check);
    }
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", check);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  function handleClick() {
    // Reduced motion: an instant jump, not a softer version of the same
    // animated scroll — the same "different behavior, not just softer"
    // convention every other continuous effect on this site already
    // follows (Nav's hide/show, SpatialObject's rotation, etc.).
    if (reduced) {
      window.scrollTo({ top: 0 });
      return;
    }
    // Lenis's own scrollTo, not a raw window.scrollTo — Lenis re-drives
    // the real scroll position every frame (see SmoothScroll.tsx), so a
    // plain scrollTo call would just be immediately fought/overridden by
    // its own animation loop instead of actually animating anything.
    const lenis = getLenisInstance();
    if (lenis) {
      lenis.scrollTo(0, { duration: 0.9 });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          className={styles.button}
          onClick={handleClick}
          aria-label="Back to top"
          initial={reduced ? false : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduced ? undefined : { opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className={styles.chevron} aria-hidden="true">
            ˄
          </span>
          <span className={styles.label}>top</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
