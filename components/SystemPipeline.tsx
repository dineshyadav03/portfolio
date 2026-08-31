"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
  type Variants,
} from "framer-motion";
import { systemPipeline } from "@/lib/content";
import { EASE, revealOnce } from "@/lib/motion";
import { playSystemNode, playSystemPulse } from "@/lib/sound";
import { notifyNia } from "@/lib/niaReaction";
import styles from "./SystemPipeline.module.css";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.16, delayChildren: 0.05 } },
};

// A no-op pass-through: propagates the "show" trigger to a stage's own
// node/connector/body at once, without adding a second layer of staggering
// on top of the container's between-stage stagger above.
const stageItem: Variants = {
  hidden: {},
  show: {},
};

const node: Variants = {
  hidden: { scale: 0.5, opacity: 0.35 },
  show: { scale: 1, opacity: 1, transition: { duration: 0.35, ease: EASE } },
};

// A single-shot "processing" ping — expands out from the node and fades,
// once, right as that stage activates. Deliberately a separate motion
// element from `node` above (not an extra keyframe stitched onto it):
// `node`'s reveal is what `onAnimationComplete` below listens to in order
// to fire `playSystemNode()` exactly once, and this pulse must never be
// able to shift that timing or compete over the same animated property.
// It carries no sound of its own and settles to fully invisible — no
// lingering glow, nothing to suggest the node is still "live."
const pulse: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: {
    opacity: [0, 0.8, 0],
    scale: [0.8, 1.8, 1.8],
    transition: { duration: 0.6, times: [0, 0.3, 1], ease: EASE },
  },
};

const connector: Variants = {
  hidden: { scaleY: 0 },
  show: { scaleY: 1, transition: { duration: 0.45, ease: EASE } },
};

const packet: Variants = {
  hidden: { top: "0%", opacity: 0 },
  show: {
    top: "100%",
    opacity: [0, 1, 1, 0],
    transition: { duration: 0.5, ease: EASE, delay: 0.15 },
  },
};

const body: Variants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: EASE } },
};

// One connector's continuous scroll-linked emphasis, isolated in its own
// component purely so `useTransform` can be called once per instance at a
// stable top level — calling it inside the parent's .map() would violate
// rules-of-hooks even though the stage count is static. This is entirely
// additive: `connectorFill` still carries its existing `variants={connector}`
// scaleY "draw" animation (the one-time, whileInView-triggered reveal) via
// framer-motion's animate system; this component only ever touches opacity
// through `style`, a different channel, so the two never fight over the
// same property. It never reads or writes any React state, never calls
// playSystemNode, and has no relationship to the node's onAnimationComplete
// sound trigger below — purely a derived, silent visual value.
function ConnectorLine({
  index,
  pipelineProgress,
  reduced,
}: {
  index: number;
  pipelineProgress: MotionValue<number>;
  reduced: boolean | null;
}) {
  const glow = useTransform(pipelineProgress, [index - 0.7, index, index + 0.7], [0.55, 1, 0.55]);

  return (
    <span className={styles.connector} aria-hidden="true">
      <motion.span
        className={styles.connectorFill}
        variants={connector}
        style={reduced ? undefined : { opacity: glow }}
      />
      <motion.span className={styles.packet} variants={packet} />
    </span>
  );
}

// A conceptual system pipeline, built from the same dotted-line/node
// vocabulary as the rest of the site (DottedFrame, BootHud's draw-on SVG
// line) rather than a separate visual language — each stage activates in
// sequence as the section scrolls into view, one time, then stays settled.
export default function SystemPipeline() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  // A single shared, continuous progress value spanning the whole pipeline's
  // scroll traversal — the "which stage is nearest the viewport" signal
  // every ConnectorLine derives its own glow from. One useScroll call, no
  // React state, no per-connector scroll listeners.
  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start center", "end center"],
  });
  // Mapped to the connector index range (0..length-2, one fewer than the
  // node count, since there's no connector after the final node) so the
  // scroll range's endpoints land exactly on the first and last connector's
  // own peak, instead of overshooting past the last one's emphasis window.
  const stageProgress = useTransform(scrollYProgress, [0, 1], [0, systemPipeline.length - 2]);

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <motion.ol
        className={styles.pipeline}
        initial="hidden"
        whileInView="show"
        viewport={revealOnce}
        variants={container}
      >
        {systemPipeline.map((stage, i) => (
          <motion.li className={styles.stage} key={stage.id} variants={stageItem}>
            <div className={styles.nodeCol}>
              <span className={styles.nodeAnchor}>
                <motion.span
                  className={styles.node}
                  variants={node}
                  aria-hidden="true"
                  onAnimationComplete={(definition) => {
                    if (definition === "show") playSystemNode(i, systemPipeline.length);
                  }}
                />
                <motion.span
                  className={styles.processingPulse}
                  variants={pulse}
                  aria-hidden="true"
                  onAnimationComplete={(definition) => {
                    // Only the final stage's pulse gets a sound — one
                    // "system settled" tone per pipeline reveal, not six.
                    // playSystemNode above already gives every stage its
                    // own per-node tick; pairing that with a pulse sound
                    // on all six would make the reveal noticeably busier
                    // for very little added meaning.
                    if (definition === "show" && i === systemPipeline.length - 1) {
                      playSystemPulse();
                      notifyNia("processing");
                    }
                  }}
                />
              </span>
              {i < systemPipeline.length - 1 && (
                <ConnectorLine index={i} pipelineProgress={stageProgress} reduced={reduced} />
              )}
            </div>
            <motion.div className={styles.stageBody} variants={body}>
              <p className={styles.stageLabel}>
                {String(i + 1).padStart(2, "0")} — {stage.label}
              </p>
              <p className={styles.stageDetail}>{stage.detail}</p>
            </motion.div>
          </motion.li>
        ))}
      </motion.ol>
      <p className={styles.caption}>conceptual pipeline — illustrates the pattern, not a live system.</p>
    </div>
  );
}
