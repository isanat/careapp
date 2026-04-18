"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api-client";
import { AppShell } from "@/components/layout/app-shell";
import {
  BloomSectionHeader,
  BloomEmpty,
  BloomCard,
  BloomStatBlock,
  BloomBadge,
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
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div
        className="space-y-6 max-w-5xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Page Header */}
        <div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <BloomSectionHeader
            title="Minha Carteira"
            description="Saldo de conta e histórico de transações"
          />
        </div>

        {/* Balance Hero Card with Stats Grid */}
        {walletData && (
          <div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="space-y-6"
          >
            {/* Main Balance Card */}
            <BloomCard
              variant="gradient"
              className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-5 sm:p-6 md:p-7"
            >
              <div className="space-y-6">
                {/* Main Balance */}
                <div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <p className="text-xs font-display font-black uppercase tracking-widest opacity-80 mb-3">
                    Saldo Disponível
                  </p>
                  <p className="text-4xl sm:text-5xl font-display font-black tracking-tighter">
                    €{(walletData.availableBalance / 100).toFixed(2)}
                  </p>
                </div>

                {/* Balance Breakdown - Responsive Grid */}
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  {/* Total Earnings Stat */}
                  <div
                    className="bg-white/10 rounded-2xl p-5"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <p className="text-xs font-display font-black uppercase tracking-widest opacity-75 mb-2">
                      Total de Ganhos
                    </p>
                    <p className="text-2xl font-display font-black tracking-tighter">
                      €{(walletData.totalEarnings / 100).toFixed(2)}
                    </p>
                  </div>

                  {/* Pending Amount Stat */}
                  <div
                    className="bg-white/10 rounded-2xl p-5"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <p className="text-xs font-display font-black uppercase tracking-widest opacity-75 mb-2">
                      Pendente (Escrow)
                    </p>
                    <p className="text-2xl font-display font-black tracking-tighter">
                      €{(walletData.pendingAmount / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </BloomCard>
          </div>
        )}

        {/* Transaction List */}
        {walletData && walletData.recentTransactions.length > 0 && (
          <section
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <BloomSectionHeader title="Histórico de Transações" />
            <BloomCard className="p-5 sm:p-6 md:p-7">
              <div className="space-y-0">
                {walletData.recentTransactions.map((transaction, idx) => (
                  <div
                    key={transaction.id}
                    className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 py-4 ${
                      idx < walletData.recentTransactions.length - 1
                        ? "border-b border-border/50"
                        : ""
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.05, duration: 0.3 }}
                    whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.02)" }}
                  >
                    {/* Left: Icon + Description */}
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary flex-shrink-0"
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {transaction.status === "COMPLETED" ? (
                          <IconArrowDown className="h-6 w-6" />
                        ) : (
                          <IconCalendar className="h-6 w-6" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-body font-medium text-foreground">
                          {transaction.description || "Pagamento de Serviço"}
                        </p>
                        <p className="text-xs font-display font-black text-muted-foreground/50 uppercase tracking-widest mt-1">
                          {new Date(transaction.createdAt).toLocaleDateString("pt-PT", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Right: Amount + Status Badge */}
                    <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                      <div>
                        <p
                          className={`text-lg font-display font-black tracking-tighter ${
                            transaction.status === "COMPLETED"
                              ? "text-success"
                              : "text-warning"
                          }`}
                        >
                          +€{(transaction.amount / 100).toFixed(2)}
                        </p>
                      </div>
                      <BloomBadge
                        variant={
                          transaction.status === "COMPLETED" ? "success" : "warning"
                        }
                        className="text-xs font-display font-black uppercase tracking-widest"
                      >
                        {transaction.status === "COMPLETED"
                          ? "Libertado"
                          : "Pendente"}
                      </BloomBadge>
                    </div>
                  </div>
                ))}
              </div>
            </BloomCard>
          </section>
        )}

        {/* Empty State */}
        {(!walletData || walletData.recentTransactions.length === 0) && !error && (
          <div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <BloomEmpty
              icon={<IconTrendingUp className="h-8 w-8" />}
              title="Sem transações ainda"
              description="Suas transações aparecerão aqui quando completar contratos"
            />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div
            className="flex items-start gap-4 p-5 sm:p-6 md:p-7 bg-destructive/5 border border-destructive/20 rounded-2xl"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-sm font-body font-medium text-destructive">{error}</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
