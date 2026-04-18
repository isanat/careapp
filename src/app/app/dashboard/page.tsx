"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, ComponentType } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/app-shell";
import { BloomCard, BloomBadge, BloomSectionDivider, BloomEmpty, BloomStatBlock, BloomSectionHeader } from "@/components/bloom-custom";
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
        <div className="space-y-6 sm:space-y-8 animate-pulse">
          <Skeleton className="h-6 w-40 rounded-lg" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        </div>
      </AppShell>
    );
  }

  const firstName = session?.user?.name?.split(" ")[0] || "";

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <AppShell>
      <motion.div
        className="space-y-6 sm:space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Welcome + Status inline */}
        <motion.div
          className="flex items-center justify-between gap-4"
          variants={itemVariants}
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-black text-foreground tracking-tighter leading-none">
              {t.dashboard.welcome}
            </h1>
            <p className="font-body text-base text-muted-foreground font-medium mt-2">{firstName}</p>
          </div>
          <BloomBadge variant={session?.user?.status === "ACTIVE" ? "success" : "warning"}>
            {session?.user?.status === "ACTIVE" ? t.dashboard.status.active : t.dashboard.status.pending}
          </BloomBadge>
        </motion.div>

        {/* Stats - 4 columns */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={itemVariants}
        >
          <motion.div variants={itemVariants}>
            <BloomStatBlock
              label={t.nav.contracts}
              value={stats?.activeContracts || 0}
              icon={<IconContract className="h-6 w-6" />}
              colorClass="text-primary"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <BloomStatBlock
              label="Horas"
              value={`${stats?.totalHours || 0}h`}
              icon={<IconClock className="h-6 w-6" />}
              colorClass="text-warning"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <BloomStatBlock
              label="Nota"
              value={stats?.rating?.toFixed(1) || '-'}
              icon={<IconStar className="h-6 w-6" />}
              colorClass="text-info"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <BloomStatBlock
              label="Reviews"
              value={stats?.totalReviews || 0}
              icon={<IconEuro className="h-6 w-6" />}
              colorClass="text-success"
            />
          </motion.div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4"
          variants={itemVariants}
        >
          {isFamily && (
            <Link href="/app/search" className="sm:flex-1">
              <motion.div
                whileHover={{ scale: 1.02, translateY: -4 }}
                transition={{ duration: 0.2 }}
              >
                <BloomCard variant="interactive" className="p-5 sm:p-6 md:p-7 h-full">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary group-hover:scale-110 transition-transform flex-shrink-0">
                      <IconSearch className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-black text-foreground text-sm">{t.nav.searchCaregivers}</p>
                      <p className="font-body text-[11px] font-medium text-muted-foreground mt-0.5">Encontrar profissional ideal</p>
                    </div>
                  </div>
                </BloomCard>
              </motion.div>
            </Link>
          )}
          {isCaregiver && (
            <Link href="/app/proposals" className="sm:flex-1">
              <motion.div
                whileHover={{ scale: 1.02, translateY: -4 }}
                transition={{ duration: 0.2 }}
              >
                <BloomCard variant="interactive" className="p-5 sm:p-6 md:p-7 h-full">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-secondary group-hover:scale-110 transition-transform flex-shrink-0">
                      <IconInbox className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-black text-foreground text-sm">Propostas</p>
                      <p className="font-body text-[11px] font-medium text-muted-foreground mt-0.5">Solicitações recebidas</p>
                    </div>
                  </div>
                </BloomCard>
              </motion.div>
            </Link>
          )}
          <Link href="/app/contracts" className="sm:flex-1">
            <motion.div
              whileHover={{ scale: 1.02, translateY: -4 }}
              transition={{ duration: 0.2 }}
            >
              <BloomCard variant="interactive" className="p-5 sm:p-6 md:p-7 h-full">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary group-hover:scale-110 transition-transform flex-shrink-0">
                    <IconContract className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-black text-foreground text-sm">{t.contracts.title}</p>
                    <p className="font-body text-[11px] font-medium text-muted-foreground mt-0.5">{t.dashboard.viewAll}</p>
                  </div>
                </div>
              </BloomCard>
            </motion.div>
          </Link>
        </motion.div>

        {/* Next Steps */}
        {pendingSteps.length > 0 && (
          <motion.div variants={itemVariants}>
            <BloomCard variant="warning" className="p-5 sm:p-6 md:p-7">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <IconAlertCircle className="h-5 w-5 text-warning" />
                  <h3 className="text-sm font-display font-black text-foreground">{t.dashboard.nextSteps.title}</h3>
                </div>
                <div className="space-y-2">
                  {pendingSteps.map((step) => (
                    <motion.div
                      key={step.key}
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link href={step.href} className="flex items-center gap-3 py-2.5 px-3 hover:bg-secondary/50 rounded-lg transition-colors group">
                        <step.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                        <span className="flex-1 font-body text-sm font-medium text-foreground">{step.label}</span>
                        <IconChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </BloomCard>
          </motion.div>
        )}

        {/* All set */}
        {pendingSteps.length === 0 && (
          <motion.div
            variants={itemVariants}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <BloomCard variant="success" className="p-5 sm:p-6 md:p-7">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <IconCheck className="h-6 w-6 text-success flex-shrink-0" />
                </motion.div>
                <span className="font-display font-black text-success text-sm">{t.dashboard.allSet}</span>
              </div>
            </BloomCard>
          </motion.div>
        )}

        {/* Platform Benefits */}
        <motion.div className="space-y-6 sm:space-y-8" variants={itemVariants}>
          <BloomSectionHeader
            title="Benefícios"
            className="mb-4"
          />
          <BloomCard className="p-5 sm:p-6 md:p-7">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <BloomCard variant="default" className="p-4 hover:bg-secondary/50 transition-colors h-full">
                    <div className="flex items-start gap-3">
                      <IconCheck className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-display font-black text-foreground">{item.title}</p>
                        <p className="font-body text-[10px] text-muted-foreground mt-0.5">{item.sub}</p>
                      </div>
                    </div>
                  </BloomCard>
                </motion.div>
              ))}
            </div>
          </BloomCard>
        </motion.div>

        {/* Recent Activity */}
        <motion.div className="space-y-6 sm:space-y-8" variants={itemVariants}>
          <div className="flex items-center justify-between gap-4">
            <BloomSectionHeader
              title={t.dashboard.recentActivity}
              className="mb-0"
            />
            <Link href="/app/payments" className="text-[10px] font-display font-bold text-primary uppercase tracking-widest hover:text-primary/80 transition-colors whitespace-nowrap">
              {t.dashboard.viewAll}
            </Link>
          </div>

          {recentActivity.length > 0 ? (
            <motion.div
              className="space-y-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {recentActivity.slice(0, 5).map((activity, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.01, x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <BloomCard variant="interactive" className="p-5 sm:p-6 md:p-7">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          activity.type === "credit" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                        }`}>
                          {activity.type === "credit"
                            ? <IconArrowUp className="h-5 w-5" />
                            : <IconArrowDown className="h-5 w-5" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-display font-black text-foreground truncate">{activity.description}</p>
                          <p className="font-body text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">{new Date(activity.date).toLocaleDateString('pt-PT')}</p>
                        </div>
                      </div>
                      <span className={`text-base font-display font-black tracking-tighter flex-shrink-0 ${
                        activity.type === "credit" ? "text-success" : "text-destructive"
                      }`}>
                        {activity.type === "credit" ? "+" : ""}{activity.amount}€
                      </span>
                    </div>
                  </BloomCard>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div variants={itemVariants}>
              <BloomEmpty
                icon={<IconWallet className="h-8 w-8" />}
                title={t.dashboard.noActivity}
              />
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
