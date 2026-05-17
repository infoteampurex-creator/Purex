'use client';

import { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface Props {
  value: number;
  /** CSS color for the digit. */
  color?: string;
  /** Font size in px. */
  fontSize?: number;
  /** Spring stiffness — higher = faster snap. */
  stiffness?: number;
  /** Spring damping — higher = less overshoot. */
  damping?: number;
}

/**
 * Smoothly animates a numeric display from old → new value using
 * framer-motion's spring. Vitality scores in the Twin/Future Clone
 * use this so dragging the timeline slider feels like the number
 * is *responding* rather than snapping.
 */
export function AnimatedNumber({
  value,
  color = '#c6ff3d',
  fontSize = 72,
  stiffness = 90,
  damping = 18,
}: Props) {
  const motionVal = useMotionValue(value);
  const spring = useSpring(motionVal, { stiffness, damping });
  const rounded = useTransform(spring, (v) => Math.round(v).toString());

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  return (
    <motion.span
      className="font-display font-bold tabular-nums leading-none"
      style={{
        fontSize,
        color,
        display: 'inline-block',
      }}
    >
      <motion.span>{rounded}</motion.span>
    </motion.span>
  );
}
