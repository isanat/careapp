"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/admin/common/page-header";
import { DataTable, Column } from "@/components/admin/common/data-table";
import { StatusBadge } from "@/components/admin/common/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  IconSearch,
  IconFilter,
  IconEye,
  IconUserOff,
  IconUserCheck,
  IconMoreHorizontal,
  IconPlus,
} from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  name: string;
  role: "FAMILY" | "CAREGIVER" | "ADMIN";
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "INACTIVE";
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  createdAt: string;
  lastLoginAt: string | null;
  walletBalance: number;
  contractsCount: number;
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [roleFilter, setRoleFilter] = useState(searchParams.get("role") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(pagination.page));
      params.set("limit", String(pagination.limit));
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error("Failed to fetch users");
      const data: UsersResponse = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSuspend = async (userId: string) => {
    const reason = prompt("Motivo da suspensão:");
    if (!reason) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error("Failed to suspend user");
      fetchUsers();
    } catch (error) {
      alert("Erro ao suspender usuário");
    }
  };

  const handleActivate = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/activate`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to activate user");
      fetchUsers();
    } catch (error) {
      alert("Erro ao ativar usuário");
    }
  };

  const getRoleBadge = (role: User["role"]) => {
    const variants: Record<User["role"], string> = {
      FAMILY: "bg-blue-100 text-blue-700",
      CAREGIVER: "bg-green-100 text-green-700",
      ADMIN: "bg-purple-100 text-purple-700",
    };
    const labels: Record<User["role"], string> = {
      FAMILY: "Família",
      CAREGIVER: "Cuidador",
      ADMIN: "Admin",
    };
    return (
      <Badge className={variants[role]} variant="secondary">
        {labels[role]}
      </Badge>
    );
  };

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "Usuário",
      render: (user) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-cyan-100 text-cyan-700 text-xs">
              {user.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Função",
      render: (user) => getRoleBadge(user.role),
    },
    {
      key: "status",
      header: "Status",
      render: (user) => (
        <StatusBadge
          status={
            user.status === "ACTIVE"
              ? "active"
              : user.status === "SUSPENDED"
              ? "suspended"
              : user.status === "PENDING"
              ? "pending"
              : "inactive"
          }
        />
      ),
    },
    {
      key: "verificationStatus",
      header: "KYC",
      render: (user) => (
        <StatusBadge
          status={
            user.verificationStatus === "VERIFIED"
              ? "verified"
              : user.verificationStatus === "PENDING"
              ? "pending"
              : user.verificationStatus === "REJECTED"
              ? "rejected"
              : "unverified"
          }
        />
      ),
    },
    {
      key: "walletBalance",
      header: "Carteira",
      render: (user) => (
        <span className="text-sm">
          {user.walletBalance?.toLocaleString() || 0} SENT
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Criado",
      render: (user) => (
        <span className="text-sm text-slate-500">
          {new Date(user.createdAt).toLocaleDateString("pt-PT")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      render: (user) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <IconMoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/users/${user.id}`}>
                <IconEye className="mr-2 h-4 w-4" /> Ver Detalhes
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {user.status === "ACTIVE" ? (
              <DropdownMenuItem
                onClick={() => handleSuspend(user.id)}
                className="text-red-600"
              >
                <IconUserOff className="mr-2 h-4 w-4" /> Suspender
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => handleActivate(user.id)}>
                <IconUserCheck className="mr-2 h-4 w-4" /> Ativar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários"
        description="Gerencie todos os usuários da plataforma"
        actions={
          <Button asChild>
            <Link href="/admin/users/new">
              <IconPlus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Link>
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="FAMILY">Família</SelectItem>
                <SelectItem value="CAREGIVER">Cuidador</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ACTIVE">Ativo</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="SUSPENDED">Suspenso</SelectItem>
                <SelectItem value="INACTIVE">Inativo</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => fetchUsers()}>Filtrar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <DataTable
        columns={columns}
        data={users}
        keyExtractor={(user) => user.id}
        loading={loading}
        onRowClick={(user) => router.push(`/admin/users/${user.id}`)}
        pagination={{
          ...pagination,
          onPageChange: (page) => setPagination((p) => ({ ...p, page })),
        }}
      />
    </div>
  );
}
