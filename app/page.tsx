"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import HeroBackground from "@/components/HeroBackground";
import { capabilities, profile } from "@/lib/content";
import { fadeUp, listContainer, listItem, revealOnce } from "@/lib/motion";
import styles from "./page.module.css";

// Pass 37: full identity pivot — this replaces the previous terminal-hero
// (pinned-scroll core object → ASCII portrait handoff) with the new dark
// cinematic/glass layout. Every piece of copy below is sourced from real
// `lib/content.ts` fields, not invented marketing copy (see the plan's
// content-mapping table) — the two headlines are verb-extractions of
// profile.tagline/bio's own words, not new claims.
const H1_LINES = ["Build. Deploy.", "Improve."];
const H2_LINES = ["Build. Ship.", "Iterate."];

// Three of the five real capability categories (lib/content.ts) — picked
// for the glass panel's three rows rather than all five, to match the
// reference's row count; the other two (Software engineering, Domain)
// are still fully listed on /creations and elsewhere.
const PANEL_CATEGORIES = ["AI engineering", "AI infrastructure", "Forward deployment"];

export default function Home() {
  const initials = profile.name
    .split(" ")
    .map((part) => part[0])
    .join("");
  const panelRows = capabilities.filter((c) => PANEL_CATEGORIES.includes(c.category));

  return (
    <>
      <h1 className="srOnly">
        {profile.name} — {profile.role}
      </h1>
      <HeroBackground />

      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <motion.div
            className={styles.serviceList}
            initial="hidden"
            whileInView="show"
            viewport={revealOnce}
            variants={listContainer}
          >
            {profile.capabilityTags.map((tag) => (
              <motion.span key={tag} className={styles.serviceItem} variants={listItem}>
                / {tag.toUpperCase()}
              </motion.span>
            ))}
          </motion.div>

          <motion.p
            className={styles.heroIntro}
            initial="hidden"
            whileInView="show"
            viewport={revealOnce}
            variants={fadeUp}
          >
            {profile.tagline}
          </motion.p>
        </div>

        <div className={styles.heroBottom}>
          <div className={styles.heroBottomLeft}>
            <motion.span
              className={styles.badge}
              initial="hidden"
              whileInView="show"
              viewport={revealOnce}
              variants={fadeUp}
            >
              {profile.taglineUndercut}
            </motion.span>
            <motion.h2
              className={styles.h1}
              initial="hidden"
              whileInView="show"
              viewport={revealOnce}
              variants={fadeUp}
            >
              {H1_LINES.map((line) => (
                <span key={line} className={styles.h1Line}>
                  {line}
                </span>
              ))}
            </motion.h2>
          </div>

          <motion.div
            className={styles.contactCard}
            initial="hidden"
            whileInView="show"
            viewport={revealOnce}
            variants={fadeUp}
          >
            <div className={styles.avatar} aria-hidden="true">
              {initials}
            </div>
            <div className={styles.contactText}>
              <p className={styles.contactName}>Talk with {profile.name.split(" ")[0]}</p>
              <p className={styles.contactRole}>{profile.role}</p>
              <a href={`mailto:${profile.email}`} className={styles.contactCta}>
                Get in touch
                <ChevronRight size={14} aria-hidden="true" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Scroll room for HeroBackground's parallax to have somewhere to
          go — matches the reference's own 80vh spacer between sections,
          not a section in its own right. */}
      <div className={styles.spacer} aria-hidden="true" />

      <section className={styles.capability}>
        <div className={styles.capabilityTop}>
          <motion.span
            className={styles.badge}
            initial="hidden"
            whileInView="show"
            viewport={revealOnce}
            variants={fadeUp}
          >
            Forward deployed
          </motion.span>
          <motion.p
            className={styles.capabilityIntro}
            initial="hidden"
            whileInView="show"
            viewport={revealOnce}
            variants={fadeUp}
          >
            {profile.bio[1]}
          </motion.p>
        </div>

        <div className={styles.capabilityBottom}>
          <div className={styles.capabilityLeft}>
            <motion.h2
              className={styles.h1}
              initial="hidden"
              whileInView="show"
              viewport={revealOnce}
              variants={fadeUp}
            >
              {H2_LINES.map((line) => (
                <span key={line} className={styles.h1Line}>
                  {line}
                </span>
              ))}
            </motion.h2>
            <motion.p
              className={styles.capabilityBody}
              initial="hidden"
              whileInView="show"
              viewport={revealOnce}
              variants={fadeUp}
            >
              {profile.bio[0]}
            </motion.p>
            <motion.div
              className={styles.ctaRow}
              initial="hidden"
              whileInView="show"
              viewport={revealOnce}
              variants={fadeUp}
            >
              <Link href="/creations" className={styles.ctaPrimary}>
                View work
                <ChevronRight size={14} aria-hidden="true" />
              </Link>
              <Link href="/contact" className={styles.ctaSecondary}>
                Get in touch
              </Link>
            </motion.div>
          </div>

          <motion.div
            className={styles.panel}
            initial="hidden"
            whileInView="show"
            viewport={revealOnce}
            variants={listContainer}
          >
            {panelRows.map((row, i) => (
              <motion.div className={styles.panelRow} key={row.category} variants={listItem}>
                <span className={styles.panelIndex}>{String(i + 1).padStart(2, "0")}</span>
                <div className={styles.panelText}>
                  <p className={styles.panelTitle}>
                    {row.category}
                    <ChevronRight size={16} className={styles.panelChevron} aria-hidden="true" />
                  </p>
                  <p className={styles.panelBody}>{row.items.join(" · ")}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );
}
