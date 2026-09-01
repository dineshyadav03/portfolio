"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { type Project, projectSlug } from "@/lib/content";
import { listContainer, listItem, revealOnce } from "@/lib/motion";
import { triggerGlitch } from "@/lib/eventGlitch";
import { playHoverTick, playProjectOpen } from "@/lib/sound";
import { notifyNia } from "@/lib/niaReaction";
import { setSystemStatus } from "@/lib/systemStatus";
import ProjectVisual from "./ProjectVisual";
import SectionDivider from "./SectionDivider";
import styles from "@/app/creations/page.module.css";

const LAUNCH_MS = 260; // how long the "launching" beat holds before the actual navigation happens

// Pass 26: this was previously a 2-column grid of tiles, each driven by a
// per-frame rAF loop damping pointer-tilt/scale/depth (see git history —
// lib/physics.ts's `damp()`). Restructured into a vertical list where one
// row expands to reveal its description/stack/visual while its siblings
// collapse to a single line — the "dominant focus" idea from that system
// carried forward, just expressed as real height instead of a 1.045x scale
// bump. The old rAF loop is gone entirely, not adapted: a full-width row
// doesn't read well with a 3D tilt, and CSS `:hover`/`:focus-within` can
// drive a height reveal natively — no per-frame JS, no physics loop, a
// real complexity reduction rather than a like-for-like swap. Clicking a
// project now opens a real internal page about it (app/creations/[slug])
// instead of jumping straight to the external repo/PR — that link still
// exists, just one layer in, as a deliberate action on the detail page.
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
  const router = useRouter();
  const [launching, setLaunching] = useState(false);
  const slug = projectSlug(project.name);
  const href = `/creations/${slug}`;

  // One real activation (click or keyboard Enter on the focused link) gets
  // a brief "launching" beat — index/title commit to the accent color, the
  // arrow commits forward — before the actual navigation happens, instead
  // of an instant jump. Middle-click, cmd/ctrl-click, and shift-click are
  // left alone (those are "open in a new tab" and must stay instant, or
  // this breaks a very established browser convention); reduced motion
  // also skips the delay, though the side effects (sound, glitch, Nia)
  // still fire.
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    triggerGlitch();
    playProjectOpen();
    notifyNia("project");
    if (reduced || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    setLaunching(true);
    setSystemStatus("launching");
    setTimeout(() => router.push(href), LAUNCH_MS);
  }

  // Fine-pointer devices only — a touch tap has no "entering" moment the
  // way a mouse does, and CSS `:hover` already makes the expand itself
  // work correctly everywhere without this.
  function handleMouseEnter() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    playHoverTick();
  }

  return (
    <motion.li className={styles.item} variants={listItem}>
      <div className={styles.row} data-launching={launching || undefined} onMouseEnter={handleMouseEnter}>
        <div className={styles.itemHead}>
          <span className={styles.index} aria-hidden="true">
            {groupCode}.{String(index + 1).padStart(2, "0")}
          </span>
          {/* A real-state indicator, not decoration: no `status` field means
              an owned build (the developer's own live, still-changing
              repo) — shown as a solid dot, the same "active" color
              language the site already uses elsewhere. A real `status`
              gets its own dot style *and* keeps the existing real text
              pill — nothing here claims a state the data doesn't already
              support. */}
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
          <h3 className={styles.itemName}>
            <Link href={href} onClick={handleClick}>
              {project.name}
              <span className={styles.arrow} aria-hidden="true">
                →
              </span>
            </Link>
          </h3>
        </div>
        {/* The expandable body — collapsed to zero height by default on
            fine-pointer devices (see the CSS `@media (hover: hover) and
            (pointer: fine)` gate), revealed on hover/focus of this row.
            Always expanded outside that media query, so touch/coarse-
            pointer visitors see the same information with no hover-only
            gate to get stuck behind. */}
        <div className={styles.expandable}>
          <div className={styles.expandableInner}>
            {/* The project's procedural visual identity — one of five
                deterministic geometric modes derived from its own name
                (see components/ProjectVisual.tsx), not a screenshot or
                stock image. Same project, same visual, every time. */}
            <div className={styles.visualWrap}>
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
        </div>
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
