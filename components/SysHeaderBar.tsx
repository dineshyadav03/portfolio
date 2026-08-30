import { sysHeader, sysHeaderRight } from "@/lib/content";
import UptimeStat from "./UptimeStat";
import styles from "./SysHeaderBar.module.css";

export default function SysHeaderBar() {
  return (
    <div className={styles.bar}>
      <p className={styles.row}>
        {sysHeader.map((row, i) => (
          <span key={row.label}>
            {i > 0 && <span className={styles.sep}>·</span>}
            <span className={row.label === "sys.status" ? styles.online : undefined}>
              {row.value}
            </span>
          </span>
        ))}
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
