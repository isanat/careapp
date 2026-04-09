"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api-client";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconEuro,
  IconTrendingUp,
  IconClock,
  IconCheck,
  IconArrowRight,
  IconCalendar,
  IconArrowUp,
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
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-lg font-bold">Meus Ganhos</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Acompanhe seus ganhos e histórico de pagamentos
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Total Earnings */}
          <div className="bg-surface rounded-xl p-4 border-2 border-primary/20 hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <IconEuro className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Total de Ganhos</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              €{(walletData?.totalEarnings || 0) / 100}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Desde o início</p>
          </div>

          {/* Available Balance */}
          <div className="bg-surface rounded-xl p-4 border-2 border-success/20 hover:border-success/40 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
                <IconCheck className="h-4 w-4 text-success" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Saldo Disponível</span>
            </div>
            <p className="text-2xl font-bold text-success">
              €{(walletData?.availableBalance || 0) / 100}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Para levantamento</p>
          </div>

          {/* Pending */}
          <div className="bg-surface rounded-xl p-4 border-2 border-amber-200/30 hover:border-amber-300/40 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-amber-100/20 flex items-center justify-center">
                <IconClock className="h-4 w-4 text-amber-600" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Pendente</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">
              €{(walletData?.pendingAmount || 0) / 100}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Em contratos ativos</p>
          </div>
        </div>

        {/* Recent Payments */}
        {walletData && walletData.recentPayments.length > 0 && (
          <div>
            <h2 className="text-sm font-bold mb-3">Histórico de Ganhos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {walletData.recentPayments.map((payment) => {
                const statusColors: Record<string, { border: string; top: string; icon: string; badge: string }> = {
                  COMPLETED: { border: "border-success/30 hover:border-success/50", top: "bg-success", icon: "bg-success/10 text-success", badge: "bg-success/10 text-success" },
                  ACTIVE: { border: "border-primary/30 hover:border-primary/50", top: "bg-primary", icon: "bg-primary/10 text-primary", badge: "bg-primary/10 text-primary" },
                  PENDING: { border: "border-amber-200/50 hover:border-amber-300/60", top: "bg-amber-500", icon: "bg-amber-100/20 text-amber-600", badge: "bg-amber-100/20 text-amber-600" },
                };
                const statusConfig = statusColors[payment.status] || statusColors.PENDING;

                return (
                  <div key={payment.id} className={`bg-surface rounded-xl border-2 ${statusConfig.border} transition-all card-interactive overflow-hidden`}>
                    <div className={`h-1 ${statusConfig.top}`} />
                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground line-clamp-1">{payment.description}</p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <IconCalendar className="h-3 w-3" />
                            {new Date(payment.createdAt).toLocaleDateString("pt-PT", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <Badge className={`${statusConfig.badge} border-0 text-[10px] px-2 py-0.5 h-5 shrink-0 font-semibold`}>
                          {payment.status === "COMPLETED"
                            ? "Concluído"
                            : payment.status === "ACTIVE"
                            ? "Ativo"
                            : "Pendente"}
                        </Badge>
                      </div>

                      {/* Amount Section */}
                      <div className="flex items-end gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${statusConfig.icon}`}>
                          <IconArrowUp className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Ganho</p>
                          <p className="text-lg font-bold text-success">+€{(payment.amount / 100).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!walletData || walletData.recentPayments.length === 0) && !error && (
          <div className="text-center py-12 bg-surface rounded-xl border-2 border-dashed border-border/30">
            <IconTrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="font-semibold text-foreground">Sem ganhos ainda</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Seus ganhos aparecerão aqui quando completar contratos
            </p>
          </div>
        )}

        {error && (
          <div className="bg-error/5 border border-error/20 rounded-xl p-4">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
