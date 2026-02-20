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

// GET - User analytics and growth charts
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

    // === User Growth Over Time ===
    let dateFormat = "DATE(createdAt)";
    if (groupBy === 'week') {
      dateFormat = "strftime('%Y-%W', createdAt)";
    } else if (groupBy === 'month') {
      dateFormat = "strftime('%Y-%m', createdAt)";
    }

    const userGrowthResult = await db.execute({
      sql: `SELECT 
        ${dateFormat} as date,
        role,
        COUNT(*) as newUsers
      FROM User
      WHERE createdAt >= datetime('now', '-' || ? || ' days')
      GROUP BY ${dateFormat}, role
      ORDER BY date`,
      args: [daysAgo]
    });

    // === Cumulative User Count ===
    const cumulativeUsersResult = await db.execute({
      sql: `SELECT 
        strftime('%Y-%m', createdAt) as month,
        role,
        COUNT(*) as monthlyNew
      FROM User
      WHERE createdAt >= datetime('now', '-12 months')
      GROUP BY strftime('%Y-%m', createdAt), role
      ORDER BY month`,
      args: []
    });

    // === User Status Distribution ===
    const statusDistributionResult = await db.execute({
      sql: `SELECT 
        status,
        role,
        COUNT(*) as count
      FROM User
      GROUP BY status, role
      ORDER BY role, status`,
      args: []
    });

    // === User Activity (Last Login) ===
    const userActivityResult = await db.execute({
      sql: `SELECT 
        CASE 
          WHEN lastLoginAt >= datetime('now', '-1 day') THEN 'today'
          WHEN lastLoginAt >= datetime('now', '-7 days') THEN 'last7days'
          WHEN lastLoginAt >= datetime('now', '-30 days') THEN 'last30days'
          WHEN lastLoginAt >= datetime('now', '-90 days') THEN 'last90days'
          ELSE 'inactive'
        END as activityBucket,
        role,
        COUNT(*) as count
      FROM User
      GROUP BY activityBucket, role
      ORDER BY 
        CASE activityBucket
          WHEN 'today' THEN 1
          WHEN 'last7days' THEN 2
          WHEN 'last30days' THEN 3
          WHEN 'last90days' THEN 4
          ELSE 5
        END`,
      args: []
    });

    // === Geographic Distribution ===
    const geographicResult = await db.execute({
      sql: `SELECT 
        COALESCE(pf.city, pc.city) as city,
        COALESCE(pf.country, pc.country, 'PT') as country,
        u.role,
        COUNT(DISTINCT u.id) as userCount
      FROM User u
      LEFT JOIN ProfileFamily pf ON u.id = pf.userId
      LEFT JOIN ProfileCaregiver pc ON u.id = pc.userId
      WHERE COALESCE(pf.city, pc.city) IS NOT NULL
      GROUP BY COALESCE(pf.city, pc.city), COALESCE(pf.country, pc.country, 'PT'), u.role
      ORDER BY userCount DESC
      LIMIT 20`,
      args: []
    });

    // === Caregiver Specific Analytics ===
    const caregiverStatsResult = await db.execute({
      sql: `SELECT 
        verificationStatus,
        COUNT(*) as count,
        AVG(totalContracts) as avgContracts,
        AVG(totalHoursWorked) as avgHours,
        AVG(averageRating) as avgRating
      FROM ProfileCaregiver
      GROUP BY verificationStatus`,
      args: []
    });

    // === Top Performers (Caregivers) ===
    const topCaregiversResult = await db.execute({
      sql: `SELECT 
        u.id,
        u.name,
        u.email,
        pc.title,
        pc.city,
        pc.totalContracts,
        pc.totalHoursWorked,
        pc.averageRating,
        pc.totalReviews,
        pc.verificationStatus,
        pc.featured
      FROM User u
      JOIN ProfileCaregiver pc ON u.id = pc.userId
      WHERE pc.totalContracts > 0
      ORDER BY pc.totalContracts DESC, pc.averageRating DESC
      LIMIT 10`,
      args: []
    });

    // === Family Engagement ===
    const familyEngagementResult = await db.execute({
      sql: `SELECT 
        u.id,
        u.name,
        u.email,
        pf.elderName,
        pf.city,
        (SELECT COUNT(*) FROM Contract WHERE familyUserId = u.id) as totalContracts,
        (SELECT COUNT(*) FROM Contract WHERE familyUserId = u.id AND status = 'ACTIVE') as activeContracts,
        (SELECT COALESCE(SUM(totalEurCents), 0) FROM Contract WHERE familyUserId = u.id) as totalSpent,
        w.balanceTokens as tokenBalance
      FROM User u
      JOIN ProfileFamily pf ON u.id = pf.userId
      LEFT JOIN Wallet w ON u.id = w.userId
      ORDER BY totalContracts DESC
      LIMIT 10`,
      args: []
    });

    // === Registration Sources (if tracked) ===
    // Note: This would require a registrationSource field, using placeholder

    // === Retention Cohorts ===
    const retentionResult = await db.execute({
      sql: `SELECT 
        strftime('%Y-%m', createdAt) as cohortMonth,
        role,
        COUNT(*) as totalUsers,
        SUM(CASE WHEN lastLoginAt >= datetime('now', '-30 days') THEN 1 ELSE 0 END) as activeLast30Days,
        SUM(CASE WHEN lastLoginAt >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as activeLast7Days
      FROM User
      WHERE createdAt >= datetime('now', '-6 months')
      GROUP BY strftime('%Y-%m', createdAt), role
      ORDER BY cohortMonth DESC`,
      args: []
    });

    // === Summary Stats ===
    const summaryResult = await db.execute({
      sql: `SELECT 
        (SELECT COUNT(*) FROM User) as totalUsers,
        (SELECT COUNT(*) FROM User WHERE role = 'FAMILY') as totalFamilies,
        (SELECT COUNT(*) FROM User WHERE role = 'CAREGIVER') as totalCaregivers,
        (SELECT COUNT(*) FROM User WHERE status = 'ACTIVE') as activeUsers,
        (SELECT COUNT(*) FROM User WHERE status = 'SUSPENDED') as suspendedUsers,
        (SELECT COUNT(*) FROM User WHERE status = 'INACTIVE') as inactiveUsers,
        (SELECT COUNT(*) FROM User WHERE createdAt >= datetime('now', '-30 days')) as newLast30Days,
        (SELECT COUNT(*) FROM User WHERE createdAt >= datetime('now', '-7 days')) as newLast7Days,
        (SELECT COUNT(*) FROM User WHERE createdAt >= datetime('now', '-1 day')) as newToday,
        (SELECT COUNT(*) FROM User WHERE lastLoginAt >= datetime('now', '-30 days')) as activeLast30Days,
        (SELECT COUNT(*) FROM User WHERE lastLoginAt >= datetime('now', '-7 days')) as activeLast7Days,
        (SELECT COUNT(*) FROM User WHERE lastLoginAt >= datetime('now', '-1 day')) as activeToday,
        (SELECT COUNT(DISTINCT userId) FROM Wallet WHERE balanceTokens > 0) as tokenHolders`,
      args: []
    });

    return NextResponse.json({
      period,
      groupBy,
      growth: {
        timeline: userGrowthResult.rows,
        cumulative: cumulativeUsersResult.rows,
      },
      distribution: {
        status: statusDistributionResult.rows,
        geographic: geographicResult.rows,
      },
      activity: userActivityResult.rows,
      caregivers: {
        stats: caregiverStatsResult.rows,
        topPerformers: topCaregiversResult.rows,
      },
      families: {
        topEngaged: familyEngagementResult.rows,
      },
      retention: retentionResult.rows,
      summary: {
        totalUsers: Number(summaryResult.rows[0]?.totalUsers) || 0,
        totalFamilies: Number(summaryResult.rows[0]?.totalFamilies) || 0,
        totalCaregivers: Number(summaryResult.rows[0]?.totalCaregivers) || 0,
        activeUsers: Number(summaryResult.rows[0]?.activeUsers) || 0,
        suspendedUsers: Number(summaryResult.rows[0]?.suspendedUsers) || 0,
        inactiveUsers: Number(summaryResult.rows[0]?.inactiveUsers) || 0,
        newLast30Days: Number(summaryResult.rows[0]?.newLast30Days) || 0,
        newLast7Days: Number(summaryResult.rows[0]?.newLast7Days) || 0,
        newToday: Number(summaryResult.rows[0]?.newToday) || 0,
        activeLast30Days: Number(summaryResult.rows[0]?.activeLast30Days) || 0,
        activeLast7Days: Number(summaryResult.rows[0]?.activeLast7Days) || 0,
        activeToday: Number(summaryResult.rows[0]?.activeToday) || 0,
        tokenHolders: Number(summaryResult.rows[0]?.tokenHolders) || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
