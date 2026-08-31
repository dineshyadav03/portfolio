"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Project } from "@/lib/content";
import { listContainer, listItem, revealOnce } from "@/lib/motion";
import { triggerGlitch } from "@/lib/eventGlitch";
import { playHoverTick, playProjectOpen } from "@/lib/sound";
import { notifyNia } from "@/lib/niaReaction";
import { clamp, damp } from "@/lib/physics";
import { setSystemStatus } from "@/lib/systemStatus";
import ProjectVisual from "./ProjectVisual";
import SectionDivider from "./SectionDivider";
import styles from "@/app/creations/page.module.css";

const MAX_ROTATE_X = 1.5; // deg
const MAX_ROTATE_Y = 2; // deg
const TILT_Z = 3; // px
const VISUAL_TILT_Z = 10; // px — deeper than the tile itself, so the visual reads as the foreground layer
const VISUAL_SHIFT = 4; // px
const VISUAL_SCALE = 0.03;
const TILT_LAMBDA = 12; // damp() rate — snappier than the hero's SpatialObject; this should feel directly manipulated, not heavy. See lib/motion.ts's `SPRING.responsive`.
const SETTLE_EPSILON = 0.002; // once the damped value is this close to its target, the spring-back loop stops itself
const INDEX_SHIFT = 1.5; // px — the smallest depth response in the stack, since the index is the least "physical" element
const LAUNCH_MS = 260; // how long the "launching" beat holds before the actual navigation happens
const DOMINANT_SCALE = 1.045; // Pass 19 — the focused project genuinely grows, it doesn't just tilt in place

// The pointer-driven tilt lives on this inner wrapper, never on the
// `motion.li` itself — the li already owns `transform` via its own
// `whileHover={{x:4}}` (existing, untouched), and writing a second,
// independent transform directly to the same element would fight
// framer-motion's own management of that property. Two separate elements
// each own their own transform channel and compose normally instead.
//
// As of Pass 13: pointermove no longer writes the transform directly.
// It only updates a `target`; a single continuous rAF loop damps the
// applied value toward that target every frame (frame-rate independent,
// see lib/physics.ts) and keeps running past pointerleave — with target
// reset to {0,0} — until the tile has actually sprung back to rest. That
// loop is also the one place `--nx`/`--ny` are written onto the visual
// wrapper, so ProjectVisual's own pointer-reactive CSS (see its module)
// rides the same damped, physical value the tilt itself uses — one
// pointer source, one physics model, several coordinated responses.
function ProjectItem({
  project,
  index,
  groupCode,
}: {
  project: Project;
  index: number;
  groupCode: string;
}) {
  const reduced = useReducedMotion();
  const tiltRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef<HTMLSpanElement>(null);
  const targetRef = useRef({ x: 0, y: 0, s: 1 });
  const currentRef = useRef({ x: 0, y: 0, s: 1 });
  const activeRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const launchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function applyTransform(nx: number, ny: number, s: number) {
    const el = tiltRef.current;
    if (el) {
      const rotateY = nx * MAX_ROTATE_Y;
      const rotateX = -ny * MAX_ROTATE_X;
      el.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${TILT_Z}px) scale(${s})`;
    }
    // The visual gets its own, smaller depth response on the same damped
    // value — one interaction driving multiple coordinated transforms on
    // separate elements, rather than a second pointer listener. --nx/--ny
    // additionally feed ProjectVisual's own per-mode CSS reactions (see
    // ProjectVisual.module.css) — the same physical value, read three ways.
    const visualEl = visualRef.current;
    if (visualEl) {
      visualEl.style.transform = `translateZ(${VISUAL_TILT_Z}px) translate(${nx * VISUAL_SHIFT}px, ${ny * VISUAL_SHIFT}px) scale(${1 + Math.hypot(nx, ny) * VISUAL_SCALE})`;
      visualEl.style.setProperty("--nx", String(nx));
      visualEl.style.setProperty("--ny", String(ny));
    }
    // The index badge — the smallest, outermost element in the depth
    // stack — gets the smallest response on the same damped value, so the
    // whole tile (index → title's color response → visual → geometry)
    // reads as one physically coherent object instead of the index being
    // the one piece that only ever snaps between two colors.
    const indexEl = indexRef.current;
    if (indexEl) {
      indexEl.style.transform = `translate(${nx * INDEX_SHIFT}px, ${ny * INDEX_SHIFT}px)`;
    }
  }

  function loop(time: number) {
    if (lastTimeRef.current === null) lastTimeRef.current = time;
    const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = time;

    const cur = currentRef.current;
    const target = targetRef.current;
    cur.x = damp(cur.x, target.x, TILT_LAMBDA, dt);
    cur.y = damp(cur.y, target.y, TILT_LAMBDA, dt);
    // The dominant-focus scale rides the same damped physics, just a
    // slower rate — a project should visibly settle into "focused," not
    // snap there at the same speed as the tilt tracks the raw pointer.
    cur.s = damp(cur.s, target.s, TILT_LAMBDA * 0.5, dt);
    applyTransform(cur.x, cur.y, cur.s);

    const settled =
      Math.abs(cur.x - target.x) < SETTLE_EPSILON &&
      Math.abs(cur.y - target.y) < SETTLE_EPSILON &&
      Math.abs(cur.s - target.s) < SETTLE_EPSILON;
    if (!activeRef.current && settled) {
      // Fully sprung back to rest — stop the loop and clear the inline
      // styles entirely rather than leaving them frozen at ~0.
      rafRef.current = null;
      lastTimeRef.current = null;
      cur.x = 0;
      cur.y = 0;
      cur.s = 1;
      const el = tiltRef.current;
      if (el) el.style.transform = "";
      const visualEl = visualRef.current;
      if (visualEl) {
        visualEl.style.transform = "";
        visualEl.style.removeProperty("--nx");
        visualEl.style.removeProperty("--ny");
      }
      const indexEl = indexRef.current;
      if (indexEl) indexEl.style.transform = "";
      return;
    }
    rafRef.current = requestAnimationFrame(loop);
  }

  function ensureLoop() {
    if (rafRef.current === null) {
      lastTimeRef.current = null;
      rafRef.current = requestAnimationFrame(loop);
    }
  }

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (launchTimeoutRef.current !== null) clearTimeout(launchTimeoutRef.current);
    };
  }, []);

  // Projects link out to GitHub — there's no internal "project page" this
  // site can transition into, so a click today is a full, instant page
  // unload. This gives it one real beat first: a brief "launching" state
  // (arrow commits forward, index/title shift to the active accent color —
  // no new transform layer, so it can't fight the pointer-physics transform
  // already live on this tile) before the actual navigation happens.
  // Middle-click, cmd/ctrl-click, and shift-click are deliberately left
  // alone — those are "open in a new tab/window" and must stay instant, or
  // this would break a very established browser convention. Reduced motion
  // also skips the delay entirely; the side effects (sound, glitch, Nia)
  // still fire, they just don't gate the navigation.
  function handleProjectClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    triggerGlitch();
    playProjectOpen();
    notifyNia("project");
    if (reduced || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    tiltRef.current?.setAttribute("data-launching", "true");
    setSystemStatus("launching");
    launchTimeoutRef.current = setTimeout(() => {
      window.location.href = href;
    }, LAUNCH_MS);
  }

  // A single, semantic "entering this project" acknowledgment — fires once
  // per hover session on `pointerenter`, never on `pointerMove` above (that
  // handler stays entirely silent, it only ever writes a transform). Gated
  // behind the same fine-pointer check as the tilt so a touch tap doesn't
  // fire both a hover-tick and, a moment later, the activation sound.
  function handlePointerEnter(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }
    playHoverTick();
    // A plain DOM attribute, not React state — read by ProjectVisual.module
    // .css to give every mode's strokes/nodes a shared "gains emphasis"
    // response (Phase E) without a second listener or a per-frame render.
    tiltRef.current?.setAttribute("data-hovering", "true");
    activeRef.current = true;
    // The dominant-focus scale target — set once on entry, not tracked
    // per-frame from pointer position the way x/y are, so it settles to a
    // single "this is the focused one" state rather than continuously
    // varying with cursor position.
    targetRef.current.s = DOMINANT_SCALE;
    ensureLoop();
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduced) return;
    // Fine mouse pointers only — a touch tap firing this on a hybrid
    // device would read as a bug, not a depth cue.
    if (e.pointerType !== "mouse" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }
    const el = tiltRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    targetRef.current.x = clamp(((e.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
    targetRef.current.y = clamp(((e.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
    ensureLoop();
  }

  function handlePointerLeave() {
    tiltRef.current?.removeAttribute("data-hovering");
    activeRef.current = false;
    if (reduced) return;
    // Spring back to rest rather than snapping to a hard reset — the loop
    // keeps running (started fresh here if a leave arrives with no prior
    // move, e.g. a fast pass-through) until `loop` itself detects it has
    // settled and stops.
    targetRef.current = { x: 0, y: 0, s: 1 };
    ensureLoop();
  }

  return (
    <motion.li className={styles.item} variants={listItem} whileHover={{ x: 4 }} transition={{ duration: 0.15 }}>
      <div
        ref={tiltRef}
        className={styles.tiltWrap}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <div className={styles.itemHead}>
          <span className={styles.index} aria-hidden="true" ref={indexRef}>
            {groupCode}.{String(index + 1).padStart(2, "0")}
          </span>
          {/* A real-state indicator, not decoration: no `status` field means
              an owned build (the developer's own live, still-changing
              repo) — shown as a solid dot, the same "active" color
              language the site already uses elsewhere, with no invented
              text label attached to it. A real `status` gets its own dot
              style *and* keeps the existing real text pill — nothing here
              claims a state the data doesn't already support. */}
          <span className={styles.stateRow}>
            <span className={styles.stateDot} data-state={project.status ?? "active"} aria-hidden="true" />
            {project.status && (
              <span
                className={
                  project.status === "merged" ? `${styles.status} ${styles.statusMerged}` : styles.status
                }
              >
                {project.status}
              </span>
            )}
          </span>
        </div>
        <h3 className={styles.itemName}>
          {project.href ? (
            // Fires only on real activation (click or keyboard Enter on
            // the focused link) — never on hover, pointer proximity, the
            // tilt effect above, or focus alone, since onClick only ever
            // runs when the link is actually activated.
            <a href={project.href} onClick={(e) => handleProjectClick(e, project.href as string)}>
              {project.name}
              <span className={styles.arrow} aria-hidden="true">
                →
              </span>
            </a>
          ) : (
            project.name
          )}
        </h3>
        {/* The project's procedural visual identity — one of five
            deterministic geometric modes derived from its own name (see
            components/ProjectVisual.tsx), not a screenshot or stock image.
            Same project, same visual, every time. It rides along with the
            tilt wrapper's own pointer-driven rotateX/Y/Z above, so it
            already gains depth on hover without a second, competing
            pointer handler. */}
        <div className={styles.visualWrap} ref={visualRef}>
          <ProjectVisual seed={project.name} status={project.status} />
        </div>
        <p className={styles.itemDesc}>{project.description}</p>
        {project.stack && project.stack.length > 0 && (
          <ul className={styles.stack}>
            {project.stack.map((tech) => (
              <li key={tech}>{tech}</li>
            ))}
          </ul>
        )}
      </div>
    </motion.li>
  );
}

function ProjectList({ projects, groupCode }: { projects: Project[]; groupCode: string }) {
  return (
    <motion.ul
      className={styles.list}
      initial="hidden"
      whileInView="show"
      viewport={revealOnce}
      variants={listContainer}
    >
      {projects.map((project, i) => (
        <ProjectItem key={project.name} project={project} index={i} groupCode={groupCode} />
      ))}
    </motion.ul>
  );
}

export default function CreationsList({ projects }: { projects: Project[] }) {
  const ownBuilds = projects.filter((p) => !p.status);
  const contributions = projects.filter((p) => p.status);

  return (
    <>
      <ProjectList projects={ownBuilds} groupCode="0.02" />
      {contributions.length > 0 && (
        <>
          <SectionDivider label="0.02b — open-source contributions" />
          <ProjectList projects={contributions} groupCode="0.02b" />
        </>
      )}
    </>
  );
}
