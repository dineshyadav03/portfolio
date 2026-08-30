import { howIWork } from "@/lib/content";
import styles from "./HowIWork.module.css";

export default function HowIWork() {
  return (
    <ol className={styles.list}>
      {howIWork.map((row, i) => (
        <li className={styles.item} key={row.step}>
          <span className={styles.index}>{String(i + 1).padStart(2, "0")}</span>
          <span className={styles.step}>{row.step}</span>
          <span className={styles.detail}>{row.detail}</span>
        </li>
      ))}
    </ol>
  );
}
