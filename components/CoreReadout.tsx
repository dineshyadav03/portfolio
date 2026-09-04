"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { ICOSAHEDRON_EDGES, ICOSAHEDRON_VERTICES } from "@/lib/spatialGeometry";
import { getSpatialEnergy } from "@/lib/spatialEnergy";
import styles from "./CoreReadout.module.css";

// Pass 35: CoreLog/HeroVectorSpace/HeroNeuralNet (the fuller HUD panels in
// the side margins) are still gated to wide viewports — there just isn't
// real margin to put them in below that, not a preference. But that left
// every visitor under that width with nothing beside CORE ONLINE at all:
// the object sitting alone with no "this is a live system" cue whatsoever.
// This is that cue's compact form — the same real energy/lattice numbers
// CoreLog reads from the same shared stores, condensed to one quiet line
// instead of a four-line panel, and shown ONLY below the side panels' own
// threshold (see CoreReadout.module.css) so a wide viewport never sees
// both the compact and the full version of the same fact at once.
const UPDATE_MS = 400;

export default function CoreReadout({ ready, skipEntrance }: { ready: boolean; skipEntrance: boolean }) {
  const reduced = useReducedMotion();
  const energyRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reduced || !ready) return;
    const id = window.setInterval(() => {
      if (energyRef.current) energyRef.current.textContent = getSpatialEnergy().toFixed(2);
    }, UPDATE_MS);
    return () => window.clearInterval(id);
  }, [reduced, ready]);

  if (!ready && !reduced) return null;

  return (
    <p className={styles.readout} aria-hidden="true" data-skip-entrance={skipEntrance || undefined}>
      <span className={styles.label}>energy</span>{" "}
      <span ref={energyRef} className={styles.value}>
        0.00
      </span>
      <span className={styles.sep}>·</span>
      <span className={styles.label}>lattice</span>{" "}
      <span className={styles.value}>
        {ICOSAHEDRON_VERTICES.length}v · {ICOSAHEDRON_EDGES.length}e
      </span>
    </p>
  );
}
