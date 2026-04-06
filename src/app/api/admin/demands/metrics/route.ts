import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';
import { getAdminMetrics, getRevenueChartData } from '@/lib/demands/metrics';

/**
 * GET /api/admin/demands/metrics
 * Métricas globais (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin
    const adminResult = await db.execute({
      sql: `SELECT role FROM AdminUser WHERE userId = ? AND isActive = true`,
      args: [session.user.id],
    });

    if (adminResult.rows.length === 0) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const periodDays = parseInt(searchParams.get('period') || '7');

    // Get metrics
    const metrics = await getAdminMetrics(periodDays);

    // Get chart data
    const chartData = await getRevenueChartData(periodDays);

    // Get all demands summary
    const demandsResult = await db.execute({
      sql: `
        SELECT
          status,
          visibilityPackage,
          COUNT(*) as count
        FROM Demand
        GROUP BY status, visibilityPackage
      `,
    });

    const demandsByStatus: Record<string, number> = {};
    const demandsByVisibility: Record<string, number> = {};

    for (const row of demandsResult.rows) {
      const status = String(row.status || 'UNKNOWN');
      const visibility = String(row.visibilityPackage || 'NONE');
      const count = Number(row.count || 0);

      demandsByStatus[status] = (demandsByStatus[status] || 0) + count;
      demandsByVisibility[visibility] = (demandsByVisibility[visibility] || 0) + count;
    }

    return NextResponse.json({
      period: periodDays,
      metrics,
      chartData,
      demandsSummary: {
        byStatus: demandsByStatus,
        byVisibility: demandsByVisibility,
      },
    });
  } catch (error) {
    console.error('[Admin Metrics API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
