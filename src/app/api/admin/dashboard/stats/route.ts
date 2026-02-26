import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-turso";
import { db } from "@/lib/db-turso";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get total users
    let totalUsers = 0;
    try {
      const totalUsersResult = await db.execute({
        sql: "SELECT COUNT(*) as count FROM User",
        args: [],
      });
      totalUsers = Number(totalUsersResult.rows[0]?.count || 0);
    } catch (e) {
      console.error("Error counting users:", e);
    }

    // Get caregivers count
    let caregivers = 0;
    try {
      const caregiversResult = await db.execute({
        sql: "SELECT COUNT(*) as count FROM User WHERE role = 'CAREGIVER'",
        args: [],
      });
      caregivers = Number(caregiversResult.rows[0]?.count || 0);
    } catch (e) {
      console.error("Error counting caregivers:", e);
    }

    // Get families count
    let families = 0;
    try {
      const familiesResult = await db.execute({
        sql: "SELECT COUNT(*) as count FROM User WHERE role = 'FAMILY'",
        args: [],
      });
      families = Number(familiesResult.rows[0]?.count || 0);
    } catch (e) {
      console.error("Error counting families:", e);
    }

    // Get total tokens issued
    let tokensIssued = 0;
    try {
      const tokensResult = await db.execute({
        sql: "SELECT COALESCE(SUM(balanceTokens), 0) as total FROM Wallet",
        args: [],
      });
      tokensIssued = Number(tokensResult.rows[0]?.total || 0);
    } catch (e) {
      console.error("Error summing tokens:", e);
    }

    // Get active contracts count
    let activeContracts = 0;
    try {
      const activeContractsResult = await db.execute({
        sql: "SELECT COUNT(*) as count FROM Contract WHERE status = 'ACTIVE'",
        args: [],
      });
      activeContracts = Number(activeContractsResult.rows[0]?.count || 0);
    } catch (e) {
      console.error("Error counting active contracts:", e);
    }

    // Get pending disputes
    let pendingDisputes = 0;
    try {
      const disputesResult = await db.execute({
        sql: "SELECT COUNT(*) as count FROM Contract WHERE status = 'DISPUTED'",
        args: [],
      });
      pendingDisputes = Number(disputesResult.rows[0]?.count || 0);
    } catch (e) {
      console.error("Error counting disputes:", e);
    }

    // Get pending KYC count
    let pendingKyc = 0;
    try {
      const pendingKycResult = await db.execute({
        sql: "SELECT COUNT(*) as count FROM ProfileCaregiver WHERE verificationStatus = 'PENDING'",
        args: [],
      });
      pendingKyc = Number(pendingKycResult.rows[0]?.count || 0);
    } catch (e) {
      console.error("Error counting pending KYC:", e);
    }

    // Get recent users for activity
    let activities: any[] = [];
    try {
      const activityResult = await db.execute({
        sql: `SELECT id, name, email, createdAt, role FROM User ORDER BY createdAt DESC LIMIT 10`,
        args: [],
      });
      activities = activityResult.rows.map((row, index) => ({
        id: `activity-${index}`,
        type: "user_registered",
        description: `${row.name || 'User'} registered as ${row.role || 'USER'}`,
        timestamp: row.createdAt as string,
        userId: row.id as string,
        userName: row.name as string,
      }));
    } catch (e) {
      console.error("Error fetching activities:", e);
    }

    // Generate revenue data for last 30 days (mock data for now)
    const revenueData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      revenueData.push({
        date: date.toISOString().split("T")[0],
        amount: Math.floor(Math.random() * 500) + 100,
      });
    }

    // Generate user growth data for last 30 days
    const userGrowthData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      userGrowthData.push({
        date: date.toISOString().split("T")[0],
        count: Math.floor(Math.random() * 5),
      });
    }

    return NextResponse.json({
      kpis: {
        totalUsers,
        activeUsers: families + caregivers, // Users with activity
        newUsersToday: 0, // Would need to calculate from today's registrations
        totalCaregivers: caregivers,
        verifiedCaregivers: 0, // Would need to query ProfileCaregiver
        activeContracts,
        pendingDisputes,
        totalRevenueEur: totalUsers * 2500, // Estimated revenue from activations (in cents)
        revenueToday: 0, // Would need to calculate from today's payments
        tokensInCirculation: tokensIssued,
        reserveEur: 0, // Would need to query PlatformSettings
      },
      alerts: {
        pendingKyc,
        pendingDisputes,
        pendingRefunds: 0,
        flaggedContent: 0, // Would need moderation system
      },
      health: {
        database: "healthy",
        stripe: process.env.STRIPE_SECRET_KEY ? "healthy" : "not_configured",
      },
      // Keep backward compatibility
      stats: {
        totalUsers,
        caregivers,
        families,
        revenue: totalUsers * 25, // Estimated revenue from activations
        tokensIssued,
        pendingKyc,
        activeContracts,
        pendingDisputes,
        pendingRefunds: 0,
      },
      revenueData,
      userGrowthData,
      activities,
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
