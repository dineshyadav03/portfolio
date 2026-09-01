"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { clamp, damp, distance, smoothstep } from "@/lib/physics";
import { onThemeChange } from "@/lib/theme";
import styles from "./SystemField.module.css";

// A sitewide, fixed, ambient dot field behind the terminal window — the
// same restrained "dots as a sensor field" language DotField.tsx already
// established for the hero (dots shift/brighten near the pointer, damped,
// never a particle effect), just scaled to the whole viewport instead of
// one local region. This exists specifically because the space around the
// terminal window (widened in an earlier pass, but still real negative
// space on wide screens) previously had nothing to make it read as part of
// the same computational surface — only a near-invisible film-grain
// texture. Canvas-rendered, not DOM spans like DotField: a full-viewport
// grid at a reasonable spacing is easily 500-1000+ dots, too many
// individual elements to animate cheaply, but trivial for a single canvas
// draw call — the same reasoning SpatialObject already rests on.
const SPACING = 56; // px between dots — sparse, ambient, not a dense sensor grid
const DOT_RADIUS = 1;
const REACT_RADIUS = 170; // px — dots beyond this from the pointer stay at rest
const MAX_BRIGHTEN = 0.55; // extra alpha at the pointer's exact position, on top of the resting alpha
const BASE_ALPHA = 0.16; // deliberately faint — this must lose to every real content, always
const POINTER_LAMBDA = 6; // damp() rate — same physical vocabulary as SpatialObject's own pointer response
const SETTLE_EPSILON = 0.5; // px — once damped position is this close to the real pointer, the loop stops itself

export default function SystemField() {
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dotColor = "#2a2a2a";
    function readColor() {
      dotColor = getComputedStyle(document.documentElement).getPropertyValue("--term-border").trim() || "#2a2a2a";
    }
    readColor();
    const unsubTheme = onThemeChange(readColor);

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
    }
    resize();
    window.addEventListener("resize", resize);

    function drawGrid(px: number, py: number) {
      if (!ctx || w === 0) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = dotColor;
      for (let y = SPACING / 2; y < h; y += SPACING) {
        for (let x = SPACING / 2; x < w; x += SPACING) {
          const prox = 1 - smoothstep(0, REACT_RADIUS, distance(x, y, px, py));
          ctx.globalAlpha = clamp(BASE_ALPHA + prox * MAX_BRIGHTEN, 0, 1);
          const r = DOT_RADIUS * (1 + prox * 0.9);
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    if (reduced) {
      // A resting frame — no pointer term at all, matching DotField's own
      // reduced-motion behavior (the static grid stays, only the reactive
      // loop is what's skipped).
      drawGrid(-9999, -9999);
      const onResize = () => drawGrid(-9999, -9999);
      window.addEventListener("resize", onResize);
      return () => {
        unsubTheme();
        window.removeEventListener("resize", resize);
        window.removeEventListener("resize", onResize);
      };
    }

    const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const pointerRef = { x: -9999, y: -9999 };
    const smoothedRef = { x: -9999, y: -9999 };
    let hasMoved = false;

    function onMove(e: MouseEvent) {
      pointerRef.x = e.clientX;
      pointerRef.y = e.clientY;
      // The very first real pointer position snaps directly — with both
      // refs starting at a far-off (-9999,-9999) sentinel, damping the
      // *first* move would have the brighten effect take upward of a
      // second of continuous travel just to arrive anywhere near the real
      // cursor (exponential decay over an ~11000px virtual distance),
      // effectively never catching up during ordinary mouse movement.
      // Every move after this one damps normally.
      if (!hasMoved) {
        hasMoved = true;
        smoothedRef.x = e.clientX;
        smoothedRef.y = e.clientY;
      }
      ensureLoop();
    }
    if (hasFinePointer) window.addEventListener("mousemove", onMove, { passive: true });

    // Idle at true rest (no rAF cost at all until the pointer actually
    // moves) — the same "start on demand, stop once settled" pattern
    // CreationsList's own tile physics already uses, not a loop that spins
    // forever redrawing ~500-1000 unchanging dots every frame.
    let raf: number | null = null;
    let lastTime: number | null = null;

    function tick(time: number) {
      if (lastTime === null) lastTime = time;
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      smoothedRef.x = damp(smoothedRef.x, pointerRef.x, POINTER_LAMBDA, dt);
      smoothedRef.y = damp(smoothedRef.y, pointerRef.y, POINTER_LAMBDA, dt);
      drawGrid(smoothedRef.x, smoothedRef.y);

      const settled =
        Math.abs(smoothedRef.x - pointerRef.x) < SETTLE_EPSILON &&
        Math.abs(smoothedRef.y - pointerRef.y) < SETTLE_EPSILON;
      if (settled) {
        raf = null;
        lastTime = null;
        return;
      }
      raf = requestAnimationFrame(tick);
    }

    function ensureLoop() {
      if (raf === null) {
        lastTime = null;
        raf = requestAnimationFrame(tick);
      }
    }

    drawGrid(-9999, -9999); // resting frame before any pointer activity

    return () => {
      unsubTheme();
      window.removeEventListener("resize", resize);
      if (hasFinePointer) window.removeEventListener("mousemove", onMove);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
