import styles from "./PageGlitch.module.css";

export default function PageGlitch({ children }: { children: React.ReactNode }) {
  return <div className={styles.glitch}>{children}</div>;
}
