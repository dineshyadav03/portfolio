// The real command shell — ported out of the old standalone CommandLine
// component (removed; see the git history) so Nia's assistant panel could
// become the single place this lives, instead of two separate input rows
// on every page doing overlapping things. Pure command resolution only —
// no sound/reaction side effects, since NiaAssistant and any future
// caller each have their own conventions for those; this just returns
// `null` for "not a recognized command at all" (the caller's cue to fall
// through to whatever else it does with plain text) or a real result.
import { nav, profile, projects, posts, capabilities, buildStatus } from "./content";
import { search as semanticSearch } from "./semanticSpace";
import { setSystemStatus } from "./systemStatus";
import { getTheme, setTheme } from "./theme";

export type TerminalCommandResult = {
  output: string[];
  ok: boolean;
  /** True only for "clear" — the caller owns its own history state, so
   *  this just signals "the visitor asked to wipe it," it doesn't do so
   *  itself. */
  cleared?: boolean;
};

const ROUTE_ALIASES: Record<string, string> = {
  "": "/",
  home: "/",
  about: "/",
  creations: "/creations",
  work: "/creations",
  projects: "/creations",
  reflections: "/reflections",
  writing: "/reflections",
  blog: "/reflections",
  contact: "/contact",
};

export const TERMINAL_HELP_LINES = [
  "available commands:",
  "  help              show this list",
  "  whoami            about " + profile.name,
  "  ls                list sections",
  "  cd <section>      navigate (about, work, writing, contact)",
  "  cat projects      list work",
  "  cat posts         list writing",
  "  skills            list capability categories",
  "  search <query>    real tf-idf search over projects + skills",
  "  status            build/system status",
  "  open <project>    open a project's repo in a new tab",
  "  theme             toggle dark/light",
  "  contact           show contact info",
  "  clear             clear this conversation",
];

// Every literal first word this shell actually recognizes — checked by
// the caller (a whole-word match on the input's first token) to decide
// "is this a command at all," before ever calling runTerminalCommand
// itself. Kept here, next to the switch it maps to, so the two can never
// silently drift apart.
export const TERMINAL_VERBS = new Set([
  "help","whoami","ls","cd","cat","skills","capabilities","search","find",
  "status","open","theme","contact","clear","sudo","matrix",
]);

export function runTerminalCommand(raw: string, router: { push: (href: string) => void }): TerminalCommandResult {
  const trimmed = raw.trim();
  const [cmd, ...rest] = trimmed.split(/\s+/);
  const arg = rest.join(" ").toLowerCase();
  const command = (cmd ?? "").toLowerCase();

  switch (command) {
    case "help":
      return { output: TERMINAL_HELP_LINES, ok: true };
    case "whoami":
      return { output: [`${profile.name} ${profile.tagline}`, ...profile.bio], ok: true };
    case "ls":
      return { output: nav.map((item) => `${item.code}  ${item.label}`), ok: true };
    case "cd": {
      const target = ROUTE_ALIASES[arg];
      if (target) {
        router.push(target);
        return { output: [`navigating to ${arg || "home"}...`], ok: true };
      }
      return { output: [`cd: no such section: ${arg || "(none given)"}`, "try: ls"], ok: false };
    }
    case "cat":
      if (arg === "projects") {
        return { output: projects.map((p) => `${p.name} — ${p.description}`), ok: true };
      }
      if (arg === "posts") {
        return { output: posts.map((p) => `${p.date}  ${p.title}`), ok: true };
      }
      return { output: [`cat: ${arg || "(no file)"}: no such file`], ok: false };
    case "skills":
    case "capabilities":
      return { output: capabilities.map((c) => `${c.category}: ${c.items.join(", ")}`), ok: true };
    case "search":
    case "find": {
      if (!arg) return { output: [`${command}: usage: ${command} <query>`], ok: false };
      // Real cosine-similarity ranking over real project/skill text — see
      // lib/semanticSpace.ts. Anything scoring effectively zero shares no
      // real terms with the query, so it's excluded rather than padding
      // the list with irrelevant matches just to fill 3.
      const results = semanticSearch(arg, 3).filter((r) => r.score > 0.01);
      if (results.length === 0) {
        return { output: [`no real matches for "${arg}"`, "try: skills, or cat projects"], ok: false };
      }
      return {
        output: [
          ...results.map(
            (r) =>
              `${r.score.toFixed(2)}  ${r.doc.label} — ${r.doc.display.slice(0, 70)}${r.doc.display.length > 70 ? "..." : ""}`,
          ),
          "(cosine similarity, tf-idf over real project + capability text)",
          ...(results[0].doc.kind === "project" ? [`try: open ${results[0].doc.label}`] : []),
        ],
        ok: true,
      };
    }
    case "status":
      return {
        output: [`build: ${buildStatus.percent}% — ${buildStatus.detail}`, "nia: online", "sound: see toggle in status bar"],
        ok: true,
      };
    case "open": {
      const match = projects.find((p) => p.name.toLowerCase().includes(arg));
      if (match?.href) {
        window.open(match.href, "_blank", "noopener,noreferrer");
        setSystemStatus("launching");
        setTimeout(() => setSystemStatus("ready"), 900);
        return { output: [`opening ${match.name}...`], ok: true };
      }
      return { output: [`open: no project matching "${arg || "(none given)"}"`, "try: cat projects"], ok: false };
    }
    case "theme": {
      const next = getTheme() === "dark" ? "light" : "dark";
      setTheme(next);
      return { output: [`theme: ${next}`], ok: true };
    }
    case "contact":
      return { output: [profile.email, `${profile.location.label} (${profile.location.tz})`], ok: true };
    case "clear":
      return { output: [], ok: true, cleared: true };
    case "sudo":
      return {
        output: arg ? [`sudo: ${arg}: nice try — this terminal has no root`] : ["sudo: usage: sudo <command>"],
        ok: false,
      };
    case "matrix":
      return { output: ["wake up, visitor...", "the portfolio has you."], ok: true };
    default:
      // Should be unreachable if the caller already checked TERMINAL_VERBS
      // first, but a real fallback beats a silent crash if it isn't.
      return { output: [`command not found: ${command}`, "type help for a list of commands"], ok: false };
  }
}
