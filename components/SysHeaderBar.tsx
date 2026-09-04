"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { nav, sysHeader, sysHeaderRight } from "@/lib/content";
import { getSystemStatus, onSystemStatusChange, type SystemStatus } from "@/lib/systemStatus";
import UptimeStat from "./UptimeStat";
import styles from "./SysHeaderBar.module.css";

// "sys.status" was previously a hardcoded "online" string — real-looking
// chrome that never actually reflected anything. It now reads the same
// shared status signal the boot sequence, route changes, and project
// launches all publish into (lib/systemStatus.ts), on the one line of
// system chrome that's visible on every route without scrolling.
const STATUS_TEXT: Record<SystemStatus, string> = {
  boot: "initializing",
  ready: "online",
  navigating: "navigating",
  launching: "launching",
};

function statusClass(status: SystemStatus): string {
  switch (status) {
    case "navigating":
    case "launching":
      return styles.statusBusy;
    case "boot":
      return styles.statusBoot;
    default:
      return styles.online;
  }
}

export default function SysHeaderBar() {
  // Starts at the store's real current value (not a hardcoded default) so
  // a client-side route change — where this component was already mounted
  // and boot already finished — never flashes back to "initializing".
  const [status, setStatus] = useState<SystemStatus>(getSystemStatus);
  const pathname = usePathname();
  // Pass 33: previously TerminalWindow's own separate "CODE: 0.01 — ABOUT"
  // kicker row, with its own margin/border — a third full line of chrome
  // (after the titlebar and this line) sitting between BootIntro clearing
  // and the hero's own reveal, undercutting it on first load. Folded into
  // this line instead — same info, same active-section lookup TerminalWindow
  // used to do — so the whole status block is one line, not three.
  const section = nav.find((item) =>
    item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  useEffect(() => onSystemStatusChange(setStatus), []);

  return (
    <div className={styles.bar}>
      <p className={styles.row}>
        {sysHeader.map((row, i) => (
          <span key={row.label}>
            {i > 0 && <span className={styles.sep}>·</span>}
            <span className={row.label === "sys.status" ? statusClass(status) : undefined}>
              {row.label === "sys.status" ? STATUS_TEXT[status] : row.value}
            </span>
          </span>
        ))}
        {section && (
          <span>
            <span className={styles.sep}>·</span>
            {section.code} — {section.label}
          </span>
        )}
      </p>
      <p className={styles.row}>
        <span className={styles.label}>uptime</span> <UptimeStat />
        {sysHeaderRight.map((row) => (
          <span key={row.label}>
            <span className={styles.sep}>·</span>
            <span className={row.accent ? styles.accent : undefined}>{row.value}</span>
          </span>
        ))}
      </p>
    </div>
  );
}
