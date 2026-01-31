'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from 'lib/cn';

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;

export function DrawerContent({ className, ...props }: DialogPrimitive.DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 bg-text/20" />
      <DialogPrimitive.Content
        className={cn(
          'fixed bottom-0 left-0 right-0 rounded-t-2xl border border-border bg-surface px-6 pb-8 pt-4 shadow-soft focus:outline-none',
          className
        )}
        {...props}
      />
    </DialogPrimitive.Portal>
  );
}

export function DrawerHandle() {
  return <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />;
}
