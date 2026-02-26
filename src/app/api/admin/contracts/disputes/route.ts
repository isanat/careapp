import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// GET - List disputed contracts
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
          c.id, c.title, c.status, c.totalEurCents,
          c.startDate, c.endDate, c.createdAt, c.updatedAt,
          uf.name as familyName, uf.email as familyEmail,
          uc.name as caregiverName, uc.email as caregiverEmail,
          e.status as escrowStatus, e.totalAmountCents as escrowAmount
        FROM Contract c
        JOIN User uf ON c.familyUserId = uf.id
        JOIN User uc ON c.caregiverUserId = uc.id
        LEFT JOIN EscrowPayment e ON c.id = e.contractId
        WHERE c.status = 'DISPUTED'
        ORDER BY c.updatedAt ASC
      `,
      args: []
    });

    return NextResponse.json({
      disputes: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error listing disputes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
