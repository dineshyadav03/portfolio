"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import PixelSprite from "./PixelSprite";
import { mascotBitmap } from "@/lib/mascotBitmap";
import { playGreetChirp } from "@/lib/sound";
import styles from "./Mascot.module.css";

const SPRITE_OPEN = mascotBitmap(17, 18, true);
const SPRITE_CLOSED = mascotBitmap(17, 18, false);
const GREETINGS = ["hi, i'm nia", "poking around too?", "this site's still growing", "*waves*"];

export default function Mascot() {
  const reduced = useReducedMotion();
  const [left, setLeft] = useState(50);
  const [facing, setFacing] = useState(1);
  const [eyesOpen, setEyesOpen] = useState(true);
  const [greeting, setGreeting] = useState<string | null>(null);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      setLeft((prev) => {
        const next = Math.max(4, Math.min(92, prev + (Math.random() * 46 - 23)));
        setFacing(next >= prev ? 1 : -1);
        return next;
      });
    }, 4500);
    return () => clearInterval(id);
  }, [reduced]);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      setEyesOpen(false);
      const wake = setTimeout(() => setEyesOpen(true), 140);
      return () => clearTimeout(wake);
    }, 3600);
    return () => clearInterval(id);
  }, [reduced]);

  function handleActivate() {
    playGreetChirp();
    setGreeting(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
    setTimeout(() => setGreeting(null), 2000);
  }

  return (
    <div
      className={styles.wrap}
      style={{ left: `${left}%` }}
      data-still={reduced ? "true" : undefined}
      onClick={handleActivate}
      role="button"
      tabIndex={0}
      aria-label="Nia — click to say hi"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleActivate();
        }
      }}
    >
      {greeting && <div className={styles.bubble}>{greeting}</div>}
      <div className={styles.sprite} style={{ transform: `scaleX(${facing})` }}>
        <div className={styles.wiggle}>
          <PixelSprite bitmap={eyesOpen ? SPRITE_OPEN : SPRITE_CLOSED} size={5} />
        </div>
      </div>
    </div>
  );
}
