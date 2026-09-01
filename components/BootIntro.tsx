"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import BootHud from "./BootHud";
import DotIcon from "./DotIcon";
import DottedFrame from "./DottedFrame";
import { birdBitmap, globeBitmap, laptopBitmap } from "@/lib/dotIcons";
import { playBootChime, playKeyClick, playSystemReady } from "@/lib/sound";
import {
  ACCESS_START_MS,
  ACCESS_STEP_MS,
  ACCESS_TEXT,
  BOOT_VISIBLE_MS,
  HUD_MS,
  PHASE1_MS,
  WELCOME_START_MS,
  WELCOME_TEXT,
} from "@/lib/bootTiming";
import { setSystemStatus } from "@/lib/systemStatus";
import styles from "./BootIntro.module.css";

const GLOBE = globeBitmap();
const LAPTOP = laptopBitmap();
const BIRD_UP = birdBitmap();
const BIRD_DOWN = birdBitmap(34, 18, false);
const CORNER_ICON = [
  [true, true],
  [true, true],
];
const WELCOME_TO_HIDE_MS = HUD_MS; // when phase flips to "welcome", relative offset before hide

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

const DECRYPT_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%*+=-";

function randomGlyph() {
  return DECRYPT_GLYPHS[Math.floor(Math.random() * DECRYPT_GLYPHS.length)];
}

// A "decrypting" text reveal: characters scramble through random glyphs
// and lock in left to right, instead of a plain typewriter — an original
// take on the genre (own implementation, not a pulled-in component).
function DecryptLine({
  text,
  startDelayMs,
  className,
}: {
  text: string;
  startDelayMs: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(() => text.replace(/[^ ]/g, " "));
  const [done, setDone] = useState(false);

  useEffect(() => {
    let count = 0;
    let scrambleId: ReturnType<typeof setInterval> | undefined;
    let revealId: ReturnType<typeof setInterval> | undefined;

    const render = () => {
      setDisplay(
        text
          .split("")
          .map((c, i) => (c === " " ? " " : i < count ? c : randomGlyph()))
          .join(""),
      );
    };

    const startId = setTimeout(() => {
      scrambleId = setInterval(render, 45);
      revealId = setInterval(() => {
        count += 1;
        playKeyClick();
        render();
        if (count >= text.length) {
          if (revealId) clearInterval(revealId);
          if (scrambleId) clearInterval(scrambleId);
          setDone(true);
        }
      }, 70);
    }, startDelayMs);

    return () => {
      clearTimeout(startId);
      if (revealId) clearInterval(revealId);
      if (scrambleId) clearInterval(scrambleId);
    };
  }, [text, startDelayMs]);

  return (
    <span className={className ?? styles.accessLine}>
      {display}
      <span className={done ? styles.accessCursorIdle : styles.accessCursor} aria-hidden="true">
        |
      </span>
    </span>
  );
}

// Alternates between the two wing bitmaps on an interval — a cheap,
// dependency-free "sprite sheet" flap, same idea as Nia's blink cycle.
function FlappingBird() {
  const [up, setUp] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setUp((v) => !v), 170);
    return () => clearInterval(id);
  }, []);

  return <DotIcon bitmap={up ? BIRD_UP : BIRD_DOWN} label="A bird in flight" dot={7} gap={1.5} />;
}

export default function BootIntro() {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<"connect" | "hud" | "welcome">("connect");
  const [sweeping, setSweeping] = useState(false);
  // A real percentage — elapsed time over the boot sequence's own actual
  // total duration (BOOT_VISIBLE_MS, the same constant every phase
  // transition below already uses), not a fabricated "loading assets..."
  // number counting up on its own arbitrary timer. Reaches exactly 100%
  // the instant the overlay is about to clear — the same "counter arrives
  // at completion, then the system reveals" beat visible chrome (the
  // titlebar counter, the fill bar) both read from this one value, so
  // they can't drift out of sync with each other.
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    if (reduced) return;
    let raf: number | null = null;
    let start: number | null = null;
    function tick(time: number) {
      if (start === null) start = time;
      const pct = Math.min(100, Math.round(((time - start) / BOOT_VISIBLE_MS) * 100));
      setPercent((prev) => (prev === pct ? prev : pct));
      if (pct < 100) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  useEffect(() => {
    if (reduced) {
      // No boot sequence plays, so the system is "ready" from the first
      // frame — the status system (lib/systemStatus.ts) shouldn't be stuck
      // reporting "boot" forever just because the visual overlay was
      // skipped.
      setSystemStatus("ready");
      return;
    }

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
    const toWelcome = setTimeout(() => {
      setPhase("welcome");
    }, PHASE1_MS + WELCOME_TO_HIDE_MS);
    let sweepOff: ReturnType<typeof setTimeout>;
    const hide = setTimeout(() => {
      setVisible(false);
      // The real BOOT → READY handoff — the moment the overlay actually
      // clears is the moment the rest of the system (SysHeaderBar's live
      // status line, SpatialObject's power-up energy) gets to know boot is
      // over, instead of each of them guessing at the same timing constant
      // independently.
      setSystemStatus("ready");
      // A full-width scanline sweeps down over the real page right as it's
      // revealed — a deliberate "signal coming through" beat instead of the
      // site just appearing once the overlay fades, since a flat cross-fade
      // alone reads as static.
      setSweeping(true);
      sweepOff = setTimeout(() => setSweeping(false), 650);
    }, BOOT_VISIBLE_MS);
    return () => {
      clearTimeout(toHud);
      clearTimeout(toWelcome);
      clearTimeout(hide);
      clearTimeout(sweepOff);
    };
  }, [reduced]);

  return (
    <>
      <AnimatePresence>
        {sweeping && (
          <motion.div
            className={styles.revealSweep}
            initial={{ top: "0%", opacity: 1 }}
            animate={{ top: "100%", opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
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
              {/* Fills left-to-right in step with the titlebar's own
                  percentage below — one `percent` value, two coordinated
                  readouts, not two independently-timed effects. */}
              <div className={styles.progressTrack} aria-hidden="true">
                <motion.div
                  className={styles.progressFill}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.15, ease: "linear" }}
                />
              </div>
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
                  {phase === "connect"
                    ? "establishing connection"
                    : phase === "hud"
                      ? "systems online"
                      : "welcome"}
                </span>
                <span className={styles.titleRight}>
                  <span className={styles.percentText} data-complete={percent >= 100 || undefined} aria-hidden="true">
                    {percent}%
                  </span>
                  <DotIcon bitmap={CORNER_ICON} label="" dot={3} gap={2} />
                </span>
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
                ) : phase === "hud" ? (
                  <motion.div
                    key="hud"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <BootHud />
                  </motion.div>
                ) : (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className={styles.welcomeScene}>
                      <FlappingBird />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </DottedFrame>
          </div>
          {/* The percentage previously lived only in the titlebar corner —
              real, correctly wired, but competing for attention with a
              busy animated scene (connection handshake, then a full
              dashboard) is exactly why it went unnoticed. This is the same
              large, unmissable slot WELCOME_TEXT already uses below the
              frame — the percentage owns it first, then hands off to the
              welcome message once it actually reaches 100%, instead of
              existing off to the side the whole time. */}
          {phase !== "welcome" ? (
            <motion.div
              className={styles.welcomeBig}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              aria-hidden="true"
            >
              <span className={styles.welcomeBigText}>{percent}%</span>
            </motion.div>
          ) : (
            <motion.div
              className={styles.welcomeBig}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              aria-hidden="true"
            >
              <DecryptLine
                text={WELCOME_TEXT}
                startDelayMs={WELCOME_START_MS}
                className={styles.welcomeBigText}
              />
            </motion.div>
          )}
        </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
