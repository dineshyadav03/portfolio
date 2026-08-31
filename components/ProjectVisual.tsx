"use client";

import type { CSSProperties } from "react";
import { useReducedMotion } from "framer-motion";
import { ICOSAHEDRON_EDGES, ICOSAHEDRON_VERTICES, project, rotate } from "@/lib/spatialGeometry";
import { createRng, hashSeed } from "@/lib/deterministicRandom";
import styles from "./ProjectVisual.module.css";

const W = 200;
const H = 120;
type Mode = "nodes" | "wireframe" | "grid" | "orbit" | "flow";

// Two real, data-grounded buckets rather than five interchangeable modes —
// "structural" (wireframe/grid read as a single, precise, contained form)
// vs "system" (nodes/orbit/flow all read as an ongoing, multi-stage
// process). This maps to the one distinction the actual project data
// already makes: `project.status` set means a scoped external contribution
// (a targeted bug fix landed into someone else's codebase), unset means an
// owned, built system. Nothing invented — every project already carries
// this signal via its `status` field (see lib/content.ts) and its own
// status pill already displays it in text; this just makes the same real
// distinction visible in the procedural visual too, instead of the visual
// being unrelated to what the project actually is.
const STRUCTURAL_MODES = ["wireframe", "grid"] as const;
const SYSTEM_MODES = ["nodes", "orbit", "flow"] as const;

/** Deterministically picks a visual mode from its own name, within the
 * bucket appropriate to what kind of project it is — same project, same
 * mode, forever. */
function pickMode(seed: string, structural: boolean): Mode {
  const pool = structural ? STRUCTURAL_MODES : SYSTEM_MODES;
  return pool[hashSeed(seed) % pool.length];
}

function Nodes({ seed }: { seed: string }) {
  const rng = createRng(seed);
  const margin = 16;
  const count = 6 + Math.floor(rng() * 3); // 6-8
  const points = Array.from({ length: count }, () => ({
    x: margin + rng() * (W - margin * 2),
    y: margin + rng() * (H - margin * 2),
  }));
  // Connect each node to its 2 nearest neighbors — enough to read as a
  // network without every node connecting to every other one.
  const edges: [number, number][] = [];
  points.forEach((p, i) => {
    const dists = points
      .map((q, j) => ({ j, d: Math.hypot(p.x - q.x, p.y - q.y) }))
      .filter((e) => e.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    for (const { j } of dists) {
      const key: [number, number] = i < j ? [i, j] : [j, i];
      if (!edges.some(([a, b]) => a === key[0] && b === key[1])) edges.push(key);
    }
  });
  return (
    <>
      {edges.map(([a, b], i) => (
        <line key={i} className={styles.stroke} x1={points[a].x} y1={points[a].y} x2={points[b].x} y2={points[b].y} />
      ))}
      {points.map((p, i) => (
        <circle key={i} className={i % 3 === 0 ? styles.dotAccent : styles.dot} cx={p.x} cy={p.y} r={i % 3 === 0 ? 2.6 : 1.8} />
      ))}
    </>
  );
}

function Wireframe({ seed }: { seed: string }) {
  const rng = createRng(seed);
  const angleX = rng() * Math.PI * 2;
  const angleY = rng() * Math.PI * 2;
  const cx = W / 2;
  const cy = H / 2;
  const cameraDistance = 4.2;
  const focal = H * 1.1;
  const scale = H * 0.4;
  const projected = ICOSAHEDRON_VERTICES.map((v) => {
    const r = rotate(v, angleX, angleY);
    const p = project(r, cameraDistance, focal);
    return { x: p.x * (scale / focal), y: p.y * (scale / focal), depth: r[2] };
  });
  const depths = projected.map((p) => p.depth);
  const minD = Math.min(...depths);
  const maxD = Math.max(...depths);
  const norm = (d: number) => (maxD === minD ? 0.5 : (d - minD) / (maxD - minD));
  return (
    // The pointer nudges the camera orientation a few degrees — "pointer
    // changes perspective," not a spin. `--nx`/`--ny` are written once per
    // frame onto the tile's visualWrap ancestor by CreationsList's existing
    // pointer handler; this group just reads them, no listener of its own.
    <g className={styles.wireGroup}>
      {ICOSAHEDRON_EDGES.map(([a, b], i) => (
        <line
          key={i}
          className={styles.stroke}
          style={{ opacity: 0.35 + ((norm(projected[a].depth) + norm(projected[b].depth)) / 2) * 0.5 }}
          x1={cx + projected[a].x}
          y1={cy + projected[a].y}
          x2={cx + projected[b].x}
          y2={cy + projected[b].y}
        />
      ))}
      {projected.map((p, i) => (
        <circle key={i} className={norm(p.depth) > 0.6 ? styles.dotAccent : styles.dot} cx={cx + p.x} cy={cy + p.y} r={1.4 + norm(p.depth) * 1.6} />
      ))}
    </g>
  );
}

function Grid({ seed }: { seed: string }) {
  const rng = createRng(seed);
  const cols = 9;
  const rows = 4;
  const marginX = 12;
  const marginY = 18;
  const rowPhases = Array.from({ length: rows }, () => rng() * Math.PI * 2);
  const rowAmps = Array.from({ length: rows }, () => 6 + rng() * 10);
  const mid = (rows - 1) / 2;
  const lines = Array.from({ length: rows }, (_, r) => {
    const y0 = marginY + (r / (rows - 1)) * (H - marginY * 2);
    const pts = Array.from({ length: cols }, (_, c) => {
      const x = marginX + (c / (cols - 1)) * (W - marginX * 2);
      const y = y0 + Math.sin((c / (cols - 1)) * Math.PI * 2 + rowPhases[r]) * rowAmps[r] * 0.3;
      return `${x},${y}`;
    });
    // A per-row deformation weight — middle rows bend most toward/away
    // from the pointer, outer rows least, so the whole grid reads as a
    // sheet flexing around a localized point rather than every line
    // translating in lockstep. Static per row (computed once at render);
    // combined at paint time with the live `--ny` the pointer writes.
    const bias = 1 - Math.abs(r - mid) / mid;
    return { pts: pts.join(" "), bias };
  });
  return (
    <>
      {lines.map(({ pts, bias }, i) => (
        <polyline
          key={i}
          className={i === Math.floor(rows / 2) ? styles.strokeAccent : styles.stroke}
          points={pts}
          style={{ "--row-bias": bias } as CSSProperties}
        />
      ))}
    </>
  );
}

function Orbit({ seed }: { seed: string }) {
  const rng = createRng(seed);
  const cx = W / 2;
  const cy = H / 2;
  const rings = [0.28, 0.42, 0.56].map((f) => H * f);
  return (
    <>
      {rings.map((r, i) => {
        // Outer rings respond more than inner ones — "different orbital
        // layers respond at different strengths," a cheap but genuine
        // depth cue since the ring geometry itself never changes.
        const bias = (i + 1) / rings.length;
        return (
          <ellipse
            key={i}
            className={styles.stroke}
            cx={cx}
            cy={cy}
            rx={r}
            ry={r * 0.42}
            style={{ "--ring-bias": bias } as CSSProperties}
          />
        );
      })}
      <circle className={styles.dotAccent} cx={cx} cy={cy} r={2.4} />
      {rings.map((r, i) => {
        const angle = rng() * Math.PI * 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r * 0.42;
        return <circle key={i} className={styles.dotAccent} cx={x} cy={y} r={2.2} />;
      })}
    </>
  );
}

function Flow({ seed, reduced }: { seed: string; reduced: boolean | null }) {
  const rng = createRng(seed);
  const margin = 14;
  const pointCount = 5;
  const points = Array.from({ length: pointCount }, (_, i) => ({
    x: margin + (i / (pointCount - 1)) * (W - margin * 2),
    y: margin + rng() * (H - margin * 2),
  }));
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const midX = (prev.x + cur.x) / 2;
    d += ` Q ${midX} ${prev.y} ${midX} ${(prev.y + cur.y) / 2} T ${cur.x} ${cur.y}`;
  }
  // A deterministic per-project pace (2.5-4s) rather than one fixed speed
  // for every "flow" project — same seed, same pace, forever.
  const duration = 2.5 + (hashSeed(`${seed}-flow-pace`) % 10) * 0.15;
  return (
    // A small local perturbation of the whole field, standing in for
    // "pointer creates a local disturbance in the vector field" without
    // actually recomputing the field per frame in JS.
    <g className={styles.flowGroup}>
      <path className={styles.strokeAccent} d={d} />
      {points.map((p, i) => (
        <circle key={i} className={styles.dot} cx={p.x} cy={p.y} r={1.6} />
      ))}
      {/* "Flow" is the one mode explicitly about directional movement, so
          it's the one mode that gets the cross-component "signal traveling
          through a system" language SpatialObject/CapabilitySystem already
          use — native SVG animateMotion, no per-frame JS, omitted entirely
          under reduced motion rather than just paused. */}
      {!reduced && (
        <circle className={styles.dotAccent} r={1.8}>
          <animateMotion dur={`${duration}s`} repeatCount="indefinite" path={d} />
        </circle>
      )}
    </g>
  );
}

// A project's procedural visual identity — one of five deterministic
// geometric modes chosen from its own name, never randomness at runtime.
// Every mode is built from the same restrained line/dot vocabulary the
// rest of the site already uses (DotField, SystemPipeline, SpatialObject),
// just arranged differently, so five projects read as one coherent visual
// system rather than five unrelated decorations. Purely decorative — the
// project's name/description/stack already carry the real information —
// so it's hidden from assistive technology.
export default function ProjectVisual({
  seed,
  status,
}: {
  seed: string;
  /** The project's real `status` field (lib/content.ts) — "merged"/"open"
   *  for a scoped external contribution, undefined for an owned build.
   *  Nothing else is inferred from it; a made-up "stage" vocabulary isn't
   *  supported by the data this site actually has (Pass 16 diagnostic). */
  status?: "merged" | "open";
}) {
  const structural = Boolean(status);
  const mode = pickMode(seed, structural);
  const reduced = useReducedMotion();
  // A merged contribution is a real, settled fact — it's done, reviewed,
  // shipped. An open one is still under review. That's the one honest
  // "how active does this feel" signal the actual data supports, so a
  // merged project's pointer response is dialed down slightly (--settle)
  // rather than reading exactly as active as everything still in motion.
  const settled = status === "merged";
  return (
    <svg
      className={styles.visual}
      data-mode={mode}
      data-settled={settled || undefined}
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden="true"
    >
      {mode === "nodes" && <Nodes seed={seed} />}
      {mode === "wireframe" && <Wireframe seed={seed} />}
      {mode === "grid" && <Grid seed={seed} />}
      {mode === "orbit" && <Orbit seed={seed} />}
      {mode === "flow" && <Flow seed={seed} reduced={reduced} />}
    </svg>
  );
}
