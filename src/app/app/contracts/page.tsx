"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/app-shell";
import { BloomCard, BloomBadge, BloomSectionHeader, BloomEmpty } from "@/components/bloom";
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
      <div className="space-y-6 max-w-4xl">
        {/* Header - Bloom Elements style */}
        <BloomSectionHeader title={t.contracts.title} />

        {/* Error - Bloom style */}
        {error && (
          <BloomCard topBar topBarColor="bg-destructive">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-destructive">{error}</p>
              <Button variant="outline" onClick={fetchContracts} size="sm" className="h-8 text-xs">
                {t.submit}
              </Button>
            </div>
          </BloomCard>
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
                    <BloomEmpty
                      icon={<EmptyIcon className="h-6 w-6" />}
                      title={t.contracts.noContracts}
                    />
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

  // Map status to BloomBadge variants
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
      <div className="bg-card p-8 rounded-3xl border border-border shadow-card hover:shadow-elevated hover:border-primary/30 transition-all cursor-pointer group">
        {/* Header with status badge */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-black text-foreground truncate uppercase text-sm group-hover:text-primary transition-colors">
              {contract.title || t.contracts.title}
            </h3>
            <p className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest mt-1 truncate">{contract.description && contract.description.slice(0, 60)}</p>
          </div>
          <BloomBadge variant={statusVariantMap[contract.status] || "muted"}>
            {statusLabel}
          </BloomBadge>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 py-4 border-y border-border/30">
          {/* Other Party */}
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-2xl bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5 text-muted-foreground">
              <IconUser className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest">Cuidador</p>
              <p className="text-xs font-semibold text-foreground truncate mt-1">{contract.otherParty?.name || t.none}</p>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-2xl bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5 text-primary">
              <IconClock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest">Duração</p>
              <p className="text-xs font-semibold text-foreground mt-1">{contract.hoursPerWeek}h/semana</p>
            </div>
          </div>
        </div>

        {/* Footer: Date & Rate */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
          <div className="flex items-center gap-2 text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest">
            <IconCalendar className="h-4 w-4" />
            {contract.startDate && (
              <span>{new Date(contract.startDate).toLocaleDateString('pt-PT')}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <IconEuro className="h-4 w-4 text-success" />
            <span className="text-base font-display font-black tracking-tighter text-success">{hourlyRate.toFixed(0)}€</span>
            <span className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest">/h</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
