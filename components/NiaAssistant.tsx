"use client";

import { useEffect, useRef, useState } from "react";
import { answerQuestion, getHelpAnswer, niaFaq } from "@/lib/niaFaq";
import { EMPTY_CONTEXT, isContentIntent, resolveCommand, type NiaConversationContext } from "@/lib/niaIntent";
import { notifyNia } from "@/lib/niaReaction";
import { playCommandBlip, playErrorTone } from "@/lib/sound";
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

  // The one place a question actually reaches the knowledge layer — used
  // by both the input form and the suggested-question chips, so neither
  // path can diverge from the other. Exact terminal commands are checked
  // first via resolveCommand() — a small, separate, exact-match layer
  // (see lib/niaIntent.ts) that can never be confused with an ordinary
  // question ("help me with projects" is not a command). "clear" is a UI
  // action (wipe the transcript, reset the subject) handled entirely here;
  // "help" still flows through the same history/sound/reaction logic
  // below as any other answer, just sourced from getHelpAnswer() instead
  // of answerQuestion() so it never touches intent detection at all.
  function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed) return;

    const command = resolveCommand(trimmed);
    if (command === "clear") {
      setHistory([]);
      contextRef.current = EMPTY_CONTEXT;
      playCommandBlip();
      notifyNia("success");
      setValue("");
      return;
    }

    const { answer, matched, intent } =
      command === "help" ? getHelpAnswer(contextRef.current) : answerQuestion(trimmed, contextRef.current);
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
