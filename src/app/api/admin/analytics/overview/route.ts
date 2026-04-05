import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { db } from '@/lib/db-turso';

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
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    const { session, adminUserId } = auth;

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

    // Period-based stats
    const dateFilter = `-${daysAgo} days`;

    try {
      const newUsersResult = await db.execute({
        sql: `SELECT COUNT(*) as count FROM User WHERE createdAt >= datetime('now', ?)`,
        args: [dateFilter]
      });
      newUsersPeriod = Number(newUsersResult.rows[0]?.count) || 0;
    } catch (e) {
      console.error('Error counting new users:', e);
    }

    let newContractsPeriod = 0;
    try {
      const newContractsResult = await db.execute({
        sql: `SELECT COUNT(*) as count FROM Contract WHERE createdAt >= datetime('now', ?)`,
        args: [dateFilter]
      });
      newContractsPeriod = Number(newContractsResult.rows[0]?.count) || 0;
    } catch (e) {
      console.error('Error counting new contracts:', e);
    }

    // Revenue breakdown
    let periodRevenue = 0;
    let activationRevenue = 0;
    let refundedRevenue = 0;

    try {
      const revenueBreakdown = await db.execute({
        sql: `SELECT
          COALESCE(SUM(CASE WHEN paidAt >= datetime('now', ?) THEN amountEurCents ELSE 0 END), 0) as periodTotal,
          COALESCE(SUM(CASE WHEN type = 'ACTIVATION' THEN amountEurCents ELSE 0 END), 0) as activation
        FROM Payment WHERE status = 'COMPLETED'`,
        args: [dateFilter]
      });
      const row = revenueBreakdown.rows[0] || {};
      periodRevenue = Number(row.periodTotal) || 0;
      activationRevenue = Number(row.activation) || 0;
    } catch (e) {
      console.error('Error getting revenue breakdown:', e);
    }

    try {
      const refundResult = await db.execute({
        sql: `SELECT COALESCE(SUM(amountEurCents), 0) as total FROM Payment WHERE status = 'REFUNDED'`,
        args: []
      });
      refundedRevenue = Number(refundResult.rows[0]?.total) || 0;
    } catch (e) {
      console.error('Error getting refund stats:', e);
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

    // Growth data
    let growthUsers: { date: string; count: number }[] = [];
    let growthRevenue: { date: string; revenue: number }[] = [];

    try {
      const userGrowthResult = await db.execute({
        sql: `SELECT DATE(createdAt) as date, COUNT(*) as count FROM User WHERE createdAt >= datetime('now', ?) GROUP BY DATE(createdAt) ORDER BY date`,
        args: [dateFilter]
      });
      growthUsers = userGrowthResult.rows.map(r => ({
        date: String(r.date),
        count: Number(r.count) || 0,
      }));
    } catch (e) {
      console.error('Error getting user growth:', e);
    }

    try {
      const revenueGrowthResult = await db.execute({
        sql: `SELECT DATE(paidAt) as date, COALESCE(SUM(amountEurCents), 0) as revenue FROM Payment WHERE status = 'COMPLETED' AND paidAt >= datetime('now', ?) GROUP BY DATE(paidAt) ORDER BY date`,
        args: [dateFilter]
      });
      growthRevenue = revenueGrowthResult.rows.map(r => ({
        date: String(r.date),
        revenue: Number(r.revenue) || 0,
      }));
    } catch (e) {
      console.error('Error getting revenue growth:', e);
    }

    // Distribution data
    let geoDistribution: { city: string; count: number }[] = [];
    let serviceDistribution: { service: string; count: number }[] = [];

    try {
      const geoResult = await db.execute({
        sql: `SELECT COALESCE(pc.city, pf.city) as city, COUNT(DISTINCT u.id) as count
          FROM User u
          LEFT JOIN ProfileCaregiver pc ON u.id = pc.userId
          LEFT JOIN ProfileFamily pf ON u.id = pf.userId
          WHERE COALESCE(pc.city, pf.city) IS NOT NULL
          GROUP BY COALESCE(pc.city, pf.city)
          ORDER BY count DESC LIMIT 10`,
        args: []
      });
      geoDistribution = geoResult.rows.map(r => ({
        city: String(r.city),
        count: Number(r.count) || 0,
      }));
    } catch (e) {
      console.error('Error getting geo distribution:', e);
    }

    try {
      const serviceResult = await db.execute({
        sql: `SELECT services FROM ProfileCaregiver WHERE services IS NOT NULL AND services != ''`,
        args: []
      });
      const serviceCounts: Record<string, number> = {};
      for (const row of serviceResult.rows) {
        try {
          const services = JSON.parse(String(row.services));
          if (Array.isArray(services)) {
            for (const s of services) {
              serviceCounts[s] = (serviceCounts[s] || 0) + 1;
            }
          }
        } catch { /* skip malformed JSON */ }
      }
      serviceDistribution = Object.entries(serviceCounts)
        .map(([service, count]) => ({ service, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    } catch (e) {
      console.error('Error getting service distribution:', e);
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
          newThisPeriod: newContractsPeriod,
        },
        revenue: {
          totalEurCents: totalRevenue,
          periodEurCents: periodRevenue,
          activationEurCents: activationRevenue,
          totalTransactions: totalTransactions,
          totalRefunds: totalRefunds,
          refundedEurCents: refundedRevenue,
        },
        quality: {
          avgRating: avgRating,
          totalReviews: totalReviews,
          disputeRate: disputeRate.toFixed(2),
        },
      },
      growth: {
        users: growthUsers,
        revenue: growthRevenue,
      },
      distribution: {
        geographic: geoDistribution,
        services: serviceDistribution,
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
