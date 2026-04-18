"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/app-shell";
import { BloomCard, BloomBadge, BloomSectionHeader, BloomEmpty } from "@/components/bloom-custom";
import {
  IconContract,
  IconPlus,
  IconClock,
  IconCheck,
  IconEuro,
  IconCalendar,
  IconUser,
  IconRefresh,
  IconChevronRight,
} from "@/components/icons";
import { CONTRACT_STATUS } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";

interface Contract {
  id: string;
  status: string;
  title: string;
  description: string;
  hourlyRateEur: number;
  totalHours: number;
  totalEurCents: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  serviceTypes: string[];
  hoursPerWeek: number;
  otherParty: {
    name: string;
    title?: string;
    city?: string;
  };
}


export default function ContractsPage() {
  const { data: session, status } = useSession();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"all" | "active" | "pending" | "completed">("all");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") fetchContracts();
  }, [status]);

  const fetchContracts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/api/contracts');
      if (!response.ok) throw new Error(t.error);
      const data = await response.json();
      setContracts(data.contracts || []);
    } catch (err: any) {
      setError(err.message || t.error);
    } finally {
      setIsLoading(false);
    }
  };

  const isFamily = session?.user?.role === "FAMILY";

  const activeContracts = contracts.filter((c) => c.status === "ACTIVE");
  const pendingContracts = contracts.filter(
    (c) => c.status === "PENDING_ACCEPTANCE" || c.status === "PENDING_PAYMENT" || c.status === "DRAFT"
  );
  const completedContracts = contracts.filter(
    (c) => c.status === "COMPLETED" || c.status === "CANCELLED"
  );

  return (
    <AppShell>
      <div
        className="space-y-6 max-w-6xl"
       
       
       
      >
        {/* Header - Bloom Elements style */}
        <BloomSectionHeader title={t.contracts.title} />

        {/* Error - Bloom style with animation */}
        {error && (
          <div>
            <BloomCard variant="warning" className="p-5 sm:p-6 md:p-7">
              <div className="flex items-center justify-between gap-3">
                <p className="font-body text-sm font-medium text-destructive">{error}</p>
                <Button variant="outline" onClick={fetchContracts} size="sm" className="h-8 text-xs">
                  {t.submit}
                </Button>
              </div>
            </BloomCard>
          </div>
        )}

        {/* Loading state with skeleton animations */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <Skeleton className="h-32 rounded-2xl" />
              </div>
            ))}
          </div>
        )}

        {/* Tabs and Content */}
        {!isLoading && !error && (
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="border-b border-border/60">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                {[
                  { key: "all", label: `Todos (${contracts.length})` },
                  { key: "active", label: `${t.contracts.active} (${activeContracts.length})` },
                  { key: "pending", label: `${t.contracts.pending} (${pendingContracts.length})` },
                  { key: "completed", label: `${t.contracts.completed} (${completedContracts.length})` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={`h-11 text-xs sm:text-sm font-display font-bold tracking-wide border-b-2 transition-all duration-300 uppercase ${
                      activeTab === tab.key
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Contract List */}
            {(() => {
              const items =
                activeTab === "all"
                  ? contracts
                  : activeTab === "active"
                  ? activeContracts
                  : activeTab === "pending"
                  ? pendingContracts
                  : completedContracts;

              const EmptyIcon =
                activeTab === "active"
                  ? IconContract
                  : activeTab === "pending"
                  ? IconClock
                  : activeTab === "completed"
                  ? IconCheck
                  : IconContract;

              return (
                <div
                  className="space-y-4"
                 
                 
                 
                >
                  {items.map((contract, index) => (
                    <div key={contract.id}>
                      <ContractCard contract={contract} isFamily={isFamily} t={t} />
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div>
                      <BloomEmpty icon={<EmptyIcon className="h-6 w-6" />} title={t.contracts.noContracts} />
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function ContractCard({ contract, isFamily, t }: { contract: Contract; isFamily: boolean; t: any }) {
  const statusLabel = CONTRACT_STATUS[contract.status as keyof typeof CONTRACT_STATUS] || contract.status;
  const hourlyRate = contract.hourlyRateEur ? contract.hourlyRateEur / 100 : 0;

  // Map status to BloomBadge variants for Bloom Elements compliance
  const statusVariantMap: Record<string, "primary" | "success" | "warning" | "destructive" | "muted"> = {
    DRAFT: "muted",
    PENDING_ACCEPTANCE: "warning",
    PENDING_PAYMENT: "warning",
    ACTIVE: "success",
    COMPLETED: "primary",
    CANCELLED: "destructive",
    DISPUTED: "destructive",
  };

  return (
    <Link href={`/app/contracts/${contract.id}`} className="group">
      <div
       
       
        whileHover="hover"
      >
        <BloomCard variant="interactive" className="p-5 sm:p-6 md:p-7">
          {/* Header with status badge */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6 pb-6 border-b border-border/30">
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-black text-foreground truncate uppercase text-lg sm:text-xl group-hover:text-primary transition-colors duration-300">
                {contract.title || t.contracts.title}
              </h3>
              <p className="font-body text-sm text-muted-foreground mt-2 line-clamp-2">
                {contract.description && contract.description.slice(0, 100)}
              </p>
            </div>
            <div className="flex-shrink-0">
              <BloomBadge variant={statusVariantMap[contract.status] || "muted"} className="text-xs font-display font-bold uppercase">
                {statusLabel}
              </BloomBadge>
            </div>
          </div>

          {/* Info grid - responsive layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 pb-6 border-b border-border/30">
            {/* Other Party */}
            <div
              className="flex items-start gap-3 p-4 rounded-2xl bg-secondary/5 hover:bg-primary/5 transition-colors duration-300"
              whileHover={{ y: -2 }}
            >
              <div className="h-10 w-10 rounded-2xl bg-secondary flex items-center justify-center flex-shrink-0 text-muted-foreground">
                <IconUser className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold text-[10px] text-muted-foreground/70 uppercase tracking-widest">
                  Cuidador
                </p>
                <p className="font-body font-semibold text-sm text-foreground truncate mt-1.5">
                  {contract.otherParty?.name || t.none}
                </p>
              </div>
            </div>

            {/* Duration */}
            <div
              className="flex items-start gap-3 p-4 rounded-2xl bg-secondary/5 hover:bg-primary/5 transition-colors duration-300"
              whileHover={{ y: -2 }}
            >
              <div className="h-10 w-10 rounded-2xl bg-secondary flex items-center justify-center flex-shrink-0 text-primary">
                <IconClock className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold text-[10px] text-muted-foreground/70 uppercase tracking-widest">
                  Duração
                </p>
                <p className="font-body font-semibold text-sm text-foreground mt-1.5">
                  {contract.hoursPerWeek}h/semana
                </p>
              </div>
            </div>
          </div>

          {/* Footer: Date & Rate */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <IconCalendar className="h-4 w-4 text-muted-foreground/60 flex-shrink-0" />
              <span className="font-display font-bold text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                {contract.startDate && new Date(contract.startDate).toLocaleDateString('pt-PT')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <IconEuro className="h-4 w-4 text-success flex-shrink-0" />
              <span className="font-display font-black text-base sm:text-lg tracking-tighter text-success">
                {hourlyRate.toFixed(0)}€
              </span>
              <span className="font-display font-bold text-[9px] text-muted-foreground/60 uppercase tracking-widest">
                /h
              </span>
            </div>
          </div>
        </BloomCard>
      </div>
    </Link>
  );
}
