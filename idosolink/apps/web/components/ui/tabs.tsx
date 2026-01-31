'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from 'lib/cn';

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: TabsPrimitive.TabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn('inline-flex rounded-lg bg-border/40 p-1', className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: TabsPrimitive.TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'rounded-md px-4 py-2 text-sm font-semibold text-text2 transition data-[state=active]:bg-surface data-[state=active]:text-text data-[state=active]:shadow-soft focus-ring',
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: TabsPrimitive.TabsContentProps) {
  return <TabsPrimitive.Content className={cn('mt-4', className)} {...props} />;
}
