// Nia's FAQ/knowledge-lookup layer — the piece the spec describes as "maps
// known questions to approved answers." Deliberately separate from
// niaProfile.ts (the raw knowledge), niaIntent.ts (the "what is the
// visitor asking" classifier + lightweight conversational context), and
// Mascot.tsx (the presentation layer): this module only ever answers
// "given a resolved intent, what's the approved response," so a future
// LLM layer could replace either niaIntent.ts's matching or this module's
// answer generation independently, without the Nia UI changing at all.
//
// Deterministic on purpose — no randomness, no model call, no network. If
// nothing matches, it returns the same honest "don't know" fallback every
// time rather than guessing. Every answer is built only from niaProfile's
// already-verified facts; nothing here is invented. Answers are written
// consistently in third person — Nia is speaking *about* Dinesh to a
// visitor, never *as* him, so none of these splice in the site's own
// first-person copy verbatim.

import {
  EMPTY_CONTEXT,
  resolveIntent,
  type NiaConversationContext,
  type NiaIntent,
} from "./niaIntent";
import { niaProfile } from "./niaProfile";

export type FaqEntry = {
  id: string;
  question: string;
  answer: string;
  // A shorter continuation, used only when this entry is the *second or
  // later* part of a composed multi-intent answer (see compose() below).
  // Without this, e.g. "Who is Dinesh and what does he do?" would repeat
  // "builds, deploys, and improves AI systems for real-world workflows"
  // twice — technically correct, but reads as broken, not composed.
  // Entries with nothing meaningfully different to add in that position
  // simply omit it and fall back to `answer`.
  briefAnswer?: string;
  // A small set of approved phrasings, deterministically cycled by
  // conversation turn count (see pickVariant()) rather than always
  // returning the exact same sentence. Only conversational entries
  // (greeting/thanks/farewell) use this — knowledge answers stay stable
  // and single-form, since varying a *fact* would read as inconsistency,
  // not personality.
  variants?: string[];
  category: string;
  public: true;
  // Which intents this entry answers — resolveIntent() classifies the
  // visitor's question into one NiaIntent (or a multi-intent/clarify
  // case), and answerQuestion() below looks up the first entry that lists
  // it. One entry can legitimately answer more than one intent (e.g.
  // "background" and "bio" overlap in the underlying facts) without
  // duplicating the answer text.
  intents: NiaIntent[];
};

const FALLBACK_ANSWER =
  "I don't have verified information about that yet. I can tell you about Dinesh's background, work, interests, goals, projects, or skills.";

const CLARIFY_ANSWER =
  "What would you like to know more about — his work, projects, goals, interests, or background?";

function projectList(): string {
  return niaProfile.projects.map((p) => `${p.name} — ${p.description}`).join(" ");
}

function skillList(): string {
  return niaProfile.skills.map((g) => `${g.category}: ${g.items.join(", ")}`).join(". ");
}

// What the help response actually lists — deliberately only the intents
// that answer real questions about Dinesh, never the conversational ones
// (greeting/thanks/help/farewell aren't "things you can ask about him").
// Kept as an explicit, ordered list rather than derived from `niaFaq`
// below so the display copy can stay human-written prose while still
// being trivial to keep in sync by eye against the entries it describes.
const HELP_TOPICS: { intent: NiaIntent; label: string }[] = [
  { intent: "identity", label: "who Dinesh is" },
  { intent: "background", label: "professional background" },
  { intent: "work", label: "what he does" },
  { intent: "interests", label: "what he's drawn to" },
  { intent: "goals", label: "what he's working toward" },
  { intent: "personality", label: "how he approaches problems" },
  { intent: "projects", label: "selected work" },
  { intent: "skills", label: "technologies and capabilities" },
  { intent: "contact", label: "how to reach him" },
];

// The topic list itself stays fixed (it's a factual listing of real
// capabilities, not a conversational quip) — only the intro line varies,
// via the same deterministic turn-count cycling every other conversational
// entry uses.
function helpAnswer(intro: string): string {
  const width = Math.max(...HELP_TOPICS.map((t) => t.intent.length)) + 3;
  const lines = HELP_TOPICS.map((t) => `  ${t.intent.padEnd(width)}${t.label}`);
  return [
    intro,
    ...lines,
    "",
    'Try asking naturally — "What does he do?", "Tell me about his projects.", "How would you describe him?"',
    "",
    "I only answer from verified information in Dinesh's profile.",
  ].join("\n");
}

export const niaFaq: FaqEntry[] = [
  {
    id: "who-is-dinesh",
    question: "Who is Dinesh?",
    answer: `${niaProfile.name} is an ${niaProfile.role} who ${niaProfile.summary}.`,
    // Composed in a non-first slot (e.g. "What does he do and who is
    // Dinesh?" — "who is Dinesh" lands second), the full answer would
    // restate niaProfile.summary verbatim right after the work/background
    // entry that already said it. This just gives the name and role.
    briefAnswer: `${niaProfile.name} — an ${niaProfile.role}.`,
    category: "identity",
    public: true,
    intents: ["identity"],
  },
  {
    id: "what-does-he-do",
    question: "What does Dinesh do?",
    answer: `He ${niaProfile.summary} — spanning ${niaProfile.interests.join(", ")}.`,
    briefAnswer: `His work spans ${niaProfile.interests.join(", ")}.`,
    category: "identity",
    public: true,
    intents: ["work"],
  },
  {
    id: "background",
    question: "What is Dinesh's background?",
    answer: `Dinesh is an ${niaProfile.role}. ${niaProfile.bio.join(" ")}`,
    // Same reasoning as who-is-dinesh's briefAnswer above — drops the
    // "Dinesh is an {role}" restatement for a non-first composed slot,
    // keeping just the actual background narrative.
    briefAnswer: niaProfile.bio.join(" "),
    category: "identity",
    public: true,
    intents: ["background", "bio"],
  },
  {
    id: "interests",
    question: "What is Dinesh interested in?",
    answer: `His stated focus areas are ${niaProfile.interests.join(", ")}.`,
    category: "interests",
    public: true,
    intents: ["interests"],
  },
  {
    id: "goals",
    question: "What are Dinesh's goals?",
    answer: `His goal is to ${niaProfile.goals[0]}.`,
    category: "goals",
    public: true,
    intents: ["goals"],
  },
  {
    id: "personality",
    question: "What is Dinesh like?",
    answer:
      "He's a hands-on builder: he likes root-causing bugs in unfamiliar codebases, scoping ambiguous problems into working systems, and shipping fixes upstream rather than just prototyping in isolation. His process starts with understanding the real constraints, then a fast prototype, then integrating with real data and deploying — iterating from there on real feedback.",
    category: "personality",
    public: true,
    intents: ["personality"],
  },
  {
    id: "projects",
    question: "What has Dinesh worked on?",
    answer: `${projectList()} You can see all of this on the /creations page, or on GitHub at ${niaProfile.contact.github}.`,
    category: "projects",
    public: true,
    intents: ["projects"],
  },
  {
    id: "skills",
    question: "What skills does Dinesh have?",
    answer: skillList(),
    category: "skills",
    public: true,
    intents: ["skills"],
  },
  {
    id: "contact",
    question: "How can I contact Dinesh?",
    answer: `Email ${niaProfile.contact.email}, or find him on GitHub (${niaProfile.contact.github}) or LinkedIn (${niaProfile.contact.linkedin}). There's also a /contact page on this site.`,
    category: "contact",
    public: true,
    intents: ["contact"],
  },
  {
    id: "greeting",
    question: "Hi",
    answer: "Hey — I'm Nia. What would you like to know about Dinesh?",
    variants: [
      "Hey — I'm Nia. What would you like to know about Dinesh?",
      "Hey — what do you want to know?",
      "Hello. Ask me anything about Dinesh's profile, projects, goals, interests, or skills.",
    ],
    category: "conversational",
    public: true,
    intents: ["greeting"],
  },
  {
    id: "thanks",
    question: "Thanks",
    answer: "Anytime.",
    variants: ["Anytime.", "You're welcome.", "Glad that helped."],
    category: "conversational",
    public: true,
    intents: ["thanks"],
  },
  {
    id: "farewell",
    question: "Bye",
    answer: "See you around.",
    variants: ["See you around.", "Anytime. I'll be here."],
    category: "conversational",
    public: true,
    intents: ["farewell"],
  },
  {
    id: "help",
    question: "help",
    answer: helpAnswer("Available topics:"),
    variants: [helpAnswer("Available topics:"), helpAnswer("Here's what I can help with:")],
    category: "conversational",
    public: true,
    intents: ["help"],
  },
];

export type FaqAnswer = {
  answer: string;
  matched: boolean;
  category?: string;
  intent: NiaIntent;
};

function lookup(intent: NiaIntent): FaqEntry | undefined {
  return niaFaq.find((e) => e.intents.includes(intent));
}

/** Deterministic variant selection — cycles through an entry's approved
 * phrasings by turn count. No randomness: the same conversation replayed
 * twice produces the same sequence of responses. */
function pickText(entry: FaqEntry, context: NiaConversationContext): string {
  if (!entry.variants || entry.variants.length === 0) return entry.answer;
  return entry.variants[context.turnCount % entry.variants.length];
}

/** The direct path the `help` terminal command uses — reuses the exact
 * same entry (and the same deterministic variant cycling) `answerQuestion`
 * would land on for a natural "what can you do?", but reached without
 * going through intent detection at all. Keeps the command layer fully
 * outside the fuzzy keyword system, per niaIntent.ts's resolveCommand(). */
export function getHelpAnswer(context: NiaConversationContext = EMPTY_CONTEXT): FaqAnswer {
  const entry = lookup("help");
  // Not reachable in practice — the "help" entry is always present — but
  // keeps this function total rather than assuming an array lookup can't
  // fail.
  if (!entry) return { answer: FALLBACK_ANSWER, matched: false, intent: "unknown" };
  return { answer: pickText(entry, context), matched: true, category: entry.category, intent: "help" };
}

/** Resolves the question against the (optional) conversational context via
 * resolveIntent(), then looks up the approved answer(s) — or the honest
 * fallback if nothing answers it. This is the only place intent
 * resolution meets actual knowledge; niaIntent.ts never sees an answer
 * string, and this function never second-guesses what niaIntent.ts
 * classified. */
export function answerQuestion(
  question: string,
  context: NiaConversationContext = EMPTY_CONTEXT,
): FaqAnswer {
  const resolution = resolveIntent(question, context);

  if (resolution.kind === "clarify") {
    return { answer: CLARIFY_ANSWER, matched: true, intent: "unknown" };
  }

  if (resolution.kind === "multi") {
    const pairs = resolution.intents
      .map((intent) => ({ intent, entry: lookup(intent) }))
      .filter((p): p is { intent: NiaIntent; entry: FaqEntry } => Boolean(p.entry));
    if (pairs.length >= 2) {
      // First part keeps its full answer; later parts use their shorter
      // briefAnswer where one exists, so a composed response reads as one
      // coherent reply instead of restating already-covered ground.
      const answer = pairs.map((p, i) => (i === 0 ? p.entry.answer : p.entry.briefAnswer ?? p.entry.answer)).join(" ");
      return { answer, matched: true, category: pairs[0].entry.category, intent: pairs[0].intent };
    }
    if (pairs.length === 1) {
      return { answer: pairs[0].entry.answer, matched: true, category: pairs[0].entry.category, intent: pairs[0].intent };
    }
    return { answer: FALLBACK_ANSWER, matched: false, intent: "unknown" };
  }

  const entry = lookup(resolution.intent);
  if (!entry) return { answer: FALLBACK_ANSWER, matched: false, intent: resolution.intent };
  return { answer: pickText(entry, context), matched: true, category: entry.category, intent: resolution.intent };
}
