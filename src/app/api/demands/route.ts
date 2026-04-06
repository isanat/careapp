import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

/**
 * GET /api/demands
 * Lista demandas abertas para cuidadores
 * Ordenação: URGENT > PREMIUM > Recente
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get('city');
    const serviceType = searchParams.get('serviceType');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = `
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
        d.visibilityPackage,
        d.visibilityExpiresAt,
        d.status,
        d.createdAt,
        (SELECT COUNT(*) FROM DemandView WHERE demandId = d.id) as viewCount,
        (SELECT COUNT(*) FROM Proposal WHERE demandId = d.id AND status != 'REJECTED' AND status != 'EXPIRED') as proposalCount
      FROM Demand d
      WHERE d.status = 'ACTIVE'
    `;

    const args: string[] = [];

    if (city) {
      query += ` AND d.city LIKE ?`;
      args.push(`%${city}%`);
    }

    if (serviceType) {
      query += ` AND d.serviceTypes LIKE ?`;
      args.push(`%${serviceType}%`);
    }

    // Ranking: URGENT > PREMIUM > BASIC > NONE + date
    query += `
      ORDER BY
        CASE
          WHEN d.visibilityPackage = 'URGENT' THEN 0
          WHEN d.visibilityPackage = 'PREMIUM' THEN 1
          WHEN d.visibilityPackage = 'BASIC' THEN 2
          ELSE 3
        END,
        d.visibilityExpiresAt DESC NULLS LAST,
        d.createdAt DESC
      LIMIT ? OFFSET ?
    `;
    args.push(limit.toString(), offset.toString());

    const result = await db.execute({
      sql: query,
      args,
    });

    const demands = result.rows.map(row => ({
      id: row.id,
      familyUserId: row.familyUserId,
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
      visibilityPackage: row.visibilityPackage,
      visibilityExpiresAt: row.visibilityExpiresAt,
      status: row.status,
      createdAt: row.createdAt,
      viewCount: row.viewCount,
      proposalCount: row.proposalCount,
    }));

    // Track view for analytics
    for (const demand of demands) {
      try {
        await db.execute({
          sql: `INSERT OR IGNORE INTO DemandView (id, demandId, caregiverId, viewedAt)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
          args: [crypto.randomUUID(), demand.id, session.user.id],
        });
      } catch (error) {
        console.warn(`Failed to track view for demand ${demand.id}:`, error);
      }
    }

    return NextResponse.json({
      demands,
      pagination: {
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('[Demands API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch demands' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/demands
 * Criar nova demanda (família)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      serviceTypes,
      address,
      city,
      postalCode,
      latitude,
      longitude,
      requiredExperienceLevel = 'INTERMEDIATE',
      requiredCertifications = [],
      careType = 'RECURRING',
      desiredStartDate,
      desiredEndDate,
      hoursPerWeek,
      scheduleJson,
    } = body;

    // Validation
    if (!title || !description || !city || !serviceTypes?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (description.length < 100) {
      return NextResponse.json(
        { error: 'Description must be at least 100 characters' },
        { status: 400 }
      );
    }

    const demandId = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.execute({
      sql: `
        INSERT INTO Demand (
          id, familyUserId, title, description, serviceTypes, address, city, postalCode,
          latitude, longitude, requiredExperienceLevel, requiredCertifications, careType,
          desiredStartDate, desiredEndDate, hoursPerWeek, scheduleJson,
          visibilityPackage, status, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        demandId,
        session.user.id,
        title,
        description,
        JSON.stringify(serviceTypes),
        address || null,
        city,
        postalCode || null,
        latitude || null,
        longitude || null,
        requiredExperienceLevel,
        JSON.stringify(requiredCertifications),
        careType,
        desiredStartDate || null,
        desiredEndDate || null,
        hoursPerWeek || null,
        scheduleJson || null,
        'NONE',
        'ACTIVE',
        now,
        now,
      ],
    });

    return NextResponse.json(
      {
        id: demandId,
        message: 'Demand created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Demands API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create demand' },
      { status: 500 }
    );
  }
}
