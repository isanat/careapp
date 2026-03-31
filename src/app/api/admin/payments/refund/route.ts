import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { db } from '@/lib/db-turso';
import { generateId } from '@/lib/utils/id';

// POST - Process refund
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    const { adminUserId } = auth;

    const body = await request.json();
    const { paymentId, amount, reason } = body;

    if (!paymentId || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Get payment details
    const paymentResult = await db.execute({
      sql: `SELECT * FROM Payment WHERE id = ?`,
      args: [paymentId]
    });

    if (paymentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const payment = paymentResult.rows[0];
    const refundAmount = amount || payment.amountEurCents;

    // Update payment status
    await db.execute({
      sql: `UPDATE Payment SET status = 'REFUNDED', refundedAt = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [now, paymentId]
    });

    // Log admin action
    await db.execute({
      sql: `INSERT INTO AdminAction (id, adminUserId, action, entityType, entityId, newValue, reason, createdAt)
        VALUES (?, ?, 'REFUND', 'PAYMENT', ?, ?, ?, ?)`,
      args: [generateId("action"), adminUserId, paymentId, JSON.stringify({ amount: refundAmount }), reason, now]
    });

    return NextResponse.json({ success: true, paymentId, refundAmount });
  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
