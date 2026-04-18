import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { db } from "@/lib/db-turso";

// GET - Analytics data
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    const { session, adminUserId } = auth;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d"; // 7d, 30d, 90d

    let daysAgo = 30;
    if (period === "7d") daysAgo = 7;
    if (period === "90d") daysAgo = 90;

    // User growth
    const userGrowthResult = await db.execute({
      sql: `SELECT 
        date(createdAt) as date,
        role,
        COUNT(*) as count
      FROM User
      WHERE createdAt >= datetime('now', '-' || ? || ' days')
      GROUP BY date(createdAt), role
      ORDER BY date`,
      args: [daysAgo],
    });

    // Revenue over time
    const revenueResult = await db.execute({
      sql: `SELECT 
        date(paidAt) as date,
        type,
        SUM(amountEurCents) as revenue,
        COUNT(*) as transactions
      FROM Payment
      WHERE status = 'COMPLETED' AND paidAt >= datetime('now', '-' || ? || ' days')
      GROUP BY date(paidAt), type
      ORDER BY date`,
      args: [daysAgo],
    });

    // Contract stats
    const contractStatsResult = await db.execute({
      sql: `SELECT 
        status,
        COUNT(*) as count,
        SUM(totalEurCents) as totalValue
      FROM Contract
      GROUP BY status`,
      args: [],
    });

    // Geographic distribution
    const geoResult = await db.execute({
      sql: `SELECT 
        COALESCE(pf.city, pc.city) as city,
        u.role,
        COUNT(*) as count
      FROM User u
      LEFT JOIN ProfileFamily pf ON u.id = pf.userId
      LEFT JOIN ProfileCaregiver pc ON u.id = pc.userId
      WHERE COALESCE(pf.city, pc.city) IS NOT NULL
      GROUP BY COALESCE(pf.city, pc.city), u.role
      ORDER BY count DESC
      LIMIT 20`,
      args: [],
    });

    // Service distribution (from caregiver profiles)
    const serviceRawResult = await db.execute({
      sql: `SELECT services FROM ProfileCaregiver WHERE services IS NOT NULL AND services != ''`,
      args: [],
    });
    const serviceCounts: Record<string, number> = {};
    for (const row of serviceRawResult.rows) {
      try {
        const services = JSON.parse(String(row.services));
        if (Array.isArray(services)) {
          for (const s of services) {
            serviceCounts[s] = (serviceCounts[s] || 0) + 1;
          }
        }
      } catch {
        /* skip malformed JSON */
      }
    }
    const serviceResult = {
      rows: Object.entries(serviceCounts)
        .map(([service, count]) => ({ service, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };

    // Summary stats
    const summaryResult = await db.execute({
      sql: `SELECT 
        (SELECT COUNT(*) FROM User) as totalUsers,
        (SELECT COUNT(*) FROM User WHERE role = 'CAREGIVER') as totalCaregivers,
        (SELECT COUNT(*) FROM User WHERE role = 'FAMILY') as totalFamilies,
        (SELECT COUNT(*) FROM Contract) as totalContracts,
        (SELECT COALESCE(SUM(amountEurCents), 0) FROM Payment WHERE status = 'COMPLETED') as totalRevenue,
        (SELECT COUNT(*) FROM Payment WHERE status = 'COMPLETED') as totalTransactions`,
      args: [],
    });

    return NextResponse.json({
      period,
      userGrowth: userGrowthResult.rows,
      revenue: revenueResult.rows,
      contractStats: contractStatsResult.rows,
      geographic: geoResult.rows,
      services: serviceResult.rows,
      summary: summaryResult.rows[0],
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
