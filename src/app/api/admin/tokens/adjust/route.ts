import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// POST - Manual token adjustment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminCheck = await db.execute({
      sql: `SELECT role FROM User WHERE id = ?`,
      args: [session.user.id]
    });
    
    const role = adminCheck.rows[0]?.role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, type, amount, reason, description } = body;

    if (!userId || !type || !amount || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (type !== 'CREDIT' && type !== 'DEBIT') {
      return NextResponse.json({ error: 'Type must be CREDIT or DEBIT' }, { status: 400 });
    }

    // Get user wallet
    const wallet = await db.execute({
      sql: `SELECT * FROM Wallet WHERE userId = ?`,
      args: [userId]
    });

    if (wallet.rows.length === 0) {
      return NextResponse.json({ error: 'User wallet not found' }, { status: 404 });
    }

    const w = wallet.rows[0] as any;
    const amountTokens = type === 'CREDIT' ? amount : -amount;

    // Check if user has enough tokens for debit
    if (type === 'DEBIT' && w.balanceTokens < amount) {
      return NextResponse.json({ error: 'Insufficient token balance' }, { status: 400 });
    }

    // Update wallet
    await db.execute({
      sql: `UPDATE Wallet SET balanceTokens = balanceTokens + ?, updatedAt = CURRENT_TIMESTAMP WHERE userId = ?`,
      args: [amountTokens, userId]
    });

    // Add ledger entry
    await db.execute({
      sql: `INSERT INTO TokenLedger (id, userId, type, reason, amountTokens, amountEurCents, description, referenceType, createdAt)
            VALUES (?, ?, ?, 'ADJUSTMENT', ?, ?, ?, 'ADMIN', CURRENT_TIMESTAMP)`,
      args: [`tl_${Date.now()}`, userId, type, amountTokens, Math.abs(amountTokens), description || reason]
    });

    // Update platform settings if credit (mint new tokens)
    if (type === 'CREDIT') {
      await db.execute({
        sql: `UPDATE PlatformSettings SET totalTokensMinted = totalTokensMinted + ?`,
        args: [amount]
      });
    } else {
      await db.execute({
        sql: `UPDATE PlatformSettings SET totalTokensBurned = totalTokensBurned + ?`,
        args: [amount]
      });
    }

    // Log action
    await db.execute({
      sql: `INSERT INTO AdminAction (adminUserId, action, entityType, entityId, newValue, reason, ipAddress, createdAt)
            VALUES (?, 'TOKEN_ADJUSTMENT', 'WALLET', ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      args: [session.user.id, w.id, JSON.stringify({ type, amount }), reason, request.headers.get('x-forwarded-for') || 'unknown']
    });

    return NextResponse.json({
      success: true,
      message: `Tokens ${type === 'CREDIT' ? 'credited' : 'debited'}`,
      adjustment: {
        userId,
        type,
        amount,
        newBalance: w.balanceTokens + amountTokens
      }
    });
  } catch (error) {
    console.error('Error adjusting tokens:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
