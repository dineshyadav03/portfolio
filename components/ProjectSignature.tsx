"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { project, rotate, type Vec3 } from "@/lib/spatialGeometry";
import { createRng, hashSeed } from "@/lib/deterministicRandom";
import { clamp, damp, smoothstep } from "@/lib/physics";
import { onThemeChange } from "@/lib/theme";
import styles from "./ProjectSignature.module.css";

// A large, per-project "signature" point-cloud render for the detail
// page — a different scale and density than ProjectVisual's small tile
// icon (kept as-is on the list page), built for a "3D holographic scan"
// read the user asked for directly, referencing a set of AI-art dot-cloud
// renders. Same real/decorative line this whole site already draws
// elsewhere: the SHAPE is purely aesthetic (there's no real terrain/wave
// data behind any project), but which shape a project gets is not
// arbitrary — it reuses ProjectVisual's own real distinction (a project's
// actual `status` field: a scoped external PR fix vs. an owned build) so
// the two visuals on this page agree about what kind of project this is,
// not just both looking vaguely technical.
const STATIC_ANGLE: [number, number] = [0.42, 0.6];
const BASE_SPEED_Y = 0.05; // rad/s — slower than SpatialObject, a large image should read as calm, not busy
const MAX_POINTER_TILT = 0.22;
const POINTER_LAMBDA = 5;
const CAMERA_DISTANCE = 3.4;

type Point3 = { p: Vec3; size: number };

function genTerrain(rng: () => number): Point3[] {
  const cols = 30;
  const rows = 16;
  const freqA = 1.6 + rng() * 1.4;
  const freqB = 2.2 + rng() * 1.8;
  const phaseA = rng() * Math.PI * 2;
  const phaseB = rng() * Math.PI * 2;
  const points: Point3[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c / (cols - 1) - 0.5) * 2.3;
      const z = (r / (rows - 1) - 0.5) * 1.6;
      const y = Math.sin(x * freqA + phaseA) * Math.cos(z * freqB + phaseB) * 0.36 + Math.sin((x + z) * 1.7) * 0.12;
      points.push({ p: [x, y, z], size: 1 });
    }
  }
  return points;
}

function genSphere(count = 460): Point3[] {
  const points: Point3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    points.push({ p: [Math.cos(theta) * r * 0.9, y * 0.9, Math.sin(theta) * r * 0.9], size: 1 });
  }
  return points;
}

function genWave(rng: () => number): Point3[] {
  const cols = 34;
  const rows = 13;
  const freq = 2.1 + rng() * 1.6;
  const phase = rng() * Math.PI * 2;
  const points: Point3[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c / (cols - 1) - 0.5) * 2.6;
      const z = (r / (rows - 1) - 0.5) * 1.1;
      const y = Math.sin(x * freq + phase + z * 1.6) * 0.32 * (1 - Math.abs(z) * 0.3);
      points.push({ p: [x, y, z], size: 1 });
    }
  }
  return points;
}

type Template = "terrain" | "sphere" | "wave";

function pickTemplate(seed: string, structural: boolean): Template {
  if (structural) return "terrain";
  return hashSeed(`${seed}-sig`) % 2 === 0 ? "sphere" : "wave";
}

export default function ProjectSignature({
  seed,
  status,
}: {
  seed: string;
  status?: "merged" | "open";
}) {
  const reduced = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const smoothedRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const structural = Boolean(status);
    const template = pickTemplate(seed, structural);
    const rng = createRng(seed);
    const points =
      template === "terrain" ? genTerrain(rng) : template === "sphere" ? genSphere() : genWave(rng);

    let fg = "#f4ede1";
    let dim = "#9c9384";
    function readColors() {
      const style = getComputedStyle(document.documentElement);
      fg = style.getPropertyValue("--term-fg").trim() || "#f4ede1";
      dim = style.getPropertyValue("--term-fg-dim").trim() || "#9c9384";
    }
    readColors();
    const unsubTheme = onThemeChange(readColors);

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    function resize() {
      if (!canvas || !wrap) return;
      const rect = wrap.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrap);

    function draw(angleX: number, angleY: number, introT = 1) {
      if (!ctx || w === 0) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const focal = Math.min(w, h) * 1.1;
      const scale = Math.min(w, h) * 0.42;

      const projected = points.map(({ p }) => {
        const r = rotate(p, angleX, angleY);
        const proj = project(r, CAMERA_DISTANCE, focal);
        return { x: proj.x * (scale / focal), y: proj.y * (scale / focal), depth: r[2] };
      });
      const depths = projected.map((p) => p.depth);
      const minD = Math.min(...depths);
      const maxD = Math.max(...depths);
      const norm = (d: number) => (maxD === minD ? 0.5 : (d - minD) / (maxD - minD));

      for (const p of projected) {
        const t = norm(p.depth);
        const r = 0.9 + t * 1.5;
        ctx.beginPath();
        ctx.fillStyle = t > 0.55 ? fg : dim;
        ctx.globalAlpha = clamp((0.35 + t * 0.65) * introT, 0, 1);
        ctx.arc(cx + p.x, cy + p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    if (reduced) {
      draw(STATIC_ANGLE[0], STATIC_ANGLE[1]);
      return () => {
        unsubTheme();
        resizeObserver.disconnect();
      };
    }

    const hasFinePointer =
      typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    function onMove(e: MouseEvent) {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      const nx = clamp((e.clientX - (rect.left + rect.width / 2)) / (window.innerWidth / 2), -1, 1);
      const ny = clamp((e.clientY - (rect.top + rect.height / 2)) / (window.innerHeight / 2), -1, 1);
      pointerRef.current = { x: nx, y: ny };
    }
    if (hasFinePointer) window.addEventListener("mousemove", onMove, { passive: true });

    let visible = true;
    const io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
    });
    io.observe(wrap);

    let raf: number | null = null;
    let lastTime: number | null = null;
    let elapsed = 0;
    function tick(time: number) {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      if (lastTime === null) lastTime = time;
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      elapsed += dt;

      const sp = smoothedRef.current;
      sp.x = damp(sp.x, pointerRef.current.x, POINTER_LAMBDA, dt);
      sp.y = damp(sp.y, pointerRef.current.y, POINTER_LAMBDA, dt);

      const introT = smoothstep(0, 0.8, elapsed);
      const angleX = STATIC_ANGLE[0] + sp.y * MAX_POINTER_TILT * 0.5;
      const angleY = STATIC_ANGLE[1] + elapsed * BASE_SPEED_Y + sp.x * MAX_POINTER_TILT;
      draw(angleX, angleY, introT);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      unsubTheme();
      resizeObserver.disconnect();
      io.disconnect();
      if (hasFinePointer) window.removeEventListener("mousemove", onMove);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [reduced, seed, status]);

  return (
    <div className={styles.wrap} ref={wrapRef} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
