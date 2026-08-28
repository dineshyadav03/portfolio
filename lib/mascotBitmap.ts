// Original pixel-creature silhouette for the site mascot ("Nia") — a round,
// ear'd blob with two legs, two arms, and a mouth, generated parametrically
// like the other pixel icons on this site (see dotIcons.ts) rather than
// hand-drawn per pixel. 0 = empty, 1 = body, 2 = eye/mouth ink.

export function mascotBitmap(
  width = 19,
  height = 18,
  eyesOpen = true,
  waving = false,
): number[][] {
  const cx = Math.round((width - 1) / 2);
  const legTop = height - 4;
  const legBottom = height - 1;
  const armTop = 9;
  const armBottom = 10;
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

      // Arms: same full-override approach, reaching in far enough to
      // overlap the body silhouette so they read as attached limbs, not
      // floating claws. The right arm swaps to a raised pose while waving.
      const isLeftArm = x <= 2 && y >= armTop && y <= armBottom;
      const isRightArmIdle = !waving && x >= width - 3 && y >= armTop && y <= armBottom;
      const isRightArmRaised = waving && x === width - 3 && y >= 5 && y <= armBottom;
      if (isLeftArm || isRightArmIdle || isRightArmRaised) {
        row.push(1);
        continue;
      }

      let cell = 0;

      // small rounded ears — a plain 2x2 block, not a tapered point, so
      // they read as ears rather than horns.
      if (y <= 1 && ((x >= cx - 5 && x <= cx - 4) || (x >= cx + 4 && x <= cx + 5))) cell = 1;

      // one big rounded body (wide oval), stopping short of the leg band
      const bodyCy = height * 0.42;
      const rx = width * 0.36;
      const ry = height * 0.36;
      const nx = (x - cx) / rx;
      const ny = (y - bodyCy) / ry;
      if (nx * nx + ny * ny <= 1 && y >= 2) cell = 1;

      row.push(cell);
    }
    grid.push(row);
  }

  const eyeRow = Math.round(height * 0.3);

  if (eyesOpen) {
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

  // A small mouth a few rows below the eyes — visible through blinks, since
  // it isn't tied to the eyesOpen toggle.
  const mouthRow = eyeRow + 3;
  for (const dx of [-1, 0, 1]) {
    const xx = cx + dx;
    if (grid[mouthRow]?.[xx] === 1) grid[mouthRow][xx] = 2;
  }

  return grid;
}
