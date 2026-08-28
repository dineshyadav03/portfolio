"use client";

import { motion } from "framer-motion";
import type { Post } from "@/lib/content";
import { listContainer, listItem } from "@/lib/motion";
import styles from "@/app/reflections/page.module.css";

export default function ReflectionsList({ posts }: { posts: Post[] }) {
  return (
    <motion.ul className={styles.list} initial="hidden" animate="show" variants={listContainer}>
      {posts.map((post) => (
        <motion.li
          key={post.title}
          className={styles.item}
          variants={listItem}
          whileHover={{ x: 4 }}
          transition={{ duration: 0.15 }}
        >
          <div className={styles.itemHead}>
            {post.href ? (
              <a href={post.href} className={styles.itemTitle}>
                {post.title}
              </a>
            ) : (
              <span className={styles.itemTitle}>{post.title}</span>
            )}
            <time className={styles.date} dateTime={post.date}>
              {post.date}
            </time>
          </div>
          <p className={styles.summary}>{post.summary}</p>
        </motion.li>
      ))}
    </motion.ul>
  );
}
