"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { nav, profile, projects, posts, capabilities, buildStatus } from "@/lib/content";
import { playCommandBlip, playErrorTone, playGlitch } from "@/lib/sound";
import { triggerGlitch } from "@/lib/eventGlitch";
import { notifyNia } from "@/lib/niaReaction";
import { setSystemStatus } from "@/lib/systemStatus";
import { getTheme, setTheme } from "@/lib/theme";
import styles from "./CommandLine.module.css";

type Entry = { command: string; output: string[] };

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

const HELP_LINES = [
  "available commands:",
  "  help              show this list",
  "  whoami            about " + profile.name,
  "  ls                list sections",
  "  cd <section>      navigate (about, work, writing, contact)",
  "  cat projects      list work",
  "  cat posts         list writing",
  "  skills            list capability categories",
  "  status            build/system status",
  "  open <project>    open a project's repo in a new tab",
  "  theme             toggle dark/light",
  "  contact           show contact info",
  "  clear             clear this terminal",
];

export default function CommandLine() {
  const router = useRouter();
  const [history, setHistory] = useState<Entry[]>([]);
  const [value, setValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [history]);

  function run(raw: string) {
    const trimmed = raw.trim();
    const [cmd, ...rest] = trimmed.split(/\s+/);
    const arg = rest.join(" ").toLowerCase();
    const command = (cmd ?? "").toLowerCase();

    if (command === "") return;

    if (command === "clear") {
      playCommandBlip();
      triggerGlitch();
      playGlitch();
      notifyNia("success");
      setHistory([]);
      return;
    }

    // Sound is decided by the actual outcome below, not fired blind up
    // front — a recognized, successful command gets the confirmation blip,
    // anything that failed (bad cd target, missing file, unknown command)
    // gets the same error tone as the rest of the site, not a generic beep.
    let output: string[];
    let ok = true;
    switch (command) {
      case "help":
        output = HELP_LINES;
        break;
      case "whoami":
        output = [`${profile.name} ${profile.tagline}`, ...profile.bio];
        break;
      case "ls":
        output = nav.map((item) => `${item.code}  ${item.label}`);
        break;
      case "cd": {
        const target = ROUTE_ALIASES[arg];
        if (target) {
          router.push(target);
          output = [`navigating to ${arg || "home"}...`];
        } else {
          output = [`cd: no such section: ${arg || "(none given)"}`, "try: ls"];
          ok = false;
        }
        break;
      }
      case "cat":
        if (arg === "projects") {
          output = projects.map((p) => `${p.name} — ${p.description}`);
        } else if (arg === "posts") {
          output = posts.map((p) => `${p.date}  ${p.title}`);
        } else {
          output = [`cat: ${arg || "(no file)"}: no such file`];
          ok = false;
        }
        break;
      case "skills":
      case "capabilities":
        output = capabilities.map((c) => `${c.category}: ${c.items.join(", ")}`);
        break;
      case "status":
        output = [`build: ${buildStatus.percent}% — ${buildStatus.detail}`, "nia: online", "sound: see toggle in status bar"];
        break;
      case "open": {
        // Substring match against the real project list — no fabricated
        // project names, and no silent no-op: an unmatched query says so.
        const match = projects.find((p) => p.name.toLowerCase().includes(arg));
        if (match?.href) {
          window.open(match.href, "_blank", "noopener,noreferrer");
          // Opens in a new tab — this tab never navigates away, so unlike
          // CreationsList's own launch beat, the status has to be reset
          // back manually rather than the page unload making it moot.
          setSystemStatus("launching");
          setTimeout(() => setSystemStatus("ready"), 900);
          output = [`opening ${match.name}...`];
        } else {
          output = [`open: no project matching "${arg || "(none given)"}"`, "try: cat projects"];
          ok = false;
        }
        break;
      }
      case "theme": {
        const next = getTheme() === "dark" ? "light" : "dark";
        setTheme(next);
        output = [`theme: ${next}`];
        break;
      }
      case "contact":
        output = [profile.email, `${profile.location.label} (${profile.location.tz})`];
        break;
      // Two small, contained discoveries — neither invents a new command
      // surface, both resolve into the terminal's own existing output
      // format so they read as a natural (if playful) part of the system,
      // not a bolted-on gimmick.
      case "sudo":
        output = arg ? [`sudo: ${arg}: nice try — this terminal has no root`] : ["sudo: usage: sudo <command>"];
        ok = false;
        break;
      case "matrix":
        output = ["wake up, visitor...", "the portfolio has you."];
        break;
      default:
        output = [`command not found: ${command}`, "type help for a list of commands"];
        ok = false;
    }

    if (ok) playCommandBlip();
    else playErrorTone();
    // Fires for either outcome — the glitch marks "a command just
    // completed," not success specifically; success/failure is already
    // distinguished by which sound played above. playGlitch() is the
    // sonic counterpart to triggerGlitch()'s visual burst, paired here at
    // the call site rather than baked into the glitch mechanism itself.
    triggerGlitch();
    playGlitch();
    notifyNia(ok ? "success" : "error");
    setHistory((h) => [...h, { command: trimmed, output }]);
  }

  return (
    <div className={styles.wrap} onClick={() => inputRef.current?.focus()}>
      {history.length > 0 && (
        <div className={styles.scrollback} ref={scrollRef}>
          {history.map((entry, i) => (
            <div key={i} className={styles.entry}>
              <p className={styles.echo}>
                <span className={styles.chevron}>{"›"}</span> {entry.command}
              </p>
              {entry.output.map((line, j) => (
                <p key={j} className={styles.output}>
                  {line}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
      <form
        className={styles.line}
        onSubmit={(e) => {
          e.preventDefault();
          run(value);
          setValue("");
        }}
      >
        <span className={styles.chevron}>{"›"}</span>
        <input
          ref={inputRef}
          className={styles.input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              run(value);
              setValue("");
            }
          }}
          placeholder="type help"
          autoComplete="off"
          spellCheck={false}
          aria-label="Terminal command input"
        />
      </form>
    </div>
  );
}
