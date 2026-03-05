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
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t.contracts.title}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t.dashboard.viewAll}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchContracts} disabled={isLoading} size="icon" className="h-9 w-9 rounded-xl">
              <IconRefresh className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            {isFamily && (
              <Button asChild className="h-9 rounded-xl">
                <Link href="/app/contracts/new">
                  <IconPlus className="h-4 w-4 mr-1.5" />
                  {t.contracts.new}
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-error/5 border border-error/20 rounded-2xl p-4">
            <p className="text-sm text-error">{error}</p>
            <Button variant="outline" onClick={fetchContracts} size="sm" className="mt-2">
              {t.submit}
            </Button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface rounded-2xl p-4 shadow-card border border-border/50">
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        {!isLoading && !error && (
          <Tabs defaultValue="active">
            <TabsList className="w-full grid grid-cols-3 h-10 rounded-xl bg-muted p-1">
              <TabsTrigger value="active" className="rounded-lg text-xs data-[state=active]:shadow-sm">
                {t.contracts.active} ({activeContracts.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="rounded-lg text-xs data-[state=active]:shadow-sm">
                {t.contracts.pending} ({pendingContracts.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg text-xs data-[state=active]:shadow-sm">
                {t.contracts.completed} ({completedContracts.length})
              </TabsTrigger>
            </TabsList>

            {["active", "pending", "completed"].map((tab) => {
              const items = tab === "active" ? activeContracts : tab === "pending" ? pendingContracts : completedContracts;
              const emptyIcon = tab === "active" ? IconContract : tab === "pending" ? IconClock : IconCheck;
              const EmptyIcon = emptyIcon;

              return (
                <TabsContent key={tab} value={tab} className="mt-4 space-y-3">
                  {items.map((contract) => (
                    <ContractCard key={contract.id} contract={contract} isFamily={isFamily} t={t} />
                  ))}
                  {items.length === 0 && (
                    <div className="text-center py-12 bg-surface rounded-2xl shadow-card border border-border/50">
                      <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                        <EmptyIcon className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">{t.contracts.noContracts}</p>
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
  const totalEur = contract.totalEurCents ? contract.totalEurCents / 100 : 0;
  const hourlyRate = contract.hourlyRateEur ? contract.hourlyRateEur / 100 : 0;
  const config = statusConfig[contract.status] || statusConfig.DRAFT;

  return (
    <Link href={`/app/contracts/${contract.id}`} className="block">
      <div className={`bg-surface rounded-2xl p-4 shadow-card border border-border/50 border-l-4 ${config.border} hover:shadow-card-hover transition-all`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{contract.title || t.contracts.title}</h3>
            </div>
            <Badge className={`${config.bg} ${config.color} border-0 text-[10px] mt-1`}>
              {statusLabel}
            </Badge>
          </div>
          <IconChevronRight className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <IconUser className="h-3.5 w-3.5" />
            <span className="text-xs">{contract.otherParty?.name || t.none}</span>
          </div>
          {contract.startDate && (
            <div className="flex items-center gap-1">
              <IconCalendar className="h-3.5 w-3.5" />
              <span className="text-xs">{new Date(contract.startDate).toLocaleDateString('pt-PT')}</span>
            </div>
          )}
          {hourlyRate > 0 && (
            <div className="flex items-center gap-1">
              <IconEuro className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{"\u20AC"}{hourlyRate.toFixed(0)}{t.search.perHour}</span>
            </div>
          )}
        </div>

        {contract.serviceTypes && contract.serviceTypes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {contract.serviceTypes.slice(0, 3).map((service, index) => (
              <Badge key={index} variant="outline" className="text-[10px] px-1.5 py-0 rounded-md bg-muted/50">
                {service}
              </Badge>
            ))}
          </div>
        )}

        {contract.status === "PENDING_ACCEPTANCE" && !isFamily && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
            <Button size="sm" className="flex-1 h-8 rounded-lg text-xs">{t.yes}</Button>
            <Button size="sm" variant="outline" className="flex-1 h-8 rounded-lg text-xs">{t.no}</Button>
          </div>
        )}
      </div>
    </Link>
  );
}
