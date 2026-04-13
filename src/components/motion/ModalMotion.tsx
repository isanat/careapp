"use client";

import React from "react";
import { motion } from "framer-motion";
import { modalVariants } from "@/lib/animations";

interface ModalMotionProps {
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
}

/**
 * Modal/Dialog wrapper with scale and fade animation
 * Provides entrance and exit animations for modals
 */
export function ModalMotion({
  children,
  className = "",
  isOpen = true,
}: ModalMotionProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={modalVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default ModalMotion;
