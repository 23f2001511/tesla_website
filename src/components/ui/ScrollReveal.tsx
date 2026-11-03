'use client';

import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';

// ── Scroll-reveal primitives for PUBLIC pages ─────────────────────────────
// One consistent pattern everywhere: fade in from the left as the element
// enters the viewport, plays once, respects prefers-reduced-motion.
// Only opacity/transform animate — layout space is reserved from the start,
// so there is no reflow / LCP impact.

const EASE = [0.22, 1, 0.36, 1] as const;

export function ScrollReveal({
  children,
  delay = 0,
  amount = 0.2,
  ...props
}: { children: React.ReactNode; delay?: number; amount?: number } & HTMLMotionProps<'div'>) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, x: -40 }}
      whileInView={reduced ? undefined : { opacity: 1, x: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.5, ease: EASE, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Staggered grids / lists — children animate one after another (~90ms apart).
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

export function StaggerGroup({
  children,
  amount = 0.15,
  ...props
}: { children: React.ReactNode; amount?: number } & HTMLMotionProps<'div'>) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : 'hidden'}
      whileInView={reduced ? undefined : 'visible'}
      viewport={{ once: true, amount }}
      variants={containerVariants}
      {...props}
    >
      {children}
    </motion.div>
  );
}

const itemVariants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.42, ease: EASE } },
};

export function StaggerItem({
  children,
  ...props
}: { children: React.ReactNode } & HTMLMotionProps<'div'>) {
  const reduced = useReducedMotion();
  if (reduced) return <div {...(props as object)}>{children}</div>;

  return (
    <motion.div variants={itemVariants} {...props}>
      {children}
    </motion.div>
  );
}

// On-mount entrance for above-the-fold (hero) content — fires immediately on
// load, no scroll trigger.
export function FadeIn({
  children,
  delay = 0,
  ...props
}: { children: React.ReactNode; delay?: number } & HTMLMotionProps<'div'>) {
  const reduced = useReducedMotion();
  if (reduced) return <div {...(props as object)}>{children}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}