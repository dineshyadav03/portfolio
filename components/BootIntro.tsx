"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import BootHud from "./BootHud";
import DotIcon from "./DotIcon";
import DottedFrame from "./DottedFrame";
import { globeBitmap, laptopBitmap } from "@/lib/dotIcons";
import { playBootChime, playKeyClick, playSystemReady } from "@/lib/sound";
import { ACCESS_START_MS, ACCESS_STEP_MS, ACCESS_TEXT, BOOT_VISIBLE_MS, PHASE1_MS } from "@/lib/bootTiming";
import styles from "./BootIntro.module.css";

const GLOBE = globeBitmap();
const LAPTOP = laptopBitmap();
const CORNER_ICON = [
  [true, true],
  [true, true],
];

function Reveal({
  children,
  delay,
}: {
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ clipPath: "inset(0 100% 0 0)" }}
      animate={{ clipPath: "inset(0 0% 0 0)" }}
      transition={{ duration: 0.3, delay, ease: [0.65, 0, 0.35, 1] }}
    >
      {children}
    </motion.div>
  );
}

// Real progressive-reveal typewriter: only the already-"typed" characters
// take up space, so the cursor sits right where typing actually is instead
// of being glued to the end of a pre-laid-out string.
function TypedLine({
  text,
  startDelayMs,
  stepMs,
}: {
  text: string;
  startDelayMs: number;
  stepMs: number;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let i = 0;
    let stepId: ReturnType<typeof setInterval> | undefined;
    const startId = setTimeout(() => {
      stepId = setInterval(() => {
        i += 1;
        setCount(i);
        playKeyClick();
        if (i >= text.length && stepId) clearInterval(stepId);
      }, stepMs);
    }, startDelayMs);
    return () => {
      clearTimeout(startId);
      if (stepId) clearInterval(stepId);
    };
  }, [text, startDelayMs, stepMs]);

  const done = count >= text.length;

  return (
    <span className={styles.accessLine}>
      {text.slice(0, count)}
      <span className={done ? styles.accessCursorIdle : styles.accessCursor} aria-hidden="true">
        |
      </span>
    </span>
  );
}

export default function BootIntro() {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<"connect" | "hud">("connect");

  useEffect(() => {
    if (reduced) return;

    // Plays on every fresh page load (not gated behind sessionStorage) so
    // it's reliably visible each time the site is opened or reloaded.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
    setPhase("connect");
    playBootChime();
    const toHud = setTimeout(() => {
      setPhase("hud");
      playSystemReady();
    }, PHASE1_MS);
    const hide = setTimeout(() => setVisible(false), BOOT_VISIBLE_MS);
    return () => {
      clearTimeout(toHud);
      clearTimeout(hide);
    };
  }, [reduced]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className={phase === "hud" ? `${styles.frameWrap} ${styles.frameWide}` : styles.frameWrap}>
            <DottedFrame>
              {phase === "connect" && (
                <motion.div
                  className={styles.scanline}
                  initial={{ top: "0%", opacity: 1 }}
                  animate={{ top: "100%", opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  aria-hidden="true"
                />
              )}
              <motion.div
                className={styles.titlebar}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
              >
                <span className={styles.titleText}>
                  {phase === "connect" ? "establishing connection" : "systems online"}
                </span>
                <DotIcon bitmap={CORNER_ICON} label="" dot={3} gap={2} />
              </motion.div>

              <AnimatePresence mode="wait">
                {phase === "connect" ? (
                  <motion.div
                    key="connect"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className={styles.scene}>
                      <Reveal delay={0.05}>
                        <DotIcon bitmap={GLOBE} label="Internet" dot={4} gap={1.5} />
                      </Reveal>
                      <div className={styles.link} aria-hidden="true">
                        {[0, 1, 2, 3].map((i) => (
                          <motion.span
                            key={i}
                            className={styles.linkDot}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: [0, 1, 0.25, 1], scale: 1 }}
                            transition={{
                              opacity: {
                                duration: 0.5,
                                repeat: Infinity,
                                repeatDelay: 0.1,
                                delay: 0.35 + i * 0.07,
                                ease: "easeInOut",
                              },
                              scale: { duration: 0.15, delay: 0.35 + i * 0.07 },
                            }}
                          />
                        ))}
                      </div>
                      <Reveal delay={0.25}>
                        <DotIcon bitmap={LAPTOP} label="Your device" dot={4} gap={1.5} />
                      </Reveal>
                    </div>
                    <div className={styles.accessRow} aria-hidden="true">
                      <TypedLine
                        text={ACCESS_TEXT}
                        startDelayMs={ACCESS_START_MS}
                        stepMs={ACCESS_STEP_MS}
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="hud"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <BootHud />
                  </motion.div>
                )}
              </AnimatePresence>
            </DottedFrame>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
