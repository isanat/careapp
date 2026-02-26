"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AppShell } from "@/components/layout/app-shell";
import { 
  IconContract, 
  IconUser,
  IconCalendar,
  IconEuro,
  IconClock,
  IconCheck,
  IconAlert,
  IconShield,
  IconFile,
  IconRefresh
} from "@/components/icons";
import { CONTRACT_STATUS } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";

interface ContractDetails {
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
  acceptance?: {
    accepted: boolean;
    familyAccepted: boolean;
    familyAcceptedAt?: string;
    caregiverAccepted: boolean;
    caregiverAcceptedAt?: string;
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

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  
  const [contract, setContract] = useState<ContractDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      fetchContract();
    }
  }, [status, resolvedParams.id]);

  const fetchContract = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch contract details
      const contractsResponse = await fetch('/api/contracts');
      if (!contractsResponse.ok) throw new Error(t.error);
      
      const contractsData = await contractsResponse.json();
      const foundContract = contractsData.contracts?.find((c: ContractDetails) => c.id === resolvedParams.id);
      
      if (!foundContract) {
        throw new Error(t.contracts.noContracts || "Contrato não encontrado");
      }
      
      // Fetch acceptance details
      try {
        const acceptanceResponse = await fetch(`/api/contracts/${resolvedParams.id}/accept`);
        if (acceptanceResponse.ok) {
          const acceptanceData = await acceptanceResponse.json();
          foundContract.acceptance = acceptanceData;
        }
      } catch (e) {
        console.log('No acceptance data yet');
      }
      
      setContract(foundContract);
    } catch (err: any) {
      console.error('Error fetching contract:', err);
      setError(err.message || t.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptContract = async () => {
    if (!contract) return;
    
    setIsAccepting(true);
    try {
      const response = await fetch(`/api/contracts/${contract.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t.error);
      }
      
      const data = await response.json();
      
      // Refresh contract data
      await fetchContract();
      setShowAcceptDialog(false);
      
    } catch (err: any) {
      console.error('Error accepting contract:', err);
      setError(err.message || t.error);
    } finally {
      setIsAccepting(false);
    }
  };

  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  const isFamily = session?.user?.role === "FAMILY";
  const statusLabel = contract ? (CONTRACT_STATUS[contract.status as keyof typeof CONTRACT_STATUS] || contract.status) : "";

  const canAccept = contract?.status === 'PENDING_ACCEPTANCE' || contract?.status === 'DRAFT';
  const userNeedsToAccept = isFamily 
    ? !contract?.acceptance?.familyAccepted 
    : !contract?.acceptance?.caregiverAccepted;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/app/contracts">
                ← {t.back || "Voltar"}
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{t.contracts.title}</h1>
              {contract && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={statusColors[contract.status]}>
                    {statusLabel}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          <Button variant="outline" onClick={fetchContract} disabled={isLoading}>
            <IconRefresh className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {t.search.filters || "Atualizar"}
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Alert variant="destructive">
            <IconAlert className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Contract Details */}
        {contract && !isLoading && (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Main Info */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{contract.title || t.contracts.title}</CardTitle>
                  <CardDescription>{contract.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Service Types */}
                  {contract.serviceTypes && contract.serviceTypes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">{t.search.serviceTypes || "Serviços"}</h4>
                      <div className="flex flex-wrap gap-2">
                        {contract.serviceTypes.map((service, index) => (
                          <Badge key={index} variant="outline">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Separator />
                  
                  {/* Financial Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">{t.contracts.rate || "Taxa horária"}</h4>
                      <p className="text-2xl font-bold">€{(contract.hourlyRateEur / 100).toFixed(0)}{t.search.perHour}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">{t.contracts.total || "Total"}</h4>
                      <p className="text-2xl font-bold">€{(contract.totalEurCents / 100).toFixed(0)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">{t.contracts.hours || "Horas"}</h4>
                      <p className="text-lg">{contract.totalHours}h</p>
                    </div>
                    {contract.hoursPerWeek && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">{t.contracts.hoursPerWeek || "Horas/semana"}</h4>
                        <p className="text-lg">{contract.hoursPerWeek}h</p>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    {contract.startDate && (
                      <div className="flex items-center gap-2">
                        <IconCalendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">{t.contracts.startDate || "Início"}</h4>
                          <p>{new Date(contract.startDate).toLocaleDateString('pt-PT')}</p>
                        </div>
                      </div>
                    )}
                    {contract.endDate && (
                      <div className="flex items-center gap-2">
                        <IconCalendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">{t.contracts.endDate || "Fim"}</h4>
                          <p>{new Date(contract.endDate).toLocaleDateString('pt-PT')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Other Party */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <IconUser className="h-4 w-4" />
                    {isFamily ? t.contracts.caregiver : t.contracts.family}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <IconUser className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{contract.otherParty?.name}</p>
                      {contract.otherParty?.title && (
                        <p className="text-sm text-muted-foreground">{contract.otherParty.title}</p>
                      )}
                      {contract.otherParty?.city && (
                        <p className="text-sm text-muted-foreground">{contract.otherParty.city}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Acceptance Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <IconShield className="h-4 w-4" />
                    {t.contracts.acceptance || "Aceite Legal"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t.contracts.family || "Família"}</span>
                    {contract.acceptance?.familyAccepted ? (
                      <Badge className="bg-green-500">
                        <IconCheck className="h-3 w-3 mr-1" />
                        {t.accept || "Aceito"}
                      </Badge>
                    ) : (
                      <Badge variant="outline">{t.pending || "Pendente"}</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t.contracts.caregiver || "Cuidador"}</span>
                    {contract.acceptance?.caregiverAccepted ? (
                      <Badge className="bg-green-500">
                        <IconCheck className="h-3 w-3 mr-1" />
                        {t.accept || "Aceito"}
                      </Badge>
                    ) : (
                      <Badge variant="outline">{t.pending || "Pendente"}</Badge>
                    )}
                  </div>
                  
                  {contract.acceptance?.familyAcceptedAt && (
                    <p className="text-xs text-muted-foreground">
                      {t.contracts.familyAcceptedAt || "Família aceitou em"}: {new Date(contract.acceptance.familyAcceptedAt).toLocaleString('pt-PT')}
                    </p>
                  )}
                  {contract.acceptance?.caregiverAcceptedAt && (
                    <p className="text-xs text-muted-foreground">
                      {t.contracts.caregiverAcceptedAt || "Cuidador aceitou em"}: {new Date(contract.acceptance.caregiverAcceptedAt).toLocaleString('pt-PT')}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              {canAccept && userNeedsToAccept && (
                <Card className="border-primary">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <IconFile className="h-12 w-12 text-primary mx-auto" />
                      <div>
                        <h3 className="font-semibold">{t.contracts.acceptContract || "Aceitar Contrato"}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t.contracts.acceptInfo || "Ao aceitar, você concorda com os termos do contrato. Seu aceite será registrado legalmente."}
                        </p>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={() => setShowAcceptDialog(true)}
                        disabled={isAccepting}
                      >
                        <IconCheck className="h-4 w-4 mr-2" />
                        {t.accept || "Aceitar Contrato"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Status */}
              {contract.status === 'PENDING_PAYMENT' && isFamily && (
                <Card className="border-orange-500">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <IconEuro className="h-12 w-12 text-orange-500 mx-auto" />
                      <div>
                        <h3 className="font-semibold">{t.contracts.payment || "Pagamento Pendente"}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t.contracts.paymentInfo || "Ambas as partes aceitaram. Prossiga com o pagamento para iniciar o contrato."}
                        </p>
                      </div>
                      <Button className="w-full" asChild>
                        <Link href={`/app/contracts/${contract.id}/pay`}>
                          {t.wallet.pay || "Pagar"} €{(contract.totalEurCents / 100).toFixed(0)}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Accept Confirmation Dialog */}
        <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.contracts.confirmAccept || "Confirmar Aceite"}</DialogTitle>
              <DialogDescription>
                {t.contracts.confirmAcceptInfo || "Ao aceitar este contrato, você concorda com todos os termos e condições. Seu aceite será registrado com data, hora e endereço IP para fins legais."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowAcceptDialog(false)}>
                {t.cancel || "Cancelar"}
              </Button>
              <Button onClick={handleAcceptContract} disabled={isAccepting}>
                {isAccepting ? t.loading : t.accept || "Aceitar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
