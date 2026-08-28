import { sysHeader, sysHeaderRight } from "@/lib/content";
import UptimeStat from "./UptimeStat";
import styles from "./SysHeaderBar.module.css";

export default function SysHeaderBar() {
  return (
    <div className={styles.bar}>
      <div className={styles.col}>
        {sysHeader.map((row) => (
          <p className={styles.row} key={row.label}>
            <span className={styles.label}>{row.label}</span>
            <span className={styles.sep}>:</span>
            <span className={row.label === "sys.status" ? styles.online : undefined}>
              {row.value}
            </span>
          </p>
        ))}
      </div>
      <div className={`${styles.col} ${styles.right}`}>
        <p className={styles.row}>
          <span className={styles.label}>uptime</span>
          <span className={styles.sep}>:</span>
          <UptimeStat />
        </p>
        {sysHeaderRight.map((row) => (
          <p className={styles.row} key={row.label}>
            <span className={styles.label}>{row.label}</span>
            <span className={styles.sep}>:</span>
            <span className={row.accent ? styles.accent : undefined}>{row.value}</span>
          </p>
        ))}
      </div>
    </div>
  );
}
