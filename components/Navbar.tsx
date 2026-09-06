"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hexagon } from "lucide-react";
import { motion } from "framer-motion";
import { nav, profile } from "@/lib/content";
import { DURATION, EASE } from "@/lib/motion";
import styles from "./Navbar.module.css";

// Pass 37: the new identity's fixed top nav — full-width glass strip with
// a bottom border, not the previous floating pill (Nav.tsx, kept for the
// not-yet-migrated inner pages). Same active-route logic as that
// component: a project's own page (/creations/[slug]) still counts as
// "work" for the active state, and "/" is excluded from prefix matching
// since every path starts with it.
export default function Navbar() {
  const pathname = usePathname();

  return (
    <motion.nav
      className={styles.nav}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.reveal, ease: EASE }}
    >
      <Link href="/" className={styles.logo}>
        <Hexagon size={24} strokeWidth={1.5} aria-hidden="true" />
        <span>{profile.handle}</span>
      </Link>

      <div className={styles.links}>
        {nav.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} className={active ? styles.linkActive : styles.link}>
              {item.label}
            </Link>
          );
        })}
      </div>

      <a href={`mailto:${profile.email}`} className={styles.cta}>
        Get in touch
      </a>
    </motion.nav>
  );
}
