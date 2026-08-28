"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { nav, profile, projects, posts } from "@/lib/content";
import { playCommandBlip } from "@/lib/sound";
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
  "  cd <section>      navigate (about, creations, reflections, contact)",
  "  cat projects      list creations",
  "  cat posts         list reflections",
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

    playCommandBlip();

    if (command === "clear") {
      setHistory([]);
      return;
    }

    let output: string[];
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
        }
        break;
      case "contact":
        output = [profile.email, `${profile.location.label} (${profile.location.tz})`];
        break;
      default:
        output = [`command not found: ${command}`, "type help for a list of commands"];
    }

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
