"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/app-shell";
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

const statusConfig: Record<string, { color: string; bg: string; border: string }> = {
  DRAFT: { color: "text-muted-foreground", bg: "bg-muted", border: "border-l-muted-foreground" },
  PENDING_ACCEPTANCE: { color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-l-amber-500" },
  PENDING_PAYMENT: { color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-l-orange-500" },
  ACTIVE: { color: "text-success", bg: "bg-success/5", border: "border-l-success" },
  COMPLETED: { color: "text-primary", bg: "bg-primary/5", border: "border-l-primary" },
  CANCELLED: { color: "text-error", bg: "bg-error/5", border: "border-l-error" },
  DISPUTED: { color: "text-secondary", bg: "bg-secondary/5", border: "border-l-secondary" },
};

export default function ContractsPage() {
  const { data: session, status } = useSession();
  const { t } = useI18n();
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
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">{t.contracts.title}</h1>
          <div className="flex gap-1.5">
            <Button variant="outline" onClick={fetchContracts} disabled={isLoading} size="icon" className="h-8 w-8">
              <IconRefresh className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            {isFamily && (
              <Button asChild size="sm">
                <Link href="/app/search">
                  <IconPlus className="h-3.5 w-3.5 mr-1" />
                  {t.contracts.new}
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-error/5 border border-error/20 rounded-xl p-3">
            <p className="text-xs text-error">{error}</p>
            <Button variant="outline" onClick={fetchContracts} size="sm" className="mt-1.5 h-7 text-xs">
              {t.submit}
            </Button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        )}

        {/* Tabs */}
        {!isLoading && !error && (
          <Tabs defaultValue="active">
            <TabsList className="w-full grid grid-cols-3 h-9 rounded-lg bg-muted p-0.5">
              <TabsTrigger value="active" className="rounded-md text-xs data-[state=active]:shadow-sm">
                {t.contracts.active} ({activeContracts.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="rounded-md text-xs data-[state=active]:shadow-sm">
                {t.contracts.pending} ({pendingContracts.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-md text-xs data-[state=active]:shadow-sm">
                {t.contracts.completed} ({completedContracts.length})
              </TabsTrigger>
            </TabsList>

            {["active", "pending", "completed"].map((tab) => {
              const items = tab === "active" ? activeContracts : tab === "pending" ? pendingContracts : completedContracts;
              const EmptyIcon = tab === "active" ? IconContract : tab === "pending" ? IconClock : IconCheck;

              return (
                <TabsContent key={tab} value={tab} className="mt-3 space-y-1.5">
                  {items.map((contract) => (
                    <ContractCard key={contract.id} contract={contract} isFamily={isFamily} t={t} />
                  ))}
                  {items.length === 0 && (
                    <div className="text-center py-8 bg-surface rounded-xl border border-border/30">
                      <EmptyIcon className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />
                      <p className="text-xs text-muted-foreground">{t.contracts.noContracts}</p>
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </div>
    </AppShell>
  );
}

function ContractCard({ contract, isFamily, t }: { contract: Contract; isFamily: boolean; t: any }) {
  const statusLabel = CONTRACT_STATUS[contract.status as keyof typeof CONTRACT_STATUS] || contract.status;
  const hourlyRate = contract.hourlyRateEur ? contract.hourlyRateEur / 100 : 0;
  const config = statusConfig[contract.status] || statusConfig.DRAFT;

  // Map status to colors for border
  const statusColorMap: Record<string, string> = {
    DRAFT: "border-muted/30 hover:border-muted/60",
    PENDING_ACCEPTANCE: "border-amber-200/50 hover:border-amber-300/60",
    PENDING_PAYMENT: "border-orange-200/50 hover:border-orange-300/60",
    ACTIVE: "border-success/30 hover:border-success/50",
    COMPLETED: "border-primary/30 hover:border-primary/50",
    CANCELLED: "border-error/30 hover:border-error/50",
    DISPUTED: "border-secondary/30 hover:border-secondary/50",
  };

  return (
    <Link href={`/app/contracts/${contract.id}`} className="group">
      <div className={`bg-surface rounded-xl p-4 border-2 ${statusColorMap[contract.status] || statusColorMap.DRAFT} transition-all duration-300 card-interactive`}>
        {/* Header with status badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {contract.title || t.contracts.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">{contract.description && contract.description.slice(0, 60)}</p>
          </div>
          <Badge className={`${config.bg} ${config.color} border-0 text-[10px] px-2 py-0.5 h-5 shrink-0 font-semibold`}>
            {statusLabel}
          </Badge>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-2 py-3 border-y border-border/30">
          {/* Other Party */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
              <IconUser className="h-4 w-4 text-secondary" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground font-medium">Cuidador</p>
              <p className="text-xs font-semibold text-foreground truncate">{contract.otherParty?.name || t.none}</p>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <IconClock className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground font-medium">Duração</p>
              <p className="text-xs font-semibold text-foreground">{contract.hoursPerWeek}h/semana</p>
            </div>
          </div>
        </div>

        {/* Footer: Date & Rate */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <IconCalendar className="h-3.5 w-3.5" />
            {contract.startDate && (
              <span>{new Date(contract.startDate).toLocaleDateString('pt-PT')}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <IconEuro className="h-4 w-4 text-success" />
            <span className="text-sm font-bold text-success">{hourlyRate.toFixed(0)}€</span>
            <span className="text-[11px] text-muted-foreground">/h</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
