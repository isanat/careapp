import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's wallet from Turso
    const walletResult = await db.execute({
      sql: `SELECT id, address, balanceTokens, balanceEurCents 
            FROM Wallet 
            WHERE userId = ?`,
      args: [session.user.id]
    });

    if (walletResult.rows.length === 0) {
      return NextResponse.json({ 
        wallet: null,
        transactions: [],
      });
    }

    const wallet = walletResult.rows[0];

    // Get recent transactions from Turso
    const transactionsResult = await db.execute({
      sql: `SELECT id, type, reason, amountTokens, amountEurCents, description, createdAt
            FROM TokenLedger 
            WHERE userId = ? 
            ORDER BY createdAt DESC 
            LIMIT 10`,
      args: [session.user.id]
    });

    return NextResponse.json({
      wallet: {
        id: wallet.id,
        address: wallet.address,
        balanceTokens: Number(wallet.balanceTokens) || 0,
        balanceEurCents: Number(wallet.balanceEurCents) || 0,
      },
      transactions: transactionsResult.rows.map(tx => ({
        id: tx.id,
        type: tx.type,
        reason: tx.reason,
        tokens: Number(tx.amountTokens) || 0,
        eurCents: Number(tx.amountEurCents) || 0,
        description: tx.description,
        date: tx.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
