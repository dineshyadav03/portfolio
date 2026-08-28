import styles from "./DottedFrame.module.css";

export default function DottedFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.frame}>
      <svg className={styles.border} preserveAspectRatio="none" aria-hidden="true">
        <rect
          x="2"
          y="2"
          width="99%"
          height="99%"
          rx="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="0.1 10"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
