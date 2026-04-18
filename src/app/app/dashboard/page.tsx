"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, ComponentType } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/app-shell";
import {
  BloomCard,
  BloomEmpty,
  BloomStatBlock,
} from "@/components/bloom-custom";
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
      const response = await apiFetch("/api/user/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentActivity(data.recentActivity || []);
        setUserStatus(data.userStatus || null);
      }
    } catch {
      setStats({
        activeContracts: 0,
        totalHours: 0,
        rating: 0,
        totalReviews: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFamily = session?.user?.role === "FAMILY";
  const isCaregiver = session?.user?.role === "CAREGIVER";
  const needsPayment = session?.user?.status === "PENDING" && isFamily;
  const needsKYC = userStatus?.verificationStatus !== "VERIFIED";
  const needsProfile = !userStatus?.profileComplete;
  const isActive = session?.user?.status === "ACTIVE";

  const pendingSteps: Array<{
    key: string;
    label: string;
    href: string;
    icon: ComponentType<{ className?: string }>;
  }> = [];
  if (needsPayment)
    pendingSteps.push({
      key: "payment",
      label: t.dashboard.nextSteps.payment,
      href: "/auth/payment",
      icon: IconWallet,
    });
  if (needsKYC)
    pendingSteps.push({
      key: "kyc",
      label: t.dashboard.nextSteps.kyc,
      href: "/auth/kyc",
      icon: IconShield,
    });
  if (needsProfile)
    pendingSteps.push({
      key: "profile",
      label: t.dashboard.nextSteps.profile,
      href: "/app/profile",
      icon: IconCaregiver,
    });

  const firstName = session?.user?.name?.split(" ")[0] || "";

  if (status === "loading" || isLoading) {
    return (
      <AppShell>
        <div className="space-y-6 sm:space-y-8 p-6 md:p-8 animate-pulse">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-28 w-full rounded-3xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="h-40 rounded-3xl" />
            <Skeleton className="h-40 rounded-3xl" />
            <Skeleton className="h-40 rounded-3xl" />
            <Skeleton className="h-40 rounded-3xl" />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-4 sm:space-y-6 md:space-y-8">

        {/* Page Heading */}
        <div className="flex items-center gap-3">
          <div className="space-y-1 sm:space-y-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-black text-foreground tracking-tighter leading-none uppercase">
              Dashboard
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              Visão geral da sua atividade na plataforma.
            </p>
          </div>
        </div>

        {/* Greeting Card */}
        <div className="relative bg-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-7 border border-border shadow-card">
          <div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-display font-black text-foreground tracking-tighter leading-none uppercase">
              {t.dashboard.welcome}, {firstName.toUpperCase()}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-2">
              {session?.user?.email || ""}
            </p>
          </div>
          <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
            {isActive ? (
              <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-emerald-400 border border-emerald-400/30 bg-emerald-400/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px]">
                <IconCheck className="h-3 w-3" />
                Conta Ativa
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-warning border border-warning/30 bg-warning/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px]">
                <IconAlertCircle className="h-3 w-3" />
                Pendente
              </span>
            )}
          </div>
        </div>

        {/* Stats - 4 columns */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <BloomStatBlock
            label={t.nav.contracts}
            value={stats?.activeContracts || 0}
            icon={<IconContract className="h-5 w-5" />}
            iconBg="bg-primary/10"
            colorClass="text-primary"
          />
          <BloomStatBlock
            label="Horas"
            value={`${stats?.totalHours || 0}h`}
            icon={<IconClock className="h-5 w-5" />}
            iconBg="bg-warning/10"
            colorClass="text-warning"
          />
          <BloomStatBlock
            label="Nota"
            value={stats?.rating?.toFixed(1) || "-"}
            icon={<IconStar className="h-5 w-5" />}
            iconBg="bg-info/10"
            colorClass="text-info"
          />
          <BloomStatBlock
            label="Reviews"
            value={stats?.totalReviews || 0}
            icon={<IconEuro className="h-5 w-5" />}
            iconBg="bg-success/10"
            colorClass="text-success"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col gap-3 sm:gap-4">
          {isFamily && (
            <Link href="/app/search" className="w-full">
              <BloomCard variant="interactive" className="p-4 sm:p-5 md:p-7 rounded-2xl sm:rounded-3xl hover:shadow-elevated hover:border-primary/30 transition-all cursor-pointer group">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary group-hover:scale-110 transition-transform flex-shrink-0">
                    <IconSearch className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">
                      {t.nav.searchCaregivers}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                      Encontrar profissional ideal
                    </p>
                  </div>
                </div>
              </BloomCard>
            </Link>
          )}
          {isCaregiver && (
            <Link href="/app/proposals" className="w-full">
              <BloomCard variant="interactive" className="p-4 sm:p-5 md:p-7 rounded-2xl sm:rounded-3xl hover:shadow-elevated hover:border-primary/30 transition-all cursor-pointer group">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary group-hover:scale-110 transition-transform flex-shrink-0">
                    <IconInbox className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">
                      Propostas
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                      Solicitações recebidas
                    </p>
                  </div>
                </div>
              </BloomCard>
            </Link>
          )}
          <Link href="/app/contracts" className="w-full">
            <BloomCard variant="interactive" className="p-4 sm:p-5 md:p-7 rounded-2xl sm:rounded-3xl hover:shadow-elevated hover:border-primary/30 transition-all cursor-pointer group">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary group-hover:scale-110 transition-transform flex-shrink-0">
                  <IconContract className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest">
                    {t.contracts.title}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                    {t.dashboard.viewAll}
                  </p>
                </div>
              </div>
            </BloomCard>
          </Link>
        </div>

        {/* Next Steps */}
        {pendingSteps.length > 0 && (
          <BloomCard variant="warning" className="p-5 sm:p-7">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <IconAlertCircle className="h-5 w-5 text-warning" />
                <h3 className="text-sm font-display font-black text-foreground uppercase tracking-widest border-l-4 border-primary pl-3">
                  {t.dashboard.nextSteps.title}
                </h3>
              </div>
              <div className="space-y-2">
                {pendingSteps.map((step) => (
                  <Link
                    key={step.key}
                    href={step.href}
                    className="flex items-center justify-between p-4 bg-secondary rounded-2xl border border-border/50 hover:border-warning/30 transition-all cursor-pointer group min-h-[56px]"
                  >
                    <div className="flex items-center gap-3">
                      <step.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                      <span className="text-sm font-medium text-foreground">
                        {step.label}
                      </span>
                    </div>
                    <IconChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </BloomCard>
        )}

        {/* All set */}
        {pendingSteps.length === 0 && (
          <BloomCard variant="success" className="p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <IconCheck className="h-6 w-6 text-success flex-shrink-0" />
              <span className="text-sm font-display font-black text-success">
                {t.dashboard.allSet}
              </span>
            </div>
          </BloomCard>
        )}

        {/* Platform Benefits */}
        <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card">
          <h3 className="text-sm font-display font-black text-foreground uppercase tracking-widest border-l-4 border-primary pl-3 mb-4">
            Benefícios
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(isFamily
              ? [
                  { title: "Cuidadores Verificados", sub: "KYC e antecedentes" },
                  { title: "Contratos Jurídicos", sub: "Assinatura digital" },
                  { title: "Pagamento Seguro", sub: "Proteção financeira" },
                  { title: "Recibos Fiscais", sub: "Válidos para IRS" },
                ]
              : [
                  { title: "Pagamento Garantido", sub: "Receba pontualmente" },
                  { title: "Perfil Verificado", sub: "Mais famílias confiam" },
                  { title: "Reputação Pública", sub: "Avaliações verificáveis" },
                  { title: "Proteção Jurídica", sub: "Contrato formal" },
                ]
            ).map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-secondary rounded-2xl"
              >
                <IconCheck className="h-4 w-4 text-success flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-display font-black text-foreground">
                    {item.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {item.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-display font-black text-foreground uppercase tracking-widest border-l-4 border-primary pl-3">
              {t.dashboard.recentActivity}
            </h3>
            <Link
              href="/app/payments"
              className="text-[10px] font-display font-bold text-primary uppercase tracking-widest hover:text-primary/80 transition-colors"
            >
              {t.dashboard.viewAll}
            </Link>
          </div>

          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.slice(0, 5).map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 sm:p-4 bg-secondary rounded-2xl border border-border/50"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        activity.type === "credit"
                          ? "bg-success/10 text-success"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {activity.type === "credit" ? (
                        <IconArrowUp className="h-5 w-5" />
                      ) : (
                        <IconArrowDown className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-display font-black text-foreground truncate">
                        {activity.description}
                      </p>
                      <p className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-widest mt-0.5">
                        {new Date(activity.date).toLocaleDateString("pt-PT")}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-base font-display font-black tracking-tighter flex-shrink-0 ${
                      activity.type === "credit"
                        ? "text-success"
                        : "text-destructive"
                    }`}
                  >
                    {activity.type === "credit" ? "+" : ""}
                    {activity.amount}€
                  </span>
                </div>
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
