"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import Lenis from "lenis";
import { setLenisInstance } from "@/lib/lenisInstance";
import { setScrollVelocity } from "@/lib/scrollVelocity";

// Modern Lenis (v1+) is architecturally different from the smooth-scroll
// libraries that used to break the web: it doesn't wrap the page in a
// transformed container and hijack position — it still drives the
// document's real, native scroll position every frame (internally calling
// the same APIs a user's own scroll would), just interpolated toward the
// wheel/touch target instead of jumping there instantly. That means every
// scroll consumer already in this codebase (SpatialObject/HowIWork's own
// `useScroll`, SystemPipeline's stage progress, ParallaxItem, ScrollHint's
// `window.scrollY` check) keeps working completely unmodified — they all
// read the real scroll position, which Lenis is still the one setting.
//
// Mounted once in the root layout (which never remounts on client-side
// navigation), so one Lenis instance persists across the whole session
// rather than re-initializing per route.
//
// Reduced motion: Lenis is never constructed at all — not "instant
// duration", literally absent, so scrolling stays 100% native or a
// visitor with that preference is not depending on a third-party library
// to do the one thing native scroll already does correctly.
export default function SmoothScroll() {
  const reduced = useReducedMotion();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (reduced) return;

    const lenis = new Lenis({
      // Tuned deliberately short — the failure mode explicitly being
      // guarded against here is "floaty/laggy/disconnected from the
      // pointer," not merely "not instant." ~0.9s with a fast-settling
      // cubic-out still reads as continuous and weighted without ever
      // feeling like the page is wading through syrup.
      duration: 0.9,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      // Keyboard scrolling (Page Down, Space, Home/End, focus-into-view)
      // moves the native scroll position directly, bypassing Lenis's own
      // wheel/touch handling entirely — Lenis observes that external
      // change and smooths from wherever it lands, it never blocks or
      // overrides it. Nothing here disables or intercepts keyboard input.
      touchMultiplier: 1,
    });
    lenisRef.current = lenis;
    setLenisInstance(lenis);
    // Pass 20: Lenis already computes a real velocity every tick — this
    // just publishes it to the shared store above instead of it going
    // unused. Reset to 0 on unmount/reduced-motion so a stale value can't
    // linger and be read by a consumer after scrolling itself has reverted
    // to plain native (unsmoothed, velocity-less) behavior.
    lenis.on("scroll", ({ velocity }: { velocity: number }) => {
      setScrollVelocity(velocity);
    });

    let raf: number;
    function loop(time: number) {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
      setLenisInstance(null);
      setScrollVelocity(0);
    };
  }, [reduced]);

  return null;
}
