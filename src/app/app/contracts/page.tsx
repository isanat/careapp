"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BloomCard,
  BloomSectionHeader,
  BloomBadge,
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
    <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <BloomSectionHeader title={t.contracts.title} />
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
          <BloomCard variant="warning" className="p-3">
            <p className="text-xs text-error">{error}</p>
            <Button variant="outline" onClick={fetchContracts} size="sm" className="mt-1.5 h-7 text-xs">
              {t.submit}
            </Button>
          </BloomCard>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
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
                    <BloomCard className="text-center py-8">
                      <EmptyIcon className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />
                      <p className="text-xs text-muted-foreground">{t.contracts.noContracts}</p>
                    </BloomCard>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </div>
    );
}

function ContractCard({ contract, isFamily, t }: { contract: Contract; isFamily: boolean; t: any }) {
  const statusLabel = CONTRACT_STATUS[contract.status as keyof typeof CONTRACT_STATUS] || contract.status;
  const hourlyRate = contract.hourlyRateEur ? contract.hourlyRateEur / 100 : 0;
  const config = statusConfig[contract.status] || statusConfig.DRAFT;

  return (
    <Link href={`/app/contracts/${contract.id}`} className="block">
      <BloomCard variant="interactive" className={`py-2.5 px-3 border border-border border-l-[3px] ${config.border} flex items-center gap-3`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold truncate">{contract.title || t.contracts.title}</h3>
            <BloomBadge variant="default" className={`${config.bg} ${config.color} border-0 text-[9px] px-1.5 py-0 h-4`}>
              {statusLabel}
            </BloomBadge>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
            <span className="flex items-center gap-0.5">
              <IconUser className="h-3 w-3" />
              {contract.otherParty?.name || t.none}
            </span>
            {contract.startDate && (
              <span className="flex items-center gap-0.5">
                <IconCalendar className="h-3 w-3" />
                {new Date(contract.startDate).toLocaleDateString('pt-PT')}
              </span>
            )}
            {hourlyRate > 0 && (
              <span className="font-medium text-foreground">{"€"}{hourlyRate.toFixed(0)}{t.search.perHour}</span>
            )}
          </div>
        </div>
        <IconChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </BloomCard>
    </Link>
  );
}
