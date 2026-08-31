"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import PixelSprite from "./PixelSprite";
import { mascotBitmap } from "@/lib/mascotBitmap";
import { useBootRevealDelay } from "@/lib/bootTiming";
import { playGreetChirp } from "@/lib/sound";
import { onNiaReaction, type NiaReactionState } from "@/lib/niaReaction";
import NiaAssistant from "./NiaAssistant";
import styles from "./Mascot.module.css";

const SPRITE_OPEN = mascotBitmap(19, 18, true, false);
const SPRITE_CLOSED = mascotBitmap(19, 18, false, false);
const SPRITE_WAVE = mascotBitmap(19, 18, true, true);
const GREETINGS = ["hi, i'm nia", "poking around too?", "this site's still growing", "*waves*"];
const AMBIENT_INTERVAL_MS = 6000;
const BUBBLE_MS = 2000;

// Each transient reaction clears itself after this many ms — a newer
// reaction replaces whatever's still playing rather than queuing behind it.
const REACTION_MS: Record<NiaReactionState, number> = {
  success: 350,
  error: 280,
  project: 320,
  processing: 700,
};

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
  const bootDelaySec = useBootRevealDelay();
  const [ready, setReady] = useState(false);
  const [right, setRight] = useState(WANDER_MIN);
  const [facing, setFacing] = useState(1);
  const [eyesOpen, setEyesOpen] = useState(true);
  const [greeting, setGreeting] = useState<string | null>(null);
  const [waving, setWaving] = useState(false);
  const [reaction, setReaction] = useState<{ state: NiaReactionState; id: number } | null>(null);
  const reactionIdRef = useRef(0);
  const reactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  // She's mounted (and behind the boot overlay) for the whole boot sequence,
  // but her wander/blink/ambient-greet timers shouldn't start counting down
  // until the overlay actually clears — otherwise her first ambient greeting
  // can land within milliseconds of the reveal-sweep, competing with it for
  // attention right when the visitor should be looking at the page itself.
  useEffect(() => {
    if (reduced) return;
    const id = setTimeout(() => setReady(true), bootDelaySec * 1000);
    return () => clearTimeout(id);
  }, [reduced, bootDelaySec]);

  useEffect(() => {
    // Paused while the assistant is open — a chat panel next to a mascot
    // that keeps drifting away from it reads as broken, not alive, and the
    // panel is deliberately anchored to her resting position rather than
    // tracking her live wander offset.
    if (reduced || !ready || assistantOpen) return;
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
  }, [reduced, ready, assistantOpen]);

  useEffect(() => {
    if (reduced || !ready) return;
    const id = setInterval(() => {
      setEyesOpen(false);
      const wake = setTimeout(() => setEyesOpen(true), 140);
      return () => clearTimeout(wake);
    }, 3600);
    return () => clearInterval(id);
  }, [reduced, ready]);

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
  // sign of life rather than a one-shot easter egg. Paused while the
  // assistant is open so an unrelated ambient bubble doesn't pop up over
  // an in-progress conversation.
  useEffect(() => {
    if (reduced || !ready || assistantOpen) return;
    const id = setInterval(() => showBubble(false), AMBIENT_INTERVAL_MS);
    return () => clearInterval(id);
  }, [reduced, ready, assistantOpen]);

  function handleActivate() {
    showBubble(true);
    setAssistantOpen(true);
  }

  // A brief, self-clearing acknowledgement of something happening elsewhere
  // on the page (a command outcome, a project opening, the pipeline's
  // discrete processing pulse) — entirely visual, bypassed under reduced
  // motion, and never wired to sound (lib/sound.ts is untouched by this).
  // Skipping the subscription outright under reduced motion, rather than
  // subscribing and no-op'ing per event, mirrors TerminalWindow's own
  // onGlitchTrigger handling.
  useEffect(() => {
    if (reduced) return;
    return onNiaReaction((state) => {
      if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);
      reactionIdRef.current += 1;
      setReaction({ state, id: reactionIdRef.current });
      reactionTimeoutRef.current = setTimeout(() => setReaction(null), REACTION_MS[state]);
    });
  }, [reduced]);

  useEffect(() => {
    return () => {
      if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);
    };
  }, []);

  const sprite = waving ? SPRITE_WAVE : eyesOpen ? SPRITE_OPEN : SPRITE_CLOSED;

  return (
    <>
      <div
        ref={triggerRef}
        className={styles.wrap}
        style={{ right: `${right}%` }}
        data-still={reduced ? "true" : undefined}
        onClick={handleActivate}
        role="button"
        tabIndex={0}
        aria-label="Nia — click to say hi and ask about Dinesh"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleActivate();
          }
        }}
      >
        <span className={styles.ring} data-active={waving} aria-hidden="true" />
        {greeting && <div className={styles.bubble}>{greeting}</div>}
        <div className={styles.sprite} style={{ transform: `scaleX(${facing})` }}>
          <div
            key={reaction ? `${reaction.state}-${reaction.id}` : "idle"}
            className={styles.reaction}
            data-reaction={reaction?.state}
          >
            <div className={styles.wiggle}>
              <PixelSprite bitmap={sprite} size={5} />
            </div>
          </div>
        </div>
      </div>
      <NiaAssistant
        open={assistantOpen}
        onClose={() => {
          setAssistantOpen(false);
          triggerRef.current?.focus();
        }}
      />
    </>
  );
}
