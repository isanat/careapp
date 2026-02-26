"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  IconArrowDown,
  IconShield,
  IconAlertCircle,
  IconCheck,
  IconChevronRight
} from "@/components/icons";
import { APP_NAME, TOKEN_SYMBOL } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";

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
  const router = useRouter();
  const { t } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchStats();
    }
  }, [status]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/user/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentActivity(data.recentActivity || []);
        setUserStatus(data.userStatus || null);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Fallback to defaults
      setStats({
        tokenBalance: 0,
        tokenValueEur: 0,
        activeContracts: 0,
        totalHours: 0,
        rating: 0,
        totalReviews: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // User role checks
  const isFamily = session?.user?.role === "FAMILY";
  const isCaregiver = session?.user?.role === "CAREGIVER";

  // Check what steps the user needs to complete
  const needsPayment = session?.user?.status === "PENDING";
  const needsKYC = userStatus?.verificationStatus !== "VERIFIED";
  const needsProfile = !userStatus?.profileComplete;

  // Build list of pending steps
  const pendingSteps = [];
  if (needsPayment) {
    pendingSteps.push({ key: 'payment', label: t.dashboard.nextSteps.payment, href: '/auth/payment', icon: IconWallet });
  }
  if (needsKYC) {
    pendingSteps.push({ key: 'kyc', label: t.dashboard.nextSteps.kyc, href: '/auth/kyc', icon: IconShield });
  }
  if (needsProfile) {
    pendingSteps.push({ key: 'profile', label: t.dashboard.nextSteps.profile, href: '/app/profile', icon: IconCaregiver });
  }

  if (status === "loading" || isLoading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {t.dashboard.welcome}, {session?.user?.name?.split(" ")[0] || "Usuário"}!
            </h1>
            <p className="text-muted-foreground">
              {isFamily ? t.dashboard.familyPanel : t.dashboard.caregiverPanel}
            </p>
          </div>
          <Badge variant={session?.user?.status === "ACTIVE" ? "default" : "secondary"}>
            {session?.user?.status === "ACTIVE" ? t.dashboard.status.active : t.dashboard.status.pending}
          </Badge>
        </div>

        {/* Next Steps Alert - Show if there are pending steps */}
        {pendingSteps.length > 0 && (
          <Alert className="border-primary/20 bg-primary/5">
            <IconAlertCircle className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary">{t.dashboard.nextSteps.title}</AlertTitle>
            <AlertDescription>
              <div className="mt-3 space-y-2">
                {pendingSteps.map((step) => (
                  <Link 
                    key={step.key}
                    href={step.href}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/10 transition-colors"
                  >
                    <div className="p-2 bg-primary/20 rounded-full">
                      <step.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="flex-1 text-sm">{step.label}</span>
                    <IconChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* All set message */}
        {pendingSteps.length === 0 && (
          <Alert className="border-green-500/20 bg-green-500/5">
            <IconCheck className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-600">{t.dashboard.allSet}</AlertTitle>
            <AlertDescription>
              {isFamily ? t.dashboard.allSetFamily : t.dashboard.allSetCaregiver}
            </AlertDescription>
          </Alert>
        )}

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
                  <p className="text-sm text-muted-foreground">{t.dashboard.tokenBalance} {TOKEN_SYMBOL}</p>
                  <p className="text-2xl font-bold">{stats?.tokenBalance?.toLocaleString() || 0}</p>
                  <p className="text-xs text-muted-foreground">≈ €{(stats?.tokenValueEur || 0).toFixed(2)}</p>
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
                  <p className="text-sm text-muted-foreground">{t.dashboard.activeContracts}</p>
                  <p className="text-2xl font-bold">{stats?.activeContracts || 0}</p>
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
                  <p className="text-sm text-muted-foreground">{t.dashboard.hoursWorked}</p>
                  <p className="text-2xl font-bold">{stats?.totalHours || 0}h</p>
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
                  <p className="text-sm text-muted-foreground">{t.dashboard.rating}</p>
                  <p className="text-2xl font-bold">{stats?.rating?.toFixed(1) || '-'}</p>
                  {stats?.totalReviews ? (
                    <p className="text-xs text-muted-foreground">{stats.totalReviews} {t.dashboard.reviews}</p>
                  ) : null}
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
                  {t.nav.searchCaregivers}
                </CardTitle>
                <CardDescription>
                  {t.search.placeholder}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/app/search">{t.search.title}</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {isCaregiver && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconCaregiver className="h-5 w-5" />
                  {t.nav.profile}
                </CardTitle>
                <CardDescription>
                  {t.profile.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/app/profile">{t.profile.editProfile}</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconContract className="h-5 w-5" />
                {t.contracts.title}
              </CardTitle>
              <CardDescription>
                {t.dashboard.viewAll}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/app/contracts">{t.contracts.title}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconWallet className="h-5 w-5" />
              {t.dashboard.recentActivity}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
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
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.date).toLocaleDateString('pt-PT')}
                        </p>
                      </div>
                    </div>
                    <Badge variant={activity.type === "credit" ? "default" : "secondary"}>
                      {activity.type === "credit" ? "+" : ""}{activity.amount} {TOKEN_SYMBOL}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <IconWallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t.dashboard.noActivity}</p>
              </div>
            )}
            <div className="mt-4 pt-4 border-t">
              <Button asChild variant="ghost" className="w-full">
                <Link href="/app/wallet">{t.dashboard.viewAll}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
