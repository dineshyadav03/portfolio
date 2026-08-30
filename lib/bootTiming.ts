"use client";

// Shared boot-sequence timing, so the underlying page's entrance
// animation can be synced to start exactly when the boot overlay begins
// clearing, instead of finishing invisibly behind it.

import { useState } from "react";
import { useReducedMotion } from "framer-motion";

export const ACCESS_TEXT = "ACCESS GRANTED";
export const ACCESS_START_MS = 400; // starts 0.4s after the overlay mounts
export const ACCESS_STEP_MS = 35; // per-character typing speed
export const READ_PAUSE_MS = 350; // beat to read "ACCESS GRANTED" before the HUD takes over

// Phase 1 (connection handshake + typed "ACCESS GRANTED") hands off to
// phase 2 (the systems-online HUD dashboard), which hands off to phase 3
// (a flying-bird "welcome" moment) before the whole overlay clears.
export const PHASE1_MS = ACCESS_START_MS + ACCESS_TEXT.length * ACCESS_STEP_MS + READ_PAUSE_MS;
export const HUD_MS = 2200;
export const WELCOME_MS = 2600;
export const BOOT_VISIBLE_MS = PHASE1_MS + HUD_MS + WELCOME_MS;
export const WELCOME_TEXT = "WELCOME TO THE PORTFOLIO";
export const WELCOME_START_MS = 300; // beat after the bird appears before the text types

// Shared by every top-level chrome piece (clock bar, terminal window,
// status bar) so they all wait out the boot overlay and then reveal
// together, instead of the terminal window animating in alone while
// everything else just pops in already-settled. Root layout components
// never remount on client-side navigation, so this initial value is only
// ever "live" once, on the real first page load.
export function useBootRevealDelay(): number {
  const reduced = useReducedMotion();
  const [delaySec] = useState(reduced ? 0 : BOOT_VISIBLE_MS / 1000);
  return delaySec;
}
