import { capabilities } from "@/lib/content";
import styles from "./Capabilities.module.css";

export default function Capabilities() {
  return (
    <dl className={styles.grid}>
      {capabilities.map((group) => (
        <div className={styles.group} key={group.category}>
          <dt className={styles.category}>{group.category}</dt>
          <dd className={styles.items}>{group.items.join(" · ")}</dd>
        </div>
      ))}
    </dl>
  );
}
