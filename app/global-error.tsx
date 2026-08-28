"use client";

import { Geist_Mono } from "next/font/google";
import "./globals.css";
import ErrorScreen from "@/components/ErrorScreen";

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className={mono.variable}>
      <body>
        <ErrorScreen
          title="system fault"
          detail={error.message || "the site hit an unrecoverable error."}
          onRetry={reset}
        />
      </body>
    </html>
  );
}
