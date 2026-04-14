import React from 'react';

interface BloomSectionHeaderProps {
  title: string;
  description?: string;
  desc?: string; // Alias para description
  className?: string;
  [key: string]: any;
}

/**
 * Bloom Section Header - Header para seções
 * Features: Título em display font, descrição opcional
 */
export function BloomSectionHeader({
  title,
  description,
  desc,
  className = '',
  ...props
}: BloomSectionHeaderProps) {
  const finalDesc = description || desc;

  return (
    <div className={`mb-6 ${className}`} {...props}>
      <h2 className="text-2xl font-display font-bold text-foreground">{title}</h2>
      {finalDesc && (
        <p className="text-sm text-muted-foreground mt-2">{finalDesc}</p>
      )}
    </div>
  );
}
