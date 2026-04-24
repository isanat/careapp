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
  const [stats, setStats] = useState<DashboardStats | undefined>();
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  // Extract user data from session
  const userRole = (session?.user as any)?.role?.toLowerCase() as 'caregiver' | 'family' | undefined;
  const role = userRole === 'family' ? 'family' : 'caregiver';
  const userName = (session?.user as any)?.name || 'Usuário';

  // Role-specific titles
  const userTitle = role === 'caregiver'
    ? (session?.user as any)?.profession || 'Profissional de Saúde'
    : 'Gestor Familiar';

  // Fetch dashboard stats and activity
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [contractsRes] = await Promise.all([apiFetch("/api/contracts")]);

        if (contractsRes.ok) {
          const contractsData = await contractsRes.json();
          const contracts = contractsData.contracts || [];

          // Calculate stats from real data
          const activeContracts = contracts.filter((c: any) => c.status === "ACTIVE").length;
          const totalHours = contracts.reduce((sum: number, c: any) => sum + (c.totalHours || 0), 0);
          const rating = contracts.length > 0
            ? (contracts.reduce((sum: number, c: any) => sum + (c.rating || 0), 0) / contracts.length)
            : 0;
          const totalReviews = contracts.filter((c: any) => c.rating).length;

          setStats({
            activeContracts,
            totalHours,
            rating: Math.round(rating * 10) / 10,
            totalReviews,
          });

          // Build activity feed from contracts
          const activityItems: ActivityItem[] = contracts
            .filter((c: any) => c.status === "COMPLETED" || c.status === "ACTIVE")
            .map((c: any) => ({
              type: 'credit' as const,
              description: `Contrato: ${c.title || 'Sem título'}`,
              amount: Math.round((c.hourlyRateEur || 0) * (c.totalHours || 0)),
              date: c.updatedAt || new Date().toISOString(),
            }))
            .slice(0, 5);

          setActivity(activityItems);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    if (session?.user) {
      fetchDashboardData();
    }
  }, [session?.user]);

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
