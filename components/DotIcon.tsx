import styles from "./DotIcon.module.css";

export default function DotIcon({
  bitmap,
  label,
  dot = 4,
  gap = 2,
}: {
  bitmap: boolean[][];
  label: string;
  dot?: number;
  gap?: number;
}) {
  const cols = bitmap[0]?.length ?? 0;
  return (
    <div
      className={styles.grid}
      role="img"
      aria-label={label}
      style={{
        gridTemplateColumns: `repeat(${cols}, ${dot}px)`,
        gap: `${gap}px`,
      }}
    >
      {bitmap.map((row, y) =>
        row.map((on, x) => (
          <span
            key={`${y}-${x}`}
            className={on ? styles.dotOn : styles.dotOff}
            style={{ width: dot, height: dot }}
          />
        )),
      )}
    </div>
  );
}
