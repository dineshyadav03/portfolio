import { asciiPortrait } from "@/lib/asciiPortrait";
import styles from "./AsciiPortrait.module.css";

export default function AsciiPortrait() {
  return (
    <div className={styles.wrap} aria-hidden="true">
      <pre className={styles.art}>{asciiPortrait}</pre>
      <pre className={`${styles.art} ${styles.layerRed}`}>{asciiPortrait}</pre>
      <pre className={`${styles.art} ${styles.layerCyan}`}>{asciiPortrait}</pre>
    </div>
  );
}
