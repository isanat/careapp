"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api-client";
import { AppShell } from "@/components/layout/app-shell";
import {
  BloomSectionHeader,
  BloomEmpty,
  BloomCard,
} from "@/components/bloom-custom";
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

      const [contractsRes] = await Promise.all([apiFetch("/api/contracts")]);

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
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {/* Page Heading */}
        <div className="space-y-1 sm:space-y-2">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-foreground tracking-tighter leading-none uppercase">
            Minha Carteira
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Saldo de conta e histórico de transações
          </p>
        </div>

        {/* Balance Hero Card */}
        {walletData && (
          <BloomCard
            variant="gradient"
            className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-5 sm:p-7 md:p-10 rounded-2xl sm:rounded-3xl"
          >
            <div className="space-y-6">
              {/* Main Balance */}
              <div>
                <p className="text-xs sm:text-[10px] font-display font-black uppercase tracking-widest opacity-80 mb-2 sm:mb-3">
                  Saldo Disponível
                </p>
                <p className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tighter">
                  €{(walletData.availableBalance / 100).toFixed(2)}
                </p>
              </div>

              {/* Balance Breakdown */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white/10 rounded-2xl p-4 sm:p-5">
                  <p className="text-[9px] sm:text-[10px] font-display font-black uppercase tracking-widest opacity-75 mb-2">
                    Total de Ganhos
                  </p>
                  <p className="text-base sm:text-lg font-display font-black tracking-tighter">
                    €{(walletData.totalEarnings / 100).toFixed(2)}
                  </p>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 sm:p-5">
                  <p className="text-[9px] sm:text-[10px] font-display font-black uppercase tracking-widest opacity-75 mb-2">
                    Pendente (Escrow)
                  </p>
                  <p className="text-base sm:text-lg font-display font-black tracking-tighter">
                    €{(walletData.pendingAmount / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </BloomCard>
        )}

        {/* Transaction List */}
        {walletData && walletData.recentTransactions.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-sm font-display font-black text-foreground uppercase tracking-widest border-l-4 border-primary pl-3">
              Histórico de Transações
            </h3>
            <BloomCard className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-7">
              <div className="space-y-0">
                {walletData.recentTransactions.map((transaction, idx) => (
                  <div
                    key={transaction.id}
                    className={`flex justify-between items-center py-3 sm:py-4 px-3 sm:px-4 rounded-2xl ${
                      idx % 2 === 0 ? "bg-secondary/30" : ""
                    }`}
                  >
                    {/* Left: Icon + Description */}
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary flex-shrink-0">
                        {transaction.status === "COMPLETED" ? (
                          <IconArrowDown className="h-5 w-5 sm:h-6 sm:w-6" />
                        ) : (
                          <IconCalendar className="h-5 w-5 sm:h-6 sm:w-6" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-display font-black text-foreground truncate">
                          {transaction.description || "Pagamento de Serviço"}
                        </p>
                        <p className="text-[10px] font-display font-black text-muted-foreground/50 uppercase tracking-widest">
                          {new Date(transaction.createdAt).toLocaleDateString(
                            "pt-PT",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            },
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Right: Amount + Status */}
                    <div className="text-right flex-shrink-0 ml-3 sm:ml-4">
                      <p
                        className={`text-base sm:text-lg font-display font-black tracking-tighter ${
                          transaction.status === "COMPLETED"
                            ? "text-success"
                            : "text-warning"
                        }`}
                      >
                        +€{(transaction.amount / 100).toFixed(2)}
                      </p>
                      <p
                        className={`text-[10px] font-display font-black uppercase tracking-widest ${
                          transaction.status === "COMPLETED"
                            ? "text-success/70"
                            : "text-warning/70"
                        }`}
                      >
                        {transaction.status === "COMPLETED"
                          ? "Libertado"
                          : "Pendente"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </BloomCard>
          </section>
        )}

        {/* Empty State */}
        {(!walletData || walletData.recentTransactions.length === 0) &&
          !error && (
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
