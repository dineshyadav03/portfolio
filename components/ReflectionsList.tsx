"use client";

import { motion } from "framer-motion";
import type { Post } from "@/lib/content";
import DottedFrame from "./DottedFrame";
import ProjectVisual from "./ProjectVisual";
import { fadeUp, listContainer, listItem, revealOnce } from "@/lib/motion";
import styles from "@/app/reflections/page.module.css";

export default function ReflectionsList({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    // An honest empty state, not a fabricated post — but rendered as a
    // real designed element (the same dotted-frame "standby" language the
    // boot sequence uses) rather than a single gray line of text, so an
    // empty section still reads as intentional.
    return (
      <motion.div initial="hidden" whileInView="show" viewport={revealOnce} variants={fadeUp}>
        <DottedFrame>
          <div className={styles.emptyBox}>
            <p className={styles.empty}>Nothing published yet.</p>
            <p className={styles.emptySub}>Check back soon — first entry in progress.</p>
          </div>
        </DottedFrame>
      </motion.div>
    );
  }

  return (
    <motion.ul
      className={styles.list}
      initial="hidden"
      whileInView="show"
      viewport={revealOnce}
      variants={listContainer}
    >
      {posts.map((post, i) => (
        <motion.li
          key={post.title}
          className={styles.item}
          variants={listItem}
          whileHover={{ x: 4 }}
          transition={{ duration: 0.15 }}
        >
          <div className={styles.itemHead}>
            <span className={styles.index} aria-hidden="true">
              0.03.{String(i + 1).padStart(2, "0")}
            </span>
            <time className={styles.date} dateTime={post.date}>
              {post.date}
            </time>
          </div>
          {post.href ? (
            <a href={post.href} className={styles.itemTitle}>
              {post.title}
            </a>
          ) : (
            <span className={styles.itemTitle}>{post.title}</span>
          )}
          {/* The same deterministic per-entry visual mark Creations uses
              (see components/ProjectVisual.tsx) — reused here rather than
              a second bespoke marker system, so the two visual pages share
              one language instead of two. */}
          <div className={styles.marker}>
            <ProjectVisual seed={post.title} />
          </div>
          <p className={styles.summary}>{post.summary}</p>
        </motion.li>
      ))}
    </motion.ul>
  );
}
