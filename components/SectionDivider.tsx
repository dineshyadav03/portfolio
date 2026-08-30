import styles from "./SectionDivider.module.css";

// A small labeled rule marking the start of a new section within a page —
// same dotted-line/uppercase-label language as TerminalWindow's own
// "CODE: x.xx" kicker, just used mid-page instead of at the top.
export default function SectionDivider({ label }: { label: string }) {
  return (
    <div className={styles.divider} role="separator" aria-label={label}>
      <span className={styles.label}>{label}</span>
      <span className={styles.rule} aria-hidden="true" />
    </div>
  );
}
