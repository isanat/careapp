import React from 'react';
import { cn } from '@/lib/utils';

export const SectionHeader = ({ title, desc }: { title: string; desc: string }) => (
  <div className="space-y-1 sm:space-y-2">
    <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-foreground tracking-tighter leading-none uppercase">{title}</h2>
    <p className="text-sm sm:text-base text-muted-foreground font-medium">{desc}</p>
  </div>
);

export const DocCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-4">
    <h4 className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4">{title}</h4>
    <div className="bg-card p-5 sm:p-8 rounded-3xl border border-border shadow-card relative overflow-hidden">
      {children}
    </div>
  </section>
);

export const StatBlock = ({ label, value, icon: Icon, colorClass }: {
  label: string;
  value: string;
  icon: React.ElementType;
  colorClass?: string;
}) => (
  <div className="bg-card p-5 sm:p-7 rounded-3xl border border-border shadow-card space-y-3 sm:space-y-4 hover:shadow-elevated transition-all group">
    <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform", colorClass || "text-primary")}>
      <Icon size={22} />
    </div>
    <div>
      <div className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">{label}</div>
      <div className="text-2xl sm:text-3xl font-display font-black text-foreground tracking-tighter leading-none mt-1">{value}</div>
    </div>
  </div>
);
