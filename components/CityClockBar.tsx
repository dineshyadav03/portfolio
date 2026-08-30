"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { clocks, profile } from "@/lib/content";
import { useBootRevealDelay } from "@/lib/bootTiming";
import styles from "./CityClockBar.module.css";

const FORMATTERS = clocks.map(
  (c) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: c.tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
);

export default function CityClockBar() {
  const [now, setNow] = useState<Date | null>(null);
  const delaySec = useBootRevealDelay();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      className={styles.bar}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delaySec, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className={styles.brand}>{profile.handle}</span>
      <div className={styles.clocks} suppressHydrationWarning>
        {clocks.map((c, i) => (
          <span key={c.label}>
            {c.label} {now ? FORMATTERS[i].format(now) : "--:--"}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
