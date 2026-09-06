"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import styles from "./HeroBackground.module.css";

// Pass 37: stands in for the reference's scroll-scrubbed hero video —
// there's no equivalent footage for this portfolio (confirmed with the
// user rather than substituting someone else's asset), so this is an
// original abstract canvas instead: a soft dark mist field with drifting
// bokeh-style particles. The one thing genuinely reused from the
// reference is its scroll-smoothing technique — a plain exponential lerp
// (`smoothed += (target - smoothed) * 0.12` per frame) — a generic
// numerical method, not proprietary content, applied here to particle
// drift/parallax instead of video-frame selection.
const PARTICLE_COUNT = 46;
const LERP_FACTOR = 0.12;

type Particle = {
  x: number; // 0..1, normalized position
  y: number;
  r: number; // radius in px at 1x scale
  phase: number; // drift phase offset so particles don't move in lockstep
  speed: number;
  depth: number; // 0..1 — how much this particle reacts to scroll parallax
};

function makeParticles(count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random(),
      y: Math.random(),
      r: 1.5 + Math.random() * 3,
      phase: Math.random() * Math.PI * 2,
      speed: 0.15 + Math.random() * 0.25,
      depth: Math.random(),
    });
  }
  return particles;
}

export default function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const particles = makeParticles(PARTICLE_COUNT);
    let width = 0;
    let height = 0;
    let dpr = 1;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    let target = 0;
    let smoothed = 0;
    function onScroll() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      target = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    let raf = 0;
    let t = 0;
    function draw() {
      smoothed += (target - smoothed) * LERP_FACTOR;
      t += 1;

      ctx!.clearRect(0, 0, width, height);

      // Soft mist: a slow radial gradient wash, center drifting gently
      // with scroll so the whole field feels alive, not static.
      const cx = width * (0.5 + Math.sin(smoothed * Math.PI) * 0.08);
      const cy = height * (0.42 + smoothed * 0.12);
      const mist = ctx!.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.7);
      mist.addColorStop(0, "rgba(60, 60, 70, 0.16)");
      mist.addColorStop(0.5, "rgba(30, 30, 36, 0.08)");
      mist.addColorStop(1, "rgba(10, 10, 10, 0)");
      ctx!.fillStyle = mist;
      ctx!.fillRect(0, 0, width, height);

      // Bokeh particles — slow independent drift, plus a small
      // scroll-driven parallax offset scaled by each particle's own
      // depth so the field reads as genuinely three-dimensional.
      for (const p of particles) {
        const drift = reduced ? 0 : Math.sin(t * 0.004 * p.speed + p.phase) * 14;
        const parallax = smoothed * p.depth * 60;
        const px = p.x * width + drift;
        const py = p.y * height - parallax;
        const wrappedY = ((py % height) + height) % height;
        const glow = ctx!.createRadialGradient(px, wrappedY, 0, px, wrappedY, p.r * 6);
        const alpha = 0.12 + p.depth * 0.18;
        glow.addColorStop(0, `rgba(255, 250, 240, ${alpha})`);
        glow.addColorStop(1, "rgba(255, 250, 240, 0)");
        ctx!.fillStyle = glow;
        ctx!.beginPath();
        ctx!.arc(px, wrappedY, p.r * 6, 0, Math.PI * 2);
        ctx!.fill();
      }

      if (!reduced) raf = requestAnimationFrame(draw);
    }

    // Reduced motion: one settled frame, no drift, no scroll-scrub loop —
    // `draw` itself skips re-scheduling above, matching this codebase's
    // "different behavior, not just softer" convention for continuous
    // effects under reduced motion.
    if (reduced) {
      draw();
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
