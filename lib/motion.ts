import type { Variants } from "framer-motion";

// Shared framer-motion variants. Plain serializable objects so they can be
// passed as props from server components into client `motion.*` components.

export const listContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

export const listItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

// Shared `viewport` prop for scroll-triggered (`whileInView`) reveals —
// fires once, as soon as a small slice of the element is visible. Uses
// `amount` (a plain 0-1 fraction) rather than `margin`, whose negative-value
// sign convention is easy to get backwards and, combined with `once`, can
// end up resolving true before the element is ever actually in view.
export const revealOnce = { once: true, amount: 0.1 };
