"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { nav, profile } from "@/lib/content";
import { useBootRevealDelay } from "@/lib/bootTiming";
import Nav from "./Nav";
import CommandLine from "./CommandLine";
import SysHeaderBar from "./SysHeaderBar";
import styles from "./TerminalWindow.module.css";

export default function TerminalWindow({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const section = nav.find((item) => item.href === pathname);
  const title = `visitor@${profile.handle}: ~${section && section.href !== "/" ? section.href : ""}`;
  const delaySec = useBootRevealDelay();

  return (
    <motion.div
      className={styles.window}
      role="group"
      aria-label={title}
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: delaySec, ease: [0.16, 1, 0.3, 1] }}
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
        <Nav />
        {children}
        <CommandLine />
      </div>
    </motion.div>
  );
}
