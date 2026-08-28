import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { MotionConfig } from "framer-motion";
import "./globals.css";
import styles from "./layout.module.css";
import { profile } from "@/lib/content";
import StatusBar from "@/components/StatusBar";
import KeyboardNav from "@/components/KeyboardNav";
import TerminalWindow from "@/components/TerminalWindow";
import PageTransition from "@/components/PageTransition";
import BootIntro from "@/components/BootIntro";
import CityClockBar from "@/components/CityClockBar";
import Mascot from "@/components/Mascot";

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${profile.name} — ${profile.role}`,
  description: profile.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={mono.variable}>
      <body>
        <a href="#main" className="skipLink">
          Skip to content
        </a>
        <div className="grain" aria-hidden="true" />
        <KeyboardNav />
        <MotionConfig reducedMotion="user">
          <BootIntro />
          <Mascot />
          <div className={styles.stage}>
            <main id="main" className={styles.mainCol}>
              <CityClockBar />
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
