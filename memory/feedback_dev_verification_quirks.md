---
name: feedback-dev-verification-quirks
description: Tooling quirks discovered while verifying this Next.js dev site in the Claude Browser pane
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 8afaa3c1-5e61-4cf0-9314-69251c18e634
  modified: 2026-08-28T14:18:42.168Z
---

Two real gotchas hit repeatedly while building/verifying this project — not user feedback exactly, but worth not rediscovering:

**Screenshot round-trip timing is unreliable in this environment, especially right after navigate/reload.** A `computer` screenshot taken immediately after `navigate` or a JS `location.reload()` frequently captures a stale or mid-transition frame — sometimes the OLD page, sometimes a half-rendered new one. This bit verification of the BootIntro animation (~1-2s duration) many times: single-attempt screenshots kept missing the window entirely. The reliable fix is to *temporarily* multiply the relevant duration constant by 5-10x (e.g. `VISIBLE_MS = 1650` → `8000` or `20000`), reload, screenshot (retry once or twice if still stale), confirm the visual/logic is correct, then revert the constant to its real value. Don't conclude something is broken from one missed screenshot — confirm with the extended-duration trick before touching the code.

**`npm run build 2>&1 | tail -N` masks the real exit code.** Piping through `tail` means the reported exit status reflects `tail` (always 0), not the build. Happened once: a build had a genuine TypeScript error but was reported as "exited with code 0" because of the pipe, and it was almost taken as a clean pass. Always read the actual output content for `error`/`Failed to type check`, don't trust a piped command's reported exit code alone — or avoid piping through `tail` for correctness-critical checks.

**How to apply:** for any future animation/timing verification in this project (or similar Next.js + Claude Browser pane setups), use the extended-duration trick from the start rather than after several failed attempts. For build/lint checks, read the file content, not just the exit code, when the command was piped.
