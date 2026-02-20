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
  if (!['ADMIN', 'SUPER_ADMIN', 'ANALYST', 'SUPPORT'].includes(userRole)) {
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

// GET - Analytics overview with KPIs
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
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y

    let daysAgo = 30;
    if (period === '7d') daysAgo = 7;
    else if (period === '90d') daysAgo = 90;
    else if (period === '1y') daysAgo = 365;

    // === Core KPIs ===
    
    // User stats
    const userStatsResult = await db.execute({
      sql: `SELECT 
        (SELECT COUNT(*) FROM User) as totalUsers,
        (SELECT COUNT(*) FROM User WHERE role = 'FAMILY') as totalFamilies,
        (SELECT COUNT(*) FROM User WHERE role = 'CAREGIVER') as totalCaregivers,
        (SELECT COUNT(*) FROM User WHERE status = 'ACTIVE') as activeUsers,
        (SELECT COUNT(*) FROM User WHERE createdAt >= datetime('now', '-' || ? || ' days')) as newUsersPeriod,
        (SELECT COUNT(*) FROM User WHERE lastLoginAt >= datetime('now', '-30 days')) as activeLast30Days`,
      args: [daysAgo]
    });

    // Caregiver verification stats
    const kycStatsResult = await db.execute({
      sql: `SELECT 
        (SELECT COUNT(*) FROM ProfileCaregiver WHERE verificationStatus = 'VERIFIED') as verifiedCaregivers,
        (SELECT COUNT(*) FROM ProfileCaregiver WHERE verificationStatus = 'PENDING') as pendingKyc,
        (SELECT COUNT(*) FROM ProfileCaregiver WHERE verificationStatus = 'REJECTED') as rejectedKyc,
        (SELECT COUNT(*) FROM ProfileCaregiver WHERE featured = 1) as featuredCaregivers`,
      args: []
    });

    // Contract stats
    const contractStatsResult = await db.execute({
      sql: `SELECT 
        (SELECT COUNT(*) FROM Contract) as totalContracts,
        (SELECT COUNT(*) FROM Contract WHERE status = 'ACTIVE') as activeContracts,
        (SELECT COUNT(*) FROM Contract WHERE status = 'PENDING') as pendingContracts,
        (SELECT COUNT(*) FROM Contract WHERE status = 'COMPLETED') as completedContracts,
        (SELECT COUNT(*) FROM Contract WHERE status = 'CANCELLED') as cancelledContracts,
        (SELECT COUNT(*) FROM Contract WHERE status = 'DISPUTED') as disputedContracts,
        (SELECT COALESCE(SUM(totalEurCents), 0) FROM Contract) as totalContractValue,
        (SELECT COALESCE(AVG(totalEurCents), 0) FROM Contract WHERE status = 'COMPLETED') as avgContractValue,
        (SELECT COUNT(*) FROM Contract WHERE createdAt >= datetime('now', '-' || ? || ' days')) as newContractsPeriod`,
      args: [daysAgo]
    });

    // Payment/Revenue stats
    const revenueStatsResult = await db.execute({
      sql: `SELECT 
        (SELECT COALESCE(SUM(amountEurCents), 0) FROM Payment WHERE status = 'COMPLETED') as totalRevenue,
        (SELECT COALESCE(SUM(amountEurCents), 0) FROM Payment WHERE status = 'COMPLETED' AND paidAt >= datetime('now', '-' || ? || ' days')) as revenuePeriod,
        (SELECT COALESCE(SUM(amountEurCents), 0) FROM Payment WHERE status = 'COMPLETED' AND type = 'ACTIVATION') as activationRevenue,
        (SELECT COALESCE(SUM(amountEurCents), 0) FROM Payment WHERE status = 'COMPLETED' AND type = 'TOKEN_PURCHASE') as tokenPurchaseRevenue,
        (SELECT COUNT(*) FROM Payment WHERE status = 'COMPLETED') as totalTransactions,
        (SELECT COUNT(*) FROM Payment WHERE status = 'REFUNDED') as totalRefunds,
        (SELECT COALESCE(SUM(amountEurCents), 0) FROM Payment WHERE status = 'REFUNDED') as totalRefundedAmount`,
      args: [daysAgo]
    });

    // Token stats
    const tokenStatsResult = await db.execute({
      sql: `SELECT 
        (SELECT totalTokensMinted FROM PlatformSettings LIMIT 1) as totalMinted,
        (SELECT totalTokensBurned FROM PlatformSettings LIMIT 1) as totalBurned,
        (SELECT totalReserveEurCents FROM PlatformSettings LIMIT 1) as reserveEurCents,
        (SELECT COUNT(DISTINCT userId) FROM Wallet WHERE balanceTokens > 0) as tokenHolders,
        (SELECT COUNT(*) FROM TokenLedger WHERE createdAt >= datetime('now', '-' || ? || ' days')) as tokenTransactionsPeriod`,
      args: [daysAgo]
    });

    // === Growth Metrics ===
    
    // User growth by day (for charts)
    const userGrowthResult = await db.execute({
      sql: `SELECT 
        DATE(createdAt) as date,
        role,
        COUNT(*) as count
      FROM User
      WHERE createdAt >= datetime('now', '-' || ? || ' days')
      GROUP BY DATE(createdAt), role
      ORDER BY date`,
      args: [daysAgo]
    });

    // Revenue by day (for charts)
    const revenueGrowthResult = await db.execute({
      sql: `SELECT 
        DATE(paidAt) as date,
        type,
        SUM(amountEurCents) as revenue,
        COUNT(*) as transactions
      FROM Payment
      WHERE status = 'COMPLETED' AND paidAt >= datetime('now', '-' || ? || ' days')
      GROUP BY DATE(paidAt), type
      ORDER BY date`,
      args: [daysAgo]
    });

    // === Platform Health ===
    
    // Dispute rate
    const totalContracts = Number(contractStatsResult.rows[0]?.totalContracts) || 1;
    const disputedContracts = Number(contractStatsResult.rows[0]?.disputedContracts) || 0;
    const disputeRate = (disputedContracts / totalContracts) * 100;

    // Average rating
    const avgRatingResult = await db.execute({
      sql: `SELECT COALESCE(AVG(rating), 0) as avgRating, COUNT(*) as totalReviews FROM Review`,
      args: []
    });

    // Response time (average time to first message on new contracts)
    // Note: This would require more complex tracking, using placeholder

    // Geographic distribution
    const geoDistributionResult = await db.execute({
      sql: `SELECT 
        COALESCE(pf.city, pc.city) as city,
        COUNT(DISTINCT u.id) as userCount
      FROM User u
      LEFT JOIN ProfileFamily pf ON u.id = pf.userId
      LEFT JOIN ProfileCaregiver pc ON u.id = pc.userId
      WHERE COALESCE(pf.city, pc.city) IS NOT NULL
      GROUP BY COALESCE(pf.city, pc.city)
      ORDER BY userCount DESC
      LIMIT 10`,
      args: []
    });

    // Service popularity
    const servicePopularityResult = await db.execute({
      sql: `SELECT 
        service,
        COUNT(*) as count
      FROM (
        SELECT json_each.value as service
        FROM Contract, json_each(services)
        WHERE services IS NOT NULL
      )
      GROUP BY service
      ORDER BY count DESC
      LIMIT 10`,
      args: []
    });

    return NextResponse.json({
      period,
      kpis: {
        users: {
          total: Number(userStatsResult.rows[0]?.totalUsers) || 0,
          families: Number(userStatsResult.rows[0]?.totalFamilies) || 0,
          caregivers: Number(userStatsResult.rows[0]?.totalCaregivers) || 0,
          active: Number(userStatsResult.rows[0]?.activeUsers) || 0,
          newThisPeriod: Number(userStatsResult.rows[0]?.newUsersPeriod) || 0,
          activeLast30Days: Number(userStatsResult.rows[0]?.activeLast30Days) || 0,
        },
        kyc: {
          verified: Number(kycStatsResult.rows[0]?.verifiedCaregivers) || 0,
          pending: Number(kycStatsResult.rows[0]?.pendingKyc) || 0,
          rejected: Number(kycStatsResult.rows[0]?.rejectedKyc) || 0,
          featured: Number(kycStatsResult.rows[0]?.featuredCaregivers) || 0,
        },
        contracts: {
          total: Number(contractStatsResult.rows[0]?.totalContracts) || 0,
          active: Number(contractStatsResult.rows[0]?.activeContracts) || 0,
          pending: Number(contractStatsResult.rows[0]?.pendingContracts) || 0,
          completed: Number(contractStatsResult.rows[0]?.completedContracts) || 0,
          cancelled: Number(contractStatsResult.rows[0]?.cancelledContracts) || 0,
          disputed: Number(contractStatsResult.rows[0]?.disputedContracts) || 0,
          totalValueEurCents: Number(contractStatsResult.rows[0]?.totalContractValue) || 0,
          avgValueEurCents: Number(contractStatsResult.rows[0]?.avgContractValue) || 0,
          newThisPeriod: Number(contractStatsResult.rows[0]?.newContractsPeriod) || 0,
        },
        revenue: {
          totalEurCents: Number(revenueStatsResult.rows[0]?.totalRevenue) || 0,
          periodEurCents: Number(revenueStatsResult.rows[0]?.revenuePeriod) || 0,
          activationEurCents: Number(revenueStatsResult.rows[0]?.activationRevenue) || 0,
          tokenPurchaseEurCents: Number(revenueStatsResult.rows[0]?.tokenPurchaseRevenue) || 0,
          totalTransactions: Number(revenueStatsResult.rows[0]?.totalTransactions) || 0,
          totalRefunds: Number(revenueStatsResult.rows[0]?.totalRefunds) || 0,
          refundedEurCents: Number(revenueStatsResult.rows[0]?.totalRefundedAmount) || 0,
        },
        tokens: {
          minted: Number(tokenStatsResult.rows[0]?.totalMinted) || 0,
          burned: Number(tokenStatsResult.rows[0]?.totalBurned) || 0,
          inCirculation: (Number(tokenStatsResult.rows[0]?.totalMinted) || 0) - (Number(tokenStatsResult.rows[0]?.totalBurned) || 0),
          reserveEurCents: Number(tokenStatsResult.rows[0]?.reserveEurCents) || 0,
          holders: Number(tokenStatsResult.rows[0]?.tokenHolders) || 0,
          transactionsPeriod: Number(tokenStatsResult.rows[0]?.tokenTransactionsPeriod) || 0,
        },
        quality: {
          avgRating: Number(avgRatingResult.rows[0]?.avgRating) || 0,
          totalReviews: Number(avgRatingResult.rows[0]?.totalReviews) || 0,
          disputeRate: disputeRate.toFixed(2),
        },
      },
      growth: {
        users: userGrowthResult.rows,
        revenue: revenueGrowthResult.rows,
      },
      distribution: {
        geographic: geoDistributionResult.rows,
        services: servicePopularityResult.rows,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
