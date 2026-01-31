'use client';

import { X } from 'lucide-react';

export const Modal = ({
  open,
  title,
  children,
  onClose
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-text/15 px-4">
      <div className="rounded-[14px] border border-border/10 bg-surface p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text">{title}</h3>
          <button onClick={onClose} aria-label="Close modal">
            <X className="h-4 w-4 text-text2" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
