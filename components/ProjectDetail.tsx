"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Project } from "@/lib/content";
import { listContainer, listItem } from "@/lib/motion";
import CaseStudy from "./CaseStudy";
import ProjectSignature from "./ProjectSignature";
import styles from "@/app/creations/[slug]/page.module.css";

// A real, dedicated page about one project — everything on it comes
// straight from the same `Project` record CreationsList already reads
// (lib/content.ts); nothing here is fabricated case-study copy. The
// external link (repo or PR) lives here, one layer in from the list,
// rather than on the list item itself — the list is for finding a
// project, this page is for actually reading about it.
export default function ProjectDetail({ project }: { project: Project }) {
  return (
    <motion.div initial="hidden" animate="show" variants={listContainer} transition={{ staggerChildren: 0.06 }}>
      <motion.div variants={listItem}>
        <Link href="/creations" className={styles.back}>
          ← work
        </Link>
      </motion.div>

      {/* The generic procedural signature is this page's only visual for
          most projects — but AEGIS's case study opens with its own real
          cover image (CaseStudy.tsx), which already does that job better,
          so showing both back to back would just be redundant. */}
      {!project.caseStudy?.images && (
        <motion.div className={styles.visualWrap} variants={listItem}>
          <ProjectSignature seed={project.name} status={project.status} />
        </motion.div>
      )}

      <motion.div className={styles.head} variants={listItem}>
        <span className={styles.stateDot} data-state={project.status ?? "active"} aria-hidden="true" />
        <h2 className={styles.name}>{project.name}</h2>
        {project.status && (
          <span
            className={project.status === "merged" ? `${styles.status} ${styles.statusMerged}` : styles.status}
          >
            {project.status}
          </span>
        )}
      </motion.div>

      <motion.p className={styles.desc} variants={listItem}>
        {project.description}
      </motion.p>

      {project.stack && project.stack.length > 0 && (
        <motion.ul className={styles.stack} variants={listItem}>
          {project.stack.map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </motion.ul>
      )}

      {project.href && (
        <motion.div variants={listItem}>
          <a href={project.href} target="_blank" rel="noreferrer noopener" className={styles.cta}>
            {project.status ? "view pull request" : "open repository"}
            <span aria-hidden="true">→</span>
          </a>
        </motion.div>
      )}

      {project.caseStudy && <CaseStudy data={project.caseStudy} />}
    </motion.div>
  );
}
