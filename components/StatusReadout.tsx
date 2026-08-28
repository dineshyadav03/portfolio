import { status } from "@/lib/content";
import styles from "./StatusReadout.module.css";

export default function StatusReadout() {
  return (
    <dl className={styles.readout}>
      {status.map((row) => (
        <div className={styles.row} key={row.label}>
          <dt>{row.label}</dt>
          <span className={styles.leader} aria-hidden="true" />
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
