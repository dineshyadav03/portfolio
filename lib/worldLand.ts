// Real Earth coastlines for the contact globe — see worldLandGrid.ts for
// provenance (Natural Earth 110m data, public domain) and
// scripts/gen-world-land.mjs for how it was generated. A 1-degree
// land/ocean grid, not a hand-approximated shape.
import { WORLD_GRID_B64, WORLD_GRID_COLS, WORLD_GRID_ROWS } from "./worldLandGrid";

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

const grid = base64ToBytes(WORLD_GRID_B64);

export function isLand(lat: number, lon: number): boolean {
  const row = Math.min(WORLD_GRID_ROWS - 1, Math.max(0, Math.floor(90 - lat)));
  let col = Math.floor(lon + 180);
  col = ((col % WORLD_GRID_COLS) + WORLD_GRID_COLS) % WORLD_GRID_COLS;
  const idx = row * WORLD_GRID_COLS + col;
  return (grid[idx >> 3] & (1 << (idx & 7))) !== 0;
}

// Real coordinates — the commonly-cited geographic center of India
// (Nagpur / Vidarbha region, Madhya Pradesh border) — Dinesh's actual
// location per lib/content.ts's `profile.location`.
export const HOME_MARKER = { lat: 20.5937, lon: 78.9629, label: "India" };
