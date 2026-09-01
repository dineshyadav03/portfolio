"use client";

import { useEffect, useRef } from "react";
import { type MotionValue, useReducedMotion } from "framer-motion";
import { ICOSAHEDRON_EDGES, ICOSAHEDRON_VERTICES, project, rotate, type Vec3 } from "@/lib/spatialGeometry";
import { createRng } from "@/lib/deterministicRandom";
import { clamp, damp, distance, smoothstep } from "@/lib/physics";
import { getScrollVelocity } from "@/lib/scrollVelocity";
import { setSpatialEnergy } from "@/lib/spatialEnergy";
import { hasSystemEverBeenReady, onSystemStatusChange } from "@/lib/systemStatus";
import { onThemeChange } from "@/lib/theme";
import styles from "./SpatialObject.module.css";

// The site's one dedicated 3D element — a slowly tumbling wireframe node
// lattice, hand-projected onto a 2D canvas rather than pulled in via a 3D
// library. No mesh, no lighting model, no texture: just the same "dots
// connected by lines" vocabulary DotField/SystemPipeline already use,
// extended into genuine rotation, depth, and — as of Pass 13 — layered
// parallax, physically-damped pointer response, and localized proximity
// emphasis. Reacts gently to the pointer (fine-pointer devices only) and,
// optionally, to a scroll MotionValue from the caller.
const BASE_SPEED_Y = 0.12; // rad/s — primary structure
const BASE_SPEED_X = 0.045; // rad/s
const SECONDARY_SPEED_MUL = 0.4; // secondary layer turns slower than the primary — the speed differential IS the parallax cue
const MAX_POINTER_TILT = 0.36; // rad
const POINTER_LAMBDA = 5.2; // damp() rate — replaces the old fixed-fraction-per-frame ease with a frame-rate-independent exponential settle. See lib/motion.ts's `SPRING.soft`.
const CAMERA_DISTANCE = 4.4;
const STATIC_ANGLE: [number, number] = [0.5, 0.7]; // a designed resting pose — used verbatim under reduced motion
const INTRO_MS = 650; // primary structure resolves in over this window after mount
const SECONDARY_INTRO_DELAY_MS = 180; // secondary layer lags the primary in, reinforcing "it's a separate, further layer"
const PROXIMITY_RADIUS_FACTOR = 0.4; // fraction of canvas size within which the pointer locally emphasizes nearby geometry
const VELOCITY_LAMBDA = 4.5; // damp() rate for the scroll-velocity contribution — settles noticeably slower than the pointer tilt, so a fling reads as the object still carrying momentum a moment after the hand stops
const VELOCITY_TILT = 0.5; // rad of extra Y-rotation at maximum (normalized) scroll velocity
const ENERGY_LAMBDA = 3.2; // slower than either tilt damp — energy should visibly linger and decay, not track instantly
const ENERGY_BRIGHTNESS = 0.32; // max extra edge/node brightness at full energy

// A handful of deterministic satellite points on a slightly larger shell
// than the primary icosahedron — a second spatial layer, not a copy of the
// first. Fixed at module scope (computed once, not per render/frame): same
// seed, same layer, forever.
const SECONDARY_COUNT = 6;
const secondaryRng = createRng("spatial-secondary-layer");
const SECONDARY_POINTS: Vec3[] = Array.from({ length: SECONDARY_COUNT }, () => {
  const theta = secondaryRng() * Math.PI * 2;
  const phi = Math.acos(2 * secondaryRng() - 1);
  const r = 1.55 + secondaryRng() * 0.35;
  return [r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)] as Vec3;
});
// Each secondary point nearest-links to whichever primary vertex it's
// closest to at its own base orientation — a thin, sparse connective layer
// rather than a second dense mesh.
const SECONDARY_LINKS: number[] = SECONDARY_POINTS.map((p) => {
  let best = 0;
  let bestD = Infinity;
  ICOSAHEDRON_VERTICES.forEach((v, i) => {
    const d = Math.hypot(p[0] - v[0], p[1] - v[1], p[2] - v[2]);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
});

// A small number of edges get a slow traveling signal packet — picked
// once, deterministically, not re-rolled per render. Three is enough to
// read as "the system is live" without turning into particle noise.
const PACKET_COUNT = 3;
const packetRng = createRng("spatial-signal-packets");
const PACKETS = Array.from({ length: PACKET_COUNT }, () => ({
  edge: ICOSAHEDRON_EDGES[Math.floor(packetRng() * ICOSAHEDRON_EDGES.length)],
  phase: packetRng(),
  speed: 0.09 + packetRng() * 0.05, // loops per second
}));

// Every vertex's own outgoing edges, precomputed once — used only to give
// the pointer-triggered impulse below a deterministic edge to travel along
// (always the same one for a given vertex) rather than picking randomly.
const VERTEX_EDGES: number[][] = ICOSAHEDRON_VERTICES.map((_, vi) =>
  ICOSAHEDRON_EDGES.map((e, ei) => (e[0] === vi || e[1] === vi ? ei : -1)).filter((ei) => ei >= 0),
);
const IMPULSE_NEAR_THRESHOLD = 0.55; // proximity level that counts as "the pointer arrived at this vertex"
const IMPULSE_RESET_THRESHOLD = 0.3; // must drop back below this before the same vertex can re-trigger
const IMPULSE_DURATION = 0.55; // seconds an impulse takes to cross its edge
const IMPULSE_MAX_CONCURRENT = 3;

export default function SpatialObject({
  scrollProgress,
  scrollInfluence = 0,
}: {
  /** Optional 0..1 scroll progress (e.g. a hero's own useScroll value).
   *  Read once per frame via `.get()`, never subscribed to — this
   *  component never re-renders in response to scroll or pointer input. */
  scrollProgress?: MotionValue<number>;
  /** How many additional radians of Y-rotation `scrollProgress` 0→1 should
   *  contribute. 0 (the default) means scroll has no effect. */
  scrollInfluence?: number;
}) {
  const reduced = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  // The value actually used to tilt the object — damped toward `pointerRef`
  // every frame (frame-rate independent, see lib/physics.ts) rather than
  // applied instantly, so pointer movement reads as the object settling
  // into a new orientation with physical weight, not snapping to the cursor.
  const smoothedPointerRef = useRef({ x: 0, y: 0 });
  // Pointer position in the canvas's own local pixel space (as opposed to
  // the viewport-relative -1..1 tilt input above) — used only for the
  // proximity emphasis, which needs to compare against projected vertex
  // coordinates that live in that same local space. Starts far off-canvas
  // so nothing is "emphasized" before the pointer ever arrives.
  const localPointerRef = useRef({ x: -9999, y: -9999 });
  // Same damping treatment as the pointer tilt above, just fed from the
  // shared scroll-velocity store (lib/scrollVelocity.ts) instead of the
  // mouse — the lattice now carries a little visible momentum from how the
  // visitor is actually moving through the page, not just their pointer.
  const smoothedVelocityRef = useRef(0);
  // The system's visible "energy" — not driven continuously like the
  // values above, but *kicked* by real events (a system-status change to
  // "ready," a pointer-triggered impulse below) and left to decay back to
  // whatever the ambient pointer/scroll level currently calls for. This is
  // what makes the lattice read as "I disturbed a system and it's
  // settling" rather than "a CSS animation is playing" — see PASS 21.
  const energyRef = useRef(0);
  function kickEnergy(amount: number) {
    energyRef.current = Math.min(1, energyRef.current + amount);
  }
  const colorsRef = useRef({ line: "#8a8175", node: "#ff5a2e", dim: "#9c9384", packet: "#bcd6ad" });
  // Pass 14: a small, bounded set of pointer-triggered "impulse" packets —
  // the direct cause→effect layer the purely-ambient PACKETS above don't
  // provide. Read/written only inside the rAF loop below, never React
  // state. `lastNear` tracks which vertex (if any) currently counts as
  // "arrived at," so a held-still pointer fires exactly one impulse, not
  // one per frame.
  const impulsesRef = useRef<{ from: number; to: number; start: number }[]>([]);
  const lastNearRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function readColors() {
      const style = getComputedStyle(document.documentElement);
      colorsRef.current = {
        line: style.getPropertyValue("--term-border").trim() || "#8a8175",
        node: style.getPropertyValue("--term-accent").trim() || "#ff5a2e",
        dim: style.getPropertyValue("--term-fg-dim").trim() || "#9c9384",
        packet: style.getPropertyValue("--term-mint").trim() || "#bcd6ad",
      };
    }
    readColors();
    const unsubTheme = onThemeChange(readColors);

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let size = 0;

    function resize() {
      if (!canvas || !wrap) return;
      size = wrap!.clientWidth;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = size * dpr;
      canvas.height = size * dpr;
    }
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrap);

    function draw(
      angleX: number,
      angleY: number,
      recede = 0,
      introT = 1,
      secondaryIntroT = 1,
      elapsed = 0,
      energy = 0,
    ) {
      if (!ctx || size === 0) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      const focal = size * 0.9;
      // `recede` (0 at rest, up to ~1 once fully scrolled past) shrinks and
      // fades the object as the hero leaves focus — the same "still-
      // composed, not just stacked" depth relationship AsciiPortrait's own
      // heroProgress-driven fade gives the portrait (see app/page.tsx,
      // strengthened alongside this in Pass 17 so the whole composition
      // reads as one deliberate state change, not a faint drift).
      const scale = size * 0.34 * (1 - recede * 0.22);
      const globalFade = (1 - recede * 0.55) * introT;
      const { line, node, dim, packet } = colorsRef.current;
      const cx = size / 2;
      const cy = size / 2;

      // --- primary structure ---
      const projected = ICOSAHEDRON_VERTICES.map((v) => {
        const rotated = rotate(v, angleX, angleY);
        const p = project(rotated, CAMERA_DISTANCE, focal);
        return { x: p.x * (scale / focal), y: p.y * (scale / focal), depth: rotated[2] };
      });

      const depths = projected.map((p) => p.depth);
      const minD = Math.min(...depths);
      const maxD = Math.max(...depths);
      const norm = (d: number) => (maxD === minD ? 0.5 : (d - minD) / (maxD - minD));

      // Pointer proximity: how close (0..1, 1 = right on top of it) the
      // pointer is to each projected primary vertex, in the same local
      // pixel space the canvas itself is drawn in. Only ever boosts the
      // vertex/edges actually near the pointer — everything else is
      // unaffected, so the effect stays spatially localized rather than a
      // global reaction to any pointer movement anywhere on screen.
      const proxRadius = size * PROXIMITY_RADIUS_FACTOR;
      const lp = localPointerRef.current;
      const proximity = projected.map((p) => {
        const d = distance(cx + p.x, cy + p.y, lp.x, lp.y);
        return 1 - smoothstep(0, proxRadius, d);
      });

      // Pointer-triggered impulse: when the pointer's nearest vertex
      // crosses the "arrived" threshold, launch one packet from that
      // vertex along its own (deterministic) first edge — a direct,
      // visible "I did X, therefore Y happened" response, distinct from
      // the ambient PACKETS' autonomous loop. Only fires on the crossing
      // itself, not every frame the pointer stays there, and only while
      // `elapsed > 0` (i.e. never during the reduced-motion static draw,
      // which calls this function once with elapsed === 0).
      if (elapsed > 0) {
        let nearestIdx = -1;
        let nearestVal = 0;
        proximity.forEach((v, i) => {
          if (v > nearestVal) {
            nearestVal = v;
            nearestIdx = i;
          }
        });
        if (nearestVal >= IMPULSE_NEAR_THRESHOLD && lastNearRef.current !== nearestIdx) {
          const edges = VERTEX_EDGES[nearestIdx];
          if (edges.length > 0) {
            const [a, b] = ICOSAHEDRON_EDGES[edges[0]];
            const to = a === nearestIdx ? b : a;
            impulsesRef.current.push({ from: nearestIdx, to, start: elapsed });
            if (impulsesRef.current.length > IMPULSE_MAX_CONCURRENT) impulsesRef.current.shift();
            kickEnergy(0.6);
          }
          lastNearRef.current = nearestIdx;
        } else if (nearestVal < IMPULSE_RESET_THRESHOLD) {
          lastNearRef.current = null;
        }
        // Drop anything that's finished crossing its edge — the array
        // never grows unbounded even with sustained pointer movement.
        impulsesRef.current = impulsesRef.current.filter((imp) => elapsed - imp.start < IMPULSE_DURATION);
      }

      // --- secondary orbit layer (drawn first, so it reads as further back) ---
      const secondaryAngleY = angleY * SECONDARY_SPEED_MUL;
      const secondaryAngleX = angleX * SECONDARY_SPEED_MUL;
      const secondaryProjected = SECONDARY_POINTS.map((v) => {
        const rotated = rotate(v, secondaryAngleX, secondaryAngleY);
        const p = project(rotated, CAMERA_DISTANCE, focal);
        return { x: p.x * (scale / focal), y: p.y * (scale / focal), depth: rotated[2] };
      });
      const secFade = globalFade * secondaryIntroT;
      ctx.lineWidth = 1;
      SECONDARY_POINTS.forEach((_, i) => {
        const sp = secondaryProjected[i];
        const target = projected[SECONDARY_LINKS[i]];
        ctx.strokeStyle = line;
        ctx.globalAlpha = 0.14 * secFade;
        ctx.beginPath();
        ctx.moveTo(cx + sp.x, cy + sp.y);
        ctx.lineTo(cx + target.x, cy + target.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = dim;
        ctx.globalAlpha = 0.45 * secFade;
        ctx.arc(cx + sp.x, cy + sp.y, 1.3, 0, Math.PI * 2);
        ctx.fill();
      });

      // --- primary edges ---
      // Pass 26: base weight bumped from 1 to 1.3 — a straight increase to
      // .spatialWrap's rendered size (see page.module.css) would otherwise
      // just spread this same 1px thinness further apart, reading as more
      // empty space rather than more presence. This keeps the geometry
      // feeling solid at the new, larger scale instead of diluted by it.
      ctx.lineWidth = 1.3;
      for (const [a, b] of ICOSAHEDRON_EDGES) {
        const pa = projected[a];
        const pb = projected[b];
        const t = (norm(pa.depth) + norm(pb.depth)) / 2;
        const prox = Math.max(proximity[a], proximity[b]);
        ctx.strokeStyle = line;
        ctx.lineWidth = 1.3 + prox * 0.9;
        // Canvas silently ignores an out-of-range globalAlpha (leaving the
        // previous frame's value in place) rather than clamping it, so the
        // energy boost has to be clamped explicitly here.
        ctx.globalAlpha = clamp((0.22 + t * 0.44 + prox * 0.3) * globalFade * (1 + energy * ENERGY_BRIGHTNESS), 0, 1);
        ctx.beginPath();
        ctx.moveTo(cx + pa.x, cy + pa.y);
        ctx.lineTo(cx + pb.x, cy + pb.y);
        ctx.stroke();
      }
      ctx.lineWidth = 1.3;

      // --- primary nodes ---
      projected.forEach((p, i) => {
        const t = norm(p.depth);
        const prox = proximity[i];
        const r = (2.5 + t * 2.6) * (1 + prox * 0.7);
        ctx.beginPath();
        ctx.fillStyle = t > 0.55 || prox > 0.5 ? node : dim;
        ctx.globalAlpha = clamp((0.55 + t * 0.45 + prox * 0.4) * globalFade * (1 + energy * ENERGY_BRIGHTNESS), 0, 1);
        ctx.arc(cx + p.x, cy + p.y, r, 0, Math.PI * 2);
        ctx.fill();
      });

      // --- signal packets, traveling along a few fixed primary edges ---
      if (elapsed > 0) {
        for (const pkt of PACKETS) {
          const [a, b] = pkt.edge;
          const pa = projected[a];
          const pb = projected[b];
          const raw = (elapsed * pkt.speed + pkt.phase) % 1;
          // Fades in/out at each end of its edge rather than popping.
          const edgeFade = smoothstep(0, 0.08, raw) * smoothstep(1, 0.92, raw);
          const px = cx + pa.x + (pb.x - pa.x) * raw;
          const py = cy + pa.y + (pb.y - pa.y) * raw;
          ctx.beginPath();
          ctx.fillStyle = packet;
          ctx.globalAlpha = 0.85 * edgeFade * globalFade;
          ctx.arc(px, py, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Impulse packets — brighter and slightly larger than the ambient
        // ones (accent color, not mint) so a visitor can tell "that one is
        // because of me" apart from the system's own idle chatter.
        for (const imp of impulsesRef.current) {
          const pa = projected[imp.from];
          const pb = projected[imp.to];
          const raw = clamp((elapsed - imp.start) / IMPULSE_DURATION, 0, 1);
          const t = smoothstep(0, 1, raw);
          const fade = smoothstep(0, 0.15, raw) * smoothstep(1, 0.85, raw);
          const px = cx + pa.x + (pb.x - pa.x) * t;
          const py = cy + pa.y + (pb.y - pa.y) * t;
          ctx.beginPath();
          ctx.fillStyle = node;
          ctx.globalAlpha = fade * globalFade;
          ctx.arc(px, py, 2.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
    }

    if (reduced) {
      // A composed static frame — both layers present at their resting
      // orientation, no packets, no pointer proximity, no auto-rotation.
      draw(STATIC_ANGLE[0], STATIC_ANGLE[1], 0, 1, 1, 0);
      return () => {
        unsubTheme();
        resizeObserver.disconnect();
      };
    }

    // Only fine-pointer devices get the pointer-tilt layer — a touch tap
    // has no ambient position to react to, matching AsciiPortrait/DotField.
    const hasFinePointer =
      typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    function onMove(e: MouseEvent) {
      const wrapEl = wrapRef.current;
      if (!wrapEl) return;
      const rect = wrapEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const nx = clamp((e.clientX - cx) / (window.innerWidth / 2), -1, 1);
      const ny = clamp((e.clientY - cy) / (window.innerHeight / 2), -1, 1);
      pointerRef.current = { x: nx, y: ny };
      localPointerRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    if (hasFinePointer) window.addEventListener("mousemove", onMove, { passive: true });

    // Paused entirely while off-screen — the same "don't spend a rAF loop
    // on something the visitor can't see" principle DotField applies to
    // its own mousemove handler, just via IntersectionObserver instead of
    // a manual rect check, since this loop runs continuously rather than
    // only in response to pointer events.
    let visible = true;
    const io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
    });
    io.observe(wrap);

    // Pass 24: the lattice previously started resolving (introT/
    // secondaryIntroT) the instant this component mounted — which, on a
    // true first load, is the instant the page mounts *behind* BootIntro's
    // still-fully-opaque overlay. INTRO_MS is 650ms; BootIntro stays
    // visible for ~5.5s. The entire "construction" sequence was finishing
    // silently, unseen, roughly 5 seconds before the overlay ever cleared
    // — so the first thing a visitor actually saw was the object already
    // fully resolved and idly rotating, with no visible entrance at all.
    //
    // `gateOpen` delays capturing `start` (and therefore every time-based
    // value derived from it: introT, secondaryIntroT, rotation angle,
    // ambient signal packets) until the real BOOT → READY handoff — the
    // same event that already kicks energy below. On a true first load
    // that's whenever BootIntro's overlay actually clears; on a route
    // return, `getSystemStatus()` is already "ready" (or about to be, via
    // the short navigating→ready window PageTransition drives — see
    // lib/systemStatus.ts's `useIsSystemReady`), so the gate opens
    // essentially immediately rather than replaying a multi-second wait.
    // No new rAF loop, no new state — this rides the loop that already
    // exists, just changes *when* it starts actually drawing.
    // `hasSystemEverBeenReady()` (not a raw `getSystemStatus() === "ready"`
    // check) — a route remount mid-navigation can land this effect at a
    // moment where the live status has briefly reverted to "navigating"
    // even though the system already reached ready once; see the long
    // comment in lib/systemStatus.ts for how this was diagnosed live.
    let gateOpen = hasSystemEverBeenReady();
    // True only when the gate was ALREADY open at setup (a remount after
    // the real construction already played out once) — not when it opens
    // later via the live "ready" event below, which is a true first
    // construction and should still play in full. Without this, a
    // remounted canvas would replay its own 650ms "geometry resolving"
    // fade every time, even though the outer wrapper (app/page.tsx,
    // `initial={false}` when `wasReadyAtMount`) correctly skips its half
    // of the same moment — a mismatched "wrapper already visible, content
    // still fading in" result.
    const skipConstructionAnim = gateOpen;

    // The BOOT → READY handoff (lib/systemStatus.ts, published by
    // BootIntro.tsx the instant its overlay actually clears) is a real
    // "power up" kick, not a timing constant this component duplicates.
    const unsubStatus = onSystemStatusChange((status) => {
      if (status === "ready") {
        kickEnergy(1);
        if (!gateOpen) {
          gateOpen = true;
          start = null; // re-captured on the next tick — elapsed starts from ~0 at this exact moment
        }
      }
    });

    let raf: number | null = null;
    let start: number | null = null;
    let lastTime: number | null = null;
    function tick(time: number) {
      raf = requestAnimationFrame(tick);
      if (!visible || !gateOpen) return;
      // A large negative offset pushes introT/secondaryIntroT's smoothstep
      // windows (INTRO_MS, SECONDARY_INTRO_DELAY_MS+INTRO_MS — both well
      // under 1s) fully behind "now," so both evaluate to 1 on this very
      // first active frame instead of rising from 0 again.
      if (start === null) start = skipConstructionAnim ? time - 10000 : time;
      if (lastTime === null) lastTime = time;
      const dt = Math.min((time - lastTime) / 1000, 0.05); // clamp so a dropped/backgrounded frame can't cause a huge jump
      lastTime = time;
      const elapsedMs = time - start;
      const elapsed = elapsedMs / 1000;

      const scrollT = scrollProgress ? scrollProgress.get() : 0;
      const sp = smoothedPointerRef.current;
      sp.x = damp(sp.x, pointerRef.current.x, POINTER_LAMBDA, dt);
      sp.y = damp(sp.y, pointerRef.current.y, POINTER_LAMBDA, dt);
      smoothedVelocityRef.current = damp(smoothedVelocityRef.current, getScrollVelocity(), VELOCITY_LAMBDA, dt);
      const angleX = elapsed * BASE_SPEED_X + sp.y * MAX_POINTER_TILT;
      const angleY =
        elapsed * BASE_SPEED_Y +
        sp.x * MAX_POINTER_TILT +
        scrollT * scrollInfluence +
        smoothedVelocityRef.current * VELOCITY_TILT;

      // Ambient energy floor tracks how much is already happening (pointer
      // engaged, scrolling fast) — a `kickEnergy()` call adds a burst on
      // top of that floor, and damp() pulls the combined value back down to
      // whatever the floor currently is. At rest, with no kicks, this
      // settles all the way to 0, same as the tilt itself.
      const ambientEnergy = Math.max(Math.min(1, Math.hypot(sp.x, sp.y)), Math.min(1, Math.abs(smoothedVelocityRef.current) * 1.3));
      energyRef.current = damp(energyRef.current, ambientEnergy, ENERGY_LAMBDA, dt);
      // Drives .wrap::before's glow opacity directly (see
      // SpatialObject.module.css) — the same energy value that already
      // brightens the wireframe itself, read by CSS instead of duplicated
      // as a second animated value.
      wrap!.style.setProperty("--glow-energy", String(energyRef.current));
      // Published for CoreLog.tsx to read — a real, already-computed
      // value, not a second "how active is the system" calculation.
      setSpatialEnergy(energyRef.current);

      const introT = smoothstep(0, INTRO_MS, elapsedMs);
      const secondaryIntroT = smoothstep(SECONDARY_INTRO_DELAY_MS, SECONDARY_INTRO_DELAY_MS + INTRO_MS, elapsedMs);

      draw(angleX, angleY, scrollT, introT, secondaryIntroT, elapsed, energyRef.current);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      unsubTheme();
      unsubStatus();
      resizeObserver.disconnect();
      io.disconnect();
      if (hasFinePointer) window.removeEventListener("mousemove", onMove);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [reduced, scrollProgress, scrollInfluence]);

  return (
    <div className={styles.wrap} ref={wrapRef} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
