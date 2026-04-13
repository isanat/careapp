"use client";

import React from "react";
import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import PageTransition from "./PageTransition";

interface AnimatePresenceWrapperProps {
  children: React.ReactNode;
}

/**
 * Wraps layout children with AnimatePresence for page transitions
 * Automatically triggers page transition animations on route change
 */
export function AnimatePresenceWrapper({
  children,
}: AnimatePresenceWrapperProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <PageTransition key={pathname}>{children}</PageTransition>
    </AnimatePresence>
  );
}

export default AnimatePresenceWrapper;
