"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/common/page-header";
import { StatusBadge } from "@/components/admin/common/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconArrowLeft,
  IconEdit,
  IconUserOff,
  IconUserCheck,
  IconEye,
  IconCoins,
  IconFileText,
  IconCreditCard,
  IconStar,
  IconActivity,
  IconMapPin,
  IconPhone,
  IconMail,
  IconCalendar,
} from "@/components/icons";
import Link from "next/link";

interface UserDetail {
  id: string;
  email: string;
  phone: string | null;
  name: string;
  role: "FAMILY" | "CAREGIVER" | "ADMIN";
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "INACTIVE";
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  createdAt: string;
  lastLoginAt: string | null;
  wallet: {
    address: string;
    balanceTokens: number;
    balanceEurCents: number;
  } | null;
  profileFamily: {
    elderName: string | null;
    elderAge: number | null;
    city: string | null;
    elderNeeds: string | null;
  } | null;
  profileCaregiver: {
    title: string | null;
    bio: string | null;
    city: string | null;
    totalContracts: number;
    averageRating: number;
    totalReviews: number;
  } | null;
  contractsCount: number;
  totalSpent: number;
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/admin/users/${userId}`);
        if (!response.ok) throw new Error("Failed to fetch user");
        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  const handleSuspend = async () => {
    const reason = prompt("Motivo da suspensão:");
    if (!reason) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error("Failed to suspend");
      router.refresh();
    } catch (error) {
      alert("Erro ao suspender usuário");
    }
  };

  const handleActivate = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/activate`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to activate");
      router.refresh();
    } catch (error) {
      alert("Erro ao ativar usuário");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48 md:col-span-2" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-slate-500">Usuário não encontrado</p>
        <Button variant="link" onClick={() => router.push("/admin/users")}>
          Voltar para lista
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detalhes do Usuário"
        breadcrumbs={[
          { label: "Usuários", href: "/admin/users" },
          { label: user.name },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/users">
                <IconArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
            {user.status === "ACTIVE" ? (
              <Button variant="destructive" onClick={handleSuspend}>
                <IconUserOff className="mr-2 h-4 w-4" />
                Suspender
              </Button>
            ) : (
              <Button onClick={handleActivate}>
                <IconUserCheck className="mr-2 h-4 w-4" />
                Ativar
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* User Info Card */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-cyan-100 text-cyan-700 text-2xl">
                  {user.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-xl font-bold">{user.name}</h2>
              <p className="text-sm text-slate-500">{user.email}</p>
              <div className="mt-2 flex gap-2">
                <Badge
                  className={
                    user.role === "FAMILY"
                      ? "bg-blue-100 text-blue-700"
                      : user.role === "CAREGIVER"
                      ? "bg-green-100 text-green-700"
                      : "bg-purple-100 text-purple-700"
                  }
                >
                  {user.role === "FAMILY"
                    ? "Família"
                    : user.role === "CAREGIVER"
                    ? "Cuidador"
                    : "Admin"}
                </Badge>
                <StatusBadge
                  status={
                    user.status === "ACTIVE"
                      ? "active"
                      : user.status === "SUSPENDED"
                      ? "suspended"
                      : "pending"
                  }
                />
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <IconMail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-2 text-slate-600">
                  <IconPhone className="h-4 w-4" />
                  <span>{user.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-600">
                <IconCalendar className="h-4 w-4" />
                <span>
                  Membro desde {new Date(user.createdAt).toLocaleDateString("pt-PT")}
                </span>
              </div>
              {user.lastLoginAt && (
                <div className="flex items-center gap-2 text-slate-600">
                  <IconActivity className="h-4 w-4" />
                  <span>
                    Último acesso:{" "}
                    {new Date(user.lastLoginAt).toLocaleDateString("pt-PT")}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">KYC</span>
                <StatusBadge
                  status={
                    user.verificationStatus === "VERIFIED"
                      ? "verified"
                      : user.verificationStatus === "PENDING"
                      ? "pending"
                      : "unverified"
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="md:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="wallet">Carteira</TabsTrigger>
              <TabsTrigger value="contracts">Contratos</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              {/* Stats */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-cyan-100 p-2">
                        <IconFileText className="h-5 w-5 text-cyan-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{user.contractsCount}</p>
                        <p className="text-sm text-slate-500">Contratos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-green-100 p-2">
                        <IconCoins className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {user.wallet?.balanceTokens?.toLocaleString() || 0}
                        </p>
                        <p className="text-sm text-slate-500">SENT</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-amber-100 p-2">
                        <IconCreditCard className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          €{(user.totalSpent / 100).toFixed(2)}
                        </p>
                        <p className="text-sm text-slate-500">Total gasto</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Profile Info */}
              {user.profileFamily && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Perfil Familiar</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {user.profileFamily.elderName && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Idoso</span>
                        <span>
                          {user.profileFamily.elderName}
                          {user.profileFamily.elderAge &&
                            ` (${user.profileFamily.elderAge} anos)`}
                        </span>
                      </div>
                    )}
                    {user.profileFamily.city && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Cidade</span>
                        <span>{user.profileFamily.city}</span>
                      </div>
                    )}
                    {user.profileFamily.elderNeeds && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Necessidades</span>
                        <span className="max-w-xs text-right">
                          {user.profileFamily.elderNeeds}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {user.profileCaregiver && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Perfil Cuidador</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {user.profileCaregiver.title && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Título</span>
                        <span>{user.profileCaregiver.title}</span>
                      </div>
                    )}
                    {user.profileCaregiver.city && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Cidade</span>
                        <span>{user.profileCaregiver.city}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Contratos</span>
                      <span>{user.profileCaregiver.totalContracts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Avaliação</span>
                      <span className="flex items-center gap-1">
                        <IconStar className="h-4 w-4 text-amber-500" />
                        {user.profileCaregiver.averageRating.toFixed(1)} (
                        {user.profileCaregiver.totalReviews} reviews)
                      </span>
                    </div>
                    {user.profileCaregiver.bio && (
                      <div className="pt-2">
                        <span className="text-slate-500">Bio</span>
                        <p className="mt-1">{user.profileCaregiver.bio}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="wallet" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Carteira</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user.wallet ? (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-sm text-slate-500">Saldo</p>
                          <p className="text-2xl font-bold">
                            {user.wallet.balanceTokens.toLocaleString()} SENT
                          </p>
                          <p className="text-sm text-slate-500">
                            ≈ €{(user.wallet.balanceEurCents / 100).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Endereço</p>
                          <p className="font-mono text-xs break-all">
                            {user.wallet.address}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-slate-500">Carteira não encontrada</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contracts" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-slate-500">
                    {user.contractsCount} contrato(s) encontrado(s)
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
