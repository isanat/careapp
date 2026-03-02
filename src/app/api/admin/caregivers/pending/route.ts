import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { db } from '@/lib/db-turso';

// GET - List caregivers pending KYC verification
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    const { session, adminUserId } = auth;

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
