import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { db } from '@/lib/db-turso';

// GET - List refunds
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    // Get refunded payments
    const refunded = await db.execute({
      sql: `
        SELECT p.*, u.name as userName, u.email as userEmail
        FROM Payment p
        JOIN User u ON p.userId = u.id
        WHERE p.status = 'REFUNDED' OR p.refundedAt IS NOT NULL
        ORDER BY p.refundedAt DESC
      `,
      args: []
    });

    // Get payments that can be refunded (completed, not refunded)
    const refundable = await db.execute({
      sql: `
        SELECT p.*, u.name as userName, u.email as userEmail, w.balanceTokens as userTokenBalance
        FROM Payment p
        JOIN User u ON p.userId = u.id
        LEFT JOIN Wallet w ON u.id = w.userId
        WHERE p.status = 'COMPLETED' AND p.refundedAt IS NULL
        ORDER BY p.paidAt DESC
        LIMIT 50
      `,
      args: []
    });

    return NextResponse.json({
      refunded: refunded.rows,
      refundable: refundable.rows,
      refundedCount: refunded.rows.length,
      refundableCount: refundable.rows.length
    });
  } catch (error) {
    console.error('Error listing refunds:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
