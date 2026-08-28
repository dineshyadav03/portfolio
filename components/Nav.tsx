"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { nav } from "@/lib/content";
import styles from "./Nav.module.css";

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Section navigation">
      {nav.map((item, i) => {
        const active = pathname === item.href;
        return (
          <span key={item.href} className={styles.item}>
            <Link
              href={item.href}
              className={active ? styles.active : styles.link}
              aria-current={active ? "page" : undefined}
            >
              <span className={styles.key} aria-hidden="true">
                {i + 1}
              </span>
              {item.label}
              {active && (
                <motion.span
                  layoutId="nav-indicator"
                  className={styles.indicator}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
