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
        t.contract_id,
        t.from_user_id,
        t.to_user_id,
        t.amount_tokens,
        t.amount_eur_cents,
        t.message,
        t.tx_hash,
        t.created_at,
        u_from.name as from_name,
        u_to.name as to_name,
        c.title as contract_title
      FROM tips t
      INNER JOIN users u_from ON t.from_user_id = u_from.id
      INNER JOIN users u_to ON t.to_user_id = u_to.id
      LEFT JOIN contracts c ON t.contract_id = c.id
      WHERE (t.from_user_id = ? OR t.to_user_id = ?)
    `;
    const args: string[] = [session.user.id, session.user.id];

    if (contractId) {
      sql += ` AND t.contract_id = ?`;
      args.push(contractId);
    }

    if (toUserId) {
      sql += ` AND t.to_user_id = ?`;
      args.push(toUserId);
    }

    sql += ` ORDER BY t.created_at DESC LIMIT ?`;
    args.push(limit.toString());

    const result = await db.execute({ sql, args });

    const tips = result.rows.map(row => ({
      id: row.id,
      contractId: row.contract_id,
      fromUserId: row.from_user_id,
      toUserId: row.to_user_id,
      amountTokens: row.amount_tokens,
      amountEurCents: row.amount_eur_cents,
      message: row.message,
      txHash: row.tx_hash,
      createdAt: row.created_at,
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
      sql: `SELECT id, balance_tokens FROM wallets WHERE user_id = ?`,
      args: [session.user.id]
    });

    if (senderWallet.rows.length === 0) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    const currentBalance = senderWallet.rows[0].balance_tokens as number;
    
    if (currentBalance < amountTokens) {
      return NextResponse.json({ error: 'Insufficient token balance' }, { status: 400 });
    }

    // Get recipient's wallet
    const recipientWallet = await db.execute({
      sql: `SELECT id FROM wallets WHERE user_id = ?`,
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
      sql: `UPDATE wallets SET balance_tokens = balance_tokens - ?, balance_eur_cents = balance_eur_cents - ?, updated_at = ? WHERE user_id = ?`,
      args: [amountTokens, amountEurCents, now, session.user.id]
    });

    // Credit recipient
    await db.execute({
      sql: `UPDATE wallets SET balance_tokens = balance_tokens + ?, balance_eur_cents = balance_eur_cents + ?, updated_at = ? WHERE user_id = ?`,
      args: [amountTokens, amountEurCents, now, toUserId]
    });

    // Create tip record
    await db.execute({
      sql: `INSERT INTO tips (id, contract_id, from_user_id, to_user_id, amount_tokens, amount_eur_cents, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [tipId, contractId || null, session.user.id, toUserId, amountTokens, amountEurCents, message || null, now]
    });

    // Create ledger entries
    await db.execute({
      sql: `INSERT INTO token_ledger (id, user_id, type, reason, amount_tokens, amount_eur_cents, reference_type, reference_id, description, created_at) VALUES (?, ?, 'DEBIT', 'TIP_SENT', ?, ?, 'Tip', ?, 'Gorjeta enviada', ?)`,
      args: [`ledger-tip-${session.user.id}-${Date.now()}`, session.user.id, amountTokens, amountEurCents, tipId, now]
    });

    await db.execute({
      sql: `INSERT INTO token_ledger (id, user_id, type, reason, amount_tokens, amount_eur_cents, reference_type, reference_id, description, created_at) VALUES (?, ?, 'CREDIT', 'TIP_RECEIVED', ?, ?, 'Tip', ?, 'Gorjeta recebida', ?)`,
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
