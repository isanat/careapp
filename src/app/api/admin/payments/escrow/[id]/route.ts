import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// GET - Get escrow details
export async function GET(
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

    const escrow = await db.execute({
      sql: `
        SELECT e.*, 
          c.title as contractTitle, c.status as contractStatus,
          c.familyUserId, c.caregiverUserId,
          uf.name as familyName, uf.email as familyEmail,
          uc.name as caregiverName, uc.email as caregiverEmail
        FROM EscrowPayment e
        JOIN Contract c ON e.contractId = c.id
        JOIN User uf ON c.familyUserId = uf.id
        JOIN User uc ON c.caregiverUserId = uc.id
        WHERE e.id = ?
      `,
      args: [id]
    });

    if (escrow.rows.length === 0) {
      return NextResponse.json({ error: 'Escrow not found' }, { status: 404 });
    }

    return NextResponse.json({ escrow: escrow.rows[0] });
  } catch (error) {
    console.error('Error fetching escrow:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Manually release escrow
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

    // Get escrow
    const escrow = await db.execute({
      sql: `SELECT * FROM EscrowPayment WHERE id = ? AND status = 'HELD'`,
      args: [id]
    });

    if (escrow.rows.length === 0) {
      return NextResponse.json({ error: 'Escrow not found or already released' }, { status: 404 });
    }

    const e = escrow.rows[0] as any;

    // Update escrow status
    await db.execute({
      sql: `UPDATE EscrowPayment SET status = 'RELEASED', releasedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [id]
    });

    // Log action
    await db.execute({
      sql: `INSERT INTO AdminAction (adminUserId, action, entityType, entityId, oldValue, newValue, reason, ipAddress, createdAt)
            VALUES (?, 'RELEASE_ESCROW', 'ESCROW', ?, '{"status": "HELD"}', '{"status": "RELEASED"}', ?, ?, CURRENT_TIMESTAMP)`,
      args: [session.user.id, id, reason, request.headers.get('x-forwarded-for') || 'unknown']
    });

    return NextResponse.json({
      success: true,
      message: 'Escrow released',
      escrowId: id,
      amountCents: e.totalAmountCents
    });
  } catch (error) {
    console.error('Error releasing escrow:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
