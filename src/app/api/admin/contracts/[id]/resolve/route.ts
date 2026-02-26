import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// POST - Resolve dispute
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
    const { decision, familyPercentage, caregiverPercentage, reason } = body;

    if (!reason) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }

    // Get contract and escrow info
    const contract = await db.execute({
      sql: `
        SELECT c.*, e.id as escrowId, e.totalAmountCents, e.caregiverAmountCents, e.platformFeeCents
        FROM Contract c
        LEFT JOIN EscrowPayment e ON c.id = e.contractId
        WHERE c.id = ? AND c.status = 'DISPUTED'
      `,
      args: [id]
    });

    if (contract.rows.length === 0) {
      return NextResponse.json({ error: 'Disputed contract not found' }, { status: 404 });
    }

    const c = contract.rows[0] as any;

    // Calculate amounts based on decision
    let familyAmount = 0;
    let caregiverAmount = 0;

    if (decision === 'favor_family') {
      familyAmount = c.totalAmountCents || c.totalEurCents || 0;
      caregiverAmount = 0;
    } else if (decision === 'favor_caregiver') {
      familyAmount = 0;
      caregiverAmount = c.caregiverAmountCents || (c.totalEurCents * 0.85);
    } else if (decision === 'split' && familyPercentage !== undefined) {
      const total = c.totalAmountCents || c.totalEurCents || 0;
      familyAmount = Math.round(total * (familyPercentage / 100));
      caregiverAmount = Math.round(total * ((100 - familyPercentage) / 100));
    }

    // Update contract status
    await db.execute({
      sql: `UPDATE Contract SET status = 'COMPLETED', updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [id]
    });

    // Update escrow
    if (c.escrowId) {
      await db.execute({
        sql: `UPDATE EscrowPayment SET status = 'RELEASED', releasedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        args: [c.escrowId]
      });
    }

    // Log action
    await db.execute({
      sql: `INSERT INTO AdminAction (adminUserId, action, entityType, entityId, newValue, reason, ipAddress, createdAt)
            VALUES (?, 'RESOLVE_DISPUTE', 'CONTRACT', ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      args: [
        session.user.id, 
        id, 
        JSON.stringify({ decision, familyAmount, caregiverAmount }), 
        reason, 
        request.headers.get('x-forwarded-for') || 'unknown'
      ]
    });

    return NextResponse.json({
      success: true,
      message: 'Dispute resolved',
      decision,
      familyAmount,
      caregiverAmount
    });
  } catch (error) {
    console.error('Error resolving dispute:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
