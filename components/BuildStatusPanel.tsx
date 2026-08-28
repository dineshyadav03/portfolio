import { buildStatus, profile } from "@/lib/content";
import styles from "./BuildStatusPanel.module.css";

const ACTIONS = [
  { label: "source", href: profile.social.github },
  { label: "resume", href: profile.social.resume },
  { label: "contact", href: `mailto:${profile.email}` },
];

export default function BuildStatusPanel() {
  return (
    <div className={styles.panel}>
      <div className={styles.col}>
        <p className={styles.heading}>status</p>
        <svg className={styles.spinner} viewBox="0 0 40 40" aria-hidden="true">
          <circle
            className={styles.spinnerTrack}
            cx="20"
            cy="20"
            r="16"
            fill="none"
            strokeWidth="2"
          />
          <circle
            className={styles.spinnerArc}
            cx="20"
            cy="20"
            r="16"
            fill="none"
            strokeWidth="2"
            strokeDasharray="28 100"
            strokeLinecap="round"
          />
        </svg>
        <p className={styles.spinnerLabel}>in progress</p>
      </div>

      <div className={styles.col}>
        <p className={styles.heading}>content</p>
        <div className={styles.bar}>
          <div className={styles.barFill} style={{ width: `${buildStatus.percent}%` }} />
        </div>
        <p className={styles.barLabel}>{buildStatus.percent}% complete</p>
        <p className={styles.detail}>{buildStatus.detail}</p>
      </div>

      <div className={styles.col}>
        <p className={styles.heading}>actions</p>
        <div className={styles.actions}>
          {ACTIONS.map((action) =>
            action.href ? (
              <a key={action.label} href={action.href} className={styles.action}>
                {action.label}
              </a>
            ) : (
              <span key={action.label} className={styles.actionDisabled}>
                {action.label}
              </span>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
