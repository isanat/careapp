import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// GET - Get contract timeline
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

    // Get contract
    const contract = await db.execute({
      sql: `SELECT * FROM Contract WHERE id = ?`,
      args: [id]
    });

    if (contract.rows.length === 0) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const timeline: any[] = [];
    const c = contract.rows[0] as any;

    // Created
    timeline.push({
      event: 'CREATED',
      timestamp: c.createdAt,
      details: 'Contract created'
    });

    // Acceptance
    const acceptance = await db.execute({
      sql: `SELECT * FROM ContractAcceptance WHERE contractId = ?`,
      args: [id]
    });

    if (acceptance.rows.length > 0) {
      const a = acceptance.rows[0] as any;
      if (a.acceptedByFamilyAt) {
        timeline.push({
          event: 'FAMILY_ACCEPTED',
          timestamp: a.acceptedByFamilyAt,
          details: `Family accepted (IP: ${a.familyIpAddress || 'unknown'})`
        });
      }
      if (a.acceptedByCaregiverAt) {
        timeline.push({
          event: 'CAREGIVER_ACCEPTED',
          timestamp: a.acceptedByCaregiverAt,
          details: `Caregiver accepted (IP: ${a.caregiverIpAddress || 'unknown'})`
        });
      }
    }

    // Payments
    const payments = await db.execute({
      sql: `SELECT * FROM Payment WHERE contractId = ? ORDER BY createdAt`,
      args: [id]
    });

    for (const p of payments.rows) {
      const payment = p as any;
      timeline.push({
        event: 'PAYMENT',
        timestamp: payment.paidAt || payment.createdAt,
        details: `${payment.type}: €${(payment.amountEurCents / 100).toFixed(2)} - ${payment.status}`
      });
    }

    // Status changes
    timeline.push({
      event: 'STATUS',
      timestamp: c.updatedAt,
      details: `Status: ${c.status}`
    });

    // Sort by timestamp
    timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return NextResponse.json({ timeline });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
