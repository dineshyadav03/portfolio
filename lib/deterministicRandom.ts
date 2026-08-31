// Shared seeded-randomness primitive — deliberately the only hash/PRNG
// implementation in the codebase (lib/signatureGlyph.ts and
// components/ProjectVisual.tsx both build on this) rather than each
// procedural visual reinventing its own. Every "random" value here is
// fully deterministic: the same seed string always produces the same
// sequence, forever — that's the entire point (a project's visual
// identity must never change between renders or reloads).

// FNV-1a — fast, deterministic across runs/browsers.
export function hashSeed(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Returns a `next(): number` generator producing values in [0, 1),
 * seeded from `seed` (a string, hashed via hashSeed) or a raw 32-bit
 * integer. xorshift32 — small, fast, good enough spread for visual
 * variety without needing real cryptographic randomness. */
export function createRng(seed: string | number) {
  let state = (typeof seed === "string" ? hashSeed(seed) : seed >>> 0) || 1;
  return function next(): number {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0xffffffff;
  };
}
