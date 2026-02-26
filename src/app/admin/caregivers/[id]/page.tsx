"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/common/page-header";
import { StatsCard } from "@/components/admin/common/stats-card";
import { StatusBadge } from "@/components/admin/common/status-badge";
import { DataTable, Column } from "@/components/admin/common/data-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  IconUser,
  IconMail,
  IconPhone,
  IconMapPin,
  IconStar,
  IconBriefcase,
  IconClock,
  IconShield,
  IconCheck,
  IconX,
  IconLoader2,
  IconEye,
  IconCalendar,
  IconEuro,
  IconCoins,
  IconAlertCircle
} from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface CaregiverDetails {
  id: string;
  email: string;
  name: string;
  phone?: string;
  createdAt: string;
  status: string;
  // Profile
  title?: string;
  bio?: string;
  city?: string;
  address?: string;
  country?: string;
  experienceYears?: number;
  hourlyRateEur?: number;
  minimumHours?: number;
  services?: string;
  specialties?: string;
  languages?: string;
  education?: string;
  certifications?: string;
  // Stats
  totalContracts?: number;
  totalHoursWorked?: number;
  averageRating?: number;
  totalReviews?: number;
  // KYC
  verificationStatus: string;
  documentType?: string;
  documentNumber?: string;
  documentVerified?: boolean;
  backgroundCheckStatus?: string;
  kycSessionId?: string;
  kycCompletedAt?: string;
  kycConfidence?: number;
  // Featured
  featured?: number;
  availableNow?: number;
  // Wallet
  walletAddress?: string;
  balanceTokens?: number;
  balanceEurCents?: number;
  // Relations
  reviews: Array<{
    id: string;
    rating: number;
    comment?: string;
    fromUserName: string;
    createdAt: string;
  }>;
  contracts: Array<{
    id: string;
    title: string;
    status: string;
    totalEurCents: number;
    startDate?: string;
    endDate?: string;
    familyName: string;
    createdAt: string;
  }>;
}

export default function AdminCaregiverDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [caregiver, setCaregiver] = useState<CaregiverDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const fetchCaregiver = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/caregivers/${params.id}`);
      if (!response.ok) {
        throw new Error("Caregiver not found");
      }
      const data = await response.json();
      setCaregiver(data);
    } catch (error) {
      console.error("Error fetching caregiver:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados do cuidador",
        variant: "destructive",
      });
      router.push("/admin/caregivers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchCaregiver();
    }
  }, [params.id]);

  const handleVerify = async (action: 'verify' | 'reject') => {
    if (action === 'reject' && !rejectReason.trim()) {
      toast({
        title: "Erro",
        description: "Informe o motivo da rejeição",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/caregivers/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caregiverId: params.id,
          action,
          reason: action === 'reject' ? rejectReason : undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to update');

      toast({
        title: "Sucesso",
        description: action === 'verify' ? "KYC aprovado com sucesso" : "KYC rejeitado",
      });
      setShowRejectModal(false);
      setRejectReason("");
      fetchCaregiver();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar KYC",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleFeature = async (featured: boolean) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/caregivers/${params.id}/feature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured }),
      });

      if (!response.ok) throw new Error('Failed to update');

      toast({
        title: "Sucesso",
        description: featured ? "Cuidador destacado" : "Destaque removido",
      });
      fetchCaregiver();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar destaque",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (cents?: number) => {
    if (!cents) return "€0,00";
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusBadgeVariant = (status: string): "pending" | "verified" | "unverified" | "rejected" => {
    switch (status) {
      case 'VERIFIED': return 'verified';
      case 'PENDING': return 'pending';
      case 'REJECTED': return 'rejected';
      default: return 'unverified';
    }
  };

  const getContractStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <StatusBadge status="active" />;
      case 'COMPLETED': return <StatusBadge status="completed" />;
      case 'CANCELLED': return <StatusBadge status="cancelled" />;
      case 'DISPUTED': return <StatusBadge status="disputed" />;
      default: return <StatusBadge status="pending" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!caregiver) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Cuidador não encontrado</p>
      </div>
    );
  }

  const contractColumns: Column<CaregiverDetails['contracts'][0]>[] = [
    {
      key: "title",
      header: "Título",
      render: (c) => <span className="font-medium">{c.title}</span>,
    },
    {
      key: "familyName",
      header: "Família",
      render: (c) => <span>{c.familyName || "-"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (c) => getContractStatusBadge(c.status),
    },
    {
      key: "totalEurCents",
      header: "Valor",
      render: (c) => <span>{formatCurrency(c.totalEurCents)}</span>,
    },
    {
      key: "createdAt",
      header: "Criado",
      render: (c) => <span className="text-sm text-muted-foreground">{formatDate(c.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      render: (c) => (
        <Link href={`/admin/contracts/${c.id}`}>
          <Button size="sm" variant="outline">
            <IconEye className="h-4 w-4" />
          </Button>
        </Link>
      ),
    },
  ];

  const reviewColumns: Column<CaregiverDetails['reviews'][0]>[] = [
    {
      key: "fromUserName",
      header: "De",
      render: (r) => <span className="font-medium">{r.fromUserName}</span>,
    },
    {
      key: "rating",
      header: "Nota",
      render: (r) => (
        <div className="flex items-center gap-1">
          <IconStar className="h-4 w-4 text-amber-500 fill-amber-500" />
          <span>{r.rating}</span>
        </div>
      ),
    },
    {
      key: "comment",
      header: "Comentário",
      render: (r) => (
        <span className="text-sm text-muted-foreground line-clamp-2">
          {r.comment || "-"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Data",
      render: (r) => <span className="text-sm text-muted-foreground">{formatDate(r.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={caregiver.name}
        description="Detalhes do cuidador"
        breadcrumbs={[
          { label: "Cuidadores", href: "/admin/caregivers" },
          { label: caregiver.name },
        ]}
        actions={
          <Link href="/admin/caregivers">
            <Button variant="outline">
              Voltar
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Contratos"
          value={caregiver.totalContracts || 0}
          icon={<IconBriefcase className="h-5 w-5" />}
        />
        <StatsCard
          title="Horas Trabalhadas"
          value={caregiver.totalHoursWorked || 0}
          icon={<IconClock className="h-5 w-5" />}
        />
        <StatsCard
          title="Avaliação"
          value={caregiver.averageRating?.toFixed(1) || "-"}
          description={`${caregiver.totalReviews || 0} avaliações`}
          icon={<IconStar className="h-5 w-5" />}
        />
        <StatsCard
          title="Saldo Tokens"
          value={caregiver.balanceTokens || 0}
          icon={<IconCoins className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Info Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconUser className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${caregiver.name}`} />
                <AvatarFallback>{caregiver.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-lg">{caregiver.name}</p>
                <p className="text-sm text-muted-foreground">{caregiver.title || "Sem título"}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <IconMail className="h-4 w-4 text-muted-foreground" />
                <span>{caregiver.email}</span>
              </div>
              {caregiver.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <IconPhone className="h-4 w-4 text-muted-foreground" />
                  <span>{caregiver.phone}</span>
                </div>
              )}
              {caregiver.city && (
                <div className="flex items-center gap-2 text-sm">
                  <IconMapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{caregiver.city}, {caregiver.country || "Portugal"}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <IconCalendar className="h-4 w-4 text-muted-foreground" />
                <span>Membro desde {formatDate(caregiver.createdAt)}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Experiência</span>
                <span className="font-medium">{caregiver.experienceYears || 0} anos</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa/Hora</span>
                <span className="font-medium">{formatCurrency(caregiver.hourlyRateEur ? caregiver.hourlyRateEur * 100 : 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Mín. Horas</span>
                <span className="font-medium">{caregiver.minimumHours || 1}h</span>
              </div>
            </div>

            {caregiver.bio && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-1">Sobre</p>
                  <p className="text-sm text-muted-foreground">{caregiver.bio}</p>
                </div>
              </>
            )}

            {caregiver.walletAddress && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-1">Carteira</p>
                  <p className="text-xs font-mono text-muted-foreground break-all">
                    {caregiver.walletAddress}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* KYC Verification Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconShield className="h-5 w-5" />
              Verificação KYC
            </CardTitle>
            <CardDescription>
              Status da verificação de identidade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <StatusBadge status={getStatusBadgeVariant(caregiver.verificationStatus)} />
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Documento</span>
                <span>{caregiver.documentType || "-"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Número</span>
                <span>{caregiver.documentNumber || "-"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Verificado</span>
                <span>{caregiver.documentVerified ? "Sim" : "Não"}</span>
              </div>
              {caregiver.kycConfidence && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Confiança</span>
                  <span>{(caregiver.kycConfidence * 100).toFixed(0)}%</span>
                </div>
              )}
              {caregiver.kycCompletedAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Verificado em</span>
                  <span>{formatDate(caregiver.kycCompletedAt)}</span>
                </div>
              )}
              {caregiver.backgroundCheckStatus && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Antecedentes</span>
                  <StatusBadge status={caregiver.backgroundCheckStatus === 'CLEARED' ? 'verified' : 'pending'} />
                </div>
              )}
            </div>

            {caregiver.verificationStatus === 'PENDING' && (
              <>
                <Separator />
                <div className="space-y-3">
                  <p className="text-sm font-medium">Ações</p>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleVerify('verify')}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <IconCheck className="h-4 w-4 mr-2" />
                      )}
                      Aprovar
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => setShowRejectModal(true)}
                      disabled={actionLoading}
                    >
                      <IconX className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <Card className="w-full max-w-md mx-4">
                  <CardHeader>
                    <CardTitle>Rejeitar KYC</CardTitle>
                    <CardDescription>
                      Informe o motivo da rejeição
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Motivo da rejeição..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={4}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowRejectModal(false);
                          setRejectReason("");
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleVerify('reject')}
                        disabled={actionLoading || !rejectReason.trim()}
                      >
                        {actionLoading ? (
                          <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Rejeitar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Featured Status */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconStar className="h-5 w-5" />
              Destaque
            </CardTitle>
            <CardDescription>
              Gerencie a visibilidade do cuidador
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Cuidador em Destaque</p>
                <p className="text-xs text-muted-foreground">
                  Cuidadores em destaque aparecem primeiro nas buscas
                </p>
              </div>
              <Switch
                checked={caregiver.featured === 1}
                onCheckedChange={(checked) => handleFeature(checked)}
                disabled={actionLoading}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Disponível Agora</p>
                <p className="text-xs text-muted-foreground">
                  Indica disponibilidade imediata
                </p>
              </div>
              <Badge variant={caregiver.availableNow ? "default" : "secondary"}>
                {caregiver.availableNow ? "Sim" : "Não"}
              </Badge>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium">Estatísticas de Visibilidade</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Visualizações</span>
                <span>-</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Contatos</span>
                <span>-</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contracts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconBriefcase className="h-5 w-5" />
            Contratos ({caregiver.contracts?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={contractColumns}
            data={caregiver.contracts || []}
            keyExtractor={(c) => c.id}
            emptyMessage="Nenhum contrato encontrado"
          />
        </CardContent>
      </Card>

      {/* Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconStar className="h-5 w-5" />
            Avaliações ({caregiver.reviews?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={reviewColumns}
            data={caregiver.reviews || []}
            keyExtractor={(r) => r.id}
            emptyMessage="Nenhuma avaliação encontrada"
          />
        </CardContent>
      </Card>
    </div>
  );
}
