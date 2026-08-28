// Shared boot-sequence timing, so the underlying page's entrance
// animation (TerminalWindow) can be synced to start exactly when the
// boot overlay begins clearing, instead of finishing invisibly behind it.

export const ACCESS_TEXT = "ACCESS GRANTED";
export const ACCESS_START_MS = 400; // starts 0.4s after the overlay mounts
export const ACCESS_STEP_MS = 35; // per-character typing speed
export const READ_PAUSE_MS = 350; // beat to read "ACCESS GRANTED" before the HUD takes over

// Phase 1 (connection handshake + typed "ACCESS GRANTED") hands off to
// phase 2 (the systems-online HUD dashboard) once typing finishes, then
// the whole overlay clears.
export const PHASE1_MS = ACCESS_START_MS + ACCESS_TEXT.length * ACCESS_STEP_MS + READ_PAUSE_MS;
export const HUD_MS = 3000;
export const BOOT_VISIBLE_MS = PHASE1_MS + HUD_MS;
