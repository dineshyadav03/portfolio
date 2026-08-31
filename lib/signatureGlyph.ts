// Deterministic, per-project "signature" pattern — the visual identity
// each Creations tile carries instead of a photo/screenshot (there are
// none, and inventing one would violate the site's no-fake-assets rule).
// Same input string always produces the same output: a seeded PRNG feeds
// a 5x5 grid, mirrored left-right like a classic identicon, so it reads
// as a deliberate mark rather than noise. Renders through the same
// DotIcon component the wordmark already uses. Built on the shared
// lib/deterministicRandom.ts primitive — see components/ProjectVisual.tsx
// for the richer, multi-mode procedural visual this glyph now sits
// alongside on each Creations tile.

import { createRng } from "./deterministicRandom";

const COLS = 5;
const ROWS = 5;
const UNIQUE_COLS = 3; // columns 0-2 are generated; 3 mirrors 1, 4 mirrors 0

export function signatureGlyph(seed: string): boolean[][] {
  const next = createRng(seed);
  const grid: boolean[][] = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < UNIQUE_COLS; c++) {
      const on = next() > 0.52;
      grid[r][c] = on;
      if (c < UNIQUE_COLS - 1) grid[r][COLS - 1 - c] = on;
    }
  }
  return grid;
}
