"use client";

import { motion, type Variants } from "framer-motion";
import { buildStatus, profile } from "@/lib/content";
import { EASE, listContainer, listItem } from "@/lib/motion";
import styles from "./BuildStatusPanel.module.css";

const ACTIONS = [
  { label: "source", href: profile.social.github },
  { label: "resume", href: profile.social.resume },
  { label: "contact", href: `mailto:${profile.email}` },
];

// Same inherited-state composition as StatusReadout (see its own comment)
// — no independent whileInView here, app/page.tsx's existing "build"
// section wrapper already owns the one trigger. `barFill` is the real
// addition: buildStatus.percent was always a genuine number, but it used
// to just appear at its final width the instant the section popped in —
// nothing about that read as "counting up to" a value. Filling from 0 on
// reveal makes the number feel measured, not just printed.
const barFill: Variants = {
  hidden: { width: "0%" },
  show: { width: `${buildStatus.percent}%`, transition: { duration: 0.9, ease: EASE, delay: 0.15 } },
};

export default function BuildStatusPanel() {
  return (
    <motion.div className={styles.panel} variants={listContainer}>
      <motion.div className={styles.col} variants={listItem}>
        <p className={styles.heading}>status</p>
        <svg className={styles.spinner} viewBox="0 0 40 40" aria-hidden="true">
          <circle
            className={styles.spinnerTrack}
            cx="20"
            cy="20"
            r="16"
            fill="none"
            strokeWidth="2"
          />
          <circle
            className={styles.spinnerArc}
            cx="20"
            cy="20"
            r="16"
            fill="none"
            strokeWidth="2"
            strokeDasharray="28 100"
            strokeLinecap="round"
          />
        </svg>
        <p className={styles.spinnerLabel}>in progress</p>
      </motion.div>

      <motion.div className={styles.col} variants={listItem}>
        <p className={styles.heading}>content</p>
        <div className={styles.bar}>
          {/* No CSS `transition: width` on this element anymore — this
              motion value owns the width animation now, so the two
              never compete over the same property (see
              BuildStatusPanel.module.css). */}
          <motion.div className={styles.barFill} variants={barFill} />
        </div>
        <p className={styles.barLabel}>{buildStatus.percent}% complete</p>
        <p className={styles.detail}>{buildStatus.detail}</p>
      </motion.div>

      <motion.div className={styles.col} variants={listItem}>
        <p className={styles.heading}>actions</p>
        <div className={styles.actions}>
          {ACTIONS.map((action) =>
            action.href ? (
              <a
                key={action.label}
                href={action.href}
                className={
                  // "contact" is the one action that's a real, working next
                  // step right now — a subtle accent default (not just on
                  // hover) signals it as primary, source/resume as neutral.
                  action.label === "contact"
                    ? `${styles.action} ${styles.actionPrimary}`
                    : styles.action
                }
              >
                {action.label}
              </a>
            ) : (
              <span key={action.label} className={styles.actionDisabled}>
                {action.label}
              </span>
            ),
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
