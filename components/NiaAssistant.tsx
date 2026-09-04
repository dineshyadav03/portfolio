"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { answerQuestion, niaFaq } from "@/lib/niaFaq";
import { EMPTY_CONTEXT, isContentIntent, type NiaConversationContext } from "@/lib/niaIntent";
import { notifyNia } from "@/lib/niaReaction";
import { playCommandBlip, playErrorTone, playGlitch } from "@/lib/sound";
import { triggerGlitch } from "@/lib/eventGlitch";
import { runTerminalCommand, TERMINAL_VERBS } from "@/lib/terminalCommands";
import styles from "./NiaAssistant.module.css";

// A handful of high-value starting points, pulled by id from niaFaq.ts
// itself (not re-typed here) so a suggested chip can never drift out of
// sync with — or ask something outside — what the knowledge layer can
// actually answer.
const SUGGESTED_IDS = ["who-is-dinesh", "projects", "interests", "contact"];

const MAX_HISTORY = 10;

type Exchange = { question: string; answer: string; matched: boolean };

// The presentation/interaction layer only — all of the actual "does Nia
// know this" logic lives in lib/niaFaq.ts's answerQuestion(), and all of
// the underlying facts live in lib/niaProfile.ts. This component never
// matches a question against knowledge itself; it just renders whatever
// answerQuestion() returns. That separation is what lets a future
// retrieval/LLM layer replace answerQuestion() without this file changing.
export default function NiaAssistant({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<Exchange[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Which topic the conversation is currently "on" — read and written
  // only inside ask() below, never rendered, so a plain ref (not state)
  // avoids an extra re-render per submission. Deliberately persists across
  // close/reopen, same as `history` below (Mascot always renders this
  // component; `open` only toggles what it returns) — the visible
  // transcript survives closing the panel, so the conversational subject
  // should too, rather than a follow-up silently stopping working the
  // moment the visitor reopens Nia.
  const contextRef = useRef<NiaConversationContext>(EMPTY_CONTEXT);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [history]);

  // The one place text actually reaches either the real command shell or
  // the knowledge layer — used by both the input form and the suggested-
  // question chips, so neither path can diverge from the other. Real
  // commands (see lib/terminalCommands.ts) are checked first, by exact
  // whole-word match on the first token — never a substring/fuzzy match,
  // so "help me with projects" is still an ordinary question, not a
  // command. Everything else falls through to the fuzzy intent/FAQ layer.
  function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed) return;

    // Pass 29: the real terminal shell (ls/cd/cat/skills/search/status/
    // open/theme/contact/whoami/sudo/matrix — see lib/terminalCommands.ts)
    // used to live in its own standalone CommandLine row on every page;
    // removed on request, folded in here instead, so Nia is the one place
    // both real commands and ordinary questions work. Checked by whole-
    // word match on the first token, before anything else — a command
    // verb always wins outright, the same "exact match, never fuzzy"
    // guarantee resolveCommand() below already holds for "help"/"clear",
    // just extended to the full verb set instead of just those two.
    const firstWord = trimmed.split(/\s+/)[0]?.toLowerCase();
    if (firstWord && TERMINAL_VERBS.has(firstWord)) {
      const result = runTerminalCommand(trimmed, router);
      if (result.cleared) {
        setHistory([]);
        contextRef.current = EMPTY_CONTEXT;
        playCommandBlip();
        notifyNia("success");
        setValue("");
        return;
      }
      setHistory((h) => [...h, { question: trimmed, answer: result.output.join("\n"), matched: result.ok }].slice(-MAX_HISTORY));
      // Commands get the same "a real system event just happened" sound
      // pairing CommandLine used to fire (blip/error + a glitch burst),
      // distinct from an ordinary FAQ exchange's softer treatment below —
      // running `cd work` should feel like it did something, not like
      // Nia just answered a question.
      if (result.ok) playCommandBlip();
      else playErrorTone();
      triggerGlitch();
      playGlitch();
      notifyNia(result.ok ? "success" : "error");
      setValue("");
      return;
    }

    // "help" and "clear" no longer reach here at all — both are in
    // TERMINAL_VERBS and handled above. Everything that does reach this
    // point is real natural-language text, so it always goes through the
    // fuzzy intent/FAQ path (which still resolves a *phrased* help
    // request like "what can you do" via its own "help" intent entry —
    // see lib/niaFaq.ts — independent of the exact-command path above).
    const { answer, matched, intent } = answerQuestion(trimmed, contextRef.current);
    // A real topic (identity/work/projects/...) becomes the new subject a
    // later "what about his goals?" can resolve against. An unmatched
    // question clears it instead — the visitor asked something genuinely
    // off-topic, so treating the old subject as still "current" would be
    // presumptuous. But a *matched* conversational aside (greeting/thanks/
    // help/farewell) is not a topic change — saying "thanks" or typing
    // "help" mid-conversation about projects shouldn't erase "projects" as
    // the subject, so those simply leave the existing lastIntent alone
    // rather than nulling it out.
    contextRef.current = {
      lastIntent: !matched ? null : isContentIntent(intent) ? intent : contextRef.current.lastIntent,
      lastMatched: matched,
      turnCount: contextRef.current.turnCount + 1,
    };
    setHistory((h) => [...h, { question: trimmed, answer, matched }].slice(-MAX_HISTORY));
    // Reuses the terminal's own success/error sound + Nia-reaction
    // semantics rather than inventing an "assistant" vocabulary — a
    // verified answer reads the same as a successful command, an unknown
    // question reads the same as a failed one. No glitch: an ordinary FAQ
    // exchange isn't the kind of stronger event that mechanism represents.
    if (matched) {
      playCommandBlip();
      notifyNia("success");
    } else {
      playErrorTone();
      notifyNia("error");
    }
    setValue("");
  }

  if (!open) return null;

  const suggested = SUGGESTED_IDS.map((id) => niaFaq.find((entry) => entry.id === id)).filter(
    (entry): entry is (typeof niaFaq)[number] => Boolean(entry),
  );

  return (
    <div
      className={styles.panel}
      role="region"
      aria-label="Ask Nia about Dinesh"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onClose();
        }
      }}
    >
      <div className={styles.header}>
        <span className={styles.headerTitle}>NIA</span>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close assistant">
          ×
        </button>
      </div>
      <p className={styles.subtitle}>personal profile interface</p>

      {history.length === 0 && <p className={styles.hint}>Ask me about Dinesh.</p>}

      {history.length > 0 && (
        <div className={styles.conversation} ref={scrollRef} aria-live="polite">
          {history.map((ex, i) => (
            <div key={i} className={styles.exchange}>
              <p className={styles.question}>
                <span className={styles.chevron} aria-hidden="true">
                  {"›"}
                </span>{" "}
                {ex.question}
              </p>
              <p className={styles.niaLabel} aria-hidden="true">
                nia
              </p>
              <p className={ex.matched ? styles.answer : styles.answerUnknown}>{ex.answer}</p>
            </div>
          ))}
        </div>
      )}

      <div className={styles.suggestions}>
        {suggested.map((entry) => (
          <button key={entry.id} type="button" className={styles.chip} onClick={() => ask(entry.question)}>
            {entry.question}
          </button>
        ))}
      </div>

      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          ask(value);
        }}
      >
        {/* Decorative only — never part of the submitted value. The input
            itself carries the real accessible label below. */}
        <span className={styles.prompt} aria-hidden="true">
          {"›"}
        </span>
        <input
          ref={inputRef}
          className={styles.input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              ask(value);
            }
          }}
          placeholder="ask a question…"
          aria-label="Ask Nia a question about Dinesh"
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit" className={styles.submit}>
          ask
        </button>
      </form>
    </div>
  );
}
