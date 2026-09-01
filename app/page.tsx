"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
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
  const heroRef = useRef<HTMLDivElement>(null);
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
  // Tracks scroll progress across the hero's own height: 0 while it's still
  // pinned at the top of the viewport, 1 once it's fully scrolled past —
  // i.e. "how far away from the hero has the visitor scrolled," not the
  // page's total scroll. Purely a derived MotionValue (no React state), the
  // same mechanism ParallaxItem already uses for the portrait's entry drift.
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  // Pass 17: strengthened from -18/0.7 — the previous magnitudes were
  // subtle enough that leaving the hero barely registered as a change of
  // state. This should read as a real compositional shift, not a drift.
  const portraitExitY = useTransform(heroProgress, [0, 1], [0, -32]);
  // Pass 25: the portrait previously only drifted (y) on exit — no scale
  // channel, unlike SpatialObject, which already shrinks via its own
  // internal `recede`-driven scale as heroProgress rises. That meant the
  // object visibly contracted on exit while the portrait beside it just
  // slid, not a coordinated "the whole system is compressing together"
  // exit. Same heroProgress input, same real event (scrolling the hero
  // away), no new listener — just a second transform channel (scale,
  // which the portrait never had) composing alongside the existing y and
  // opacity ones rather than fighting them. Magnitude matched to
  // SpatialObject's own recede shrink (~0.78 at full recede) so the two
  // read as one system settling, not two independently-tuned effects.
  const portraitExitScale = useTransform(heroProgress, [0, 1], [1, 0.86]);
  const introOpacity = useTransform(heroProgress, [0, 1], [1, 0.5]);
  // The wordmark previously sat completely inert once its entrance
  // finished — the object and portrait receded together as the visitor
  // scrolled past the hero, but the wordmark just stayed put, so the hero
  // read as two things that respond to scroll and one that doesn't rather
  // than one composition compressing as a whole. Same heroProgress input,
  // same kind of subtle drift/fade the portrait already uses.
  const wordmarkExitY = useTransform(heroProgress, [0, 1], [0, -24]);
  const wordmarkExitOpacity = useTransform(heroProgress, [0, 1], [1, 0.35]);
  // One semantic scroll milestone — the hero fully receding past the
  // viewport — gets a single confirmation tone the first time it's
  // crossed. Subscribed directly via heroProgress.on() (not the
  // useMotionValueEvent hook) so the listener can unsubscribe itself the
  // instant it fires: that makes "only once" structural rather than a
  // guard a fast-firing scroll stream has to keep respecting on every
  // subsequent "change" event.
  useEffect(() => {
    const unsubscribe = heroProgress.on("change", (latest) => {
      if (latest >= 0.95) {
        playScrollThreshold();
        unsubscribe();
      }
    });
    return unsubscribe;
  }, [heroProgress]);

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
      <div className={styles.chamber} id="toc-about">
        {/* The site's one dedicated 3D element, and the literal first thing
            a visitor sees — a slowly tumbling wireframe node lattice
            standing in for "design × technology × intelligence" before any
            text does. Tied to the hero's own scroll progress below, so
            scrolling past the hero continues turning it rather than
            leaving it inert. */}
        <motion.div
          className={styles.spatialWrap}
          initial={wasReadyAtMount ? false : { opacity: 0, scale: 0.9 }}
          animate={reduced || ready ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <SpatialObject scrollProgress={heroProgress} scrollInfluence={1.1} />
        </motion.div>
        {/* Three margin HUD panels, wide-viewport only (real side space
            has to exist for these to read as deliberate placement rather
            than clutter — see each one's own CSS gate) — a "JARVIS"
            multi-panel frame around the object rather than one readout.
            Left: the same real, live energy/velocity numbers as before,
            just relocated per direct feedback. Right: two more panels
            using the same real-data-vs-honestly-labeled-illustrative
            split already established (ProjectSignature, the reverted
            HeroConsole) — VECTOR SPACE plots real capability tags,
            NEURAL NET is explicitly captioned illustrative. */}
        <CoreLog ready={reduced || ready} skipEntrance={wasReadyAtMount} />
        <HeroVectorSpace ready={reduced || ready} skipEntrance={wasReadyAtMount} />
        <HeroNeuralNet ready={reduced || ready} skipEntrance={wasReadyAtMount} />
        <CoreSignal ready={reduced || ready} skipEntrance={wasReadyAtMount} />
        <motion.div
          className={styles.wordmark}
          initial={wasReadyAtMount ? false : { opacity: 0 }}
          animate={reduced || ready ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: EASE }}
        >
          {reduced ? (
            <DotIcon bitmap={WORDMARK} label={profile.name} dot={3} gap={1.5} />
          ) : (
            <motion.div style={{ y: wordmarkExitY, opacity: wordmarkExitOpacity }}>
              <DotIcon bitmap={WORDMARK} label={profile.name} dot={3} gap={1.5} flicker />
            </motion.div>
          )}
        </motion.div>
        {/* Held out of the DOM entirely (not just delayed) until ready —
            Prompt's own typewriter timer starts unconditionally on mount
            and isn't reduced-motion aware, so for this one hero instance
            the correct fix is deferring the mount itself rather than
            reaching into a component used sitewide (every other Prompt
            usage already sits behind its own whileInView-gated wrapper
            further down this page, so it doesn't share this bug). */}
        {(reduced || ready) && <Prompt command="whoami" />}
        <div className={styles.hero} ref={heroRef}>
        <motion.div
          className={styles.portrait}
          initial={wasReadyAtMount ? false : "hidden"}
          animate={reduced || ready ? "show" : "hidden"}
          variants={fadeUp}
          transition={{ duration: 0.3, delay: 0.3, ease: EASE }}
        >
          {/* The scroll-exit drift (+ Pass 25: scale) lives on its own
              wrapper, separate from the entrance fadeUp above and
              ParallaxItem's own entry drift below — independent transforms
              on separate elements compose safely via normal CSS stacking,
              instead of fighting over the same channel on one element.
              Skipped entirely under reduced motion rather than merely
              zeroed. */}
          <DotField />
          {reduced ? (
            <ParallaxItem strength={18}>
              <AsciiPortrait heroProgress={heroProgress} />
            </ParallaxItem>
          ) : (
            <motion.div style={{ y: portraitExitY, scale: portraitExitScale }}>
              <ParallaxItem strength={18}>
                <AsciiPortrait heroProgress={heroProgress} />
              </ParallaxItem>
            </motion.div>
          )}
        </motion.div>
        {/* Delayed to arrive just after the "whoami" prompt above finishes
            typing, so the hero reads as its answer rather than racing it —
            and, as of Pass 24, gated on the same real boot-ready signal as
            the rest of the hero rather than a mount-time timer. */}
        <motion.div
          className={styles.intro}
          initial={wasReadyAtMount ? false : "hidden"}
          animate={reduced || ready ? "show" : "hidden"}
          variants={listContainer}
          transition={{ staggerChildren: 0.07, delayChildren: 0.38 }}
          style={reduced ? undefined : { opacity: introOpacity }}
        >
          {/* Pass 18: the hero previously had one text tier (the tagline
              sentence, styled slightly larger) plus undifferentiated
              supporting lines — a font-size bump, not a hierarchy. This
              restructures it into three real tiers using fields that
              already existed in profile but weren't both surfaced here:
              `role` (the actual job title — a genuine identity claim,
              promoted to poster scale) → `tagline` (the structured,
              technical description, demoted to a secondary line) →
              tags/bio (system metadata, visually set apart with a rule).
              No new content, no fabrication — the same data, composed
              with real editorial hierarchy instead of one undifferentiated
              block.

              Pass 20: `.identity` is the hero's one "primary system
              declaration" — it gets a real staggered, masked word-reveal
              (MaskedText) instead of the same flat fade every other line in
              this stagger uses. It's pulled out of the `listItem`/
              `listContainer` orchestration entirely (MaskedText owns its
              own entrance + delay) since a flat opacity/y variant can't
              express a per-word mask. */}
          <p className={styles.identity}>
            <MaskedText text={profile.role} delay={0.4} start={reduced || ready} skipEntrance={wasReadyAtMount} />
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
