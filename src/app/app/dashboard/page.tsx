"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, ComponentType } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/app-shell";
import { BloomCard, BloomBadge, BloomSectionHeader, BloomEmpty } from "@/components/bloom";
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
      <div className="space-y-6">
        {/* Welcome + Status inline - Bloom Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-black text-foreground uppercase">
              {t.dashboard.welcome}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{firstName}</p>
          </div>
          <BloomBadge variant={session?.user?.status === "ACTIVE" ? "success" : "warning"}>
            {session?.user?.status === "ACTIVE" ? t.dashboard.status.active : t.dashboard.status.pending}
          </BloomBadge>
        </div>

        {/* Stats - 4 columns Bloom pattern */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <BloomCard interactive>
            <div className="flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <IconContract className="h-5 w-5 text-primary" />
              </div>
              <p className="text-xl sm:text-2xl font-display font-black text-foreground tracking-tighter">{stats?.activeContracts || 0}</p>
              <p className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest mt-2">{t.nav.contracts}</p>
            </div>
          </BloomCard>
          <BloomCard interactive>
            <div className="flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center mb-3">
                <IconClock className="h-5 w-5 text-secondary" />
              </div>
              <p className="text-xl sm:text-2xl font-display font-black text-foreground tracking-tighter">{stats?.totalHours || 0}h</p>
              <p className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest mt-2">Horas</p>
            </div>
          </BloomCard>
          <BloomCard interactive>
            <div className="flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center mb-3">
                <IconStar className="h-5 w-5 text-info" />
              </div>
              <p className="text-xl sm:text-2xl font-display font-black text-foreground tracking-tighter">{stats?.rating?.toFixed(1) || '-'}</p>
              <p className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest mt-2">Nota</p>
            </div>
          </BloomCard>
          <BloomCard interactive>
            <div className="flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center mb-3">
                <IconEuro className="h-5 w-5 text-success" />
              </div>
              <p className="text-xl sm:text-2xl font-display font-black text-foreground tracking-tighter">{stats?.totalReviews || 0}</p>
              <p className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest mt-2">Reviews</p>
            </div>
          </BloomCard>
        </div>

        {/* Quick Actions - horizontal row Bloom */}
        <div className="flex flex-col sm:flex-row gap-4">
          {isFamily && (
            <Link href="/app/search" className="sm:flex-1">
              <BloomCard interactive className="h-full">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <IconSearch className="h-6 w-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{t.nav.searchCaregivers}</p>
                    <p className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest">Encontrar</p>
                  </div>
                </div>
              </BloomCard>
            </Link>
          )}
          {isCaregiver && (
            <Link href="/app/proposals" className="sm:flex-1">
              <BloomCard interactive className="h-full">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <IconInbox className="h-6 w-6 text-secondary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">Propostas</p>
                    <p className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest">Solicitacoes</p>
                  </div>
                </div>
              </BloomCard>
            </Link>
          )}
          <Link href="/app/contracts" className="sm:flex-1">
            <BloomCard interactive className="h-full">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <IconContract className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{t.contracts.title}</p>
                  <p className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest">{t.dashboard.viewAll}</p>
                </div>
              </div>
            </BloomCard>
          </Link>
        </div>

        {/* Next Steps - Bloom style */}
        {pendingSteps.length > 0 && (
          <BloomCard topBar topBarColor="bg-warning">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <IconAlertCircle className="h-5 w-5 text-warning" />
                <h3 className="text-sm font-display font-black text-foreground uppercase">{t.dashboard.nextSteps.title}</h3>
              </div>
              <div className="space-y-2">
                {pendingSteps.map((step) => (
                  <Link key={step.key} href={step.href} className="flex items-center gap-3 py-2.5 px-3 hover:bg-muted/50 rounded-lg transition-colors">
                    <step.icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 text-sm font-medium text-foreground">{step.label}</span>
                    <IconChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          </BloomCard>
        )}

        {/* All set - Bloom style */}
        {pendingSteps.length === 0 && (
          <BloomCard topBar topBarColor="bg-success" interactive>
            <div className="flex items-center gap-3">
              <IconCheck className="h-6 w-6 text-success flex-shrink-0" />
              <span className="text-sm font-semibold text-success">{t.dashboard.allSet}</span>
            </div>
          </BloomCard>
        )}

        {/* Platform Benefits - Bloom style */}
        <BloomCard topBar>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <IconShield className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-display font-black text-foreground uppercase">Beneficios</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
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
              <div key={i} className="flex items-center gap-2 py-2 px-3 bg-muted/30 rounded-lg">
                <IconCheck className="h-4 w-4 text-success shrink-0" />
                <span className="text-xs font-medium truncate">{item.title}</span>
              </div>
            ))}
          </div>
        </BloomCard>

        {/* Recent Activity - Bloom style */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-black text-foreground uppercase">{t.dashboard.recentActivity}</h2>
            <Link href="/app/payments" className="text-[9px] font-display font-bold text-primary uppercase tracking-widest hover:text-primary/80 transition-colors">
              {t.dashboard.viewAll}
            </Link>
          </div>

          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.slice(0, 5).map((activity, index) => (
                <BloomCard key={index} interactive>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center font-display font-bold ${
                        activity.type === "credit" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                      }`}>
                        {activity.type === "credit"
                          ? <IconArrowUp className="h-5 w-5" />
                          : <IconArrowDown className="h-5 w-5" />
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{activity.description}</p>
                        <p className="text-[9px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest mt-0.5">{new Date(activity.date).toLocaleDateString('pt-PT')}</p>
                      </div>
                    </div>
                    <span className={`text-sm sm:text-base font-display font-black tracking-tighter flex-shrink-0 ml-4 ${
                      activity.type === "credit" ? "text-success" : "text-destructive"
                    }`}>
                      {activity.type === "credit" ? "+" : ""}{activity.amount}€
                    </span>
                  </div>
                </BloomCard>
              ))}
            </div>
          ) : (
            <BloomEmpty
              icon={<IconWallet className="h-8 w-8" />}
              title={t.dashboard.noActivity}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
