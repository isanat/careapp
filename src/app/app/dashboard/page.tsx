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
  IconInbox,
  IconEuro,
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
        <div className="space-y-4 animate-pulse">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        </div>
      </AppShell>
    );
  }

  const balanceEur = ((stats?.tokenValueEur ?? 0) / 100).toFixed(2);
  const firstName = session?.user?.name?.split(" ")[0] || "";

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t.dashboard.welcome}, {firstName}!
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isFamily ? t.dashboard.familyPanel : t.dashboard.caregiverPanel}
            </p>
          </div>
          <Badge
            className={session?.user?.status === "ACTIVE"
              ? "bg-success/10 text-success border-success/20 hover:bg-success/20"
              : "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20"
            }
            variant="outline"
          >
            {session?.user?.status === "ACTIVE" ? t.dashboard.status.active : t.dashboard.status.pending}
          </Badge>
        </div>

        {/* Balance Card - Gradient */}
        <Link href="/app/wallet" className="block">
          <div className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-soft-md ${isFamily ? 'gradient-primary' : 'gradient-violet'}`}>
            <div className="relative z-10">
              <p className="text-sm font-medium opacity-90">{t.wallet.balance}</p>
              <p className="text-3xl font-bold mt-1">
                {"\u20AC"}{balanceEur}
              </p>
              <p className="text-xs opacity-75 mt-1">
                {stats?.tokenBalance?.toLocaleString() || 0} tokens
              </p>
            </div>
            {/* Decorative circles */}
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
            <div className="absolute -right-2 -bottom-6 h-32 w-32 rounded-full bg-white/5" />
          </div>
        </Link>

        {/* Stats Grid - 2x2 with icons */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface rounded-2xl p-4 shadow-card border border-border/50 hover:shadow-card-hover transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <IconContract className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold">{stats?.activeContracts || 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t.nav.contracts}</p>
          </div>

          <div className="bg-surface rounded-2xl p-4 shadow-card border border-border/50 hover:shadow-card-hover transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-xl bg-secondary/10 flex items-center justify-center">
                <IconClock className="h-4 w-4 text-secondary" />
              </div>
            </div>
            <p className="text-2xl font-bold">{stats?.totalHours || 0}h</p>
            <p className="text-xs text-muted-foreground mt-0.5">Horas</p>
          </div>

          <div className="bg-surface rounded-2xl p-4 shadow-card border border-border/50 hover:shadow-card-hover transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <IconStar className="h-4 w-4 text-amber-500" />
              </div>
            </div>
            <p className="text-2xl font-bold">{stats?.rating?.toFixed(1) || '-'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Nota</p>
          </div>

          <div className="bg-surface rounded-2xl p-4 shadow-card border border-border/50 hover:shadow-card-hover transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-xl bg-success/10 flex items-center justify-center">
                <IconEuro className="h-4 w-4 text-success" />
              </div>
            </div>
            <p className="text-2xl font-bold">{stats?.tokenBalance?.toLocaleString() || 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Tokens</p>
          </div>
        </div>

        {/* Quick Actions - Large touchable buttons */}
        <div className="grid grid-cols-2 gap-3">
          {isFamily && (
            <Link href="/app/search" className="block">
              <div className="bg-surface rounded-2xl p-4 shadow-card border border-border/50 hover:shadow-card-hover hover:border-primary/30 transition-all group">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <IconSearch className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-semibold">{t.nav.searchCaregivers}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Encontrar cuidador</p>
              </div>
            </Link>
          )}
          {isCaregiver && (
            <Link href="/app/proposals" className="block">
              <div className="bg-surface rounded-2xl p-4 shadow-card border border-border/50 hover:shadow-card-hover hover:border-secondary/30 transition-all group">
                <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center mb-3 group-hover:bg-secondary/20 transition-colors">
                  <IconInbox className="h-5 w-5 text-secondary" />
                </div>
                <p className="text-sm font-semibold">Propostas</p>
                <p className="text-xs text-muted-foreground mt-0.5">Ver solicitacoes</p>
              </div>
            </Link>
          )}
          <Link href="/app/contracts" className="block">
            <div className="bg-surface rounded-2xl p-4 shadow-card border border-border/50 hover:shadow-card-hover hover:border-accent/30 transition-all group">
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent/20 transition-colors">
                <IconContract className="h-5 w-5 text-accent" />
              </div>
              <p className="text-sm font-semibold">{t.contracts.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t.dashboard.viewAll}</p>
            </div>
          </Link>
        </div>

        {/* Next Steps - if any */}
        {pendingSteps.length > 0 && (
          <div className="bg-surface rounded-2xl p-4 shadow-card border border-warning/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-xl bg-warning/10 flex items-center justify-center">
                <IconAlertCircle className="h-4 w-4 text-warning" />
              </div>
              <span className="text-sm font-semibold">{t.dashboard.nextSteps.title}</span>
            </div>
            <div className="space-y-2">
              {pendingSteps.map((step) => (
                <Link key={step.key} href={step.href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group">
                  <step.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="flex-1 text-sm">{step.label}</span>
                  <IconChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All set message */}
        {pendingSteps.length === 0 && (
          <div className="bg-success/5 rounded-2xl p-4 border border-success/20 flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-success/10 flex items-center justify-center">
              <IconCheck className="h-4 w-4 text-success" />
            </div>
            <span className="text-sm text-success font-medium">{t.dashboard.allSet}</span>
          </div>
        )}

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-semibold">{t.dashboard.recentActivity}</span>
            <Link href="/app/wallet" className="text-sm text-primary font-medium hover:underline">
              {t.dashboard.viewAll}
            </Link>
          </div>

          {recentActivity.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-surface rounded-xl shadow-card border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                      activity.type === "credit"
                        ? "bg-success/10"
                        : "bg-error/10"
                    }`}>
                      {activity.type === "credit"
                        ? <IconArrowUp className="h-4 w-4 text-success" />
                        : <IconArrowDown className="h-4 w-4 text-error" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium truncate max-w-[180px]">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{new Date(activity.date).toLocaleDateString('pt-PT')}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${
                    activity.type === "credit" ? "text-success" : "text-error"
                  }`}>
                    {activity.type === "credit" ? "+" : ""}{activity.amount}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-surface rounded-2xl shadow-card border border-border/50">
              <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                <IconWallet className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{t.dashboard.noActivity}</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
