import { announcement } from "@/lib/content";
import styles from "./AnnouncementBanner.module.css";

export default function AnnouncementBanner() {
  if (!announcement.live) return null;

  return (
    <div className={styles.banner}>
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.text}>{announcement.text}</span>
    </div>
  );
}
