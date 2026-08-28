"use client";

import { useEffect, useState } from "react";
import { getTheme, onThemeChange, setTheme, type Theme } from "@/lib/theme";
import styles from "./SoundToggle.module.css";

export default function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(getTheme());
    return onThemeChange(setThemeState);
  }, []);

  const isLight = theme === "light";

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={() => setTheme(isLight ? "dark" : "light")}
      aria-pressed={isLight}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
    >
      <span className={styles.dot} data-on={isLight} aria-hidden="true" />
      {isLight ? "light" : "dark"} mode
    </button>
  );
}
