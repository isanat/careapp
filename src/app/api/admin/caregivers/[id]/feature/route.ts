import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { db } from '@/lib/db-turso';

// POST - Set featured status
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
    const { featured, reason } = body;

    // Get current status
    const current = await db.execute({
      sql: `SELECT featured FROM ProfileCaregiver WHERE userId = ?`,
      args: [id]
    });

    const oldValue = current.rows[0]?.featured ? 'true' : 'false';
    const newValue = featured ? 'true' : 'false';

    // Update featured status
    await db.execute({
      sql: `UPDATE ProfileCaregiver SET featured = ?, updatedAt = CURRENT_TIMESTAMP WHERE userId = ?`,
      args: [featured ? 1 : 0, id]
    });

    // Log action
    await db.execute({
      sql: `INSERT INTO AdminAction (adminUserId, action, entityType, entityId, oldValue, newValue, reason, ipAddress, createdAt)
            VALUES (?, 'SET_FEATURED', 'CAREGIVER', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      args: [adminUserId, id, `{"featured": ${oldValue}}`, `{"featured": ${newValue}}`, reason || '', request.headers.get('x-forwarded-for') || 'unknown']
    });

    return NextResponse.json({
      success: true,
      featured,
      message: featured ? 'Caregiver featured' : 'Caregiver unfeatured'
    });
  } catch (error) {
    console.error('Error setting featured status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
