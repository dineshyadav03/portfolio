"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { profile } from "@/lib/content";
import { playKeyClick } from "@/lib/sound";
import styles from "./Prompt.module.css";

const TYPE_MS_MIN = 18; // per-character delay range — randomized within it below
const TYPE_MS_MAX = 42; // real typing isn't a metronome; a fixed interval read as noticeably mechanical

export default function Prompt({ command }: { command: string }) {
  const reduced = useReducedMotion();
  const [typed, setTyped] = useState("");
  const [cursorGone, setCursorGone] = useState(false);

  useEffect(() => {
    // Under reduced motion, the command is present immediately — never
    // animated in. This was a real, previously-unaddressed gap: every
    // <Prompt> on the site (used on nearly every page) ignored the
    // preference entirely, unlike every other typing/reveal effect built
    // since. Checked inside the effect (not frozen into useState's initial
    // value) so it stays correct even if `useReducedMotion()` resolves
    // from null to true only after the first render, a real possibility
    // pre-hydration.
    if (reduced) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTyped(command);
      return;
    }
    let i = 0;
    let id: ReturnType<typeof setTimeout>;
    function step() {
      i += 1;
      setTyped(command.slice(0, i));
      playKeyClick();
      if (i < command.length) {
        // A fixed interval reads as a metronome, not a person — a small
        // randomized jitter per character is the one real, useful idea
        // this pass borrows from the reference typing-effect component
        // (see PASS report), reimplemented natively rather than importing
        // it (it depends on Framer's own addPropertyControls/ControlType,
        // not portable outside Framer's editor).
        const delay = TYPE_MS_MIN + Math.random() * (TYPE_MS_MAX - TYPE_MS_MIN);
        id = setTimeout(step, delay);
      }
    }
    id = setTimeout(step, TYPE_MS_MIN + Math.random() * (TYPE_MS_MAX - TYPE_MS_MIN));
    return () => clearTimeout(id);
  }, [command, reduced]);

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
