"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { nav } from "@/lib/content";
import { playNavClick } from "@/lib/sound";

/**
 * Lets visitors jump between sections with 1-4, or step through them with
 * ↑/↓ (ignored while typing in a field).
 */
export default function KeyboardNav() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const current = nav.findIndex((item) => item.href === pathname);
        const base = current === -1 ? 0 : current;
        const step = e.key === "ArrowDown" ? 1 : -1;
        const next = (base + step + nav.length) % nav.length;
        playNavClick();
        router.push(nav[next].href);
        return;
      }

      // A common convention (Slack, GitHub, countless command palettes) —
      // jump straight to the terminal input without scrolling to find it.
      // The command line already lives at the bottom of every page.
      if (e.key === "/") {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>('input[aria-label="Terminal command input"]');
        input?.focus();
        return;
      }

      const index = Number(e.key) - 1;
      const item = nav[index];
      if (item) {
        playNavClick();
        router.push(item.href);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, pathname]);

  return null;
}
