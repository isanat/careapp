"use client";

import React from "react";
import { motion, MotionProps } from "framer-motion";
import { cardHoverVariants } from "@/lib/animations";

interface CardMotionProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  delay?: number;
}

/**
 * Card wrapper with hover lift and shadow elevation effect
 * Combines Tailwind shadow-card base with motion hover to shadow-elevated
 */
export function CardMotion({
  children,
  className = "",
  interactive = true,
  delay = 0,
  ...motionProps
}: CardMotionProps) {
  return (
    <motion.div
      initial="initial"
      whileHover={interactive ? "hover" : undefined}
      variants={cardHoverVariants}
      transition={{ delay }}
      className={className}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}

export default CardMotion;
