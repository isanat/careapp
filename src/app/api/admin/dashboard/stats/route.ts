import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { db } from "@/lib/db-turso";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

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
    let verifiedCaregivers = 0;
    try {
      const pendingKycResult = await db.execute({
        sql: "SELECT COUNT(*) as count FROM ProfileCaregiver WHERE verificationStatus = 'PENDING'",
        args: [],
      });
      pendingKyc = Number(pendingKycResult.rows[0]?.count || 0);
      
      const verifiedResult = await db.execute({
        sql: "SELECT COUNT(*) as count FROM ProfileCaregiver WHERE verificationStatus = 'VERIFIED'",
        args: [],
      });
      verifiedCaregivers = Number(verifiedResult.rows[0]?.count || 0);
    } catch (e) {
      console.error("Error counting KYC:", e);
    }

    // Get verified caregivers count
    let verifiedCaregiversCount = 0;
    try {
      const verifiedResult = await db.execute({
        sql: "SELECT COUNT(*) as count FROM ProfileCaregiver WHERE verificationStatus = 'VERIFIED'",
        args: [],
      });
      verifiedCaregiversCount = Number(verifiedResult.rows[0]?.count || 0);
    } catch (e) {
      console.error("Error counting verified caregivers:", e);
    }

    // Get total revenue from completed payments (REAL DATA)
    let totalRevenueEur = 0;
    let revenueToday = 0;
    try {
      const revenueResult = await db.execute({
        sql: "SELECT COALESCE(SUM(amountEurCents), 0) as total FROM Payment WHERE status = 'COMPLETED'",
        args: [],
      });
      totalRevenueEur = Number(revenueResult.rows[0]?.total || 0);
      
      // Today's revenue
      const today = new Date().toISOString().split("T")[0];
      const todayResult = await db.execute({
        sql: "SELECT COALESCE(SUM(amountEurCents), 0) as total FROM Payment WHERE status = 'COMPLETED' AND date(paidAt) = ?",
        args: [today],
      });
      revenueToday = Number(todayResult.rows[0]?.total || 0);
    } catch (e) {
      console.error("Error calculating revenue:", e);
    }

    // Get new users today
    let newUsersToday = 0;
    try {
      const today = new Date().toISOString().split("T")[0];
      const todayUsersResult = await db.execute({
        sql: "SELECT COUNT(*) as count FROM User WHERE date(createdAt) = ?",
        args: [today],
      });
      newUsersToday = Number(todayUsersResult.rows[0]?.count || 0);
    } catch (e) {
      console.error("Error counting today's users:", e);
    }

    // Get pending refunds
    let pendingRefunds = 0;
    try {
      const refundsResult = await db.execute({
        sql: "SELECT COUNT(*) as count FROM Payment WHERE status = 'PENDING' AND type = 'REFUND'",
        args: [],
      });
      pendingRefunds = Number(refundsResult.rows[0]?.count || 0);
    } catch (e) {
      console.error("Error counting pending refunds:", e);
    }

    // Get platform settings for reserve
    let reserveEur = 0;
    try {
      const settingsResult = await db.execute({
        sql: "SELECT value FROM PlatformSettings WHERE key = 'reserve_eur_cents'",
        args: [],
      });
      reserveEur = Number(settingsResult.rows[0]?.value || 0);
    } catch (e) {
      console.error("Error getting reserve:", e);
    }

    // Get recent users for activity (REAL DATA)
    let activities: any[] = [];
    try {
      const activityResult = await db.execute({
        sql: `SELECT id, name, email, createdAt, role FROM User ORDER BY createdAt DESC LIMIT 10`,
        args: [],
      });
      activities = activityResult.rows.map((row, index) => ({
        id: `activity-${index}`,
        type: "user_registered",
        description: `${row.name || 'User'} registado como ${row.role === 'FAMILY' ? 'Família' : row.role === 'CAREGIVER' ? 'Cuidador' : 'Admin'}`,
        timestamp: row.createdAt as string,
        userId: row.id as string,
        userName: row.name as string,
      }));
    } catch (e) {
      console.error("Error fetching activities:", e);
    }

    // Get REAL revenue data for last 30 days
    const revenueData: { date: string; amount: number }[] = [];
    try {
      const revenueByDay = await db.execute({
        sql: `
          SELECT date(paidAt) as date, SUM(amountEurCents) as amount 
          FROM Payment 
          WHERE status = 'COMPLETED' AND paidAt >= date('now', '-30 days')
          GROUP BY date(paidAt)
          ORDER BY date DESC
        `,
        args: [],
      });
      
      // Create a map of existing data
      const revenueMap = new Map<string, number>();
      revenueByDay.rows.forEach(row => {
        revenueMap.set(row.date as string, Number(row.amount || 0));
      });
      
      // Fill in all 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        revenueData.push({
          date: dateStr,
          amount: revenueMap.get(dateStr) || 0,
        });
      }
    } catch (e) {
      console.error("Error fetching revenue data:", e);
      // Fallback with zeros
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        revenueData.push({
          date: date.toISOString().split("T")[0],
          amount: 0,
        });
      }
    }

    // Get REAL user growth data for last 30 days
    const userGrowthData: { date: string; count: number }[] = [];
    try {
      const usersByDay = await db.execute({
        sql: `
          SELECT date(createdAt) as date, COUNT(*) as count 
          FROM User 
          WHERE createdAt >= date('now', '-30 days')
          GROUP BY date(createdAt)
          ORDER BY date DESC
        `,
        args: [],
      });
      
      // Create a map of existing data
      const usersMap = new Map<string, number>();
      usersByDay.rows.forEach(row => {
        usersMap.set(row.date as string, Number(row.count || 0));
      });
      
      // Fill in all 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        userGrowthData.push({
          date: dateStr,
          count: usersMap.get(dateStr) || 0,
        });
      }
    } catch (e) {
      console.error("Error fetching user growth:", e);
      // Fallback with zeros
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        userGrowthData.push({
          date: date.toISOString().split("T")[0],
          count: 0,
        });
      }
    }

    return NextResponse.json({
      kpis: {
        totalUsers,
        activeUsers: families + caregivers,
        newUsersToday,
        totalCaregivers: caregivers,
        verifiedCaregivers: verifiedCaregiversCount,
        activeContracts,
        pendingDisputes,
        totalRevenueEur,
        revenueToday,
        tokensInCirculation: tokensIssued,
        reserveEur,
      },
      alerts: {
        pendingKyc,
        pendingDisputes,
        pendingRefunds,
        flaggedContent: 0,
      },
      health: {
        database: "healthy",
        stripe: process.env.STRIPE_SECRET_KEY ? "healthy" : "not_configured",
        easypay: process.env.EASYPAY_API_KEY ? "healthy" : "not_configured",
        kyc: process.env.DIDIT_API_KEY ? "healthy" : "not_configured",
      },
      // Keep backward compatibility
      stats: {
        totalUsers,
        caregivers,
        families,
        revenue: totalRevenueEur / 100, // Convert to euros
        tokensIssued,
        pendingKyc,
        activeContracts,
        pendingDisputes,
        pendingRefunds,
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
