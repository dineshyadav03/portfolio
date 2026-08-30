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

// A bird in flight: a bent two-segment wing (shoulder -> elbow -> tip, like
// a real wing joint) on each side, a solid body, a head with a beak, and a
// fanned tail. Two frames (up/down) meant to be alternated quickly to read
// as a flap cycle.
export function birdBitmap(width = 34, height = 18, wingsUp = true): boolean[][] {
  const cx = Math.round((width - 1) / 2);
  const bodyY = Math.round(height * 0.58);
  const bodyRx = 3.2;
  const bodyRy = 2.1;
  const halfSpan = Math.floor(width / 2) - 2; // leaves room for the head/beak
  const grid: boolean[][] = Array.from({ length: height }, () => new Array(width).fill(false));

  const setDot = (x: number, y: number) => {
    if (x >= 0 && x < width && y >= 0 && y < height) grid[y][x] = true;
  };

  const fillDisc = (dcx: number, dcy: number, r: number) => {
    for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) {
      for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
        if (dx * dx + dy * dy <= r * r) setDot(dcx + dx, dcy + dy);
      }
    }
  };

  // Draws a straight, tapered band from (fromDx, fromY) to (toDx, toY),
  // both relative to the body center, thickness interpolated along it.
  const drawSegment = (
    fromDx: number,
    fromY: number,
    toDx: number,
    toY: number,
    thickStart: number,
    thickEnd: number,
  ) => {
    const steps = Math.max(1, Math.round(Math.abs(toDx - fromDx)));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const dx = fromDx + (toDx - fromDx) * t;
      const y = fromY + (toY - fromY) * t;
      const thickness = thickStart + (thickEnd - thickStart) * t;
      const half = thickness / 2;
      for (let o = -Math.floor(half); o <= Math.ceil(half) - 1; o++) {
        setDot(cx + Math.round(dx), Math.round(y) + o);
      }
    }
  };

  for (const side of [-1, 1]) {
    const elbowDx = side * Math.round(halfSpan * 0.42);
    const elbowY = wingsUp ? bodyY - height * 0.22 : bodyY + height * 0.14;
    const tipDx = side * halfSpan;
    const tipY = wingsUp ? bodyY - height * 0.62 : bodyY + height * 0.5;
    drawSegment(0, bodyY, elbowDx, elbowY, 3.6, 2.6);
    drawSegment(elbowDx, elbowY, tipDx, tipY, 2.6, 1);
  }

  // Solid body, drawn last so it reads as the torso mass over the wing roots.
  for (let dyi = -Math.ceil(bodyRy); dyi <= Math.ceil(bodyRy); dyi++) {
    for (let dxi = -Math.ceil(bodyRx); dxi <= Math.ceil(bodyRx); dxi++) {
      const nx = dxi / bodyRx;
      const ny = dyi / bodyRy;
      if (nx * nx + ny * ny <= 1) setDot(cx + dxi, bodyY + dyi);
    }
  }

  // Head + beak ahead of the body (direction of flight).
  const headCx = cx + Math.ceil(bodyRx) + 1;
  fillDisc(headCx, bodyY - 1, 1.3);
  setDot(headCx + 2, bodyY - 1);

  // A small fanned tail behind the body.
  const tailX = cx - Math.ceil(bodyRx) - 1;
  setDot(tailX, bodyY - 2);
  setDot(tailX, bodyY - 1);
  setDot(tailX, bodyY + 1);
  setDot(tailX, bodyY + 2);
  setDot(tailX - 1, bodyY);

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
