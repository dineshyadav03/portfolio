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
    const check = () => {
      const scrollable = document.documentElement.scrollHeight > window.innerHeight + 120;
      setVisible(scrollable && window.scrollY < 40);
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
