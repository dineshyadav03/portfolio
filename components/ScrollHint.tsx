"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import styles from "./ScrollHint.module.css";

// A small "there's more below" cue, shown only while the visitor is still
// near the top of a page that actually has more content to scroll to.
// Fades out for good on the first real scroll.
export default function ScrollHint() {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // The homepage's hero chamber (#toc-about) is a tall pinned-scroll
    // runway (see app/page.tsx) — a flat 40px threshold would hide this
    // hint the instant that sequence starts, long before a visitor has
    // scrolled anywhere near the end of it. Where that element exists,
    // stay visible for as long as any part of it is still ahead (its
    // bottom edge hasn't yet passed the viewport top); elsewhere, fall
    // back to the original "still near the very top" threshold.
    const check = () => {
      const scrollable = document.documentElement.scrollHeight > window.innerHeight + 120;
      const chamber = document.getElementById("toc-about");
      const nearTop = chamber ? chamber.getBoundingClientRect().bottom > 0 : window.scrollY < 40;
      setVisible(scrollable && nearTop);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  return (
    <div className={styles.hint} data-visible={visible} aria-hidden="true">
      <span className={reduced ? undefined : styles.chevron}>˅</span>
      <span className={styles.label}>scroll</span>
    </div>
  );
}
