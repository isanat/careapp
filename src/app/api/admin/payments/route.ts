import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// GET - List payments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let sql = `SELECT 
      p.id, p.type, p.status, p.provider,
      p.amountEurCents, p.tokensAmount, p.platformFee,
      p.createdAt, p.paidAt, p.refundedAt,
      u.name as userName, u.email as userEmail,
      c.title as contractTitle
    FROM Payment p
    LEFT JOIN User u ON p.userId = u.id
    LEFT JOIN Contract c ON p.contractId = c.id
    WHERE 1=1`;

    const args: any[] = [];

    if (type) {
      sql += ` AND p.type = ?`;
      args.push(type);
    }

    if (status) {
      sql += ` AND p.status = ?`;
      args.push(status);
    }

    sql += ` ORDER BY p.createdAt DESC LIMIT ? OFFSET ?`;
    args.push(limit, offset);

    const result = await db.execute({ sql, args });

    // Get totals
    const totalsResult = await db.execute({
      sql: `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'COMPLETED' THEN amountEurCents ELSE 0 END) as totalRevenue
      FROM Payment`,
      args: []
    });

    return NextResponse.json({
      payments: result.rows,
      totals: totalsResult.rows[0],
      pagination: { page, limit }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
