"use client";

import { useEffect } from "react";
import Link from "next/link";
import DotIcon from "./DotIcon";
import DottedFrame from "./DottedFrame";
import { sadFaceBitmap } from "@/lib/dotIcons";
import { playErrorTone } from "@/lib/sound";
import styles from "./ErrorScreen.module.css";

const FACE = sadFaceBitmap(20);

export default function ErrorScreen({
  title = "connection lost",
  detail,
  onRetry,
  retryLabel = "reconnect",
}: {
  title?: string;
  detail?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  useEffect(() => {
    playErrorTone();
  }, []);

  return (
    <div className={styles.overlay}>
      <div className={styles.frameWrap}>
        <DottedFrame>
          <div className={styles.titlebar}>
            <span className={styles.titleText}>system fault</span>
            <span className={styles.blinkDot} aria-hidden="true" />
          </div>
          <div className={styles.scene}>
            <DotIcon bitmap={FACE} label="An error occurred" dot={5} gap={1.5} />
            <p className={styles.heading}>{title}</p>
            {detail && <p className={styles.detail}>{detail}</p>}
            <div className={styles.actions}>
              {onRetry && (
                <button type="button" className={styles.action} onClick={onRetry}>
                  {retryLabel}
                </button>
              )}
              <Link href="/" className={styles.action}>
                back to safety
              </Link>
            </div>
          </div>
        </DottedFrame>
      </div>
    </div>
  );
}
