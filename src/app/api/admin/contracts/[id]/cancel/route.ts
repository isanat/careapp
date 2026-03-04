import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { db } from '@/lib/db-turso';
import { generateId } from '@/lib/utils/id';

// POST - Cancel contract
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    const { adminUserId } = auth;

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }

    // Get current status
    const current = await db.execute({
      sql: `SELECT status, totalEurCents FROM Contract WHERE id = ?`,
      args: [id]
    });

    if (current.rows.length === 0) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const oldStatus = (current.rows[0] as any)?.status;

    // Update contract status
    await db.execute({
      sql: `UPDATE Contract SET status = 'CANCELLED', updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [id]
    });

    // Check for escrow and cancel it
    await db.execute({
      sql: `UPDATE EscrowPayment SET status = 'REFUNDED', refundedAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP WHERE contractId = ? AND status = 'HELD'`,
      args: [id]
    });

    // Log action
    await db.execute({
      sql: `INSERT INTO AdminAction (id, adminUserId, action, entityType, entityId, oldValue, newValue, reason, ipAddress, createdAt)
            VALUES (?, ?, 'CANCEL_CONTRACT', 'CONTRACT', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      args: [generateId("action"), adminUserId, id, `{"status": "${oldStatus}"}`, '{"status": "CANCELLED"}', reason, request.headers.get('x-forwarded-for') || 'unknown']
    });

    return NextResponse.json({
      success: true,
      message: 'Contract cancelled'
    });
  } catch (error) {
    console.error('Error cancelling contract:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
