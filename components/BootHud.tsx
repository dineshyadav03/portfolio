import { capabilities, projects } from "@/lib/content";
import styles from "./BootHud.module.css";

const BARS = [40, 85, 60, 95, 50, 75, 35];
// Real counts from the site's own data, not flavor text — the boot
// sequence's "systems coming online" payoff should report on the actual
// systems this site has, not a generic sci-fi dashboard.
const READOUTS = [
  { label: "projects", value: `${projects.length} loaded` },
  { label: "capabilities", value: `${capabilities.length} indexed` },
  { label: "nia", value: "online" },
  { label: "core", value: "ready" },
];

// A short, dense sci-fi dashboard scene shown for a few seconds right after
// "ACCESS GRANTED" — a small "systems coming online" payoff before the
// overlay clears. Everything here is CSS-driven (no canvas/JS animation
// loop), same procedural-only approach as the rest of the boot sequence.
export default function BootHud() {
  return (
    <div className={styles.grid} aria-hidden="true">
      <div className={styles.panel}>
        <p className={styles.panelLabel}>radar</p>
        <div className={styles.radar}>
          <div className={styles.radarRing} />
          <div className={styles.radarRing} data-ring="2" />
          <div className={styles.radarSweep} />
          <span className={styles.blip} style={{ top: "30%", left: "62%" }} />
          <span className={styles.blip} style={{ top: "68%", left: "38%", animationDelay: "0.6s" }} />
        </div>
      </div>

      <div className={styles.panel}>
        <p className={styles.panelLabel}>signal</p>
        <div className={styles.bars}>
          {BARS.map((h, i) => (
            <span
              key={i}
              className={styles.bar}
              style={{ animationDelay: `${i * 90}ms`, "--peak": `${h}%` } as React.CSSProperties}
            />
          ))}
        </div>
      </div>

      <div className={styles.panel}>
        <p className={styles.panelLabel}>sys.check</p>
        <div className={styles.readouts}>
          {READOUTS.map((r, i) => (
            <p key={r.label} className={styles.readoutRow} style={{ animationDelay: `${i * 140}ms` }}>
              <span>{r.label}</span>
              <span className={styles.readoutValue}>{r.value}</span>
            </p>
          ))}
        </div>
      </div>

      <div className={styles.panel}>
        <p className={styles.panelLabel}>trajectory</p>
        <svg className={styles.plot} viewBox="0 0 100 50" preserveAspectRatio="none">
          <polyline
            className={styles.plotLine}
            points="2,44 18,38 30,40 42,24 55,28 68,12 82,16 98,4"
            fill="none"
          />
          {[2, 18, 30, 42, 55, 68, 82, 98].map((x, i) => (
            <circle key={x} className={styles.plotDot} cx={x} cy={[44, 38, 40, 24, 28, 12, 16, 4][i]} r="1.6" />
          ))}
        </svg>
      </div>
    </div>
  );
}
