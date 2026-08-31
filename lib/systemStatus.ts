"use client";

// A tiny, shared "what is the system doing right now" signal — the same
// CustomEvent pub-sub shape lib/eventGlitch.ts and lib/theme.ts already
// use, not a new architecture or a React state machine. Every value here
// corresponds to something that actually just happened (boot actually
// finished, the route actually changed, a project actually launched) —
// nothing fabricated. Consumers can read the current value synchronously
// via `getSystemStatus()` or subscribe via `onSystemStatusChange()`.
export type SystemStatus = "boot" | "ready" | "navigating" | "launching";

const EVENT_NAME = "portfolio-system-status";
let current: SystemStatus = "boot";

export function setSystemStatus(status: SystemStatus) {
  if (status === current) return;
  current = status;
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: status }));
}

export function getSystemStatus(): SystemStatus {
  return current;
}

export function onSystemStatusChange(handler: (status: SystemStatus) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<SystemStatus>).detail);
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
