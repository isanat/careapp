import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import db from '@/lib/db-turso';

/**
 * GET /api/family/demands/analytics
 * Retorna dados agregados de todas demandas da família
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Total visibility spent
    const visibilityResult = await db.execute({
      sql: `
        SELECT SUM(vp.amountEurCents) as totalSpent
        FROM VisibilityPurchase vp
        JOIN Demand d ON vp.demandId = d.id
        WHERE d.familyUserId = ? AND vp.status = 'COMPLETED'
      `,
      args: [session.user.id],
    });
    const totalVisibilitySpent = (visibilityResult.rows[0]?.totalSpent || 0) / 100;

    // Average proposals per demand
    const avgProposalsResult = await db.execute({
      sql: `
        SELECT AVG(proposal_count) as avgProposals
        FROM (
          SELECT d.id, COUNT(p.id) as proposal_count
          FROM Demand d
          LEFT JOIN Proposal p ON d.id = p.demandId AND p.status != 'REJECTED' AND p.status != 'EXPIRED'
          WHERE d.familyUserId = ?
          GROUP BY d.id
        )
      `,
      args: [session.user.id],
    });
    const avgProposalsPerDemand = Math.round((avgProposalsResult.rows[0]?.avgProposals || 0) * 100) / 100;

    // Average views per demand
    const avgViewsResult = await db.execute({
      sql: `
        SELECT AVG(view_count) as avgViews
        FROM (
          SELECT d.id, COUNT(dv.id) as view_count
          FROM Demand d
          LEFT JOIN DemandView dv ON d.id = dv.demandId
          WHERE d.familyUserId = ?
          GROUP BY d.id
        )
      `,
      args: [session.user.id],
    });
    const avgViewsPerDemand = Math.round((avgViewsResult.rows[0]?.avgViews || 0) * 100) / 100;

    // Total active demands
    const activeDemandResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM Demand WHERE familyUserId = ? AND status = 'ACTIVE'`,
      args: [session.user.id],
    });
    const activeDemands = activeDemandResult.rows[0]?.count || 0;

    // Closed demands (with contract)
    const closedDemandResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM Demand WHERE familyUserId = ? AND status = 'CLOSED'`,
      args: [session.user.id],
    });
    const closedDemands = closedDemandResult.rows[0]?.count || 0;

    return NextResponse.json({
      totalVisibilitySpent: Math.round(totalVisibilitySpent * 100) / 100,
      avgProposalsPerDemand,
      avgViewsPerDemand,
      activeDemands,
      closedDemands,
    });
  } catch (error) {
    console.error('[Family Demands Analytics API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
