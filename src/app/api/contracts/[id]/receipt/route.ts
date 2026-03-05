import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';
import { generateId } from '@/lib/utils/id';
import { PLATFORM_FEE_PERCENT } from '@/lib/constants';

// GET: Get receipts for a contract
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: contractId } = await params;

    // Verify user is part of the contract
    const contract = await db.execute({
      sql: `SELECT familyUserId, caregiverUserId FROM Contract WHERE id = ?`,
      args: [contractId]
    });

    if (contract.rows.length === 0) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const c = contract.rows[0];
    if (c.familyUserId !== session.user.id && c.caregiverUserId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const receipts = await db.execute({
      sql: `SELECT * FROM Receipt WHERE contractId = ? ORDER BY periodEnd DESC`,
      args: [contractId]
    });

    return NextResponse.json({
      receipts: receipts.rows.map(r => ({
        id: r.id,
        receiptNumber: r.receiptNumber,
        periodStart: r.periodStart,
        periodEnd: r.periodEnd,
        hoursWorked: r.hoursWorked,
        hourlyRateEurCents: r.hourlyRateEurCents,
        totalAmountCents: r.totalAmountCents,
        platformFeeCents: r.platformFeeCents,
        caregiverAmountCents: r.caregiverAmountCents,
        familyNif: r.familyNif,
        caregiverNif: r.caregiverNif,
        status: r.status,
        createdAt: r.createdAt,
      }))
    });
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Generate a new receipt for a billing period
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: contractId } = await params;
    const body = await request.json();
    const { periodStart, periodEnd, hoursWorked } = body;

    if (!periodStart || !periodEnd || !hoursWorked) {
      return NextResponse.json({ error: 'periodStart, periodEnd, and hoursWorked are required' }, { status: 400 });
    }

    // Get contract details
    const contractResult = await db.execute({
      sql: `SELECT c.*, uf.nif as family_nif, uc.nif as caregiver_nif
            FROM Contract c
            JOIN User uf ON c.familyUserId = uf.id
            JOIN User uc ON c.caregiverUserId = uc.id
            WHERE c.id = ?`,
      args: [contractId]
    });

    if (contractResult.rows.length === 0) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const contract = contractResult.rows[0];

    // Only family or system can generate receipts
    if (contract.familyUserId !== session.user.id) {
      return NextResponse.json({ error: 'Only the family can generate receipts' }, { status: 403 });
    }

    if (contract.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Contract must be active to generate receipts' }, { status: 400 });
    }

    const hourlyRateEurCents = Number(contract.hourlyRateEur) || 0;
    const totalAmountCents = hourlyRateEurCents * hoursWorked;
    const platformFeeCents = Math.round(totalAmountCents * PLATFORM_FEE_PERCENT / 100);
    const caregiverAmountCents = totalAmountCents - platformFeeCents;

    // Generate receipt number: RC-YYYY-NNNNNN
    const year = new Date().getFullYear();
    const countResult = await db.execute({
      sql: `SELECT COUNT(*) as cnt FROM Receipt WHERE receiptNumber LIKE ?`,
      args: [`RC-${year}-%`]
    });
    const count = Number(countResult.rows[0].cnt) + 1;
    const receiptNumber = `RC-${year}-${String(count).padStart(6, '0')}`;

    const receiptId = generateId("rct");
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO Receipt (
        id, contractId, familyUserId, caregiverUserId,
        receiptNumber, periodStart, periodEnd, hoursWorked,
        hourlyRateEurCents, totalAmountCents, platformFeeCents, caregiverAmountCents,
        familyNif, caregiverNif, status, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'GENERATED', ?)`,
      args: [
        receiptId, contractId,
        contract.familyUserId, contract.caregiverUserId,
        receiptNumber, periodStart, periodEnd, hoursWorked,
        hourlyRateEurCents, totalAmountCents, platformFeeCents, caregiverAmountCents,
        contract.family_nif || null, contract.caregiver_nif || null, now
      ]
    });

    return NextResponse.json({
      receiptId,
      receiptNumber,
      totalAmountCents,
      platformFeeCents,
      caregiverAmountCents,
      message: 'Recibo gerado com sucesso'
    });
  } catch (error) {
    console.error('Error generating receipt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
