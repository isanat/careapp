import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// GET - Analytics data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d

    let daysAgo = 30;
    if (period === '7d') daysAgo = 7;
    if (period === '90d') daysAgo = 90;

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
      args: [daysAgo]
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
      args: [daysAgo]
    });

    // Contract stats
    const contractStatsResult = await db.execute({
      sql: `SELECT 
        status,
        COUNT(*) as count,
        SUM(totalEurCents) as totalValue
      FROM Contract
      GROUP BY status`,
      args: []
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
      args: []
    });

    // Service distribution
    const serviceResult = await db.execute({
      sql: `SELECT 
        service,
        COUNT(*) as count
      FROM (
        SELECT json_each.value as service
        FROM Contract, json_each(services)
      )
      GROUP BY service
      ORDER BY count DESC
      LIMIT 10`,
      args: []
    });

    // Summary stats
    const summaryResult = await db.execute({
      sql: `SELECT 
        (SELECT COUNT(*) FROM User) as totalUsers,
        (SELECT COUNT(*) FROM User WHERE role = 'CAREGIVER') as totalCaregivers,
        (SELECT COUNT(*) FROM User WHERE role = 'FAMILY') as totalFamilies,
        (SELECT COUNT(*) FROM Contract) as totalContracts,
        (SELECT COALESCE(SUM(amountEurCents), 0) FROM Payment WHERE status = 'COMPLETED') as totalRevenue,
        (SELECT COUNT(*) FROM Payment WHERE status = 'COMPLETED') as totalTransactions`,
      args: []
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
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
