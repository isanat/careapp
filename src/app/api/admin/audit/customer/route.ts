import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { db } from '@/lib/db-turso';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim();

    if (!email) {
      return NextResponse.json({ error: 'Email obrigatorio' }, { status: 400 });
    }

    // 1. Find user
    const userResult = await db.execute({
      sql: `SELECT id, email, name, role, status, createdAt, phone, nif FROM User WHERE email = ?`,
      args: [email]
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Utilizador nao encontrado' }, { status: 404 });
    }

    const user = userResult.rows[0] as any;
    const userId = user.id as string;

    // 2. Wallet
    const walletResult = await db.execute({
      sql: `SELECT balanceTokens, balanceEurCents, address FROM Wallet WHERE userId = ?`,
      args: [userId]
    });
    const wallet = walletResult.rows[0] as any || { balanceTokens: 0, balanceEurCents: 0 };

    // 3. All Payments grouped by type+status
    const paymentsGrouped = await db.execute({
      sql: `SELECT type, status, COUNT(*) as qty,
              SUM(amountEurCents) as totalAmount,
              SUM(platformFee) as totalFees,
              SUM(tokensAmount) as totalTokens
            FROM Payment WHERE userId = ?
            GROUP BY type, status
            ORDER BY type, status`,
      args: [userId]
    });

    // 4. Summary: total deposits (COMPLETED payments that are cash-in)
    const depositsResult = await db.execute({
      sql: `SELECT
              SUM(CASE WHEN type IN ('ACTIVATION','TOKEN_PURCHASE') AND status = 'COMPLETED' THEN amountEurCents ELSE 0 END) as totalDeposits,
              SUM(CASE WHEN type IN ('ACTIVATION','TOKEN_PURCHASE') AND status = 'COMPLETED' THEN platformFee ELSE 0 END) as depositFees,
              SUM(CASE WHEN type IN ('ACTIVATION','TOKEN_PURCHASE') AND status = 'COMPLETED' THEN tokensAmount ELSE 0 END) as depositTokens,
              SUM(CASE WHEN type = 'REDEMPTION' AND status = 'COMPLETED' THEN amountEurCents ELSE 0 END) as totalWithdrawals,
              SUM(CASE WHEN type = 'REDEMPTION' AND status = 'COMPLETED' THEN platformFee ELSE 0 END) as withdrawalFees,
              SUM(CASE WHEN type = 'CONTRACT_FEE' AND status = 'COMPLETED' THEN amountEurCents ELSE 0 END) as totalContractFees,
              SUM(CASE WHEN type = 'CONTRACT_FEE' AND status = 'COMPLETED' THEN platformFee ELSE 0 END) as contractFeePlatform,
              SUM(CASE WHEN type = 'SERVICE_PAYMENT' AND status = 'COMPLETED' THEN amountEurCents ELSE 0 END) as totalServicePayments,
              SUM(CASE WHEN type = 'SERVICE_PAYMENT' AND status = 'COMPLETED' THEN platformFee ELSE 0 END) as servicePaymentFees,
              SUM(CASE WHEN status = 'COMPLETED' THEN platformFee ELSE 0 END) as totalPlatformFees,
              SUM(CASE WHEN status = 'PENDING' THEN amountEurCents ELSE 0 END) as pendingAmount,
              SUM(CASE WHEN status = 'FAILED' THEN amountEurCents ELSE 0 END) as failedAmount,
              SUM(CASE WHEN status = 'REFUNDED' THEN amountEurCents ELSE 0 END) as refundedAmount,
              COUNT(*) as totalTransactions,
              COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completedTransactions
            FROM Payment WHERE userId = ?`,
      args: [userId]
    });
    const summary = depositsResult.rows[0] as any;

    // 5. All individual payments (last 100)
    const allPayments = await db.execute({
      sql: `SELECT p.id, p.type, p.status, p.provider, p.amountEurCents, p.tokensAmount,
              p.platformFee, p.createdAt, p.paidAt, p.refundedAt, p.description,
              p.contractId, c.title as contractTitle
            FROM Payment p
            LEFT JOIN Contract c ON p.contractId = c.id
            WHERE p.userId = ?
            ORDER BY p.createdAt DESC
            LIMIT 100`,
      args: [userId]
    });

    // 6. TokenLedger - all movements grouped by type+reason
    const ledgerGrouped = await db.execute({
      sql: `SELECT type, reason, COUNT(*) as qty,
              SUM(amountTokens) as totalTokens,
              SUM(amountEurCents) as totalEurCents
            FROM TokenLedger WHERE userId = ?
            GROUP BY type, reason
            ORDER BY type, reason`,
      args: [userId]
    });

    // 7. Contracts where user is involved
    const contracts = await db.execute({
      sql: `SELECT c.id, c.title, c.status, c.hourlyRateEur, c.totalHours, c.totalEurCents,
              c.platformFeePct, c.totalPaidEurCents, c.startDate, c.endDate, c.createdAt,
              c.familyUserId, c.caregiverUserId,
              uf.name as familyName, uf.email as familyEmail,
              uc.name as caregiverName, uc.email as caregiverEmail
            FROM Contract c
            LEFT JOIN User uf ON c.familyUserId = uf.id
            LEFT JOIN User uc ON c.caregiverUserId = uc.id
            WHERE c.familyUserId = ? OR c.caregiverUserId = ?
            ORDER BY c.createdAt DESC`,
      args: [userId, userId]
    });

    // 8. Escrow payments
    const escrows = await db.execute({
      sql: `SELECT e.id, e.contractId, e.totalAmountCents, e.platformFeeCents,
              e.caregiverAmountCents, e.status, e.createdAt, e.releasedAt, e.refundedAt
            FROM EscrowPayment e
            INNER JOIN Contract c ON e.contractId = c.id
            WHERE c.familyUserId = ? OR c.caregiverUserId = ?
            ORDER BY e.createdAt DESC`,
      args: [userId, userId]
    });

    // 9. Tips sent/received
    const tipsSent = await db.execute({
      sql: `SELECT SUM(amountEurCents) as total, COUNT(*) as qty FROM Tip WHERE fromUserId = ?`,
      args: [userId]
    });
    const tipsReceived = await db.execute({
      sql: `SELECT SUM(amountEurCents) as total, COUNT(*) as qty FROM Tip WHERE toUserId = ?`,
      args: [userId]
    });

    // 10. Receipts
    const receipts = await db.execute({
      sql: `SELECT id, receiptNumber, totalAmountCents, platformFeeCents, caregiverAmountCents,
              periodStart, periodEnd, hoursWorked, status, createdAt
            FROM Receipt WHERE familyUserId = ? OR caregiverUserId = ?
            ORDER BY createdAt DESC`,
      args: [userId, userId]
    });

    // 11. Recurring payments
    const recurring = await db.execute({
      sql: `SELECT id, contractId, amountCents, platformFeeCents, caregiverAmountCents,
              status, lastPaymentAt, nextPaymentAt, billingDay
            FROM RecurringPayment WHERE familyUserId = ? OR caregiverUserId = ?
            ORDER BY createdAt DESC`,
      args: [userId, userId]
    });

    // 12. Cross-check calculation
    const totalIn = Number(summary.totalDeposits || 0);
    const totalOut = Number(summary.totalWithdrawals || 0);
    const totalFeesPaid = Number(summary.totalPlatformFees || 0);
    const totalRefunded = Number(summary.refundedAmount || 0);
    const tipsSentTotal = Number((tipsSent.rows[0] as any)?.total || 0);
    const tipsReceivedTotal = Number((tipsReceived.rows[0] as any)?.total || 0);
    const walletBalance = Number(wallet.balanceEurCents || 0);

    const expectedBalance = totalIn - totalOut - totalFeesPaid - totalRefunded - tipsSentTotal + tipsReceivedTotal;
    const difference = expectedBalance - walletBalance;

    // 13. Platform profit from this customer
    const platformProfit = totalFeesPaid;

    // Calculate per-contract platform earnings
    const contractProfits = (contracts.rows as any[]).map(c => {
      const platformCut = Math.round(Number(c.totalEurCents || 0) * Number(c.platformFeePct || 15) / 100);
      return {
        id: c.id,
        title: c.title,
        status: c.status,
        totalValue: Number(c.totalEurCents || 0),
        platformFeePct: Number(c.platformFeePct || 15),
        platformCut,
        otherParty: userId === c.familyUserId
          ? { name: c.caregiverName, email: c.caregiverEmail, role: 'CAREGIVER' }
          : { name: c.familyName, email: c.familyEmail, role: 'FAMILY' },
      };
    });

    return NextResponse.json({
      user: {
        id: userId,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        phone: user.phone,
        nif: user.nif,
        createdAt: user.createdAt,
      },
      wallet: {
        balanceTokens: Number(wallet.balanceTokens || 0),
        balanceEurCents: walletBalance,
      },
      summary: {
        totalDeposits: totalIn,
        depositFees: Number(summary.depositFees || 0),
        depositTokens: Number(summary.depositTokens || 0),
        totalWithdrawals: totalOut,
        withdrawalFees: Number(summary.withdrawalFees || 0),
        totalContractFees: Number(summary.totalContractFees || 0),
        contractFeePlatform: Number(summary.contractFeePlatform || 0),
        totalServicePayments: Number(summary.totalServicePayments || 0),
        servicePaymentFees: Number(summary.servicePaymentFees || 0),
        totalPlatformFees: totalFeesPaid,
        pendingAmount: Number(summary.pendingAmount || 0),
        failedAmount: Number(summary.failedAmount || 0),
        refundedAmount: totalRefunded,
        totalTransactions: Number(summary.totalTransactions || 0),
        completedTransactions: Number(summary.completedTransactions || 0),
      },
      tipsSent: { total: tipsSentTotal, qty: Number((tipsSent.rows[0] as any)?.qty || 0) },
      tipsReceived: { total: tipsReceivedTotal, qty: Number((tipsReceived.rows[0] as any)?.qty || 0) },
      crossCheck: {
        totalIn,
        totalOut,
        totalFees: totalFeesPaid,
        totalRefunded,
        tipsSent: tipsSentTotal,
        tipsReceived: tipsReceivedTotal,
        expectedBalance,
        actualBalance: walletBalance,
        difference,
        isConsistent: Math.abs(difference) < 100, // less than 1 EUR tolerance
      },
      platformProfit: {
        totalFeesCollected: platformProfit,
        contractProfits,
        totalEscrowFees: (escrows.rows as any[]).reduce((sum, e) => sum + Number(e.platformFeeCents || 0), 0),
        totalReceiptFees: (receipts.rows as any[]).reduce((sum, r) => sum + Number(r.platformFeeCents || 0), 0),
      },
      paymentsGrouped: paymentsGrouped.rows,
      ledgerGrouped: ledgerGrouped.rows,
      payments: allPayments.rows,
      contracts: contractProfits,
      escrows: escrows.rows,
      receipts: receipts.rows,
      recurring: recurring.rows,
    });
  } catch (error) {
    console.error('Error in customer audit:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
