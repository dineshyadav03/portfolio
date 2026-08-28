"use client";

import { motion } from "framer-motion";
import AsciiPortrait from "@/components/AsciiPortrait";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import BuildStatusPanel from "@/components/BuildStatusPanel";
import DotIcon from "@/components/DotIcon";
import PageGlitch from "@/components/PageGlitch";
import Prompt from "@/components/Prompt";
import StatusReadout from "@/components/StatusReadout";
import { profile } from "@/lib/content";
import { textToDotBitmap } from "@/lib/dotFont";
import { fadeUp, listContainer, listItem } from "@/lib/motion";
import styles from "./page.module.css";

const WORDMARK = textToDotBitmap(profile.handle);

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
          <AsciiPortrait />
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <Prompt command="cat status.txt" />
        <StatusReadout />
        <AnnouncementBanner />
        <BuildStatusPanel />
      </motion.div>
    </PageGlitch>
  );
}
