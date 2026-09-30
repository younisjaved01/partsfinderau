import type { Variants } from 'motion/react';

/**
 * Shared Motion variants for PARTS IQ. Subtle, fast, transform/opacity-only
 * (GPU-friendly). Global reduced-motion is handled by <MotionConfig
 * reducedMotion="user"> in main.tsx, which strips transforms for users who ask
 * for reduced motion while keeping gentle opacity — so these are safe to reuse.
 */

export const EASE = [0.22, 1, 0.36, 1] as const;

/** Simple crossfade. */
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.22, ease: EASE } },
  exit: { opacity: 0, transition: { duration: 0.14 } },
};

/** Panel content swap — opacity + small vertical move, dimensions stay stable. */
export const panelVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.24, ease: EASE } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15, ease: EASE } },
};

/**
 * Result-row entry. Uses `custom={index}` for a capped stagger so the list
 * stays fast even with many rows (only the first ~12 are delayed).
 */
export const rowVariants: Variants = {
  hidden: { opacity: 0, y: 4 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: Math.min(i, 12) * 0.02, duration: 0.2, ease: EASE },
  }),
};

/** Expand / collapse for nav sub-groups (height animated only on a short list). */
export const collapseVariants: Variants = {
  hidden: { height: 0, opacity: 0 },
  show: {
    height: 'auto',
    opacity: 1,
    transition: { height: { duration: 0.2, ease: EASE }, opacity: { duration: 0.18 } },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { height: { duration: 0.16, ease: EASE }, opacity: { duration: 0.1 } },
  },
};

/** Standard press feedback for primary controls. */
export const tapScale = { scale: 0.97 };
export const hoverLift = { y: -1 };
