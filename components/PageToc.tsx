"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./PageToc.module.css";

// A real jump-to-section navigator for the homepage — the one page with
// enough distinct sections (six) that scrolling between them by hand is a
// real cost. Every label here is the exact same one each section's own
// SectionDivider already displays (app/page.tsx) — nothing invented.
// Lives in the real negative space beside the 1080px terminal window on
// wide screens; hidden below that.
//
// Pass 28: redesigned from a permanently-visible code+label list (~143px
// wide) to dots-only at rest, labels revealed on hover/focus. The
// original version's min-width gate (1400px) meant it essentially never
// appeared for real visitors, but the actual fix wasn't just lowering
// that number — the underlying geometry (a 1080px content column, split
// margins) means a ~143px-wide permanent panel genuinely can't fit
// without overlapping content below ~1400-1450px, confirmed by both hand
// math and a live bounding-rect overlap check against a lower section's
// real content column at 1200px. Shrinking the resting footprint to a
// handful of small dots (~14px total) is what actually makes a lower,
// still-safe breakpoint possible — the label only needs room during a
// brief, user-initiated hover, not for the entire time a visitor is
// scrolling and reading.
const SECTIONS = [
  { id: "toc-about", label: "about" },
  { id: "toc-capabilities", label: "capabilities" },
  { id: "toc-how-i-work", label: "how i work" },
  { id: "toc-system-pattern", label: "system pattern" },
  { id: "toc-status", label: "status" },
  { id: "toc-build", label: "build" },
];

export default function PageToc() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);

  useEffect(() => {
    // Mounted once in the root layout (see app/layout.tsx) so it survives
    // client-side navigation instead of remounting per route — the same
    // reason `position: fixed` even works correctly here at all (nested
    // inside PageTransition's own animated wrapper, it wouldn't).
    if (!isHome) return;

    // A direct scroll-position computation, not IntersectionObserver — an
    // earlier version used IntersectionObserver and worked correctly on a
    // true first page load, but reproducibly stopped firing after a
    // client-side navigation onto "/" (confirmed live: the observer fired
    // its initial batch, then never fired again despite real, confirmed
    // scroll position changes afterward — a real, if narrow, timing
    // interaction with this route's remount cycle, not a hypothesis).
    // This is simpler and has no async observer-callback timing to get
    // wrong: "the current section" is just whichever divider is the last
    // one whose top has crossed the trigger line, recomputed directly on
    // every scroll frame.
    let raf: number | null = null;
    function computeActive() {
      raf = null;
      const threshold = window.innerHeight * 0.2;
      let current: string | null = null;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= threshold) current = s.id;
      }
      // The last section's own divider can never reach the trigger line
      // above if there's no more page left below it to scroll into place
      // — confirmed live at the true scroll bottom. Wins outright there,
      // regardless of what the normal per-section check above found.
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll - window.scrollY < 4) current = SECTIONS[SECTIONS.length - 1].id;
      if (current) setActiveId((prev) => (prev === current ? prev : current));
    }
    function onScroll() {
      if (raf === null) raf = requestAnimationFrame(computeActive);
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    // An initial sync, retried briefly — the target elements may not
    // exist yet the instant this effect runs, on a client-side navigation
    // where PageTransition's own exit-then-enter sequencing hasn't
    // finished mounting the new page's content. A real scroll will always
    // correct this via the listener above regardless; this just avoids a
    // visibly wrong initial highlight for a visitor who lands on "/"
    // already scrolled (e.g. via a mid-page anchor link) and never
    // scrolls again.
    computeActive();
    const retry = setTimeout(computeActive, 400);

    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(retry);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [isHome]);

  if (!isHome) return null;

  return (
    <nav className={styles.toc} aria-label="Jump to section">
      {SECTIONS.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={s.id === activeId ? styles.linkActive : styles.link}
          aria-current={s.id === activeId ? "true" : undefined}
          aria-label={s.label}
        >
          <span className={styles.dot} aria-hidden="true" />
          {/* Visually hover/focus-revealed only (see CSS) — the link's
              own aria-label above carries the accessible name
              unconditionally, so this being visually hidden at rest
              never removes it for assistive tech. */}
          <span className={styles.label} aria-hidden="true">
            {s.label}
          </span>
        </a>
      ))}
    </nav>
  );
}
