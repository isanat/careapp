import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';
import { notifyFamilyNewProposal } from '@/lib/services/email';

/**
 * POST /api/demands/[id]/proposals
 * Cuidador envia proposta para uma demanda
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only CAREGIVER users can send proposals
    if (session.user.role !== 'CAREGIVER') {
      return NextResponse.json({ error: 'Only caregivers can send proposals' }, { status: 403 });
    }

    const { id: demandId } = await params;
    const body = await request.json();
    const {
      message,
      proposedHourlyRate,
      estimatedStartDate,
    } = body;

    // Validation
    if (!message || message.length < 20) {
      return NextResponse.json(
        { error: 'Message must be at least 20 characters' },
        { status: 400 }
      );
    }

    // Verify demand exists and is active
    const demandResult = await db.execute({
      sql: `SELECT id, familyUserId, title FROM Demand WHERE id = ? AND status = 'ACTIVE'`,
      args: [demandId],
    });

    if (demandResult.rows.length === 0) {
      return NextResponse.json({ error: 'Demand not found or inactive' }, { status: 404 });
    }

    const demand = demandResult.rows[0];

    // Check if already proposed
    const existingResult = await db.execute({
      sql: `SELECT id FROM Proposal WHERE demandId = ? AND caregiverId = ? AND status != 'REJECTED'`,
      args: [demandId, session.user.id],
    });

    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'You have already proposed for this demand' },
        { status: 400 }
      );
    }

    const proposalId = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.execute({
      sql: `
        INSERT INTO Proposal (
          id, demandId, caregiverId, message, proposedHourlyRate,
          estimatedStartDate, status, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        proposalId,
        demandId,
        session.user.id,
        message,
        proposedHourlyRate || null,
        estimatedStartDate || null,
        'PENDING',
        now,
        now,
      ],
    });

    // Create notification for family
    try {
      const notificationId = crypto.randomUUID();
      const caregiverName = session.user.name || 'Cuidador';

      await db.execute({
        sql: `
          INSERT INTO Notification (
            id, userId, type, title, message,
            referenceType, referenceId, isRead, emailSent, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          notificationId,
          String(demand.familyUserId),
          'PROPOSAL',
          'Nova Proposta Recebida',
          `${caregiverName} enviou uma proposta para "${String(demand.title)}"`,
          'PROPOSAL',
          proposalId,
          false,
          false,
          now,
        ],
      });
    } catch (notifError) {
      console.warn('[Proposals] Failed to create notification:', notifError);
      // Don't fail the request if notification creation fails
    }

    // Send notification email to family
    try {
      // Get family info
      const familyResult = await db.execute({
        sql: `
          SELECT u.email, u.name
          FROM User u
          JOIN Demand d ON u.id = d.familyUserId
          WHERE d.id = ?
        `,
        args: [demandId],
      });

      if (familyResult.rows.length > 0) {
        const family = familyResult.rows[0];
        const email = String(family.email || '');
        const name = String(family.name || 'Família');

        if (email) {
          await notifyFamilyNewProposal(
            email,
            name,
            { id: demandId, title: String(demand.title || '') },
            { caregiverName: session.user.name || 'Cuidador', message }
          );

          // Mark notification as email sent
          try {
            await db.execute({
              sql: `UPDATE Notification SET emailSent = true WHERE referenceId = ?`,
              args: [proposalId],
            });
          } catch (e) {
            console.warn('[Proposals] Failed to mark notification email sent:', e);
          }
        }
      }
    } catch (emailError) {
      console.warn('[Proposals] Failed to send notification email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json(
      {
        id: proposalId,
        message: 'Proposta enviada com sucesso! A família foi notificada.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Proposals API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to send proposal' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/demands/[id]/proposals
 * Lista propostas de uma demanda (apenas família criadora)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: demandId } = await params;

    // Verify ownership
    const demandResult = await db.execute({
      sql: `SELECT familyUserId FROM Demand WHERE id = ?`,
      args: [demandId],
    });

    if (demandResult.rows.length === 0) {
      return NextResponse.json({ error: 'Demand not found' }, { status: 404 });
    }

    if (demandResult.rows[0].familyUserId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await db.execute({
      sql: `
        SELECT
          p.id,
          p.demandId,
          p.caregiverId,
          p.message,
          p.proposedHourlyRate,
          p.estimatedStartDate,
          p.status,
          p.acceptedAt,
          p.rejectedAt,
          p.createdAt,
          u.name as caregiverName,
          u.email as caregiverEmail,
          pc.experienceYears,
          pc.certifications
        FROM Proposal p
        JOIN User u ON p.caregiverId = u.id
        LEFT JOIN ProfileCaregiver pc ON u.id = pc.userId
        WHERE p.demandId = ?
        ORDER BY p.createdAt DESC
      `,
      args: [demandId],
    });

    const proposals = result.rows.map(row => ({
      id: row.id,
      demandId: row.demandId,
      caregiverId: row.caregiverId,
      caregiverName: row.caregiverName,
      caregiverEmail: row.caregiverEmail,
      experienceYears: row.experienceYears,
      certifications: row.certifications ? JSON.parse(String(row.certifications)) : [],
      standardHourlyRate: null,
      message: row.message,
      proposedHourlyRate: row.proposedHourlyRate,
      estimatedStartDate: row.estimatedStartDate,
      status: row.status,
      acceptedAt: row.acceptedAt,
      rejectedAt: row.rejectedAt,
      createdAt: row.createdAt,
    }));

    return NextResponse.json({ proposals });
  } catch (error) {
    console.error('[Proposals API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposals' },
      { status: 500 }
    );
  }
}
