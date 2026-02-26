import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// GET: List tips
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get('contractId');
    const toUserId = searchParams.get('toUserId');
    const limit = parseInt(searchParams.get('limit') || '20');

    let sql = `
      SELECT 
        t.id,
        t.contractId,
        t.fromUserId,
        t.toUserId,
        t.amountTokens,
        t.amountEurCents,
        t.message,
        t.txHash,
        t.createdAt,
        u_from.name as from_name,
        u_to.name as to_name,
        c.title as contract_title
      FROM Tip t
      INNER JOIN User u_from ON t.fromUserId = u_from.id
      INNER JOIN User u_to ON t.toUserId = u_to.id
      LEFT JOIN Contract c ON t.contractId = c.id
      WHERE (t.fromUserId = ? OR t.toUserId = ?)
    `;
    const args: string[] = [session.user.id, session.user.id];

    if (contractId) {
      sql += ` AND t.contractId = ?`;
      args.push(contractId);
    }

    if (toUserId) {
      sql += ` AND t.toUserId = ?`;
      args.push(toUserId);
    }

    sql += ` ORDER BY t.createdAt DESC LIMIT ?`;
    args.push(limit.toString());

    const result = await db.execute({ sql, args });

    const tips = result.rows.map(row => ({
      id: row.id,
      contractId: row.contractId,
      fromUserId: row.fromUserId,
      toUserId: row.toUserId,
      amountTokens: row.amountTokens,
      amountEurCents: row.amountEurCents,
      message: row.message,
      txHash: row.txHash,
      createdAt: row.createdAt,
      from: { name: row.from_name },
      to: { name: row.to_name },
      contract: { title: row.contract_title },
    }));

    return NextResponse.json({ tips });
  } catch (error) {
    console.error('Error fetching tips:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Send a tip
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contractId, toUserId, amountTokens, message } = body;

    if (!toUserId || !amountTokens || amountTokens <= 0) {
      return NextResponse.json({ error: 'toUserId and amountTokens (> 0) are required' }, { status: 400 });
    }

    // Get sender's wallet
    const senderWallet = await db.execute({
      sql: `SELECT id, balanceTokens FROM Wallet WHERE userId = ?`,
      args: [session.user.id]
    });

    if (senderWallet.rows.length === 0) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    const currentBalance = senderWallet.rows[0].balanceTokens as number;
    
    if (currentBalance < amountTokens) {
      return NextResponse.json({ error: 'Insufficient token balance' }, { status: 400 });
    }

    // Get recipient's wallet
    const recipientWallet = await db.execute({
      sql: `SELECT id FROM Wallet WHERE userId = ?`,
      args: [toUserId]
    });

    if (recipientWallet.rows.length === 0) {
      return NextResponse.json({ error: 'Recipient wallet not found' }, { status: 404 });
    }

    const tipId = `tip-${Date.now()}`;
    const now = new Date().toISOString();
    const amountEurCents = amountTokens; // 1:1 conversion

    // Debit sender
    await db.execute({
      sql: `UPDATE Wallet SET balanceTokens = balanceTokens - ?, balanceEurCents = balanceEurCents - ?, updatedAt = ? WHERE userId = ?`,
      args: [amountTokens, amountEurCents, now, session.user.id]
    });

    // Credit recipient
    await db.execute({
      sql: `UPDATE Wallet SET balanceTokens = balanceTokens + ?, balanceEurCents = balanceEurCents + ?, updatedAt = ? WHERE userId = ?`,
      args: [amountTokens, amountEurCents, now, toUserId]
    });

    // Create tip record
    await db.execute({
      sql: `INSERT INTO Tip (id, contractId, fromUserId, toUserId, amountTokens, amountEurCents, message, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [tipId, contractId || null, session.user.id, toUserId, amountTokens, amountEurCents, message || null, now]
    });

    // Create ledger entries
    await db.execute({
      sql: `INSERT INTO TokenLedger (id, userId, type, reason, amountTokens, amountEurCents, referenceType, referenceId, description, createdAt) VALUES (?, ?, 'DEBIT', 'TIP_SENT', ?, ?, 'Tip', ?, 'Gorjeta enviada', ?)`,
      args: [`ledger-tip-${session.user.id}-${Date.now()}`, session.user.id, amountTokens, amountEurCents, tipId, now]
    });

    await db.execute({
      sql: `INSERT INTO TokenLedger (id, userId, type, reason, amountTokens, amountEurCents, referenceType, referenceId, description, createdAt) VALUES (?, ?, 'CREDIT', 'TIP_RECEIVED', ?, ?, 'Tip', ?, 'Gorjeta recebida', ?)`,
      args: [`ledger-tip-${toUserId}-${Date.now()}`, toUserId, amountTokens, amountEurCents, tipId, now]
    });

    return NextResponse.json({ 
      tipId,
      message: 'Tip sent successfully',
      newBalance: currentBalance - amountTokens
    });
  } catch (error) {
    console.error('Error sending tip:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
