"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useScroll, useTransform } from "framer-motion";
import AsciiPortrait from "@/components/AsciiPortrait";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import BuildStatusPanel from "@/components/BuildStatusPanel";
import CapabilitySystem from "@/components/CapabilitySystem";
import CoreLog from "@/components/CoreLog";
import CoreSignal from "@/components/CoreSignal";
import DotField from "@/components/DotField";
import DotIcon from "@/components/DotIcon";
import HeroNeuralNet from "@/components/HeroNeuralNet";
import HeroVectorSpace from "@/components/HeroVectorSpace";
import HowIWork from "@/components/HowIWork";
import MaskedText from "@/components/MaskedText";
import PageGlitch from "@/components/PageGlitch";
import ParallaxItem from "@/components/ParallaxItem";
import Prompt from "@/components/Prompt";
import SectionDivider from "@/components/SectionDivider";
import SpatialObject from "@/components/SpatialObject";
import StatusReadout from "@/components/StatusReadout";
import SystemPipeline from "@/components/SystemPipeline";
import { profile } from "@/lib/content";
import { textToDotBitmap } from "@/lib/dotFont";
import { EASE, fadeUp, listContainer, listItem, revealOnce } from "@/lib/motion";
import { playScrollThreshold } from "@/lib/sound";
import { useIsSystemReady } from "@/lib/systemStatus";
import styles from "./page.module.css";

const WORDMARK = textToDotBitmap(profile.name);

export default function Home() {
  const chamberRef = useRef<HTMLDivElement>(null);
  const sceneCoreRef = useRef<HTMLDivElement>(null);
  const sceneIdentityRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  // Pass 24: the hero previously animated in on its own mount timer,
  // completely independent of the boot sequence — its entire entrance
  // (object, wordmark, portrait, identity) finished within ~1s of mount,
  // silently, behind BootIntro's overlay, which stays up for ~5.5s. The
  // first thing a visitor ever actually saw was the hero already fully
  // settled. `ready` ties every hero entrance below to the real boot →
  // ready handoff instead: false until BootIntro's overlay actually
  // clears (or, on a route return, the short navigating→ready window
  // PageTransition already drives — see lib/systemStatus.ts).
  const ready = useIsSystemReady();
  // Pass 24 diagnostic finding: a route's client component tree can
  // genuinely remount mid-navigation (see the long comment in
  // lib/systemStatus.ts). `ready` alone isn't enough to prevent a replayed
  // entrance on a remount that lands post-ready — `initial` still applies
  // fresh to any newly-mounted motion component regardless of what
  // `animate` resolves to. `wasReadyAtMount` freezes whatever `ready` was
  // on this specific instance's very first render (a plain useState
  // initial value, evaluated once); every gated element below uses it to
  // pass `initial={false}` when true, skipping the entrance transition
  // entirely for an instance that mounted into an already-settled world,
  // instead of replaying it a second time.
  const [wasReadyAtMount] = useState(ready);
  // Pass 31: a genuine pinned scroll sequence, on explicit request — the
  // hero previously just sat in normal document flow (object, wordmark,
  // portrait, and text all visible together, with a subtle exit drift as
  // you scrolled past). Now `.chamber` is a tall scroll runway
  // (page.module.css) with `.pinStage` held via `position: sticky` while
  // the visitor scrolls through it; `pinProgress` (0 at the top of that
  // runway, 1 at the bottom) drives the actual handoff below: the core
  // fades/shrinks away, then the portrait + identity text rise in to
  // replace it, in the SAME pinned viewport space rather than one simply
  // scrolling past the other.
  const { scrollYProgress: pinProgress } = useScroll({
    target: chamberRef,
    offset: ["start start", "end end"],
  });
  // Scene A (the core: object, HUD panels, wordmark, whoami) — fully
  // present through the first third of the runway, then fades and
  // contracts, same "receding" language SpatialObject's own recede-driven
  // scale already used for the old exit drift, just now driving the
  // whole scene instead of one element.
  const coreOpacity = useTransform(pinProgress, [0, 0.32, 0.48], [1, 1, 0]);
  const coreScale = useTransform(pinProgress, [0.3, 0.48], [1, 0.88]);
  // Scene B (portrait + identity) — starts rising in right as the core
  // finishes fading (a deliberate small overlap, not a gap), fully
  // settled well before the runway ends so there's real held time to
  // actually read the identity text before normal scroll resumes.
  const identityOpacity = useTransform(pinProgress, [0.42, 0.62], [0, 1]);
  const identityY = useTransform(pinProgress, [0.42, 0.62], [36, 0]);
  // AsciiPortrait's own pointer-tilt depth effect still wants a 0→1
  // "how far past the reveal are we" input (see AsciiPortrait.tsx) — fed
  // from the second half of the runway (after the portrait is already
  // visible) rather than the old separate heroRef-based tracker, which
  // this pin sequence now fully supersedes. Reduced motion never reads
  // this (AsciiPortrait's own pointer effect is skipped entirely there),
  // so a static MotionValue is a safe, valid stand-in for the hook rules'
  // sake rather than branching which hook gets called.
  const portraitDepthProgress = useTransform(pinProgress, [0.5, 1], [0, 1]);
  const staticProgress = useMotionValue(0);
  // A discrete "has scene B actually revealed yet" boolean, derived from
  // the same continuous pinProgress — drives the identity text's existing
  // listContainer/listItem stagger (a threshold-triggered reveal) without
  // that stagger fighting the continuous scroll-scrubbed opacity/y above,
  // which live on the outer .sceneIdentity wrapper instead — two
  // different mechanisms on two different elements, not one property with
  // two writers.
  const [sceneBRevealed, setSceneBRevealed] = useState(false);
  useEffect(() => {
    if (reduced) return;
    return pinProgress.on("change", (v) => setSceneBRevealed(v > 0.42));
  }, [pinProgress, reduced]);
  // Diagnostic finding (Pass 32): framer-motion's own `style={{ opacity,
  // scale/y }}` binding on these two scene wrappers would silently stop
  // writing to the DOM partway through the runway (confirmed live: the
  // underlying MotionValues kept computing the correct, monotonic 0→1
  // progress the whole time — read directly via `.get()` — while the
  // element's actual inline `opacity`/`transform` froze and, past a point,
  // reverted to the scene's opening value, leaving the core visible where
  // it should have faded and the identity scene invisible where it should
  // have been fully shown). Reproduced identically in a production build,
  // so not a dev-mode/Strict-Mode artifact. Root cause not fully isolated
  // (didn't track to the sceneBRevealed re-render, nor to coreScale's own
  // clamp point), so rather than depend on framer-motion's own DOM-write
  // scheduling for this specific chain, both scenes are now driven by a
  // plain, direct subscription writing straight to the DOM via refs below
  // — the exact mechanism that stayed correct through every diagnostic
  // sample this pass.
  useEffect(() => {
    if (reduced) return;
    const applyCore = () => {
      const el = sceneCoreRef.current;
      if (!el) return;
      el.style.opacity = String(coreOpacity.get());
      el.style.transform = `scale(${coreScale.get()})`;
    };
    const applyIdentity = () => {
      const el = sceneIdentityRef.current;
      if (!el) return;
      el.style.opacity = String(identityOpacity.get());
      el.style.transform = `translateY(${identityY.get()}px)`;
    };
    applyCore();
    applyIdentity();
    const unsubs = [
      coreOpacity.on("change", applyCore),
      coreScale.on("change", applyCore),
      identityOpacity.on("change", applyIdentity),
      identityY.on("change", applyIdentity),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, [reduced, coreOpacity, coreScale, identityOpacity, identityY]);
  // One semantic scroll milestone — the pin sequence essentially
  // finished, about to hand off to normal scroll — gets a single
  // confirmation tone the first time it's crossed. Subscribed directly
  // via pinProgress.on() (not the useMotionValueEvent hook) so the
  // listener can unsubscribe itself the instant it fires.
  useEffect(() => {
    if (reduced) return;
    const unsubscribe = pinProgress.on("change", (latest) => {
      if (latest >= 0.95) {
        playScrollThreshold();
        unsubscribe();
      }
    });
    return unsubscribe;
  }, [pinProgress, reduced]);

  return (
    <PageGlitch>
      {/* The visible wordmark is a decorative dot-matrix rendering, not
          real text — this carries the actual page title for screen
          readers and search engines. */}
      <h1 className="srOnly">
        {profile.name} — {profile.role}
      </h1>
      {/* Pass 19: the hero previously lived entirely inside TerminalWindow's
          900px frame, exactly like every other section — meaning "the
          system core" and "a paragraph of body text" occupied the same
          spatial register. This breaks it out to the full viewport width
          (the classic `100vw` + negative-margin technique; safe here
          specifically because this site already hides its scrollbar
          sitewide — globals.css — so there's no reserved scrollbar gutter
          for 100vw to overshoot by) with real vertical presence via
          min-height, rather than only being as tall as its content happens
          to be. A flat background tone (--chamber-bg, tuned in Pass 23 for
          real contrast against the page in both themes) and a dotted
          boundary rule (the
          same language SectionDivider already uses) frame it as a
          genuinely distinct chamber the rest of the page sits beneath, not
          a bigger version of the same container. */}
      <div className={styles.chamber} id="toc-about" ref={chamberRef} data-static={reduced || undefined}>
        <div className={styles.pinStage}>
          {/* Scene A — the core. Fully present at rest; fades and
              contracts as pinProgress advances, written directly via
              sceneCoreRef in the effect above rather than a motion `style`
              prop (see that effect's comment) — never under reduced
              motion, where this just sits in normal flow, unfaded. */}
          <div className={styles.sceneCore} ref={sceneCoreRef}>
            {/* The site's one dedicated 3D element, and the literal first
                thing a visitor sees — a slowly tumbling wireframe node
                lattice standing in for "design × technology ×
                intelligence" before any text does. */}
            <motion.div
              className={styles.spatialWrap}
              initial={wasReadyAtMount ? false : { opacity: 0, scale: 0.9 }}
              animate={reduced || ready ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              <SpatialObject scrollProgress={pinProgress} scrollInfluence={1.1} />
            </motion.div>
            {/* Three margin HUD panels — a "JARVIS" multi-panel frame
                around the object. Fade out together with the rest of
                scene A (inherited via .sceneCore's own opacity, not a
                second transform on each) rather than lingering once the
                core they're telemetry *for* is gone. Omitted entirely
                under reduced motion: their own absolute positioning is
                tuned for the pinned layout specifically, and they're
                decorative chrome, not essential content. */}
            {!reduced && (
              <>
                <CoreLog ready={ready} skipEntrance={wasReadyAtMount} />
                <HeroVectorSpace ready={ready} skipEntrance={wasReadyAtMount} />
                <HeroNeuralNet ready={ready} skipEntrance={wasReadyAtMount} />
              </>
            )}
            <CoreSignal ready={reduced || ready} skipEntrance={wasReadyAtMount} />
            <motion.div
              className={styles.wordmark}
              initial={wasReadyAtMount ? false : { opacity: 0 }}
              animate={reduced || ready ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.15, ease: EASE }}
            >
              <DotIcon bitmap={WORDMARK} label={profile.name} dot={3} gap={1.5} flicker />
            </motion.div>
            {/* Held out of the DOM entirely (not just delayed) until
                ready — Prompt's own typewriter timer starts
                unconditionally on mount and isn't reduced-motion aware,
                so for this one hero instance the correct fix is
                deferring the mount itself rather than reaching into a
                component used sitewide. */}
            {(reduced || ready) && <Prompt command="whoami" />}
          </div>

          {/* Scene B — portrait + identity. Rises in as scene A fades,
              written directly via sceneIdentityRef in the effect above
              rather than a motion `style` prop; under reduced motion this
              is unstyled (no scroll transform) and instead plays its own
              ready-gated fadeUp, same as the old layout did, so it just
              appears in normal document flow below scene A rather than
              depending on a pin sequence that doesn't run there. */}
          <motion.div
            ref={sceneIdentityRef}
            className={styles.sceneIdentity}
            initial={reduced && !wasReadyAtMount ? "hidden" : false}
            animate={reduced ? (ready ? "show" : "hidden") : undefined}
            variants={reduced ? fadeUp : undefined}
            transition={reduced ? { duration: 0.3, delay: 0.3, ease: EASE } : undefined}
          >
            <div className={styles.hero}>
              <motion.div className={styles.portrait}>
                <DotField />
                <ParallaxItem strength={18}>
                  <AsciiPortrait heroProgress={reduced ? staticProgress : portraitDepthProgress} />
                </ParallaxItem>
              </motion.div>
              {/* Pass 18: three real tiers using fields that already
                  existed in profile — `role` (the actual job title, a
                  genuine identity claim, promoted to poster scale) →
                  `tagline` (the structured, technical description,
                  demoted to a secondary line) → tags/bio (system
                  metadata, visually set apart with a rule). No new
                  content, no fabrication.

                  Pass 20: `.identity` gets a real staggered, masked
                  word-reveal (MaskedText) instead of the same flat fade
                  every other line in this stagger uses.

                  Pass 31: the stagger now triggers off sceneBRevealed
                  (a threshold on the same pinProgress driving the outer
                  wrapper's continuous opacity/y) instead of the old flat
                  `ready` gate — under reduced motion it still just uses
                  `ready` directly, matching the wrapper's own simpler
                  fadeUp-only treatment there. */}
              <motion.div
                className={styles.intro}
                initial={wasReadyAtMount ? false : "hidden"}
                animate={(reduced ? ready : sceneBRevealed) ? "show" : "hidden"}
                variants={listContainer}
                transition={{ staggerChildren: 0.07, delayChildren: reduced ? 0.38 : 0.05 }}
              >
                <p className={styles.identity}>
                  <MaskedText
                    text={profile.role}
                    delay={0.4}
                    start={reduced ? ready : sceneBRevealed}
                    skipEntrance={wasReadyAtMount}
                  />
                </p>
                <motion.p className={styles.role} variants={listItem}>
                  {profile.tagline}
                  <span className={styles.cursor} aria-hidden="true" />
                </motion.p>
                <motion.p className={styles.tags} variants={listItem}>
                  {profile.capabilityTags.join(" · ")}
                </motion.p>
                <div className={styles.bioBlock}>
                  {profile.bio.map((line) => (
                    <motion.p key={line} className={styles.bioLine} variants={listItem}>
                      {line}
                    </motion.p>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Every section below is a self-contained "module" (a divider plus
          the one system it introduces) — the divider's own whileInView
          (inside SectionDivider) and the content's whileInView trigger at
          essentially the same scroll position (adjacent siblings, same
          `revealOnce` viewport), and now share the same duration/ease too,
          so the pair reads as ONE composition resolving at once rather
          than a two-step "line draws, then content pops in" sequence. An
          earlier version staggered content behind the divider by a fixed
          150ms; removed — with matched timing, the two elements simply
          settling together already reads as one deliberate reveal, and a
          system this small doesn't need an extra beat to feel legible. */}
      <SectionDivider label="0.01b — capabilities" id="toc-capabilities" />
      <motion.div initial="hidden" whileInView="show" viewport={revealOnce} variants={fadeUp}>
        <Prompt command="cat capabilities.txt" />
        <CapabilitySystem />
      </motion.div>

      <SectionDivider label="0.01c — how i work" id="toc-how-i-work" />
      <motion.div initial="hidden" whileInView="show" viewport={revealOnce} variants={fadeUp}>
        <Prompt command="cat process.txt" />
        <HowIWork />
      </motion.div>

      <SectionDivider label="0.01d — system pattern" id="toc-system-pattern" />
      <Prompt command="cat pipeline.txt" />
      <SystemPipeline />

      <SectionDivider label="0.01e — status" id="toc-status" />
      <motion.div initial="hidden" whileInView="show" viewport={revealOnce} variants={listContainer}>
        <Prompt command="cat status.txt" />
        <StatusReadout />
        <motion.div variants={listItem}>
          <AnnouncementBanner />
        </motion.div>
      </motion.div>

      <SectionDivider label="0.01f — build" id="toc-build" />
      <motion.div initial="hidden" whileInView="show" viewport={revealOnce} variants={fadeUp}>
        <BuildStatusPanel />
      </motion.div>

    </PageGlitch>
  );
}
