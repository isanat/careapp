import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// Helper function to verify admin access
async function verifyAdminAccess(sessionUserId: string): Promise<{ authorized: boolean; adminUserId?: string; role?: string; error?: string }> {
  // Check if user has ADMIN role
  const userResult = await db.execute({
    sql: `SELECT role FROM User WHERE id = ?`,
    args: [sessionUserId]
  });

  const userRole = userResult.rows[0]?.role as string;
  if (!['ADMIN', 'SUPER_ADMIN', 'SUPPORT', 'ANALYST'].includes(userRole)) {
    return { authorized: false, error: 'Forbidden - Admin access required' };
  }

  // Check AdminUser table for role
  const adminResult = await db.execute({
    sql: `SELECT id, role FROM AdminUser WHERE userId = ? AND isActive = 1`,
    args: [sessionUserId]
  });

  if (adminResult.rows.length === 0) {
    // User has ADMIN role but no AdminUser profile - allow for legacy admins
    return { authorized: true, adminUserId: sessionUserId, role: userRole };
  }

  return { 
    authorized: true, 
    adminUserId: adminResult.rows[0].id as string,
    role: adminResult.rows[0].role as string 
  };
}

// GET - Token ledger with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminCheck = await verifyAdminAccess(session.user.id);
    if (!adminCheck.authorized) {
      return NextResponse.json({ error: adminCheck.error }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    
    // Filters
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // CREDIT, DEBIT
    const reason = searchParams.get('reason'); // ACTIVATION_BONUS, TOKEN_PURCHASE, CONTRACT_FEE, TIP, REDEMPTION, ADJUSTMENT, REFUND
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');

    // Build query
    let sql = `
      SELECT 
        tl.id,
        tl.userId,
        tl.type,
        tl.reason,
        tl.amountTokens,
        tl.amountEurCents,
        tl.description,
        tl.referenceType,
        tl.referenceId,
        tl.txHash,
        tl.createdAt,
        u.name as userName,
        u.email as userEmail,
        u.role as userRole
      FROM TokenLedger tl
      LEFT JOIN User u ON tl.userId = u.id
      WHERE 1=1
    `;
    
    const args: any[] = [];
    const countArgs: any[] = [];

    if (userId) {
      sql += ` AND tl.userId = ?`;
      args.push(userId);
      countArgs.push(userId);
    }

    if (type) {
      sql += ` AND tl.type = ?`;
      args.push(type);
      countArgs.push(type);
    }

    if (reason) {
      sql += ` AND tl.reason = ?`;
      args.push(reason);
      countArgs.push(reason);
    }

    if (search) {
      sql += ` AND (u.name LIKE ? OR u.email LIKE ? OR tl.description LIKE ?)`;
      const searchTerm = `%${search}%`;
      args.push(searchTerm, searchTerm, searchTerm);
      countArgs.push(searchTerm, searchTerm, searchTerm);
    }

    if (startDate) {
      sql += ` AND tl.createdAt >= ?`;
      args.push(startDate);
      countArgs.push(startDate);
    }

    if (endDate) {
      sql += ` AND tl.createdAt <= ?`;
      args.push(endDate);
      countArgs.push(endDate);
    }

    if (minAmount) {
      sql += ` AND ABS(tl.amountTokens) >= ?`;
      args.push(parseInt(minAmount));
      countArgs.push(parseInt(minAmount));
    }

    if (maxAmount) {
      sql += ` AND ABS(tl.amountTokens) <= ?`;
      args.push(parseInt(maxAmount));
      countArgs.push(parseInt(maxAmount));
    }

    // Get total count
    const countSql = sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await db.execute({ 
      sql: countSql, 
      args: countArgs 
    });
    const total = Number(countResult.rows[0]?.total) || 0;

    // Add pagination
    sql += ` ORDER BY tl.createdAt DESC LIMIT ? OFFSET ?`;
    args.push(limit, offset);

    const result = await db.execute({ sql, args });

    // Get summary stats for filtered results
    const summarySql = `
      SELECT 
        COUNT(*) as totalTransactions,
        COALESCE(SUM(CASE WHEN type = 'CREDIT' THEN amountTokens ELSE 0 END), 0) as totalCredits,
        COALESCE(SUM(CASE WHEN type = 'DEBIT' THEN ABS(amountTokens) ELSE 0 END), 0) as totalDebits,
        COALESCE(SUM(CASE WHEN type = 'CREDIT' THEN amountEurCents ELSE 0 END), 0) as totalEurCredits,
        COALESCE(SUM(CASE WHEN type = 'DEBIT' THEN ABS(amountEurCents) ELSE 0 END), 0) as totalEurDebits
      FROM TokenLedger tl
      LEFT JOIN User u ON tl.userId = u.id
      WHERE 1=1
      ${userId ? ' AND tl.userId = ?' : ''}
      ${type ? ' AND tl.type = ?' : ''}
      ${reason ? ' AND tl.reason = ?' : ''}
      ${search ? ' AND (u.name LIKE ? OR u.email LIKE ? OR tl.description LIKE ?)' : ''}
      ${startDate ? ' AND tl.createdAt >= ?' : ''}
      ${endDate ? ' AND tl.createdAt <= ?' : ''}
      ${minAmount ? ' AND ABS(tl.amountTokens) >= ?' : ''}
      ${maxAmount ? ' AND ABS(tl.amountTokens) <= ?' : ''}
    `;

    const summaryResult = await db.execute({ sql: summarySql, args: countArgs });

    // Get available reasons for filter dropdown
    const reasonsResult = await db.execute({
      sql: `SELECT DISTINCT reason, COUNT(*) as count FROM TokenLedger GROUP BY reason ORDER BY count DESC`,
      args: []
    });

    return NextResponse.json({
      transactions: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: summaryResult.rows[0] || {
        totalTransactions: 0,
        totalCredits: 0,
        totalDebits: 0,
        totalEurCredits: 0,
        totalEurDebits: 0,
      },
      filters: {
        reasons: reasonsResult.rows,
        types: [
          { value: 'CREDIT', label: 'Credit' },
          { value: 'DEBIT', label: 'Debit' },
        ],
      },
    });
  } catch (error) {
    console.error('Error fetching token transactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
