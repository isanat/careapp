'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface BloomMotionCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  topBar?: boolean;
  topBarColor?: string;
}

/**
 * Bloom Elements card with Framer Motion animation
 * Hover effect: y: -4 (lifts up on hover)
 */
export function BloomMotionCard({
  children,
  className = '',
  onClick,
  topBar = false,
  topBarColor = 'bg-primary',
}: BloomMotionCardProps) {
  const baseClasses =
    'bg-card rounded-3xl border border-border shadow-card hover:shadow-elevated hover:border-primary/30 transition-all duration-300 cursor-pointer';

  if (topBar) {
    return (
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        onClick={onClick}
        className={`${baseClasses} overflow-hidden ${className}`}
      >
        <div className={`h-1 ${topBarColor}`} />
        <div className="p-5 sm:p-7">{children}</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`${baseClasses} p-5 sm:p-7 ${className}`}
    >
      {children}
    </motion.div>
  );
}
