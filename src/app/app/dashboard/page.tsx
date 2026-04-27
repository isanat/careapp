"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { DashboardView } from "@isanat/bloom-elements";
import { apiFetch } from "@/lib/api-client";

interface DashboardStats {
  activeContracts: number;
  totalHours: number;
  rating: number;
  totalReviews: number;
}

interface ActivityItem {
  type: 'credit' | 'debit';
  description: string;
  amount: number;
  date: string;
}

function DashboardPageContent() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    activeContracts: 0,
    totalHours: 0,
    rating: 0,
    totalReviews: 0,
  });
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [userTitle, setUserTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const userRole = (session?.user as any)?.role?.toLowerCase() as 'caregiver' | 'family' | undefined;
  const role = userRole === 'family' ? 'family' : 'caregiver';
  const userName = (session?.user as any)?.name ?? '';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        const [contractsRes, profileRes] = await Promise.all([
          apiFetch("/api/contracts"),
          apiFetch("/api/user/profile"),
        ]);

        // Load profile for real title, rating and totalReviews
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const profile = profileData.profile;

          if (role === 'caregiver') {
            setUserTitle(profile?.title ?? '');
            setStats(prev => ({
              ...prev,
              rating: Number(profile?.averageRating) || 0,
              totalReviews: Number(profile?.totalReviews) || 0,
            }));
          } else {
            setUserTitle('Gestor Familiar');
          }
        }

        if (contractsRes.ok) {
          const contractsData = await contractsRes.json();
          const contracts = contractsData.contracts || [];

          const activeContracts = contracts.filter((c: any) => c.status === "ACTIVE").length;
          const totalHours = contracts.reduce((sum: number, c: any) => sum + (Number(c.totalHours) || 0), 0);

          setStats(prev => ({ ...prev, activeContracts, totalHours }));

          // Activity feed: use totalEurCents (pre-calculated) and createdAt
          const activityItems: ActivityItem[] = contracts
            .filter((c: any) => (c.status === "COMPLETED" || c.status === "ACTIVE") && c.createdAt)
            .map((c: any) => ({
              type: 'credit' as const,
              description: c.title ?? `Contrato #${c.id?.slice(-6)}`,
              amount: Number(c.totalEurCents) || 0,
              date: c.createdAt,
            }))
            .slice(0, 5);

          setActivity(activityItems);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchDashboardData();
    } else {
      setIsLoading(false);
    }
  }, [session?.user, role]);

  return (
    <div suppressHydrationWarning>
      <DashboardView
        role={role}
        userName={userName}
        userTitle={userTitle}
        stats={stats}
        activity={activity}
      />
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardPageContent />;
}
