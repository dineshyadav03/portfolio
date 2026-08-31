"use client";

// Lightweight, dependency-free sound system: short synth tones generated via
// Web Audio API (no asset files, matches the rest of the site's
// procedurally-generated visuals) plus a persisted on/off preference.

const STORAGE_KEY = "portfolio-sound-enabled";
const CHANGE_EVENT = "portfolio-sound-change";

let audioCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  return audioCtx;
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    // Default ON — a minimal chime, not silence, per the user's preference.
    return stored === null ? true : stored === "1";
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    /* private-mode storage access can throw; the preference just won't persist */
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: enabled }));
}

export function onSoundPreferenceChange(handler: (enabled: boolean) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<boolean>).detail);
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}

function tone(ctx: AudioContext, freq: number, startTime: number, duration: number, peak: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peak, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

function noiseClick(ctx: AudioContext, startTime: number, duration: number, peak: number) {
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const decay = 1 - i / bufferSize;
    data[i] = (Math.random() * 2 - 1) * decay;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(peak, startTime);
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(startTime);
}

/** A short, quiet two-note "system ready" blip. No-ops if muted, unsupported,
 * or blocked by the browser's autoplay policy (no prior user gesture yet). */
export function playBootChime() {
  if (!isSoundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {
      /* blocked until a real user gesture unlocks audio — expected on a cold first load */
    });
  }
  const now = ctx.currentTime;
  tone(ctx, 660, now, 0.09, 0.09);
  tone(ctx, 880, now + 0.07, 0.14, 0.09);
}

/** A tiny, quiet mechanical tick — meant to be called once per typewriter
 * character. Deliberately percussive noise, not a tone: a "beep" repeated
 * every ~30ms reads as an alarm, a soft click reads as a keyboard. */
export function playKeyClick() {
  if (!isSoundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  noiseClick(ctx, ctx.currentTime, 0.02, 0.02);
}

/** A single short confirmation blip for command-line submission. */
export function playCommandBlip() {
  if (!isSoundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  tone(ctx, 520, ctx.currentTime, 0.08, 0.07);
}

/** A quick, playful ascending chirp for Nia's click-to-greet. */
export function playGreetChirp() {
  if (!isSoundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(ctx, 920, now, 0.07, 0.08);
  tone(ctx, 1300, now + 0.055, 0.09, 0.08);
}

/** A short ascending three-note arpeggio — the "all systems online" moment
 * once the boot HUD dashboard comes up after ACCESS GRANTED. */
export function playSystemReady() {
  if (!isSoundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(ctx, 523, now, 0.09, 0.07);
  tone(ctx, 659, now + 0.08, 0.09, 0.07);
  tone(ctx, 784, now + 0.16, 0.16, 0.08);
}

/** A low, descending two-note tone for the error screen — the inverse
 * shape of the boot chime, so it reads as "something went down." Reused
 * for any other "that didn't work" moment (e.g. an unrecognized terminal
 * command) rather than growing a second error sound. */
export function playErrorTone() {
  if (!isSoundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(ctx, 340, now, 0.16, 0.08);
  tone(ctx, 220, now + 0.13, 0.22, 0.08);
}

/** A short, dry single tone for activating a nav item — mouse or keyboard.
 * Deliberately a tone (not the percussive noise used for typing) so it
 * reads as "moved to a new place," not "typing," and quieter than the
 * command-line blip since this fires on every route change. */
export function playNavClick() {
  if (!isSoundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  tone(ctx, 700, ctx.currentTime, 0.05, 0.05);
}

/** One quiet tick per system-pipeline stage as it activates on scroll —
 * pitch rises slightly with the stage index so the sequence reads as a
 * signal moving forward rather than six identical beeps. The first stage
 * gets a touch more presence (the pipeline "starting"); the last stage
 * gets a small two-note settle standing in for "feedback received," still
 * quieter than the existing system-ready/boot sounds. Every value here is
 * deliberately lower-gain than the rest of the vocabulary — six of these
 * can fire in one scroll, so each individual one has to stay unobtrusive. */
export function playSystemNode(index: number, total: number) {
  if (!isSoundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  if (index === total - 1) {
    tone(ctx, 660, now, 0.08, 0.045);
    tone(ctx, 880, now + 0.07, 0.1, 0.045);
    return;
  }

  const isFirst = index === 0;
  const freq = 420 + index * 28;
  tone(ctx, freq, now, isFirst ? 0.07 : 0.05, isFirst ? 0.045 : 0.028);
}

/** A very short, very quiet digital tick — acknowledges the pointer
 * entering a project's interactive area, once per hover session (paired
 * with `pointerenter`, never with pointer movement). Deliberately higher-
 * pitched and quieter than playKeyClick's noise-click so the two don't
 * read as the same sound despite both being brief. */
export function playHoverTick() {
  if (!isSoundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  tone(ctx, 1200, ctx.currentTime, 0.035, 0.018);
}

/** A short two-note confirmation for genuine project activation (click or
 * native keyboard link activation only — never hover/focus/tilt). A touch
 * more substance than playNavClick since opening a project is a bigger
 * commitment than a route change, but still brief and quiet. */
export function playProjectOpen() {
  if (!isSoundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(ctx, 600, now, 0.06, 0.05);
  tone(ctx, 900, now + 0.045, 0.08, 0.05);
}

/** A very brief noise transient — the sonic counterpart callers pair with
 * `triggerGlitch()` at the exact same call site, never called from inside
 * `triggerGlitch()`/`onGlitchTrigger()` itself, so the visual glitch
 * mechanism stays fully independent of audio. Quieter and shorter than
 * playKeyClick's own noise click so it reads as a subtle textural accent
 * under whichever primary command sound played alongside it, not a
 * competing one. */
export function playGlitch() {
  if (!isSoundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  noiseClick(ctx, ctx.currentTime, 0.045, 0.015);
}

/** A quiet, low, slightly longer tone marking the system pipeline settling
 * after a full processing pass. Fired once per pipeline reveal — at the
 * final stage's processing pulse, not per node: playSystemNode already
 * gives every stage its own activation tick, so doubling that up on all
 * six would make the reveal noticeably busier for very little added
 * meaning. This is the more restrained choice, made deliberately. */
export function playSystemPulse() {
  if (!isSoundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  tone(ctx, 300, ctx.currentTime, 0.18, 0.035);
}

/** A single confirmation tone the first time a real scroll milestone is
 * crossed (currently: the hero fully receding past the viewport as the
 * visitor moves into the rest of the page) — never tied to raw scroll
 * position or fired more than once per page-load lifecycle. */
export function playScrollThreshold() {
  if (!isSoundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(ctx, 440, now, 0.1, 0.035);
  tone(ctx, 660, now + 0.08, 0.12, 0.035);
}
