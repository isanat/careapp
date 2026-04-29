"use client";

import {
  IconFamily,
  IconStar,
  IconEuro,
} from "@/components/icons";
import {
  tokens,
  cn,
  getCardClasses,
} from "@/lib/design-tokens";
import { ProfileData } from "../../hooks/useProfileData";

interface CaregiverStatsProps {
  profile: ProfileData | null;
  formData: ProfileData;
}

export function CaregiverStats({ profile, formData }: CaregiverStatsProps) {
  const stats = [
    {
      value: profile?.totalContracts || 0,
      label: "Contratos",
      icon: IconFamily,
    },
    {
      value: profile?.totalReviews || 0,
      label: "Avaliações",
      icon: IconStar,
    },
    {
      value: (profile?.averageRating || 0).toFixed(1),
      label: "Nota",
      icon: IconStar,
    },
    {
      value: `€${(formData.hourlyRateEur || 0).toFixed(2)}`,
      label: "/hora",
      icon: IconEuro,
    },
  ];

  return (
    <div className={cn(tokens.layout.grid.responsive4)}>
      {stats.map((stat, i) => (
        <div
          key={i}
          className={cn(getCardClasses(true), "space-y-4")}
        >
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
            <stat.icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">
              {stat.label}
            </div>
            <div className="text-3xl font-display font-black text-foreground tracking-tighter leading-none mt-1">
              {stat.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
