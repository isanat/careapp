import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { db } from '@/lib/db-turso';

// POST - Reject KYC verification
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    const { session, adminUserId } = auth;

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
      args: [adminUserId, id, reason, request.headers.get('x-forwarded-for') || 'unknown']
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
