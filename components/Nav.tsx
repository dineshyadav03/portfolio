"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { nav } from "@/lib/content";
import { playNavClick } from "@/lib/sound";
import styles from "./Nav.module.css";

// Always visible within this many px of the true top — raised from an
// initial 40px (which hid the nav the instant a visitor scrolled past
// the very first screenful, reported as hiding too eagerly) to roughly
// the hero's own height, so it stays put through the whole first view
// and only starts responding to scroll direction once a visitor has
// actually scrolled substantially further into the page.
const ALWAYS_SHOW_PX = 480;
// How much real scroll movement (in either direction) counts as "the
// visitor is actually scrolling that way" — filters out the ±1-2px
// jitter a trackpad/Lenis can report on an otherwise-still page, which
// would otherwise flicker the nav in and out of hiding.
const DIRECTION_DEADZONE_PX = 4;

export default function Nav() {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const [hidden, setHidden] = useState(false);
  const lastYRef = useRef(0);

  // Reduced motion: skip this entirely, same "the dynamic behavior is
  // off, not just softer" convention every other continuous effect in
  // this codebase already follows (SpatialObject's rotation, GlobeContact's
  // auto-spin, etc.) — primary navigation unpredictably appearing/
  // disappearing is exactly the kind of thing that preference exists to
  // prevent, regardless of how smoothly it's animated.
  useEffect(() => {
    if (reduced) return;
    lastYRef.current = window.scrollY;
    let raf: number | null = null;
    function update() {
      raf = null;
      const y = window.scrollY;
      const delta = y - lastYRef.current;
      if (y < ALWAYS_SHOW_PX) {
        setHidden(false);
      } else if (delta > DIRECTION_DEADZONE_PX) {
        setHidden(true);
      } else if (delta < -DIRECTION_DEADZONE_PX) {
        setHidden(false);
      }
      lastYRef.current = y;
    }
    function onScroll() {
      if (raf === null) raf = requestAnimationFrame(update);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    <nav className={styles.nav} aria-label="Section navigation" data-hidden={hidden || undefined}>
      {nav.map((item, i) => {
        // Pass 26: a project's own page (/creations/[slug]) is still
        // "work" — without this, visiting one would leave the nav with
        // nothing highlighted, which reads as lost rather than one level
        // deeper in the same section. "/" is deliberately excluded from
        // prefix matching (every path starts with "/").
        const active =
          item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <span key={item.href} className={styles.item}>
            <Link
              href={item.href}
              className={active ? styles.active : styles.link}
              aria-current={active ? "page" : undefined}
              onClick={() => playNavClick()}
            >
              {active && (
                <motion.span
                  layoutId="nav-indicator"
                  className={styles.indicator}
                  aria-hidden="true"
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
              <span className={styles.key} aria-hidden="true">
                {i + 1}
              </span>
              <span className={styles.label}>{item.label}</span>
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
