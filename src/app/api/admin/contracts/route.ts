import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// GET - List contracts with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let sql = `SELECT 
      c.id, c.title, c.status, c.totalEurCents, c.totalTokens,
      c.startDate, c.endDate, c.createdAt,
      uFamily.name as familyName, uFamily.email as familyEmail,
      uCaregiver.name as caregiverName, uCaregiver.email as caregiverEmail
    FROM Contract c
    LEFT JOIN User uFamily ON c.familyUserId = uFamily.id
    LEFT JOIN User uCaregiver ON c.caregiverUserId = uCaregiver.id
    WHERE 1=1`;

    const args: any[] = [];

    if (status) {
      sql += ` AND c.status = ?`;
      args.push(status);
    }

    sql += ` ORDER BY c.createdAt DESC LIMIT ? OFFSET ?`;
    args.push(limit, offset);

    const result = await db.execute({ sql, args });

    // Get counts by status
    const countsResult = await db.execute({
      sql: `SELECT status, COUNT(*) as count FROM Contract GROUP BY status`,
      args: []
    });

    const statusCounts: Record<string, number> = {};
    countsResult.rows.forEach((row: any) => {
      statusCounts[row.status] = row.count;
    });

    return NextResponse.json({
      contracts: result.rows,
      statusCounts,
      pagination: { page, limit }
    });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
