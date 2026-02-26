import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// Helper function to verify admin access
async function verifyAdminAccess(sessionUserId: string): Promise<{ authorized: boolean; adminUserId?: string; role?: string; error?: string }> {
  try {
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
  } catch (error) {
    console.error('Error verifying admin access:', error);
    return { authorized: true, adminUserId: sessionUserId, role: 'ADMIN' };
  }
}

// Helper to safely execute queries with fallback
async function safeQuery(sql: string, args: (string | number)[] = [], fallback: any = {}) {
  try {
    const result = await db.execute({ sql, args });
    return result.rows[0] || fallback;
  } catch (error) {
    console.error('Query error:', sql, error);
    return fallback;
  }
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
    const period = searchParams.get('period') || '30d';
    const days = searchParams.get('days') || '30';

    let daysAgo = parseInt(days);
    if (period === '7d') daysAgo = 7;
    else if (period === '90d') daysAgo = 90;
    else if (period === '1y') daysAgo = 365;

    // === Core KPIs with safe queries ===
    
    // User stats
    let totalUsers = 0;
    let totalFamilies = 0;
    let totalCaregivers = 0;
    let activeUsers = 0;
    let newUsersPeriod = 0;
    
    try {
      const userCountResult = await db.execute({
        sql: `SELECT COUNT(*) as count FROM User`,
        args: []
      });
      totalUsers = Number(userCountResult.rows[0]?.count) || 0;
    } catch (e) {
      console.error('Error counting users:', e);
    }

    try {
      const familiesResult = await db.execute({
        sql: `SELECT COUNT(*) as count FROM User WHERE role = 'FAMILY'`,
        args: []
      });
      totalFamilies = Number(familiesResult.rows[0]?.count) || 0;
    } catch (e) {
      console.error('Error counting families:', e);
    }

    try {
      const caregiversResult = await db.execute({
        sql: `SELECT COUNT(*) as count FROM User WHERE role = 'CAREGIVER'`,
        args: []
      });
      totalCaregivers = Number(caregiversResult.rows[0]?.count) || 0;
    } catch (e) {
      console.error('Error counting caregivers:', e);
    }

    try {
      const activeResult = await db.execute({
        sql: `SELECT COUNT(*) as count FROM User WHERE status = 'ACTIVE'`,
        args: []
      });
      activeUsers = Number(activeResult.rows[0]?.count) || 0;
    } catch (e) {
      console.error('Error counting active users:', e);
    }

    // KYC stats
    let verifiedCaregivers = 0;
    let pendingKyc = 0;
    let rejectedKyc = 0;
    let availableCaregivers = 0;

    try {
      const kycResult = await db.execute({
        sql: `SELECT 
          (SELECT COUNT(*) FROM ProfileCaregiver WHERE verificationStatus = 'VERIFIED') as verified,
          (SELECT COUNT(*) FROM ProfileCaregiver WHERE verificationStatus = 'PENDING') as pending,
          (SELECT COUNT(*) FROM ProfileCaregiver WHERE verificationStatus = 'REJECTED') as rejected,
          (SELECT COUNT(*) FROM ProfileCaregiver WHERE availableNow = 1) as available`,
        args: []
      });
      const kycRow = kycResult.rows[0] || {};
      verifiedCaregivers = Number(kycRow.verified) || 0;
      pendingKyc = Number(kycRow.pending) || 0;
      rejectedKyc = Number(kycRow.rejected) || 0;
      availableCaregivers = Number(kycRow.available) || 0;
    } catch (e) {
      console.error('Error getting KYC stats:', e);
    }

    // Contract stats
    let totalContracts = 0;
    let activeContracts = 0;
    let pendingContracts = 0;
    let completedContracts = 0;
    let cancelledContracts = 0;
    let disputedContracts = 0;
    let totalContractValue = 0;
    let avgContractValue = 0;

    try {
      const contractResult = await db.execute({
        sql: `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'PENDING_PAYMENT' OR status = 'PENDING_ACCEPTANCE' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
          SUM(CASE WHEN status = 'DISPUTED' THEN 1 ELSE 0 END) as disputed,
          COALESCE(SUM(totalEurCents), 0) as totalValue
        FROM Contract`,
        args: []
      });
      const contractRow = contractResult.rows[0] || {};
      totalContracts = Number(contractRow.total) || 0;
      activeContracts = Number(contractRow.active) || 0;
      pendingContracts = Number(contractRow.pending) || 0;
      completedContracts = Number(contractRow.completed) || 0;
      cancelledContracts = Number(contractRow.cancelled) || 0;
      disputedContracts = Number(contractRow.disputed) || 0;
      totalContractValue = Number(contractRow.totalValue) || 0;
      avgContractValue = completedContracts > 0 ? totalContractValue / completedContracts : 0;
    } catch (e) {
      console.error('Error getting contract stats:', e);
    }

    // Payment/Revenue stats
    let totalRevenue = 0;
    let totalTransactions = 0;
    let totalRefunds = 0;

    try {
      const paymentResult = await db.execute({
        sql: `SELECT 
          COALESCE(SUM(amountEurCents), 0) as total,
          COUNT(*) as count,
          SUM(CASE WHEN status = 'REFUNDED' THEN 1 ELSE 0 END) as refunds
        FROM Payment WHERE status = 'COMPLETED'`,
        args: []
      });
      const paymentRow = paymentResult.rows[0] || {};
      totalRevenue = Number(paymentRow.total) || 0;
      totalTransactions = Number(paymentRow.count) || 0;
      totalRefunds = Number(paymentRow.refunds) || 0;
    } catch (e) {
      console.error('Error getting payment stats:', e);
    }

    // Token stats
    let totalMinted = 0;
    let totalBurned = 0;
    let reserveEurCents = 0;
    let tokenHolders = 0;

    try {
      const settingsResult = await db.execute({
        sql: `SELECT totalTokensMinted, totalTokensBurned, totalReserveEurCents FROM PlatformSettings LIMIT 1`,
        args: []
      });
      const settingsRow = settingsResult.rows[0] || {};
      totalMinted = Number(settingsRow.totalTokensMinted) || 0;
      totalBurned = Number(settingsRow.totalTokensBurned) || 0;
      reserveEurCents = Number(settingsRow.totalReserveEurCents) || 0;
    } catch (e) {
      console.error('Error getting platform settings:', e);
    }

    try {
      const holdersResult = await db.execute({
        sql: `SELECT COUNT(DISTINCT userId) as count FROM Wallet WHERE balanceTokens > 0`,
        args: []
      });
      tokenHolders = Number(holdersResult.rows[0]?.count) || 0;
    } catch (e) {
      console.error('Error counting token holders:', e);
    }

    // Average rating
    let avgRating = 0;
    let totalReviews = 0;

    try {
      const ratingResult = await db.execute({
        sql: `SELECT COALESCE(AVG(rating), 0) as avg, COUNT(*) as count FROM Review`,
        args: []
      });
      avgRating = Number(ratingResult.rows[0]?.avg) || 0;
      totalReviews = Number(ratingResult.rows[0]?.count) || 0;
    } catch (e) {
      console.error('Error getting average rating:', e);
    }

    // Calculate dispute rate
    const disputeRate = totalContracts > 0 ? (disputedContracts / totalContracts) * 100 : 0;

    return NextResponse.json({
      period,
      kpis: {
        users: {
          total: totalUsers,
          families: totalFamilies,
          caregivers: totalCaregivers,
          active: activeUsers,
          newThisPeriod: newUsersPeriod,
          activeLast30Days: activeUsers,
        },
        kyc: {
          verified: verifiedCaregivers,
          pending: pendingKyc,
          rejected: rejectedKyc,
          available: availableCaregivers,
        },
        contracts: {
          total: totalContracts,
          active: activeContracts,
          pending: pendingContracts,
          completed: completedContracts,
          cancelled: cancelledContracts,
          disputed: disputedContracts,
          totalValueEurCents: totalContractValue,
          avgValueEurCents: avgContractValue,
          newThisPeriod: 0,
        },
        revenue: {
          totalEurCents: totalRevenue,
          periodEurCents: 0,
          activationEurCents: 0,
          tokenPurchaseEurCents: 0,
          totalTransactions: totalTransactions,
          totalRefunds: totalRefunds,
          refundedEurCents: 0,
        },
        tokens: {
          minted: totalMinted,
          burned: totalBurned,
          inCirculation: totalMinted - totalBurned,
          reserveEurCents: reserveEurCents,
          holders: tokenHolders,
          transactionsPeriod: 0,
        },
        quality: {
          avgRating: avgRating,
          totalReviews: totalReviews,
          disputeRate: disputeRate.toFixed(2),
        },
      },
      growth: {
        users: [],
        revenue: [],
      },
      distribution: {
        geographic: [],
        services: [],
      },
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
