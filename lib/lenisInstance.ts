import type Lenis from "lenis";

// A tiny, render-free store for the page's single Lenis instance — same
// shape as scrollVelocity.ts's store, for the same reason: SmoothScroll
// mounts once in the root layout and owns the instance locally, but other
// components (BackToTop) need to trigger a real Lenis-driven scroll rather
// than a raw `window.scrollTo`, which would just fight Lenis's own
// per-frame control of the native scroll position instead of animating
// through it. `null` under `prefers-reduced-motion` (Lenis is never
// constructed there at all) or before SmoothScroll's effect has run yet.
let current: Lenis | null = null;

export function setLenisInstance(lenis: Lenis | null) {
  current = lenis;
}

export function getLenisInstance(): Lenis | null {
  return current;
}
