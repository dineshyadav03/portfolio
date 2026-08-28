"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import PixelSprite from "./PixelSprite";
import { mascotBitmap } from "@/lib/mascotBitmap";
import { playGreetChirp } from "@/lib/sound";
import styles from "./Mascot.module.css";

const SPRITE_OPEN = mascotBitmap(19, 18, true, false);
const SPRITE_CLOSED = mascotBitmap(19, 18, false, false);
const SPRITE_WAVE = mascotBitmap(19, 18, true, true);
const GREETINGS = ["hi, i'm nia", "poking around too?", "this site's still growing", "*waves*"];
const AMBIENT_INTERVAL_MS = 6000;
const BUBBLE_MS = 2000;

// Keeps Nia off to the right, clear of the body text she used to wander
// across. Positioned via `right`, not `left` — anchoring from the right
// edge means her own width extends *inward* from wherever she sits, so
// she can never be pushed past the edge of the viewport the way a `left`
// percentage close to 100% would (left:96% plus her own ~95px width runs
// well past the right edge on most screens). She starts pinned closest to
// the right edge of this band.
const WANDER_MIN = 4;
const WANDER_MAX = 30;

export default function Mascot() {
  const reduced = useReducedMotion();
  const [right, setRight] = useState(WANDER_MIN);
  const [facing, setFacing] = useState(1);
  const [eyesOpen, setEyesOpen] = useState(true);
  const [greeting, setGreeting] = useState<string | null>(null);
  const [waving, setWaving] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      setRight((prev) => {
        const next = Math.max(WANDER_MIN, Math.min(WANDER_MAX, prev + (Math.random() * 20 - 10)));
        // Facing follows movement direction on screen: growing `right`
        // means drifting further left, so the comparison is inverted
        // relative to the old `left`-based version.
        setFacing(next >= prev ? -1 : 1);
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

  function showBubble(withSound: boolean) {
    if (withSound) playGreetChirp();
    setGreeting(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
    setWaving(true);
    setTimeout(() => {
      setGreeting(null);
      setWaving(false);
    }, BUBBLE_MS);
  }

  // She speaks up on her own every so often, not just when clicked — a
  // sign of life rather than a one-shot easter egg.
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => showBubble(false), AMBIENT_INTERVAL_MS);
    return () => clearInterval(id);
  }, [reduced]);

  function handleActivate() {
    showBubble(true);
  }

  const sprite = waving ? SPRITE_WAVE : eyesOpen ? SPRITE_OPEN : SPRITE_CLOSED;

  return (
    <div
      className={styles.wrap}
      style={{ right: `${right}%` }}
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
          <PixelSprite bitmap={sprite} size={5} />
        </div>
      </div>
    </div>
  );
}
