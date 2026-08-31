// Shared frame-rate-independent motion primitives. Deliberately small — only
// utilities actually reused across SpatialObject, CreationsList, and
// CapabilitySystem live here, not a general-purpose animation library.

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

// Exponential decay toward `target` — the frame-rate-independent replacement
// for `current += (target - current) * fixedFraction`, which silently speeds
// up or slows down with the monitor's refresh rate. `lambda` is roughly "how
// many times per second the gap halves-ish" (higher = snappier); `dt` is the
// real elapsed seconds since the last frame. See Freya Holmér, "Exponential
// decay is smoother than lerp" — same shape, but correct under a variable
// frame rate instead of only looking right at 60fps.
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return target + (current - target) * Math.exp(-lambda * dt);
}

export function mapRange(v: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  const t = (v - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}
