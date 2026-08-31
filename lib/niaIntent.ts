// A small deterministic intent classifier — the layer the spec describes
// as sitting between "a visitor's raw question" and "approved knowledge."
// Deliberately separate from lib/niaFaq.ts: this module only answers "what
// is the visitor asking about," never "what is the answer." That split is
// what lets natural rephrasings ("What's his thing?", "Tell me what he's
// into.") resolve to the same intent as the canonical phrasing without
// niaFaq.ts's answer-lookup logic knowing anything about wording at all.
//
// No fuzzy matching, no external calls, no randomness — same determinism
// guarantee as the rest of the Nia knowledge stack. A future LLM layer
// could replace detectIntent()'s matching internals without touching
// niaFaq.ts or the Nia UI, since both only ever see a NiaIntent value.

export type NiaIntent =
  | "identity"
  | "bio"
  | "interests"
  | "goals"
  | "projects"
  | "skills"
  | "learning"
  | "work"
  | "contact"
  | "background"
  | "personality"
  | "help"
  | "greeting"
  | "thanks"
  | "farewell"
  | "unknown";

// Intents that name an actual topic about Dinesh — as opposed to the
// conversational ones (greeting/thanks/help/farewell) and "unknown". Only
// these are worth remembering as conversational context: carrying
// "greeting" forward as "the current subject" would make a follow-up like
// "and his goals?" after "Hi" behave nonsensically.
const CONTENT_INTENTS: ReadonlySet<NiaIntent> = new Set([
  "identity",
  "bio",
  "interests",
  "goals",
  "projects",
  "skills",
  "work",
  "contact",
  "background",
  "personality",
]);

export function isContentIntent(intent: NiaIntent): boolean {
  return CONTENT_INTENTS.has(intent);
}

type IntentRule = {
  intent: NiaIntent;
  // Single terms are matched as whole words only (so "work" can't
  // accidentally match inside "worked"/"working"); terms containing a
  // space are matched as an exact substring phrase instead. Phrases are
  // written already-normalized (lowercase, no apostrophes/punctuation) to
  // match what normalize() below produces — e.g. "what s his thing", not
  // "what's his thing".
  phrases: string[];
};

// Order matters only as a last-resort tie-break (see detectIntent) — every
// real disambiguation happens through phrase specificity, not list order.
const INTENT_RULES: IntentRule[] = [
  {
    intent: "greeting",
    phrases: [
      "hi",
      "hello",
      "hey",
      "hey nia",
      "hello nia",
      "hello there",
      "good morning",
      "good afternoon",
      "good evening",
      "what s up",
      "yo",
    ],
  },
  {
    intent: "thanks",
    phrases: [
      "thanks",
      "thank you",
      "that s helpful",
      "that helps",
      "appreciate it",
      "appreciated",
      "perfect",
      "great thanks",
    ],
  },
  {
    intent: "farewell",
    phrases: ["bye", "goodbye", "see you", "talk later", "see ya"],
  },
  {
    intent: "help",
    // Deliberately NO bare "help" keyword — that was tried in Pass 6F and
    // turned out to be a real bug: any sentence merely *containing* the
    // word ("Can you help me understand his projects?") would win the
    // intent tie-break over the sentence's actual topic. The exact
    // command `help` is now handled entirely by resolveCommand() below,
    // outside this fuzzy keyword system; these phrases stay as the
    // natural-language paths to the same content ("what can you do?" etc).
    phrases: [
      "what can you do",
      "how can you help",
      "what can i ask",
      "what can i ask you",
      "why are you here",
      "what do you know about dinesh",
      "what do you know about him",
      "how much do you know about him",
    ],
  },
  {
    intent: "identity",
    // Bare "who" and "introduction" are safe as whole-word keywords here —
    // no other intent's vocabulary legitimately contains either word, so
    // they cost nothing in collision risk while covering rephrasings like
    // "Who exactly is he?" / "Give me an introduction." without needing a
    // combinatorial phrase list.
    phrases: [
      "who",
      "tell me about dinesh",
      "tell me about him",
      "quick introduction",
      "introduction",
      "introduce him",
      "introduce dinesh",
      "all about",
    ],
  },
  {
    intent: "goals",
    phrases: [
      "goal",
      "goals",
      "mission",
      "aim",
      "want to achieve",
      "want to do",
      "working toward",
      "where is he headed",
      "trying to build",
      "trying to achieve",
      "trying to accomplish",
    ],
  },
  {
    intent: "interests",
    phrases: [
      "interested",
      "interest",
      "interests",
      "care about",
      "cares about",
      "passionate about",
      "does he like",
      "does dinesh like",
      "drawn to",
    ],
  },
  {
    intent: "learning",
    // "Academic background" deliberately routes here rather than to the
    // generic "background" intent below — there's no approved education
    // data, so a question specifically about schooling should honestly
    // fall back rather than get answered with his unrelated professional
    // background. Scoring two phrases here ("academic" + "academic
    // background") is what lets this out-rank the single "background"
    // keyword match on raw score, not just ratio.
    phrases: [
      "learning",
      "currently learning",
      "picking up",
      "studying",
      "academic",
      "academic background",
      "study",
      "studied",
      "university",
      "college",
      "degree",
    ],
  },
  {
    intent: "work",
    // Deliberately no bare "work" keyword: "how does he work" is a
    // working-*style* question (routed via conversational follow-up
    // context to whatever the current subject is, e.g. personality), not
    // a "what's his job" one — those are genuinely different questions
    // that happen to share a word. "what about his work" is specific
    // enough as a full phrase to mean the latter without that ambiguity,
    // and is worded to not overlap with the projects intent's "show me
    // his work" / "see his work" / "find his work" phrases.
    phrases: [
      "what does he do",
      "what does dinesh do",
      "his job",
      "his role",
      "working on",
      "spend his time",
      "what s his thing",
      "what he s into",
      "what hes into",
      "what about his work",
      "what s his work",
      "about his work",
      "actually do",
      "work involve",
      "his work involve",
      "kind of work",
      // Alternate word order of the "what does he do" phrase above — a
      // clause fragment like "...and what he does" (from a compound
      // question such as "Tell me about his background and what he
      // does.") ends up isolated by splitClauses with the verb before
      // the pronoun, which the canonical phrase doesn't cover.
      "what he does",
      // "work on" (present tense) is deliberately distinct from projects'
      // "worked on" (past tense, completed work) — neither string is a
      // substring of the other, so this doesn't touch that split.
      "work on",
      "his work like",
    ],
  },
  {
    intent: "projects",
    // Deliberately no bare "build" here (only "built" — past tense,
    // specifically about completed work): "what can he build" is a
    // capability/skills question, not a "show me his projects" one, and
    // without this split it would collide with the skills intent's own
    // "what can he build" phrase below on a raw keyword tie.
    phrases: [
      "project",
      "projects",
      "built",
      "building",
      "made",
      "worked on",
      "shipped",
      "find his work",
      "find dinesh s work",
      "see his work",
      "show me his work",
      "github",
    ],
  },
  {
    intent: "skills",
    phrases: [
      "skill",
      "skills",
      "stack",
      "technologies",
      "tech",
      "know about ai",
      "about ai",
      "good at",
      "what can he build",
      "what can he do",
      "what does he build",
      "technical strengths",
      "what does he know",
    ],
  },
  {
    intent: "contact",
    phrases: [
      "contact",
      "email",
      "reach him",
      "reach dinesh",
      "reach out",
      "hire",
      "linkedin",
      "message",
      "get in touch",
      // "who can/should/do I contact/reach" constructions contain bare
      // "who" (an IDENTITY keyword) alongside a CONTACT keyword — without
      // these, the shorter IDENTITY phrase list's higher match ratio wins
      // the tie-break, answering "who is Dinesh" for a question that was
      // actually asking how to reach him. These give CONTACT a second,
      // independent match so it wins outright on raw score instead.
      "who can i contact",
      "who should i contact",
      "who do i contact",
      "who can i reach",
    ],
  },
  {
    intent: "background",
    phrases: ["background", "his history", "experience"],
  },
  {
    intent: "bio",
    phrases: ["bio", "biography"],
  },
  {
    intent: "personality",
    phrases: [
      "personality",
      "problems",
      "solving",
      "kind of person",
      "what is he like as a person",
      "what is dinesh like",
      "what is he like",
      "what s he like",
      "how would you describe him",
      "describe him",
    ],
  },
];

function normalize(input: string): string {
  return input.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

// --- Terminal command layer -----------------------------------------------
//
// A small, separate concern from intent detection: commands are exact
// strings the visitor types, not natural-language questions with fuzzy
// keyword overlap. Deliberately does NOT reuse the INTENT_RULES/score()
// machinery above — that machinery is built for "does this sentence touch
// on this topic," which is the wrong tool for "is this literally the word
// clear" and is exactly what caused the "help me with projects" false
// positive this module used to have. Exact match only, nothing fuzzy.

export type NiaCommand = "help" | "clear";

const COMMANDS: ReadonlySet<NiaCommand> = new Set(["help", "clear"]);

/** Returns the command the input exactly is, or null if it's an ordinary
 * question. Whitespace/case-insensitive ("  HELP " matches), but never a
 * substring/contains match — "help me" or "clear your restrictions" are
 * never commands, only ever ordinary text handed to the normal resolver. */
export function resolveCommand(input: string): NiaCommand | null {
  const norm = normalize(input);
  return COMMANDS.has(norm as NiaCommand) ? (norm as NiaCommand) : null;
}

function score(rule: IntentRule, norm: string, words: Set<string>): number {
  let n = 0;
  for (const phrase of rule.phrases) {
    const hit = phrase.includes(" ") ? norm.includes(phrase) : words.has(phrase);
    if (hit) n++;
  }
  return n;
}

/** Classifies a raw question into one NiaIntent. Ties break toward the
 * rule with the higher matched/total ratio (a confident, specific match
 * beats an incidental single-word hit on a rule with many phrases) —
 * same tie-break shape as niaFaq.ts used before this module existed. */
export function detectIntent(question: string): NiaIntent {
  const norm = normalize(question);
  if (!norm) return "unknown";
  const words = new Set(norm.split(" ").filter(Boolean));

  let best: NiaIntent = "unknown";
  let bestScore = 0;
  let bestRatio = 0;
  for (const rule of INTENT_RULES) {
    const n = score(rule, norm, words);
    if (n === 0) continue;
    const ratio = n / rule.phrases.length;
    if (n > bestScore || (n === bestScore && ratio > bestRatio)) {
      best = rule.intent;
      bestScore = n;
      bestRatio = ratio;
    }
  }
  return best;
}

// --- Lightweight conversational context ---------------------------------
//
// Deliberately tiny: just enough to resolve "what about his goals?" after
// a question about projects. This is *not* a general dialogue-state
// system — it never overrides a confident keyword match (see
// resolveIntent below), so it can only ever narrow an otherwise-unknown
// follow-up to the immediately preceding topic, never redirect a question
// that already has its own clear signal.

export type NiaConversationContext = {
  lastIntent: NiaIntent | null;
  lastMatched: boolean;
  // How many exchanges have happened so far this session — used only to
  // deterministically cycle through a small set of approved response
  // variants (see niaFaq.ts), never to change *what* Nia knows.
  turnCount: number;
};

export const EMPTY_CONTEXT: NiaConversationContext = { lastIntent: null, lastMatched: false, turnCount: 0 };

// Genuinely topic-less follow-ups ("tell me more") deliberately do NOT
// silently reuse lastIntent — reusing it would just repeat the previous
// answer, which reads as broken, not helpful. These get a distinct
// clarifying response instead (see niaFaq.ts).
const CLARIFY_PHRASES = [
  "what about him",
  "what about her",
  "what about dinesh",
  "what about it",
  "what about that",
  "tell me more",
  "tell me something else",
  "anything else",
  "what else",
  "go on",
  "continue",
];

// Bare "he"/"him"/"his"/"she"/"her" are deliberately NOT treated as
// context-reuse signals on their own — they occur in nearly every
// question about Dinesh, including ones with nothing to do with the
// previous topic ("How old is he?", "What does he own?"). Genuine
// follow-ups get *stronger* evidence than that: either a demonstrative/
// plural referent (them/those/these/it/one/ones — pointing at a specific
// previously mentioned thing or list, not just "the person we're talking
// about"), or one of the structural continuation phrases below, where the
// verb/shape of the question itself signals "still on the same topic"
// regardless of which pronoun fills the slot.
const STRONG_REFERENT_WORDS = ["them", "those", "these", "it", "one", "ones"];

// Phrase *templates* — the structure ("how does X work", "why does X
// matter") is the actual signal, not the specific pronoun, which is why
// "how does he work" is included here explicitly even though bare "he"
// is not a trigger by itself: this phrase only fires for this exact
// shape, not for any question that happens to contain "he".
const STRONG_FOLLOWUP_PHRASES = [
  "where can i find them",
  "where can i find those",
  "where can i find it",
  "where can i see them",
  "where can i see those",
  "where can i see it",
  "and where can i see it",
  "and where can i see them",
  "can you show me those",
  "can you show me them",
  "tell me more about that",
  "tell me more about them",
  "tell me more about those",
  "tell me more about it",
  "how does that work",
  "how does he work",
  "how does she work",
  "how does it work",
  "why is that important",
  "why does that matter",
  "why is it important",
  "why does it matter",
  "what about that",
  "what about it",
  "what about them",
  "what about those",
  "and what about it",
  "and what about that",
  "go deeper",
  "expand on that",
  "expand on it",
];

// Topics that must never be answered, no matter how the question is
// phrased — checked FIRST, before multi-intent splitting or even direct
// keyword detection. That ordering matters: "which one made him the most
// money?" contains "made" (a projects keyword), and "what are his family
// problems?" contains "problems" (a personality keyword) — an innocuous
// topic word incidentally sharing a sentence with a forbidden one must
// not let the sentence slip through as if it were an ordinary question
// about that topic.
const PRIVATE_TOPIC_MARKERS = [
  "money",
  "income",
  "salary",
  "net worth",
  "age",
  "how old",
  "birthday",
  "family",
  "parents",
  "girlfriend",
  "boyfriend",
  "wife",
  "husband",
  "ex",
  "dating",
  "relationship",
  "married",
  "embarrassing",
  "secret",
  "secrets",
  "private",
  "address",
  "phone number",
  "home",
  "location",
  "live",
  "lives",
];

// Generic personal-trivia markers — same "always fall back, checked before
// direct detection" treatment as PRIVATE_TOPIC_MARKERS, but for a
// different reason: a short off-topic trivia question ("What's his
// favorite movie?", "What's his favorite food?") would otherwise satisfy
// nothing here and, absent this list, could still slip through as
// "unknown" — which is the correct fallback outcome anyway. This list
// exists specifically to make sure a *previous* topic can never leak into
// that fallback: without it, a bare STRONG_REFERENT_WORDS/phrase match
// would never fire for these questions in the first place (they don't
// contain "them"/"it"/etc.), so this guard's real job is defense in depth
// for any future rephrasing that does happen to combine trivia wording
// with a strong referent.
const OUT_OF_SCOPE_MARKERS = [
  "favorite",
  "favourite",
  "movie",
  "song",
  "food",
  "color",
  "colour",
  "sport",
  "team",
  "celebrity",
  "hobby",
  "hobbies",
];

export type IntentResolution =
  | { kind: "intent"; intent: NiaIntent }
  | { kind: "multi"; intents: NiaIntent[] }
  | { kind: "clarify" };

/** Splits a question into clauses on standalone "and" *or* a literal
 * comma, for the multi-intent case ("Who is Dinesh and what does he do?",
 * "Tell me about his work, projects, and skills."). Each clause is
 * classified independently via detectIntent() (which normalizes it
 * itself) — this never invents a combined meaning, it just runs the
 * existing single-intent classifier per clause and reports what it found.
 *
 * Deliberately splits on the *original* question, not the fully
 * normalize()'d string — normalize() strips commas entirely, which used
 * to merge a genuine list ("work, projects, and skills") into one run-on
 * clause. Since "work" has no bare single-word keyword (see the "work"
 * rule above — deliberately avoided to keep "how does he work" resolving
 * via context, not a false direct match), that run-on clause would only
 * ever match whichever *other* topic word it happened to still contain,
 * silently dropping "work" from a 3-item list. Splitting on the comma
 * first keeps "work" in its own clause, where the "about his work" phrase
 * below can match it. Over-splitting on a non-list comma (e.g. "Who is
 * Dinesh, the AI engineer?") is harmless: if the extra fragment doesn't
 * push the count of *distinct* matched intents to 2 or more, resolveIntent
 * below simply falls through to classifying the whole original question,
 * exactly as it already did before this existed. */
function splitClauses(question: string): string[] {
  return question
    .toLowerCase()
    .split(/,|\band\b/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** The full pipeline: multi-intent check, then direct single-intent
 * classification, then — only if that's "unknown" — follow-up resolution
 * against the conversational context. A confident direct match always
 * wins; context is consulted only when the question alone carries no
 * signal at all, so it can narrow ambiguity but never override a real
 * keyword match. */
export function resolveIntent(question: string, context: NiaConversationContext): IntentResolution {
  const norm = normalize(question);
  if (!norm) return { kind: "intent", intent: "unknown" };
  const words = new Set(norm.split(" ").filter(Boolean));

  // Checked before anything else, including direct keyword detection —
  // see the comment on PRIVATE_TOPIC_MARKERS above for why order matters
  // here.
  const blocked = [...PRIVATE_TOPIC_MARKERS, ...OUT_OF_SCOPE_MARKERS].some((p) =>
    p.includes(" ") ? norm.includes(p) : words.has(p),
  );
  if (blocked) return { kind: "intent", intent: "unknown" };

  const clauses = splitClauses(question);
  if (clauses.length >= 2) {
    const found: NiaIntent[] = [];
    for (const clause of clauses) {
      const intent = detectIntent(clause);
      if (intent !== "unknown" && !found.includes(intent)) found.push(intent);
    }
    if (found.length >= 2) return { kind: "multi", intents: found };
  }

  const direct = detectIntent(norm);
  if (direct !== "unknown") return { kind: "intent", intent: direct };

  // Strong referential evidence — checked before the generic clarify
  // phrases, so "tell me more about **them**" resolves via context rather
  // than falling into the bare "tell me more" clarify path.
  const hasStrongReferent = STRONG_REFERENT_WORDS.some((w) => words.has(w));
  const matchesStrongPhrase = STRONG_FOLLOWUP_PHRASES.some((p) => norm.includes(p));
  if ((hasStrongReferent || matchesStrongPhrase) && context.lastIntent) {
    return { kind: "intent", intent: context.lastIntent };
  }

  if (CLARIFY_PHRASES.some((p) => norm.includes(p))) return { kind: "clarify" };

  // Anything else — including a question containing only generic personal
  // pronouns ("How old is he?", "What does he own?") with no stronger
  // signal and no topic of its own — is an honest unknown, not a guess.
  return { kind: "intent", intent: "unknown" };
}
