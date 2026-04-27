"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import {
  BloomCard,
  BloomStatBlock,
  BloomSectionHeader,
  BloomSectionDivider,
} from "@/components/bloom-custom";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconFileText,
  IconClock,
  IconStar,
  IconUsers,
  IconSearch,
  IconWallet,
  IconContract,
  IconInbox,
  IconArrowUp,
  IconChevronRight,
  IconShield,
  IconCheck,
} from "@/components/icons";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardStats {
  activeContracts: number;
  totalHours: number;
  rating: number;
  totalReviews: number;
}

interface ActivityItem {
  type: "credit";
  description: string;
  amount: number;
  date: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatAmount(cents: number): string {
  return (cents / 100).toLocaleString("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome */}
      <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-card p-5 sm:p-7 rounded-3xl border border-border shadow-card space-y-3"
          >
            <Skeleton className="h-10 w-10 rounded-2xl" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-card rounded-3xl border border-border shadow-card p-5 sm:p-7"
          >
            <Skeleton className="h-10 w-10 rounded-2xl mb-4" />
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5">
      <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
        <IconFileText className="w-6 h-6" />
      </div>
      <div className="text-center">
        <p className="font-display font-black text-foreground text-lg uppercase tracking-tight">
          Erro ao carregar
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Não foi possível carregar o dashboard. Tente novamente.
        </p>
      </div>
      <button
        onClick={onRetry}
        className="px-5 py-2.5 bg-primary text-primary-foreground rounded-2xl text-sm font-display font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
      >
        Tentar de novo
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main dashboard content
// ---------------------------------------------------------------------------

function DashboardPageContent() {
  const { data: session } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats>({
    activeContracts: 0,
    totalHours: 0,
    rating: 0,
    totalReviews: 0,
  });
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [userTitle, setUserTitle] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const rawRole = (session?.user as any)?.role as string | undefined;
  const role: "caregiver" | "family" =
    rawRole === "CAREGIVER" ? "caregiver" : "family";
  const userName: string = (session?.user as any)?.name ?? "";

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setHasError(false);

      const [contractsRes, profileRes] = await Promise.all([
        apiFetch("/api/contracts"),
        apiFetch("/api/user/profile"),
      ]);

      // Profile data
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        const profile = profileData.profile;

        if (role === "caregiver") {
          setUserTitle(profile?.title ?? "");
          setStats((prev) => ({
            ...prev,
            rating: Number(profile?.averageRating) || 0,
            totalReviews: Number(profile?.totalReviews) || 0,
          }));
        } else {
          setUserTitle("Gestor Familiar");
        }
      }

      // Contracts data
      if (contractsRes.ok) {
        const contractsData = await contractsRes.json();
        const contracts: any[] = contractsData.contracts ?? [];

        const activeContracts = contracts.filter(
          (c) => c.status === "ACTIVE"
        ).length;
        const totalHoursRaw = contracts.reduce(
          (sum, c) => sum + (Number(c.totalHours) || 0),
          0
        );
        const totalHours = Math.floor(totalHoursRaw);

        setStats((prev) => ({ ...prev, activeContracts, totalHours }));

        const activityItems: ActivityItem[] = contracts
          .slice()
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 5)
          .map((c) => ({
            type: "credit" as const,
            description: c.title ?? `Contrato #${String(c.id).slice(-6)}`,
            amount: Number(c.totalEurCents) || 0,
            date: c.createdAt,
          }));

        setActivity(activityItems);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user, role]);

  if (isLoading) return <DashboardSkeleton />;
  if (hasError) return <DashboardError onRetry={fetchDashboardData} />;

  // -------------------------------------------------------------------------
  // Role-specific config
  // -------------------------------------------------------------------------

  const quickActions =
    role === "family"
      ? [
          {
            label: "Procurar Cuidadores",
            href: "/app/search",
            icon: <IconSearch className="w-5 h-5" />,
            desc: "Encontre o cuidador ideal",
          },
          {
            label: "Contratos",
            href: "/app/contracts",
            icon: <IconContract className="w-5 h-5" />,
            desc: "Gerir contratos ativos",
          },
          {
            label: "Pagamentos",
            href: "/app/payments",
            icon: <IconWallet className="w-5 h-5" />,
            desc: "Histórico de pagamentos",
          },
        ]
      : [
          {
            label: "Propostas",
            href: "/app/proposals",
            icon: <IconInbox className="w-5 h-5" />,
            desc: "Ver propostas recebidas",
          },
          {
            label: "Contratos",
            href: "/app/contracts",
            icon: <IconContract className="w-5 h-5" />,
            desc: "Gerir contratos ativos",
          },
          {
            label: "Carteira",
            href: "/app/wallet",
            icon: <IconWallet className="w-5 h-5" />,
            desc: "Saldo e transferências",
          },
        ];

  const nextSteps =
    role === "family"
      ? [
          { label: "Procurar cuidador", href: "/app/search" },
          { label: "Completar perfil", href: "/app/profile" },
          { label: "Ver contratos", href: "/app/contracts" },
        ]
      : [
          { label: "Completar verificação KYC", href: "/app/verify" },
          { label: "Ver propostas", href: "/app/proposals" },
        ];

  const benefits =
    role === "family"
      ? [
          "Cuidadores Verificados",
          "Contratos Jurídicos",
          "Pagamento Seguro",
          "Recibos Fiscais",
        ]
      : [
          "Pagamento Garantido",
          "Perfil Verificado",
          "Reputação Pública",
          "Proteção Jurídica",
        ];

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6 sm:space-y-8" suppressHydrationWarning>
      {/* ------------------------------------------------------------------ */}
      {/* Welcome card                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground font-display font-bold uppercase tracking-widest mb-1">
              {userTitle || (role === "caregiver" ? "Cuidador" : "Família")}
            </p>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-foreground tracking-tighter leading-none">
              Olá, {userName || "utilizador"}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {role === "caregiver"
                ? "Bem-vindo ao seu painel de cuidador."
                : "Bem-vindo ao seu painel familiar."}
            </p>
          </div>

          {/* Online badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-display font-bold uppercase tracking-widest bg-success/10 text-success border border-success/30 self-start sm:self-center">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            Online
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Stats grid                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
        <BloomStatBlock
          label="Contratos Ativos"
          value={stats.activeContracts}
          icon={<IconFileText className="w-5 h-5" />}
          iconBg="bg-primary/10"
          colorClass="text-primary"
        />
        <BloomStatBlock
          label="Total de Horas"
          value={`${Math.floor(stats.totalHours)}h`}
          icon={<IconClock className="w-5 h-5" />}
          iconBg="bg-info/10"
          colorClass="text-info"
        />
        <BloomStatBlock
          label="Avaliação"
          value={stats.rating > 0 ? stats.rating.toFixed(1) : "—"}
          icon={<IconStar className="w-5 h-5" />}
          iconBg="bg-warning/10"
          colorClass="text-warning"
        />
        <BloomStatBlock
          label="Avaliações"
          value={stats.totalReviews}
          icon={<IconUsers className="w-5 h-5" />}
          iconBg="bg-success/10"
          colorClass="text-success"
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Quick actions                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <BloomSectionHeader
          title="Ações Rápidas"
          description="Aceda rapidamente às funcionalidades principais"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} className="block">
              <div className="bg-card rounded-3xl border border-border shadow-card p-5 sm:p-7 hover:shadow-elevated hover:border-primary/30 transition-all cursor-pointer group h-full">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-4">
                  {action.icon}
                </div>
                <p className="font-display font-black text-foreground text-sm uppercase tracking-wide leading-tight">
                  {action.label}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {action.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <BloomSectionDivider />

      {/* ------------------------------------------------------------------ */}
      {/* Two-column: Next steps + Recent activity                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Próximos Passos */}
        <div>
          <BloomSectionHeader
            title="Próximos Passos"
            description="Complete estas ações para tirar o máximo partido da plataforma"
          />
          <div className="space-y-3">
            {nextSteps.map((step) => (
              <Link key={step.href} href={step.href} className="block">
                <div className="flex items-center justify-between p-4 bg-secondary rounded-2xl border border-border/50 hover:border-warning/30 transition-all cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl bg-warning/10 flex items-center justify-center text-warning flex-shrink-0">
                      <IconCheck className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {step.label}
                    </span>
                  </div>
                  <IconChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Atividade Recente */}
        <div>
          <BloomSectionHeader
            title="Atividade Recente"
            description="Os seus contratos mais recentes"
          />
          {activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 bg-secondary rounded-3xl border border-border/50 gap-3">
              <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                <IconInbox className="w-5 h-5" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Sem atividade recente para mostrar.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activity.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 sm:p-4 bg-secondary rounded-2xl border border-border/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-success/10 flex items-center justify-center text-success flex-shrink-0">
                      <IconArrowUp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(item.date)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-display font-bold text-success flex-shrink-0 ml-3">
                    {formatAmount(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BloomSectionDivider />

      {/* ------------------------------------------------------------------ */}
      {/* Platform benefits (static, role-specific)                           */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <BloomSectionHeader
          title="Benefícios da Plataforma"
          description="O que a Evyra garante para si"
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {benefits.map((benefit) => (
            <div
              key={benefit}
              className="bg-card rounded-3xl border border-border shadow-card p-5 flex flex-col items-center gap-3 text-center"
            >
              <div className="w-9 h-9 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <IconShield className="w-4 h-4" />
              </div>
              <p className="text-[11px] font-display font-black text-foreground uppercase tracking-wide leading-tight">
                {benefit}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page export
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  return <DashboardPageContent />;
}
