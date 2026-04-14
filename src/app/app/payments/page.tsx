"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api-client";
import { AppShell } from "@/components/layout/app-shell";
import { BloomSectionHeader, BloomStatBlock, BloomEmpty, BloomCard, BloomBadge, BloomSectionDivider } from "@/components/bloom-custom";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconEuro,
  IconTrendingUp,
  IconClock,
  IconCheck,
  IconCalendar,
  IconChevronRight,
} from "@/components/icons";
import { useI18n } from "@/lib/i18n";

interface Payment {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  paidAt?: string;
  description?: string;
}

interface WalletData {
  totalEarnings: number;
  pendingAmount: number;
  availableBalance: number;
  lastPayment?: {
    amount: number;
    date: string;
  };
  recentPayments: Payment[];
}

export default function PaymentsPage() {
  const { data: session, status } = useSession();
  const { t } = useI18n();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchWalletData();
    }
  }, [status]);

  const fetchWalletData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [receiptsRes] = await Promise.all([
        apiFetch("/api/contracts"),
      ]);

      if (!receiptsRes.ok) {
        throw new Error("Erro ao carregar dados de ganhos");
      }

      const contractsData = await receiptsRes.json();
      const contracts = contractsData.contracts || [];

      let totalEarnings = 0;
      let pendingAmount = 0;
      const recentPayments: Payment[] = [];

      contracts.forEach((contract: any) => {
        if (contract.status === "COMPLETED" || contract.status === "ACTIVE") {
          const hourlyRate = contract.hourlyRateEur || 0;
          const hoursWorked = contract.totalHours || 0;
          const totalAmount = hourlyRate * hoursWorked;
          const earnings = totalAmount * 0.9;
          totalEarnings += earnings;

          if (contract.status === "ACTIVE") {
            pendingAmount += earnings;
          }

          recentPayments.push({
            id: contract.id,
            type: "SERVICE_PAYMENT",
            amount: earnings,
            status: contract.status,
            createdAt: contract.createdAt,
            description: contract.title,
          });
        }
      });

      setWalletData({
        totalEarnings: Math.round(totalEarnings),
        pendingAmount: Math.round(pendingAmount),
        availableBalance: Math.round(totalEarnings - pendingAmount),
        recentPayments: recentPayments.slice(0, 10),
      });
    } catch (err: any) {
      setError(err.message || "Erro ao carregar dados de pagamentos");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "unauthenticated") {
    return null;
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36 rounded-3xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-3xl mt-6" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-10 max-w-6xl">
        {/* Header */}
        <BloomSectionHeader
          title="Finanças & Pagamentos"
          desc="Controlo de fundos seguros e histórico de pagamentos libertados."
        />

        {/* Stats - 3 StatBlocks like PaymentsView */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <BloomStatBlock
            label="Total de Ganhos"
            value={`€${((walletData?.totalEarnings || 0) / 100).toFixed(2)}`}
            icon={<IconEuro className="h-6 w-6" />}
            colorClass="text-primary"
          />
          <BloomStatBlock
            label="Pagamentos Libertados"
            value={`€${((walletData?.availableBalance || 0) / 100).toFixed(2)}`}
            icon={<IconCheck className="h-6 w-6" />}
            colorClass="text-success"
          />
          <BloomStatBlock
            label="Pendente (Escrow)"
            value={`€${((walletData?.pendingAmount || 0) / 100).toFixed(2)}`}
            icon={<IconClock className="h-6 w-6" />}
            colorClass="text-foreground"
          />
        </div>

        {/* Recent Payments - Bloom Elements Pattern */}
        {walletData && walletData.recentPayments.length > 0 && (
          <section className="space-y-4">
            <BloomSectionDivider
              title="Histórico de Ganhos"
              borderColor="primary"
            />
            <BloomCard>
            <div className="space-y-4">
                {walletData.recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-6 bg-secondary/30 rounded-3xl border border-border/60 hover:bg-secondary/50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-card rounded-2xl flex items-center justify-center text-primary shadow-sm border border-border">
                        <IconCalendar className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-display font-black text-foreground text-base uppercase tracking-tight">{payment.description || "Pagamento de Serviço"}</p>
                        <p className="text-xs font-medium text-muted-foreground mt-1">
                          {new Date(payment.createdAt).toLocaleDateString("pt-PT", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right min-w-[120px]">
                        <p className="text-2xl font-display font-black text-foreground leading-none">
                          {(payment.amount / 100).toFixed(2)}€
                        </p>
                        <BloomBadge
                          variant={payment.status === "COMPLETED" ? "success" : "warning"}
                          className="text-[10px] mt-1"
                        >
                          {payment.status === "COMPLETED" ? "Libertado" : "Pendente"}
                        </BloomBadge>
                      </div>
                      <button className="p-2.5 bg-card border border-border text-muted-foreground hover:text-primary hover:bg-secondary rounded-xl transition-all shadow-sm">
                        <IconChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </BloomCard>
          </section>
        )}

        {/* Empty State */}
        {(!walletData || walletData.recentPayments.length === 0) && !error && (
          <BloomEmpty
            icon={<IconTrendingUp className="h-8 w-8" />}
            title="Sem ganhos ainda"
            description="Seus ganhos aparecerão aqui quando completar contratos"
          />
        )}

        {/* Error - Bloom Alert Pattern */}
        {error && (
          <div className="bg-card rounded-3xl p-5 sm:p-7 border-2 border-destructive/30 bg-destructive/5 flex items-center gap-3 shadow-card">
            <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
              <div className="w-2 h-2 bg-destructive rounded-full" />
            </div>
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
