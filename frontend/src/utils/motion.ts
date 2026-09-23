import { type Variants, type Transition } from 'framer-motion';

/**
 * Centralized Motion Design Tokens
 * Styled after Linear, Stripe, Raycast & Vercel micro-interactions
 */

// Precise Cubic Bezier Curves
export const snappyEase: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const smoothEase: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

// Reusable Spring Presets
export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 450,
  damping: 32,
  mass: 0.8,
};

export const springSmooth: Transition = {
  type: 'spring',
  stiffness: 320,
  damping: 28,
};

// Standard Duration Transitions
export const snappyTransition: Transition = {
  duration: 0.22,
  ease: snappyEase,
};

export const drawerTransition: Transition = {
  duration: 0.28,
  ease: snappyEase,
};

export const modalTransition: Transition = {
  duration: 0.2,
  ease: snappyEase,
};

// Reusable Motion Variants
export const fadeSlideUp: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: snappyTransition,
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.16, ease: snappyEase },
  },
};

export const fadeSlideDown: Variants = {
  initial: { opacity: 0, y: -8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: snappyTransition,
  },
  exit: {
    opacity: 0,
    y: 6,
    transition: { duration: 0.16, ease: snappyEase },
  },
};

export const fadeSlideInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: drawerTransition,
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2, ease: snappyEase },
  },
};

export const fadeSlideInLeft: Variants = {
  initial: { opacity: 0, x: -16 },
  animate: {
    opacity: 1,
    x: 0,
    transition: snappyTransition,
  },
  exit: {
    opacity: 0,
    x: -16,
    transition: { duration: 0.18, ease: snappyEase },
  },
};

export const popOver: Variants = {
  initial: { opacity: 0, scale: 0.97 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: modalTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: { duration: 0.15, ease: snappyEase },
  },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.18, ease: snappyEase },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.14, ease: snappyEase },
  },
};

export const createStaggerContainer = (
  staggerChildren = 0.03,
  delayChildren = 0.02
): Variants => ({
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.02,
      staggerDirection: -1,
    },
  },
});

export const staggerContainer = createStaggerContainer(0.035, 0.03);

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: snappyEase },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.14, ease: snappyEase },
  },
};

export const accordionVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    overflow: 'hidden',
    transition: { duration: 0.2, ease: snappyEase },
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    overflow: 'visible',
    transition: { duration: 0.25, ease: snappyEase },
  },
};
