import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';
import { generateId } from '@/lib/utils/id';

/**
 * POST /api/proposals
 * Criar proposta para uma demanda (cuidador)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only CAREGIVER users can submit proposals
    if (session.user.role !== 'CAREGIVER') {
      return NextResponse.json({ error: 'Only caregivers can submit proposals' }, { status: 403 });
    }

    const body = await request.json();
    const {
      demandId,
      message,
      expectedRate,
      estimatedStartDate,
    } = body;

    // Validation
    if (!demandId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (message.trim().length < 20) {
      return NextResponse.json(
        { error: 'Message must be at least 20 characters' },
        { status: 400 }
      );
    }

    // Verify demand exists
    const demandResult = await db.execute({
      sql: `SELECT id, familyUserId FROM Demand WHERE id = ?`,
      args: [demandId],
    });

    if (demandResult.rows.length === 0) {
      return NextResponse.json({ error: 'Demand not found' }, { status: 404 });
    }

    const demand = demandResult.rows[0];

    // Check if proposal already exists from this caregiver
    const existingResult = await db.execute({
      sql: `SELECT id FROM Proposal WHERE demandId = ? AND caregiverId = ? AND status IN ('PENDING', 'ACCEPTED')`,
      args: [demandId, session.user.id],
    });

    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'You have already submitted a proposal for this demand' },
        { status: 400 }
      );
    }

    const proposalId = generateId('prop');
    const now = new Date().toISOString();

    await db.execute({
      sql: `
        INSERT INTO Proposal (
          id, demandId, caregiverId, message, proposedHourlyRate, estimatedStartDate, status, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        proposalId,
        demandId,
        session.user.id,
        message,
        expectedRate ? parseInt(expectedRate.toString()) * 100 : null, // Convert to centavos
        estimatedStartDate || null,
        'PENDING',
        now,
        now,
      ],
    });

    // Create notification for family
    try {
      await db.execute({
        sql: `
          INSERT INTO Notification (
            id, userId, type, title, message, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?)
        `,
        args: [
          generateId('notif'),
          demand.familyUserId,
          'proposal',
          'Nova Proposta Recebida',
          `Um cuidador enviou uma proposta para sua demanda`,
          now,
        ],
      });
    } catch {
      // Notification creation failed, but proposal was created successfully
      console.error('Failed to create notification');
    }

    return NextResponse.json(
      {
        id: proposalId,
        message: 'Proposal submitted successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Proposals API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to submit proposal' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/proposals
 * List proposals for a demand or user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const demandId = searchParams.get('demandId');

    if (!demandId) {
      return NextResponse.json(
        { error: 'demandId parameter required' },
        { status: 400 }
      );
    }

    // Verify user has access to this demand
    const demandResult = await db.execute({
      sql: `SELECT familyUserId FROM Demand WHERE id = ?`,
      args: [demandId],
    });

    if (demandResult.rows.length === 0) {
      return NextResponse.json({ error: 'Demand not found' }, { status: 404 });
    }

    const demand = demandResult.rows[0];

    // Only family who created the demand can see proposals
    if (demand.familyUserId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const proposalsResult = await db.execute({
      sql: `
        SELECT
          p.id,
          p.demandId,
          p.caregiverId,
          p.message,
          p.proposedHourlyRate,
          p.estimatedStartDate,
          p.status,
          p.createdAt,
          p.acceptedAt,
          u.name as caregiverName,
          u.email as caregiverEmail,
          pc.title as caregiverTitle,
          pc.experienceYears,
          pc.averageRating
        FROM Proposal p
        JOIN User u ON p.caregiverId = u.id
        LEFT JOIN ProfileCaregiver pc ON u.id = pc.userId
        WHERE p.demandId = ?
        ORDER BY p.createdAt DESC
      `,
      args: [demandId],
    });

    const proposals = proposalsResult.rows.map(row => ({
      id: row.id,
      demandId: row.demandId,
      caregiverId: row.caregiverId,
      caregiverName: row.caregiverName,
      caregiverEmail: row.caregiverEmail,
      caregiverTitle: row.caregiverTitle,
      caregiverExperienceYears: row.experienceYears,
      caregiverAverageRating: row.averageRating,
      message: row.message,
      proposedHourlyRate: row.proposedHourlyRate ? Number(row.proposedHourlyRate) / 100 : null,
      estimatedStartDate: row.estimatedStartDate,
      status: row.status,
      createdAt: row.createdAt,
      acceptedAt: row.acceptedAt,
    }));

    return NextResponse.json({
      proposals,
      total: proposals.length,
    });
  } catch (error) {
    console.error('[Proposals API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposals' },
      { status: 500 }
    );
  }
}
