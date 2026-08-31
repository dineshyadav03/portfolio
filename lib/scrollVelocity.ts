// A tiny, render-free store for the page's current scroll velocity — the
// missing piece from Pass 19's Lenis integration. Lenis was wired in and
// verified to work, but nothing actually used it as a signal; scroll was
// just smoother, not a shared physical input the rest of the system could
// react to. SmoothScroll feeds this from Lenis's own native `scroll` event
// (see its `velocity` field) once per tick; consumers read it inside their
// own already-running rAF loops (SpatialObject, and anything else that
// wants it) via `getScrollVelocity()`. Nothing here triggers a React
// re-render — it plays the same role for scroll motion that `damp()` plays
// for pointer state: a shared physical signal, not an event system.
let current = 0; // normalized, clamped to roughly -1..1

// Lenis's raw `velocity` is in px/frame and can spike well past 60 on a
// fast fling — this is the magnitude that reads as "fast" for the visual
// systems consuming it, tuned by feel rather than a physical unit.
const MAX_PX_PER_FRAME = 45;

export function setScrollVelocity(raw: number) {
  current = Math.max(-1, Math.min(1, raw / MAX_PX_PER_FRAME));
}

export function getScrollVelocity(): number {
  return current;
}
