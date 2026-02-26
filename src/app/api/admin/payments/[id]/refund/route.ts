import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// POST - Process refund
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminCheck = await db.execute({
      sql: `SELECT role FROM User WHERE id = ?`,
      args: [session.user.id]
    });
    
    if (adminCheck.rows[0]?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { amount, reason, notifyUser = true } = body;

    if (!reason) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }

    // Get payment
    const payment = await db.execute({
      sql: `SELECT p.*, u.name as userName, w.balanceTokens as userTokenBalance, w.id as walletId
            FROM Payment p 
            JOIN User u ON p.userId = u.id
            LEFT JOIN Wallet w ON u.id = w.userId
            WHERE p.id = ? AND p.status = 'COMPLETED' AND p.refundedAt IS NULL`,
      args: [id]
    });

    if (payment.rows.length === 0) {
      return NextResponse.json({ error: 'Payment not found or already refunded' }, { status: 404 });
    }

    const p = payment.rows[0] as any;
    const refundAmountCents = amount || p.amountEurCents;
    const refundTokens = Math.round((refundAmountCents / p.amountEurCents) * p.tokensAmount);

    // TODO: Call Stripe API for refund if provider is STRIPE
    // const stripeRefund = await stripe.refunds.create({
    //   payment_intent: p.stripePaymentIntentId,
    //   amount: refundAmountCents,
    // });

    // Update payment status
    await db.execute({
      sql: `UPDATE Payment SET status = 'REFUNDED', refundedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [id]
    });

    // Deduct tokens from user wallet
    if (refundTokens > 0 && p.walletId) {
      await db.execute({
        sql: `UPDATE Wallet SET balanceTokens = balanceTokens - ? WHERE id = ?`,
        args: [refundTokens, p.walletId]
      });

      // Add ledger entry
      await db.execute({
        sql: `INSERT INTO TokenLedger (id, userId, type, reason, amountTokens, description, referenceType, referenceId, createdAt)
              VALUES (?, ?, 'DEBIT', 'REFUND', ?, 'Tokens deducted due to refund', 'PAYMENT', ?, CURRENT_TIMESTAMP)`,
        args: [`tl_${Date.now()}`, p.userId, -refundTokens, id]
      });
    }

    // Log action
    await db.execute({
      sql: `INSERT INTO AdminAction (adminUserId, action, entityType, entityId, oldValue, newValue, reason, ipAddress, createdAt)
            VALUES (?, 'REFUND', 'PAYMENT', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      args: [
        session.user.id, 
        id,
        JSON.stringify({ status: 'COMPLETED', tokens: p.tokensAmount }),
        JSON.stringify({ status: 'REFUNDED', refundTokens }),
        reason,
        request.headers.get('x-forwarded-for') || 'unknown'
      ]
    });

    // Notify user
    if (notifyUser) {
      await db.execute({
        sql: `INSERT INTO Notification (id, userId, type, title, message, referenceType, referenceId, createdAt)
              VALUES (?, ?, 'PAYMENT', 'Reembolso Processado', ?, 'PAYMENT', ?, CURRENT_TIMESTAMP)`,
        args: [`notif_${Date.now()}`, p.userId, `Seu pagamento de €${(refundAmountCents/100).toFixed(2)} foi reembolsado.`, id]
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Refund processed',
      refund: {
        paymentId: id,
        amountCents: refundAmountCents,
        tokensDeducted: refundTokens
      }
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
