// Same pattern as lib/scrollVelocity.ts — a tiny, render-free store, not a
// React state channel. SpatialObject already computes a real "energy"
// value every frame (kicked by pointer proximity and the boot-ready
// handoff, decaying via damp() otherwise) to brighten its own wireframe;
// this just publishes that same real number so something else (CoreLog)
// can read it without a second, independent computation of "how active
// is the system right now."
let current = 0; // 0..1

export function setSpatialEnergy(v: number) {
  current = v;
}

export function getSpatialEnergy(): number {
  return current;
}
