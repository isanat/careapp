import db from '@/lib/db-turso';

/**
 * Calcula métricas de uma demanda específica
 * ViewCount, ProposalCount, ConversionRate, etc
 */
export async function getDemandMetrics(demandId: string) {
  try {
    // ViewCount
    const viewsResult = await db.execute({
      sql: `SELECT COUNT(*) as viewCount FROM DemandView WHERE demandId = ?`,
      args: [demandId],
    });
    const viewCount = viewsResult.rows[0]?.viewCount || 0;

    // ProposalCount
    const proposalsResult = await db.execute({
      sql: `SELECT COUNT(*) as proposalCount FROM Proposal WHERE demandId = ? AND status != 'REJECTED' AND status != 'EXPIRED'`,
      args: [demandId],
    });
    const proposalCount = proposalsResult.rows[0]?.proposalCount || 0;

    // VisibilitySpent
    const visibilityResult = await db.execute({
      sql: `SELECT SUM(amountEurCents) as totalSpent FROM VisibilityPurchase WHERE demandId = ? AND status = 'COMPLETED'`,
      args: [demandId],
    });
    const visibilitySpent = (visibilityResult.rows[0]?.totalSpent || 0) / 100; // convert to euros

    // ConversionRate
    const conversionRate = viewCount > 0 ? (proposalCount / viewCount) * 100 : 0;

    // DaysActive
    const demandResult = await db.execute({
      sql: `SELECT createdAt FROM Demand WHERE id = ?`,
      args: [demandId],
    });
    const createdAt = new Date(demandResult.rows[0]?.createdAt as string);
    const daysActive = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

    return {
      viewCount,
      proposalCount,
      conversionRate: Math.round(conversionRate * 100) / 100,
      visibilitySpent: Math.round(visibilitySpent * 100) / 100,
      daysActive,
    };
  } catch (error) {
    console.error('[Metrics] Error calculating demand metrics:', error);
    return {
      viewCount: 0,
      proposalCount: 0,
      conversionRate: 0,
      visibilitySpent: 0,
      daysActive: 0,
    };
  }
}

/**
 * Calcula métricas globais (para admin)
 * Period em dias (7, 30, 90)
 */
export async function getAdminMetrics(periodDays: number = 7) {
  try {
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();

    // Total Revenue (período)
    const revenueResult = await db.execute({
      sql: `SELECT SUM(amountEurCents) as totalRevenue FROM VisibilityPurchase
            WHERE status = 'COMPLETED' AND completedAt >= ?`,
      args: [startDate],
    });
    const totalRevenue = ((revenueResult.rows[0]?.totalRevenue || 0) / 100).toFixed(2);

    // Demandas ativas (período)
    const demandsResult = await db.execute({
      sql: `SELECT COUNT(*) as totalDemands FROM Demand
            WHERE createdAt >= ? AND status = 'ACTIVE'`,
      args: [startDate],
    });
    const totalDemandsCreated = demandsResult.rows[0]?.totalDemands || 0;

    // Avg Conversion Rate (todas demandas)
    const conversionRatesResult = await db.execute({
      sql: `
        SELECT
          d.id,
          (SELECT COUNT(*) FROM DemandView WHERE demandId = d.id) as views,
          (SELECT COUNT(*) FROM Proposal WHERE demandId = d.id AND status != 'REJECTED' AND status != 'EXPIRED') as proposals
        FROM Demand d
        WHERE d.createdAt >= ? AND d.status = 'ACTIVE'
      `,
      args: [startDate],
    });

    let totalConversionRate = 0;
    let conversionRateCount = 0;
    for (const row of conversionRatesResult.rows) {
      const views = row.views || 0;
      if (views > 0) {
        totalConversionRate += (row.proposals || 0) / views;
        conversionRateCount++;
      }
    }
    const avgConversionRate = conversionRateCount > 0 ? (totalConversionRate / conversionRateCount * 100).toFixed(2) : '0.00';

    // Avg Time to First Proposal
    const timeToProposalResult = await db.execute({
      sql: `
        SELECT AVG(CAST((julianday(p.createdAt) - julianday(d.createdAt)) AS INTEGER)) as avgDays
        FROM Proposal p
        JOIN Demand d ON p.demandId = d.id
        WHERE d.createdAt >= ? AND p.status = 'PENDING'
      `,
      args: [startDate],
    });
    const avgTimeToProposal = Math.round(timeToProposalResult.rows[0]?.avgDays || 0);

    // Avg Ticket (receita / número de boosts)
    const ticketResult = await db.execute({
      sql: `
        SELECT
          SUM(amountEurCents) as totalAmount,
          COUNT(*) as purchaseCount
        FROM VisibilityPurchase
        WHERE status = 'COMPLETED' AND completedAt >= ?
      `,
      args: [startDate],
    });
    const avgTicket = ticketResult.rows[0]?.purchaseCount > 0
      ? ((ticketResult.rows[0]?.totalAmount || 0) / ticketResult.rows[0]?.purchaseCount / 100).toFixed(2)
      : '0.00';

    return {
      periodDays,
      totalRevenue: parseFloat(totalRevenue),
      totalDemandsCreated,
      avgConversionRate: parseFloat(avgConversionRate),
      avgTimeToFirstProposal: avgTimeToProposal,
      avgTicket: parseFloat(avgTicket),
    };
  } catch (error) {
    console.error('[Metrics] Error calculating admin metrics:', error);
    return {
      periodDays,
      totalRevenue: 0,
      totalDemandsCreated: 0,
      avgConversionRate: 0,
      avgTimeToFirstProposal: 0,
      avgTicket: 0,
    };
  }
}

/**
 * Retorna dados para gráfico de revenue
 * Últimos N dias
 */
export async function getRevenueChartData(days: number = 7) {
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const result = await db.execute({
      sql: `
        SELECT
          DATE(completedAt) as date,
          SUM(amountEurCents) as dailyRevenue
        FROM VisibilityPurchase
        WHERE status = 'COMPLETED' AND completedAt >= ?
        GROUP BY DATE(completedAt)
        ORDER BY date ASC
      `,
      args: [startDate],
    });

    return result.rows.map(row => ({
      date: row.date,
      revenue: ((row.dailyRevenue || 0) / 100).toFixed(2),
    }));
  } catch (error) {
    console.error('[Metrics] Error calculating revenue chart:', error);
    return [];
  }
}
