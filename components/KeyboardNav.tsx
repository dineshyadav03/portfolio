"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { nav } from "@/lib/content";

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
        router.push(nav[next].href);
        return;
      }

      const index = Number(e.key) - 1;
      const item = nav[index];
      if (item) router.push(item.href);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, pathname]);

  return null;
}
