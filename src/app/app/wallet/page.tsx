"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Suspense } from "react";
import { apiFetch } from "@/lib/api-client";
import { WalletView } from "@isanat/bloom-elements/components/evyra/views/AppViews";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

interface Transaction {
  id: number;
  type: "credit" | "debit";
  desc: string;
  amount: number;
  date: string;
  status: "COMPLETED" | "PENDING";
}

function WalletPageContent() {
  const { status } = useSession();
  const { t } = useI18n();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") fetchTransactions();
  }, [status]);

  const fetchTransactions = async () => {
    try {
      const response = await apiFetch("/api/contracts");
      if (response.ok) {
        const data = await response.json();
        const contracts = data.contracts || [];
        const txs: Transaction[] = contracts.map((c: any) => ({
          id: parseInt(c.id || Math.random().toString()),
          type: c.status === "COMPLETED" ? "credit" : "debit",
          desc: c.title || "Pagamento de serviço",
          amount: Math.round(c.hourlyRateEur * c.totalHours * 100),
          date: c.createdAt || new Date().toISOString().split("T")[0],
          status: c.status === "COMPLETED" ? "COMPLETED" : "PENDING",
        }));
        setTransactions(txs);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12">
            <p>{t.loading}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <WalletView transactions={transactions.length > 0 ? transactions : undefined} />;
}

export default function WalletPage() {
  const { t } = useI18n();

  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4 py-12">
          <Card className="w-full max-w-lg">
            <CardContent className="py-12 text-center">
              <p>{t.loading}</p>
            </CardContent>
          </Card>
        </main>
      }
    >
      <WalletPageContent />
    </Suspense>
  );
}
