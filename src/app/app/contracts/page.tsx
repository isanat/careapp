"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppShell } from "@/components/layout/app-shell";
import { 
  IconContract, 
  IconPlus,
  IconClock,
  IconCheck,
  IconX,
  IconEuro,
  IconCalendar,
  IconUser
} from "@/components/icons";
import { CONTRACT_STATUS, TOKEN_SYMBOL } from "@/lib/constants";

// Mock contracts
const mockContracts = [
  {
    id: "1",
    caregiverName: "Carmela Oliveira",
    caregiverId: "1",
    familyName: "Maria Silva",
    title: "Cuidado diário para idosa",
    status: "ACTIVE",
    hoursPerWeek: 20,
    hourlyRate: 25,
    startDate: "2024-01-15",
    endDate: null,
    totalPaid: 1000,
    acceptedAt: "2024-01-14",
  },
  {
    id: "2",
    caregiverName: "Tiago Almeida",
    caregiverId: "2",
    familyName: "Maria Silva",
    title: "Companhia e medicação",
    status: "PENDING_ACCEPTANCE",
    hoursPerWeek: 10,
    hourlyRate: 22,
    startDate: "2024-02-01",
    endDate: null,
    totalPaid: 0,
    acceptedAt: null,
  },
  {
    id: "3",
    caregiverName: "Luiza Pereira",
    caregiverId: "3",
    familyName: "Maria Silva",
    title: "Fisioterapia domiciliar",
    status: "COMPLETED",
    hoursPerWeek: 5,
    hourlyRate: 28,
    startDate: "2023-11-01",
    endDate: "2024-01-15",
    totalPaid: 560,
    acceptedAt: "2023-10-30",
  },
];

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

  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  const isFamily = session?.user?.role === "FAMILY";

  const activeContracts = mockContracts.filter((c) => c.status === "ACTIVE");
  const pendingContracts = mockContracts.filter(
    (c) => c.status === "PENDING_ACCEPTANCE" || c.status === "PENDING_PAYMENT"
  );
  const completedContracts = mockContracts.filter(
    (c) => c.status === "COMPLETED" || c.status === "CANCELLED"
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Meus Contratos</h1>
            <p className="text-muted-foreground">
              Gerencie seus contratos de cuidado
            </p>
          </div>
          {isFamily && (
            <Button asChild>
              <Link href="/app/contracts/new">
                <IconPlus className="h-4 w-4 mr-2" />
                Novo Contrato
              </Link>
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">
              Ativos ({activeContracts.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pendentes ({pendingContracts.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Histórico ({completedContracts.length})
            </TabsTrigger>
          </TabsList>

          {/* Active Contracts */}
          <TabsContent value="active" className="mt-6 space-y-4">
            {activeContracts.map((contract) => (
              <ContractCard key={contract.id} contract={contract} isFamily={isFamily} />
            ))}
            {activeContracts.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <IconContract className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum contrato ativo</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Pending Contracts */}
          <TabsContent value="pending" className="mt-6 space-y-4">
            {pendingContracts.map((contract) => (
              <ContractCard key={contract.id} contract={contract} isFamily={isFamily} />
            ))}
            {pendingContracts.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <IconClock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum contrato pendente</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Completed Contracts */}
          <TabsContent value="completed" className="mt-6 space-y-4">
            {completedContracts.map((contract) => (
              <ContractCard key={contract.id} contract={contract} isFamily={isFamily} />
            ))}
            {completedContracts.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <IconCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum contrato no histórico</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function ContractCard({ contract, isFamily }: { contract: typeof mockContracts[0]; isFamily: boolean }) {
  const statusLabel = CONTRACT_STATUS[contract.status as keyof typeof CONTRACT_STATUS] || contract.status;
  const totalEur = contract.hoursPerWeek * 4 * contract.hourlyRate;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg">{contract.title}</h3>
              <Badge className={statusColors[contract.status]}>
                {statusLabel}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <IconUser className="h-4 w-4" />
                <span>{isFamily ? contract.caregiverName : contract.familyName}</span>
              </div>
              <div className="flex items-center gap-1">
                <IconCalendar className="h-4 w-4" />
                <span>{contract.startDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <IconEuro className="h-4 w-4" />
                <span>€{contract.hourlyRate}/hora</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{contract.hoursPerWeek}h/semana</span>
              <span className="text-muted-foreground">•</span>
              <span className="font-medium">≈ €{totalEur}/mês</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {contract.status === "PENDING_ACCEPTANCE" && !isFamily && (
              <div className="flex gap-2">
                <Button size="sm">Aceitar</Button>
                <Button size="sm" variant="outline">Recusar</Button>
              </div>
            )}
            <Button variant="outline" asChild>
              <Link href={`/app/contracts/${contract.id}`}>
                Ver Detalhes
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
