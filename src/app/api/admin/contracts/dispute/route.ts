import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// POST - Resolve dispute
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contractId, resolution, familyAmount, caregiverAmount, reason } = body;

    if (!contractId || !resolution) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const newStatus = resolution === 'cancel' ? 'CANCELLED' : 'COMPLETED';

    await db.execute({
      sql: `UPDATE Contract SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [newStatus, contractId]
    });

    await db.execute({
      sql: `INSERT INTO AdminAction (id, adminUserId, action, entityType, entityId, newValue, reason, createdAt)
        VALUES (?, ?, 'RESOLVE_DISPUTE', 'CONTRACT', ?, ?, ?, ?)`,
      args: [`action-${Date.now()}`, session.user.id, contractId, JSON.stringify({ resolution, familyAmount, caregiverAmount }), reason, now]
    });

    return NextResponse.json({ success: true, contractId, resolution });
  } catch (error) {
    console.error('Error resolving dispute:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
