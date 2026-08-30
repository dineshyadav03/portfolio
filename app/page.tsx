"use client";

import { motion } from "framer-motion";
import AsciiPortrait from "@/components/AsciiPortrait";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import BuildStatusPanel from "@/components/BuildStatusPanel";
import Capabilities from "@/components/Capabilities";
import DotIcon from "@/components/DotIcon";
import HowIWork from "@/components/HowIWork";
import PageGlitch from "@/components/PageGlitch";
import ParallaxItem from "@/components/ParallaxItem";
import Prompt from "@/components/Prompt";
import SectionDivider from "@/components/SectionDivider";
import StatusReadout from "@/components/StatusReadout";
import { profile } from "@/lib/content";
import { textToDotBitmap } from "@/lib/dotFont";
import { fadeUp, listContainer, listItem, revealOnce } from "@/lib/motion";
import styles from "./page.module.css";

const WORDMARK = textToDotBitmap(profile.name);

export default function Home() {
  return (
    <PageGlitch>
      {/* The visible wordmark is a decorative dot-matrix rendering, not
          real text — this carries the actual page title for screen
          readers and search engines. */}
      <h1 className="srOnly">
        {profile.name} — {profile.role}
      </h1>
      <motion.div
        className={styles.wordmark}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <DotIcon bitmap={WORDMARK} label={profile.name} dot={3} gap={1.5} />
      </motion.div>
      <Prompt command="whoami" />
      <div className={styles.hero}>
        <motion.div
          className={styles.portrait}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.3, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <ParallaxItem strength={18}>
            <AsciiPortrait />
          </ParallaxItem>
        </motion.div>
        {/* Delayed to arrive just after the "whoami" prompt above finishes
            typing, so the hero reads as its answer rather than racing it. */}
        <motion.div
          className={styles.intro}
          initial="hidden"
          animate="show"
          variants={listContainer}
          transition={{ staggerChildren: 0.07, delayChildren: 0.38 }}
        >
          <motion.p className={styles.role} variants={listItem}>
            {profile.tagline}
            <span className={styles.cursor} aria-hidden="true" />
          </motion.p>
          <motion.p className={styles.tags} variants={listItem}>
            {profile.capabilityTags.join(" · ")}
          </motion.p>
          {profile.bio.map((line) => (
            <motion.p key={line} className={styles.bioLine} variants={listItem}>
              {line}
            </motion.p>
          ))}
        </motion.div>
      </div>

      <SectionDivider label="0.01b — capabilities" />
      <motion.div initial="hidden" whileInView="show" viewport={revealOnce} variants={fadeUp}>
        <Prompt command="cat capabilities.txt" />
        <Capabilities />
      </motion.div>

      <SectionDivider label="0.01c — how i work" />
      <motion.div initial="hidden" whileInView="show" viewport={revealOnce} variants={fadeUp}>
        <Prompt command="cat process.txt" />
        <HowIWork />
      </motion.div>

      <SectionDivider label="0.01d — status" />
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={revealOnce}
        variants={listContainer}
      >
        <Prompt command="cat status.txt" />
        <motion.div variants={listItem}>
          <StatusReadout />
        </motion.div>
        <motion.div variants={listItem}>
          <AnnouncementBanner />
        </motion.div>
      </motion.div>

      <SectionDivider label="0.01e — build" />
      <motion.div initial="hidden" whileInView="show" viewport={revealOnce} variants={fadeUp}>
        <BuildStatusPanel />
      </motion.div>
    </PageGlitch>
  );
}
