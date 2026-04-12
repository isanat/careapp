import { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  desc?: string | ReactNode;
}

/**
 * Bloom Elements SectionHeader - Page section titles
 * Matches: https://github.com/isanat/bloom-elements/src/components/evyra/EvyraShared.tsx
 */
export function BloomSectionHeader({
  title,
  desc,
}: SectionHeaderProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-3xl md:text-4xl font-display font-black text-foreground tracking-tighter leading-none uppercase">
        {title}
      </h2>
      {desc && (
        <p className="text-base text-muted-foreground font-medium">
          {desc}
        </p>
      )}
    </div>
  );
}
