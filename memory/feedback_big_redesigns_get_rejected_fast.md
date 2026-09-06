---
name: feedback-big-redesigns-get-rejected-fast
description: "A full-site visual identity pivot was built, verified, and shipped, then rejected in one line the moment the user saw it live — don't assume a big visual swing is wanted just because it was asked for"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 8afaa3c1-5e61-4cf0-9314-69251c18e634
  modified: 2026-09-06T22:18:49.396Z
---

Asked for a full identity pivot on the portfolio (terminal aesthetic → dark cinematic/glassmorphism, modeled on a reference site). Planned it properly (EnterPlanMode, explicit scope, content-mapping table, approved before writing code), built it, fixed two real bugs found during verification, shipped it — then the very next message was "looks shit, revert my site back." No specifics, no negotiation, just revert. Fully reverted via `git revert` (see [[project-portfolio-overview]]).

**Why this matters:** a user explicitly asking for a big visual swing, and even approving a detailed plan for it, is not the same as having actually pictured the result and wanting it. Planning rigor and technical correctness don't protect against "I don't like how this looks" — that's a purely aesthetic judgment call that can't be de-risked by process. The revert request came with zero specifics (not "the colors are wrong" or "keep X, change Y") — a flat rejection of the whole direction, not a note to iterate on.

**How to apply:** for a full-site or full-page visual identity change (not a component tweak), even after the user has explicitly asked for it and approved a plan:
- Consider proposing a single-section mockup first (e.g. "let me build just the hero in this style so you can see it before I redo the whole site") rather than defaulting straight to the full build, especially when the request names a reference site/aesthetic wholesale rather than a specific, narrow change.
- If it does ship and gets rejected outright with no specifics, don't ask "what didn't you like" as a blocker before reverting — revert first (that's the actual ask), then ask if they want to talk about what to try next.
- Don't take a past approval (even a detailed, planned one) as license to attempt something similar again unprompted — see [[project-portfolio-overview]]'s explicit note not to drift toward this direction again without being asked.
