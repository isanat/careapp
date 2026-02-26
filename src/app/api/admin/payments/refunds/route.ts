import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// GET - List refunds
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminCheck = await db.execute({
      sql: `SELECT role FROM User WHERE id = ?`,
      args: [session.user.id]
    });
    
    if (adminCheck.rows[0]?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
