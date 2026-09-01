"use client";

import { useEffect, useState } from "react";

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
// Pass 24 diagnostic finding: a route's client component tree can
// genuinely *remount* mid-navigation — observed live (both dev and
// production builds) via a fresh `useState` initializer firing a second
// time, ~300-450ms after the first, reading "navigating" even though
// status had already reached "ready" moments earlier at the first mount.
// Traced into Next.js's own client-router reconciliation, not React
// Strict Mode (Strict Mode's double-invoke is synchronous and back-to-
// back; this had a real elapsed gap with a genuinely different value each
// time, and reproduced identically in a production build where Strict
// Mode is inert). Without this, anything gated on "have we reached ready"
// would flash from revealed back to hidden and replay its entrance a
// second time on a route return. `everBeenReady` is a plain module
// variable, not React state, so once "ready" has been observed anywhere
// in the tab's lifetime it stays true regardless of how many times the
// underlying component remounts afterward. Set once, right here, so every
// consumer (the hook below, and SpatialObject.tsx's own plain-JS gate)
// gets it for free without duplicating the tracking.
let everBeenReady = false;

export function setSystemStatus(status: SystemStatus) {
  if (status === "ready") everBeenReady = true;
  if (status === current) return;
  current = status;
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: status }));
}

export function getSystemStatus(): SystemStatus {
  return current;
}

// Non-React consumers with the same remount concern as the hook below
// (currently: SpatialObject.tsx, which gates its own construction
// sequence inside a plain useEffect rather than this hook) read this
// directly instead of `getSystemStatus() === "ready"`.
export function hasSystemEverBeenReady(): boolean {
  return everBeenReady;
}

export function onSystemStatusChange(handler: (status: SystemStatus) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<SystemStatus>).detail);
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}

// Whether the system has reached "ready" at least once — read
// synchronously on mount (`everBeenReady` short-circuits a remount that
// lands mid-"navigating"), then updated live via subscription if it
// hasn't happened yet. This is the one correct way for route-level
// content (e.g. the homepage, which unmounts/remounts every time its own
// route is revisited) to know whether to wait for a real boot handoff or
// reveal immediately.
export function useIsSystemReady(): boolean {
  const [ready, setReady] = useState(() => everBeenReady || getSystemStatus() === "ready");
  useEffect(() => {
    if (ready) return;
    return onSystemStatusChange((status) => {
      if (status === "ready") setReady(true);
    });
  }, [ready]);
  return ready;
}
