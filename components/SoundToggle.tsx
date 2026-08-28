"use client";

import { useEffect, useState } from "react";
import { isSoundEnabled, onSoundPreferenceChange, setSoundEnabled } from "@/lib/sound";
import styles from "./SoundToggle.module.css";

export default function SoundToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    // localStorage isn't available during SSR, so the real preference can
    // only be read after mount — same pattern as the clock components.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(isSoundEnabled());
    return onSoundPreferenceChange(setEnabled);
  }, []);

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={() => setSoundEnabled(!enabled)}
      aria-pressed={enabled}
      aria-label={enabled ? "Mute sound" : "Unmute sound"}
    >
      <span className={styles.dot} data-on={enabled} aria-hidden="true" />
      sound {enabled ? "on" : "off"}
    </button>
  );
}
