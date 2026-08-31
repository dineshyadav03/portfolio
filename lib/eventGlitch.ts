"use client";

// A tiny reusable signal for "something meaningful just happened" — the
// same CustomEvent pub-sub shape already used by lib/sound.ts (sound
// preference) and lib/theme.ts (theme change), not a new architecture.
// Callers fire `triggerGlitch()` on a real event (a command result, a
// project activating, a completed system process); anything wanting to
// render a brief visual response subscribes via `onGlitchTrigger`.
//
// This is deliberately separate from the existing periodic ambient glitch
// in PageGlitch/AsciiPortrait (their own infinite 7s CSS loops are
// untouched) — this is a short-lived, on-demand burst, not a second
// continuous animation system.

const EVENT_NAME = "portfolio-event-glitch";

export function triggerGlitch() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function onGlitchTrigger(handler: () => void): () => void {
  const listener = () => handler();
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
