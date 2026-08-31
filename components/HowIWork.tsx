"use client";

import { useEffect, useRef } from "react";
import { useScroll } from "framer-motion";
import { howIWork } from "@/lib/content";
import styles from "./HowIWork.module.css";

// The six-step process, now driven by continuous scroll progress rather
// than appearing as a static list — as the section scrolls through the
// viewport, the spine "resolves" step by step: passed steps settle into a
// subtly-active state, the current step becomes the dominant one, future
// steps stay restrained. No per-frame React state — a single scroll
// subscription writes a `data-state` attribute directly onto each cached
// item ref (the same direct-DOM-write pattern CreationsList's pointer
// handler already uses), and every visual response is plain CSS reacting
// to that attribute.
export default function HowIWork() {
  const wrapRef = useRef<HTMLOListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  // Same offset convention SystemPipeline already uses for its own
  // scroll-linked stage progression — one shared "how scroll maps to
  // stage index" language across both process sections.
  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ["start center", "end center"] });

  useEffect(() => {
    const n = howIWork.length;
    const unsubscribe = scrollYProgress.on("change", (v) => {
      const activeStep = Math.min(n - 1, Math.max(0, Math.floor(v * n)));
      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        el.dataset.state = i < activeStep ? "passed" : i === activeStep ? "active" : "future";
      });
    });
    return unsubscribe;
  }, [scrollYProgress]);

  return (
    <ol className={styles.list} ref={wrapRef}>
      {howIWork.map((row, i) => (
        <li
          className={styles.item}
          data-state="future"
          key={row.step}
          ref={(el) => {
            itemRefs.current[i] = el;
          }}
        >
          <span className={styles.index}>{String(i + 1).padStart(2, "0")}</span>
          <span className={styles.step}>{row.step}</span>
          <span className={styles.detail}>{row.detail}</span>
        </li>
      ))}
    </ol>
  );
}
