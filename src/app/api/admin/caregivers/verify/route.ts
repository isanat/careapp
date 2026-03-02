import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { db } from '@/lib/db-turso';
import { generateId } from '@/lib/utils/id';

// POST - Verify/Reject caregiver KYC
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    const { session, adminUserId } = auth;

    const body = await request.json();
    const { caregiverId, action, reason } = body;

    if (!caregiverId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newStatus = action === 'verify' ? 'VERIFIED' : 'REJECTED';
    const now = new Date().toISOString();

    await db.execute({
      sql: `UPDATE ProfileCaregiver 
        SET verificationStatus = ?, kycCompletedAt = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE userId = ?`,
      args: [newStatus, now, caregiverId]
    });

    await db.execute({
      sql: `UPDATE User SET verificationStatus = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [newStatus, caregiverId]
    });

    await db.execute({
      sql: `INSERT INTO AdminAction (id, adminUserId, action, entityType, entityId, reason, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [generateId("action"), adminUserId, action === 'verify' ? 'VERIFY_KYC' : 'REJECT_KYC', 'CAREGIVER', caregiverId, reason || null, now]
    });

    return NextResponse.json({ success: true, action, caregiverId, newStatus });
  } catch (error) {
    console.error('Error updating caregiver:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
