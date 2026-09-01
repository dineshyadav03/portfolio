"use client";

import { motion, type Variants } from "framer-motion";
import { status } from "@/lib/content";
import { EASE, listContainer, listItem } from "@/lib/motion";
import styles from "./StatusReadout.module.css";

// Previously a plain server-rendered <dl> — the section's own whileInView
// wrapper in app/page.tsx made the whole block fade up as one flat piece,
// same as every other section, no read distinguishing "a status readout"
// from "a paragraph." Per-row stagger plus the leader line drawing in
// (transform-origin left, the same scaleX language SectionDivider's own
// rule already uses) makes it read as data actually printing out one
// field at a time, not a static block.
//
// No `initial`/`whileInView`/`viewport` of its own — this mounts directly
// inside app/page.tsx's existing "status" section wrapper, which already
// owns the one whileInView trigger for this section (see Pass 22's fix to
// the same class of bug in SectionDivider: two independent triggers for
// one conceptual reveal can drift out of sync). `variants={listContainer}`
// here just means "when the ancestor says show, stagger my own children
// with my own timing" — inherited state, not a second observer.
const leader: Variants = {
  hidden: { scaleX: 0 },
  show: { scaleX: 1, transition: { duration: 0.5, ease: EASE } },
};

export default function StatusReadout() {
  return (
    <motion.dl className={styles.readout} variants={listContainer}>
      {status.map((row) => (
        <motion.div className={styles.row} key={row.label} variants={listItem}>
          <dt>{row.label}</dt>
          <motion.span className={styles.leader} aria-hidden="true" variants={leader} />
          <dd>{row.value}</dd>
        </motion.div>
      ))}
    </motion.dl>
  );
}
