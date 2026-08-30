"use client";

import { motion } from "framer-motion";
import AsciiPortrait from "@/components/AsciiPortrait";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import BuildStatusPanel from "@/components/BuildStatusPanel";
import DotIcon from "@/components/DotIcon";
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
        >
          <ParallaxItem strength={18}>
            <AsciiPortrait />
          </ParallaxItem>
        </motion.div>
        <motion.div
          className={styles.intro}
          initial="hidden"
          animate="show"
          variants={listContainer}
        >
          <motion.p className={styles.role} variants={listItem}>
            {profile.tagline}
            <span className={styles.cursor} aria-hidden="true" />
          </motion.p>
          {profile.bio.map((line) => (
            <motion.p key={line} className={styles.bioLine} variants={listItem}>
              {line}
            </motion.p>
          ))}
        </motion.div>
      </div>

      <SectionDivider label="0.01b — status" />
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

      <SectionDivider label="0.01c — build" />
      <motion.div initial="hidden" whileInView="show" viewport={revealOnce} variants={fadeUp}>
        <BuildStatusPanel />
      </motion.div>
    </PageGlitch>
  );
}
