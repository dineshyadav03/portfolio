import styles from "./PixelSprite.module.css";

export default function PixelSprite({
  bitmap,
  size = 4,
  label = "",
}: {
  bitmap: number[][];
  size?: number;
  label?: string;
}) {
  const cols = bitmap[0]?.length ?? 0;
  return (
    <div
      className={styles.grid}
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : "true"}
      style={{ gridTemplateColumns: `repeat(${cols}, ${size}px)` }}
    >
      {bitmap.map((row, y) =>
        row.map((cell, x) => (
          <span
            key={`${y}-${x}`}
            className={cell === 2 ? styles.eye : cell === 1 ? styles.body : styles.empty}
            style={{ width: size, height: size }}
          />
        )),
      )}
    </div>
  );
}
