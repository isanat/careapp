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
      setStats({ activeContracts: 0, totalHours: 0, rating: 0, totalReviews: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  const isFamily = session?.user?.role === "FAMILY";
  const isCaregiver = session?.user?.role === "CAREGIVER";
  // Only FAMILY users need to pay for activation - CAREGIVER registration is FREE
  const needsPayment = session?.user?.status === "PENDING" && isFamily;
  const needsKYC = userStatus?.verificationStatus !== "VERIFIED";
  const needsProfile = !userStatus?.profileComplete;

  const pendingSteps: Array<{ key: string; label: string; href: string; icon: ComponentType<{ className?: string }> }> = [];
  if (needsPayment) pendingSteps.push({ key: 'payment', label: t.dashboard.nextSteps.payment, href: '/auth/payment', icon: IconWallet });
  if (needsKYC) pendingSteps.push({ key: 'kyc', label: t.dashboard.nextSteps.kyc, href: '/auth/kyc', icon: IconShield });
  if (needsProfile) pendingSteps.push({ key: 'profile', label: t.dashboard.nextSteps.profile, href: '/app/profile', icon: IconCaregiver });

  if (status === "loading" || isLoading) {
    return (
      <AppShell>
        <div className="space-y-3 animate-pulse">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <div className="grid grid-cols-4 gap-2">
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
          </div>
        </div>
      </AppShell>
    );
  }

  const firstName = session?.user?.name?.split(" ")[0] || "";

  return (
    <AppShell>
      <div className="space-y-3">
        {/* Welcome + Status inline */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">
            {t.dashboard.welcome}, {firstName}!
          </h1>
          <Badge
            className={session?.user?.status === "ACTIVE"
              ? "bg-success/10 text-success border-success/20"
              : "bg-warning/10 text-warning border-warning/20"
            }
            variant="outline"
          >
            {session?.user?.status === "ACTIVE" ? t.dashboard.status.active : t.dashboard.status.pending}
          </Badge>
        </div>

        {/* Stats - 4 columns, ultra compact */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-surface rounded-xl p-2.5 border border-border/50 text-center">
            <IconContract className="h-4 w-4 text-primary mx-auto" />
            <p className="text-lg font-bold mt-0.5">{stats?.activeContracts || 0}</p>
            <p className="text-[10px] text-muted-foreground">{t.nav.contracts}</p>
          </div>
          <div className="bg-surface rounded-xl p-2.5 border border-border/50 text-center">
            <IconClock className="h-4 w-4 text-secondary mx-auto" />
            <p className="text-lg font-bold mt-0.5">{stats?.totalHours || 0}h</p>
            <p className="text-[10px] text-muted-foreground">Horas</p>
          </div>
          <div className="bg-surface rounded-xl p-2.5 border border-border/50 text-center">
            <IconStar className="h-4 w-4 text-amber-500 mx-auto" />
            <p className="text-lg font-bold mt-0.5">{stats?.rating?.toFixed(1) || '-'}</p>
            <p className="text-[10px] text-muted-foreground">Nota</p>
          </div>
          <div className="bg-surface rounded-xl p-2.5 border border-border/50 text-center">
            <IconEuro className="h-4 w-4 text-success mx-auto" />
            <p className="text-lg font-bold mt-0.5">{stats?.totalReviews || 0}</p>
            <p className="text-[10px] text-muted-foreground">Reviews</p>
          </div>
        </div>

        {/* Quick Actions - horizontal row */}
        <div className="flex gap-2">
          {isFamily && (
            <Link href="/app/search" className="flex-1">
              <div className="bg-surface rounded-xl p-3 border border-border/50 hover:border-primary/30 transition-all flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <IconSearch className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{t.nav.searchCaregivers}</p>
                  <p className="text-[10px] text-muted-foreground">Encontrar</p>
                </div>
              </div>
            </Link>
          )}
          {isCaregiver && (
            <Link href="/app/proposals" className="flex-1">
              <div className="bg-surface rounded-xl p-3 border border-border/50 hover:border-secondary/30 transition-all flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                  <IconInbox className="h-4 w-4 text-secondary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">Propostas</p>
                  <p className="text-[10px] text-muted-foreground">Solicitacoes</p>
                </div>
              </div>
            </Link>
          )}
          <Link href="/app/contracts" className="flex-1">
            <div className="bg-surface rounded-xl p-3 border border-border/50 hover:border-accent/30 transition-all flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <IconContract className="h-4 w-4 text-accent-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{t.contracts.title}</p>
                <p className="text-[10px] text-muted-foreground">{t.dashboard.viewAll}</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Next Steps - compact list */}
        {pendingSteps.length > 0 && (
          <div className="bg-warning/5 rounded-xl p-3 border border-warning/20">
            <div className="flex items-center gap-2 mb-2">
              <IconAlertCircle className="h-4 w-4 text-warning" />
              <span className="text-xs font-semibold">{t.dashboard.nextSteps.title}</span>
            </div>
            {pendingSteps.map((step) => (
              <Link key={step.key} href={step.href} className="flex items-center gap-2 py-1.5 hover:bg-warning/5 rounded-lg px-1 transition-colors">
                <step.icon className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 text-xs">{step.label}</span>
                <IconChevronRight className="h-3 w-3 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}

        {/* All set - single line */}
        {pendingSteps.length === 0 && (
          <div className="bg-success/5 rounded-xl px-3 py-2 border border-success/20 flex items-center gap-2">
            <IconCheck className="h-4 w-4 text-success" />
            <span className="text-xs text-success font-medium">{t.dashboard.allSet}</span>
          </div>
        )}

        {/* Platform Benefits - compact 2-col */}
        <div className="bg-surface rounded-xl p-3 border border-primary/10">
          <div className="flex items-center gap-2 mb-2">
            <IconShield className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold">Beneficios da Plataforma</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {(isFamily
              ? [
                  { title: "Cuidadores Verificados", sub: "KYC e antecedentes" },
                  { title: "Contratos Juridicos", sub: "Assinatura digital" },
                  { title: "Pagamento Seguro", sub: "Protecao financeira" },
                  { title: "Recibos Fiscais", sub: "Validos para IRS" },
                ]
              : [
                  { title: "Pagamento Garantido", sub: "Receba pontualmente" },
                  { title: "Perfil Verificado", sub: "Mais familias confiam" },
                  { title: "Reputacao Publica", sub: "Avaliacoes verificaveis" },
                  { title: "Protecao Juridica", sub: "Contrato formal" },
                ]
            ).map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 py-1 px-2 bg-muted/30 rounded-lg">
                <IconCheck className="h-3 w-3 text-success shrink-0" />
                <span className="text-[10px] font-medium truncate">{item.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity - compact list */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">{t.dashboard.recentActivity}</span>
            <Link href="/app/payments" className="text-xs text-primary font-medium">
              {t.dashboard.viewAll}
            </Link>
          </div>

          {recentActivity.length > 0 ? (
            <div className="space-y-1">
              {recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 bg-surface rounded-lg border border-border/30">
                  <div className="flex items-center gap-2">
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                      activity.type === "credit" ? "bg-success/10" : "bg-error/10"
                    }`}>
                      {activity.type === "credit"
                        ? <IconArrowUp className="h-3.5 w-3.5 text-success" />
                        : <IconArrowDown className="h-3.5 w-3.5 text-error" />
                      }
                    </div>
                    <div>
                      <p className="text-xs font-medium truncate max-w-[160px]">{activity.description}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(activity.date).toLocaleDateString('pt-PT')}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold ${
                    activity.type === "credit" ? "text-success" : "text-error"
                  }`}>
                    {activity.type === "credit" ? "+" : ""}{activity.amount}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-surface rounded-xl border border-border/30">
              <IconWallet className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">{t.dashboard.noActivity}</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
