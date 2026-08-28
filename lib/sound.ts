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
