"use client";

import { useEffect, useState } from "react";
import { clocks, profile } from "@/lib/content";
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={styles.bar}>
      <span className={styles.brand}>{profile.handle}</span>
      <div className={styles.clocks} suppressHydrationWarning>
        {clocks.map((c, i) => (
          <span key={c.label}>
            {c.label} {now ? FORMATTERS[i].format(now) : "--:--"}
          </span>
        ))}
      </div>
    </div>
  );
}
