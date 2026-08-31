// Nia's public-facing knowledge — deliberately separate from `lib/content.ts`
// (which drives the rendered page) and from Mascot's animation state. This
// is the "Knowledge" layer: structured, verified, public-only facts an
// intent/FAQ matcher (or, later, an LLM) can read from without touching the
// presentation layer at all.
//
// Every field here is drawn directly from lib/content.ts — nothing is
// invented. Fields with no genuinely supported answer are simply omitted
// rather than filled with a guess (see e.g. the lack of a "currently
// learning" field below).
//
// Deliberately excluded from Nia's own public knowledge, per an explicit
// content boundary for her assistant-facing surface: any mention of Design
// Technology or AEC. That's real, already-public content elsewhere on the
// site (Capabilities' "Domain" row), but Nia's own knowledge base omits it.

import { capabilities, howIWork, profile, projects } from "./content";

const EXCLUDED_DOMAIN_ITEMS = new Set(["AEC"]);

export const niaProfile = {
  name: profile.name,
  role: profile.role,
  // A pronoun-free, verb-first fragment — Nia speaks about Dinesh in third
  // person ("He builds..."), so this is composed into answers rather than
  // splicing in profile.tagline's first-person site copy ("I build...")
  // verbatim, which read as Nia claiming to *be* Dinesh.
  summary: "builds, deploys, and improves AI systems for real-world workflows",
  bio: profile.bio,
  interests: [...profile.capabilityTags],
  goals: ["build, deploy, and improve AI systems that hold up in real-world workflows"],
  // His own stated process (already public as the site's "how i work"
  // section) — real, existing content, not invented, and a genuine basis
  // for answering "what's he like" / "how would you describe him"-type
  // questions beyond just a list of interests.
  approach: howIWork.map((step) => step.detail),
  skills: capabilities.map((group) => ({
    category: group.category,
    items: group.items.filter((item) => !EXCLUDED_DOMAIN_ITEMS.has(item)),
  })),
  projects: projects.map((p) => ({
    name: p.name,
    description: p.description,
    href: p.href,
    stack: p.stack,
  })),
  contact: {
    email: profile.email,
    github: profile.social.github,
    linkedin: profile.social.linkedin,
  },
} as const;
