// Pure 3D math for SpatialObject.tsx — no rendering, no DOM, no dependency.
// A regular icosahedron: 12 vertices, 30 edges, each vertex equidistant
// from its 5 neighbors. Chosen over an arbitrary "architectural" box stack
// because its edges are uniform (nothing to art-direct by hand) and its
// silhouette reads simultaneously as a structural frame, a molecular/
// network diagram, and a geodesic mass — the exact "computational
// geometry meets architecture" reading this component exists for.

export type Vec3 = [number, number, number];
export type Edge = [number, number];

const PHI = (1 + Math.sqrt(5)) / 2;

// Unnormalized icosahedron vertices (golden-ratio construction), then
// scaled to unit radius so callers can multiply by a single "size" value.
const RAW_VERTICES: Vec3[] = [
  [-1, PHI, 0],
  [1, PHI, 0],
  [-1, -PHI, 0],
  [1, -PHI, 0],
  [0, -1, PHI],
  [0, 1, PHI],
  [0, -1, -PHI],
  [0, 1, -PHI],
  [PHI, 0, -1],
  [PHI, 0, 1],
  [-PHI, 0, -1],
  [-PHI, 0, 1],
];

const RADIUS = Math.sqrt(1 + PHI * PHI);
export const ICOSAHEDRON_VERTICES: Vec3[] = RAW_VERTICES.map(
  ([x, y, z]) => [x / RADIUS, y / RADIUS, z / RADIUS] as Vec3,
);

// Every vertex of a regular icosahedron connects to exactly its 5 nearest
// neighbors. Deriving the edge list by distance (rather than transcribing
// one by hand) means it's structurally guaranteed correct for these
// vertices — there's no separate hardcoded list that could silently drift
// out of sync with the coordinates above.
export const ICOSAHEDRON_EDGES: Edge[] = (() => {
  const n = ICOSAHEDRON_VERTICES.length;
  const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const dists: number[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      dists.push(dist(ICOSAHEDRON_VERTICES[i], ICOSAHEDRON_VERTICES[j]));
    }
  }
  const minDist = Math.min(...dists);
  const edges: Edge[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (dist(ICOSAHEDRON_VERTICES[i], ICOSAHEDRON_VERTICES[j]) <= minDist * 1.01) {
        edges.push([i, j]);
      }
    }
  }
  return edges;
})();

/** Rotates a point around the Y axis then the X axis (in radians). */
export function rotate([x, y, z]: Vec3, angleX: number, angleY: number): Vec3 {
  const cosY = Math.cos(angleY);
  const sinY = Math.sin(angleY);
  const x1 = x * cosY + z * sinY;
  const z1 = -x * sinY + z * cosY;

  const cosX = Math.cos(angleX);
  const sinX = Math.sin(angleX);
  const y2 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;

  return [x1, y2, z2];
}

/** Simple perspective projection: a point further from the camera (larger
 * `z` after the `cameraDistance` offset) maps closer to the vanishing
 * point and gets a smaller `scale` — used by the caller to fade/shrink
 * distant vertices for a genuine depth cue without any lighting model. */
export function project(
  [x, y, z]: Vec3,
  cameraDistance: number,
  focalLength: number,
): { x: number; y: number; scale: number } {
  const denom = cameraDistance + z;
  const scale = focalLength / Math.max(denom, 0.0001);
  return { x: x * scale, y: y * scale, scale };
}
