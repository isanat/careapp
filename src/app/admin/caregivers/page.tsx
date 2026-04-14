"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/common/page-header";
import { DataTable, Column } from "@/components/admin/common/data-table";
import { StatusBadge } from "@/components/admin/common/status-badge";
import { StatsCard } from "@/components/admin/common/stats-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  IconSearch,
  IconStar,
  IconBriefcase,
  IconShield,
  IconUser,
  IconEye,
  IconCheck,
  IconX,
  IconLoader2,
  IconStarOff
} from "@/components/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api-client";

interface Caregiver {
  id: string;
  email: string;
  name: string;
  title: string | null;
  city: string | null;
  experienceYears: number | null;
  totalContracts: number;
  averageRating: number;
  totalReviews: number;
  verificationStatus: string;
  featured: number;
  availableNow: number;
  createdAt: string;
}

interface Stats {
  total: number;
  pending: number;
  verified: number;
  featured: number;
}

export default function AdminCaregiversPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, verified: 0, featured: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });
  
  // Reject dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectCaregiverId, setRejectCaregiverId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchCaregivers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      params.set("page", pagination.page.toString());
      params.set("limit", pagination.limit.toString());

      const response = await apiFetch(`/api/admin/caregivers?${params}`);
      const data = await response.json();
      setCaregivers(data.caregivers || []);
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
      }));

      // Calculate stats from all caregivers
      const allResponse = await apiFetch('/api/admin/caregivers?limit=1000');
      const allData = await allResponse.json();
      const allCaregivers = allData.caregivers || [];
      setStats({
        total: allCaregivers.length,
        pending: allCaregivers.filter((c: Caregiver) => c.verificationStatus === 'PENDING').length,
        verified: allCaregivers.filter((c: Caregiver) => c.verificationStatus === 'VERIFIED').length,
        featured: allCaregivers.filter((c: Caregiver) => c.featured === 1).length,
      });
    } catch (error) {
      console.error("Error fetching caregivers:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar cuidadores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaregivers();
  }, [statusFilter, featuredFilter, pagination.page]);

  const handleVerify = async (caregiverId: string, action: 'verify' | 'reject') => {
    if (action === 'reject') {
      // Open reject dialog
      setRejectCaregiverId(caregiverId);
      setRejectReason("");
      setRejectDialogOpen(true);
      return;
    }

    setActionLoading(caregiverId);
    try {
      const response = await apiFetch('/api/admin/caregivers/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caregiverId, action }),
      });

      if (!response.ok) throw new Error('Failed to update');

      toast({
        title: "Sucesso",
        description: "KYC aprovado com sucesso",
      });
      fetchCaregivers();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar cuidador",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectCaregiverId || !rejectReason.trim()) {
      toast({
        title: "Erro",
        description: "Informe o motivo da rejeição",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(rejectCaregiverId);
    try {
      const response = await apiFetch('/api/admin/caregivers/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          caregiverId: rejectCaregiverId, 
          action: 'reject', 
          reason: rejectReason 
        }),
      });

      if (!response.ok) throw new Error('Failed to update');

      toast({
        title: "Sucesso",
        description: "KYC rejeitado",
      });
      setRejectDialogOpen(false);
      setRejectCaregiverId(null);
      setRejectReason("");
      fetchCaregivers();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao rejeitar cuidador",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleFeature = async (caregiverId: string, featured: boolean) => {
    setActionLoading(caregiverId);
    try {
      const response = await apiFetch(`/api/admin/caregivers/${caregiverId}/feature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured }),
      });

      if (!response.ok) throw new Error('Failed to update');

      toast({
        title: "Sucesso",
        description: featured ? "Cuidador destacado" : "Destaque removido",
      });
      fetchCaregivers();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar destaque",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadgeVariant = (status: string): "pending" | "verified" | "unverified" | "rejected" => {
    switch (status) {
      case 'VERIFIED': return 'verified';
      case 'PENDING': return 'pending';
      case 'REJECTED': return 'rejected';
      default: return 'unverified';
    }
  };

  const columns: Column<Caregiver>[] = [
    {
      key: "name",
      header: "Cuidador",
      render: (c) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${c.name}`} />
            <AvatarFallback>{c.name?.charAt(0) || "C"}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{c.name}</p>
              {c.featured === 1 && (
                <Badge variant="default" className="bg-warning text-xs">
                  <IconStar className="h-3 w-3 mr-1" />
                  Destaque
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{c.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "title",
      header: "Título",
      render: (c) => <span className="text-sm">{c.title || "-"}</span>,
    },
    {
      key: "city",
      header: "Cidade",
      render: (c) => <span className="text-sm">{c.city || "-"}</span>,
    },
    {
      key: "verificationStatus",
      header: "KYC",
      render: (c) => <StatusBadge status={getStatusBadgeVariant(c.verificationStatus)} />,
    },
    {
      key: "averageRating",
      header: "Avaliação",
      render: (c) => (
        <div className="flex items-center gap-1">
          <IconStar className="h-4 w-4 text-warning fill-warning" />
          <span className="font-medium">{c.averageRating?.toFixed(1) || "-"}</span>
          <span className="text-xs text-muted-foreground">({c.totalReviews || 0})</span>
        </div>
      ),
    },
    {
      key: "totalContracts",
      header: "Contratos",
      render: (c) => (
        <Badge variant="secondary">{c.totalContracts || 0}</Badge>
      ),
    },
    {
      key: "actions",
      header: "Ações",
      className: "w-40",
      render: (c) => (
        <div className="flex items-center gap-1">
          {c.verificationStatus === 'PENDING' && (
            <>
              <Button
                size="sm"
                variant="default"
                className="h-8 w-8 p-0 bg-success hover:bg-success/90"
                onClick={() => handleVerify(c.id, 'verify')}
                disabled={actionLoading === c.id}
                title="Aprovar KYC"
              >
                {actionLoading === c.id ? (
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <IconCheck className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-8 w-8 p-0"
                onClick={() => handleVerify(c.id, 'reject')}
                disabled={actionLoading === c.id}
                title="Rejeitar KYC"
              >
                <IconX className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => handleFeature(c.id, c.featured !== 1)}
            disabled={actionLoading === c.id}
            title={c.featured === 1 ? "Remover destaque" : "Destacar cuidador"}
          >
            {c.featured === 1 ? (
              <IconStarOff className="h-4 w-4 text-warning" />
            ) : (
              <IconStar className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => router.push(`/admin/caregivers/${c.id}`)}
            title="Ver detalhes"
          >
            <IconEye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cuidadores"
        description="Gerencie cuidadores e verificações KYC"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total de Cuidadores"
          value={stats.total}
          icon={<IconUser className="h-5 w-5" />}
        />
        <StatsCard
          title="KYC Pendente"
          value={stats.pending}
          variant="warning"
          icon={<IconShield className="h-5 w-5" />}
        />
        <StatsCard
          title="Verificados"
          value={stats.verified}
          variant="success"
          icon={<IconCheck className="h-5 w-5" />}
        />
        <StatsCard
          title="Em Destaque"
          value={stats.featured}
          icon={<IconStar className="h-5 w-5" />}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                onKeyDown={(e) => e.key === 'Enter' && fetchCaregivers()}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status KYC" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="VERIFIED">Verificado</SelectItem>
                <SelectItem value="UNVERIFIED">Não verificado</SelectItem>
                <SelectItem value="REJECTED">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Destaque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="featured">Em destaque</SelectItem>
                <SelectItem value="not_featured">Sem destaque</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchCaregivers}>
              <IconSearch className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={caregivers}
        keyExtractor={(c) => c.id}
        loading={loading}
        emptyMessage="Nenhum cuidador encontrado"
        pagination={{
          page: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          onPageChange: (page) => setPagination(prev => ({ ...prev, page })),
        }}
      />

      {/* Reject KYC Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Verificação KYC</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. O cuidador será notificado.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Ex: Documento ilegível, dados não conferem..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectCaregiverId(null);
                setRejectReason("");
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectReason.trim() || actionLoading !== null}
            >
              {actionLoading ? (
                <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
