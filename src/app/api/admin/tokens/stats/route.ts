import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// Helper function to verify admin access
async function verifyAdminAccess(sessionUserId: string): Promise<{ authorized: boolean; adminUserId?: string; role?: string; error?: string }> {
  // Check if user has ADMIN role
  const userResult = await db.execute({
    sql: `SELECT role FROM User WHERE id = ?`,
    args: [sessionUserId]
  });

  const userRole = userResult.rows[0]?.role as string;
  if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
    return { authorized: false, error: 'Forbidden - Admin access required' };
  }

  // Check AdminUser table for role
  const adminResult = await db.execute({
    sql: `SELECT id, role FROM AdminUser WHERE userId = ? AND isActive = 1`,
    args: [sessionUserId]
  });

  if (adminResult.rows.length === 0) {
    // User has ADMIN role but no AdminUser profile - allow for legacy admins
    return { authorized: true, adminUserId: sessionUserId, role: userRole };
  }

  return { 
    authorized: true, 
    adminUserId: adminResult.rows[0].id as string,
    role: adminResult.rows[0].role as string 
  };
}

// GET - Token statistics
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

    // Get platform settings for token data
    const settingsResult = await db.execute({
      sql: `SELECT 
        totalTokensMinted, 
        totalTokensBurned, 
        totalReserveEurCents,
        tokenPriceEurCents, 
        activationCostEurCents, 
        contractFeeEurCents,
        platformFeePercent
      FROM PlatformSettings LIMIT 1`,
      args: []
    });

    const settings = settingsResult.rows[0] || {
      totalTokensMinted: 0,
      totalTokensBurned: 0,
      totalReserveEurCents: 0,
      tokenPriceEurCents: 1,
      activationCostEurCents: 3500,
      contractFeeEurCents: 500,
      platformFeePercent: 15,
    };

    // Get total tokens in wallets (in circulation)
    const circulationResult = await db.execute({
      sql: `SELECT 
        COALESCE(SUM(balanceTokens), 0) as totalInWallets,
        COUNT(*) as totalWallets,
        COUNT(CASE WHEN balanceTokens > 0 THEN 1 END) as walletsHoldingTokens
      FROM Wallet`,
      args: []
    });

    // Get token distribution by reason
    const distributionResult = await db.execute({
      sql: `SELECT 
        reason, 
        type,
        SUM(amountTokens) as totalTokens,
        SUM(amountEurCents) as totalEurCents,
        COUNT(*) as transactionCount
      FROM TokenLedger
      GROUP BY reason, type
      ORDER BY totalTokens DESC`,
      args: []
    });

    // Get top token holders
    const topHoldersResult = await db.execute({
      sql: `SELECT 
        u.id,
        u.name, 
        u.email, 
        u.role,
        w.balanceTokens
      FROM Wallet w
      JOIN User u ON w.userId = u.id
      WHERE w.balanceTokens > 0
      ORDER BY w.balanceTokens DESC
      LIMIT 10`,
      args: []
    });

    // Get token activity summary (last 30 days)
    const activityResult = await db.execute({
      sql: `SELECT 
        DATE(createdAt) as date,
        type,
        SUM(amountTokens) as totalTokens,
        COUNT(*) as transactions
      FROM TokenLedger
      WHERE createdAt >= datetime('now', '-30 days')
      GROUP BY DATE(createdAt), type
      ORDER BY date DESC`,
      args: []
    });

    // Get counts
    const minted = Number(settings.totalTokensMinted) || 0;
    const burned = Number(settings.totalTokensBurned) || 0;
    const inCirculation = Number(circulationResult.rows[0]?.totalInWallets) || 0;

    return NextResponse.json({
      stats: {
        minted,
        burned,
        inCirculation,
        reserve: Number(settings.totalReserveEurCents) || 0,
        price: Number(settings.tokenPriceEurCents) || 1,
        activationCost: Number(settings.activationCostEurCents) || 3500,
        contractFee: Number(settings.contractFeeEurCents) || 500,
        platformFeePercent: Number(settings.platformFeePercent) || 15,
      },
      wallets: {
        total: Number(circulationResult.rows[0]?.totalWallets) || 0,
        holdingTokens: Number(circulationResult.rows[0]?.walletsHoldingTokens) || 0,
      },
      distribution: distributionResult.rows,
      topHolders: topHoldersResult.rows,
      activity: activityResult.rows,
    });
  } catch (error) {
    console.error('Error fetching token stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
