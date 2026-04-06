import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import db from '@/lib/db-turso';
import { getDemandMetrics } from '@/lib/demands/metrics';

/**
 * GET /api/demands/[id]
 * Detalhes completos de uma demanda
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const demandId = params.id;

    const result = await db.execute({
      sql: `
        SELECT
          d.id,
          d.familyUserId,
          d.title,
          d.description,
          d.serviceTypes,
          d.address,
          d.city,
          d.postalCode,
          d.country,
          d.latitude,
          d.longitude,
          d.requiredExperienceLevel,
          d.requiredCertifications,
          d.careType,
          d.desiredStartDate,
          d.desiredEndDate,
          d.hoursPerWeek,
          d.scheduleJson,
          d.visibilityPackage,
          d.visibilityExpiresAt,
          d.status,
          d.createdAt,
          d.closedAt,
          u.name as familyName,
          u.email as familyEmail,
          pf.city as familyCity
        FROM Demand d
        JOIN User u ON d.familyUserId = u.id
        LEFT JOIN ProfileFamily pf ON u.id = pf.userId
        WHERE d.id = ?
      `,
      args: [demandId],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Demand not found' }, { status: 404 });
    }

    const row = result.rows[0];
    const metrics = await getDemandMetrics(demandId);

    // Track view
    try {
      await db.execute({
        sql: `INSERT OR IGNORE INTO DemandView (id, demandId, caregiverId, viewedAt)
              VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        args: [crypto.randomUUID(), demandId, session.user.id],
      });
    } catch {
      // View tracking failed, continue
    }

    const demand = {
      id: row.id,
      familyUserId: row.familyUserId,
      familyName: row.familyName,
      familyCity: row.familyCity,
      title: row.title,
      description: row.description,
      serviceTypes: JSON.parse(row.serviceTypes || '[]'),
      address: row.address,
      city: row.city,
      postalCode: row.postalCode,
      country: row.country,
      latitude: row.latitude,
      longitude: row.longitude,
      requiredExperienceLevel: row.requiredExperienceLevel,
      requiredCertifications: row.requiredCertifications ? JSON.parse(row.requiredCertifications) : [],
      careType: row.careType,
      desiredStartDate: row.desiredStartDate,
      desiredEndDate: row.desiredEndDate,
      hoursPerWeek: row.hoursPerWeek,
      scheduleJson: row.scheduleJson ? JSON.parse(row.scheduleJson) : null,
      visibilityPackage: row.visibilityPackage,
      visibilityExpiresAt: row.visibilityExpiresAt,
      status: row.status,
      createdAt: row.createdAt,
      closedAt: row.closedAt,
      metrics,
    };

    return NextResponse.json(demand);
  } catch (error) {
    console.error('[Demands API] GET detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch demand' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/demands/[id]
 * Atualizar demanda (apenas família criadora)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const demandId = params.id;
    const body = await request.json();

    // Verify ownership
    const demandResult = await db.execute({
      sql: `SELECT familyUserId FROM Demand WHERE id = ?`,
      args: [demandId],
    });

    if (demandResult.rows.length === 0) {
      return NextResponse.json({ error: 'Demand not found' }, { status: 404 });
    }

    const demand = demandResult.rows[0];
    if (demand.familyUserId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only allow updating certain fields
    const allowedFields = ['title', 'description', 'status', 'hoursPerWeek', 'desiredStartDate', 'desiredEndDate'];
    const updates: string[] = [];
    const args: unknown[] = [];

    for (const field of allowedFields) {
      if (field in body) {
        updates.push(`${field} = ?`);
        args.push(body[field]);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updates.push('updatedAt = CURRENT_TIMESTAMP');
    args.push(demandId);

    await db.execute({
      sql: `UPDATE Demand SET ${updates.join(', ')} WHERE id = ?`,
      args,
    });

    return NextResponse.json({ message: 'Demand updated successfully' });
  } catch (error) {
    console.error('[Demands API] PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update demand' },
      { status: 500 }
    );
  }
}
