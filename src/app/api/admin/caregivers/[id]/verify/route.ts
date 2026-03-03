import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { db } from '@/lib/db-turso';

// POST - Approve KYC verification
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    const { session, adminUserId } = auth;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    // Update verification status
    await db.execute({
      sql: `UPDATE User SET verificationStatus = 'VERIFIED', updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [id]
    });

    await db.execute({
      sql: `UPDATE ProfileCaregiver SET verificationStatus = 'VERIFIED', updatedAt = CURRENT_TIMESTAMP WHERE userId = ?`,
      args: [id]
    });

    // Log action
    await db.execute({
      sql: `INSERT INTO AdminAction (adminUserId, action, entityType, entityId, newValue, reason, ipAddress, createdAt)
            VALUES (?, 'VERIFY_KYC', 'CAREGIVER', ?, '{"verificationStatus": "VERIFIED"}', ?, ?, CURRENT_TIMESTAMP)`,
      args: [adminUserId, id, reason || 'KYC approved', request.headers.get('x-forwarded-for') || 'unknown']
    });

    return NextResponse.json({
      success: true,
      message: 'KYC verification approved'
    });
  } catch (error) {
    console.error('Error approving KYC:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
