import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// GET - List caregivers with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // PENDING, VERIFIED, etc
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let sql = `SELECT 
      u.id, u.email, u.name, u.createdAt,
      pc.title, pc.city, pc.experienceYears, pc.totalContracts,
      pc.averageRating, pc.totalReviews, pc.verificationStatus,
      pc.kycSessionId, pc.kycCompletedAt, pc.kycConfidence,
      pc.featured, pc.availableNow
    FROM User u
    JOIN ProfileCaregiver pc ON u.id = pc.userId
    WHERE u.role = 'CAREGIVER'`;

    const args: any[] = [];

    if (status) {
      sql += ` AND pc.verificationStatus = ?`;
      args.push(status);
    }

    if (search) {
      sql += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
      args.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY u.createdAt DESC LIMIT ? OFFSET ?`;
    args.push(limit, offset);

    const result = await db.execute({ sql, args });

    // Get total count
    let countSql = `SELECT COUNT(*) as total FROM User u
      JOIN ProfileCaregiver pc ON u.id = pc.userId
      WHERE u.role = 'CAREGIVER'`;
    const countArgs: any[] = [];

    if (status) {
      countSql += ` AND pc.verificationStatus = ?`;
      countArgs.push(status);
    }

    const countResult = await db.execute({ sql: countSql, args: countArgs });
    const total = countResult.rows[0]?.total || 0;

    return NextResponse.json({
      caregivers: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(Number(total) / limit) }
    });
  } catch (error) {
    console.error('Error fetching caregivers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
