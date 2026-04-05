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
        <div className="max-w-4xl mx-auto space-y-6 pb-8">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6 pb-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Meus Ganhos</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe seus ganhos e histórico de pagamentos
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Earnings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <IconEuro className="h-4 w-4" />
                Total de Ganhos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{(walletData?.totalEarnings || 0) / 100}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Desde o início na plataforma
              </p>
            </CardContent>
          </Card>

          {/* Available Balance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <IconCheck className="h-4 w-4 text-green-600" />
                Saldo Disponível
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                €{(walletData?.availableBalance || 0) / 100}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pronto para levantamento
              </p>
            </CardContent>
          </Card>

          {/* Pending */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <IconClock className="h-4 w-4 text-amber-600" />
                Pendente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                €{(walletData?.pendingAmount || 0) / 100}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Em contratos ativos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Payments */}
        {walletData && walletData.recentPayments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Ganhos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {walletData.recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border border-border/50 rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{payment.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.createdAt).toLocaleDateString("pt-PT", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">
                        {payment.status === "COMPLETED"
                          ? "Concluído"
                          : payment.status === "ACTIVE"
                          ? "Ativo"
                          : "Pendente"}
                      </Badge>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          +€{(payment.amount / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {(!walletData || walletData.recentPayments.length === 0) && !error && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-3">
                <IconTrendingUp className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                <h3 className="font-medium">Sem ganhos ainda</h3>
                <p className="text-sm text-muted-foreground">
                  Seus ganhos aparecerão aqui quando completar contratos
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-6">
              <p className="text-sm text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
