"use client";

// The same CustomEvent pub-sub shape as lib/eventGlitch.ts and lib/sound.ts's
// preference channel — not a new architecture. Callers fire `notifyNia()` at
// the same semantic boundaries already wired for sound/glitch (a command
// outcome, a project activation, a pipeline's discrete processing pulse);
// Mascot subscribes via `onNiaReaction` to render a brief, self-clearing
// visual response. A newer call always describes the current transient
// state — there's no queue, so rapid events simply replace one another
// rather than stacking.

export type NiaReactionState = "success" | "error" | "project" | "processing";

const EVENT_NAME = "portfolio-nia-reaction";

export function notifyNia(state: NiaReactionState) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<NiaReactionState>(EVENT_NAME, { detail: state }));
}

export function onNiaReaction(handler: (state: NiaReactionState) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<NiaReactionState>).detail);
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
