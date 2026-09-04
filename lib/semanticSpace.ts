// A real, small TF-IDF + cosine-similarity engine over this site's own
// real content (project descriptions, stacks, capability categories) —
// not a fabricated "neural net" illustration. TF-IDF/cosine similarity is
// a genuine, well-established information-retrieval technique (the
// "keyword" half of the hybrid dense+keyword retrieval taxcite, one of
// the real projects indexed here, actually uses) — not deep-learning
// embeddings, and this module never claims to be. Computed once, client-
// side, from lib/content.ts — no API key, no network call, no server:
// every number this produces (a similarity score, a nearest neighbor) is
// really computed from the real text on this page, so a caption like
// "real, computed" is a true claim rather than the "illustrative — not a
// live model" disclaimer the components this replaces used to need.

import { capabilities, projects } from "./content";

export type SemanticDoc = {
  id: string;
  label: string;
  kind: "project" | "capability";
  /** What actually gets tokenized/indexed — name + description + stack
   *  concatenated, for maximum real signal. */
  text: string;
  /** What a human should actually read back — the real description (or
   *  item list), not the raw concatenated index text above. */
  display: string;
};

const STOPWORDS = new Set([
  "a","an","the","and","or","of","in","on","for","to","with","is","are","this","that",
  "it","as","at","by","be","from","into","not","no","its","was","were","has","have",
  "had","but","so","if","than","then","also","can","which","who","what","when","where",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

export const DOCS: SemanticDoc[] = [
  ...projects.map((p) => ({
    id: p.name,
    label: p.name,
    kind: "project" as const,
    text: [p.name, p.description, ...(p.stack ?? [])].join(" "),
    display: p.description,
  })),
  ...capabilities.map((c) => ({
    id: c.category,
    label: c.category,
    kind: "capability" as const,
    text: [c.category, ...c.items].join(" "),
    display: c.items.join(", "),
  })),
];

// --- TF-IDF, computed once at module load (the corpus is fixed real
// content, not something that changes at runtime) ---
const docTokens = DOCS.map((d) => tokenize(d.text));
const vocabulary = Array.from(new Set(docTokens.flat()));
const idf = new Map<string, number>();
for (const term of vocabulary) {
  const docsWithTerm = docTokens.filter((tokens) => tokens.includes(term)).length;
  // +1 smoothing — a term that appears in every document still gets a
  // small, non-zero weight rather than being erased entirely.
  idf.set(term, Math.log(DOCS.length / (1 + docsWithTerm)) + 1);
}

function vectorize(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  const vec = new Map<string, number>();
  for (const [term, count] of tf) {
    const weight = idf.get(term);
    if (weight !== undefined) vec.set(term, (count / tokens.length) * weight);
  }
  return vec;
}

const docVectors = docTokens.map(vectorize);

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (const v of a.values()) magA += v * v;
  for (const v of b.values()) magB += v * v;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const [term, v] of small) {
    const otherV = large.get(term);
    if (otherV !== undefined) dot += v * otherV;
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

export type SearchResult = { doc: SemanticDoc; score: number };

/** Embeds `query` with the same real IDF weights the corpus was built
 * from, then ranks every real document by cosine similarity. This is the
 * one function doing actual, live computation — not a lookup table. */
export function search(query: string, topK = 3): SearchResult[] {
  const queryVec = vectorize(tokenize(query));
  return DOCS.map((doc, i) => ({ doc, score: cosineSimilarity(queryVec, docVectors[i]) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/** The real nearest neighbor of `docId` among every other real document —
 * used by HeroVectorSpace's connecting lines, replacing what used to be
 * "nearest neighbor by randomly-seeded 2D position" (a relationship that
 * only ever meant anything relative to itself) with a genuine semantic
 * relationship. */
export function nearestNeighbor(docId: string): { doc: SemanticDoc; score: number } | null {
  const i = DOCS.findIndex((d) => d.id === docId);
  if (i === -1) return null;
  let best = -1;
  let bestScore = -Infinity;
  DOCS.forEach((_, j) => {
    if (j === i) return;
    const s = cosineSimilarity(docVectors[i], docVectors[j]);
    if (s > bestScore) {
      bestScore = s;
      best = j;
    }
  });
  return best === -1 ? null : { doc: DOCS[best], score: bestScore };
}

/** A real 2D projection for HeroVectorSpace's layout: the two real
 * documents least similar to each other become the two axes, and every
 * document's position is (similarity to axis A, similarity to axis B) —
 * genuine computed coordinates, not a seeded random scatter. */
export function project2D(): { doc: SemanticDoc; x: number; y: number }[] {
  let poleA = 0;
  let poleB = 1;
  let minSim = Infinity;
  for (let i = 0; i < DOCS.length; i++) {
    for (let j = i + 1; j < DOCS.length; j++) {
      const s = cosineSimilarity(docVectors[i], docVectors[j]);
      if (s < minSim) {
        minSim = s;
        poleA = i;
        poleB = j;
      }
    }
  }
  return DOCS.map((doc, i) => ({
    doc,
    x: cosineSimilarity(docVectors[i], docVectors[poleA]),
    y: cosineSimilarity(docVectors[i], docVectors[poleB]),
  }));
}
