import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// GET - Token statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get token stats
    const statsResult = await db.execute({
      sql: `SELECT 
        totalTokensMinted, totalTokensBurned, totalReserveEurCents,
        tokenPriceEurCents, activationCostEurCents, contractFeeEurCents,
        platformFeePercent
      FROM PlatformSettings LIMIT 1`,
      args: []
    });

    const stats = statsResult.rows[0] || {};

    // Get token distribution by reason
    const distributionResult = await db.execute({
      sql: `SELECT 
        reason, type,
        SUM(amountTokens) as totalTokens,
        SUM(amountEurCents) as totalEur,
        COUNT(*) as transactions
      FROM TokenLedger
      GROUP BY reason, type
      ORDER BY totalTokens DESC`,
      args: []
    });

    // Get top holders
    const holdersResult = await db.execute({
      sql: `SELECT 
        u.name, u.email,
        w.balanceTokens
      FROM Wallet w
      JOIN User u ON w.userId = u.id
      WHERE w.balanceTokens > 0
      ORDER BY w.balanceTokens DESC
      LIMIT 10`,
      args: []
    });

    // Get recent transactions
    const recentResult = await db.execute({
      sql: `SELECT 
        tl.type, tl.reason, tl.amountTokens, tl.description, tl.createdAt,
        u.name as userName
      FROM TokenLedger tl
      LEFT JOIN User u ON tl.userId = u.id
      ORDER BY tl.createdAt DESC
      LIMIT 20`,
      args: []
    });

    // Get total in circulation
    const circulationResult = await db.execute({
      sql: `SELECT 
        COALESCE(SUM(balanceTokens), 0) as totalInWallets
      FROM Wallet`,
      args: []
    });

    return NextResponse.json({
      stats: {
        minted: stats.totalTokensMinted || 0,
        burned: stats.totalTokensBurned || 0,
        reserve: stats.totalReserveEurCents || 0,
        price: stats.tokenPriceEurCents || 1,
        activationCost: stats.activationCostEurCents || 3500,
        contractFee: stats.contractFeeEurCents || 500,
        platformFeePercent: stats.platformFeePercent || 15,
        inCirculation: circulationResult.rows[0]?.totalInWallets || 0,
      },
      distribution: distributionResult.rows,
      topHolders: holdersResult.rows,
      recentTransactions: recentResult.rows,
    });
  } catch (error) {
    console.error('Error fetching token stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Manual token adjustment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, amount, type, reason, description } = body;
    // type: 'CREDIT' or 'DEBIT'

    if (!userId || !amount || !type || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Update wallet balance
    if (type === 'CREDIT') {
      await db.execute({
        sql: `UPDATE Wallet SET balanceTokens = balanceTokens + ?, updatedAt = CURRENT_TIMESTAMP WHERE userId = ?`,
        args: [amount, userId]
      });
    } else {
      await db.execute({
        sql: `UPDATE Wallet SET balanceTokens = MAX(0, balanceTokens - ?), updatedAt = CURRENT_TIMESTAMP WHERE userId = ?`,
        args: [amount, userId]
      });
    }

    // Create ledger entry
    await db.execute({
      sql: `INSERT INTO TokenLedger (id, userId, type, reason, amountTokens, description, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [`tl-${Date.now()}`, userId, type, reason, amount, description, now]
    });

    // Log admin action
    await db.execute({
      sql: `INSERT INTO AdminAction (id, adminUserId, action, entityType, entityId, newValue, reason, createdAt)
        VALUES (?, ?, 'TOKEN_ADJUSTMENT', 'USER', ?, ?, ?, ?)`,
      args: [`action-${Date.now()}`, session.user.id, userId, JSON.stringify({ amount, type }), reason, now]
    });

    return NextResponse.json({ success: true, userId, amount, type });
  } catch (error) {
    console.error('Error adjusting tokens:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
