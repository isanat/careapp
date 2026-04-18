import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * Bloom Profile Modal - Placeholder component for user profile display
 *
 * This component serves as a placeholder and wrapper for profile-related modals.
 * It will be updated to use custom components from @isanat/bloom-elements
 * when the package is published on npm.
 *
 * Currently re-exports Dialog components from the UI library.
 */

interface BloomProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  title?: string;
  className?: string;
}

export function BloomProfileModal({
  isOpen,
  onClose,
  children,
  title = "Profile",
  className,
}: BloomProfileModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={className}>
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}

// Re-export Dialog components for flexibility
export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
