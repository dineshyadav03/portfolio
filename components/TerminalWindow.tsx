"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { clocks, nav, profile } from "@/lib/content";
import { useBootRevealDelay } from "@/lib/bootTiming";
import Nav from "./Nav";
import CommandLine from "./CommandLine";
import SysHeaderBar from "./SysHeaderBar";
import styles from "./TerminalWindow.module.css";

const FORMATTERS = clocks.map(
  (c) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: c.tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
);

export default function TerminalWindow({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const section = nav.find((item) => item.href === pathname);
  const title = `visitor@${profile.handle}: ~${section && section.href !== "/" ? section.href : ""}`;
  const delaySec = useBootRevealDelay();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);

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
        <div className={styles.clocks} suppressHydrationWarning>
          {clocks.map((c, i) => (
            <span key={c.label}>
              {c.label} {now ? FORMATTERS[i].format(now) : "--:--"}
            </span>
          ))}
        </div>
      </div>
      <div className={styles.body}>
        <SysHeaderBar />
        <div className={styles.kickerRow}>
          {section && (
            <p className={styles.kicker}>
              CODE: {section.code} — {section.label}
            </p>
          )}
          <Nav />
        </div>
        {children}
        <CommandLine />
      </div>
    </motion.div>
  );
}
