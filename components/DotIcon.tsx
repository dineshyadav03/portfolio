import type { CSSProperties } from "react";
import styles from "./DotIcon.module.css";

export default function DotIcon({
  bitmap,
  label,
  dot = 4,
  gap = 2,
  flicker = false,
}: {
  bitmap: boolean[][];
  label: string;
  dot?: number;
  gap?: number;
  /** Opt-in only (default false) — this component is shared with BootIntro
   *  and ErrorScreen, where an idle flicker would read as "something's
   *  wrong" rather than "this is a live system." Scoped to the hero
   *  wordmark, the one usage that sits on screen indefinitely after its
   *  own entrance settles rather than during a boot/error moment. */
  flicker?: boolean;
}) {
  const cols = bitmap[0]?.length ?? 0;
  // Counts only "on" dots (not grid cells generally) — CSS :nth-child
  // can't target "every Nth lit dot" on its own, since it counts every
  // cell including the off ones interleaved between them. Roughly 1 in
  // 15 lit dots gets the flicker, each with its own JS-computed
  // delay/duration so they read as scattered rather than synchronized.
  let onIndex = -1;
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
        row.map((on, x) => {
          if (on) onIndex++;
          // 17 is coprime to the 5 and 7 moduli the duration/delay below
          // use — picking a multiple of either would make every selected
          // dot land on the same remainder and share one duration or
          // delay instead of actually varying (caught live: 15, a
          // multiple of 5, gave all nine flicker dots the identical
          // duration).
          const shouldFlicker = flicker && on && onIndex % 17 === 6;
          return (
            <span
              key={`${y}-${x}`}
              className={
                on ? `${styles.dotOn} ${shouldFlicker ? styles.dotFlicker : ""}` : styles.dotOff
              }
              style={
                shouldFlicker
                  ? ({
                      width: dot,
                      height: dot,
                      "--flicker-duration": `${6 + (onIndex % 5)}s`,
                      "--flicker-delay": `${(onIndex * 0.9) % 7}s`,
                    } as CSSProperties)
                  : { width: dot, height: dot }
              }
            />
          );
        }),
      )}
    </div>
  );
}
