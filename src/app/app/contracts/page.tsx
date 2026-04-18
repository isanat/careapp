"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/app-shell";
import {
  BloomCard,
  BloomBadge,
  BloomSectionHeader,
  BloomEmpty,
} from "@/components/bloom-custom";
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
  const [activeTab, setActiveTab] = useState<
    "all" | "active" | "pending" | "completed"
  >("all");
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
      const response = await apiFetch("/api/contracts");
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
    (c) =>
      c.status === "PENDING_ACCEPTANCE" ||
      c.status === "PENDING_PAYMENT" ||
      c.status === "DRAFT",
  );
  const completedContracts = contracts.filter(
    (c) => c.status === "COMPLETED" || c.status === "CANCELLED",
  );

  return (
    <AppShell>
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {/* Page Heading */}
        <div className="space-y-1 sm:space-y-2">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-foreground tracking-tighter leading-none uppercase">
            {t.contracts.title}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Gerencie seus contratos e acompanhe o progresso
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center justify-between gap-3 p-4 sm:p-5 md:p-7 bg-destructive/5 border border-destructive/20 rounded-2xl sm:rounded-3xl">
            <p className="text-sm font-medium text-destructive">{error}</p>
            <Button
              variant="outline"
              onClick={fetchContracts}
              size="sm"
              className="h-8 text-xs"
            >
              {t.submit}
            </Button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-2xl sm:rounded-3xl" />
            ))}
          </div>
        )}

        {/* Tabs */}
        {!isLoading && !error && (
          <div className="space-y-4 sm:space-y-5">
            <div className="border-b border-border/60">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: "all", label: `Todos (${contracts.length})` },
                  {
                    key: "active",
                    label: `${t.contracts.active} (${activeContracts.length})`,
                  },
                  {
                    key: "pending",
                    label: `${t.contracts.pending} (${pendingContracts.length})`,
                  },
                  {
                    key: "completed",
                    label: `${t.contracts.completed} (${completedContracts.length})`,
                  },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={`h-11 text-sm font-display font-black tracking-wide border-b-2 transition-colors ${
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
                <div className="space-y-3 sm:space-y-4">
                  {items.map((contract) => (
                    <ContractCard
                      key={contract.id}
                      contract={contract}
                      isFamily={isFamily}
                      t={t}
                    />
                  ))}
                  {items.length === 0 && (
                    <BloomEmpty
                      icon={<EmptyIcon className="h-6 w-6" />}
                      title={t.contracts.noContracts}
                    />
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

function ContractCard({
  contract,
  isFamily,
  t,
}: {
  contract: Contract;
  isFamily: boolean;
  t: any;
}) {
  const statusLabel =
    CONTRACT_STATUS[contract.status as keyof typeof CONTRACT_STATUS] ||
    contract.status;
  const hourlyRate = contract.hourlyRateEur ? contract.hourlyRateEur / 100 : 0;

  // Map status to BloomBadge variants
  const statusVariantMap: Record<
    string,
    "primary" | "success" | "warning" | "destructive" | "muted"
  > = {
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
      <BloomCard variant="interactive" className="p-4 sm:p-5 md:p-7 rounded-2xl sm:rounded-3xl">
        {/* Header with status badge */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-black text-foreground truncate uppercase text-base sm:text-lg group-hover:text-primary transition-colors">
              {contract.title || t.contracts.title}
            </h3>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-1 truncate">
              {contract.description && contract.description.slice(0, 80)}
            </p>
          </div>
          <BloomBadge variant={statusVariantMap[contract.status] || "muted"}>
            {statusLabel}
          </BloomBadge>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 py-3 sm:py-4 border-y border-border/30">
          {/* Other Party */}
          <div className="flex items-start gap-3 hover:bg-secondary p-2 sm:p-3 rounded-2xl transition-colors">
            <div className="h-9 w-9 rounded-2xl bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5 text-muted-foreground border border-border/50">
              <IconUser className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-display font-black text-muted-foreground/70 uppercase tracking-widest">
                Cuidador
              </p>
              <p className="text-xs sm:text-sm font-display font-black text-foreground truncate mt-1">
                {contract.otherParty?.name || t.none}
              </p>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-start gap-3 hover:bg-secondary p-2 sm:p-3 rounded-2xl transition-colors">
            <div className="h-9 w-9 rounded-2xl bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5 text-primary border border-border/50">
              <IconClock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-display font-black text-muted-foreground/70 uppercase tracking-widest">
                Duração
              </p>
              <p className="text-xs sm:text-sm font-display font-black text-foreground mt-1">
                {contract.hoursPerWeek}h/semana
              </p>
            </div>
          </div>
        </div>

        {/* Footer: Date & Rate */}
        <div className="flex items-center justify-between mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/30">
          <div className="flex items-center gap-2 text-[10px] font-display font-black text-muted-foreground/60 uppercase tracking-widest">
            <IconCalendar className="h-4 w-4" />
            {contract.startDate && (
              <span>
                {new Date(contract.startDate).toLocaleDateString("pt-PT")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <IconEuro className="h-4 w-4 text-success" />
            <span className="text-base sm:text-lg font-display font-black tracking-tighter text-success">
              {hourlyRate.toFixed(0)}€
            </span>
            <span className="text-[10px] font-display font-black text-muted-foreground/60 uppercase tracking-widest">
              /h
            </span>
          </div>
        </div>
      </BloomCard>
    </Link>
  );
}
