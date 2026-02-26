import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// POST - Reject KYC verification
export async function POST(
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
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }

    // Update verification status
    await db.execute({
      sql: `UPDATE User SET verificationStatus = 'REJECTED', updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [id]
    });

    await db.execute({
      sql: `UPDATE ProfileCaregiver SET verificationStatus = 'REJECTED', updatedAt = CURRENT_TIMESTAMP WHERE userId = ?`,
      args: [id]
    });

    // Log action
    await db.execute({
      sql: `INSERT INTO AdminAction (adminUserId, action, entityType, entityId, newValue, reason, ipAddress, createdAt)
            VALUES (?, 'REJECT_KYC', 'CAREGIVER', ?, '{"verificationStatus": "REJECTED"}', ?, ?, CURRENT_TIMESTAMP)`,
      args: [session.user.id, id, reason, request.headers.get('x-forwarded-for') || 'unknown']
    });

    return NextResponse.json({
      success: true,
      message: 'KYC verification rejected'
    });
  } catch (error) {
    console.error('Error rejecting KYC:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
