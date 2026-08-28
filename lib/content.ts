// Single source of truth for site content.
// Anything marked TODO is a placeholder — replace with your real details.

export const profile = {
  name: "Dinesh Yadav",
  handle: "dineshyadav",
  role: "AI Engineer & Forward Deployed Engineer",
  tagline: "AI engineer & forward deployed engineer — building where models meet real deployments.",
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
  { label: "creations", href: "/creations", code: "0.02" },
  { label: "reflections", href: "/reflections", code: "0.03" },
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

export const announcement = {
  live: true,
  text: "TODO — put a live announcement here, e.g. \"latest project shipped\"",
};

export const buildStatus = {
  percent: 40, // TODO: bump this up as you replace TODO placeholders with real content
  detail: "2 of 5 sections finalized",
  eta: "TODO",
};

export type Project = {
  name: string;
  description: string;
  href?: string;
  stack?: string[];
  status?: "merged" | "open";
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
      "RAG assistant over India's Income-tax Act, 2025 — citation-enforced answers, hybrid retrieval with table-aware extraction, deployment packaged for Hugging Face Spaces.",
    href: "https://github.com/dineshyadav03/taxcite",
    stack: ["Python", "RAG", "Voyage AI embeddings", "Docker"],
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

export type Post = {
  title: string;
  date: string; // ISO date, e.g. "2026-08-28"
  summary: string;
  href?: string;
};

export const posts: Post[] = [
  {
    title: "TODO: First reflection",
    date: "2026-08-28",
    summary: "A short summary of what this piece is about.",
    href: "",
  },
];
