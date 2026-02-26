import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// GET - Get payment details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Get related ledger entries
    const ledger = await db.execute({
      sql: `SELECT * FROM TokenLedger WHERE referenceId = ? OR metadata LIKE ?`,
      args: [id, `%"paymentId":"${id}"%`]
    });

    return NextResponse.json({
      payment: payment.rows[0],
      ledger: ledger.rows
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
