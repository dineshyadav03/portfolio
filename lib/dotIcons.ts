// Parametric dot-matrix icon bitmaps, in the halftone/LED-display style of
// the boot intro graphic. Each returns a grid of booleans (true = lit dot).

export function globeBitmap(size = 22): boolean[][] {
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  const r = size * 0.43;
  const grid: boolean[][] = [];
  for (let y = 0; y < size; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      let on = Math.sqrt(dx * dx + dy * dy) <= r;
      // Irregular notch cut from the upper-right, like a lit continent/highlight.
      const ndx = x - (cx + size * 0.23);
      const ndy = y - (cy - size * 0.23);
      if (Math.sqrt(ndx * ndx * 1.1 + ndy * ndy * 1.6) <= size * 0.19) on = false;
      row.push(on);
    }
    grid.push(row);
  }
  return grid;
}

export function sadFaceBitmap(size = 22): boolean[][] {
  const cx = (size - 1) / 2;
  const eyeY = Math.round(size * 0.34);
  const eyeHalf = Math.max(1, Math.round(size * 0.06));
  const eyeOffset = Math.round(size * 0.22);
  const mouthY = Math.round(size * 0.62);
  const mouthHalf = size * 0.28;
  const mouthDroop = size * 0.16;

  const grid: boolean[][] = [];
  for (let y = 0; y < size; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < size; x++) {
      let on = false;

      // Two blank-stare square eyes.
      for (const ex of [cx - eyeOffset, cx + eyeOffset]) {
        if (Math.abs(x - ex) <= eyeHalf && Math.abs(y - eyeY) <= eyeHalf) on = true;
      }

      // A downward-drooping frown: corners sit lower than the center.
      const dx = (x - cx) / mouthHalf;
      if (Math.abs(dx) <= 1) {
        const curveY = mouthY + mouthDroop * dx * dx;
        if (Math.abs(y - curveY) < 0.75) on = true;
      }

      row.push(on);
    }
    grid.push(row);
  }
  return grid;
}

export function laptopBitmap(width = 22, height = 20): boolean[][] {
  const grid: boolean[][] = [];
  for (let y = 0; y < height; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < width; x++) {
      let on = false;
      if (y >= 1 && y <= 11 && x >= 5 && x <= 18) {
        on = (y - 1) % 3 !== 2;
      }
      if (y >= 13 && y <= 16 && x >= 1 && x <= 20) {
        on = true;
        if (y === 16 && x >= 18) on = false;
        if (y === 13 && (x <= 2 || x >= 19)) on = false;
      }
      row.push(on);
    }
    grid.push(row);
  }
  return grid;
}
