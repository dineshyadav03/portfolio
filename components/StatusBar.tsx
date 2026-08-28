"use client";

import { useEffect, useState } from "react";
import SoundToggle from "./SoundToggle";
import styles from "./StatusBar.module.css";

const IST_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const UTC_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export default function StatusBar() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Clock must render null on the server and pick up the real time only
    // after mount, otherwise server and client render different timestamps.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={styles.bar}>
      <div className={styles.hints}>
        <span>
          <kbd>1</kbd>-<kbd>4</kbd> or <kbd>↑</kbd>
          <kbd>↓</kbd> to navigate
        </span>
        <span className={styles.sep} aria-hidden="true">
          ·
        </span>
        <SoundToggle />
      </div>
      <div className={styles.clocks} suppressHydrationWarning>
        {now ? (
          <>
            <span>IST {IST_FORMATTER.format(now)}</span>
            <span className={styles.sep} aria-hidden="true">
              ·
            </span>
            <span>UTC {UTC_FORMATTER.format(now)}</span>
          </>
        ) : (
          <span>&nbsp;</span>
        )}
      </div>
    </div>
  );
}
