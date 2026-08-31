import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import Script from "next/script";
import { MotionConfig } from "framer-motion";
import "./globals.css";
import styles from "./layout.module.css";
import { profile } from "@/lib/content";
import StatusBar from "@/components/StatusBar";
import KeyboardNav from "@/components/KeyboardNav";
import TerminalWindow from "@/components/TerminalWindow";
import PageTransition from "@/components/PageTransition";
import BootIntro from "@/components/BootIntro";
import Mascot from "@/components/Mascot";
import ScrollHint from "@/components/ScrollHint";
import SmoothScroll from "@/components/SmoothScroll";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
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
    <html lang="en" className={mono.variable} suppressHydrationWarning>
      <body>
        {/* Sets data-theme before first paint so the page never flashes the
            wrong theme while React hydrates. */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        {/* Server-rendered, non-executable data — a plain <script> tag here
            (this is a Server Component) is standard practice for JSON-LD. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <a href="#main" className="skipLink">
          Skip to content
        </a>
        <div className="grain" aria-hidden="true" />
        <KeyboardNav />
        <SmoothScroll />
        <MotionConfig reducedMotion="user">
          <BootIntro />
          <Mascot />
          <ScrollHint />
          <div className={styles.stage}>
            <main id="main" className={styles.mainCol}>
              <TerminalWindow>
                <PageTransition>{children}</PageTransition>
              </TerminalWindow>
            </main>
            <StatusBar />
          </div>
        </MotionConfig>
      </body>
    </html>
  );
}
