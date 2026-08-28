"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { nav, profile } from "@/lib/content";
import { BOOT_VISIBLE_MS } from "@/lib/bootTiming";
import Nav from "./Nav";
import CommandLine from "./CommandLine";
import SysHeaderBar from "./SysHeaderBar";
import styles from "./TerminalWindow.module.css";

export default function TerminalWindow({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const section = nav.find((item) => item.href === pathname);
  const title = `visitor@${profile.handle}: ~${section && section.href !== "/" ? section.href : ""}`;
  const reduced = useReducedMotion();

  // The root layout never remounts this on client-side navigation (only
  // `pathname` changes), so this initial state is set exactly once per
  // real page load — which is what we want: on the very first load the
  // boot overlay sits on top of everything, so this entrance should wait
  // until the overlay actually clears rather than finishing invisibly
  // behind it.
  const [delaySec] = useState(reduced ? 0 : BOOT_VISIBLE_MS / 1000);

  return (
    <motion.div
      className={styles.window}
      role="group"
      aria-label={title}
      initial={{ opacity: 0, y: 16, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay: delaySec, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={styles.titlebar}>
        <div className={styles.title}>{title}</div>
      </div>
      <div className={styles.body}>
        <SysHeaderBar />
        {section && (
          <p className={styles.kicker}>
            CODE: {section.code} — {section.label}
          </p>
        )}
        {children}
        <Nav />
        <CommandLine />
      </div>
    </motion.div>
  );
}
