import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// GET - Get contract details
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

    const contract = await db.execute({
      sql: `
        SELECT c.*,
          uf.name as familyName, uf.email as familyEmail, uf.phone as familyPhone,
          uc.name as caregiverName, uc.email as caregiverEmail, uc.phone as caregiverPhone
        FROM Contract c
        JOIN User uf ON c.familyUserId = uf.id
        JOIN User uc ON c.caregiverUserId = uc.id
        WHERE c.id = ?
      `,
      args: [id]
    });

    if (contract.rows.length === 0) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Get acceptance logs
    const acceptance = await db.execute({
      sql: `SELECT * FROM ContractAcceptance WHERE contractId = ?`,
      args: [id]
    });

    // Get payments
    const payments = await db.execute({
      sql: `SELECT * FROM Payment WHERE contractId = ? ORDER BY createdAt`,
      args: [id]
    });

    // Get escrow
    const escrow = await db.execute({
      sql: `SELECT * FROM EscrowPayment WHERE contractId = ?`,
      args: [id]
    });

    // Get reviews
    const reviews = await db.execute({
      sql: `SELECT r.*, u.name as fromUserName FROM Review r JOIN User u ON r.fromUserId = u.id WHERE r.contractId = ?`,
      args: [id]
    });

    return NextResponse.json({
      contract: contract.rows[0],
      acceptance: acceptance.rows[0] || null,
      payments: payments.rows,
      escrow: escrow.rows[0] || null,
      reviews: reviews.rows
    });
  } catch (error) {
    console.error('Error fetching contract:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
