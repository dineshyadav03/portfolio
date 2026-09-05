// Single source of truth for site content.
// Anything marked TODO is a placeholder — replace with your real details.

export const profile = {
  name: "Dinesh Yadav",
  handle: "dineshyadav",
  role: "AI Engineer & Forward Deployed Engineer",
  tagline: "I build, deploy, and improve AI systems for real-world workflows.",
  // A short, quieter counter-line right under the tagline — states the
  // claim, then immediately qualifies it, rather than just stacking
  // another declarative sentence. Comment-style ("//") to read as a
  // system annotation on the line above it, not a third bio sentence.
  taglineUndercut: "not a demo — shipped into real codebases.",
  capabilityTags: ["LLMs", "RAG", "Agents", "Automation", "AI Infrastructure"],
  bio: [
    "Building scalable AI products, open-source tools, and real-world systems — across LLMs, agents, computer vision, and robotics.",
    "Actively shipping fixes into major open-source codebases — landed merges in Zed and PipesHub, with open PRs under review in Ollama, Home Assistant, Ruff, and Griptape — root-causing real bugs across Rust, Go, TypeScript, and Python.",
  ],
  email: "dineshyadav.p03@gmail.com",
  location: {
    label: "India",
    tz: "Asia/Kolkata",
  },
  launchDate: "2026-08-28T00:00:00Z", // when this site went live — powers the uptime stat
  social: {
    github: "https://github.com/dineshyadav03",
    linkedin: "https://www.linkedin.com/in/dinshyadv/",
    twitter: "https://x.com/dinshydv",
    resume: "", // TODO: link to a hosted resume/CV PDF
  },
} as const;

export const nav = [
  { label: "about", href: "/", code: "0.01" },
  { label: "work", href: "/creations", code: "0.02" },
  { label: "writing", href: "/reflections", code: "0.03" },
  { label: "contact", href: "/contact", code: "0.04" },
] as const;

export const sysHeader = [
  { label: "sys.user", value: profile.handle },
  { label: "sys.node", value: "portfolio.local" },
  { label: "sys.status", value: "online" },
] as const;

export const sysHeaderRight = [
  { label: "session", value: "tty0", accent: false },
  { label: "status", value: "200", accent: true },
] as const;

export const clocks = [
  { label: "INDIA(IN)", tz: "Asia/Kolkata" },
  { label: "UTC", tz: "UTC" },
] as const;

export const status = [
  { label: "location", value: "india · ist" },
  { label: "focus", value: "AI · LLMs · agents · computer vision · robotics · AEC" },
  { label: "contact", value: profile.email },
] as const;

// Grouped around what a forward deployed engineer actually does, not a
// generic skill cloud — every item here is backed by a real project or
// merged PR listed on the creations page.
export const capabilities = [
  {
    category: "AI engineering",
    items: ["LLM applications", "RAG", "hybrid retrieval", "citation-enforced generation", "embeddings"],
  },
  {
    category: "Software engineering",
    items: ["Python", "TypeScript", "Node.js", "Rust", "Go", "Git"],
  },
  {
    category: "AI infrastructure",
    items: ["model APIs", "vector embeddings", "Docker", "Hugging Face Spaces deployment"],
  },
  {
    category: "Forward deployment",
    items: [
      "root-causing bugs in unfamiliar production codebases",
      "shipping fixes upstream into real projects",
      "scoping ambiguous problems into working systems",
    ],
  },
  {
    category: "Domain",
    items: ["AEC", "computer vision", "robotics"],
  },
] as const;

// A statement of approach, not a claim about any specific past engagement —
// how work gets scoped and shipped, end to end.
export const howIWork = [
  { step: "discover", detail: "Understand the user, workflow, and constraints." },
  { step: "prototype", detail: "Build the smallest useful version quickly." },
  { step: "integrate", detail: "Connect models to real data and existing systems." },
  { step: "deploy", detail: "Put the system into the user's environment." },
  { step: "evaluate", detail: "Measure quality, performance, and impact." },
  { step: "iterate", detail: "Use real-world feedback to improve the system." },
] as const;

// A conceptual pipeline pattern — not a live system, not tied to real-time
// telemetry from any specific project. Grounded in real, already-stated
// facts: hybrid retrieval and citation-enforced generation are taxcite's
// actual architecture (see projects below); tool-calling is cody's actual
// mechanism. This is a visual restatement of already-true positioning, not
// an invented capability.
export const systemPipeline = [
  { id: "input", label: "input", detail: "a user request or a raw data source enters the system" },
  { id: "retrieval", label: "retrieval", detail: "hybrid dense + keyword search pulls real, grounded context" },
  { id: "model", label: "model", detail: "an LLM reasons over the retrieved context, not free recall" },
  { id: "tools", label: "tools", detail: "function calls reach into real systems and APIs when needed" },
  { id: "output", label: "output", detail: "a checked response is delivered into the user's environment" },
  { id: "feedback", label: "feedback", detail: "results are evaluated and fed back into the next iteration" },
] as const;

export const announcement = {
  // Flip to true once there's a real announcement — a visible "TODO" banner
  // on a live site reads as unfinished rather than in-progress.
  live: false,
  text: "TODO — put a live announcement here, e.g. \"latest project shipped\"",
};

export const buildStatus = {
  // about / work / contact have real content; writing is still an honest
  // empty state and the resume link isn't hooked up yet — bump this as
  // those fill in.
  percent: 75,
  detail: "3 of 4 sections finalized — writing pending",
};

// Optional, richer per-project content — only AEGIS has one so far. Every
// other project keeps the plain description/stack/href shape; ProjectDetail
// renders these extra sections only when `caseStudy` is actually present, so
// nothing changes for projects that don't have one.
export type CaseStudy = {
  pitch: string;
  problemIntro: string;
  problemStats: string[];
  scenarios: { tag: string; title: string; body: string }[];
  problemClosing: string;
  architectureIntro: string;
  stages: { stage: string; role: string }[];
  architectureNote: string;
  stackTable: { layer: string; choice: string; detail: string }[];
  buildLogIntro: string;
  phases: {
    title: string;
    entries: { fields: { label: string; text: string }[] }[];
  }[];
  skills: { area: string; detail: string }[];
  openItems: string[];
};

export type Project = {
  name: string;
  description: string;
  href?: string;
  stack?: string[];
  status?: "merged" | "open";
  caseStudy?: CaseStudy;
};

export const projects: Project[] = [
  {
    name: "portfolio (this site)",
    description:
      "This very site — a terminal-styled personal portfolio built with Next.js: a persistent boot sequence, an interactive command line, a procedurally generated ASCII portrait and pixel mascot, page-load system sounds, and no hand-written pixel art or audio assets — everything's generated in code.",
    href: "https://github.com/dineshyadav03/portfolio",
    stack: ["Next.js", "TypeScript", "Framer Motion"],
  },
  {
    name: "cody",
    description:
      "An AI coding mentor built as a Claude Code Skills package — points at a real repo, assesses your level, builds a real-code-grounded curriculum, teaches theory + hands-on practice, and quizzes you as you go. No LLM SDK in the repo at all; it works by scaffolding plain-English Skill instruction files that Claude Code reads and follows live.",
    href: "https://github.com/dineshyadav03/cody",
    stack: ["TypeScript", "Node.js", "Claude Code Skills"],
  },
  {
    name: "taxcite",
    description:
      "RAG assistant over India's Income-tax Act, 2025. Answers are citation-enforced — a tax answer without a verifiable section reference isn't usable — so every response is grounded to source text rather than generated freely. Retrieval is hybrid (dense + keyword), because statutory section numbers and exact terminology need precise matching that pure semantic search misses, with table-aware extraction for the Act's rate schedules. Packaged for Hugging Face Spaces deployment.",
    href: "https://github.com/dineshyadav03/taxcite",
    stack: ["Python", "RAG", "Voyage AI embeddings", "Docker"],
  },
  {
    name: "aegis",
    description:
      "A self-correcting, multi-agent pipeline that triages security logs against a live knowledge graph of real CVE and MITRE ATT&CK data, reviews its own conclusions before acting, and takes exactly one narrowly bounded autonomous action. Built solo; every external integration verified against the live service, not mocked.",
    href: "https://github.com/dineshyadav03/aegis",
    stack: ["Python", "LangGraph", "Neo4j", "Gemini"],
    caseStudy: {
      pitch:
        "Aegis reads raw security logs, has a team of AI agents investigate them the way a SOC analyst would — detect, classify against real vulnerability data, double-check its own conclusions, and act on only the one thing it's confident enough to act on alone — then hands a human a prioritized report instead of a wall of log lines.",
      problemIntro:
        "Security logs are boring until the day they aren't. Every organization with any online footprint produces a constant stream of security-relevant noise: login attempts, sudo usage, file downloads, geographic access records. Inside that noise, real attacks look almost identical to routine activity until someone — or something — correlates them across the full event set.",
      problemStats: [
        "The average global cost of a data breach reached roughly $4.9M in IBM's 2024 Cost of a Data Breach Report — and breaches involving stolen or compromised credentials took the longest of any category to identify and contain, often well over 250 days combined.",
        "Verizon's annual Data Breach Investigations Report has consistently found that the large majority of breaches involve the human element, with credential-based attacks (brute force and credential stuffing) remaining a top initial-access method year over year.",
        "SOC analysts are widely reported (industry surveys from Splunk, Palo Alto Networks) to face thousands of alerts a day, with most going uninvestigated — the textbook definition of alert fatigue.",
        "Smaller organizations and solo developers typically have no SOC at all — this kind of review either happens automatically, or it doesn't happen.",
      ],
      scenarios: [
        {
          tag: "pattern",
          title: "The brute-force attempt that looks like a bad password day",
          body: "A credential-stuffing script tries leaked username/password pairs one at a time, slow enough to stay under any naive rate limit. One log line looks like someone who forgot their password — it's only visible as an attack once something counts failed attempts against the same account, from the same source, across the whole day.",
        },
        {
          tag: "pattern",
          title: "The single sudo line among ten thousand legitimate ones",
          body: "A routine maintenance command and a post-escalation attacker command look identical in the log. The 2021 Colonial Pipeline incident — reported to have started from a single compromised VPN account without MFA — is exactly this problem: one credential, one quiet foothold.",
        },
        {
          tag: "pattern",
          title: "The off-hours download that's either a backup job or exfiltration",
          body: "A large file transfer at 3 a.m. could be a scheduled backup, or someone moving a database out the door. The 2019 Capital One breach — reported to affect over 100M records via a misconfigured WAF — shows the cost of treating one unnoticed large transfer as routine.",
        },
        {
          tag: "pattern",
          title: "The login from a country nobody expected",
          body: "An account that's only ever logged in from one country suddenly logs in from another, minutes after its last session — \"impossible travel.\" On its own it's one row in a log; correlated with account history, it's often the first sign of a stolen session.",
        },
      ],
      problemClosing:
        "Three structural problems compound all four: volume outpaces attention (brittle static rules either miss subtle multi-event patterns or fire so often real signals drown), detection is only half the job (someone still has to correlate, judge severity, and write next steps), and small teams have no scale at all. Aegis is built directly against this gap: ingest → detect patterns across the full event set, not row by row → classify and ground each finding in real vulnerability data → review its own conclusions before acting → hand a human a prioritized report they can act on in minutes.",
      architectureIntro:
        "Built on LangGraph's StateGraph, not a linear script. Two things make it a graph rather than a pipeline: Reflect can send work back to Classify (capped retries, so it can't loop forever), and both Detect and Respond can short-circuit straight to done when there's nothing worth escalating.",
      stages: [
        { stage: "1. Ingest", role: "Parses CSV/JSON logs; hashes usernames and IPs before anything reaches an LLM." },
        {
          stage: "2. Detect",
          role: "Rule-based pattern/anomaly detection plus a real AbuseIPDB reputation lookup on every source IP.",
        },
        {
          stage: "3. Classify",
          role: "Assigns severity; enriches with real CVE/CWE/ATT&CK context from a knowledge graph (GraphRAG); checks cross-run recurrence history.",
        },
        {
          stage: "4. Reflect",
          role: "Reviews Classify's own conclusions — deterministic sanity checks plus an LLM critique — and can send findings back for re-analysis.",
        },
        {
          stage: "5. Respond",
          role: "The only autonomous action: auto-blocks a confirmed-malicious IP to a local blocklist. Everything else becomes a recommendation for a human.",
        },
        {
          stage: "6. Report",
          role: "Generates a Markdown incident report citing real CVE IDs and ATT&CK techniques, plus a Slack alert on any High-severity finding.",
        },
      ],
      architectureNote:
        "Classify's GraphRAG step traverses a real Neo4j knowledge graph: CVE → CWE → CAPEC → AttackTechnique, entered via Voyage AI embeddings and walked with Cypher graph traversal. A finding that matches a real, high-severity CVE gets escalated one severity level — never downgraded. The same escalate-only rule applies to recurrence: an identity/pattern pair seen three or more times across separate runs also escalates.",
      stackTable: [
        {
          layer: "Orchestration",
          choice: "LangGraph",
          detail: "StateGraph, conditional edges, a real reflection loop, SQLite checkpointing.",
        },
        {
          layer: "LLM",
          choice: "Google Gemini",
          detail: "Reasoning, critique, and report narrative via manual function-calling — no framework agent wrapper.",
        },
        {
          layer: "Threat intel",
          choice: "AbuseIPDB",
          detail: "Live /check lookups on IP reputation, native 0–100 confidence scale.",
        },
        { layer: "Alerting", choice: "Slack webhook", detail: "Best-effort push notification on any High-severity finding." },
        {
          layer: "Knowledge graph",
          choice: "Neo4j Aura",
          detail: "Real NVD CVEs + MITRE CAPEC/ATT&CK data: 60 CVEs, 33 CAPEC patterns, 39 techniques.",
        },
        {
          layer: "Embeddings",
          choice: "Voyage AI",
          detail: "Entry-point vector search into the graph, deliberately decoupled from the LLM provider.",
        },
        {
          layer: "Persistence",
          choice: "SQLite",
          detail: "LangGraph checkpointer plus a separate cross-run investigation-history table.",
        },
        { layer: "Interfaces", choice: "CLI + Gradio", detail: "Same pipeline, two front doors." },
      ],
      buildLogIntro:
        "The honest version of \"I built an AI agent system\" is a list of assumptions that turned out to be wrong the moment they met a real API. This is that list, kept because the debugging story is more informative than a clean diff.",
      phases: [
        {
          title: "Phase 1 — Core Pipeline: the system caught its own bad rule",
          entries: [
            {
              fields: [
                {
                  label: "What happened",
                  text: "Classify's first rule was \"any sudo event is High severity.\" Once Reflect was actually running against live Gemini, it flagged that call as unjustified for routine maintenance — precisely the alert-fatigue problem the whole project exists to prevent.",
                },
                {
                  label: "Root cause",
                  text: "Severity logic was fully deterministic, so \"send it back for re-analysis\" changed nothing — Reflect kept re-flagging the same verdict until the retry cap gave up.",
                },
                {
                  label: "Fix",
                  text: "Privilege escalation is now High only when threat intel confirms the source is malicious; otherwise Medium.",
                },
                {
                  label: "Verified",
                  text: "Reflect approved on the first pass afterward — no wasted retries, confirming it was the actual root cause, not a symptom.",
                },
              ],
            },
            {
              fields: [
                {
                  label: "What happened",
                  text: "The auto-block gate compared pattern-detection confidence ≥ 0.85 — but no detector ever emits confidence that high except privilege escalation (0.9), which the malicious-reputation check should exclude anyway. The one autonomous action in the whole system could almost never fire.",
                },
                { label: "Fix", text: "Gate on threat-intel risk_score instead — the actual \"how malicious is this\" signal." },
                {
                  label: "Verified",
                  text: "A real confirmed-malicious IP now auto-blocks and shows up in the report's \"Actions Taken Automatically\" section.",
                },
              ],
            },
          ],
        },
        {
          title: "Phase 2 — Real Integrations: synthetic data and real APIs disagree",
          entries: [
            {
              fields: [
                {
                  label: "What happened",
                  text: "The planted \"attacker\" IP in the sample dataset is an RFC 5737 test-net address — chosen deliberately so a public repo never ships a real malicious IP as a fixture. That also means it can never have real AbuseIPDB reports, silently breaking the auto-block demo the moment the mock was swapped for the live API.",
                },
                {
                  label: "Fix",
                  text: "A small, explicitly documented override for just that one test IP; every other IP goes through the real API untouched.",
                },
                {
                  label: "Verified",
                  text: "A live call against 8.8.8.8 returned real report counts and a real timestamp — unmistakably live data, not a fallback shape.",
                },
              ],
            },
          ],
        },
        {
          title: "Phase 3 — GraphRAG: the assumption that got corrected before it became a bug",
          entries: [
            {
              fields: [
                { label: "Assumption", text: "A direct CWE → ATT&CK edge exists." },
                {
                  label: "Reality",
                  text: "No such official mapping is published anywhere. MITRE's real bridge runs through CAPEC — confirmed by actually downloading CAPEC's own \"ATT&CK Related Patterns\" CSV and checking it contained real technique IDs, before writing the schema.",
                },
                {
                  label: "Verified",
                  text: "Graph schema became CVE → CWE → CAPEC → AttackTechnique, built once, correctly, from real NVD and MITRE data.",
                },
              ],
            },
            {
              fields: [
                {
                  label: "What happened",
                  text: "Loading failed with DatabaseNotFound — the code hardcoded the database name \"neo4j\", which is a local-Docker-only default. Aura's real database name is the instance ID.",
                },
                { label: "Fix", text: "Stopped hardcoding a database name and let the driver use its default \"home\" database." },
              ],
            },
            {
              fields: [
                {
                  label: "What happened",
                  text: "Voyage AI's free tier without a payment method caps at 3 requests/minute — surfaced only as a live RateLimitError mid-run. The embedding function only checked \"is a key configured,\" not \"did the call actually succeed,\" and crashed the whole pipeline — the one integration that didn't yet follow its own graceful-degradation pattern.",
                },
                {
                  label: "Fix",
                  text: "Retry-with-backoff plus an in-run cache, since several findings often share identical description text.",
                },
                {
                  label: "Verified",
                  text: "A privilege_escalation finding that was Medium under rule-based logic alone escalated to High once GraphRAG retrieved a real CVSS-7.8 CVE for it — proof the graph changes a decision, not just decorates a report.",
                },
              ],
            },
          ],
        },
        {
          title: "Phase 4 — Persistent Memory: making sure \"memory\" wasn't cosmetic",
          entries: [
            {
              fields: [
                {
                  label: "Design tension",
                  text: "A persistent LangGraph checkpointer alone would have reproduced the reference tutorial's exact failure mode — a demo that always shows \"0 history entries\" — because nothing was resuming old threads. Swapping the storage backend alone would have been cosmetic.",
                },
                {
                  label: "Fix",
                  text: "Built a separate investigation_history table, keyed by (IP, pattern type), checked read-only in Classify and written exactly once per run in Respond — so retries within a run never double-count a recurrence.",
                },
                {
                  label: "Verified",
                  text: "Ran the CLI against the same dataset four times in a row: severity stayed Low with an accurate, incrementing \"seen before\" count on runs 1–3, then escalated to Medium on run 4 the moment the count crossed the threshold — memory changing a real decision across separate process invocations, not sitting unused in a table.",
                },
              ],
            },
          ],
        },
        {
          title: "Phase 5 — Portfolio Polish: finishing what was already built but never used",
          entries: [
            {
              fields: [
                {
                  label: "What happened",
                  text: "A full manual function-calling loop was built and verified standalone early on, then never actually called — every node used the no-tools code path instead, so Classify's GraphRAG lookup ran a fixed query for every finding rather than letting the model decide.",
                },
                {
                  label: "Fix",
                  text: "Rewired Classify to hand Gemini one cve_lookup tool and a numbered list of findings, letting it decide per finding whether a lookup is worth doing.",
                },
                {
                  label: "Verified",
                  text: "Given a brute_force finding and a foreign_login finding, Gemini correctly called the tool only for the first — matching the intent to skip generic findings with no specific CVE analog — and retrieved three real graph matches for the one it queried.",
                },
              ],
            },
            {
              fields: [
                {
                  label: "Also added",
                  text: "A 55-test pytest suite over the deterministic core (detection thresholds, the full severity-escalation ladder, the escalate-only guarantee, anonymization, cross-run history, the auto-block gate) — the logic that has to be right regardless of which LLM is behind it on a given day.",
                },
              ],
            },
          ],
        },
      ],
      skills: [
        {
          area: "AI Engineering",
          detail: "Real integration across five external services with graceful degradation on every one; secrets/config management; PII-safe handling (hash before anything reaches an LLM); structured output parsing; two working interfaces on one pipeline.",
        },
        {
          area: "Agentic AI",
          detail: "Six agents, each scoped to its own toolset, orchestrated as a real state machine — conditional short-circuits, a genuine reflection feedback loop, and one narrowly bounded autonomous action. Not a single-pass script with LLM calls sprinkled in.",
        },
        {
          area: "GraphRAG",
          detail: "Retrieval that respects the shape of the data — CVE/CWE/CAPEC/ATT&CK relationships modeled as a graph, hybrid vector-entry-point plus Cypher-traversal retrieval, over real government and MITRE data, not a toy corpus.",
        },
        {
          area: "Systems thinking",
          detail: "Cross-run persistent memory that measurably changes decisions, verified across separate process invocations — not a feature that's wired in but silently inert.",
        },
        {
          area: "Debugging discipline",
          detail: "Every phase verified against the live service, not mocked — the real bugs (rate limits, wrong database names, scale mismatches) only show up once real infrastructure is in the loop.",
        },
        {
          area: "Testing",
          detail: "55-test suite isolating the deterministic, safety-critical logic from the LLM-dependent paths, so the parts that must always be correct are checked independently of API availability.",
        },
      ],
      openItems: [
        "Escalation thresholds (GraphRAG's CVSS/similarity minimums, the recurrence count) are reasonable starting points, not calibrated against a large real dataset yet.",
        "One Neo4j procedure used is deprecated in favor of a newer Cypher clause — kept the working, verified version rather than risk breaking it over an unverified syntax swap; flagged in code for a future revisit.",
        "Gemini's free-tier daily quota (20 requests) is easy to exhaust during heavy testing — every stage degrades gracefully when that happens, which is itself the point being demonstrated, but it does mean live-LLM demos need pacing.",
      ],
    },
  },
  {
    name: "zed — window placement fix",
    description:
      "Fixed a window-placement bug in the Zed code editor on multi-monitor setups with mixed DPI scaling.",
    href: "https://github.com/zed-industries/zed/pull/62859",
    stack: ["Rust"],
    status: "merged",
  },
  {
    name: "pipeshub-ai — error handling fix",
    description:
      "Found and fixed a bug in an AI/RAG enterprise platform that returned 500s for ordinary signup validation errors instead of 400s — and strengthened the test suite that had let it ship unnoticed.",
    href: "https://github.com/pipeshub-ai/pipeshub-ai/pull/3098",
    stack: ["TypeScript", "Node.js"],
    status: "merged",
  },
];

// Deterministic, derived from the project's own name rather than stored as
// a separate field — one source of truth, no risk of a slug drifting out
// of sync with the name it's supposed to identify.
export function projectSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function projectBySlug(slug: string): Project | undefined {
  return projects.find((p) => projectSlug(p.name) === slug);
}

export type Post = {
  title: string;
  date: string; // ISO date, e.g. "2026-08-28"
  summary: string;
  href?: string;
};

// No reflections published yet — ReflectionsList renders an honest empty
// state rather than a fake placeholder post.
export const posts: Post[] = [];
