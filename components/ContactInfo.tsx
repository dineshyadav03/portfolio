"use client";

import { motion } from "framer-motion";
import { profile } from "@/lib/content";
import { listContainer, listItem } from "@/lib/motion";
import styles from "@/app/contact/page.module.css";

const socialLabels: Record<keyof typeof profile.social, string> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  twitter: "Twitter / X",
  resume: "Résumé",
};

export default function ContactInfo() {
  const socialLinks = (
    Object.entries(profile.social) as [keyof typeof profile.social, string][]
  ).filter(([, href]) => href);

  return (
    <>
      <motion.dl className={styles.list} initial="hidden" animate="show" variants={listContainer}>
        <motion.div className={styles.row} variants={listItem}>
          <dt>email</dt>
          <dd>
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </dd>
        </motion.div>
        <motion.div className={styles.row} variants={listItem}>
          <dt>location</dt>
          <dd>
            {profile.location.label} <span className={styles.dim}>(IST, UTC+5:30)</span>
          </dd>
        </motion.div>
        {socialLinks.map(([key, href]) => (
          <motion.div className={styles.row} key={key} variants={listItem}>
            <dt>{socialLabels[key]}</dt>
            <dd>
              <a href={href} target="_blank" rel="noreferrer noopener">
                {href}
              </a>
            </dd>
          </motion.div>
        ))}
      </motion.dl>
      {socialLinks.length === 0 && (
        <p className={styles.note}>
          TODO: add your GitHub / LinkedIn / résumé links in <code>lib/content.ts</code>.
        </p>
      )}
      <p className={styles.note}>
        Reach out anytime — replies come from {profile.location.label}, usually within a day
        across both IST and international working hours.
      </p>
    </>
  );
}
