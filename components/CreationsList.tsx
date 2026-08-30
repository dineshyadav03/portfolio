"use client";

import { motion } from "framer-motion";
import type { Project } from "@/lib/content";
import { listContainer, listItem, revealOnce } from "@/lib/motion";
import SectionDivider from "./SectionDivider";
import styles from "@/app/creations/page.module.css";

function ProjectList({ projects, groupCode }: { projects: Project[]; groupCode: string }) {
  return (
    <motion.ul
      className={styles.list}
      initial="hidden"
      whileInView="show"
      viewport={revealOnce}
      variants={listContainer}
    >
      {projects.map((project, i) => (
        <motion.li
          key={project.name}
          className={styles.item}
          variants={listItem}
          whileHover={{ x: 4 }}
          transition={{ duration: 0.15 }}
        >
          <div className={styles.itemHead}>
            <span className={styles.index} aria-hidden="true">
              {groupCode}.{String(i + 1).padStart(2, "0")}
            </span>
            <h3 className={styles.itemName}>
              {project.href ? <a href={project.href}>{project.name}</a> : project.name}
            </h3>
            {project.status && (
              <span
                className={
                  project.status === "merged"
                    ? `${styles.status} ${styles.statusMerged}`
                    : styles.status
                }
              >
                {project.status}
              </span>
            )}
          </div>
          <p className={styles.itemDesc}>{project.description}</p>
          {project.stack && project.stack.length > 0 && (
            <p className={styles.stack}>{project.stack.join(" · ")}</p>
          )}
        </motion.li>
      ))}
    </motion.ul>
  );
}

export default function CreationsList({ projects }: { projects: Project[] }) {
  const ownBuilds = projects.filter((p) => !p.status);
  const contributions = projects.filter((p) => p.status);

  return (
    <>
      <ProjectList projects={ownBuilds} groupCode="0.02" />
      {contributions.length > 0 && (
        <>
          <SectionDivider label="0.02b — open-source contributions" />
          <ProjectList projects={contributions} groupCode="0.02b" />
        </>
      )}
    </>
  );
}
