"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { nav } from "@/lib/content";
import { playNavClick } from "@/lib/sound";
import styles from "./Nav.module.css";

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Section navigation">
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
