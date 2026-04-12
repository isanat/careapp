"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api-client";
import { AppShell } from "@/components/layout/app-shell";
import { BloomCard, BloomBadge, BloomSectionHeader, BloomEmpty } from "@/components/bloom";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconEuro,
  IconTrendingUp,
  IconClock,
  IconCheck,
  IconArrowRight,
  IconCalendar,
  IconArrowUp,
  IconWallet,
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

      // Fetch user receipts and escrow payments to calculate earnings
      const [receiptsRes, escrowRes] = await Promise.all([
        apiFetch("/api/contracts"),
        apiFetch("/api/admin/payments/escrow"),
      ]);

      if (!receiptsRes.ok) {
        throw new Error("Erro ao carregar dados de ganhos");
      }

      const contractsData = await receiptsRes.json();
      const contracts = contractsData.contracts || [];

      // Calculate total earnings from completed contracts
      let totalEarnings = 0;
      let pendingAmount = 0;
      const recentPayments: Payment[] = [];

      contracts.forEach((contract: any) => {
        if (contract.status === "COMPLETED" || contract.status === "ACTIVE") {
          // Estimate based on hourly rate and hours
          const hourlyRate = contract.hourlyRateEur || 0;
          const hoursWorked = contract.totalHours || 0;
          const totalAmount = hourlyRate * hoursWorked;

          // Assuming 10% platform fee (should be dynamic)
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
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-6 w-40 mt-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        {/* Header - Bloom style */}
        <BloomSectionHeader
          title="Meus Ganhos"
          description="Acompanhe seus ganhos e histórico de pagamentos"
          icon={<IconWallet className="h-6 w-6 text-primary" />}
        />

        {/* Summary Cards - Bloom style */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Earnings */}
          <BloomCard interactive>
            <div className="flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <IconEuro className="h-5 w-5 text-primary" />
              </div>
              <p className="text-xl sm:text-2xl font-display font-black text-foreground tracking-tighter">€{(walletData?.totalEarnings || 0) / 100}</p>
              <p className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest mt-2">Total de Ganhos</p>
            </div>
          </BloomCard>

          {/* Available Balance */}
          <BloomCard interactive>
            <div className="flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center mb-3">
                <IconCheck className="h-5 w-5 text-success" />
              </div>
              <p className="text-xl sm:text-2xl font-display font-black text-success tracking-tighter">€{(walletData?.availableBalance || 0) / 100}</p>
              <p className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest mt-2">Saldo Disponível</p>
            </div>
          </BloomCard>

          {/* Pending */}
          <BloomCard interactive>
            <div className="flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center mb-3">
                <IconClock className="h-5 w-5 text-warning" />
              </div>
              <p className="text-xl sm:text-2xl font-display font-black text-warning tracking-tighter">€{(walletData?.pendingAmount || 0) / 100}</p>
              <p className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest mt-2">Pendente</p>
            </div>
          </BloomCard>
        </div>

        {/* Recent Payments */}
        {walletData && walletData.recentPayments.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-display font-black text-foreground uppercase">Histórico de Ganhos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {walletData.recentPayments.map((payment) => {
                const statusVariantMap: Record<string, "primary" | "success" | "warning" | "destructive" | "muted"> = {
                  COMPLETED: "success",
                  ACTIVE: "primary",
                  PENDING: "warning",
                };

                return (
                  <BloomCard key={payment.id} interactive topBar topBarColor={
                    payment.status === "COMPLETED" ? "bg-success" :
                    payment.status === "ACTIVE" ? "bg-primary" :
                    "bg-warning"
                  }>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-black text-foreground truncate uppercase text-sm">{payment.description}</p>
                        <p className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest mt-1 flex items-center gap-1">
                          <IconCalendar className="h-3.5 w-3.5" />
                          {new Date(payment.createdAt).toLocaleDateString("pt-PT", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <BloomBadge variant={statusVariantMap[payment.status] || "muted"}>
                        {payment.status === "COMPLETED"
                          ? "Concluído"
                          : payment.status === "ACTIVE"
                          ? "Ativo"
                          : "Pendente"}
                      </BloomBadge>
                    </div>

                    {/* Amount Section */}
                    <div className="flex items-end gap-3 py-4 border-t border-border/30">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                        payment.status === "COMPLETED" ? "bg-success/10 text-success" :
                        payment.status === "ACTIVE" ? "bg-primary/10 text-primary" :
                        "bg-warning/10 text-warning"
                      }`}>
                        <IconArrowUp className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest">Ganho</p>
                        <p className="text-base sm:text-lg font-display font-black tracking-tighter text-success mt-1">+€{(payment.amount / 100).toFixed(2)}</p>
                      </div>
                    </div>
                  </BloomCard>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!walletData || walletData.recentPayments.length === 0) && !error && (
          <BloomEmpty
            icon={<IconTrendingUp className="h-8 w-8" />}
            title="Sem ganhos ainda"
            description="Seus ganhos aparecerão aqui quando completar contratos"
          />
        )}

        {/* Error */}
        {error && (
          <BloomCard topBar topBarColor="bg-destructive">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </BloomCard>
        )}
      </div>
    </AppShell>
  );
}
