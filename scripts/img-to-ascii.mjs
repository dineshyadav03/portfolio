#!/usr/bin/env node
// Converts a photo into the ASCII portrait shown on the homepage.
// Usage: npm run ascii -- path/to/photo.jpg
//
// Writes lib/asciiPortrait.ts, overwriting the placeholder art.
//
// Pipeline: grayscale -> contrast-stretch (uses the image's actual tonal
// range instead of assuming 0-255) -> gamma -> Floyd-Steinberg error
// diffusion dithering into the character ramp. Straight brightness->ramp
// indexing (the old approach) collapses low-contrast photos into a gray
// blob; dithering is what makes small ASCII art actually read as a face.

import { Jimp, intToRGBA } from "jimp";
import { writeFile } from "node:fs/promises";
import path from "node:path";

// Density-ordered character ramp (light -> heavy ink coverage in a
// monospace font), so gradients get far more steps than a handful of
// symbols can express — letters and digits carry real tonal weight too.
const RAMP =
  " .'`,:;~-_+<>i!lI?/\\|()1{}[]rcvunxzjftLCJUYXZO0Qmwqpdbkhao*#MW&8%B@";
// Terminal glyphs are roughly twice as tall as they are wide, so sample
// fewer rows than columns to keep the output looking proportional.
const COLS = 64;
const CHAR_ASPECT = 0.48;
const GAMMA = 0.85; // <1 brightens midtones, helping facial detail survive

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: npm run ascii -- path/to/photo.jpg");
  process.exit(1);
}

const image = await Jimp.read(inputPath);
const rows = Math.max(1, Math.round((image.height / image.width) * COLS * CHAR_ASPECT));
image.resize({ w: COLS, h: rows });

// Sample raw luminance for every pixel first, so we can contrast-stretch
// against this photo's actual min/max instead of the theoretical 0-255.
const luminance = new Float64Array(COLS * rows);
let lo = 255;
let hi = 0;
for (let y = 0; y < rows; y++) {
  for (let x = 0; x < COLS; x++) {
    const { r, g, b } = intToRGBA(image.getPixelColor(x, y));
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    luminance[y * COLS + x] = l;
    if (l < lo) lo = l;
    if (l > hi) hi = l;
  }
}
const range = Math.max(1, hi - lo);

const levels = RAMP.length - 1;
let art = "";
for (let y = 0; y < rows; y++) {
  let line = "";
  for (let x = 0; x < COLS; x++) {
    const i = y * COLS + x;
    // Contrast-stretch to 0..1, then gamma-correct.
    let v = (luminance[i] - lo) / range;
    v = Math.pow(Math.max(0, Math.min(1, v)), GAMMA);

    const idx = Math.round(v * levels);
    const clamped = Math.max(0, Math.min(levels, idx));
    line += RAMP[clamped];

    // Floyd-Steinberg: push the quantization error into neighboring
    // pixels that haven't been visited yet.
    const error = v - clamped / levels;
    const diffuse = (dx, dy, weight) => {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= rows) return;
      const ni = ny * COLS + nx;
      // Errors are diffused in the 0..1 normalized space by re-deriving
      // an equivalent luminance nudge.
      luminance[ni] += error * weight * range;
    };
    diffuse(1, 0, 7 / 16);
    diffuse(-1, 1, 3 / 16);
    diffuse(0, 1, 5 / 16);
    diffuse(1, 1, 1 / 16);
  }
  art += line.replace(/\s+$/, "") + "\n";
}
art = art.trimEnd();

const escaped = art.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

const outPath = path.resolve("lib/asciiPortrait.ts");
const contents = `// ASCII portrait generated from ${path.basename(inputPath)} via \`npm run ascii\`.
// Re-run \`npm run ascii -- path/to/photo.jpg\` any time to regenerate.

export const asciiPortrait = \`${escaped}\`;
`;

await writeFile(outPath, contents, "utf8");
console.log(`Wrote ${outPath} (${COLS}x${rows}).`);
