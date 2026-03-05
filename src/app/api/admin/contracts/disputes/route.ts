import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { db } from '@/lib/db-turso';

// GET - List disputed contracts
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const result = await db.execute({
      sql: `
        SELECT 
          c.id, c.title, c.status, c.totalEurCents,
          c.startDate, c.endDate, c.createdAt, c.updatedAt,
          uf.name as familyName, uf.email as familyEmail,
          uc.name as caregiverName, uc.email as caregiverEmail,
          e.status as escrowStatus, e.amountEurCents as escrowAmount
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
