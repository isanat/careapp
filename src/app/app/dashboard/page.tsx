"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, ComponentType } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/app-shell";
import { 
  IconToken, 
  IconContract, 
  IconSearch, 
  IconStar,
  IconClock,
  IconArrowUp,
  IconArrowDown,
  IconShield,
  IconAlertCircle,
  IconCheck,
  IconChevronRight,
  IconWallet,
  IconCaregiver,
} from "@/components/icons";
import { useI18n } from "@/lib/i18n";
import { apiFetch } from "@/lib/api-client";

interface Stats {
  tokenBalance: number;
  tokenValueEur: number;
  activeContracts: number;
  totalHours: number;
  rating: number;
  totalReviews: number;
}

interface Activity {
  type: string;
  description: string;
  amount: number;
  date: string;
}

interface UserStatus {
  status: string;
  verificationStatus: string;
  hasWallet: boolean;
  profileComplete: boolean;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { t } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") fetchStats();
  }, [status]);

  const fetchStats = async () => {
    try {
      const response = await apiFetch('/api/user/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentActivity(data.recentActivity || []);
        setUserStatus(data.userStatus || null);
      }
    } catch {
      setStats({ tokenBalance: 0, tokenValueEur: 0, activeContracts: 0, totalHours: 0, rating: 0, totalReviews: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  const isFamily = session?.user?.role === "FAMILY";
  const isCaregiver = session?.user?.role === "CAREGIVER";
  const needsPayment = session?.user?.status === "PENDING";
  const needsKYC = userStatus?.verificationStatus !== "VERIFIED";
  const needsProfile = !userStatus?.profileComplete;

  const pendingSteps: Array<{ key: string; label: string; href: string; icon: ComponentType<{ className?: string }> }> = [];
  if (needsPayment) pendingSteps.push({ key: 'payment', label: t.dashboard.nextSteps.payment, href: '/auth/payment', icon: IconWallet });
  if (needsKYC) pendingSteps.push({ key: 'kyc', label: t.dashboard.nextSteps.kyc, href: '/auth/kyc', icon: IconShield });
  if (needsProfile) pendingSteps.push({ key: 'profile', label: t.dashboard.nextSteps.profile, href: '/app/profile', icon: IconCaregiver });

  if (status === "loading" || isLoading) {
    return (
      <AppShell>
        <div className="space-y-2 p-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-3">
        {/* Header compacto */}
        <div className="flex items-center justify-between px-4 py-3 sticky top-0 z-10 bg-background border-b">
          <div>
            <h1 className="text-lg font-semibold">
              {t.dashboard.welcome}, {session?.user?.name?.split(" ")[0]}!
            </h1>
            <p className="text-xs text-muted-foreground">
              {isFamily ? t.dashboard.familyPanel : t.dashboard.caregiverPanel}
            </p>
          </div>
          <Badge variant={session?.user?.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">
            {session?.user?.status === "ACTIVE" ? t.dashboard.status.active : t.dashboard.status.pending}
          </Badge>
        </div>

        {/* Next Steps - compacto */}
        {pendingSteps.length > 0 && (
          <div className="mx-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <IconAlertCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{t.dashboard.nextSteps.title}</span>
            </div>
            <div className="space-y-1">
              {pendingSteps.map((step) => (
                <Link key={step.key} href={step.href} className="flex items-center gap-2 p-2 rounded-md hover:bg-primary/10">
                  <step.icon className="h-4 w-4 text-primary" />
                  <span className="flex-1 text-sm">{step.label}</span>
                  <IconChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All set - compacto */}
        {pendingSteps.length === 0 && (
          <div className="mx-4 p-3 rounded-lg bg-green-500/5 border border-green-500/20 flex items-center gap-2">
            <IconCheck className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600">{t.dashboard.allSet}</span>
          </div>
        )}

        {/* Stats Grid - compacto */}
        <div className="px-4 grid grid-cols-4 gap-2">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-2.5 text-center">
            <IconToken className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold">{stats?.tokenBalance?.toLocaleString() || 0}</p>
            <p className="text-[10px] text-muted-foreground">Tokens</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2.5 text-center">
            <IconContract className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold">{stats?.activeContracts || 0}</p>
            <p className="text-[10px] text-muted-foreground">Contratos</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2.5 text-center">
            <IconClock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold">{stats?.totalHours || 0}h</p>
            <p className="text-[10px] text-muted-foreground">Horas</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2.5 text-center">
            <IconStar className="h-4 w-4 mx-auto mb-1 text-yellow-500" />
            <p className="text-lg font-bold">{stats?.rating?.toFixed(1) || '-'}</p>
            <p className="text-[10px] text-muted-foreground">Nota</p>
          </div>
        </div>

        {/* Quick Actions - compacto */}
        <div className="px-4 grid grid-cols-2 gap-2">
          {isFamily && (
            <Link href="/app/search" className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50">
              <IconSearch className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">{t.nav.searchCaregivers}</p>
                <p className="text-[10px] text-muted-foreground">Encontrar cuidador</p>
              </div>
            </Link>
          )}
          {isCaregiver && (
            <Link href="/app/proposals" className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50">
              <IconContract className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Propostas</p>
                <p className="text-[10px] text-muted-foreground">Ver solicitações</p>
              </div>
            </Link>
          )}
          <Link href="/app/contracts" className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50">
            <IconContract className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{t.contracts.title}</p>
              <p className="text-[10px] text-muted-foreground">{t.dashboard.viewAll}</p>
            </div>
          </Link>
        </div>

        {/* Recent Activity - compacto */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{t.dashboard.recentActivity}</span>
            <Link href="/app/wallet" className="text-xs text-primary">{t.dashboard.viewAll}</Link>
          </div>
          
          {recentActivity.length > 0 ? (
            <div className="space-y-1">
              {recentActivity.slice(0, 3).map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-full ${activity.type === "credit" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                      {activity.type === "credit" ? <IconArrowUp className="h-3 w-3" /> : <IconArrowDown className="h-3 w-3" />}
                    </div>
                    <div>
                      <p className="text-xs font-medium truncate max-w-[140px]">{activity.description}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(activity.date).toLocaleDateString('pt-PT')}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${activity.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                    {activity.type === "credit" ? "+" : ""}{activity.amount}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg">
              <IconWallet className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">{t.dashboard.noActivity}</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
