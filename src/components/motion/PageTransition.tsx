"use client";

import React from "react";
import { motion } from "framer-motion";
import { pageTransitionVariants } from "@/lib/animations";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps page content with fade-in and slide-up animation
 * Use at the top level of page components
 */
export function PageTransition({
  children,
  className = "",
}: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransitionVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default PageTransition;
