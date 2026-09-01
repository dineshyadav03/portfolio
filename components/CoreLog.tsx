"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { ICOSAHEDRON_EDGES, ICOSAHEDRON_VERTICES } from "@/lib/spatialGeometry";
import { getScrollVelocity } from "@/lib/scrollVelocity";
import { getSpatialEnergy } from "@/lib/spatialEnergy";
import styles from "./CoreLog.module.css";

// A small HUD-style readout overlaid on the hero object — the "this is a
// live system, not a static image" cue the terminal-movie ask was after,
// built from real numbers instead of invented AI/ML flavor text (there's
// no model actually running behind this page). ENERGY and VELOCITY are
// the exact values already driving SpatialObject's own glow/rotation —
// read via the shared stores it publishes to, not a second, independent
// "how active does the system look" calculation. LATTICE is a static,
// genuinely true fact about the geometry being rendered. Text updates on
// a throttled interval (not per-frame) — a HUD readout, not something
// that needs 60fps precision.
const UPDATE_MS = 400;
const SPINNER_FRAMES = ["|", "/", "-", "\\"];
const SPINNER_MS = 220;

export default function CoreLog({ ready, skipEntrance }: { ready: boolean; skipEntrance: boolean }) {
  const reduced = useReducedMotion();
  const energyRef = useRef<HTMLSpanElement>(null);
  const velocityRef = useRef<HTMLSpanElement>(null);
  const spinnerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reduced || !ready) return;
    let spinnerFrame = 0;
    const dataId = window.setInterval(() => {
      if (energyRef.current) energyRef.current.textContent = getSpatialEnergy().toFixed(2);
      if (velocityRef.current) velocityRef.current.textContent = Math.abs(getScrollVelocity()).toFixed(2);
    }, UPDATE_MS);
    const spinnerId = window.setInterval(() => {
      spinnerFrame = (spinnerFrame + 1) % SPINNER_FRAMES.length;
      if (spinnerRef.current) spinnerRef.current.textContent = SPINNER_FRAMES[spinnerFrame];
    }, SPINNER_MS);
    return () => {
      window.clearInterval(dataId);
      window.clearInterval(spinnerId);
    };
  }, [reduced, ready]);

  if (!ready && !reduced) return null;

  return (
    <div className={styles.log} aria-hidden="true" data-skip-entrance={skipEntrance || undefined}>
      <p className={styles.line}>
        <span className={styles.label}>energy</span>
        <span ref={energyRef} className={styles.value}>
          0.00
        </span>
      </p>
      <p className={styles.line}>
        <span className={styles.label}>velocity</span>
        <span ref={velocityRef} className={styles.value}>
          0.00
        </span>
      </p>
      <p className={styles.line}>
        <span className={styles.label}>lattice</span>
        <span className={styles.value}>
          {ICOSAHEDRON_VERTICES.length}v · {ICOSAHEDRON_EDGES.length}e
        </span>
      </p>
      {!reduced && (
        <p className={styles.line}>
          <span className={styles.spinner} ref={spinnerRef}>
            |
          </span>
        </p>
      )}
    </div>
  );
}
