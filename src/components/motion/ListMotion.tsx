"use client";

import React from "react";
import { motion } from "framer-motion";
import { containerVariants, itemVariants } from "@/lib/animations";

interface ListMotionProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  initialDelay?: number;
}

/**
 * Container for list items that stagger animation
 * Wrap your list in this, children will animate in sequence
 */
export function ListMotion({
  children,
  className = "",
  staggerDelay = 0.07,
  initialDelay = 0.1,
}: ListMotionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{
        initial: {},
        animate: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: initialDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface ListItemMotionProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
}

/**
 * Individual list item with fade-in and slide animation
 * Use inside ListMotion container
 */
export function ListItemMotion({
  children,
  className = "",
  index = 0,
}: ListItemMotionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={itemVariants}
      custom={index}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export { ListMotion as default };
