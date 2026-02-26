import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// GET - List caregivers pending KYC verification
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
          u.id, u.email, u.name, u.verificationStatus,
          u.createdAt,
          pc.title, pc.city, pc.experienceYears,
          pc.totalContracts, pc.averageRating,
          pc.kycSessionId, pc.kycCompletedAt, pc.kycConfidence
        FROM User u
        JOIN ProfileCaregiver pc ON u.id = pc.userId
        WHERE u.role = 'CAREGIVER' AND u.verificationStatus = 'PENDING'
        ORDER BY u.createdAt ASC
      `,
      args: []
    });

    return NextResponse.json({
      pending: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching pending KYC:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
