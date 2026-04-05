import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';
import { generateId } from '@/lib/utils/id';
import { calculatePlatformFee } from '@/lib/services/platform-fees';

// GET: Get recurring payment info for a contract
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get('contractId');

    if (!contractId) {
      // List all recurring payments for the user
      const result = await db.execute({
        sql: `SELECT rp.*, c.title as contract_title
              FROM RecurringPayment rp
              JOIN Contract c ON rp.contractId = c.id
              WHERE rp.familyUserId = ? OR rp.caregiverUserId = ?
              ORDER BY rp.createdAt DESC`,
        args: [session.user.id, session.user.id]
      });

      return NextResponse.json({
        recurringPayments: result.rows.map(r => ({
          id: r.id,
          contractId: r.contractId,
          contractTitle: r.contract_title,
          amountCents: r.amountCents,
          platformFeeCents: r.platformFeeCents,
          caregiverAmountCents: r.caregiverAmountCents,
          billingDay: r.billingDay,
          status: r.status,
          lastPaymentAt: r.lastPaymentAt,
          nextPaymentAt: r.nextPaymentAt,
          createdAt: r.createdAt,
        }))
      });
    }

    // Get specific contract recurring payment
    const result = await db.execute({
      sql: `SELECT * FROM RecurringPayment WHERE contractId = ? AND (familyUserId = ? OR caregiverUserId = ?)`,
      args: [contractId, session.user.id, session.user.id]
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ recurringPayment: null });
    }

    const rp = result.rows[0];
    return NextResponse.json({
      recurringPayment: {
        id: rp.id,
        contractId: rp.contractId,
        amountCents: rp.amountCents,
        platformFeeCents: rp.platformFeeCents,
        caregiverAmountCents: rp.caregiverAmountCents,
        billingDay: rp.billingDay,
        status: rp.status,
        lastPaymentAt: rp.lastPaymentAt,
        nextPaymentAt: rp.nextPaymentAt,
      }
    });
  } catch (error) {
    console.error('Error fetching recurring payments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Set up recurring payment for a contract
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contractId, billingDay } = body;

    if (!contractId) {
      return NextResponse.json({ error: 'contractId is required' }, { status: 400 });
    }

    // Get contract
    const contractResult = await db.execute({
      sql: `SELECT * FROM Contract WHERE id = ? AND familyUserId = ?`,
      args: [contractId, session.user.id]
    });

    if (contractResult.rows.length === 0) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const contract = contractResult.rows[0];

    if (contract.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Contract must be active' }, { status: 400 });
    }

    // Check if already exists
    const existing = await db.execute({
      sql: `SELECT id FROM RecurringPayment WHERE contractId = ? AND status = 'ACTIVE'`,
      args: [contractId]
    });

    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Recurring payment already exists for this contract' }, { status: 400 });
    }

    // Calculate amounts based on contract using dynamic platform fee
    const totalEurCents = Number(contract.totalEurCents) || 0;
    const platformFeeCents = await calculatePlatformFee(totalEurCents);
    const caregiverAmountCents = totalEurCents - platformFeeCents;

    const rpId = generateId("rp");
    const now = new Date();
    const day = billingDay || 1;

    // Calculate next payment date
    const nextPayment = new Date(now.getFullYear(), now.getMonth() + 1, day);
    const nextPaymentAt = nextPayment.toISOString();

    await db.execute({
      sql: `INSERT INTO RecurringPayment (
        id, contractId, familyUserId, caregiverUserId,
        amountCents, platformFeeCents, caregiverAmountCents,
        billingDay, periodStart, status,
        nextPaymentAt, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?)`,
      args: [
        rpId, contractId,
        contract.familyUserId, contract.caregiverUserId,
        totalEurCents, platformFeeCents, caregiverAmountCents,
        day, now.toISOString(), nextPaymentAt,
        now.toISOString(), now.toISOString()
      ]
    });

    return NextResponse.json({
      id: rpId,
      nextPaymentAt,
      amountCents: totalEurCents,
      message: 'Pagamento recorrente configurado com sucesso'
    });
  } catch (error) {
    console.error('Error creating recurring payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
