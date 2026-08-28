"use client";

import { useEffect, useState } from "react";
import { profile } from "@/lib/content";
import { playKeyClick } from "@/lib/sound";
import styles from "./Prompt.module.css";

export default function Prompt({ command }: { command: string }) {
  const [typed, setTyped] = useState("");
  const [cursorGone, setCursorGone] = useState(false);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(command.slice(0, i));
      playKeyClick();
      if (i >= command.length) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, [command]);

  const done = typed.length === command.length;

  useEffect(() => {
    // A finished command line doesn't need a live cursor — only the real
    // input at the bottom of the page does. Let it linger briefly, then
    // fade out, rather than blinking forever alongside every other prompt
    // on the page.
    if (!done) return;
    const id = setTimeout(() => setCursorGone(true), 900);
    return () => clearTimeout(id);
  }, [done]);

  return (
    <p className={styles.prompt}>
      <span className={styles.user}>visitor</span>
      <span className={styles.dim}>@</span>
      <span className={styles.host}>{profile.handle}</span>
      <span className={styles.dim}> ~ $ </span>
      <span className={styles.command}>{typed}</span>
      <span
        className={done ? styles.cursorIdle : styles.cursor}
        data-gone={cursorGone}
        aria-hidden="true"
      />
    </p>
  );
}
