import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// GET - List escrow payments
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

    const result = await db.execute({
      sql: `
        SELECT 
          e.*,
          c.title as contractTitle, c.status as contractStatus,
          uf.name as familyName, uc.name as caregiverName
        FROM EscrowPayment e
        JOIN Contract c ON e.contractId = c.id
        JOIN User uf ON c.familyUserId = uf.id
        JOIN User uc ON c.caregiverUserId = uc.id
        ORDER BY e.capturedAt DESC
      `,
      args: []
    });

    // Group by status
    const held = result.rows.filter((r: any) => r.status === 'HELD');
    const released = result.rows.filter((r: any) => r.status === 'RELEASED');

    return NextResponse.json({
      escrow: result.rows,
      held,
      released,
      stats: {
        total: result.rows.length,
        heldCount: held.length,
        heldAmount: held.reduce((sum: number, r: any) => sum + (r.totalAmountCents || 0), 0)
      }
    });
  } catch (error) {
    console.error('Error listing escrow:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
