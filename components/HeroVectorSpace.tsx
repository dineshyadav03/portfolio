"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { profile } from "@/lib/content";
import { createRng } from "@/lib/deterministicRandom";
import { EASE } from "@/lib/motion";
import styles from "./HeroVectorSpace.module.css";

// One of two new right-margin HUD panels (see HeroNeuralNet for the
// other) — real capability tags plotted in a 2D field, connected to each
// tag's own genuinely-nearest neighbor by on-map distance. The layout
// itself is the only invented part (a deterministic seeded scatter, not
// fabricated data); every label and every connection is either real
// content or a real computed relationship, same honesty line
// ProjectSignature and the reverted HeroConsole already draw.
const W = 150;
const H = 110;
const rng = createRng("hero-vector-space-v1");
const NODES = profile.capabilityTags.map((tag) => ({
  tag,
  x: 14 + rng() * (W - 28),
  y: 14 + rng() * (H - 28),
}));
const LINKS = NODES.map((n, i) => {
  let best = -1;
  let bestD = Infinity;
  NODES.forEach((o, j) => {
    if (i === j) return;
    const d = Math.hypot(n.x - o.x, n.y - o.y);
    if (d < bestD) {
      bestD = d;
      best = j;
    }
  });
  return { from: n, to: NODES[best] };
});

const panel: Variants = {
  hidden: { opacity: 0, x: 10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } },
};

export default function HeroVectorSpace({
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
      transition={{ delay: 0.5 }}
    >
      <div className={styles.head}>
        <span className={styles.title}>vector space</span>
        <span className={styles.note}>illustrative</span>
      </div>
      <svg
        className={styles.diagram}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Capability tags mapped by relative distance: ${profile.capabilityTags.join(", ")}`}
      >
        {LINKS.map((l, i) => (
          <line key={i} className={styles.link} x1={l.from.x} y1={l.from.y} x2={l.to.x} y2={l.to.y} />
        ))}
        {NODES.map((n, i) => (
          <g key={n.tag}>
            <circle className={styles.node} cx={n.x} cy={n.y} r={2.2} style={{ animationDelay: `${i * 0.4}s` }} />
            <text className={styles.label} x={n.x} y={n.y - 5} textAnchor="middle">
              {n.tag}
            </text>
          </g>
        ))}
      </svg>
      <p className={styles.caption}>real skill tags, mapped by distance — not a live index</p>
    </motion.div>
  );
}
