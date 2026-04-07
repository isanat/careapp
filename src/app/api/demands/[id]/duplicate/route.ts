import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

/**
 * POST /api/demands/[id]/duplicate
 * Duplica uma demanda existente
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

    const { id: demandId } = await params;

    // Get the original demand
    const demandResult = await db.execute({
      sql: `
        SELECT
          familyUserId,
          title,
          description,
          serviceTypes,
          address,
          city,
          postalCode,
          country,
          latitude,
          longitude,
          requiredExperienceLevel,
          requiredCertifications,
          careType,
          desiredStartDate,
          desiredEndDate,
          hoursPerWeek,
          scheduleJson,
          budgetEurCents,
          minimumHourlyRateEur
        FROM Demand
        WHERE id = ?
      `,
      args: [demandId],
    });

    if (demandResult.rows.length === 0) {
      return NextResponse.json({ error: 'Demand not found' }, { status: 404 });
    }

    const demand = demandResult.rows[0];

    // Verify ownership
    if (demand.familyUserId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create new demand with copied data
    const newDemandId = crypto.randomUUID();
    const newTitle = `${demand.title} (Cópia)`;

    await db.execute({
      sql: `
        INSERT INTO Demand (
          id,
          familyUserId,
          title,
          description,
          serviceTypes,
          address,
          city,
          postalCode,
          country,
          latitude,
          longitude,
          requiredExperienceLevel,
          requiredCertifications,
          careType,
          desiredStartDate,
          desiredEndDate,
          hoursPerWeek,
          scheduleJson,
          budgetEurCents,
          minimumHourlyRateEur,
          visibilityPackage,
          status,
          createdAt,
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      args: [
        newDemandId,
        demand.familyUserId,
        newTitle,
        demand.description,
        demand.serviceTypes,
        demand.address,
        demand.city,
        demand.postalCode,
        demand.country,
        demand.latitude,
        demand.longitude,
        demand.requiredExperienceLevel,
        demand.requiredCertifications,
        demand.careType,
        demand.desiredStartDate,
        demand.desiredEndDate,
        demand.hoursPerWeek,
        demand.scheduleJson,
        demand.budgetEurCents,
        demand.minimumHourlyRateEur,
        'BASIC',
        'ACTIVE',
      ],
    });

    return NextResponse.json({ id: newDemandId, message: 'Demanda duplicada com sucesso' });
  } catch (error) {
    console.error('[Demands API] Duplicate error:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate demand' },
      { status: 500 }
    );
  }
}
