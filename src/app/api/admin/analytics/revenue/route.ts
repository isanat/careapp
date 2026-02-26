import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// Helper function to verify admin access
async function verifyAdminAccess(sessionUserId: string): Promise<{ authorized: boolean; adminUserId?: string; role?: string; error?: string }> {
  const userResult = await db.execute({
    sql: `SELECT role FROM User WHERE id = ?`,
    args: [sessionUserId]
  });

  const userRole = userResult.rows[0]?.role as string;
  if (!['ADMIN', 'SUPER_ADMIN', 'ANALYST'].includes(userRole)) {
    return { authorized: false, error: 'Forbidden - Admin access required' };
  }

  const adminResult = await db.execute({
    sql: `SELECT id, role FROM AdminUser WHERE userId = ? AND isActive = 1`,
    args: [sessionUserId]
  });

  if (adminResult.rows.length === 0) {
    return { authorized: true, adminUserId: sessionUserId, role: userRole };
  }

  return { 
    authorized: true, 
    adminUserId: adminResult.rows[0].id as string,
    role: adminResult.rows[0].role as string 
  };
}

// GET - Revenue analytics and charts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminCheck = await verifyAdminAccess(session.user.id);
    if (!adminCheck.authorized) {
      return NextResponse.json({ error: adminCheck.error }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const groupBy = searchParams.get('groupBy') || 'day'; // day, week, month

    let daysAgo = 30;
    if (period === '7d') daysAgo = 7;
    else if (period === '90d') daysAgo = 90;
    else if (period === '1y') daysAgo = 365;

    // === Revenue Over Time ===
    let dateFormat = "DATE(paidAt)";
    if (groupBy === 'week') {
      dateFormat = "strftime('%Y-%W', paidAt)";
    } else if (groupBy === 'month') {
      dateFormat = "strftime('%Y-%m', paidAt)";
    }

    const revenueOverTimeResult = await db.execute({
      sql: `SELECT 
        ${dateFormat} as date,
        type,
        SUM(amountEurCents) as revenue,
        COUNT(*) as transactions
      FROM Payment
      WHERE status = 'COMPLETED' 
        AND paidAt >= datetime('now', '-' || ? || ' days')
        AND paidAt IS NOT NULL
      GROUP BY ${dateFormat}, type
      ORDER BY date`,
      args: [daysAgo]
    });

    // === Revenue by Type ===
    const revenueByTypeResult = await db.execute({
      sql: `SELECT 
        type,
        COUNT(*) as transactionCount,
        SUM(amountEurCents) as totalRevenue,
        AVG(amountEurCents) as avgTransaction,
        MIN(amountEurCents) as minTransaction,
        MAX(amountEurCents) as maxTransaction
      FROM Payment
      WHERE status = 'COMPLETED'
      GROUP BY type
      ORDER BY totalRevenue DESC`,
      args: []
    });

    // === Revenue by Payment Provider ===
    const revenueByProviderResult = await db.execute({
      sql: `SELECT 
        provider,
        COUNT(*) as transactionCount,
        SUM(amountEurCents) as totalRevenue,
        AVG(amountEurCents) as avgTransaction
      FROM Payment
      WHERE status = 'COMPLETED'
      GROUP BY provider
      ORDER BY totalRevenue DESC`,
      args: []
    });

    // === Monthly Comparison ===
    const monthlyComparisonResult = await db.execute({
      sql: `SELECT 
        strftime('%Y-%m', paidAt) as month,
        SUM(amountEurCents) as revenue,
        COUNT(*) as transactions
      FROM Payment
      WHERE status = 'COMPLETED' 
        AND paidAt >= datetime('now', '-12 months')
        AND paidAt IS NOT NULL
      GROUP BY strftime('%Y-%m', paidAt)
      ORDER BY month DESC
      LIMIT 12`,
      args: []
    });

    // === Refund Analytics ===
    const refundAnalyticsResult = await db.execute({
      sql: `SELECT 
        DATE(refundedAt) as date,
        COUNT(*) as refundCount,
        SUM(amountEurCents) as refundAmount
      FROM Payment
      WHERE status = 'REFUNDED' 
        AND refundedAt >= datetime('now', '-' || ? || ' days')
      GROUP BY DATE(refundedAt)
      ORDER BY date`,
      args: [daysAgo]
    });

    // === Revenue from Contracts ===
    const contractRevenueResult = await db.execute({
      sql: `SELECT 
        c.id,
        c.title,
        c.status,
        c.totalEurCents,
        c.totalTokens,
        c.createdAt,
        (SELECT COALESCE(SUM(amountEurCents), 0) FROM Payment WHERE contractId = c.id AND status = 'COMPLETED') as totalPaid,
        uf.name as familyName,
        uc.name as caregiverName
      FROM Contract c
      LEFT JOIN User uf ON c.familyUserId = uf.id
      LEFT JOIN User uc ON c.caregiverUserId = uc.id
      WHERE c.createdAt >= datetime('now', '-' || ? || ' days')
      ORDER BY c.totalEurCents DESC
      LIMIT 20`,
      args: [daysAgo]
    });

    // === Platform Fees Collected ===
    const platformFeesResult = await db.execute({
      sql: `SELECT 
        DATE(paidAt) as date,
        SUM(ROUND(amountEurCents * 0.10)) as estimatedFees
      FROM Payment
      WHERE status = 'COMPLETED'
        AND type IN ('ACTIVATION', 'CONTRACT_FEE')
        AND paidAt >= datetime('now', '-' || ? || ' days')
      GROUP BY DATE(paidAt)
      ORDER BY date`,
      args: [daysAgo]
    });

    // === Top Revenue Generators ===
    const topRevenueUsersResult = await db.execute({
      sql: `SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        COUNT(p.id) as transactionCount,
        SUM(p.amountEurCents) as totalSpent
      FROM Payment p
      JOIN User u ON p.userId = u.id
      WHERE p.status = 'COMPLETED'
      GROUP BY u.id
      ORDER BY totalSpent DESC
      LIMIT 10`,
      args: []
    });

    // === Summary Stats ===
    const summaryResult = await db.execute({
      sql: `SELECT 
        (SELECT COALESCE(SUM(amountEurCents), 0) FROM Payment WHERE status = 'COMPLETED') as totalRevenue,
        (SELECT COALESCE(SUM(amountEurCents), 0) FROM Payment WHERE status = 'COMPLETED' AND paidAt >= datetime('now', '-30 days')) as revenueLast30Days,
        (SELECT COALESCE(SUM(amountEurCents), 0) FROM Payment WHERE status = 'COMPLETED' AND paidAt >= datetime('now', '-7 days')) as revenueLast7Days,
        (SELECT COALESCE(SUM(amountEurCents), 0) FROM Payment WHERE status = 'COMPLETED' AND DATE(paidAt) = DATE('now')) as revenueToday,
        (SELECT COUNT(*) FROM Payment WHERE status = 'COMPLETED') as totalTransactions,
        (SELECT COALESCE(SUM(amountEurCents), 0) FROM Payment WHERE status = 'REFUNDED') as totalRefunds,
        (SELECT COALESCE(AVG(amountEurCents), 0) FROM Payment WHERE status = 'COMPLETED') as avgTransactionSize
      `,
      args: []
    });

    return NextResponse.json({
      period,
      groupBy,
      revenueOverTime: revenueOverTimeResult.rows,
      revenueByType: revenueByTypeResult.rows,
      revenueByProvider: revenueByProviderResult.rows,
      monthlyComparison: monthlyComparisonResult.rows,
      refunds: {
        timeline: refundAnalyticsResult.rows,
        total: summaryResult.rows[0]?.totalRefunds || 0,
      },
      topContracts: contractRevenueResult.rows,
      platformFees: platformFeesResult.rows,
      topRevenueUsers: topRevenueUsersResult.rows,
      summary: {
        totalRevenue: Number(summaryResult.rows[0]?.totalRevenue) || 0,
        revenueLast30Days: Number(summaryResult.rows[0]?.revenueLast30Days) || 0,
        revenueLast7Days: Number(summaryResult.rows[0]?.revenueLast7Days) || 0,
        revenueToday: Number(summaryResult.rows[0]?.revenueToday) || 0,
        totalTransactions: Number(summaryResult.rows[0]?.totalTransactions) || 0,
        totalRefunds: Number(summaryResult.rows[0]?.totalRefunds) || 0,
        avgTransactionSize: Number(summaryResult.rows[0]?.avgTransactionSize) || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
