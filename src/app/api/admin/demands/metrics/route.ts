import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

/**
 * GET /api/admin/demands/metrics
 * Admin Analytics - KPIs for demands and visibility boosts
 * Query params:
 *   - period: 'today' | 'week' | 'month' (default: 'week')
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'week';

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'week':
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
    }

    const startDateStr = startDate.toISOString();
    const endDateStr = now.toISOString();

    // Get all metrics in parallel
    const [demandsResult, visibilityResult, proposalsResult, viewsResult, revenueByPackageResult] =
      await Promise.all([
        // Total demands created in period
        db.execute({
          sql: `
            SELECT
              COUNT(*) as total,
              COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active,
              COUNT(CASE WHEN status = 'CLOSED' THEN 1 END) as closed,
              COUNT(CASE WHEN status = 'PAUSED' THEN 1 END) as paused
            FROM Demand
            WHERE createdAt >= ? AND createdAt <= ?
          `,
          args: [startDateStr, endDateStr],
        }),

        // Visibility purchases (revenue)
        db.execute({
          sql: `
            SELECT
              COUNT(*) as totalPurchases,
              COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completedPurchases,
              COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pendingPurchases,
              SUM(CASE WHEN status = 'COMPLETED' THEN amountEurCents ELSE 0 END) as totalRevenueCents,
              AVG(CASE WHEN status = 'COMPLETED' THEN amountEurCents ELSE NULL END) as avgTicketCents
            FROM VisibilityPurchase
            WHERE purchasedAt >= ? AND purchasedAt <= ?
          `,
          args: [startDateStr, endDateStr],
        }),

        // Proposals data
        db.execute({
          sql: `
            SELECT
              COUNT(*) as totalProposals,
              COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pendingProposals,
              COUNT(CASE WHEN status = 'ACCEPTED' THEN 1 END) as acceptedProposals,
              COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejectedProposals
            FROM Proposal
            WHERE createdAt >= ? AND createdAt <= ?
          `,
          args: [startDateStr, endDateStr],
        }),

        // View counts
        db.execute({
          sql: `
            SELECT COUNT(*) as totalViews
            FROM DemandView
            WHERE viewedAt >= ? AND viewedAt <= ?
          `,
          args: [startDateStr, endDateStr],
        }),

        // Revenue breakdown by visibility package
        db.execute({
          sql: `
            SELECT
              package,
              COUNT(*) as count,
              SUM(CASE WHEN status = 'COMPLETED' THEN amountEurCents ELSE 0 END) as revenueCents
            FROM VisibilityPurchase
            WHERE purchasedAt >= ? AND purchasedAt <= ? AND status = 'COMPLETED'
            GROUP BY package
          `,
          args: [startDateStr, endDateStr],
        }),
      ]);

    // Extract results
    const demandsRow = demandsResult.rows[0];
    const visibilityRow = visibilityResult.rows[0];
    const proposalsRow = proposalsResult.rows[0];
    const viewsRow = viewsResult.rows[0];
    const packageRows = revenueByPackageResult.rows;

    // Calculate derived metrics
    const totalRevenueCents = Number(visibilityRow.totalRevenueCents || 0);
    const totalViews = Number(viewsRow.totalViews || 0);
    const totalDemands = Number(demandsRow.total || 0);
    const totalProposals = Number(proposalsRow.totalProposals || 0);

    const avgConversionRate =
      totalDemands > 0 && totalViews > 0
        ? ((totalProposals / totalViews) * 100).toFixed(1)
        : '0';

    const conversionToBoost =
      totalDemands > 0
        ? ((Number(visibilityRow.totalPurchases || 0) / totalDemands) * 100).toFixed(1)
        : '0';

    // Package breakdown
    const packageBreakdown = packageRows.map((row: any) => ({
      package: row.package || 'NONE',
      count: Number(row.count || 0),
      revenueCents: Number(row.revenueCents || 0),
      revenueEur: Number(row.revenueCents || 0) / 100,
    }));

    // Daily revenue data for chart
    type DailyRevenue = {
      date: string;
      revenueCents: number;
      revenueEur: string;
    };
    let dailyRevenueData: DailyRevenue[] = [];
    if (period === 'week') {
      const dailyResult = await db.execute({
        sql: `
          SELECT
            DATE(purchasedAt) as date,
            SUM(CASE WHEN status = 'COMPLETED' THEN amountEurCents ELSE 0 END) as revenueCents
          FROM VisibilityPurchase
          WHERE purchasedAt >= ? AND purchasedAt <= ?
          GROUP BY DATE(purchasedAt)
          ORDER BY date ASC
        `,
        args: [startDateStr, endDateStr],
      });

      dailyRevenueData = dailyResult.rows.map((row: any) => ({
        date: row.date,
        revenueCents: Number(row.revenueCents || 0),
        revenueEur: (Number(row.revenueCents || 0) / 100).toFixed(2),
      }));
    }

    return NextResponse.json({
      period,
      dateRange: { start: startDateStr, end: endDateStr },
      kpis: {
        totalDemandsCreated: totalDemands,
        activeDemands: Number(demandsRow.active || 0),
        closedDemands: Number(demandsRow.closed || 0),
        pausedDemands: Number(demandsRow.paused || 0),
        totalRevenueEur: (totalRevenueCents / 100).toFixed(2),
        totalRevenueCents,
        completedPurchases: Number(visibilityRow.completedPurchases || 0),
        pendingPurchases: Number(visibilityRow.pendingPurchases || 0),
        avgTicketEur: visibilityRow.avgTicketCents
          ? (Number(visibilityRow.avgTicketCents) / 100).toFixed(2)
          : '0',
        totalViews,
        totalProposals,
        acceptedProposals: Number(proposalsRow.acceptedProposals || 0),
        conversionRatePercentage: avgConversionRate,
        boostConversionPercentage: conversionToBoost,
        avgViewsPerDemand: totalDemands > 0 ? (totalViews / totalDemands).toFixed(1) : '0',
        avgProposalsPerDemand: totalDemands > 0 ? (totalProposals / totalDemands).toFixed(1) : '0',
      },
      packageBreakdown,
      dailyRevenueData,
      health: {
        hasData: totalDemands > 0 || totalRevenueCents > 0,
        activeSystem: Number(demandsRow.active || 0) > 0,
        revenueGenerated: totalRevenueCents > 0,
      },
    });
  } catch (error) {
    console.error('[Admin Demands Metrics API] GET error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to fetch metrics',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
