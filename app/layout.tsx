import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { MotionConfig } from "framer-motion";
import "./globals.css";
import styles from "./layout.module.css";
import { profile } from "@/lib/content";
import BackToTop from "@/components/BackToTop";
import PageTransition from "@/components/PageTransition";
import Navbar from "@/components/Navbar";
import ScrollProgress from "@/components/ScrollProgress";
import SmoothScroll from "@/components/SmoothScroll";

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const titleString = `${profile.name} — ${profile.role}`;

export const metadata: Metadata = {
  title: {
    default: titleString,
    template: `%s — ${profile.name}`,
  },
  description: profile.tagline,
  keywords: ["AI Engineer", "Forward Deployed Engineer", "AI Engineering", "RAG", profile.name],
  authors: [{ name: profile.name, url: profile.social.github }],
  robots: { index: true, follow: true },
  openGraph: {
    title: titleString,
    description: profile.tagline,
    siteName: `${profile.name} — Portfolio`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: titleString,
    description: profile.tagline,
  },
};

// Only real, defensible fields — no fabricated URL (not deployed yet, so
// no metadataBase/canonical/WebSite schema either; those need a real
// domain and should be added once this site actually has one).
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  jobTitle: profile.role,
  url: profile.social.github,
  sameAs: [profile.social.github, profile.social.linkedin, profile.social.twitter].filter(Boolean),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={sans.variable} suppressHydrationWarning>
      <body>
        {/* Server-rendered, non-executable data — a plain <script> tag here
            (this is a Server Component) is standard practice for JSON-LD. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <a href="#main" className="skipLink">
          Skip to content
        </a>
        <SmoothScroll />
        {/* Full-width fixed glass nav (Pass 37's new identity) — replaces
            the previous floating pill (Nav.tsx, kept for the not-yet-
            migrated inner pages' own reference, not mounted here anymore).
            Site-wide, not homepage-only — this is primary navigation. */}
        <Navbar />
        {/* Site-wide (every route). */}
        <ScrollProgress />
        {/* Site-wide, every viewport width — any route can get long enough
            to want a way back to the top. */}
        <BackToTop />
        <MotionConfig reducedMotion="user">
          <main id="main" className={styles.mainCol}>
            <PageTransition>{children}</PageTransition>
          </main>
        </MotionConfig>
      </body>
    </html>
  );
}
