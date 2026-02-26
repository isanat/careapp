"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/app-shell";
import { 
  IconContract, 
  IconPlus,
  IconClock,
  IconCheck,
  IconEuro,
  IconCalendar,
  IconUser,
  IconRefresh
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

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500",
  PENDING_ACCEPTANCE: "bg-yellow-500",
  PENDING_PAYMENT: "bg-orange-500",
  ACTIVE: "bg-green-500",
  COMPLETED: "bg-blue-500",
  CANCELLED: "bg-red-500",
  DISPUTED: "bg-purple-500",
};

export default function ContractsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchContracts();
    }
  }, [status]);

  const fetchContracts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/contracts');
      if (!response.ok) {
        throw new Error(t.error);
      }
      const data = await response.json();
      setContracts(data.contracts || []);
    } catch (err: any) {
      console.error('Error fetching contracts:', err);
      setError(err.message || t.error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t.contracts.title}</h1>
            <p className="text-muted-foreground">
              {t.dashboard.viewAll}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchContracts} disabled={isLoading}>
              <IconRefresh className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {t.search.filters}
            </Button>
            {isFamily && (
              <Button asChild>
                <Link href="/app/contracts/new">
                  <IconPlus className="h-4 w-4 mr-2" />
                  {t.contracts.new}
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-500">
            <CardContent className="pt-6">
              <p className="text-red-500">{error}</p>
              <Button variant="outline" onClick={fetchContracts} className="mt-2">
                {t.submit}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tabs */}
        {!isLoading && !error && (
          <Tabs defaultValue="active">
            <TabsList>
              <TabsTrigger value="active">
                {t.contracts.active} ({activeContracts.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                {t.contracts.pending} ({pendingContracts.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                {t.contracts.completed} ({completedContracts.length})
              </TabsTrigger>
            </TabsList>

            {/* Active Contracts */}
            <TabsContent value="active" className="mt-6 space-y-4">
              {activeContracts.map((contract) => (
                <ContractCard key={contract.id} contract={contract} isFamily={isFamily} t={t} />
              ))}
              {activeContracts.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <IconContract className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t.contracts.noContracts}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Pending Contracts */}
            <TabsContent value="pending" className="mt-6 space-y-4">
              {pendingContracts.map((contract) => (
                <ContractCard key={contract.id} contract={contract} isFamily={isFamily} t={t} />
              ))}
              {pendingContracts.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <IconClock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t.contracts.noContracts}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Completed Contracts */}
            <TabsContent value="completed" className="mt-6 space-y-4">
              {completedContracts.map((contract) => (
                <ContractCard key={contract.id} contract={contract} isFamily={isFamily} t={t} />
              ))}
              {completedContracts.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <IconCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t.contracts.noContracts}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppShell>
  );
}

function ContractCard({ contract, isFamily, t }: { contract: Contract; isFamily: boolean; t: any }) {
  const statusLabel = CONTRACT_STATUS[contract.status as keyof typeof CONTRACT_STATUS] || contract.status;
  const totalEur = contract.totalEurCents ? contract.totalEurCents / 100 : 0;
  const hourlyRate = contract.hourlyRateEur ? contract.hourlyRateEur / 100 : 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg">{contract.title || t.contracts.title}</h3>
              <Badge className={statusColors[contract.status]}>
                {statusLabel}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <IconUser className="h-4 w-4" />
                <span>{contract.otherParty?.name || t.none}</span>
              </div>
              {contract.startDate && (
                <div className="flex items-center gap-1">
                  <IconCalendar className="h-4 w-4" />
                  <span>{new Date(contract.startDate).toLocaleDateString('pt-PT')}</span>
                </div>
              )}
              {hourlyRate > 0 && (
                <div className="flex items-center gap-1">
                  <IconEuro className="h-4 w-4" />
                  <span>€{hourlyRate.toFixed(0)}{t.search.perHour}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              {contract.hoursPerWeek && (
                <>
                  <span className="text-muted-foreground">{contract.hoursPerWeek}h/semana</span>
                  <span className="text-muted-foreground">•</span>
                </>
              )}
              {totalEur > 0 && (
                <span className="font-medium">€{totalEur.toFixed(0)}</span>
              )}
            </div>
            {contract.serviceTypes && contract.serviceTypes.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {contract.serviceTypes.slice(0, 4).map((service, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {service}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {contract.status === "PENDING_ACCEPTANCE" && !isFamily && (
              <div className="flex gap-2">
                <Button size="sm">{t.yes}</Button>
                <Button size="sm" variant="outline">{t.no}</Button>
              </div>
            )}
            <Button variant="outline" asChild>
              <Link href={`/app/contracts/${contract.id}`}>
                {t.edit}
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
