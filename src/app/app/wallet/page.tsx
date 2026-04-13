"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api-client";
import { AppShell } from "@/components/layout/app-shell";
import { BloomSectionHeader, BloomEmpty } from "@/components/bloom";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconTrendingUp,
  IconCalendar,
  IconArrowUp,
  IconArrowDown,
} from "@/components/icons";

interface Transaction {
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
  recentTransactions: Transaction[];
}

export default function WalletPage() {
  const { data: session, status } = useSession();
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

      const [contractsRes] = await Promise.all([
        apiFetch("/api/contracts"),
      ]);

      if (!contractsRes.ok) {
        throw new Error("Erro ao carregar dados de saldo");
      }

      const contractsData = await contractsRes.json();
      const contracts = contractsData.contracts || [];

      let totalEarnings = 0;
      let pendingAmount = 0;
      const recentTransactions: Transaction[] = [];

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

          recentTransactions.push({
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
        recentTransactions: recentTransactions.slice(0, 10),
      });
    } catch (err: any) {
      setError(err.message || "Erro ao carregar dados de saldo");
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
        <div className="space-y-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8 max-w-4xl">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-black uppercase mb-2 text-foreground">
            Minha Carteira
          </h1>
          <p className="text-base text-muted-foreground font-medium">
            Saldo de conta e histórico de transações
          </p>
        </div>

        {/* Balance Hero Card */}
        {walletData && (
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-7 sm:p-10 text-primary-foreground shadow-elevated">
            <div className="space-y-6">
              {/* Main Balance */}
              <div>
                <p className="text-xs font-display font-bold uppercase tracking-widest opacity-80 mb-3">
                  Saldo Disponível
                </p>
                <p className="text-4xl sm:text-5xl font-display font-black tracking-tighter">
                  €{(walletData.availableBalance / 100).toFixed(2)}
                </p>
              </div>

              {/* Balance Breakdown */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-2xl p-4">
                  <p className="text-[9px] font-display font-bold uppercase tracking-widest opacity-75 mb-2">
                    Total de Ganhos
                  </p>
                  <p className="text-lg font-display font-black tracking-tighter">
                    €{(walletData.totalEarnings / 100).toFixed(2)}
                  </p>
                </div>
                <div className="bg-white/10 rounded-2xl p-4">
                  <p className="text-[9px] font-display font-bold uppercase tracking-widest opacity-75 mb-2">
                    Pendente (Escrow)
                  </p>
                  <p className="text-lg font-display font-black tracking-tighter">
                    €{(walletData.pendingAmount / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction List */}
        {walletData && walletData.recentTransactions.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest mb-4">
              Histórico de Transações
            </h2>
            <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card">
              <div className="space-y-0">
                {walletData.recentTransactions.map((transaction, idx) => (
                  <div
                    key={transaction.id}
                    className={`flex justify-between items-center py-4 ${
                      idx < walletData.recentTransactions.length - 1
                        ? "border-b border-border/50"
                        : ""
                    }`}
                  >
                    {/* Left: Icon + Description */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary flex-shrink-0">
                        {transaction.status === "COMPLETED" ? (
                          <IconArrowDown className="h-6 w-6" />
                        ) : (
                          <IconCalendar className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {transaction.description || "Pagamento de Serviço"}
                        </p>
                        <p className="text-[9px] text-muted-foreground/50 uppercase tracking-widest">
                          {new Date(transaction.createdAt).toLocaleDateString("pt-PT", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Right: Amount + Status */}
                    <div className="text-right flex-shrink-0">
                      <p
                        className={`text-lg font-display font-black tracking-tighter ${
                          transaction.status === "COMPLETED"
                            ? "text-success"
                            : "text-warning"
                        }`}
                      >
                        +€{(transaction.amount / 100).toFixed(2)}
                      </p>
                      <p
                        className={`text-[9px] font-display font-bold uppercase tracking-widest ${
                          transaction.status === "COMPLETED"
                            ? "text-success/70"
                            : "text-warning/70"
                        }`}
                      >
                        {transaction.status === "COMPLETED" ? "Libertado" : "Pendente"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Empty State */}
        {(!walletData || walletData.recentTransactions.length === 0) && !error && (
          <BloomEmpty
            icon={<IconTrendingUp className="h-8 w-8" />}
            title="Sem transações ainda"
            description="Suas transações aparecerão aqui quando completar contratos"
          />
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-start gap-4 p-5 bg-destructive/5 border border-destructive/20 rounded-2xl">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
