import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

/**
 * GET /api/family/demands
 * Lista demandas da família COM métricas dinâmicas
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'ACTIVE';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await db.execute({
      sql: `
        SELECT
          d.id,
          d.title,
          d.description,
          d.serviceTypes,
          d.city,
          d.status,
          d.visibilityPackage,
          d.visibilityExpiresAt,
          d.createdAt,
          d.closedAt,
          (SELECT COUNT(*) FROM DemandView WHERE demandId = d.id) as viewCount,
          (SELECT COUNT(*) FROM Proposal WHERE demandId = d.id AND status != 'REJECTED' AND status != 'EXPIRED') as proposalCount,
          (SELECT SUM(amountEurCents) FROM VisibilityPurchase WHERE demandId = d.id AND status = 'COMPLETED') as visibilitySpent
        FROM Demand d
        WHERE d.familyUserId = ? AND (? = '' OR d.status = ?) AND d.deletedAt IS NULL
        ORDER BY d.createdAt DESC
        LIMIT ? OFFSET ?
      `,
      args: [session.user.id, status === '' ? '' : status, status, limit.toString(), offset.toString()],
    });

    const demands = result.rows.map(async (row) => {
      const viewCount = Number(row.viewCount || 0);
      const proposalCount = Number(row.proposalCount || 0);
      const conversionRate = viewCount > 0
        ? Math.round((proposalCount / viewCount) * 10000) / 100
        : 0;

      return {
        id: row.id,
        title: row.title,
        description: (String(row.description || '')).substring(0, 100) + '...',
        serviceTypes: JSON.parse(String(row.serviceTypes || '[]')),
        city: row.city,
        status: row.status,
        visibilityPackage: row.visibilityPackage,
        visibilityExpiresAt: row.visibilityExpiresAt,
        createdAt: row.createdAt,
        closedAt: row.closedAt,
        metrics: {
          viewCount,
          proposalCount,
          conversionRate,
          visibilitySpent: ((Number(row.visibilitySpent || 0)) / 100).toFixed(2),
        },
      };
    });

    const demandsData = await Promise.all(demands);

    return NextResponse.json({
      demands: demandsData,
      pagination: {
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('[Family Demands API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch demands' },
      { status: 500 }
    );
  }
}
