// Original pixel-creature silhouette for the site mascot ("Nia") — a round,
// ear'd blob with two legs, generated parametrically like the other pixel
// icons on this site (see dotIcons.ts) rather than hand-drawn per pixel.
// 0 = empty, 1 = body, 2 = eye.

export function mascotBitmap(width = 17, height = 18, eyesOpen = true): number[][] {
  const cx = Math.round((width - 1) / 2);
  const legTop = height - 4;
  const legBottom = height - 1;
  const grid: number[][] = [];

  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      // The leg band is fully overridden (not just added to) so the body's
      // tapering bottom edge can't leak a stray pixel into the leg gap.
      if (y >= legTop && y <= legBottom) {
        const isLeg = (x >= cx - 4 && x <= cx - 2) || (x >= cx + 2 && x <= cx + 4);
        row.push(isLeg ? 1 : 0);
        continue;
      }

      let cell = 0;

      // small round ears
      if (y === 0 && (x === cx - 4 || x === cx + 4)) cell = 1;
      if (y === 1 && ((x >= cx - 4 && x <= cx - 3) || (x >= cx + 3 && x <= cx + 4))) cell = 1;

      // one big rounded body (wide oval), stopping short of the leg band
      const bodyCy = height * 0.42;
      const rx = width * 0.42;
      const ry = height * 0.36;
      const nx = (x - cx) / rx;
      const ny = (y - bodyCy) / ry;
      if (nx * nx + ny * ny <= 1 && y >= 2) cell = 1;

      row.push(cell);
    }
    grid.push(row);
  }

  if (eyesOpen) {
    const eyeRow = Math.round(height * 0.3);
    const eyeOffset = 3;
    for (const dx of [-eyeOffset, eyeOffset]) {
      for (const dy of [0, 1]) {
        const yy = eyeRow + dy;
        const xx = cx + dx;
        if (grid[yy]?.[xx] === 1) grid[yy][xx] = 2;
        if (grid[yy]?.[xx - 1] === 1) grid[yy][xx - 1] = 2;
      }
    }
  }

  return grid;
}
