"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { EASE } from "@/lib/motion";
import styles from "./HeroNeuralNet.module.css";

// The second right-margin HUD panel (see HeroVectorSpace for the first)
// — a small feedforward diagram. Explicitly labeled illustrative: there's
// no real model behind this page, so this never claims to be one, the
// same honesty line SystemPipeline already draws ("conceptual pipeline —
// illustrates the pattern, not a live system").
const LAYERS = [3, 4, 3, 2];
const W = 150;
const H = 92;
type Node = { x: number; y: number };
const NODES: Node[][] = LAYERS.map((count, li) => {
  const x = 12 + (li / (LAYERS.length - 1)) * (W - 24);
  return Array.from({ length: count }, (_, ni) => ({
    x,
    y: H / 2 + (ni - (count - 1) / 2) * (H / (count + 1)),
  }));
});
const LINKS: { a: Node; b: Node }[] = [];
for (let li = 0; li < NODES.length - 1; li++) {
  for (const a of NODES[li]) {
    for (const b of NODES[li + 1]) {
      LINKS.push({ a, b });
    }
  }
}
const SIGNAL_PATH = `M ${NODES.map((layer) => {
  const p = layer[Math.floor(layer.length / 2)];
  return `${p.x},${p.y}`;
}).join(" L ")}`;

const panel: Variants = {
  hidden: { opacity: 0, x: 10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } },
};

export default function HeroNeuralNet({
  ready,
  skipEntrance,
}: {
  ready: boolean;
  skipEntrance: boolean;
}) {
  const reduced = useReducedMotion();
  const show = reduced || ready;

  return (
    <motion.div
      className={styles.panel}
      initial={skipEntrance ? false : "hidden"}
      animate={show ? "show" : "hidden"}
      variants={panel}
      transition={{ delay: 0.6 }}
    >
      <div className={styles.head}>
        <span className={styles.title}>neural net</span>
        <span className={styles.note}>illustrative</span>
      </div>
      <svg className={styles.diagram} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        {LINKS.map((l, i) => (
          <line key={i} className={styles.link} x1={l.a.x} y1={l.a.y} x2={l.b.x} y2={l.b.y} />
        ))}
        {NODES.flat().map((n, i) => (
          <circle key={i} className={styles.node} cx={n.x} cy={n.y} r={2.2} />
        ))}
        {!reduced && (
          <circle className={styles.signal} r={1.8}>
            <animateMotion dur="2.8s" repeatCount="indefinite" path={SIGNAL_PATH} />
          </circle>
        )}
      </svg>
      <p className={styles.caption}>illustrative — not a live model</p>
    </motion.div>
  );
}
