"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/app-shell";
import { 
  IconToken, 
  IconWallet, 
  IconContract, 
  IconSearch, 
  IconFamily,
  IconCaregiver,
  IconStar,
  IconClock,
  IconArrowUp,
  IconArrowDown
} from "@/components/icons";
import { APP_NAME, TOKEN_SYMBOL } from "@/lib/constants";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-8 mx-auto">
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isFamily = session?.user?.role === "FAMILY";
  const isCaregiver = session?.user?.role === "CAREGIVER";

  // Mock data - in real app, fetch from API
  const stats = {
    tokenBalance: 2500,
    tokenValueEur: 25.0,
    activeContracts: 2,
    totalHours: 48,
    rating: 4.9,
    totalReviews: 23,
  };

  const recentActivity = [
    { type: "credit", description: "Ativação de conta", amount: 2500, date: "2024-01-15" },
    { type: "debit", description: "Taxa de contrato", amount: -500, date: "2024-01-14" },
    { type: "credit", description: "Gorjeta recebida", amount: 200, date: "2024-01-13" },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Olá, {session?.user?.name?.split(" ")[0] || "Usuário"}!
            </h1>
            <p className="text-muted-foreground">
              {isFamily ? "Painel Familiar" : "Painel do Cuidador"}
            </p>
          </div>
          <Badge variant={session?.user?.status === "ACTIVE" ? "default" : "secondary"}>
            {session?.user?.status === "ACTIVE" ? "Ativo" : "Pendente"}
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Token Balance */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-full">
                  <IconToken className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo {TOKEN_SYMBOL}</p>
                  <p className="text-2xl font-bold">{stats.tokenBalance.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">≈ €{stats.tokenValueEur.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Contracts */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-full">
                  <IconContract className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contratos Ativos</p>
                  <p className="text-2xl font-bold">{stats.activeContracts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hours */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-full">
                  <IconClock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Horas Trabalhadas</p>
                  <p className="text-2xl font-bold">{stats.totalHours}h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rating */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-full">
                  <IconStar className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avaliação</p>
                  <p className="text-2xl font-bold">{stats.rating}</p>
                  <p className="text-xs text-muted-foreground">{stats.totalReviews} avaliações</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 lg:grid-cols-2">
          {isFamily && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconSearch className="h-5 w-5" />
                  Buscar Cuidadores
                </CardTitle>
                <CardDescription>
                  Encontre profissionais verificados na sua região
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/app/search">Buscar Agora</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {isCaregiver && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconCaregiver className="h-5 w-5" />
                  Meu Perfil
                </CardTitle>
                <CardDescription>
                  Mantenha seu perfil atualizado para mais propostas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/app/profile">Editar Perfil</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconContract className="h-5 w-5" />
                Meus Contratos
              </CardTitle>
              <CardDescription>
                Gerencie contratos ativos e histórico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/app/contracts">Ver Contratos</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconWallet className="h-5 w-5" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      activity.type === "credit" 
                        ? "bg-green-500/10 text-green-500" 
                        : "bg-red-500/10 text-red-500"
                    }`}>
                      {activity.type === "credit" ? (
                        <IconArrowUp className="h-4 w-4" />
                      ) : (
                        <IconArrowDown className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{activity.date}</p>
                    </div>
                  </div>
                  <Badge variant={activity.type === "credit" ? "default" : "secondary"}>
                    {activity.type === "credit" ? "+" : ""}{activity.amount} {TOKEN_SYMBOL}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button asChild variant="ghost" className="w-full">
                <Link href="/app/wallet">Ver Histórico Completo</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
