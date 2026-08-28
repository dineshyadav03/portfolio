#!/usr/bin/env node
// Converts a photo into the ASCII portrait shown on the homepage.
// Usage: npm run ascii -- path/to/photo.jpg
//
// Writes lib/asciiPortrait.ts, overwriting the placeholder art.
//
// Pipeline: grayscale -> Otsu threshold to separate subject from background
// -> contrast-stretch the subject's own tonal range -> gamma -> Floyd-
// Steinberg error diffusion into the character ramp, with background
// pixels forced to blank space and excluded from dithering entirely.
//
// Why the threshold step: a straight full-image contrast stretch assumes
// the darkest/brightest pixels in the photo belong to the subject. When
// the backdrop is a large, fairly uniform bright wall (common in phone
// portraits), it dominates the histogram, gets stretched out into a wide
// tonal band, and floods the canvas with midtone characters — the output
// reads as a dense gray wall of texture instead of a face. Segmenting the
// background out first keeps it truly blank so the subject reads clearly
// against it, matching a crisp light-on-dark terminal look.

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
const GAMMA = 0.8; // <1 brightens midtones, helping facial detail survive

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: npm run ascii -- path/to/photo.jpg");
  process.exit(1);
}

const image = await Jimp.read(inputPath);
const rows = Math.max(1, Math.round((image.height / image.width) * COLS * CHAR_ASPECT));
image.resize({ w: COLS, h: rows });

const n = COLS * rows;
const luminance = new Float64Array(n);
const hist = new Array(256).fill(0);
for (let y = 0; y < rows; y++) {
  for (let x = 0; x < COLS; x++) {
    const { r, g, b } = intToRGBA(image.getPixelColor(x, y));
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    luminance[y * COLS + x] = l;
    hist[Math.max(0, Math.min(255, Math.round(l)))] += 1;
  }
}

// Otsu's method: find the luminance threshold that best splits the image
// into two classes (subject vs. background) by minimizing within-class
// variance / maximizing between-class variance.
let sumAll = 0;
for (let i = 0; i < 256; i++) sumAll += i * hist[i];
let wB = 0;
let sumB = 0;
let bestVar = -1;
let threshold = 127;
for (let t = 0; t < 256; t++) {
  wB += hist[t];
  if (wB === 0) continue;
  const wF = n - wB;
  if (wF === 0) break;
  sumB += t * hist[t];
  const mB = sumB / wB;
  const mF = (sumAll - sumB) / wF;
  const between = wB * wF * (mB - mF) * (mB - mF);
  if (between > bestVar) {
    bestVar = between;
    threshold = t;
  }
}

// The lighter side of the split is treated as background. Nudge the cut
// a little into the background band (rather than sitting right on the
// boundary) so its own internal shading/noise still reads as blank.
const bgIsBright = sumAll / n >= threshold;
const cut = bgIsBright ? threshold + 8 : threshold - 8;

let subjLo = 255;
let subjHi = 0;
for (let i = 0; i < n; i++) {
  const l = luminance[i];
  const isSubject = bgIsBright ? l < cut : l > cut;
  if (!isSubject) continue;
  if (l < subjLo) subjLo = l;
  if (l > subjHi) subjHi = l;
}
const range = Math.max(1, subjHi - subjLo);

const levels = RAMP.length - 1;
let art = "";
for (let y = 0; y < rows; y++) {
  let line = "";
  for (let x = 0; x < COLS; x++) {
    const i = y * COLS + x;
    const l = luminance[i];
    const isBackground = bgIsBright ? l >= cut : l <= cut;

    if (isBackground) {
      line += RAMP[0];
      continue; // no dithering — background stays flat blank space
    }

    let v = (l - subjLo) / range;
    v = Math.pow(Math.max(0, Math.min(1, v)), GAMMA);

    const idx = Math.round(v * levels);
    const clamped = Math.max(0, Math.min(levels, idx));
    line += RAMP[clamped];

    // Floyd-Steinberg: push the quantization error into neighboring
    // subject pixels that haven't been visited yet. Errors never bleed
    // into background cells, which stay pure blanks.
    const error = v - clamped / levels;
    const diffuse = (dx, dy, weight) => {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= rows) return;
      const ni = ny * COLS + nx;
      const nl = luminance[ni];
      const neighborIsSubject = bgIsBright ? nl < cut : nl > cut;
      if (!neighborIsSubject) return;
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
console.log(`Wrote ${outPath} (${COLS}x${rows}). Otsu threshold=${threshold}, cut=${cut}, bgIsBright=${bgIsBright}`);
