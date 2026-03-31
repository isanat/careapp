import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { db } from '@/lib/db-turso';

// GET - Get payment details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;

    const payment = await db.execute({
      sql: `
        SELECT p.*, 
          u.name as userName, u.email as userEmail, u.phone as userPhone,
          c.title as contractTitle, c.status as contractStatus
        FROM Payment p
        JOIN User u ON p.userId = u.id
        LEFT JOIN Contract c ON p.contractId = c.id
        WHERE p.id = ?
      `,
      args: [id]
    });

    if (payment.rows.length === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({
      payment: payment.rows[0],
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
