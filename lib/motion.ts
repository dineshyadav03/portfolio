import type { Variants } from "framer-motion";

// Shared framer-motion variants. Plain serializable objects so they can be
// passed as props from server components into client `motion.*` components.
//
// Pass 15: this is now the ONE place the site's entrance/reveal easing
// curve is defined. Before this pass, the same family of animations used
// at least four different curves across components — `[0.16,1,0.3,1]` in
// most places, framer's built-in `"easeOut"` in a few (SectionDivider,
// SystemPipeline), no `ease` at all in one spot (the hero wordmark, which
// silently fell back to framer's default), and plain CSS `ease`/`ease-out`
// keywords in module stylesheets — four subtly different "settle" feels
// doing the same job. `EASE` is the one curve every entrance/reveal
// animation in the codebase should use now; `EASE_CSS` is the identical
// curve for plain CSS `transition`s (see also `--ease-standard` in
// globals.css, which module CSS files reference directly). Continuous
// pointer/physical interaction stays on `damp()` (lib/physics.ts) — an
// exponential decay is the physically correct model there, not this curve.
export const EASE = [0.16, 1, 0.3, 1] as const;
export const EASE_CSS = "cubic-bezier(0.16, 1, 0.3, 1)";

// Three duration tiers, not five bespoke numbers per component:
// - micro: buttons, arrows, index numbers, small state flips
// - interaction: cards/nodes/visuals responding to pointer or focus
// - reveal: a section or major content group entering the viewport
export const DURATION = {
  micro: 0.18,
  interaction: 0.32,
  reveal: 0.7,
} as const;

// Pass 16: named `damp()` rates (lib/physics.ts) — the site's continuous
// physical-interaction "personalities." Kept here as a canonical reference
// table rather than forcing every component to import a shared constant
// (each value is tuned in the context of its own component and cross-
// referenced back to this table in a comment there — moving the numbers
// themselves out would disconnect the tuning from the interaction it's
// tuned for, for no real benefit). Higher lambda = snappier/lighter,
// lower = heavier/slower to settle.
export const SPRING = {
  responsive: 12, // direct pointer manipulation — CreationsList's tile tilt/depth
  soft: 5.2, // ambient presence with physical weight — SpatialObject's pointer tilt
} as const;

export const listContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

export const listItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE } },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.reveal, ease: EASE } },
};

// Shared `viewport` prop for scroll-triggered (`whileInView`) reveals —
// fires once, as soon as a small slice of the element is visible. Uses
// `amount` (a plain 0-1 fraction) rather than `margin`, whose negative-value
// sign convention is easy to get backwards and, combined with `once`, can
// end up resolving true before the element is ever actually in view.
export const revealOnce = { once: true, amount: 0.1 };
