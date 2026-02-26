import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// Get contract acceptance details
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

    // Verify user is part of this contract
    const contractResult = await db.execute({
      sql: `SELECT familyUserId, caregiverUserId FROM Contract WHERE id = ?`,
      args: [contractId]
    });

    if (contractResult.rows.length === 0) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const contract = contractResult.rows[0];
    const isFamily = contract.familyUserId === session.user.id;
    const isCaregiver = contract.caregiverUserId === session.user.id;

    if (!isFamily && !isCaregiver) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get acceptance details
    const acceptanceResult = await db.execute({
      sql: `SELECT * FROM ContractAcceptance WHERE contractId = ?`,
      args: [contractId]
    });

    if (acceptanceResult.rows.length === 0) {
      return NextResponse.json({
        accepted: false,
        familyAccepted: false,
        caregiverAccepted: false
      });
    }

    const acceptance = acceptanceResult.rows[0];

    return NextResponse.json({
      accepted: !!(acceptance.acceptedByFamilyAt && acceptance.acceptedByCaregiverAt),
      familyAccepted: !!acceptance.acceptedByFamilyAt,
      familyIpAddress: acceptance.familyIpAddress,
      familyAcceptedAt: acceptance.acceptedByFamilyAt,
      caregiverAccepted: !!acceptance.acceptedByCaregiverAt,
      caregiverIpAddress: acceptance.caregiverIpAddress,
      caregiverAcceptedAt: acceptance.acceptedByCaregiverAt,
    });
  } catch (error) {
    console.error('Error fetching contract acceptance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Accept contract (register legal acceptance)
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

    // Verify user is part of this contract
    const contractResult = await db.execute({
      sql: `SELECT familyUserId, caregiverUserId, status FROM Contract WHERE id = ?`,
      args: [contractId]
    });

    if (contractResult.rows.length === 0) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const contract = contractResult.rows[0];
    const isFamily = contract.familyUserId === session.user.id;
    const isCaregiver = contract.caregiverUserId === session.user.id;

    if (!isFamily && !isCaregiver) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get IP address and user agent for legal proof
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Check if acceptance record exists
    const existingResult = await db.execute({
      sql: `SELECT * FROM ContractAcceptance WHERE contractId = ?`,
      args: [contractId]
    });

    const now = new Date().toISOString();

    if (existingResult.rows.length === 0) {
      // Create new acceptance record
      const acceptanceId = `ca-${Date.now()}`;
      
      if (isFamily) {
        await db.execute({
          sql: `INSERT INTO ContractAcceptance 
                (id, contractId, acceptedByFamilyAt, familyIpAddress, familyUserAgent, createdAt)
                VALUES (?, ?, ?, ?, ?, ?)`,
          args: [acceptanceId, contractId, now, ipAddress, userAgent, now]
        });
      } else {
        await db.execute({
          sql: `INSERT INTO ContractAcceptance 
                (id, contractId, acceptedByCaregiverAt, caregiverIpAddress, caregiverUserAgent, createdAt)
                VALUES (?, ?, ?, ?, ?, ?)`,
          args: [acceptanceId, contractId, now, ipAddress, userAgent, now]
        });
      }
    } else {
      // Update existing acceptance record
      if (isFamily) {
        await db.execute({
          sql: `UPDATE ContractAcceptance 
                SET acceptedByFamilyAt = ?, familyIpAddress = ?, familyUserAgent = ?
                WHERE contractId = ?`,
          args: [now, ipAddress, userAgent, contractId]
        });
      } else {
        await db.execute({
          sql: `UPDATE ContractAcceptance 
                SET acceptedByCaregiverAt = ?, caregiverIpAddress = ?, caregiverUserAgent = ?
                WHERE contractId = ?`,
          args: [now, ipAddress, userAgent, contractId]
        });
      }
    }

    // Update contract status and acceptance timestamps
    if (isFamily) {
      await db.execute({
        sql: `UPDATE Contract SET acceptedByFamilyAt = ?, status = 'PENDING_ACCEPTANCE', updatedAt = ? WHERE id = ?`,
        args: [now, now, contractId]
      });
    } else {
      await db.execute({
        sql: `UPDATE Contract SET acceptedByCaregiverAt = ?, updatedAt = ? WHERE id = ?`,
        args: [now, now, contractId]
      });
    }

    // Check if both parties accepted
    const updatedAcceptance = await db.execute({
      sql: `SELECT * FROM ContractAcceptance WHERE contractId = ?`,
      args: [contractId]
    });

    const acceptance = updatedAcceptance.rows[0];
    const bothAccepted = acceptance.acceptedByFamilyAt && acceptance.acceptedByCaregiverAt;

    if (bothAccepted) {
      // Update contract status to PENDING_PAYMENT
      await db.execute({
        sql: `UPDATE Contract SET status = 'PENDING_PAYMENT', updatedAt = ? WHERE id = ?`,
        args: [now, contractId]
      });
    }

    return NextResponse.json({
      success: true,
      acceptedAt: now,
      ipAddress,
      bothAccepted,
      newStatus: bothAccepted ? 'PENDING_PAYMENT' : 'PENDING_ACCEPTANCE'
    });
  } catch (error) {
    console.error('Error accepting contract:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
